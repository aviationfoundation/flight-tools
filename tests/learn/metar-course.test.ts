import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normaliseAnswer } from '../../src/lib/learn/answer.ts';
import { checkCount, type Block } from '../../src/lib/learn/types.ts';
import { COURSES, courseById, courseBySlug } from '../../src/lib/learn/courses.ts';
import {
  METAR_LESSONS,
  VANCOUVER,
  SEATTLE_FOG,
  CHICAGO_STORM,
  LONDON,
  PARIS,
  VICTORIA,
  ABBOTSFORD,
  NANAIMO,
  VICTORIA_TAF,
  ABBOTSFORD_TAF,
  NANAIMO_TAF,
} from '../../src/lib/learn/metar-course.ts';
import { decodeMetar, decodeTaf, type Conditions, type DecodedTaf, type ReportTime, type TafPeriod } from '../../src/lib/metar.ts';
import { ceilingFt, densityAltitudeFt, flightCategory, pressureAltitudeFt, windComponents } from '../../src/lib/metar-compute.ts';

const blocks = METAR_LESSONS.flatMap((lesson) => lesson.blocks.map((block) => ({ lesson: lesson.id, block })));
const of = <K extends Block['kind']>(kind: K) => blocks.filter((b) => b.block.kind === kind).map((b) => ({ lesson: b.lesson, block: b.block as Extract<Block, { kind: K }> }));
const check = <K extends Block['kind']>(kind: K, id: string) => {
  const found = of(kind).find((b) => 'id' in b.block && b.block.id === id);
  assert.ok(found, id);
  return found!.block;
};
const rightOption = (id: string) => check('choice', id).options.find((o) => o.correct)!.text;

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

const isTaf = (raw: string) => /^TAF\b/.test(raw);

function reports(): Array<{ lesson: string; raw: string }> {
  const out: Array<{ lesson: string; raw: string }> = [];
  for (const { lesson, block } of blocks) {
    if (block.kind === 'report' || block.kind === 'pick') out.push({ lesson, raw: block.raw });
    if ((block.kind === 'choice' || block.kind === 'answer') && block.raw) out.push({ lesson, raw: block.raw });
    if (block.kind === 'triage') for (const item of block.items) out.push({ lesson, raw: item.raw });
  }
  return out;
}

// Minutes since the start of the month, so day and hour compare in one number.
const at = (t: ReportTime) => (t.day * 24 + t.hour) * 60 + t.minute;
const utc = (day: number, hour: number, minute = 0) => at({ day, hour, minute });

// Every period of a TAF that covers the moment, by the rule the course teaches: the opening
// line or last FM group, then any BECMG that has started, then any TEMPO or PROB over it.
function periodsAt(taf: DecodedTaf, moment: number): TafPeriod[] {
  return taf.periods.filter((p) => p.from && p.to && at(p.from) <= moment && moment < at(p.to));
}

function conditionsAt(taf: DecodedTaf, moment: number): { base: Conditions; possible: TafPeriod[] } {
  const base = [...taf.periods].reverse().find((p) => (p.kind === 'INITIAL' || p.kind === 'FM') && p.from && at(p.from) <= moment)!;
  const merged: Conditions = { ...base };
  for (const p of taf.periods) {
    if (p.kind !== 'BECMG' || !p.to || !base.from || at(p.from!) < at(base.from) || at(p.to) > moment) continue;
    if (p.wind) merged.wind = p.wind;
    if (p.visibility) merged.visibility = p.visibility;
    if (p.weather.length) merged.weather = p.weather;
    if (p.clouds.length) merged.clouds = p.clouds;
  }
  const possible = periodsAt(taf, moment).filter((p) => p.kind === 'TEMPO' || p.kind === 'PROB');
  return { base: merged, possible };
}

test('the METAR course is registered with an id the accounts API accepts', () => {
  assert.equal(courseById('metar')?.slug, 'metar-taf');
  assert.equal(courseBySlug('metar-taf')?.lessons, METAR_LESSONS);
  assert.equal(new Set(COURSES.map((c) => c.id)).size, COURSES.length);
  assert.equal(new Set(COURSES.map((c) => c.slug)).size, COURSES.length);
  for (const course of COURSES) assert.match(course.id, /^[a-z0-9][a-z0-9-]{0,47}$/);
});

test('the NOTAM course keeps its id and stays first, for old links and saved scores', () => {
  assert.equal(COURSES[0].id, 'notam');
  assert.equal(COURSES[0].slug, 'notams');
  const lessonIds = new Set(COURSES[0].lessons.map((l) => l.id));
  for (const course of COURSES) assert.equal(lessonIds.has(course.slug), false, course.slug);
});

test('the course description counts its lessons and minutes correctly', () => {
  const course = courseById('metar')!;
  assert.equal(METAR_LESSONS.length, 9);
  assert.match(course.description, /^Nine short lessons/);
  assert.match(course.lead, /nine-lesson/);
  const minutes = METAR_LESSONS.reduce((sum, l) => sum + l.minutes, 0);
  assert.ok(minutes < 60 && minutes > 45, String(minutes));
});

test('lesson and check ids are unique and fit the accounts API', () => {
  const ids = METAR_LESSONS.map((l) => l.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.length <= 40);
  for (const id of ids) assert.match(id, /^[a-z0-9][a-z0-9-]{0,47}$/);
  const checks = blocks.flatMap(({ block }) => ('id' in block ? [block.id] : []));
  assert.equal(new Set(checks).size, checks.length);
  for (const lesson of METAR_LESSONS) assert.ok(checkCount(lesson) > 0, lesson.id);
});

test('annotations and pick choices appear in their report in order', () => {
  for (const { lesson, block } of of('report')) {
    if (block.marks) assert.ok(sequential(block.raw, block.marks.map((m) => m.text)), `${lesson}: ${block.marks.map((m) => m.text).join(' | ')}`);
  }
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
  for (const { block } of of('answer')) {
    for (const accept of block.accept) assert.ok(normaliseAnswer(accept).length > 0);
  }
});

test('the right answer is not usually the longest option', () => {
  const choices = of('choice').map(({ block }) => block).filter((b) => b.options.length > 2);
  const longest = choices.filter((b) => {
    const right = b.options.find((o) => o.correct)!.text.length;
    return b.options.every((o) => o.correct || o.text.length < right);
  });
  assert.ok(longest.length <= Math.floor(choices.length / 3), `${longest.length} of ${choices.length}: ${longest.map((b) => b.id).join(', ')}`);
});

test('every report in the course decodes without warnings', () => {
  for (const { lesson, raw } of reports()) {
    const decoded = isTaf(raw) ? decodeTaf(raw) : decodeMetar(raw);
    assert.deepEqual(decoded.warnings, [], `${lesson}: ${raw.split('\n')[0]}`);
    assert.ok(decoded.station, `${lesson}: ${raw.split('\n')[0]}`);
    if (!isTaf(raw)) {
      const metar = decodeMetar(raw);
      assert.equal(metar.tokens.filter((t) => t.kind === 'unknown').length, 0, `${lesson}: ${raw}`);
      if (metar.temperatureC != null && metar.dewpointC != null) assert.ok(metar.dewpointC <= metar.temperatureC, raw);
    }
  }
});

test('lesson 1 reads the Vancouver report the way the decoder does', () => {
  const d = decodeMetar(VANCOUVER);
  assert.equal(d.station, 'CYVR');
  assert.deepEqual(d.time, { day: 5, hour: 18, minute: 0 });
  assert.equal(d.wind?.directionDeg, 270);
  assert.equal(d.wind?.speedKt, 12);
  assert.equal(d.wind?.gustKt, 22);
  assert.equal(d.visibility?.statuteMiles, 15);
  assert.equal(d.weather[0].raw, '-SHRA');
  assert.deepEqual(d.clouds.map((c) => c.baseFt), [2000, 4500, 8000]);
  assert.equal(d.temperatureC, 11);
  assert.equal(d.dewpointC, 7);
  assert.ok(check('answer', 'parts-dewpoint').accept.map(normaliseAnswer).includes(normaliseAnswer(String(d.dewpointC))));
  assert.equal(d.altimeterInHg, 29.87);
  assert.equal(d.seaLevelPressureHpa, 1011.5);
  // The altimeter setting and the sea-level pressure should describe the same air.
  assert.ok(Math.abs(d.altimeterInHg! * 33.8639 - d.seaLevelPressureHpa!) < 1.5);
  assert.equal(decodeMetar(VANCOUVER.replace('METAR', 'SPECI')).type, 'SPECI');
});

test('the Canadian cloud remarks add up to each reported layer', () => {
  const oktas = { FEW: [1, 2], SCT: [3, 4], BKN: [5, 7], OVC: [8, 8] } as const;
  for (const raw of [VANCOUVER, VICTORIA, ABBOTSFORD, NANAIMO]) {
    const d = decodeMetar(raw);
    const remark = /RMK ((?:[A-Z]{2}\d)+)/.exec(raw)![1];
    const parts = [...remark.matchAll(/[A-Z]{2}(\d)/g)].map((m) => Number(m[1]));
    assert.equal(parts.length, d.clouds.length, raw);
    let sum = 0;
    d.clouds.forEach((layer, i) => {
      sum += parts[i];
      const [low, high] = oktas[layer.cover as keyof typeof oktas];
      assert.ok(sum >= low && sum <= high, `${raw}: ${layer.raw} sums to ${sum}`);
    });
  }
});

test('the wind lesson agrees with the decoder and the crosswind formula', () => {
  const gust = decodeMetar(VANCOUVER).wind!;
  assert.equal(rightOption('wind-gust'), `${gust.gustKt} knots`);

  const cross = windComponents({ ...gust, directionDeg: 280, speedKt: 20, gustKt: null, variable: false }, 250)!;
  assert.equal(Math.round(cross.crosswindKt), 10);
  assert.ok(check('answer', 'wind-crosswind').accept.map(normaliseAnswer).includes('10'));

  // Vancouver's magnetic variation is about 15 degrees east: magnetic = true - 15.
  const magnetic = gust.directionDeg! - 15;
  assert.ok(Math.abs(magnetic - 260) < 10, String(magnetic));
  assert.match(rightOption('wind-true'), /Runway 26/);

  const vrb = decodeMetar('METAR CYVR 051800Z VRB03KT 15SM FEW040 11/07 A2987').wind!;
  assert.equal(vrb.variable, true);
  assert.equal(vrb.speedKt, 3);
  const swing = decodeMetar('METAR CYYC 051800Z 33018G28KT 290V360 15SM FEW050 10/02 A2992').wind!;
  assert.deepEqual([swing.varyFrom, swing.varyTo, swing.gustKt], [290, 360, 28]);
  const calm = decodeMetar('METAR CYVR 051800Z 00000KT 15SM FEW040 11/07 A2987').wind!;
  assert.equal(calm.calm, true);
  const mps = decodeMetar('METAR UUEE 051800Z 24008MPS 9999 FEW040 08/02 Q1012').wind!;
  assert.equal(mps.unit, 'MPS');
  assert.equal(Math.round(mps.speedKt!), 16);
});

test('the visibility lesson agrees with the decoder', () => {
  const seattle = decodeMetar(SEATTLE_FOG);
  assert.equal(seattle.visibility?.statuteMiles, 0.5);
  assert.equal(seattle.rvr[0].runway, '16L');
  assert.deepEqual([seattle.rvr[0].min, seattle.rvr[0].max, seattle.rvr[0].unit], [2200, 3000, 'FT']);
  assert.equal(check('pick', 'visibility-rvr').answer, seattle.rvr[0].raw);
  assert.equal(flightCategory(seattle), 'LIFR');

  const london = decodeMetar(LONDON);
  assert.equal(london.visibility?.meters, 10000);
  assert.equal(london.altimeterHpa, 1012);
  const paris = decodeMetar(PARIS);
  assert.equal(paris.cavok, true);
  assert.equal(paris.clouds.length, 0);

  const less = decodeMetar('METAR CYXX 052014Z 00000KT M1/4SM FG VV001 06/06 A3012').visibility!;
  assert.equal(less.lessThan, true);
  assert.equal(less.statuteMiles, 0.25);
  assert.equal(decodeMetar('METAR CYXX 052014Z 00000KT 1 1/2SM BR OVC010 06/05 A3012').visibility?.statuteMiles, 1.5);
  assert.ok(Math.abs(decodeMetar('METAR EDDF 051820Z 07004KT 0800 FG VV002 03/03 Q1028').visibility!.meters! - 800) < 1);
});

test('the weather table matches the decoder', () => {
  const table = of('table').find((t) => t.lesson === 'weather')!.block;
  for (const [code, meaning] of table.rows) {
    if (code.includes(',') || code === 'VC') continue;
    const sample = ['SH', 'TS', 'FZ', 'BL'].includes(code) ? `${code}${code === 'BL' ? 'SN' : code === 'FZ' ? 'RA' : 'RA'}` : code;
    const text = decodeMetar(`METAR CYVR 051800Z 00000KT 3SM ${sample} OVC010 01/00 A2992`).weather[0]?.text.toLowerCase() ?? '';
    assert.ok(text.includes(meaning.toLowerCase().replace(/s$/, '').split(' ')[0]), `${code}: ${text}`);
  }
  const storm = decodeMetar(CHICAGO_STORM);
  assert.equal(storm.weather[0].descriptor, 'TS');
  assert.equal(storm.weather[0].intensity, '+');
  assert.equal(storm.clouds.find((c) => c.type === 'CB')?.raw, 'BKN030CB');
  assert.equal(check('pick', 'weather-storm').answer, storm.weather[0].raw);
  const fzdz = decodeMetar('METAR CYYT 051800Z 09012KT 2SM -FZDZ OVC004 M01/M02 A2992').weather[0];
  assert.deepEqual([fzdz.intensity, fzdz.descriptor, fzdz.precipitation], ['-', 'FZ', ['DZ']]);
  assert.equal(decodeMetar('METAR CYVR 051800Z 27012KT 15SM VCSH FEW040 11/07 A2987').weather[0].intensity, 'VC');
});

test('the cloud lesson ceilings and categories agree with the decoder', () => {
  const clouds = (group: string) => decodeMetar(`METAR CYVR 051800Z 27012KT 15SM ${group} 11/07 A2987`);
  assert.equal(ceilingFt(clouds('FEW008 SCT015 BKN040').clouds), 4000);
  assert.equal(ceilingFt(clouds('SCT006 BKN012 OVC025').clouds), 1200);
  assert.ok(check('answer', 'clouds-ceiling').accept.map(normaliseAnswer).includes('1200'));
  assert.equal(ceilingFt(clouds('VV002').clouds), 200);

  const victoria = decodeMetar(VICTORIA);
  assert.equal(ceilingFt(victoria.clouds), 2500);
  assert.equal(flightCategory(victoria), 'MVFR');
  assert.match(rightOption('clouds-category'), /^MVFR/);

  const base = 1200 + (clouds('BKN035').clouds[0].baseFt ?? 0);
  assert.equal(base, 4700);
  assert.match(rightOption('clouds-msl'), /4,700/);

  const table = of('table').find((t) => t.lesson === 'clouds' && t.block.head[0] === 'Category')!.block;
  assert.deepEqual(table.rows.map((r) => r[0]), ['VFR', 'MVFR', 'IFR', 'LIFR']);
  assert.equal(flightCategory(clouds('BKN031')), 'VFR');
  assert.equal(flightCategory(clouds('BKN030')), 'MVFR');
  assert.equal(flightCategory(clouds('BKN009')), 'IFR');
  assert.equal(flightCategory(clouds('BKN004')), 'LIFR');
});

test('the temperature and pressure answers agree with the decoder', () => {
  const minus = decodeMetar('METAR CYXX 051800Z 00000KT 15SM FEW040 M04/M06 A3012');
  assert.deepEqual([minus.temperatureC, minus.dewpointC], [-4, -6]);
  assert.equal(minus.altimeterInHg, 30.12);
  assert.ok(check('answer', 'temperature-altimeter').accept.map(normaliseAnswer).includes(normaliseAnswer('30.12')));

  const slp = (code: string) => decodeMetar(`METAR KSEA 051853Z 18006KT 10SM FEW040 09/05 A2992 RMK AO2 ${code}`).seaLevelPressureHpa;
  assert.equal(slp('SLP982'), 998.2);
  assert.equal(slp('SLP115'), 1011.5);
  assert.match(rightOption('temperature-slp'), /^998\.2/);

  const seattle = decodeMetar(SEATTLE_FOG);
  assert.equal(seattle.remarkItems.find((r) => r.code === 'T00890089')?.plain, 'Temperature 8.9°C, dew point 8.9°C');
  assert.equal(seattle.remarkItems.find((r) => r.code === 'AO2')?.label, 'Station type');

  const da = densityAltitudeFt(pressureAltitudeFt(3600, 29.92), 30)!;
  assert.ok(Math.abs(da - 6200) < 100, String(da));
  assert.match(rightOption('temperature-density'), /6,200/);
});

test('the TAF lessons read the Victoria TAF the way the decoder does', () => {
  const taf = decodeTaf(VICTORIA_TAF);
  assert.equal(taf.station, 'CYYJ');
  assert.deepEqual(taf.issued, { day: 5, hour: 17, minute: 40 });
  assert.deepEqual(taf.validFrom, { day: 5, hour: 18, minute: 0 });
  assert.deepEqual(taf.validTo, { day: 6, hour: 18, minute: 0 });
  assert.ok(check('answer', 'taf-issued').accept.includes('1740'));
  assert.deepEqual(taf.periods.map((p) => p.kind), ['INITIAL', 'TEMPO', 'FM', 'BECMG', 'PROB', 'FM']);
  assert.equal(taf.periods[4].probability, 30);
  assert.equal(ceilingFt(taf.periods[0].clouds), 3000);

  const at2000 = conditionsAt(taf, utc(5, 20));
  assert.equal(ceilingFt(at2000.base.clouds), 3000);
  assert.deepEqual(at2000.possible.map((p) => p.kind), ['TEMPO']);
  assert.equal(ceilingFt(at2000.possible[0].clouds), 2000);

  const at0400 = conditionsAt(taf, utc(6, 4));
  assert.equal(at0400.base.wind?.variable, true);
  assert.equal(ceilingFt(at0400.base.clouds), 4000);
  assert.equal(at0400.possible.length, 0);

  const at1100 = conditionsAt(taf, utc(6, 11));
  assert.equal(at1100.base.visibility?.statuteMiles, 2);
  assert.equal(ceilingFt(at1100.base.clouds), 600);
  assert.equal(at1100.base.wind?.variable, true, 'BECMG keeps the wind it does not mention');
  assert.equal(flightCategory(at1100.base), 'IFR');
  assert.deepEqual(at1100.possible.map((p) => [p.kind, p.probability]), [['PROB', 30]]);
  assert.equal(flightCategory(at1100.possible[0]), 'LIFR');

  const clearing = taf.periods[5];
  assert.deepEqual(clearing.from, { day: 6, hour: 15, minute: 0 });
  assert.ok(check('answer', 'changes-clearing').accept.includes('1500'));
  assert.equal(flightCategory(clearing), 'VFR');
});

// The briefing drill's minimums: ceiling at least 3,000 ft, visibility at least 5 miles,
// wind no more than 20 knots including gusts, no thunderstorms.
function outside(c: Conditions): boolean {
  const ceiling = ceilingFt(c.clouds);
  if (ceiling != null && ceiling < 3000) return true;
  const vis = c.visibility?.statuteMiles;
  if (vis != null && vis < 5) return true;
  const wind = Math.max(c.wind?.speedKt ?? 0, c.wind?.gustKt ?? 0);
  if (wind > 20) return true;
  return c.weather.some((w) => w.descriptor === 'TS') || c.clouds.some((l) => l.type === 'CB');
}

function tafOutside(raw: string, from: number, to: number): boolean {
  const taf = decodeTaf(raw);
  for (let moment = from; moment <= to; moment += 5) {
    const { base, possible } = conditionsAt(taf, moment);
    if (outside(base) || possible.some(outside)) return true;
  }
  return false;
}

test('the briefing drill answers follow from the minimums and the flight times', () => {
  const triage = of('triage')[0].block;
  const item = (raw: string) => triage.items.find((i) => i.raw === raw)!;
  assert.equal(triage.items.length, 6);

  // Depart Abbotsford 18:15, arrive Victoria about 18:55, alternate Nanaimo from about 19:00,
  // leave Victoria at 23:00 and land back at Abbotsford about 23:40.
  assert.equal(item(ABBOTSFORD).affects, outside(decodeMetar(ABBOTSFORD)));
  assert.equal(item(ABBOTSFORD).affects, false);
  assert.equal(item(ABBOTSFORD_TAF).affects, tafOutside(ABBOTSFORD_TAF, utc(5, 18, 0), utc(5, 18, 30)) || tafOutside(ABBOTSFORD_TAF, utc(5, 23, 30), utc(5, 23, 50)));
  assert.equal(tafOutside(ABBOTSFORD_TAF, utc(5, 18, 0), utc(5, 18, 30)), false, 'the departure itself is fine');
  assert.equal(item(ABBOTSFORD_TAF).affects, true);
  assert.equal(item(VICTORIA).affects, outside(decodeMetar(VICTORIA)));
  assert.equal(item(VICTORIA).affects, true);
  assert.equal(item(VICTORIA_TAF).affects, tafOutside(VICTORIA_TAF, utc(5, 18, 45), utc(5, 19, 5)));
  assert.equal(item(VICTORIA_TAF).affects, true);
  assert.equal(item(NANAIMO).affects, outside(decodeMetar(NANAIMO)));
  assert.equal(item(NANAIMO).affects, false);
  assert.equal(item(NANAIMO_TAF).affects, tafOutside(NANAIMO_TAF, utc(5, 18, 45), utc(6, 5, 55)));
  assert.equal(item(NANAIMO_TAF).affects, false);
  assert.deepEqual(decodeTaf(NANAIMO_TAF).validTo, { day: 6, hour: 6, minute: 0 });

  const changed = triage.items.filter((i) => i.affects).length;
  assert.equal(changed, 3);
  assert.match(triage.debrief!.text, /^Three of these six/);
  assert.match(METAR_LESSONS.find((l) => l.id === 'brief')!.summary, /^Six reports/);
});

test('course copy avoids em dashes and doubled spaces', () => {
  for (const lesson of METAR_LESSONS) {
    for (const text of allText(lesson)) {
      if (/^(?:METAR|SPECI|TAF) /.test(text)) continue;
      assert.ok(!text.includes('—'), `${lesson.id}: ${text.slice(0, 60)}`);
      assert.ok(!/ {2}/.test(text), `${lesson.id}: ${text.slice(0, 60)}`);
    }
  }
  for (const course of COURSES) {
    for (const text of [course.description, course.lead, course.who, course.note]) assert.ok(!text.includes('—') && !/ {2}/.test(text), course.id);
  }
});
