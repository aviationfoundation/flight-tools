import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decodeNotam, decodeNotams, splitNotams, expandContractions } from '../../src/lib/notam.ts';

const Q = 'Q) EGTT/QMRLC/IV/NBO/A/000/999/5128N00027W005';

function icao(e: string, opts: { header?: string; q?: string; a?: string; extra?: string } = {}): string {
  const { header = 'A1234/26 NOTAMN', q = Q, a = 'EGLL', extra = '' } = opts;
  return `${header}\n${q}\nA) ${a}\nB) 2610270600\nC) 2610280600\n${extra}E) ${e}`;
}

function eText(input: string): string {
  const field = decodeNotam(input).fields.find((f) => f.code === 'E');
  assert.ok(field);
  return field.plain;
}

function millis(fn: () => unknown): number {
  fn();
  const start = performance.now();
  fn();
  return performance.now() - start;
}

const twoIcao = `A1234/26 NOTAMN
Q) KZSE/QMRLC/IV/NBO/A/000/999/4727N12218W005
A) KSEA B) 2610270600 C) 2610280600
E) RWY 16L/34R CLSD

A1235/26 NOTAMN
Q) KZSE/QMXLC/IV/NBO/A/000/999/4727N12218W005
A) KSEA B) 2610270600 C) 2610280600
E) TWY A CLSD
F) SFC
G) 500FT AGL`;

test('decodeNotam on a paste of two ICAO NOTAMs does not fold the second into the first', () => {
  const r = decodeNotam(twoIcao);
  assert.match(r.fields.find((f) => f.code === 'E')!.plain, /^Runway 16L\/34R closed\.?$/);
  assert.doesNotMatch(r.plainSummary, /taxiway/i);
  assert.doesNotMatch(r.plainSummary, /A1235/i);
  assert.equal(r.fields.some((f) => f.code === 'F' || f.code === 'G'), false);
  assert.doesNotMatch(r.plainSummary, /500 ft/);
});

test('decodeNotam on a paste of two domestic NOTAMs warns and does not fold the second into the first', () => {
  const r = decodeNotam('!SEA 10/123 SEA RWY 16L/34R CLSD 2610270600-2610280600\n!SEA 10/124 SEA TWY A CLSD 2610270600-2610280600');
  assert.ok(r.issues.some((i) => i.code === 'multiple-notams'));
  assert.doesNotMatch(r.plainSummary, /taxiway/i);
  assert.doesNotMatch(r.plainSummary, /10\/124/);
});

const briefing = `SEATTLE-TACOMA INTL (KSEA)
!SEA 10/123 SEA RWY 16L/34R CLSD 2610270600-2610280600
!SEA 10/124 SEA TWY A CLSD 2610270600-2610280600

BOEING FIELD/KING COUNTY INTL (KBFI)
!BFI 10/005 BFI TWY B CLSD 2610270600-2610280600`;

test('airport heading after the last NOTAM of an airport does not swallow that NOTAM validity', () => {
  const chunks = splitNotams(briefing);
  const second = chunks.find((c) => c.includes('10/124'));
  assert.ok(second);
  assert.doesNotMatch(second, /BOEING/);
  const r = decodeNotam(second);
  assert.deepEqual(r.effectiveTo, { year: 2026, month: 10, day: 28, hour: 6, minute: 0 });
  assert.doesNotMatch(r.plainSummary, /boeing|kbfi/i);
});

test('airport headings in a briefing paste are not returned as NOTAMs', () => {
  const all = decodeNotams(briefing);
  assert.equal(all.length, 3);
  assert.ok(all.every((n) => !n.unstructured));
  assert.ok(all.every((n) => n.effectiveFrom !== null && n.effectiveTo !== null));
});

test('a station line before an ICAO NOTAM is not a NOTAM of its own', () => {
  const text = `CYVR
A1234/26 NOTAMN
Q) CZVR/QMRLC/IV/NBO/A/000/999/4910N12311W005
A) CYVR B) 2610270600 C) 2610280600
E) RWY 08L/26R CLSD
CREATED: 27 OCT 2026 05:00 UTC
SOURCE: NAVCANADA
A1236/26 NOTAMN
Q) CZVR/QMXLC/IV/NBO/A/000/999/4910N12311W005
A) CYVR B) 2610270600 C) 2610280600
E) TWY A CLSD`;
  const all = decodeNotams(text);
  assert.equal(all.length, 2);
  assert.ok(all.every((n) => !n.unstructured));
});

test('domestic NOTAM whose times are not at the end never silently loses its validity', () => {
  const r = decodeNotam('!SEA 10/124 SEA TWY A CLSD 2610270600-2610280600 (PERM)');
  assert.ok(r.effectiveFrom !== null || r.issues.some((i) => i.code === 'field-missing' && i.field === 'B'));
});

test('an exception window in domestic text is not reported as the validity period', () => {
  const r = decodeNotam('!SEA 10/124 SEA RWY 16 CLSD 2610270600-2610280600 EXC 2610270800-2610271000');
  assert.doesNotMatch(r.plainSummary, /from 27 Oct 2026 08:00Z/);
  assert.ok(!(r.effectiveFrom?.hour === 8 && r.effectiveTo?.hour === 10));
});

test('wrapped E) text starting with four letters and RWY does not split the NOTAM', () => {
  const text = icao('TWY A CLSD\nBOTH RWY 09L AND 09R OPEN');
  assert.equal(splitNotams(text).length, 1);
  assert.equal(decodeNotams(text).length, 1);
  assert.equal(decodeNotam(text).issues.some((i) => i.code === 'multiple-notams'), false);
});

test('wrapped E) text starting with a compass word and APRON does not split the NOTAM', () => {
  const text = icao('CLSD AREAS\nNORTH APRON\nEAST APRON');
  assert.equal(splitNotams(text).length, 1);
  assert.equal(decodeNotam(text).issues.some((i) => i.code === 'multiple-notams'), false);
});

test('F) and G) at the start of E) list lines are not taken as altitude limits', () => {
  const r = decodeNotam(icao('CLSD AREAS:\nA) NORTH APRON\nB) SOUTH APRON\nF) FUEL FARM\nG) GATE AREA'));
  assert.equal(r.fields.some((f) => f.code === 'F' || f.code === 'G'), false);
  assert.match(r.fields.find((f) => f.code === 'E')!.plain, /fuel farm/i);
  assert.match(r.fields.find((f) => f.code === 'E')!.plain, /gate area/i);
  assert.doesNotMatch(r.plainSummary, /up to/i);
});

test('F) and G) inside E) prose stay in E)', () => {
  const r = decodeNotam(icao('LIMITS ARE SEE F) 3000FT AGL AND G) 5000FT AGL'));
  assert.equal(r.fields.some((f) => f.code === 'F' || f.code === 'G'), false);
  assert.match(r.fields.find((f) => f.code === 'E')!.plain, /3000 ft/);
});

test('a weekday abbreviation used as a navaid identifier is not turned into a weekday', () => {
  assert.equal(expandContractions('SAT VORTAC U/S'), 'SAT VORTAC unserviceable');
  assert.equal(expandContractions('VOR SUN U/S'), 'VOR SUN unserviceable');
  assert.equal(expandContractions('VORTAC SAT U/S'), 'VORTAC SAT unserviceable');
});

test('a contraction that is also a navaid identifier is not expanded next to a navaid word', () => {
  assert.equal(expandContractions('ACT VORTAC U/S'), 'ACT VORTAC unserviceable');
  assert.equal(expandContractions('INT VORTAC U/S'), 'INT VORTAC unserviceable');
});

test('MINS and MIN without a number mean minimums, not minutes', () => {
  assert.doesNotMatch(expandContractions('LPV MINS NA'), /minutes/i);
  assert.match(expandContractions('LPV MINS NA'), /minimums/i);
  assert.doesNotMatch(expandContractions('RVR MIN 1800'), /minutes/i);
  assert.doesNotMatch(expandContractions('MIN CLIMB GRADIENT 400FT/NM'), /minutes/i);
  assert.equal(expandContractions('30 MIN PN'), '30 minutes prior notice');
});

test('airport codes mentioned in E) but absent from A) keep their case', () => {
  assert.match(eText(icao('ILS RWY 09 U/S. ALTN EGKK AND EGSS NOT AVBL')), /EGKK and EGSS/);
  assert.match(eText(icao('DIVERT TO KSEA OR CYVR')), /KSEA or CYVR/);
});

test('three-letter navaid and airport identifiers keep their case', () => {
  assert.equal(expandContractions('BOS VOR U/S'), 'BOS VOR unserviceable');
  assert.equal(expandContractions('SEATTLE VORTAC (SEA) U/S'), 'Seattle VORTAC (SEA) unserviceable');
});

test('Canadian advisory airspace designators keep their case', () => {
  assert.equal(expandContractions('CYA 123 ACT'), 'CYA 123 active');
  assert.equal(expandContractions('CYD 401 ACT'), 'CYD 401 active');
});

test('short English words after a navaid word are not left upper case', () => {
  assert.equal(expandContractions('ILS OUT OF SERVICE'), 'ILS out of service');
  assert.equal(expandContractions('VOR AND DME U/S'), 'VOR and DME unserviceable');
});

test('cancellation summary does not state the cancelled condition as current', () => {
  const r = decodeNotam(icao('RWY 09L CLSD', { header: 'A1234/26 NOTAMC A1230/26' }).replace('B) 2610270600\nC) 2610280600\n', ''));
  assert.match(r.plainSummary, /^Cancels A1230\/26\./);
  assert.doesNotMatch(r.plainSummary, /At EGLL: Runway 09L closed\./);
});

test('Q-code saying operating is contradicted by E) saying not available', () => {
  const codes = (e: string, q: string) => decodeNotam(icao(e, { q: `Q) EGTT/${q}/IV/NBO/A/000/999/5128N00027W005` })).issues.map((i) => i.code);
  assert.ok(codes('ILS RWY 09 NOT AVBL', 'QICAK').includes('text-contradiction'));
  assert.ok(codes('RWY 09L NOT OPEN', 'QMRAK').includes('text-contradiction'));
  assert.ok(codes('ILS RWY 09 NOT OPERATIONAL', 'QICAO').includes('text-contradiction'));
});

test('performance: many coordinates in E) stay under 50 ms', () => {
  const coords = Array.from({ length: 15000 }, () => '5128N00027W').join(' ');
  const input = icao(coords);
  assert.ok(input.length < 200000);
  const ms = millis(() => decodeNotam(input));
  assert.ok(ms < 50, `took ${ms.toFixed(0)} ms`);
});

test('performance: a short word followed by a long run of spaces stays under 50 ms', () => {
  const input = `AAAA${' '.repeat(30000)}X`;
  const ms = millis(() => splitNotams(input));
  assert.ok(ms < 50, `took ${ms.toFixed(0)} ms`);
  const ms2 = millis(() => decodeNotam(input));
  assert.ok(ms2 < 50, `took ${ms2.toFixed(0)} ms`);
});
