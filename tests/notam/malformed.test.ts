import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as engine from '../../src/lib/notam.ts';

type Severity = 'error' | 'warning';

interface Issue {
  severity: Severity;
  code: string;
  field: string | null;
  message: string;
}

interface Time {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

interface Field {
  code: string;
  raw: string;
  plain: string;
}

interface Geo {
  lat: number;
  lon: number;
}

interface QInfo {
  raw: string;
  subjectCode: string | null;
  conditionCode: string | null;
  trafficPlain: unknown;
  purposePlain: unknown;
  scopePlain: unknown;
  lowerFl: string | null;
  upperFl: string | null;
  radiusNm: number | null;
  center: Geo | null;
}

interface Decoded {
  raw: string;
  series: string | null;
  number: string | null;
  type: string | null;
  replaces: string | null;
  qLine: QInfo | null;
  fields: Field[];
  effectiveFrom: Time | null;
  effectiveTo: Time | null;
  estimatedEnd: boolean;
  permanent: boolean;
  plainSummary: string;
  unrecognisedTokens: string[];
  unstructured: boolean;
  issues: Issue[];
  textCoordinates: Array<{ raw: string; lat: number; lon: number }>;
}

const decodeNotam = engine.decodeNotam as unknown as (input: unknown) => Decoded;
const parseNotamTime = engine.parseNotamTime as unknown as (token: unknown) => Time | null;
const splitNotams = (engine as Record<string, unknown>).splitNotams as (text: unknown) => string[];
const decodeNotams = (engine as Record<string, unknown>).decodeNotams as (text: unknown) => Decoded[];

const ERROR_CODES = new Set([
  'header-missing',
  'header-malformed',
  'q-malformed',
  'q-geo-out-of-range',
  'time-malformed',
  'time-invalid',
  'time-order',
]);

const KNOWN_CODES = new Set([
  ...ERROR_CODES,
  'ref-missing',
  'ref-unexpected',
  'q-code-unknown',
  'q-geo-malformed',
  'q-limits-inverted',
  'field-missing',
  'cancel-has-end',
  'schedule-invalid',
  'limits-inverted',
  'limits-malformed',
  'text-contradiction',
  'item-duplicated',
  'multiple-notams',
  'q-limits-malformed',
]);

const ISSUE_FIELDS = new Set<string | null>(['header', 'Q', 'A', 'B', 'C', 'D', 'E', 'F', 'G', null]);

const E = (code: string) => `error:${code}`;
const W = (code: string) => `warning:${code}`;

function expectedSeverity(issue: Issue): Severity {
  if (issue.code === 'field-missing') return issue.field === 'A' || issue.field === 'B' || issue.field === 'E' ? 'error' : 'warning';
  return ERROR_CODES.has(issue.code) ? 'error' : 'warning';
}

function assertRealTime(t: Time): void {
  const date = new Date(Date.UTC(t.year, t.month - 1, t.day, t.hour, t.minute));
  assert.deepEqual(
    [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes()],
    [t.year, t.month, t.day, t.hour, t.minute],
    `time ${JSON.stringify(t)} is not a real calendar time`,
  );
}

function assertGeoInRange(g: Geo): void {
  assert.ok(Number.isFinite(g.lat) && Number.isFinite(g.lon), 'coordinate is not finite');
  assert.ok(Math.abs(g.lat) <= 90, `lat ${g.lat} out of range`);
  assert.ok(Math.abs(g.lon) <= 180, `lon ${g.lon} out of range`);
}

function assertInvariants(d: Decoded): void {
  assert.ok(d !== null && typeof d === 'object', 'decodeNotam must return an object');
  assert.ok(Array.isArray(d.issues), 'issues must be an array');
  for (const issue of d.issues) {
    assert.ok(KNOWN_CODES.has(issue.code), `unknown issue code ${issue.code}`);
    assert.ok(ISSUE_FIELDS.has(issue.field), `bad issue field ${String(issue.field)}`);
    assert.ok(typeof issue.message === 'string' && issue.message.length > 0, 'issue needs a message');
    assert.equal(issue.severity, expectedSeverity(issue), `severity of ${issue.code} on ${String(issue.field)}`);
  }
  assert.ok(Array.isArray(d.textCoordinates), 'textCoordinates must be an array');
  for (const c of d.textCoordinates) assertGeoInRange(c);
  for (const t of [d.effectiveFrom, d.effectiveTo]) if (t) assertRealTime(t);
  if (d.qLine) {
    assert.notEqual(d.qLine.center, undefined, 'qLine.center must be set');
    if (d.qLine.center) assertGeoInRange(d.qLine.center);
  }
}

function run(input: unknown): Decoded {
  const started = performance.now();
  let out: Decoded | undefined;
  try {
    out = decodeNotam(input);
  } catch (error) {
    assert.fail(`decodeNotam threw: ${String(error)}`);
  }
  const elapsed = performance.now() - started;
  assert.ok(elapsed < 50, `decodeNotam took ${elapsed.toFixed(1)} ms`);
  assertInvariants(out as Decoded);
  return out as Decoded;
}

function signature(d: Decoded): string[] {
  return [...new Set(d.issues.map((i) => `${i.severity}:${i.code}`))].sort();
}

interface Parts {
  head?: string | null;
  q?: string | null;
  a?: string | null;
  b?: string | null;
  c?: string | null;
  d?: string | null;
  e?: string | null;
  f?: string | null;
  g?: string | null;
}

const Q_OK = 'CZVR/QMRLC/IV/NBO/A/000/999/4911N12311W005';
const VAN: Geo = { lat: 49 + 11 / 60, lon: -(123 + 11 / 60) };

const BASE: Parts = {
  head: 'A1234/26 NOTAMN',
  q: Q_OK,
  a: 'CYVR',
  b: '2610290600',
  c: '2610291200',
  d: null,
  e: 'RWY 08L/26R CLSD DUE WIP.',
  f: null,
  g: null,
};

const CANCEL: Parts = {
  head: 'A1235/26 NOTAMC A1234/26',
  q: 'CZVR/QMRCN/IV/NBO/A/000/999/4911N12311W005',
  b: null,
  c: null,
  e: 'PREVIOUS NOTAM CANCELLED.',
};

function notam(over: Parts = {}, eol = '\n'): string {
  const p = { ...BASE, ...over };
  const lines: string[] = [];
  if (p.head != null) lines.push(p.head);
  if (p.q != null) lines.push(`Q) ${p.q}`);
  const items: Array<[string, string | null | undefined]> = [
    ['A', p.a],
    ['B', p.b],
    ['C', p.c],
    ['D', p.d],
    ['E', p.e],
    ['F', p.f],
    ['G', p.g],
  ];
  for (const [letter, value] of items) if (value != null) lines.push(`${letter}) ${value}`);
  return lines.join(eol);
}

const withGeo = (geo: string) => `CZVR/QMRLC/IV/NBO/A/000/999/${geo}`;
const withCode = (code: string) => `CZVR/${code}/IV/NBO/A/000/999/4911N12311W005`;
const withLimits = (lower: string, upper: string) => `CZVR/QMRLC/IV/NBO/A/${lower}/${upper}/4911N12311W005`;

const fieldOf = (d: Decoded, code: string) => d.fields.find((f) => f.code === code);
const fieldsOf = (d: Decoded, code: string) => d.fields.filter((f) => f.code === code);

function assertCenter(d: Decoded, expected: Geo): void {
  assert.ok(d.qLine, 'qLine missing');
  assert.ok(d.qLine.center, 'center missing');
  assert.ok(Math.abs(d.qLine.center.lat - expected.lat) < 1e-4, `lat ${d.qLine.center.lat} != ${expected.lat}`);
  assert.ok(Math.abs(d.qLine.center.lon - expected.lon) < 1e-4, `lon ${d.qLine.center.lon} != ${expected.lon}`);
}

function assertNoCenter(d: Decoded): void {
  assert.ok(d.qLine, 'qLine missing');
  assert.equal(d.qLine.center, null);
}

function assertTime(t: Time | null, y: number, mo: number, da: number, h: number, mi: number): void {
  assert.deepEqual(t, { year: y, month: mo, day: da, hour: h, minute: mi });
}

interface Case {
  name: string;
  input: unknown;
  codes?: string[];
  has?: string[];
  lacks?: string[];
  oneOf?: string[];
  anyIssue?: boolean;
  check?: (d: Decoded) => void;
}

const HEADER_ANY = [E('header-missing'), E('header-malformed')];
const distinctTokens = (n: number) => {
  const letters = 'BCDFGHJKLMNPQRSTVWXZ';
  return Array.from({ length: n }, (_, i) => {
    let s = '';
    let x = i;
    for (let k = 0; k < 6; k++) {
      s += letters[x % letters.length];
      x = Math.floor(x / letters.length);
    }
    return s;
  }).join(' ');
};

const cases: Case[] = [
  { name: 'empty string', input: '', has: [E('header-missing')] },
  { name: 'whitespace only', input: '   \n\t \r\n  ', has: [E('header-missing')] },
  { name: 'single word', input: 'NOTAM', has: [E('header-missing')] },
  { name: 'bare item marker', input: 'A)', has: [E('header-missing'), E('field-missing')] },
  { name: 'header only', input: 'A1234/26 NOTAMN', has: [E('field-missing'), W('field-missing')], lacks: HEADER_ANY },
  {
    name: 'lowercase NOTAM decodes like uppercase',
    input: notam().toLowerCase(),
    codes: [],
    check: (d) => {
      assert.equal(d.series, 'A');
      assert.equal(d.number, '1234/26');
      assertCenter(d, VAN);
      assertTime(d.effectiveFrom, 2026, 10, 29, 6, 0);
    },
  },
  {
    name: 'CRLF line endings',
    input: notam({}, '\r\n'),
    codes: [],
    check: (d) => {
      assertCenter(d, VAN);
      assert.deepEqual(d.fields.map((f) => f.code), ['A', 'B', 'C', 'E']);
      for (const f of d.fields) assert.ok(!/[\r\n]/.test(f.raw), `field ${f.code} keeps a line break`);
      assert.equal(d.qLine?.radiusNm, 5);
    },
  },
  {
    name: 'CR-only line endings',
    input: notam({}, '\r'),
    codes: [],
    check: (d) => {
      assertCenter(d, VAN);
      assert.deepEqual(d.fields.map((f) => f.code), ['A', 'B', 'C', 'E']);
    },
  },
  {
    name: 'tabs after item markers, in header and in Q',
    input: 'A1234/26\tNOTAMN\nQ)\t' + Q_OK + '\nA)\tCYVR\nB)\t2610290600\nC)\t2610291200\nE)\tRWY 08L/26R\tCLSD DUE WIP.',
    codes: [],
    check: (d) => {
      assertCenter(d, VAN);
      assert.equal(fieldOf(d, 'E')?.raw, 'RWY 08L/26R CLSD DUE WIP.');
    },
  },
  {
    name: 'all items on one line',
    input: `A1234/26 NOTAMN Q) ${Q_OK} A) CYVR B) 2610290600 C) 2610291200 E) RWY 08L/26R CLSD DUE WIP.`,
    codes: [],
    check: (d) => {
      assertCenter(d, VAN);
      assert.equal(d.qLine?.upperFl, '999');
      assert.equal(fieldOf(d, 'A')?.raw, 'CYVR');
      assert.equal(fieldOf(d, 'E')?.raw, 'RWY 08L/26R CLSD DUE WIP.');
    },
  },
  {
    name: 'Q on its own line, A to E on one line',
    input: `A1234/26 NOTAMN\nQ) ${Q_OK}\nA) CYVR B) 2610290600 C) 2610291200 E) RWY 08L/26R CLSD DUE WIP.`,
    codes: [],
    check: (d) => {
      assertCenter(d, VAN);
      assertTime(d.effectiveTo, 2026, 10, 29, 12, 0);
    },
  },
  {
    name: 'E text containing "B) AND C)"',
    input: notam({ e: 'RWY 08L/26R CLSD. B) AND C) FIELDS FOLLOW.' }),
    codes: [],
    check: (d) => {
      assert.equal(fieldOf(d, 'E')?.raw, 'RWY 08L/26R CLSD. B) AND C) FIELDS FOLLOW.');
      assert.equal(fieldsOf(d, 'B').length, 1);
      assert.equal(fieldsOf(d, 'C').length, 1);
      assertTime(d.effectiveFrom, 2026, 10, 29, 6, 0);
    },
  },
  {
    name: 'E text containing "SEE ITEM D)" with D absent',
    input: notam({ e: 'RWY 08L/26R CLSD. SEE ITEM D) FOR HOURS.' }),
    codes: [],
    check: (d) => {
      assert.equal(fieldOf(d, 'E')?.raw, 'RWY 08L/26R CLSD. SEE ITEM D) FOR HOURS.');
      assert.equal(fieldOf(d, 'D'), undefined);
    },
  },
  {
    name: 'E text containing "SEE ITEM D)" with D present',
    input: notam({ d: 'DAILY 0200-0600', e: 'RWY 08L/26R CLSD. SEE ITEM D) FOR HOURS.' }),
    codes: [],
    check: (d) => {
      assert.equal(fieldOf(d, 'D')?.raw, 'DAILY 0200-0600');
      assert.equal(fieldOf(d, 'E')?.raw, 'RWY 08L/26R CLSD. SEE ITEM D) FOR HOURS.');
    },
  },
  {
    name: 'E text ending in a bare "G)"',
    input: notam({ e: 'TWY B CLSD BTN POINT A) AND POINT G)' }),
    codes: [],
    check: (d) => {
      assert.equal(fieldOf(d, 'E')?.raw, 'TWY B CLSD BTN POINT A) AND POINT G)');
      assert.equal(fieldOf(d, 'G'), undefined);
      assert.equal(fieldOf(d, 'A')?.raw, 'CYVR');
    },
  },
  {
    name: 'E text containing "Q)"',
    input: notam({ e: 'RWY 08L/26R CLSD. SEE Q) ABOVE.' }),
    codes: [],
    check: (d) => {
      assertCenter(d, VAN);
      assert.ok(!d.qLine?.raw.includes('ABOVE'));
      assert.equal(fieldOf(d, 'E')?.raw, 'RWY 08L/26R CLSD. SEE Q) ABOVE.');
    },
  },
  {
    name: 'E wrapped over several lines',
    input: notam({ e: 'RWY 08L/26R CLSD DUE WIP.\nTAXIING ACFT SHALL FOLLOW ATC INSTRUCTIONS.\n   EXPECT DELAYS.' }),
    codes: [],
    check: (d) => {
      assert.equal(fieldOf(d, 'E')?.raw, 'RWY 08L/26R CLSD DUE WIP. TAXIING ACFT SHALL FOLLOW ATC INSTRUCTIONS. EXPECT DELAYS.');
    },
  },
  {
    name: 'items out of order, each at line start',
    input: [
      'A1234/26 NOTAMN',
      `Q) ${Q_OK}`,
      'E) RWY 08L/26R CLSD DUE WIP.',
      'C) 2610291200',
      'A) CYVR',
      'B) 2610290600',
    ].join('\n'),
    codes: [],
    check: (d) => {
      assertTime(d.effectiveFrom, 2026, 10, 29, 6, 0);
      assertTime(d.effectiveTo, 2026, 10, 29, 12, 0);
      assert.equal(fieldOf(d, 'E')?.raw, 'RWY 08L/26R CLSD DUE WIP.');
    },
  },
  {
    name: 'parenthesised ICAO format',
    input: '(' + notam() + ')',
    codes: [],
    check: (d) => {
      assert.equal(d.series, 'A');
      assert.equal(d.number, '1234/26');
      assert.equal(d.type, 'NOTAMN');
      assert.equal(fieldOf(d, 'E')?.raw, 'RWY 08L/26R CLSD DUE WIP.');
    },
  },
  {
    name: 'BOM, NBSP after item markers and blank lines around',
    input: '﻿\n\n' + notam().replace(/\) /g, ') ') + '\n\n   \n',
    codes: [],
    check: (d) => {
      assert.equal(d.series, 'A');
      assertCenter(d, VAN);
    },
  },
  {
    name: 'duplicated A)',
    input: notam({ a: 'CYVR' }).replace('B) ', 'A) CYYJ\nB) '),
    anyIssue: true,
  },
  {
    name: 'duplicated B) with different values',
    input: notam().replace('C) ', 'B) 2610300600\nC) '),
    anyIssue: true,
  },
  {
    name: 'duplicated C) with different values',
    input: notam().replace('E) ', 'C) 2610301200\nE) '),
    anyIssue: true,
  },
  {
    name: 'duplicated E)',
    input: notam() + '\nE) RWY 08L/26R OPEN.',
    anyIssue: true,
  },
  {
    name: 'duplicated Q) lines',
    input: notam().replace('A) ', `Q) ${withGeo('5000N12000W010')}\nA) `),
    anyIssue: true,
  },
  {
    name: 'two NOTAMs passed to decodeNotam as one string',
    input: notam() + '\n\n' + notam({ head: 'A1235/26 NOTAMN', a: 'CYYJ' }),
    anyIssue: true,
  },
  {
    name: 'missing Q line',
    input: notam({ q: null }),
    has: [E('q-malformed')],
    check: (d) => assert.equal(d.qLine, null),
  },
  {
    name: 'empty Q line',
    input: notam({ q: '' }),
    has: [E('q-malformed')],
    check: (d) => assert.equal(d.qLine?.center ?? null, null),
  },
  { name: 'Q with 5 parts', input: notam({ q: 'CZVR/QMRLC/IV/NBO/A' }), has: [E('q-malformed')], check: (d) => assertNoCenter(d) },
  { name: 'Q with 6 parts', input: notam({ q: 'CZVR/QMRLC/IV/NBO/A/000' }), has: [E('q-malformed')], check: (d) => assertNoCenter(d) },
  { name: 'Q with 7 parts', input: notam({ q: 'CZVR/QMRLC/IV/NBO/A/000/999' }), has: [E('q-malformed')], check: (d) => assertNoCenter(d) },
  {
    name: 'Q with 9 parts keeps the first eight in place',
    input: notam({ q: Q_OK + '/EXTRA' }),
    check: (d) => {
      assert.equal(d.qLine?.lowerFl, '000');
      assert.equal(d.qLine?.upperFl, '999');
      assert.equal(d.qLine?.radiusNm, 5);
      assertCenter(d, VAN);
    },
  },
  {
    name: 'Q with a trailing slash does not shift fields',
    input: notam({ q: Q_OK + '/' }),
    check: (d) => {
      assert.equal(d.qLine?.upperFl, '999');
      assertCenter(d, VAN);
    },
  },
  {
    name: 'Q slashes replaced by fullwidth solidus',
    input: notam({ q: Q_OK.replaceAll('/', '／') }),
    has: [E('q-malformed')],
    check: (d) => assertNoCenter(d),
  },
  {
    name: 'Q with 50000 slashes',
    input: notam({ q: '/'.repeat(50000) }),
    check: (d) => assertNoCenter(d),
  },
  { name: 'Q code with 4 letters', input: notam({ q: withCode('QMRL') }), codes: [W('q-code-unknown')] },
  { name: 'Q code with unknown condition only', input: notam({ q: withCode('QMRZZ') }), codes: [W('q-code-unknown')] },
  { name: 'Q code with unknown subject only', input: notam({ q: withCode('QZZLC') }), codes: [W('q-code-unknown')] },
  {
    name: 'Q traffic, purpose and scope that are Object.prototype keys',
    input: notam({ q: 'CZVR/QMRLC/constructor/__proto__/toString/000/999/4911N12311W005' }),
    check: (d) => {
      assert.equal(d.qLine?.trafficPlain ?? null, null);
      assert.equal(d.qLine?.purposePlain ?? null, null);
      assert.equal(d.qLine?.scopePlain ?? null, null);
      assert.doesNotThrow(() => JSON.stringify(d));
    },
  },
  {
    name: 'Q upper limit not numeric',
    input: notam({ q: withLimits('000', 'ABC') }),
    anyIssue: true,
  },
  { name: 'Q lower equal to upper is not inverted', input: notam({ q: withLimits('000', '000') }), codes: [] },
  { name: 'Q lower 999 upper 000', input: notam({ q: withLimits('999', '000') }), codes: [W('q-limits-inverted')] },
  { name: 'Q lower 100 upper 050', input: notam({ q: withLimits('100', '050') }), codes: [W('q-limits-inverted')] },
  {
    name: 'Q lat 91',
    input: notam({ q: withGeo('9100N12311W005') }),
    codes: [E('q-geo-out-of-range')],
    check: (d) => assertNoCenter(d),
  },
  {
    name: 'Q lat 90 deg 01 min',
    input: notam({ q: withGeo('9001N12311W005') }),
    codes: [E('q-geo-out-of-range')],
    check: (d) => assertNoCenter(d),
  },
  {
    name: 'Q lat exactly 90 deg 00 min is valid',
    input: notam({ q: withGeo('9000N12311W005') }),
    codes: [],
    check: (d) => assertCenter(d, { lat: 90, lon: VAN.lon }),
  },
  {
    name: 'Q lat minutes 60',
    input: notam({ q: withGeo('4960N12311W005') }),
    codes: [E('q-geo-out-of-range')],
    check: (d) => assertNoCenter(d),
  },
  {
    name: 'Q lon minutes 60',
    input: notam({ q: withGeo('4911N12360W005') }),
    codes: [E('q-geo-out-of-range')],
    check: (d) => assertNoCenter(d),
  },
  {
    name: 'Q lon 181',
    input: notam({ q: withGeo('4911N18100W005') }),
    codes: [E('q-geo-out-of-range')],
    check: (d) => assertNoCenter(d),
  },
  {
    name: 'Q lon 180 deg 01 min east',
    input: notam({ q: withGeo('4911N18001E005') }),
    codes: [E('q-geo-out-of-range')],
    check: (d) => assertNoCenter(d),
  },
  {
    name: 'Q lon exactly 180 deg 00 min east is valid',
    input: notam({ q: withGeo('4911N18000E005') }),
    codes: [],
    check: (d) => assertCenter(d, { lat: VAN.lat, lon: 180 }),
  },
  {
    name: 'Q southern and eastern hemispheres',
    input: notam({ q: withGeo('3351S15112E005') }),
    codes: [],
    check: (d) => assertCenter(d, { lat: -(33 + 51 / 60), lon: 151 + 12 / 60 }),
  },
  {
    name: 'Q radius 000',
    input: notam({ q: withGeo('4911N12311W000') }),
    codes: [],
    check: (d) => {
      assert.equal(d.qLine?.radiusNm, 0);
      assertCenter(d, VAN);
    },
  },
  {
    name: 'Q geo without radius',
    input: notam({ q: withGeo('4911N12311W') }),
    codes: [W('q-geo-malformed')],
    check: (d) => assertNoCenter(d),
  },
  {
    name: 'Q geo with 2-digit radius',
    input: notam({ q: withGeo('4911N12311W05') }),
    codes: [W('q-geo-malformed')],
    check: (d) => assertNoCenter(d),
  },
  {
    name: 'Q geo with letters in radius',
    input: notam({ q: withGeo('4911N12311W00A') }),
    codes: [W('q-geo-malformed')],
    check: (d) => assertNoCenter(d),
  },
  {
    name: 'Q geo with bad hemisphere letters',
    input: notam({ q: withGeo('4911X12311Y005') }),
    codes: [W('q-geo-malformed')],
    check: (d) => assertNoCenter(d),
  },
  {
    name: 'Q geo with internal spaces',
    input: notam({ q: withGeo('4911N 12311W 005') }),
    codes: [W('q-geo-malformed')],
    check: (d) => assertNoCenter(d),
  },
  {
    name: 'Q geo empty after trailing slash',
    input: notam({ q: 'CZVR/QMRLC/IV/NBO/A/000/999/' }),
    codes: [W('q-geo-malformed')],
    check: (d) => assertNoCenter(d),
  },
  {
    name: 'Q geo degrees only',
    input: notam({ q: withGeo('49N123W005') }),
    codes: [W('q-geo-malformed')],
    check: (d) => assertNoCenter(d),
  },
  {
    name: 'B on 2602290000 (2026 is not a leap year)',
    input: notam({ b: '2602290000', c: '2603010000' }),
    codes: [E('time-invalid')],
    check: (d) => assert.equal(d.effectiveFrom, null),
  },
  {
    name: 'B on 2802290000 (2028 is a leap year)',
    input: notam({ b: '2802290000', c: '2803010000' }),
    codes: [],
    check: (d) => assertTime(d.effectiveFrom, 2028, 2, 29, 0, 0),
  },
  {
    name: 'B on 0002290000 (2000 is a leap year)',
    input: notam({ b: '0002290000', c: '0003010000' }),
    codes: [],
    check: (d) => assertTime(d.effectiveFrom, 2000, 2, 29, 0, 0),
  },
  {
    name: 'C on 2602290000 with valid B',
    input: notam({ b: '2602280000', c: '2602290000' }),
    codes: [E('time-invalid')],
    check: (d) => {
      assertTime(d.effectiveFrom, 2026, 2, 28, 0, 0);
      assert.equal(d.effectiveTo, null);
    },
  },
  {
    name: 'B on 30 February',
    input: notam({ b: '2602300000', c: '2603010000' }),
    codes: [E('time-invalid')],
    check: (d) => assert.equal(d.effectiveFrom, null),
  },
  {
    name: 'B on 31 April',
    input: notam({ b: '2604310000', c: '2605020000' }),
    codes: [E('time-invalid')],
    check: (d) => assert.equal(d.effectiveFrom, null),
  },
  {
    name: 'B in month 13',
    input: notam({ b: '2613010000', c: '2613020000' }),
    codes: [E('time-invalid')],
  },
  {
    name: 'B in month 00',
    input: notam({ b: '2600150000' }),
    codes: [E('time-invalid')],
    check: (d) => assert.equal(d.effectiveFrom, null),
  },
  {
    name: 'B on day 00',
    input: notam({ b: '2610000000' }),
    codes: [E('time-invalid')],
    check: (d) => assert.equal(d.effectiveFrom, null),
  },
  {
    name: 'B on day 32',
    input: notam({ b: '2610320000', c: '2611010000' }),
    codes: [E('time-invalid')],
    check: (d) => assert.equal(d.effectiveFrom, null),
  },
  {
    name: 'B with minute 60',
    input: notam({ b: '2610290660', c: '2610291200' }),
    codes: [E('time-invalid')],
    check: (d) => assert.equal(d.effectiveFrom, null),
  },
  {
    name: 'C at hour 2400',
    input: notam({ c: '2610292400' }),
    codes: [E('time-invalid')],
    check: (d) => {
      assertTime(d.effectiveFrom, 2026, 10, 29, 6, 0);
      assert.equal(d.effectiveTo, null);
    },
  },
  {
    name: 'B at hour 2400',
    input: notam({ b: '2610292400', c: '2610300600' }),
    codes: [E('time-invalid')],
    check: (d) => assert.equal(d.effectiveFrom, null),
  },
  {
    name: 'B and C both invalid report both fields',
    input: notam({ b: '2610322500', c: '2610332600' }),
    codes: [E('time-invalid')],
    check: (d) => {
      const fields = d.issues.filter((i) => i.code === 'time-invalid').map((i) => i.field).sort();
      assert.deepEqual(fields, ['B', 'C']);
      assert.equal(d.effectiveFrom, null);
      assert.equal(d.effectiveTo, null);
      assert.ok(!/32 Oct|33 Oct|25:00|26:00/.test(d.plainSummary), 'summary prints impossible date');
    },
  },
  { name: 'C equal to B', input: notam({ b: '2610290600', c: '2610290600' }), codes: [E('time-order')] },
  { name: 'C one minute before B', input: notam({ b: '2610290600', c: '2610290559' }), codes: [E('time-order')] },
  { name: 'C one minute after B', input: notam({ b: '2610290600', c: '2610290601' }), codes: [] },
  { name: 'C a year before B', input: notam({ b: '2610290600', c: '2510290600' }), codes: [E('time-order')] },
  {
    name: 'B and C in 2099',
    input: notam({ b: '9912312358', c: '9912312359' }),
    codes: [],
    check: (d) => assertTime(d.effectiveTo, 2099, 12, 31, 23, 59),
  },
  { name: 'C is "PERM EST"', input: notam({ c: 'PERM EST' }), has: [E('time-malformed')] },
  { name: 'C is "UFN"', input: notam({ c: 'UFN' }), has: [E('time-malformed')], check: (d) => assert.equal(d.effectiveTo, null) },
  {
    name: 'C is "PERM"',
    input: notam({ c: 'PERM' }),
    codes: [],
    check: (d) => {
      assert.equal(d.permanent, true);
      assert.equal(d.effectiveTo, null);
      assert.ok(!/in effect in effect/i.test(d.plainSummary), d.plainSummary);
    },
  },
  {
    name: 'C with EST suffix',
    input: notam({ c: '2610291200 EST' }),
    codes: [],
    check: (d) => {
      assert.equal(d.estimatedEnd, true);
      assertTime(d.effectiveTo, 2026, 10, 29, 12, 0);
    },
  },
  { name: 'C is "EST" alone', input: notam({ c: 'EST' }), has: [E('time-malformed')] },
  { name: 'C with doubled EST', input: notam({ c: '2610291200 EST EST' }), has: [E('time-malformed')] },
  { name: 'B is PERM', input: notam({ b: 'PERM' }), has: [E('time-malformed')], check: (d) => assert.equal(d.effectiveFrom, null) },
  { name: 'B has 9 digits', input: notam({ b: '261029060' }), has: [E('time-malformed')], check: (d) => assert.equal(d.effectiveFrom, null) },
  { name: 'B has 11 digits', input: notam({ b: '26102906000' }), has: [E('time-malformed')], check: (d) => assert.equal(d.effectiveFrom, null) },
  { name: 'B has spaces between digit pairs', input: notam({ b: '26 10 29 06 00' }), has: [E('time-malformed')], check: (d) => assert.equal(d.effectiveFrom, null) },
  { name: 'B has letter O for zero', input: notam({ b: '26102906OO' }), has: [E('time-malformed')], check: (d) => assert.equal(d.effectiveFrom, null) },
  { name: 'B has fullwidth digits', input: notam({ b: '２６１０２９０６００' }), has: [E('time-malformed')], check: (d) => assert.equal(d.effectiveFrom, null) },
  { name: 'B has a non-breaking hyphen inside', input: notam({ b: '2610‑290600' }), has: [E('time-malformed')], check: (d) => assert.equal(d.effectiveFrom, null) },
  { name: 'B has an en dash inside', input: notam({ b: '261029–0600' }), has: [E('time-malformed')], check: (d) => assert.equal(d.effectiveFrom, null) },
  { name: 'B with 50000 digits', input: notam({ b: '9'.repeat(50000) }), has: [E('time-malformed')] },
  { name: 'B empty', input: notam({ b: '' }), oneOf: [E('field-missing'), E('time-malformed')] },
  { name: 'A empty', input: notam({ a: '' }), has: [E('field-missing')] },
  { name: 'E empty', input: notam({ e: '' }), has: [E('field-missing')] },
  { name: 'A missing', input: notam({ a: null }), codes: [E('field-missing')] },
  { name: 'E missing', input: notam({ e: null }), codes: [E('field-missing')] },
  {
    name: 'B missing on NOTAMN',
    input: notam({ b: null }),
    codes: [E('field-missing')],
    check: (d) => assert.equal(d.effectiveFrom, null),
  },
  { name: 'C missing on NOTAMN', input: notam({ c: null }), codes: [W('field-missing')] },
  { name: 'C missing on NOTAMR', input: notam({ head: 'A1234/26 NOTAMR A1000/26', c: null }), codes: [W('field-missing')] },
  { name: 'A with several locations', input: notam({ a: 'CYVR CYYJ CYXX' }), codes: [] },
  { name: 'header number with 4-digit year', input: notam({ head: 'A1234/2026 NOTAMN' }), codes: [E('header-malformed')] },
  { name: 'header number with 3 digits', input: notam({ head: 'A123/26 NOTAMN' }), codes: [E('header-malformed')] },
  { name: 'header number with 5 digits', input: notam({ head: 'A12345/26 NOTAMN' }), codes: [E('header-malformed')] },
  { name: 'header number with letters', input: notam({ head: 'A12X4/26 NOTAMN' }), codes: [E('header-malformed')] },
  { name: 'header with unknown type NOTAMX', input: notam({ head: 'A1234/26 NOTAMX' }), oneOf: HEADER_ANY },
  { name: 'header without type', input: notam({ head: 'A1234/26' }), oneOf: HEADER_ANY },
  { name: 'header absent', input: notam({ head: null }), has: [E('header-missing')] },
  { name: 'NOTAMN carrying a reference', input: notam({ head: 'A1234/26 NOTAMN A1000/26' }), codes: [W('ref-unexpected')] },
  { name: 'NOTAMR without a reference', input: notam({ head: 'A1234/26 NOTAMR' }), codes: [W('ref-missing')] },
  { name: 'NOTAMR with a reference', input: notam({ head: 'A1234/26 NOTAMR A1000/26' }), codes: [] },
  {
    name: 'NOTAMC with no B and no C',
    input: notam(CANCEL),
    codes: [],
    check: (d) => {
      assert.equal(d.effectiveFrom, null);
      assert.equal(d.replaces, 'A1234/26');
    },
  },
  { name: 'NOTAMC with B only', input: notam({ ...CANCEL, b: '2610290600' }), codes: [] },
  { name: 'NOTAMC with C', input: notam({ ...CANCEL, c: '2610291200' }), codes: [W('cancel-has-end')] },
  { name: 'NOTAMC without reference and without B', input: notam({ ...CANCEL, head: 'A1235/26 NOTAMC' }), codes: [W('ref-missing')] },
  { name: 'NOTAMC with nothing but a header', input: 'A1235/26 NOTAMC A1234/26', has: [E('field-missing')], lacks: [W('field-missing')] },
  { name: 'F lower limit garbage', input: notam({ f: 'FLXYZ', g: 'UNL' }), codes: [W('limits-malformed')] },
  { name: 'F lower limit without unit', input: notam({ f: '5000', g: 'UNL' }), codes: [W('limits-malformed')] },
  { name: 'G upper limit with 4-digit flight level', input: notam({ f: 'SFC', g: 'FL1000' }), codes: [W('limits-malformed')] },
  { name: 'F in feet without reference', input: notam({ f: '01000FT', g: 'UNL' }), codes: [W('limits-malformed')] },
  { name: 'F SFC and G UNL', input: notam({ f: 'SFC', g: 'UNL' }), codes: [] },
  { name: 'F GND and G FL100', input: notam({ f: 'GND', g: 'FL100' }), codes: [] },
  { name: 'F equal to G', input: notam({ f: '03000FT AMSL', g: '03000FT AMSL' }), codes: [] },
  { name: 'F FL100 above G in feet', input: notam({ f: 'FL100', g: '03000FT AMSL' }), codes: [W('limits-inverted')] },
  { name: 'F in metres above G in metres', input: notam({ f: '00500M AGL', g: '00100M AGL' }), codes: [W('limits-inverted')] },
  { name: 'F UNL and G SFC', input: notam({ f: 'UNL', g: 'SFC' }), codes: [W('limits-malformed')] },
  { name: 'G without F', input: notam({ g: 'FL100' }), codes: [] },
  { name: 'D with 2400 as end', input: notam({ d: '0600-2400' }), codes: [] },
  { name: 'D with 2400 as start', input: notam({ d: '2400-0600' }), codes: [W('schedule-invalid')] },
  { name: 'D with hour 25', input: notam({ d: '0600-2500' }), codes: [W('schedule-invalid')] },
  { name: 'D with day names and two windows', input: notam({ d: 'MON-FRI 0600-0800 1400-1600' }), codes: [] },
  { name: 'D with SR-SS', input: notam({ d: 'SR-SS' }), codes: [] },
  { name: 'D with en dash between hours', input: notam({ d: 'DAILY 0200–0600' }), codes: [] },
  { name: 'D whole day', input: notam({ d: '0000-2359' }), codes: [] },
  {
    name: 'Q closed but E says OPEN',
    input: notam({ e: 'RWY 08L/26R NOW OPEN.' }),
    codes: [W('text-contradiction')],
  },
  {
    name: 'Q unserviceable but E says AVBL',
    input: notam({ q: withCode('QICAS'), e: 'ILS RWY 08L AVBL.' }),
    codes: [W('text-contradiction')],
  },
  {
    name: 'Q resumed normal operation but E says CLSD',
    input: notam({ q: withCode('QMRAK'), e: 'RWY 08L/26R CLSD.' }),
    codes: [W('text-contradiction')],
  },
  {
    name: 'Q closed with E mixing CLSD and AVBL',
    input: notam({ e: 'TWY B CLSD. FOLLOW-ME AVBL ON REQ.' }),
    codes: [],
  },
  {
    name: 'smart quotes, dashes, ellipsis and multiplication sign in E',
    input: notam({ e: 'RWY 08L/26R CLSD – DUE WIP “NO ACFT” ‘TEST’ … 5 × 3' }),
    codes: [],
    check: (d) => {
      const raw = fieldOf(d, 'E')?.raw ?? '';
      for (const word of ['RWY 08L/26R CLSD', 'DUE WIP', 'NO ACFT', 'TEST', '5', '3']) assert.ok(raw.includes(word), `E lost "${word}": ${raw}`);
    },
  },
  {
    name: 'emoji and astral characters in E',
    input: notam({ e: 'RWY 08L/26R CLSD \u{1F6A7} \u{1D54F}' }),
    codes: [],
  },
  { name: 'lone surrogate in E', input: notam({ e: 'RWY 08L/26R CLSD \uD800 DUE WIP.' }), codes: [] },
  {
    name: 'control characters in E',
    input: notam({ e: 'RWY 08L/26R CLSD \u0000\u001b[31m DUE WIP.' }),
    check: (d) => assert.doesNotThrow(() => JSON.stringify(d)),
  },
  {
    name: 'HTML and script tags in E',
    input: notam({ e: '<script>alert(1)</script> RWY 08L/26R CLSD <img src=x onerror=alert(1)>' }),
    codes: [],
    check: (d) => assert.equal(fieldOf(d, 'E')?.raw.toLowerCase(), '<script>alert(1)</script> rwy 08l/26r clsd <img src=x onerror=alert(1)>'),
  },
  {
    name: 'item markers inside HTML in E',
    input: notam({ e: '<a href="x">B) 2610290600</a> <b>C) PERM</b> RWY CLSD' }),
    codes: [],
    check: (d) => {
      assertTime(d.effectiveFrom, 2026, 10, 29, 6, 0);
      assert.equal(d.permanent, false);
    },
  },
  {
    name: 'text coordinates in E: valid kept, out of range dropped',
    input: notam({ e: 'OBST AT 4911N12311W AND 9100N12311W AND 4960N12311W CLSD' }),
    check: (d) => {
      assert.ok(d.textCoordinates.some((c) => c.raw === '4911N12311W'));
      assert.ok(!d.textCoordinates.some((c) => c.raw === '9100N12311W'));
      assert.ok(!d.textCoordinates.some((c) => c.raw === '4960N12311W'));
    },
  },
  {
    name: 'domestic text with impossible WEF and TIL',
    input: '!SEA 10/123 SEA RWY 16L/34R CLSD WEF 2610322500 TIL 2610332600',
    has: [E('time-invalid')],
    check: (d) => {
      assert.equal(d.effectiveFrom, null);
      assert.equal(d.effectiveTo, null);
    },
  },
  {
    name: 'domestic text with TIL before WEF',
    input: '!SEA 10/123 SEA RWY 16L/34R CLSD WEF 2610290600 TIL 2610281200',
    has: [E('time-order')],
  },
  { name: 'A repeated 20000 times', input: 'A) '.repeat(20000), has: [E('header-missing')] },
  { name: 'closing parens 50000 times', input: ')'.repeat(50000), has: [E('header-missing')] },
  { name: 'letter A 50000 times then paren', input: 'A'.repeat(50000) + ')', has: [E('header-missing')] },
  { name: 'alternating item markers 30000 times', input: 'A)B)C)D)E)F)G)'.repeat(5000), has: [E('header-missing')] },
  { name: 'E marker then 50000 spaces then X', input: 'E) ' + ' '.repeat(50000) + 'X', has: [E('header-missing')] },
  { name: 'header then 50000 spaces then X', input: 'A1234/26 NOTAMN' + ' '.repeat(50000) + 'X', lacks: HEADER_ANY },
  { name: 'newline run of 50000', input: '\n'.repeat(50000) + notam(), codes: [] },
  { name: 'single 50000 character token', input: 'X'.repeat(50000), has: [E('header-missing')] },
  { name: 'one-line item soup repeated 5000 times', input: 'A) X B) Y C) Z '.repeat(5000), anyIssue: true },
  { name: 'E of 50 KB of runway text', input: notam({ e: 'RWY CLSD '.repeat(5600) }), codes: [] },
  {
    name: 'E of 50 KB of distinct unknown tokens',
    input: notam({ e: 'RWY CLSD ' + distinctTokens(7000) }),
    codes: [],
  },
  {
    name: 'E of 50 KB with sentence punctuation',
    input: notam({ e: 'rwy clsd. '.repeat(5000) }),
    codes: [],
  },
  {
    name: 'D of 50 KB',
    input: notam({ d: '0600-1800 '.repeat(5000) }),
    codes: [],
  },
  {
    name: 'A of 50 KB of locations',
    input: notam({ a: 'CYVR '.repeat(10000) }),
    codes: [],
  },
  {
    name: 'F with 50000 digits',
    input: notam({ f: '9'.repeat(50000) + 'FT AMSL', g: 'UNL' }),
    codes: [W('limits-malformed')],
  },
  {
    name: 'Q code and geo of 50000 characters',
    input: notam({ q: 'CZVR/' + 'Q'.repeat(50000) + '/IV/NBO/A/000/999/' + '4'.repeat(50000) }),
    has: [W('q-geo-malformed')],
    check: (d) => assertNoCenter(d),
  },
];

describe('malformed and hostile input', () => {
  for (const c of cases) {
    test(c.name, () => {
      const d = run(c.input);
      const got = signature(d);
      if (c.codes) assert.deepEqual(got, [...c.codes].sort(), `issue codes were ${JSON.stringify(got)}`);
      for (const code of c.has ?? []) assert.ok(got.includes(code), `expected ${code}, got ${JSON.stringify(got)}`);
      for (const code of c.lacks ?? []) assert.ok(!got.includes(code), `did not expect ${code}, got ${JSON.stringify(got)}`);
      if (c.oneOf) assert.ok(c.oneOf.some((code) => got.includes(code)), `expected one of ${JSON.stringify(c.oneOf)}, got ${JSON.stringify(got)}`);
      if (c.anyIssue) assert.ok(d.issues.length > 0, 'expected at least one issue');
      c.check?.(d);
    });
  }
});

describe('non-string input', () => {
  const values: Array<[string, unknown]> = [
    ['undefined', undefined],
    ['null', null],
    ['number', 42],
    ['object', {}],
    ['array of strings', ['A) CYVR']],
    ['boolean', true],
  ];
  for (const [label, value] of values) {
    test(`decodeNotam(${label}) does not throw and reports a missing header`, () => {
      const d = run(value);
      assert.ok(signature(d).includes(E('header-missing')), JSON.stringify(signature(d)));
    });
    test(`parseNotamTime(${label}) returns null`, () => {
      assert.equal(parseNotamTime(value), null);
    });
  }
});

describe('parseNotamTime never rolls over', () => {
  const invalid = [
    '2610322500',
    '2610332600',
    '2613010000',
    '2600150000',
    '2610000000',
    '2610320000',
    '2604310000',
    '2602290000',
    '2602300000',
    '2610292400',
    '2610290060',
    '2610290160',
    '2610292460',
    '2610290099',
    '9999999999',
    '0000000000',
    '2610322500 EST',
  ];
  for (const token of invalid) {
    test(`rejects ${token}`, () => {
      assert.equal(parseNotamTime(token), null);
    });
  }

  const valid: Array<[string, Time]> = [
    ['2802290000', { year: 2028, month: 2, day: 29, hour: 0, minute: 0 }],
    ['0002290000', { year: 2000, month: 2, day: 29, hour: 0, minute: 0 }],
    ['2612312359', { year: 2026, month: 12, day: 31, hour: 23, minute: 59 }],
    ['2601010000', { year: 2026, month: 1, day: 1, hour: 0, minute: 0 }],
    ['2604300000', { year: 2026, month: 4, day: 30, hour: 0, minute: 0 }],
    ['2610291200 EST', { year: 2026, month: 10, day: 29, hour: 12, minute: 0 }],
    ['  2610291200  ', { year: 2026, month: 10, day: 29, hour: 12, minute: 0 }],
  ];
  for (const [token, expected] of valid) {
    test(`accepts ${token.trim()}`, () => {
      assert.deepEqual(parseNotamTime(token), expected);
    });
  }

  const hostile: Array<[string, string, Time?]> = [
    ['digits then 50000 spaces then x', '2610291200' + ' '.repeat(50000) + 'x'],
    ['1 then 50000 spaces then x', '1' + ' '.repeat(50000) + 'x'],
    ['50000 spaces then EST', ' '.repeat(50000) + 'EST'],
    ['digits then 50000 spaces then EST', '2610291200' + ' '.repeat(50000) + 'EST', { year: 2026, month: 10, day: 29, hour: 12, minute: 0 }],
    ['EST repeated 20000 times', 'EST'.repeat(20000)],
    ['50000 digits', '9'.repeat(50000)],
    ['tabs and spaces alternating', '2610291200' + ' \t'.repeat(25000) + 'x'],
  ];
  for (const [label, token, want] of hostile) {
    test(`returns quickly for ${label}`, () => {
      const started = performance.now();
      let out: Time | null | undefined;
      try {
        out = parseNotamTime(token);
      } catch (error) {
        assert.fail(`parseNotamTime threw: ${String(error)}`);
      }
      const elapsed = performance.now() - started;
      assert.ok(elapsed < 50, `parseNotamTime took ${elapsed.toFixed(1)} ms`);
      assert.deepEqual(out, want ?? null);
    });
  }
});

describe('malformed.txt fixtures', () => {
  const text = readFileSync(new URL('./fixtures/malformed.txt', import.meta.url), 'utf8');
  const blocks = text
    .split(/\r?\n\s*\r?\n/)
    .map((block) =>
      block
        .split(/\r?\n/)
        .filter((line) => !line.startsWith('#'))
        .join('\n')
        .trim(),
    )
    .filter(Boolean);

  const expected: Record<string, { codes: string[]; check?: (d: Decoded) => void }> = {
    'A9101/26': {
      codes: [E('time-invalid')],
      check: (d) => {
        assert.equal(d.effectiveFrom, null);
        assert.equal(d.effectiveTo, null);
        assert.deepEqual(d.issues.filter((i) => i.code === 'time-invalid').map((i) => i.field).sort(), ['B', 'C']);
        assert.ok(!/32 Oct|33 Oct|25:00|26:00/.test(d.plainSummary), d.plainSummary);
      },
    },
    'A9102/26': {
      codes: [W('field-missing')],
      check: (d) => {
        assert.equal(fieldOf(d, 'E')?.raw, 'MISSING C) VALIDITY END.');
        assert.equal(fieldOf(d, 'C'), undefined);
        assert.equal(d.effectiveTo, null);
      },
    },
    'A9103/26': {
      codes: [W('q-geo-malformed')],
      check: (d) => assertNoCenter(d),
    },
    'A9104/26': { codes: [W('q-code-unknown')] },
    'A9105/26': { codes: [W('q-limits-inverted')] },
    'A9106/26': {
      codes: [W('cancel-has-end')],
      check: (d) => {
        assert.equal(fieldOf(d, 'E')?.raw, 'CANCELLATION CONTAINS B) AND C) FIELDS; CHECK TYPE-SPECIFIC VALIDATION.');
        assert.equal(fieldsOf(d, 'B').length, 1);
        assert.equal(fieldsOf(d, 'C').length, 1);
      },
    },
    'A9107/26': { codes: [W('ref-missing')] },
    'A9108/26': {
      codes: [E('time-order'), W('limits-inverted'), W('limits-malformed')],
      check: (d) => assert.ok(!/from 29 Oct 2026 14:00Z to 29 Oct 2026 10:00Z/.test(d.plainSummary), d.plainSummary),
    },
    'A9109/26': {
      codes: [E('q-geo-out-of-range')],
      check: (d) => assertNoCenter(d),
    },
    'A910X/26': { codes: [E('header-malformed')] },
    'A9111/26': {
      codes: [E('time-malformed')],
      check: (d) => {
        assert.equal(d.effectiveFrom, null);
        assert.equal(fieldOf(d, 'E')?.raw, 'B) TIMESTAMP TOO SHORT.');
        assert.equal(fieldsOf(d, 'B').length, 1);
      },
    },
    'A9112/26': {
      codes: [],
      check: (d) => {
        assert.equal(d.permanent, true);
        assert.ok(!/in effect in effect/i.test(d.plainSummary), d.plainSummary);
      },
    },
    'A9113/26': { codes: [W('limits-inverted')] },
    'A9114/26': { codes: [W('text-contradiction')] },
    'A9115/26': { codes: [W('schedule-invalid')] },
  };

  test('file has 15 fixtures', () => {
    assert.equal(blocks.length, 15);
    assert.deepEqual(blocks.map((b) => b.split(/\s/)[0]).sort(), Object.keys(expected).sort());
  });

  for (const block of blocks) {
    const id = block.split(/\s/)[0];
    test(`fixture ${id}`, () => {
      const want = expected[id];
      assert.ok(want, `no expectation for ${id}`);
      const d = run(block);
      assert.deepEqual(signature(d), [...want.codes].sort(), `issue codes were ${JSON.stringify(signature(d))}`);
      want.check?.(d);
    });
  }

  test('splitNotams on the whole file returns 15 chunks without comment lines', () => {
    const chunks = splitNotams(text);
    assert.equal(chunks.length, 15);
    for (const chunk of chunks) assert.ok(!/^#/m.test(chunk), 'comment line leaked into a chunk');
  });

  test('decodeNotams on the whole file matches the per-fixture codes', () => {
    const decoded = decodeNotams(text);
    assert.equal(decoded.length, 15);
    for (const d of decoded) {
      const id = `${d.series}${d.number}`;
      const want = expected[id] ?? expected[`A${(d.raw.match(/^A\d{3}[0-9X]\/26/) ?? [''])[0].slice(1)}`];
      assert.ok(want, `no expectation for ${id}`);
      assert.deepEqual(signature(d), [...want.codes].sort(), id);
    }
  });
});

describe('splitNotams and decodeNotams', () => {
  const one = notam();
  const two = notam({ head: 'A1235/26 NOTAMN', a: 'CYYJ' });

  test('two NOTAMs separated by a blank line', () => {
    assert.equal(splitNotams(one + '\n\n' + two).length, 2);
  });
  test('two NOTAMs with no blank line between them', () => {
    const chunks = splitNotams(one + '\n' + two);
    assert.equal(chunks.length, 2);
    assert.ok(chunks[1].startsWith('A1235/26 NOTAMN'));
  });
  test('CRLF paste of two NOTAMs', () => {
    const chunks = splitNotams(notam({}, '\r\n') + '\r\n\r\n' + notam({ head: 'A1235/26 NOTAMN' }, '\r\n'));
    assert.equal(chunks.length, 2);
    for (const c of chunks) assert.ok(!c.includes('\r'), 'chunk keeps a carriage return');
  });
  test('CR-only paste of two NOTAMs', () => {
    assert.equal(splitNotams(notam({}, '\r') + '\r\r' + notam({ head: 'A1235/26 NOTAMN' }, '\r')).length, 2);
  });
  test('FAA domestic headers', () => {
    assert.equal(splitNotams('!SEA 10/123 SEA RWY 16L/34R CLSD\n!SEA 10/124 SEA TWY A CLSD').length, 2);
  });
  test('parenthesised headers', () => {
    const chunks = splitNotams('(' + one + ')\n(' + two + ')');
    assert.equal(chunks.length, 2);
    assert.ok(chunks[0].includes('A1234/26 NOTAMN'));
  });
  test('comment lines and blank chunks are dropped', () => {
    assert.deepEqual(splitNotams('# only a comment\n\n   \n\n# another\n'), []);
  });
  test('empty and whitespace input', () => {
    assert.deepEqual(splitNotams(''), []);
    assert.deepEqual(splitNotams('  \r\n \t\n'), []);
  });
  test('header text in the middle of an E line does not split', () => {
    assert.equal(splitNotams(notam({ e: 'SEE A1234/26 NOTAMN FOR DETAILS' })).length, 1);
  });
  test('text with no header comes back as one chunk', () => {
    assert.equal(splitNotams('RWY 16L CLSD').length, 1);
  });
  test('non-string input returns an empty list', () => {
    assert.deepEqual(splitNotams(undefined), []);
    assert.deepEqual(splitNotams(null), []);
    assert.deepEqual(splitNotams(42), []);
  });
  test('1000 NOTAMs split in under 50 ms', () => {
    const big = Array.from({ length: 1000 }, (_, i) => notam({ head: `A${String(1000 + i)}/26 NOTAMN` })).join('\n\n');
    const started = performance.now();
    const chunks = splitNotams(big);
    const elapsed = performance.now() - started;
    assert.equal(chunks.length, 1000);
    assert.ok(elapsed < 50, `splitNotams took ${elapsed.toFixed(1)} ms`);
  });
  test('50 KB of newlines splits to nothing in under 50 ms', () => {
    const started = performance.now();
    const chunks = splitNotams('\n'.repeat(50000));
    const elapsed = performance.now() - started;
    assert.deepEqual(chunks, []);
    assert.ok(elapsed < 50, `splitNotams took ${elapsed.toFixed(1)} ms`);
  });
  test('50 KB of header-like lines splits in under 50 ms', () => {
    const started = performance.now();
    const chunks = splitNotams('A1234/26 NOTAMN\n'.repeat(3000));
    const elapsed = performance.now() - started;
    assert.equal(chunks.length, 3000);
    assert.ok(elapsed < 50, `splitNotams took ${elapsed.toFixed(1)} ms`);
  });
  test('decodeNotams on a clean pair returns two clean NOTAMs', () => {
    const decoded = decodeNotams(one + '\n\n' + two);
    assert.equal(decoded.length, 2);
    assert.deepEqual(decoded.map((d) => d.number), ['1234/26', '1235/26']);
    for (const d of decoded) {
      assertInvariants(d);
      assert.deepEqual(d.issues, []);
    }
  });
  test('decodeNotams isolates a bad NOTAM from its neighbours', () => {
    const decoded = decodeNotams(one + '\n\n' + notam({ head: 'A1235/26 NOTAMN', b: '2610322500' }) + '\n\n' + two.replace('A1235', 'A1236'));
    assert.equal(decoded.length, 3);
    assert.deepEqual(decoded.map((d) => signature(d)), [[], [E('time-invalid')], []]);
  });
  test('decodeNotams on empty input returns an empty list', () => {
    assert.deepEqual(decodeNotams(''), []);
    assert.deepEqual(decodeNotams('# nothing here\n'), []);
  });
  test('decodeNotams on hostile input does not throw', () => {
    assert.doesNotThrow(() => decodeNotams(undefined));
    assert.doesNotThrow(() => decodeNotams(')'.repeat(50000)));
  });
});

describe('seeded mutation fuzz', () => {
  function rng(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const TOKENS = [
    'A)', 'B)', 'C)', 'D)', 'E)', 'F)', 'G)', 'Q)', '/', '\n', '\r\n', '\r', '\t', ' ', '0', '9', '24', '60', '99', '00',
    'N', 'S', 'E', 'W', 'PERM', 'EST', 'UFN', 'NOTAMN', 'NOTAMC', 'NOTAMR', '(', ')', '--', '–', '“', '\u0000',
    '2400', '9999N99999W999', 'FL', 'UNL', 'SFC', 'AMSL', '<b>', '&amp;', '\uD800', '\u{1F6A7}',
  ];

  function mutate(source: string, next: () => number): string {
    let s = source;
    const rounds = 1 + Math.floor(next() * 6);
    for (let i = 0; i < rounds; i++) {
      const at = Math.floor(next() * (s.length + 1));
      const op = Math.floor(next() * 5);
      if (op === 0) s = s.slice(0, at) + TOKENS[Math.floor(next() * TOKENS.length)] + s.slice(at);
      else if (op === 1) s = s.slice(0, at) + s.slice(at + 1 + Math.floor(next() * 5));
      else if (op === 2) s = s.slice(0, at) + s.slice(at, at + 20) + s.slice(at);
      else if (op === 3) s = s.slice(0, at) + s.slice(at).toLowerCase();
      else if (next() < 0.1) s = s.slice(0, at);
    }
    return s;
  }

  const seeds = [
    notam(),
    notam({ d: 'DAILY 0200-0600', f: 'SFC', g: 'FL100', c: '2610291200 EST' }),
    notam(CANCEL),
    notam({ head: 'A1234/26 NOTAMR A1000/26', c: 'PERM' }),
    `A1234/26 NOTAMN Q) ${Q_OK} A) CYVR B) 2610290600 C) 2610291200 E) RWY CLSD`,
  ];

  test('1500 mutated NOTAMs never throw, never roll dates over, never emit out-of-range centres', () => {
    const next = rng(20261027);
    for (let i = 0; i < 1500; i++) {
      const input = mutate(seeds[i % seeds.length], next);
      try {
        const first = run(input);
        const second = run(input);
        assert.deepEqual(second, first, 'decodeNotam is not deterministic');
      } catch (error) {
        assert.fail(`iteration ${i} input ${JSON.stringify(input)}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  });

  test('mutated B and C values: every accepted time is a real time, every rejected one raises an error', () => {
    const next = rng(77);
    for (let i = 0; i < 1500; i++) {
      const b = mutate('2610290600', next);
      const c = mutate('2610291200', next);
      const input = notam({ b, c });
      const d = run(input);
      const codes = signature(d);
      if (d.effectiveFrom === null) {
        assert.ok(
          codes.includes(E('time-malformed')) || codes.includes(E('time-invalid')) || codes.includes(E('field-missing')),
          `iteration ${i} B ${JSON.stringify(b)} gave no error: ${JSON.stringify(codes)}`,
        );
      }
    }
  });
});
