import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decodeNotam, expandContractions } from '../../src/lib/notam.ts';

function notam(code: string, text = 'TEST', opts: { traffic?: string; purpose?: string; scope?: string; c?: string } = {}): string {
  const { traffic = 'IV', purpose = 'NBO', scope = 'A', c = '2612312359' } = opts;
  return [
    'A1234/26 NOTAMN',
    `Q) EGTT/Q${code}/${traffic}/${purpose}/${scope}/000/999/5128N00027W005`,
    'A) EGLL',
    'B) 2610270600',
    `C) ${c}`,
    `E) ${text}`,
  ].join('\n');
}

function qOf(code: string, opts = {}) {
  const q = decodeNotam(notam(code, 'TEST', opts)).qLine;
  assert.ok(q);
  return q;
}

const subjects: Array<[string, RegExp]> = [
  ['AC', /control zone/i],
  ['AD', /air defen[cs]e identification zone|ADIZ/i],
  ['AE', /control area/i],
  ['AF', /flight information region/i],
  ['AH', /upper control area/i],
  ['AO', /oceanic control area/i],
  ['AT', /terminal control area/i],
  ['AU', /upper flight information region/i],
  ['AZ', /aerodrome traffic zone/i],
  ['CA', /air.?\/?ground/i],
  ['CB', /ADS-B|broadcast/i],
  ['CC', /ADS-C|contract/i],
  ['CD', /CPDLC|data link/i],
  ['CE', /en-?route surveillance radar/i],
  ['CM', /surface movement radar/i],
  ['CP', /precision approach radar/i],
  ['CR', /surveillance radar element/i],
  ['CS', /secondary surveillance radar/i],
  ['CT', /terminal area surveillance radar/i],
  ['FA', /aerodrome/i],
  ['FB', /braking/i],
  ['FC', /ceiling/i],
  ['FD', /docking/i],
  ['FF', /fire/i],
  ['FH', /helicopter/i],
  ['FI', /de-?icing/i],
  ['FM', /meteorological/i],
  ['FP', /heliport/i],
  ['FS', /snow/i],
  ['FT', /transmissometer/i],
  ['FU', /fuel/i],
  ['FW', /wind direction/i],
  ['FZ', /customs/i],
  ['GA', /GNSS/i],
  ['GW', /GNSS/i],
  ['IG', /glide/i],
  ['IL', /localizer/i],
  ['IM', /middle marker/i],
  ['IO', /outer marker/i],
  ['IW', /microwave landing/i],
  ['LA', /approach lighting/i],
  ['LB', /beacon/i],
  ['LC', /centre ?line/i],
  ['LE', /runway edge/i],
  ['LG', /pilot-controlled/i],
  ['LH', /high intensity/i],
  ['LI', /end identifier/i],
  ['LL', /low intensity/i],
  ['LM', /medium intensity/i],
  ['LP', /PAPI|precision approach path/i],
  ['LT', /threshold/i],
  ['LX', /taxiway centre ?line/i],
  ['LY', /taxiway edge/i],
  ['LZ', /touchdown zone/i],
  ['MA', /movement area/i],
  ['MB', /bearing strength/i],
  ['MC', /clearway/i],
  ['MD', /declared distances/i],
  ['MH', /arresting/i],
  ['MK', /parking/i],
  ['MN', /apron/i],
  ['MO', /stop ?bar/i],
  ['MP', /stands/i],
  ['MR', /runway/i],
  ['MS', /stopway/i],
  ['MT', /threshold/i],
  ['MX', /taxiway/i],
  ['MY', /rapid exit/i],
  ['NB', /non-directional/i],
  ['ND', /distance measuring/i],
  ['NM', /VOR\/DME/i],
  ['NN', /TACAN/i],
  ['NT', /VORTAC/i],
  ['NV', /VOR/i],
  ['OB', /obstacle/i],
  ['OL', /obstacle lights/i],
  ['OR', /rescue coordination/i],
  ['PA', /arrival/i],
  ['PD', /departure/i],
  ['PH', /holding/i],
  ['PI', /instrument approach/i],
  ['PM', /minima/i],
  ['PN', /noise/i],
  ['PT', /transition/i],
  ['PU', /missed approach/i],
  ['RA', /airspace reservation/i],
  ['RD', /danger/i],
  ['RM', /military operating/i],
  ['RP', /prohibited/i],
  ['RR', /restricted/i],
  ['RT', /temporary restricted/i],
  ['SA', /ATIS|terminal information/i],
  ['SV', /VOLMET/i],
  ['ST', /tower/i],
  ['WA', /air display/i],
  ['WB', /aerobatics/i],
  ['WD', /demolition/i],
  ['WF', /air refuelling/i],
  ['WG', /glider/i],
  ['WH', /blasting/i],
  ['WL', /balloon/i],
  ['WM', /missile|gun|rocket/i],
  ['WP', /parachute/i],
  ['WU', /unmanned/i],
  ['WV', /formation/i],
  ['WW', /volcanic/i],
  ['WZ', /model/i],
  ['XX', /other/i],
];

for (const [code, pattern] of subjects) {
  test(`subject ${code}`, () => {
    const q = qOf(`${code}AS`);
    assert.equal(q.subjectCode, code);
    assert.ok(q.subjectPlain, `no meaning for subject ${code}`);
    assert.match(q.subjectPlain, pattern);
  });
}

const conditions: Array<[string, RegExp]> = [
  ['AC', /withdrawn for maintenance/i],
  ['AD', /daylight/i],
  ['AF', /flight checked/i],
  ['AG', /ground checked/i],
  ['AH', /hours of service/i],
  ['AK', /resumed normal/i],
  ['AL', /previously published limitations/i],
  ['AM', /military/i],
  ['AN', /night/i],
  ['AO', /operational/i],
  ['AP', /prior permission/i],
  ['AR', /on request/i],
  ['AS', /unserviceable/i],
  ['AU', /not available/i],
  ['AW', /completely withdrawn/i],
  ['AX', /shutdown.*cancelled|cancelled.*shutdown/i],
  ['CA', /^activated$/i],
  ['CC', /^completed$/i],
  ['CD', /^deactivated$/i],
  ['CE', /^erected$/i],
  ['CF', /frequency/i],
  ['CG', /downgraded/i],
  ['CH', /^changed$/i],
  ['CI', /call ?sign/i],
  ['CL', /realigned/i],
  ['CM', /displaced/i],
  ['CN', /cancelled/i],
  ['CO', /^operating$/i],
  ['CP', /reduced power/i],
  ['CR', /replaced/i],
  ['CS', /^installed$/i],
  ['CT', /on test/i],
  ['HA', /braking action/i],
  ['HC', /compacted snow/i],
  ['HD', /dry snow/i],
  ['HE', /water/i],
  ['HG', /grass cutting/i],
  ['HH', /hazard/i],
  ['HI', /ice/i],
  ['HJ', /launch planned/i],
  ['HK', /migration/i],
  ['HL', /snow clearance completed/i],
  ['HN', /wet snow|slush/i],
  ['HP', /snow clearance in progress/i],
  ['HQ', /operation cancelled/i],
  ['HR', /standing water/i],
  ['HS', /sanding/i],
  ['HU', /launch in progress/i],
  ['HV', /work completed/i],
  ['HW', /work in progress/i],
  ['HX', /birds/i],
  ['HY', /snow banks/i],
  ['HZ', /frozen ruts/i],
  ['LA', /auxiliary power/i],
  ['LB', /reserved for aircraft based/i],
  ['LC', /^closed$/i],
  ['LD', /^unsafe$/i],
  ['LE', /without auxiliary power/i],
  ['LF', /interference/i],
  ['LG', /without identification/i],
  ['LH', /heavier than/i],
  ['LI', /closed to IFR/i],
  ['LK', /fixed light/i],
  ['LL', /length.*width|width/i],
  ['LN', /closed to all night/i],
  ['LP', /^prohibited/i],
  ['LR', /restricted to runways and taxiways/i],
  ['LS', /interruption/i],
  ['LT', /^limited to/i],
  ['LV', /closed to VFR/i],
  ['LW', /will take place/i],
  ['LX', /caution advised/i],
  ['XX', /plain.?language/i],
];

for (const [code, pattern] of conditions) {
  test(`condition ${code}`, () => {
    const q = qOf(`MR${code}`);
    assert.equal(q.conditionCode, code);
    assert.ok(q.conditionPlain, `no meaning for condition ${code}`);
    assert.match(q.conditionPlain, pattern);
  });
}

test('checklist Q code QKKKK is a known code', () => {
  const q = qOf('KKKK', { traffic: 'K', purpose: 'K', scope: 'K' });
  assert.ok(q.subjectPlain);
  assert.match(q.subjectPlain, /checklist/i);
  assert.ok(q.conditionPlain);
  assert.match(q.conditionPlain, /checklist/i);
});

test('traffic K means checklist, not NOTAMC', () => {
  const q = qOf('KKKK', { traffic: 'K', purpose: 'K', scope: 'K' });
  assert.ok(q.trafficPlain);
  assert.match(q.trafficPlain, /checklist/i);
  assert.doesNotMatch(q.trafficPlain, /NOTAMC/);
});

test('purpose K means checklist', () => {
  const q = qOf('KKKK', { traffic: 'K', purpose: 'K', scope: 'K' });
  assert.ok(q.purposePlain);
  assert.match(q.purposePlain, /checklist/i);
});

test('scope K means checklist', () => {
  const q = qOf('KKKK', { traffic: 'K', purpose: 'K', scope: 'K' });
  assert.ok(q.scopePlain);
  assert.match(q.scopePlain, /checklist/i);
});

const traffic: Array<[string, RegExp]> = [
  ['I', /^IFR$/],
  ['V', /^VFR$/],
  ['IV', /^IFR and VFR$/],
];

for (const [code, pattern] of traffic) {
  test(`traffic ${code}`, () => {
    const q = qOf('MRLC', { traffic: code });
    assert.ok(q.trafficPlain);
    assert.match(q.trafficPlain, pattern);
  });
}

const purposes: Array<[string, RegExp]> = [
  ['NBO', /immediate attention.*briefing.*operation|immediate attention.*(PIB|pre-?flight)/i],
  ['BO', /briefing/i],
  ['M', /miscellaneous/i],
  ['K', /checklist/i],
];

for (const [code, pattern] of purposes) {
  test(`purpose ${code}`, () => {
    const q = qOf('MRLC', { purpose: code });
    assert.ok(q.purposePlain, `no meaning for purpose ${code}`);
    assert.match(q.purposePlain, pattern);
  });
}

const scopes: Array<[string, RegExp]> = [
  ['A', /^aerodrome$/i],
  ['E', /^en.?route$/i],
  ['W', /warning/i],
  ['AE', /aerodrome.*en.?route/i],
  ['AW', /aerodrome.*warning/i],
  ['K', /checklist/i],
];

for (const [code, pattern] of scopes) {
  test(`scope ${code}`, () => {
    const q = qOf('MRLC', { scope: code });
    assert.ok(q.scopePlain);
    assert.match(q.scopePlain, pattern);
  });
}

const exact: Array<[string, string]> = [
  ['RWY 08L CLSD', 'Runway 08L closed'],
  ['RWYS 09 AND 27 CLSD', 'Runways 09 and 27 closed'],
  ['TWY B U/S', 'Taxiway B unserviceable'],
  ['NOT AVBL', 'Not available'],
  ['RWY NOT AVBL', 'Runway not available'],
  ['TWY A UNAVBL', 'Taxiway A unavailable'],
  ['AVBL', 'Available'],
  ['2 HR', '2 hours'],
  ['1 HR', '1 hour'],
  ['30 MIN', '30 minutes'],
  ['H24', 'Continuous, 24 hours'],
];

for (const [input, expected] of exact) {
  test(`expand exact ${input}`, () => {
    assert.equal(expandContractions(input), expected);
  });
}

const contractions: Array<[string, RegExp]> = [
  ['APN', /\bapron\b/i],
  ['REQ', /\brequest(ed)?\b/i],
  ['RQRD', /\brequired\b/i],
  ['THRU', /\bthrough\b/i],
  ['PN', /prior notice/i],
  ['PJE', /parachute jumping exercise/i],
  ['RFFS', /rescue and fire ?fighting/i],
  ['ARFF', /aircraft rescue and fire ?fighting/i],
  ['MIL', /\bmilitary\b/i],
  ['AUTH', /\bauthori[sz](ed|ation)\b/i],
  ['LTD', /\blimited\b/i],
  ['ACT', /\bactiv(e|ated|ity)\b/i],
  ['INOP', /\binoperative\b/i],
  ['RLLS', /runway lead-?in lighting/i],
  ['ALS', /approach lighting system/i],
  ['REIL', /runway end identifier lights/i],
  ['MALSR', /medium intensity approach lighting system/i],
  ['ODALS', /omni-?directional approach lighting/i],
  ['AWOS', /automated weather observing system/i],
  ['ASOS', /automated surface observing system/i],
  ['CTAF', /common traffic advisory frequency/i],
  ['TFR', /temporary flight restriction/i],
  ['ASR', /surveillance radar/i],
  ['PAR', /precision approach radar/i],
  ['BCST', /\bbroadcast\b/i],
  ['CMSND', /^commissioned$/i],
  ['DCMSND', /^decommissioned$/i],
  ['FICON', /field condition/i],
  ['TKOF', /take-?off/i],
  ['LDG', /\blanding\b/i],
  ['TWR', /\btower\b/i],
  ['ABV', /\babove\b/i],
  ['BLW', /\bbelow\b/i],
  ['BYD', /\bbeyond\b/i],
  ['ADJ', /\badjacent\b/i],
  ['ALTN', /\balternate\b/i],
  ['CNL', /\bcancel(led)?\b/i],
  ['SR-SS', /sunrise.*sunset/i],
  ['UFN', /until further notice/i],
  ['FM', /^from$/i],
  ['WX', /\bweather\b/i],
  ['GND', /\bground\b/i],
  ['RSTD', /\brestricted\b/i],
  ['TRNG', /\btraining\b/i],
  ['NAV', /\bnavigation\b/i],
  ['UAS', /unmanned aircraft system/i],
  ['CAT', /\bcategory\b/i],
  ['OBSC', /\bobscured\b/i],
];

for (const [input, pattern] of contractions) {
  test(`expand ${input}`, () => {
    assert.match(expandContractions(input), pattern);
  });
}

test('REQ is not expanded to require', () => {
  assert.doesNotMatch(expandContractions('PPR REQ'), /\brequire\b/i);
});

test('NOT AVBL after lowercasing keeps no uppercase leftovers', () => {
  assert.equal(expandContractions('TWY A NOT AVBL'), 'Taxiway A not available');
});

test('lowercase input is expanded', () => {
  assert.match(expandContractions('rwy 09 clsd'), /runway 09 closed/i);
});

test('plain English words are not left shouting', () => {
  const out = expandContractions('BIRD ACTIVITY IN VICINITY OF AD. CAUTION');
  assert.doesNotMatch(out, /[A-Z]{4,}/);
});

test('sentence starts are capitalised after expansion', () => {
  const out = expandContractions('RWY 09 CLSD. TWY A CLSD');
  assert.equal(out, 'Runway 09 closed. Taxiway A closed');
});

test('summary separates the E text from the validity sentence with a full stop', () => {
  const d = decodeNotam(notam('MRLC', 'RWY 08L CLSD'));
  assert.match(d.plainSummary, /closed\. In effect from/);
});

test('summary does not repeat the Q-line meaning and the E text', () => {
  const d = decodeNotam(notam('MRLC', 'RWY 08L CLSD'));
  assert.doesNotMatch(d.plainSummary, /runway closed: runway/i);
});

test('summary for permanent NOTAM does not say in effect twice', () => {
  const d = decodeNotam(notam('MRLC', 'RWY 08L CLSD', { c: 'PERM' }));
  assert.doesNotMatch(d.plainSummary, /in effect in effect/i);
});

test('summary ends with a full stop', () => {
  const d = decodeNotam(notam('MRLC', 'RWY 08L CLSD'));
  assert.match(d.plainSummary, /\.$/);
});

test('summary keeps navaid acronyms uppercase', () => {
  const d = decodeNotam(notam('NVAS', 'LON VOR U/S'));
  assert.doesNotMatch(d.plainSummary, /\bvor\b/);
});

test('summary keeps ATIS uppercase', () => {
  const d = decodeNotam(notam('SAAS', 'ATIS U/S'));
  assert.doesNotMatch(d.plainSummary, /\batis\b/);
});

test('summary keeps PAPI uppercase', () => {
  const d = decodeNotam(notam('LPAS', 'PAPI RWY 09 U/S'));
  assert.doesNotMatch(d.plainSummary, /\bpapi\b/);
});

test('summary does not glue a dangling condition fragment to the subject', () => {
  const d = decodeNotam(notam('MRHA', 'RWY 09 BRAKING ACTION POOR'));
  assert.doesNotMatch(d.plainSummary, /braking action is:/i);
});

test('summary does not glue hours-of-service fragment to the subject', () => {
  const d = decodeNotam(notam('FAAH', 'AD HOURS OF OPS MON-FRI 0600-2200'));
  assert.doesNotMatch(d.plainSummary, /hours of service are now:/i);
});
