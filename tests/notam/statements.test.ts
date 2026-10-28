import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { decodeNotam, decodeNotams, splitNotams, buildStatements } from '../../src/lib/notam.ts';

const complex = readFileSync(new URL('./fixtures/complex.txt', import.meta.url), 'utf8');

test('a long E) with indented lines starting PAPI RWY and REIL RWY stays one NOTAM', () => {
  assert.equal(splitNotams(complex).length, 1);
  assert.equal(decodeNotams(complex).length, 1);
  const d = decodeNotam(complex);
  assert.deepEqual(d.issues, []);
  assert.deepEqual(d.fields.map((f) => f.code), ['A', 'B', 'C', 'D', 'E', 'F', 'G']);
  assert.match(d.fields.find((f) => f.code === 'E')!.raw, /REIL RWY 08L/);
});

test('the long NOTAM is grouped by status', () => {
  const d = decodeNotam(complex);
  const of = (status: string) => d.statements.filter((s) => s.status === status).map((s) => s.subject);
  assert.ok(of('closed').includes('Runway 08L/26R'));
  assert.ok(of('closed').includes('Taxiway D between runway 08L/26R and taxiway V'));
  assert.ok(of('unserviceable').includes('ILS runway 08L and ILS runway 26R'));
  assert.ok(of('unserviceable').includes('Stop bars at taxiway D and taxiway H'));
  assert.ok(of('hazard').includes('Men and equipment may be present'));
  assert.ok(of('available').some((s) => s.startsWith('Runway 13/31 available as taxiway')));
  assert.equal(d.statements.find((s) => s.subject === 'Runway 08L/26R')?.detail, 'due to rehabilitation work');
  assert.ok(d.statements.some((s) => s.subject.startsWith('GRIZZ eight arrival')));
});

test('the long NOTAM reports its schedule and altitudes', () => {
  const d = decodeNotam(complex);
  assert.equal(d.scheduleText, 'Daily 0400-1400');
  assert.equal(d.limitsText, 'Surface to 2,500 ft above mean sea level');
});

test('the headline does not repeat a Q-code that the text contradicts', () => {
  const d = decodeNotam('A9114/26 NOTAMN\nQ) CZVR/QMRLC/IV/NBO/A/000/999/4911N12311W005\nA) CYVR\nB) 2610290600\nC) 2610291200\nE) RUNWAY 08L/26R OPEN.');
  assert.ok(d.issues.some((i) => i.code === 'text-contradiction'));
  assert.doesNotMatch(d.headline ?? '', /closed/i);
  assert.equal(d.statements[0].status, 'available');
});

test('the headline drops the XX condition and dangling conditions', () => {
  const xx = decodeNotam('A0001/26 NOTAMN\nQ) KZOA/QFAXX/IV/NBO/A/000/999/3737N12223W005\nA) KSFO\nB) 2610290600\nC) 2610291200\nE) AD HOURS CHANGED.');
  assert.equal(xx.headline, 'Aerodrome');
  const ha = decodeNotam('A0002/26 NOTAMN\nQ) KZOA/QMRHA/IV/NBO/A/000/999/3737N12223W005\nA) KSFO\nB) 2610290600\nC) 2610291200\nE) RWY 10L BRAKING ACTION POOR.');
  assert.equal(ha.headline, 'Runway');
});

test('a cancellation does not present its text as current closures', () => {
  const d = decodeNotam('A9097/26 NOTAMC A9002/26\nQ) CZVR/QMXCN/IV/NBO/A/000/999/4901N12222W003\nA) CYXX\nE) TWY B CLSD CANCELLED.');
  assert.ok(d.statements.every((s) => s.status === 'info'));
});

test('statements keep runway lists whole when they are not taxiway segments', () => {
  const s = buildStatements('Runway guard lights at taxiway D, taxiway H and taxiway V unserviceable.');
  assert.equal(s.length, 1);
  assert.equal(s[0].subject, 'Runway guard lights at taxiway D, taxiway H and taxiway V');
});

test('every fixture produces at least one statement and no empty subjects', () => {
  const fixtures = readFileSync(new URL('./fixtures/notams.txt', import.meta.url), 'utf8');
  for (const d of decodeNotams(fixtures)) {
    assert.ok(d.statements.length > 0, d.raw);
    assert.ok(d.statements.every((s) => s.subject.trim().length > 0), d.raw);
  }
});
