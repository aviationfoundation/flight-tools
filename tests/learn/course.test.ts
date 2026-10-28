import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LESSONS, checkCount, normaliseAnswer, type Block } from '../../src/lib/learn/course.ts';
import { decodeNotam, notamTimeToDate, SUBJECT_CODES, CONDITION_CODES, WORDS } from '../../src/lib/notam.ts';

const blocks = LESSONS.flatMap((lesson) => lesson.blocks.map((block) => ({ lesson: lesson.id, block })));
const of = <K extends Block['kind']>(kind: K) => blocks.filter((b) => b.block.kind === kind).map((b) => ({ lesson: b.lesson, block: b.block as Extract<Block, { kind: K }> }));

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

function lessonRaws(): Array<{ lesson: string; raw: string }> {
  const out: Array<{ lesson: string; raw: string }> = [];
  for (const { lesson, block } of blocks) {
    if (block.kind === 'notam' || block.kind === 'pick') out.push({ lesson, raw: block.raw });
    if (block.kind === 'triage') for (const item of block.items) out.push({ lesson, raw: item.raw });
  }
  return out;
}

test('lesson ids are unique and fit the accounts API', () => {
  const ids = LESSONS.map((l) => l.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.length <= 40);
  for (const id of ids) assert.match(id, /^[a-z0-9][a-z0-9-]{0,47}$/);
});

test('check ids are unique across the course', () => {
  const ids = blocks.flatMap(({ block }) => ('id' in block ? [block.id] : []));
  assert.equal(new Set(ids).size, ids.length);
});

test('every lesson has at least one check', () => {
  for (const lesson of LESSONS) assert.ok(checkCount(lesson) > 0, lesson.id);
});

test('annotations appear in the NOTAM in the order given', () => {
  for (const { lesson, block } of of('notam')) {
    if (!block.marks) continue;
    assert.ok(sequential(block.raw, block.marks.map((m) => m.text)), `${lesson}: ${block.marks.map((m) => m.text).join(' | ')}`);
  }
});

test('pick choices appear in order and the answer is one of them', () => {
  for (const { lesson, block } of of('pick')) {
    assert.ok(sequential(block.raw, block.choices), `${lesson}/${block.id}`);
    assert.ok(block.choices.includes(block.answer), `${lesson}/${block.id}`);
    assert.equal(new Set(block.choices).size, block.choices.length);
  }
});

test('every choice question has exactly one right answer and explains every option', () => {
  for (const { lesson, block } of of('choice')) {
    assert.equal(block.options.filter((o) => o.correct).length, 1, `${lesson}/${block.id}`);
    for (const option of block.options) assert.ok(option.why.length > 20, `${lesson}/${block.id}: ${option.text}`);
  }
});

test('typed answers normalise to something', () => {
  for (const { block } of of('answer')) {
    for (const accept of block.accept) assert.ok(normaliseAnswer(accept).length > 0);
  }
  assert.equal(normaliseAnswer(' 03:30 Z '), '0330');
  assert.equal(normaliseAnswer('0330UTC'), '0330');
});

test('every full NOTAM in the course decodes cleanly, except the deliberate contradiction', () => {
  for (const { lesson, raw } of lessonRaws()) {
    if (!/^(?:[A-Z]\d{4}\/\d{2} NOTAM|!)/.test(raw)) continue;
    const d = decodeNotam(raw);
    const codes = d.issues.map((i) => i.code);
    if (raw.includes('A9114/26')) assert.deepEqual(codes, ['text-contradiction']);
    else assert.deepEqual(codes, [], `${lesson}: ${raw.split('\n')[0]}`);
  }
});

test('the Q-code table matches the decoder', () => {
  const table = of('table').find((t) => t.block.head[0] === 'Code')!.block;
  for (const [code, subject, condition] of table.rows) {
    const [subjectCode, subjectText] = subject.split(': ');
    const [conditionCode, conditionText] = condition.split(': ');
    assert.equal(code, `Q${subjectCode}${conditionCode}`);
    assert.match(SUBJECT_CODES[subjectCode], new RegExp(subjectText.split(' ')[0], 'i'), code);
    if (conditionCode !== 'XX') assert.match(CONDITION_CODES[conditionCode], new RegExp(conditionText.split(' ')[0], 'i'), code);
  }
});

test('the contraction table matches the decoder', () => {
  const table = of('table').find((t) => t.block.head[0] === 'Contraction')!.block;
  for (const [contractions, meaning] of table.rows) {
    const names = contractions.split(', ');
    const meanings = meaning.split(', ');
    names.forEach((name, i) => {
      const expected = (meanings[i] ?? meaning).toLowerCase();
      if (name === 'U/S') return;
      assert.equal(WORDS[name], expected, name);
    });
  }
});

test('the time questions agree with the decoder and the calendar', () => {
  const b = decodeNotam('A0001/26 NOTAMN\nQ) CZVR/QMRLC/IV/NBO/A/000/999/4911N12311W005\nA) CYVR B) 2611051930 C) 2611060000\nE) RWY 08L/26R CLSD.');
  assert.deepEqual(b.effectiveFrom, { year: 2026, month: 11, day: 5, hour: 19, minute: 30 });

  const departLocal = Date.UTC(2026, 9, 29, 20, 30) + 7 * 3600_000;
  assert.equal(new Date(departLocal).toISOString(), '2026-10-30T03:30:00.000Z');

  const sundayEvening = new Date(Date.UTC(2026, 9, 25, 19, 0) + 7 * 3600_000);
  assert.equal(new Date(Date.UTC(2026, 9, 25)).getUTCDay(), 0);
  assert.equal(sundayEvening.getUTCDay(), 1);
  assert.equal(sundayEvening.getUTCHours(), 2);
});

function activeAt(raw: string, iso: string): boolean {
  const d = decodeNotam(raw);
  const at = new Date(iso).getTime();
  if (d.effectiveFrom && at < notamTimeToDate(d.effectiveFrom).getTime()) return false;
  if (d.effectiveTo && at > notamTimeToDate(d.effectiveTo).getTime()) return false;
  const schedule = d.fields.find((f) => f.code === 'D')?.raw;
  if (!schedule) return true;
  const window = /DAILY (\d{2})(\d{2})-(\d{2})(\d{2})/.exec(schedule);
  assert.ok(window, schedule);
  const minutes = new Date(iso).getUTCHours() * 60 + new Date(iso).getUTCMinutes();
  return minutes >= Number(window[1]) * 60 + Number(window[2]) && minutes < Number(window[3]) * 60 + Number(window[4]);
}

test('the schedule answers agree with the dates', () => {
  const runway = of('notam').find((n) => n.lesson === 'schedule')!.block.raw;
  assert.equal(activeAt(runway, '2026-10-31T15:00:00Z'), false);
  assert.equal(activeAt(runway, '2026-11-08T05:00:00Z'), false);
  assert.equal(activeAt(runway, '2026-10-31T05:00:00Z'), true);
});

test('the briefing drill times agree with each answer', () => {
  const triage = of('triage')[0].block;
  const find = (id: string) => triage.items.find((i) => i.raw.startsWith(id))!.raw;
  assert.equal(activeAt(find('A2201/26'), '2026-10-29T15:50:00Z'), true);
  assert.equal(activeAt(find('A2202/26'), '2026-10-29T16:00:00Z'), false);
  assert.equal(activeAt(find('A2208/26'), '2026-10-29T16:00:00Z'), true);
  assert.equal(activeAt(find('A2204/26'), '2026-10-29T16:40:00Z'), true);
  assert.equal(activeAt(find('A2205/26'), '2026-10-29T16:40:00Z'), true);
  assert.equal(activeAt(find('A2207/26'), '2026-10-29T16:20:00Z'), true);
  assert.equal(decodeNotam(find('A2203/26')).qLine?.traffic, 'I');
  assert.equal(decodeNotam(find('A2208/26')).replaces, 'A2202/26');
  assert.equal(decodeNotam(find('A2207/26')).fields.find((f) => f.code === 'A')?.raw, 'CZVR');
  assert.equal(triage.items.filter((i) => i.affects).length, 5);
});

test('course copy avoids em dashes and doubled spaces', () => {
  for (const lesson of LESSONS) {
    for (const text of allText(lesson)) {
      assert.ok(!text.includes('—'), `${lesson.id}: ${text.slice(0, 60)}`);
      assert.ok(!/ {2}/.test(text), `${lesson.id}: ${text.slice(0, 60)}`);
    }
  }
});
