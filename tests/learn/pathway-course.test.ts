import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normaliseAnswer } from '../../src/lib/learn/answer.ts';
import { checkCount, type Block } from '../../src/lib/learn/types.ts';
import { COURSES, RESERVED_SLUGS, courseById, courseBySlug, totalMinutes } from '../../src/lib/learn/courses.ts';
import {
  FEES,
  FEE_SHEET,
  FIXED_FEES,
  GROUND_SCHOOL_HOURS,
  MEDICAL_MONTHS_UNDER_40,
  MINIMUM_AGE,
  MINIMUM_HOURS,
  PATHWAY_LESSONS,
  PLAN_LONGER,
  PLAN_MINIMUM,
  flyingCost,
} from '../../src/lib/learn/pathway-course.ts';
import { CERTIFICATE_CODE, normaliseCertificateCode, printedCode } from '../../src/lib/learn/certificate-code.ts';
import { better, dropPending, keepPending, pendingFor, validScore } from '../../src/lib/learn/pending.ts';

const blocks = PATHWAY_LESSONS.flatMap((lesson) => lesson.blocks.map((block) => ({ lesson: lesson.id, block })));
const of = <K extends Block['kind']>(kind: K) => blocks.filter((b) => b.block.kind === kind).map((b) => ({ lesson: b.lesson, block: b.block as Extract<Block, { kind: K }> }));
const check = <K extends Block['kind']>(kind: K, id: string) => {
  const found = of(kind).find((b) => 'id' in b.block && b.block.id === id);
  assert.ok(found, id);
  return found!.block;
};

function sequential(raw: string, parts: string[]): boolean {
  let cursor = 0;
  for (const part of parts) {
    const at = raw.indexOf(part, cursor);
    if (at < 0) return false;
    cursor = at + part.length;
  }
  return true;
}

function allText(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(allText);
  if (value && typeof value === 'object') return Object.values(value).flatMap(allText);
  return [];
}

const lessonText = (id: string) => allText(PATHWAY_LESSONS.find((l) => l.id === id)).join('\n');
const accepts = (id: string, value: number) => check('answer', id).accept.map(normaliseAnswer).includes(normaliseAnswer(String(value)));

test('the course is registered, open, and listed for people who have not started training', () => {
  const course = courseById('pathway')!;
  assert.equal(course.slug, 'flight-plan');
  assert.equal(courseBySlug('flight-plan')?.lessons, PATHWAY_LESSONS);
  assert.equal(course.open, true);
  assert.equal(course.audience, 'starting');
  assert.equal(COURSES.filter((c) => c.audience === 'starting').length, 1);
  assert.equal(COURSES.filter((c) => c.open).length, 1, 'the courses for pilots still need an account');
});

// The accounts service issues a certificate when these exact lessons are finished
// (avi, src/lib/courses.ts). Change a list here only together with that one.
test('lesson ids match the lists the accounts service issues certificates against', () => {
  const ids = (id: string) => courseById(id)!.lessons.map((l) => l.id);
  assert.deepEqual(ids('notam'), ['parts', 'number', 'q-line', 'when', 'schedule', 'text', 'heights', 'us-format', 'conditions', 'traps', 'brief']);
  assert.deepEqual(ids('metar'), ['parts', 'wind', 'visibility', 'weather', 'clouds', 'temperature-pressure', 'taf', 'taf-changes', 'brief']);
  assert.deepEqual(ids('pathway'), ['routes', 'licences', 'medical', 'cost', 'money', 'choosing', 'timeline', 'plan']);
  assert.equal(COURSES.length, 3, 'a new course needs its lessons listed in the accounts service too');
});

test('no course or lesson takes an address that belongs to the certificate pages', () => {
  assert.deepEqual(RESERVED_SLUGS, ['certificate']);
  for (const course of COURSES) {
    assert.equal(RESERVED_SLUGS.includes(course.slug), false, course.slug);
    for (const lesson of course.lessons) assert.equal(RESERVED_SLUGS.includes(lesson.id), false, `${course.slug}/${lesson.id}`);
    assert.ok(course.subject.length > 10 && !/[.!?]$/.test(course.subject), course.slug);
    assert.ok(course.again.length > 5, course.slug);
  }
});

test('the course description counts its lessons and minutes correctly', () => {
  const course = courseById('pathway')!;
  assert.equal(PATHWAY_LESSONS.length, 8);
  assert.match(course.description, /^Eight short lessons/);
  assert.match(course.lead, /eight-lesson/);
  const minutes = totalMinutes(course);
  assert.ok(minutes >= 40 && minutes <= 50, String(minutes));
  assert.match(course.who, /about 45 minutes/);
});

test('lesson and check ids are unique and fit the accounts API', () => {
  const ids = PATHWAY_LESSONS.map((l) => l.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.match(id, /^[a-z0-9][a-z0-9-]{0,47}$/);
  const checks = blocks.flatMap(({ block }) => ('id' in block ? [block.id] : []));
  assert.equal(new Set(checks).size, checks.length);
  for (const id of checks) assert.match(id, /^[a-z0-9][a-z0-9-]*$/);
  for (const lesson of PATHWAY_LESSONS) {
    assert.ok(checkCount(lesson) >= 3, lesson.id);
    assert.equal(lesson.blocks.at(-1)!.kind, 'links', `${lesson.id} ends with its sources`);
  }
});

test('every choice question has exactly one right answer and explains every option', () => {
  for (const { lesson, block } of of('choice')) {
    assert.equal(block.options.length, 3, `${lesson}/${block.id}`);
    assert.equal(block.options.filter((o) => o.correct).length, 1, `${lesson}/${block.id}`);
    assert.equal(new Set(block.options.map((o) => o.text)).size, 3, `${lesson}/${block.id}`);
    for (const option of block.options) assert.ok(option.why.length > 20, `${lesson}/${block.id}: ${option.text}`);
  }
  for (const { block } of of('answer')) {
    assert.ok(block.accept.length > 0, block.id);
    for (const accept of block.accept) assert.match(normaliseAnswer(accept), /^\d+$/, block.id);
  }
});

test('the right answer is not usually the longest option', () => {
  const choices = of('choice').map(({ block }) => block);
  const longest = choices.filter((b) => {
    const right = b.options.find((o) => o.correct)!.text.length;
    return b.options.every((o) => o.correct || o.text.length < right);
  });
  assert.ok(longest.length <= Math.floor(choices.length / 3), `${longest.length} of ${choices.length}: ${longest.map((b) => b.id).join(', ')}`);
});

test('annotations and pick choices appear in their text in order', () => {
  for (const { lesson, block } of of('report')) {
    assert.ok(block.marks?.length, lesson);
    assert.ok(sequential(block.raw, block.marks!.map((m) => m.text)), `${lesson}: ${block.marks!.map((m) => m.text).join(' | ')}`);
  }
  for (const { lesson, block } of of('pick')) {
    assert.ok(sequential(block.raw, block.choices), `${lesson}/${block.id}`);
    assert.ok(block.choices.includes(block.answer), `${lesson}/${block.id}`);
    assert.equal(new Set(block.choices).size, block.choices.length);
  }
});

test('each drill has something on both sides, and names every item for screen readers', () => {
  const drills = of('triage');
  assert.equal(drills.length, 3);
  for (const { lesson, block } of drills) {
    assert.equal(block.prose, true, lesson);
    assert.ok(block.labels?.title, lesson);
    assert.ok(block.items.some((i) => i.affects) && block.items.some((i) => !i.affects), lesson);
    const share = block.items.filter((i) => i.affects).length / block.items.length;
    assert.ok(share >= 0.3 && share <= 0.7, `${lesson}: ${share}`);
    for (const item of block.items) {
      assert.ok(item.name && item.name.length > 3, `${lesson}: ${item.raw}`);
      assert.ok(item.why.length > 20, `${lesson}: ${item.raw}`);
    }
  }
});

test('every link goes to an official source or to aviation.foundation, over https', () => {
  const allowed = new Set(['tc.canada.ca', 'laws-lois.justice.gc.ca', 'ised-isde.canada.ca', 'www.canada.ca', 'aviation.foundation']);
  const links = of('links').flatMap(({ block }) => block.items);
  assert.ok(links.length >= 20);
  for (const link of links) {
    const url = new URL(link.href);
    assert.equal(url.protocol, 'https:', link.href);
    assert.ok(allowed.has(url.hostname), link.href);
    assert.ok(link.label.length > 10, link.href);
  }
  const hosts = new Set(links.map((l) => new URL(l.href).hostname));
  for (const host of allowed) assert.ok(hosts.has(host), host);
});

// Read from Standard 421 (Transport Canada, page dated 2026-08-20) and the Canadian Aviation
// Regulations, sections 404.04 and 404.10, on 2026-11-10. A failure here means someone changed
// a figure: check the source before changing the expectation.
test('the regulatory figures are the ones in Standard 421 and CAR 404', () => {
  assert.deepEqual({ ...MINIMUM_AGE }, { studentPermit: 14, privateLicence: 17, commercialLicence: 18, airlineLicence: 21 });
  assert.deepEqual({ ...MINIMUM_HOURS }, { privateLicence: 45, commercialLicence: 200, commercialInCommand: 100, airlineLicence: 1500, night: 20 });
  assert.deepEqual({ ...GROUND_SCHOOL_HOURS }, { privateLicence: 40, commercialLicence: 80 });
  assert.deepEqual({ ...MEDICAL_MONTHS_UNDER_40 }, { category1ForPay: 12, category2: 24, category3: 60, category4: 60 });
});

test('the licence table and the route strip show those figures', () => {
  const table = of('table').find(({ lesson, block }) => lesson === 'licences' && block.head[0] === 'Step')!.block;
  const row = (name: string) => table.rows.find((r) => r[0] === name)!;
  assert.deepEqual(row('Student Pilot Permit').slice(1, 4), ['14', 'Category 1, 3 or 4', 'PSTAR, pass mark 90%']);
  assert.deepEqual(row('Private Pilot Licence').slice(1, 4), ['17', 'Category 3', 'PPAER, pass mark 60%']);
  assert.match(row('Private Pilot Licence')[4], /^45 hours, and 40 hours of ground school$/);
  assert.deepEqual(row('Commercial Pilot Licence').slice(1, 4), ['18', 'Category 1', 'CPAER, pass mark 60%']);
  assert.match(row('Commercial Pilot Licence')[4], /^200 hours, 100 of them as pilot-in-command, and 80 hours of ground school$/);
  assert.deepEqual(row('Airline Transport Pilot Licence').slice(1), ['21', 'Category 1', 'SAMRA, SARON and INRAT, 70% each', '1,500 hours']);

  const route = of('route')[0].block;
  assert.deepEqual(route.stops.map((s) => s.code), ['MED', 'SPP', 'PPL', 'CPL', 'RTG', 'ATPL']);
  const note = (code: string) => route.stops.find((s) => s.code === code)!.note;
  assert.match(note('SPP'), /^From age 14\./);
  assert.match(note('PPL'), /^From age 17\./);
  assert.match(note('CPL'), /^From age 18\./);
  assert.match(note('ATPL'), /^From age 21, with 1,500 hours\./);
  assert.equal(PATHWAY_LESSONS[0].blocks.includes(route), true, 'the course page shows the route from lesson 1');

  const medical = of('table').find(({ lesson }) => lesson === 'medical')!.block;
  assert.deepEqual(medical.rows.map((r) => [r[0], r[2]]), [['1', '12 months when flying for pay'], ['2', '24 months'], ['3', '60 months'], ['4', '60 months']]);
});

test('questions about the rules take the figures as their answers', () => {
  assert.ok(accepts('licences-cpl-age', 18));
  assert.ok(accepts('medical-valid', 60));
  assert.ok(accepts('timeline-cpl-year', 2028));
  assert.equal(check('pick', 'licences-no-hours').answer, 'MULTI-ENGINE');
  const right = (id: string) => check('choice', id).options.find((o) => o.correct)!.text;
  assert.equal(right('routes-issuer'), 'Transport Canada');
  assert.equal(right('licences-paid'), 'Commercial Pilot Licence');
  assert.match(right('licences-upgrade'), /Category 3/);
  assert.equal(right('medical-which'), 'Category 1');
  assert.equal(right('timeline-first'), 'The medical');
  assert.equal(right('money-tax'), 'No');
});

test('the fee sheet adds up the way the answers say', () => {
  assert.equal(PLAN_MINIMUM.dual + PLAN_MINIMUM.solo, MINIMUM_HOURS.privateLicence, 'the first plan is the Transport Canada minimum');
  assert.ok(PLAN_MINIMUM.dual >= 17 && PLAN_MINIMUM.solo >= 12, 'and it respects the dual and solo minimums in Standard 421.26');
  assert.equal(flyingCost(PLAN_MINIMUM), 30 * 265 + 15 * 190);
  assert.equal(flyingCost(PLAN_MINIMUM), 10800);
  assert.equal(FIXED_FEES, 1500);
  assert.ok(accepts('cost-flying', 10800));
  assert.ok(accepts('cost-total', 12300));
  assert.equal(flyingCost(PLAN_LONGER), 14400);
  assert.ok(accepts('cost-extra', 3600));
  for (const fee of Object.values(FEES)) assert.ok(FEE_SHEET.includes(`$${fee}`), String(fee));
  assert.match(FEE_SHEET, /\(MADE UP\)/);
  const why = allText([check('answer', 'cost-flying'), check('answer', 'cost-total'), check('answer', 'cost-extra')]).join(' ');
  for (const figure of ['$7,950', '$2,850', '$10,800', '$12,300', '$14,400', '$3,600']) assert.ok(why.includes(figure), figure);
  // Every line of the sheet is the same width up to the price, so it reads as a table.
  const priced = FEE_SHEET.split('\n').slice(2);
  assert.equal(new Set(priced.map((line) => line.search(/\$|not included/))).size, 1);
});

test('every dollar figure sits in a lesson that says its numbers are made up', () => {
  for (const lesson of PATHWAY_LESSONS) {
    const text = lessonText(lesson.id);
    if (!text.includes('$')) continue;
    assert.match(text, /made up|invented/i, lesson.id);
  }
  for (const { lesson, block } of [...of('choice'), ...of('answer')]) {
    if (!block.prompt.includes('$') || lesson === 'cost') continue;
    assert.match(block.prompt, /made up/, `${lesson}/${block.id}`);
  }
});

test('the writing keeps to the house rules', () => {
  for (const lesson of PATHWAY_LESSONS) {
    for (const text of allText(lesson)) {
      assert.equal(/[–—]/.test(text), false, `${lesson.id}: dash in "${text.slice(0, 50)}"`);
      if (FEE_SHEET.includes(text) || text.includes('H   ')) continue;
      assert.equal(/ {2,}/.test(text), false, `${lesson.id}: double space in "${text.slice(0, 50)}"`);
      assert.equal(/\b(licenses?|programme|TODO)\b/.test(text), false, `${lesson.id}: "${text.slice(0, 50)}"`);
    }
    assert.ok(lesson.summary.endsWith('.'), lesson.id);
    assert.ok(lesson.minutes >= 5 && lesson.minutes <= 7, lesson.id);
  }
});

test('certificate codes are recognised however they are typed', () => {
  assert.equal(normaliseCertificateCode('2345-6789-abcd'), '23456789ABCD');
  assert.equal(normaliseCertificateCode(' 2345 6789 ABCD '), '23456789ABCD');
  assert.equal(printedCode('23456789ABCD'), '2345-6789-ABCD');
  assert.equal(normaliseCertificateCode(printedCode('ZZZZYYYYXXXX')), 'ZZZZYYYYXXXX');
  for (const bad of ['', '2345-6789-ABC', '2345-6789-ABCDE', '0345-6789-ABCD', 'I345-6789-ABCD', 'L345-6789-ABCD', 'O345-6789-ABCD', 'U345-6789-ABCD', '1345-6789-ABCD', '../../etc/passwd', '<script>', 'A'.repeat(60)]) {
    assert.equal(normaliseCertificateCode(bad), null, bad);
  }
  assert.match('23456789ABCD', CERTIFICATE_CODE);
});

test('scores kept in the browser survive bad storage and keep the better attempt', () => {
  assert.deepEqual(pendingFor('pathway'), {}, 'no storage at all reads as nothing waiting');
  keepPending('pathway', 'routes', { correct: 2, total: 3 });
  assert.deepEqual(pendingFor('pathway'), {}, 'and writing does nothing');

  const store = new Map<string, string>();
  (globalThis as unknown as { localStorage: unknown }).localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  };
  try {
    keepPending('pathway', 'routes', { correct: 2, total: 3 });
    keepPending('pathway', 'routes', { correct: 1, total: 3 });
    keepPending('pathway', 'cost', { correct: 5, total: 5 });
    keepPending('pathway', '../x', { correct: 1, total: 1 });
    keepPending('pathway', 'money', { correct: 9, total: 8 });
    assert.deepEqual(pendingFor('pathway'), { routes: { correct: 2, total: 3 }, cost: { correct: 5, total: 5 } });
    assert.deepEqual(pendingFor('metar'), {});
    dropPending('pathway', 'routes');
    assert.deepEqual(Object.keys(pendingFor('pathway')), ['cost']);
    dropPending('pathway', 'cost');
    assert.equal(store.size, 0, 'an empty store is removed');
    store.set('af-learn-pending', '{"pathway":{"routes":{"correct":"3","total":3},"cost":{"correct":1,"total":2}},"x":[1]}');
    assert.deepEqual(pendingFor('pathway'), { cost: { correct: 1, total: 2 } }, 'tampered entries are ignored');
    store.set('af-learn-pending', 'not json');
    assert.deepEqual(pendingFor('pathway'), {});
  } finally {
    delete (globalThis as unknown as { localStorage?: unknown }).localStorage;
  }

  assert.deepEqual(better({ correct: 3, total: 4 }, { correct: 2, total: 4 }), { correct: 3, total: 4 });
  assert.deepEqual(better({ correct: 1, total: 4 }, { correct: 2, total: 4 }), { correct: 2, total: 4 });
  assert.equal(validScore({ correct: 0, total: 1 }), true);
  for (const bad of [null, {}, { correct: 2, total: 1 }, { correct: -1, total: 1 }, { correct: 1.5, total: 2 }, { correct: 1, total: 0 }, { correct: 1, total: 501 }]) {
    assert.equal(validScore(bad), false, JSON.stringify(bad));
  }
});
