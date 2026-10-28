import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { decodeNotam, decodeNotams, splitNotams } from '../../src/lib/notam.ts';

type Decoded = ReturnType<typeof decodeNotam>;

const at = (year: number, month: number, day: number, hour: number, minute: number) => ({ year, month, day, hour, minute });

const field = (d: Decoded, code: string) => d.fields.find((f) => f.code === code)?.raw;
const plain = (d: Decoded, code: string) => d.fields.find((f) => f.code === code)?.plain;
const codes = (d: Decoded) => d.fields.map((f) => f.code);

const near = (actual: number | undefined, expected: number, tolerance = 0.001) => {
  assert.ok(actual !== undefined && Math.abs(actual - expected) <= tolerance, `expected ${actual} to be within ${tolerance} of ${expected}`);
};

const dms = (deg: number, min: number, sec = 0) => deg + min / 60 + sec / 3600;

const FAA_RWY = '!SEA 10/123 SEA RWY 16L/34R CLSD 2610281200-2610290600';
const FAA_RWY_WEF = '!SEA 10/124 SEA RWY 16C/34C CLSD WEF 2610281200 TIL 2610290600';
const FAA_TWY_EST = '!BOS 10/045 BOS TWY B BTN TWY C AND TWY D CLSD 2610270900-2611011200EST';
const FAA_OBST_PERM = '!DEN 10/002 DEN OBST TOWER 395FT AGL 1.2NM NE (ASN 2026-ANM-1234-OE) LGT U/S 2610270900-PERM';
const FAA_OBST_CRANE = '!ORD 10/210 ORD OBST CRANE (ASN 2026-AGL-5521-NRA) 415115N0874530W (2.1NM SW ORD) 702FT MSL (212FT AGL) LGTD 2610150000-2611152359';
const FAA_UFN = '!JFK 10/301 JFK AD AP ILS RWY 04R CAT II/III NA WEF 2610280800 UFN';
const FAA_NAVAID = '!LAX 10/077 LAX NAV VOR/DME U/S 2610280800-2610281700';
const FAA_BFI = '!SEA 10/088 BFI TWY A CLSD 2610281200-2610290600';
const FAA_EN_DASH = '!SEA 10/123 SEA RWY 16L/34R CLSD 2610281200\u20132610290600';
const FAA_WRAPPED = '!SEA 10/123 SEA RWY 16L/34R CLSD DUE TO CONST ON THE\nTHRESHOLD. USE RWY 16C/34C. 2610281200-2610290600';
const FAA_TFR = '!FDC 6/1234 ZSE WA..AIRSPACE SEATTLE, WA..TEMPORARY FLIGHT RESTRICTIONS 3NM RADIUS OF 4728N12218W (SEA114008.4) SFC-3000FT AGL. EFFECTIVE 2610282000 UTC UNTIL 2610290300 UTC. PURSUANT TO 14 CFR SECTION 91.145 ... 2610282000-2610290300';
const FAA_TFR_DMS = '!FDC 6/2201 ZNY NY..AIRSPACE NEW YORK, NY..TEMPORARY FLIGHT RESTRICTIONS 10NM RADIUS OF 404500N0735900W SFC-17999FT MSL. 2611010800-2611012200';
const FAA_DOMESTIC_TRAILER = `${FAA_RWY}
CREATED: 27 Oct 2026 14:05:00 UTC
SOURCE: SEA`;

const FAA_ICAO = `KSEA A0234/26 NOTAMN
Q) ZSE/QMRLC/IV/NBO/A/000/999/4726N12218W005
A) KSEA B) 2610281200 C) 2610290600
E) RWY 16L/34R CLSD
CREATED: 27 Oct 2026 14:05:00 UTC
SOURCE: NOTAMS`;

const FAA_ICAO_PLAIN_HEADER = `A0234/26 NOTAMN
Q) ZSE/QMRLC/IV/NBO/A/000/999/4726N12218W005
A) KSEA
B) 2610281200
C) 2610290600
E) RWY 16L/34R CLSD
CREATED: 27 Oct 2026 14:05:00
SOURCE: KSEAYNYX`;

const FAA_ICAO_FAA_NUMBER = `10/123 NOTAMN
Q) ZSE/QMRLC/IV/NBO/A/000/999/4726N12218W005
A) KSEA B) 2610281200 C) 2610290600
E) RWY 16L/34R CLSD
CREATED: 27 Oct 2026 14:05:00
SOURCE: KSEAYNYX`;

const NC_SHORT = 'CYVR RWY 08L/26R CLSD 2610281200 TIL 2610290600';
const NC_BILINGUAL_SHORT = 'CYVR RWY 08L/26R CLSD / PISTE 08L/26R FERMEE 2610281200 TIL 2610290600';
const NC_TWY_EST = 'CYYZ TWY A CLSD BTN TWY B AND TWY C 2610281200 TIL 2610290600 EST';
const NC_UFN = 'CYVR AD CLSD TO ACFT OVER 12500 KG 2610281200 TIL UFN';
const NC_PAREN = `(A0412/26 NOTAMN
Q) CZVR/QMRLC/IV/NBO/A/000/999/4911N12311W005
A) CYVR B) 2610281200 C) 2610290600
E) RWY 08L/26R CLSD
F) SFC G) UNL)`;
const NC_BILINGUAL_FULL = `A0412/26 NOTAMN
Q) CZVR/QMRLC/IV/NBO/A/000/999/4911N12311W005
A) CYVR B) 2610281200 C) 2610290600
E) RWY 08L/26R CLSD
RWY 08L/26R FERMEE`;

const EAD_PAREN = `(A1234/26 NOTAMN
Q) EDGG/QMRLC/IV/NBO/A/000/999/5002N00834E005
A) EDDF B) 2610281200 C) 2610290600
E) RWY 07C/25C CLSD DUE TO MAINT.)`;
const EAD_PAREN_EST = `(A1234/26 NOTAMN
Q) EDGG/QMRLC/IV/NBO/A/000/999/5002N00834E005
A) EDDF B) 2610281200 C) 2610290600EST
E) RWY 07C/25C CLSD DUE TO MAINT)`;
const EAD_REPLACE = `(A1235/26 NOTAMR A1100/26
Q) EDGG/QMRLC/IV/NBO/A/000/999/5002N00834E005
A) EDDF B) 2610281200 C) PERM
E) TWY N5 CLSD)`;
const EAD_CANCEL = `(A1236/26 NOTAMC A1100/26
Q) EDGG/QMRLC/IV/NBO/A/000/999/5002N00834E005
A) EDDF
E) RWY 07C/25C OPEN)`;
const EAD_SCHEDULE = `(A1237/26 NOTAMN
Q) EDGG/QOBCE/IV/M/AE/000/005/5002N00834E002
A) EDDF B) 2610281200 C) 2611281200
D) MON-FRI 0600-1800
E) CRANE ERECTED 500M N OF RWY 07C THR. ELEV 410FT AMSL. MARKED AND LIGHTED.
F) SFC G) 410FT AMSL)`;
const EAD_INNER_PARENS = `(A1238/26 NOTAMN
Q) EDGG/QMXLC/IV/M/A/000/999/5002N00834E005
A) EDDF B) 2610281200 C) 2610290600
E) TWY B BTN APRON (TWY C) AND (TWY D) CLSD)`;

const AU_BASIC = `A1234/26 NOTAMN
Q) YMMM/QMRLC/IV/NBO/A/000/999/3748S14458E005
A) YMML B) 2610281200 C) 2610290600
E) RWY 16/34 CLOSED. EXPECT DELAYS.`;
const AU_SCHEDULE = `A1234/26 NOTAMN
Q) YBBB/QFAXX/IV/NBO/A/000/999/2723S15307E005
A) YBBN
B) 2610281200
C) 2610290600
D) 2200-0500 DAILY
E) AD CLOSED TO NON-SCHEDULED FLIGHTS WITHOUT PPR
F) SFC G) FL100`;
const AU_AREA = `A1239/26 NOTAMN
Q) YMMM/QRTCA/IV/BO/W/000/050/3800S14458E020
A) YMMM B) 2610281200 C) 2610290600
E) TEMPO RESTRICTED AREA WI AREA BOUNDED BY 3748S14458E - 3750S14510E -
3800S14500E - 3748S14458E. ACFT NOT TO ENTER.
F) SFC G) 5000FT AMSL`;
const AU_EST_SPACED = `A1240/26 NOTAMN
Q) YBBB/QMRLC/IV/NBO/A/000/999/2723S15307E005
A) YBBN B) 2610281200 C) 2610290600 EST
E) RWY 01/19 CLOSED.`;

const UK_DRONE = `(B1234/26 NOTAMN
Q) EGTT/QRRCA/IV/NBO/W/000/050/5130N00005W010
A) EGLL B) 2610281200 C) 2610290600
E) TEMPORARY RESTRICTED AREA ACTIVATED. DRONE FLIGHT TESTING WI 2NM RADIUS 513012N 0000512W.
F) SFC G) 5000FT AMSL)`;

const LIMITS_FL = `A1234/26 NOTAMN
Q) EGTT/QRTCA/IV/BO/W/055/195/5130N00005W030
A) EGTT B) 2610281200 C) 2610290600
E) DANGER AREA EG D123 ACTIVE
F) FL055 G) FL195`;
const LIMITS_FT_AMSL = `A1234/26 NOTAMN
Q) EGTT/QRTCA/IV/BO/W/000/030/5130N00005W030
A) EGTT B) 2610281200 C) 2610290600
E) TEMPORARY RESTRICTED AREA. PARACHUTING.
F) 1500FT AMSL G) 3000FT AMSL`;
const LIMITS_FT_AGL = `A1234/26 NOTAMN
Q) EGTT/QWPLW/IV/M/W/000/015/5130N00005W002
A) EGTT B) 2610281200 C) 2610290600
E) PARACHUTE JUMPING
F) SFC G) 1500FT AGL`;

const CLEAN = `A1234/26 NOTAMN
Q) EDGG/QMRLC/IV/NBO/A/000/999/5002N00834E005
A) EDDF B) 2610281200 C) 2610290600
E) RWY 07C/25C CLSD DUE TO MAINT`;

const ART_LINE_NUMBERS = `1  A1234/26 NOTAMN
2  Q) EDGG/QMRLC/IV/NBO/A/000/999/5002N00834E005
3  A) EDDF B) 2610281200 C) 2610290600
4  E) RWY 07C/25C CLSD DUE TO MAINT`;
const ART_PAGE_HEADER = `1 of 3
${CLEAN}`;
const ART_BLANK_LINES = `A1234/26 NOTAMN

Q) EDGG/QMRLC/IV/NBO/A/000/999/5002N00834E005

A) EDDF

B) 2610281200

C) 2610290600

E) RWY 07C/25C CLSD DUE TO MAINT`;
const ART_WRAPPED = `A1234/26 NOTAMN
Q) EDGG/QMRLC/IV/NBO/A/000/999/5002N00834E005
A) EDDF B) 2610281200 C) 2610290600
E) RWY 07C/25C CLSD DUE TO MAINTENANCE OF THE RUNWAY EDGE LIGHTS AND
CENTRELINE LIGHTS. TWY A AND TWY B BTN RWY 07C/25C ALSO CLSD. CTC
FRANKFURT GROUND ON 121.805 FOR TAXI INSTRUCTIONS.`;
const ART_TRAILING = 'A1234/26 NOTAMN   \nQ) EDGG/QMRLC/IV/NBO/A/000/999/5002N00834E005   \nA) EDDF B) 2610281200 C) 2610290600   \nE) RWY 07C/25C CLSD   \n   ';
const ART_NBSP = 'A1234/26\u00a0NOTAMN\nQ)\u00a0EDGG/QMRLC/IV/NBO/A/000/999/5002N00834E005\nA)\u00a0EDDF\u00a0B)\u00a02610281200\u00a0C)\u00a02610290600\nE)\u00a0RWY\u00a007C/25C\u00a0CLSD';
const ART_CRLF = 'A1234/26 NOTAMN\r\nQ) EDGG/QMRLC/IV/NBO/A/000/999/5002N00834E005\r\nA) EDDF B) 2610281200 C) 2610290600\r\nE) RWY 07C/25C CLSD\r\n';
const ART_ONE_LINE = 'A1234/26 NOTAMN Q) EDGG/QMRLC/IV/NBO/A/000/999/5002N00834E005 A) EDDF B) 2610281200 C) 2610290600 E) RWY 07C/25C CLSD DUE TO MAINT';
const ART_PREFIXED = `EDDF (FRANKFURT/MAIN)
A1234/26 NOTAMN
Q) EDGG/QMRLC/IV/NBO/A/000/999/5002N00834E005
A) EDDF B) 2610281200 C) 2610290600
E) RWY 07C/25C CLSD`;
const ART_ITEM_REFS_IN_E = `A1234/26 NOTAMN
Q) EDGG/QMRLC/IV/NBO/A/000/999/5002N00834E005
A) EDDF B) 2610281200 C) 2610290600
D) MON-FRI 0600-1800
E) RWY 07C/25C CLSD OUTSIDE HOURS SEE ITEM D) AND B) AND C) FIELDS FOR TIMES.`;

const MIX_ITEMS = [
  FAA_RWY,
  FAA_TFR.replace(/ \.\.\. 2610282000-2610290300$/, '. 2610282000-2610290300'),
  NC_SHORT,
  EAD_PAREN,
  EAD_PAREN.replace('A1234/26', 'A1235/26').replace('DUE TO MAINT.', 'LIGHTING U/S.'),
  AU_BASIC.replace('A1234/26', 'A0412/26'),
  LIMITS_FL.replace('A1234/26', 'B1234/26'),
  '!BOS 10/045 BOS TWY B CLSD 2610270900-2611011200EST',
  FAA_OBST_PERM,
  'CYYZ TWY A CLSD 2610281200 TIL 2610290600',
];
const MIX_LOCATIONS = ['SEA', 'ZSE', 'CYVR', 'EDDF', 'EDDF', 'YMML', 'EGTT', 'BOS', 'DEN', 'CYYZ'];
const MIX = `${MIX_ITEMS.join('\n\n')}\n`;
const MIX_HEADERED_ITEMS = MIX_ITEMS.filter((_, i) => i !== 2 && i !== 9);
const MIX_HEADERED = MIX_HEADERED_ITEMS.join('\n\n');

describe('FAA domestic format', () => {
  test('runway closure: identifier, location and trailing range', () => {
    const d = decodeNotam(FAA_RWY);
    assert.match(d.number ?? '', /\b10\/123$/);
    assert.equal(field(d, 'A'), 'SEA');
    assert.deepEqual(d.effectiveFrom, at(2026, 10, 28, 12, 0));
    assert.deepEqual(d.effectiveTo, at(2026, 10, 29, 6, 0));
    assert.equal(d.unstructured, false);
  });

  test('runway closure: summary is readable and has no raw 10-digit stamps', () => {
    const d = decodeNotam(FAA_RWY);
    assert.match(d.plainSummary, /SEA/);
    assert.match(d.plainSummary, /runway 16L\/34R/i);
    assert.match(d.plainSummary, /closed/i);
    assert.match(d.plainSummary, /28 Oct 2026/);
    assert.match(d.plainSummary, /29 Oct 2026/);
    assert.doesNotMatch(d.plainSummary, /\d{10}/);
  });

  test('runway closure: no error issues and no text left in E that belongs to the header or times', () => {
    const d = decodeNotam(FAA_RWY);
    assert.deepEqual(d.issues.filter((i) => i.severity === 'error'), []);
    assert.equal(field(d, 'E'), 'RWY 16L/34R CLSD');
  });

  test('WEF/TIL form', () => {
    const d = decodeNotam(FAA_RWY_WEF);
    assert.match(d.number ?? '', /\b10\/124$/);
    assert.equal(field(d, 'A'), 'SEA');
    assert.deepEqual(d.effectiveFrom, at(2026, 10, 28, 12, 0));
    assert.deepEqual(d.effectiveTo, at(2026, 10, 29, 6, 0));
    assert.equal(field(d, 'E'), 'RWY 16C/34C CLSD');
  });

  test('range ending in EST sets estimatedEnd and parses the end', () => {
    const d = decodeNotam(FAA_TWY_EST);
    assert.equal(field(d, 'A'), 'BOS');
    assert.deepEqual(d.effectiveFrom, at(2026, 10, 27, 9, 0));
    assert.deepEqual(d.effectiveTo, at(2026, 11, 1, 12, 0));
    assert.equal(d.estimatedEnd, true);
    assert.match(d.plainSummary, /taxiway B between taxiway C and taxiway D closed/i);
    assert.doesNotMatch(d.plainSummary, /\d{10}/);
  });

  test('range ending in PERM is permanent with a start and no end', () => {
    const d = decodeNotam(FAA_OBST_PERM);
    assert.equal(field(d, 'A'), 'DEN');
    assert.deepEqual(d.effectiveFrom, at(2026, 10, 27, 9, 0));
    assert.equal(d.effectiveTo, null);
    assert.equal(d.permanent, true);
    assert.equal(d.estimatedEnd, false);
    assert.doesNotMatch(d.plainSummary, /\d{10}/);
  });

  test('ASN reference containing "OE)" does not open an E item', () => {
    const d = decodeNotam(FAA_OBST_PERM);
    assert.deepEqual(codes(d).filter((c) => !['A', 'B', 'C', 'E'].includes(c)), []);
    assert.match(field(d, 'E') ?? '', /ASN 2026-ANM-1234-OE/);
    assert.match(field(d, 'E') ?? '', /TOWER 395FT AGL/);
    assert.match(d.plainSummary, /tower/i);
    assert.match(d.plainSummary, /395/);
  });

  test('ASN reference ending "NRA)" and "(... ORD)" do not open A or D items', () => {
    const d = decodeNotam(FAA_OBST_CRANE);
    assert.equal(field(d, 'A'), 'ORD');
    assert.equal(codes(d).includes('D'), false);
    assert.match(field(d, 'E') ?? '', /ASN 2026-AGL-5521-NRA/);
    assert.match(field(d, 'E') ?? '', /\(2\.1NM SW ORD\)/);
    assert.deepEqual(d.effectiveFrom, at(2026, 10, 15, 0, 0));
    assert.deepEqual(d.effectiveTo, at(2026, 11, 15, 23, 59));
    assert.match(d.plainSummary, /crane/i);
    assert.match(d.plainSummary, /702/);
  });

  test('obstacle position DDMMSS is extracted as a coordinate', () => {
    const d = decodeNotam(FAA_OBST_CRANE);
    assert.equal(d.textCoordinates.length, 1);
    assert.equal(d.textCoordinates[0].raw, '415115N0874530W');
    near(d.textCoordinates[0].lat, dms(41, 51, 15));
    near(d.textCoordinates[0].lon, -dms(87, 45, 30));
  });

  test('UFN: start parsed, no end, summary says until further notice, location is not an unknown contraction', () => {
    const d = decodeNotam(FAA_UFN);
    assert.equal(field(d, 'A'), 'JFK');
    assert.deepEqual(d.effectiveFrom, at(2026, 10, 28, 8, 0));
    assert.equal(d.effectiveTo, null);
    assert.match(d.plainSummary, /until further notice/i);
    assert.doesNotMatch(d.plainSummary, /\bUFN\b/);
    assert.equal(d.unrecognisedTokens.includes('JFK'), false);
    assert.match(d.plainSummary, /\bILS\b/);
    assert.match(d.plainSummary, /runway 04R/i);
  });

  test('NAVAID outage', () => {
    const d = decodeNotam(FAA_NAVAID);
    assert.equal(field(d, 'A'), 'LAX');
    assert.deepEqual(d.effectiveFrom, at(2026, 10, 28, 8, 0));
    assert.deepEqual(d.effectiveTo, at(2026, 10, 28, 17, 0));
    assert.match(d.plainSummary, /VOR/);
    assert.match(d.plainSummary, /unserviceable/i);
    assert.match(d.plainSummary, /LAX/);
  });

  test('affected location after the number wins over the accountability location in the "!" token', () => {
    const d = decodeNotam(FAA_BFI);
    assert.match(d.number ?? '', /\b10\/088$/);
    assert.equal(field(d, 'A'), 'BFI');
    assert.match(d.plainSummary, /BFI/);
    assert.match(d.plainSummary, /taxiway A closed/i);
    assert.deepEqual(d.effectiveFrom, at(2026, 10, 28, 12, 0));
    assert.deepEqual(d.effectiveTo, at(2026, 10, 29, 6, 0));
  });

  test('en dash between the two times', () => {
    const d = decodeNotam(FAA_EN_DASH);
    assert.deepEqual(d.effectiveFrom, at(2026, 10, 28, 12, 0));
    assert.deepEqual(d.effectiveTo, at(2026, 10, 29, 6, 0));
  });

  test('line-wrapped body keeps the range after the wrap', () => {
    const d = decodeNotam(FAA_WRAPPED);
    assert.equal(field(d, 'A'), 'SEA');
    assert.deepEqual(d.effectiveFrom, at(2026, 10, 28, 12, 0));
    assert.deepEqual(d.effectiveTo, at(2026, 10, 29, 6, 0));
    assert.equal(field(d, 'E'), 'RWY 16L/34R CLSD DUE TO CONST ON THE THRESHOLD. USE RWY 16C/34C.');
  });

  test('FDC TFR: number, ARTCC as location, times from range or inline wording', () => {
    const d = decodeNotam(FAA_TFR);
    assert.match(d.number ?? '', /\b6\/1234$/);
    assert.equal(field(d, 'A'), 'ZSE');
    assert.deepEqual(d.effectiveFrom, at(2026, 10, 28, 20, 0));
    assert.deepEqual(d.effectiveTo, at(2026, 10, 29, 3, 0));
  });

  test('FDC TFR: centre in DDMMN/DDDMMW form', () => {
    const d = decodeNotam(FAA_TFR);
    assert.equal(d.textCoordinates.length, 1);
    assert.equal(d.textCoordinates[0].raw, '4728N12218W');
    near(d.textCoordinates[0].lat, dms(47, 28));
    near(d.textCoordinates[0].lon, -dms(122, 18));
  });

  test('FDC TFR: summary states radius and vertical extent in words', () => {
    const d = decodeNotam(FAA_TFR);
    assert.match(d.plainSummary, /temporary flight restrictions/i);
    assert.match(d.plainSummary, /3 ?NM radius/i);
    assert.match(d.plainSummary, /surface/i);
    assert.match(d.plainSummary, /3,?000 (ft|feet) above ground level/i);
  });

  test('FDC TFR: summary does not repeat the raw effective-time stamps', () => {
    const d = decodeNotam(FAA_TFR);
    assert.doesNotMatch(d.plainSummary, /\d{10}/);
    assert.doesNotMatch(d.plainSummary, /EFFECTIVE .* UTC/);
  });

  test('FDC TFR: FDC, ARTCC and CFR are not reported as unknown contractions', () => {
    const d = decodeNotam(FAA_TFR);
    assert.equal(d.unrecognisedTokens.includes('FDC'), false);
    assert.equal(d.unrecognisedTokens.includes('ZSE'), false);
    assert.equal(d.unrecognisedTokens.includes('CFR'), false);
  });

  test('FDC TFR with DDMMSS centre and only a trailing range', () => {
    const d = decodeNotam(FAA_TFR_DMS);
    assert.match(d.number ?? '', /\b6\/2201$/);
    assert.equal(field(d, 'A'), 'ZNY');
    assert.deepEqual(d.effectiveFrom, at(2026, 11, 1, 8, 0));
    assert.deepEqual(d.effectiveTo, at(2026, 11, 1, 22, 0));
    assert.equal(d.textCoordinates.length, 1);
    near(d.textCoordinates[0].lat, dms(40, 45));
    near(d.textCoordinates[0].lon, -dms(73, 59));
  });

  test('FDC TFR: state abbreviation and ARTCC are not reported as unknown contractions', () => {
    const d = decodeNotam(FAA_TFR_DMS);
    assert.equal(d.unrecognisedTokens.includes('ZNY'), false);
    assert.equal(d.unrecognisedTokens.includes('NY'), false);
  });

  test('CREATED/SOURCE trailer on a domestic NOTAM is metadata, not text', () => {
    const d = decodeNotam(FAA_DOMESTIC_TRAILER);
    assert.equal(field(d, 'A'), 'SEA');
    assert.equal(field(d, 'E'), 'RWY 16L/34R CLSD');
    assert.deepEqual(d.effectiveTo, at(2026, 10, 29, 6, 0));
    assert.doesNotMatch(d.plainSummary, /CREATED|SOURCE/);
  });
});

describe('FAA NOTAM Search ICAO format', () => {
  test('CREATED and SOURCE trailer lines are removed from E and from the summary', () => {
    for (const input of [FAA_ICAO, FAA_ICAO_PLAIN_HEADER, FAA_ICAO_FAA_NUMBER]) {
      const d = decodeNotam(input);
      assert.equal(field(d, 'E'), 'RWY 16L/34R CLSD');
      assert.doesNotMatch(d.plainSummary, /CREATED|SOURCE|14:05/);
    }
  });

  test('location prefix before the series is accepted in the header', () => {
    const d = decodeNotam(FAA_ICAO);
    assert.equal(d.series, 'A');
    assert.equal(d.number, '0234/26');
    assert.equal(d.type, 'NOTAMN');
    assert.equal(field(d, 'A'), 'KSEA');
  });

  test('plain header with items on separate lines decodes cleanly with no issues', () => {
    const d = decodeNotam(FAA_ICAO_PLAIN_HEADER);
    assert.equal(d.series, 'A');
    assert.equal(d.number, '0234/26');
    assert.deepEqual(d.effectiveFrom, at(2026, 10, 28, 12, 0));
    assert.deepEqual(d.effectiveTo, at(2026, 10, 29, 6, 0));
    assert.deepEqual(d.issues, []);
    near(d.qLine?.center?.lat, dms(47, 26));
    near(d.qLine?.center?.lon, -dms(122, 18));
  });

  test('FAA-numbered ICAO header "10/123 NOTAMN" is recognised as a NOTAMN', () => {
    const d = decodeNotam(FAA_ICAO_FAA_NUMBER);
    assert.equal(d.type, 'NOTAMN');
    assert.match(d.number ?? '', /\b10\/123$/);
    assert.equal(field(d, 'A'), 'KSEA');
    assert.equal(d.issues.some((i) => i.code === 'header-missing'), false);
  });
});

describe('NAV CANADA', () => {
  test('short form: location, TIL range and summary', () => {
    const d = decodeNotam(NC_SHORT);
    assert.equal(field(d, 'A'), 'CYVR');
    assert.deepEqual(d.effectiveFrom, at(2026, 10, 28, 12, 0));
    assert.deepEqual(d.effectiveTo, at(2026, 10, 29, 6, 0));
    assert.match(d.plainSummary, /CYVR/);
    assert.match(d.plainSummary, /runway 08L\/26R closed/i);
    assert.doesNotMatch(d.plainSummary, /\d{10}/);
    assert.equal(d.unrecognisedTokens.includes('CYVR'), false);
  });

  test('short form with French half drops the French from the summary', () => {
    const d = decodeNotam(NC_BILINGUAL_SHORT);
    assert.equal(field(d, 'A'), 'CYVR');
    assert.deepEqual(d.effectiveFrom, at(2026, 10, 28, 12, 0));
    assert.deepEqual(d.effectiveTo, at(2026, 10, 29, 6, 0));
    assert.match(d.plainSummary, /runway 08L\/26R closed/i);
    assert.doesNotMatch(d.plainSummary, /FERMEE|PISTE/);
  });

  test('full form with French line after the English line', () => {
    const d = decodeNotam(NC_BILINGUAL_FULL);
    assert.equal(field(d, 'A'), 'CYVR');
    assert.match(d.plainSummary, /runway 08L\/26R closed/i);
    assert.doesNotMatch(d.plainSummary, /FERMEE/);
  });

  test('short form taxiway with EST after TIL', () => {
    const d = decodeNotam(NC_TWY_EST);
    assert.equal(field(d, 'A'), 'CYYZ');
    assert.deepEqual(d.effectiveFrom, at(2026, 10, 28, 12, 0));
    assert.deepEqual(d.effectiveTo, at(2026, 10, 29, 6, 0));
    assert.equal(d.estimatedEnd, true);
    assert.match(d.plainSummary, /taxiway A closed between taxiway B and taxiway C/i);
  });

  test('TIL UFN keeps the start, has no end and keeps the weight limit readable', () => {
    const d = decodeNotam(NC_UFN);
    assert.equal(field(d, 'A'), 'CYVR');
    assert.deepEqual(d.effectiveFrom, at(2026, 10, 28, 12, 0));
    assert.equal(d.effectiveTo, null);
    assert.match(d.plainSummary, /12,?500/);
    assert.match(d.plainSummary, /kg|kilogram/i);
    assert.match(d.plainSummary, /until further notice/i);
    assert.equal(d.unrecognisedTokens.includes('KG'), false);
    assert.equal(d.unrecognisedTokens.includes('CYVR'), false);
  });

  test('parenthesised full form: header recognised and trailing ")" is not part of G', () => {
    const d = decodeNotam(NC_PAREN);
    assert.equal(d.series, 'A');
    assert.equal(d.number, '0412/26');
    assert.equal(d.type, 'NOTAMN');
    assert.equal(field(d, 'F'), 'SFC');
    assert.equal(field(d, 'G'), 'UNL');
    assert.equal(field(d, 'E'), 'RWY 08L/26R CLSD');
    assert.match(plain(d, 'G') ?? '', /unlimited/i);
    assert.match(plain(d, 'F') ?? '', /surface|ground/i);
    assert.deepEqual(d.issues, []);
  });
});

describe('EUROCONTROL / EAD parenthesised', () => {
  test('header with leading "(" is recognised', () => {
    const d = decodeNotam(EAD_PAREN);
    assert.equal(d.series, 'A');
    assert.equal(d.number, '1234/26');
    assert.equal(d.type, 'NOTAMN');
    assert.equal(d.replaces, null);
  });

  test('closing ")" glued to the end of E is removed, keeping the full stop', () => {
    const d = decodeNotam(EAD_PAREN);
    assert.equal(field(d, 'E'), 'RWY 07C/25C CLSD DUE TO MAINT.');
    assert.doesNotMatch(d.plainSummary, /\)/);
  });

  test('closing ")" glued to a word ending in A-G does not become an item', () => {
    const d = decodeNotam(EAD_PAREN_EST);
    assert.equal(field(d, 'E'), 'RWY 07C/25C CLSD DUE TO MAINT');
    assert.deepEqual(codes(d), ['A', 'B', 'C', 'E']);
    assert.equal(d.estimatedEnd, true);
    assert.deepEqual(d.effectiveTo, at(2026, 10, 29, 6, 0));
  });

  test('NOTAMR with PERM and "CLSD)" ending: reference captured, E intact, nothing flagged', () => {
    const d = decodeNotam(EAD_REPLACE);
    assert.equal(d.type, 'NOTAMR');
    assert.equal(d.number, '1235/26');
    assert.equal(d.replaces, 'A1100/26');
    assert.equal(field(d, 'E'), 'TWY N5 CLSD');
    assert.equal(d.permanent, true);
    assert.deepEqual(d.unrecognisedTokens, []);
    assert.match(d.plainSummary, /A1100\/26/);
    assert.doesNotMatch(d.plainSummary, /in effect in effect/i);
  });

  test('NOTAMC: reference captured and the summary says it cancels instead of repeating the Q-line condition', () => {
    const d = decodeNotam(EAD_CANCEL);
    assert.equal(d.type, 'NOTAMC');
    assert.equal(d.replaces, 'A1100/26');
    assert.equal(field(d, 'E'), 'RWY 07C/25C OPEN');
    assert.match(d.plainSummary, /cancel/i);
    assert.match(d.plainSummary, /A1100\/26/);
    assert.doesNotMatch(d.plainSummary, /runway closed/i);
  });

  test('D schedule and F/G with trailing ")" are kept and the schedule reaches the summary', () => {
    const d = decodeNotam(EAD_SCHEDULE);
    assert.equal(field(d, 'D'), 'MON-FRI 0600-1800');
    assert.equal(field(d, 'E'), 'CRANE ERECTED 500M N OF RWY 07C THR. ELEV 410FT AMSL. MARKED AND LIGHTED.');
    assert.equal(field(d, 'F'), 'SFC');
    assert.equal(field(d, 'G'), '410FT AMSL');
    assert.match(d.plainSummary, /MON.{0,3}FRI|Monday/i);
    assert.match(d.plainSummary, /0600/);
    assert.match(d.plainSummary, /1800/);
  });

  test('parenthesised words inside E, like "(TWY C)", do not open items', () => {
    const d = decodeNotam(EAD_INNER_PARENS);
    assert.deepEqual(codes(d), ['A', 'B', 'C', 'E']);
    assert.equal(field(d, 'E'), 'TWY B BTN APRON (TWY C) AND (TWY D) CLSD');
    assert.match(d.plainSummary, /taxiway B between apron \(taxiway C\) and \(taxiway D\) closed/i);
  });

  test('parenthesised NOTAM decodes with no issues', () => {
    assert.deepEqual(decodeNotam(EAD_PAREN).issues, []);
    assert.deepEqual(decodeNotam(EAD_PAREN_EST).issues, []);
    assert.deepEqual(decodeNotam(EAD_REPLACE).issues, []);
  });
});

describe('Australia and UK', () => {
  test('Australia basic closure', () => {
    const d = decodeNotam(AU_BASIC);
    assert.equal(field(d, 'A'), 'YMML');
    assert.deepEqual(d.effectiveFrom, at(2026, 10, 28, 12, 0));
    assert.deepEqual(d.effectiveTo, at(2026, 10, 29, 6, 0));
    assert.match(d.plainSummary, /runway 16\/34 closed/i);
    near(d.qLine?.center?.lat, -dms(37, 48));
    near(d.qLine?.center?.lon, dms(144, 58));
  });

  test('daily schedule from D appears in the summary and the XX condition is not spelled out', () => {
    const d = decodeNotam(AU_SCHEDULE);
    assert.equal(field(d, 'D'), '2200-0500 DAILY');
    assert.match(d.plainSummary, /2200.{0,6}0500/);
    assert.match(d.plainSummary, /daily/i);
    assert.doesNotMatch(d.plainSummary, /see the plain-language text/i);
    assert.match(d.plainSummary, /prior permission required/i);
    assert.doesNotMatch(d.plainSummary, /\bPPR\b/);
  });

  test('restricted area polygon in E gives four coordinates, southern and eastern hemispheres signed correctly', () => {
    const d = decodeNotam(AU_AREA);
    assert.equal(d.textCoordinates.length, 4);
    near(d.textCoordinates[0].lat, -dms(37, 48));
    near(d.textCoordinates[0].lon, dms(144, 58));
    near(d.textCoordinates[1].lat, -dms(37, 50));
    near(d.textCoordinates[1].lon, dms(145, 10));
    near(d.textCoordinates[2].lat, -dms(38, 0));
    near(d.textCoordinates[2].lon, dms(145, 0));
    assert.equal(d.textCoordinates[3].raw, '3748S14458E');
  });

  test('restricted area summary carries the vertical extent', () => {
    const d = decodeNotam(AU_AREA);
    assert.match(d.plainSummary, /surface/i);
    assert.match(d.plainSummary, /5,?000 ?(ft|feet)/i);
    assert.match(d.plainSummary, /above mean sea level|AMSL/i);
  });

  test('EST separated from C by a space', () => {
    const d = decodeNotam(AU_EST_SPACED);
    assert.equal(d.estimatedEnd, true);
    assert.deepEqual(d.effectiveTo, at(2026, 10, 29, 6, 0));
    assert.equal(d.permanent, false);
  });

  test('UK TRA: header "(B1234/26", radius position with DDMMSSN DDDMMSSW, and altitude in feet AMSL', () => {
    const d = decodeNotam(UK_DRONE);
    assert.equal(d.series, 'B');
    assert.equal(d.number, '1234/26');
    assert.equal(field(d, 'G'), '5000FT AMSL');
    assert.equal(d.textCoordinates.length, 1);
    near(d.textCoordinates[0].lat, dms(51, 30, 12));
    near(d.textCoordinates[0].lon, -dms(0, 5, 12), 0.0005);
    assert.match(plain(d, 'G') ?? '', /5,?000 (ft|feet) above mean sea level/i);
    assert.match(d.plainSummary, /5,?000 (ft|feet)/i);
  });
});

describe('vertical limits in F) and G)', () => {
  test('flight levels', () => {
    const d = decodeNotam(LIMITS_FL);
    assert.equal(field(d, 'F'), 'FL055');
    assert.equal(field(d, 'G'), 'FL195');
    assert.match(plain(d, 'F') ?? '', /flight level 55|FL ?055/i);
    assert.match(plain(d, 'G') ?? '', /flight level 195|FL ?195/i);
  });

  test('flight levels reach the summary of an area NOTAM', () => {
    const d = decodeNotam(LIMITS_FL);
    assert.match(d.plainSummary, /FL ?055|flight level 55/i);
    assert.match(d.plainSummary, /FL ?195|flight level 195/i);
  });

  test('feet AMSL', () => {
    const d = decodeNotam(LIMITS_FT_AMSL);
    assert.equal(field(d, 'F'), '1500FT AMSL');
    assert.equal(field(d, 'G'), '3000FT AMSL');
    assert.match(plain(d, 'F') ?? '', /1,?500 (ft|feet) above mean sea level/i);
    assert.match(plain(d, 'G') ?? '', /3,?000 (ft|feet) above mean sea level/i);
    assert.match(d.plainSummary, /1,?500 (ft|feet)/i);
    assert.match(d.plainSummary, /3,?000 (ft|feet)/i);
  });

  test('surface to feet AGL', () => {
    const d = decodeNotam(LIMITS_FT_AGL);
    assert.match(plain(d, 'F') ?? '', /surface|ground/i);
    assert.match(plain(d, 'G') ?? '', /1,?500 (ft|feet) above ground level/i);
    assert.match(d.plainSummary, /1,?500 (ft|feet)/i);
    assert.match(d.plainSummary, /above ground level|AGL/i);
  });

  test('Q-line limits stay flight-level strings regardless of F/G units', () => {
    const d = decodeNotam(LIMITS_FT_AMSL);
    assert.equal(d.qLine?.lowerFl, '000');
    assert.equal(d.qLine?.upperFl, '030');
  });
});

describe('copy-paste artefacts', () => {
  test('leading line numbers are not part of any item', () => {
    const d = decodeNotam(ART_LINE_NUMBERS);
    assert.equal(d.series, 'A');
    assert.equal(d.number, '1234/26');
    assert.equal(d.type, 'NOTAMN');
    assert.equal(field(d, 'C'), '2610290600');
    assert.equal(field(d, 'E'), 'RWY 07C/25C CLSD DUE TO MAINT');
    assert.deepEqual(d.effectiveTo, at(2026, 10, 29, 6, 0));
    assert.deepEqual(d.issues, []);
  });

  test('"1 of 3" page header before the NOTAM is ignored', () => {
    const d = decodeNotam(ART_PAGE_HEADER);
    assert.equal(d.series, 'A');
    assert.equal(d.number, '1234/26');
    assert.equal(d.type, 'NOTAMN');
    assert.deepEqual(d.issues, []);
  });

  test('airport banner line before the header is ignored', () => {
    const d = decodeNotam(ART_PREFIXED);
    assert.equal(d.series, 'A');
    assert.equal(d.number, '1234/26');
    assert.equal(field(d, 'A'), 'EDDF');
  });

  test('blank lines between items', () => {
    const d = decodeNotam(ART_BLANK_LINES);
    assert.equal(d.number, '1234/26');
    assert.deepEqual(codes(d), ['A', 'B', 'C', 'E']);
    assert.equal(field(d, 'E'), 'RWY 07C/25C CLSD DUE TO MAINT');
    assert.deepEqual(d.issues, []);
  });

  test('E hard-wrapped at 69 columns is rejoined with single spaces', () => {
    const d = decodeNotam(ART_WRAPPED);
    assert.equal(
      field(d, 'E'),
      'RWY 07C/25C CLSD DUE TO MAINTENANCE OF THE RUNWAY EDGE LIGHTS AND CENTRELINE LIGHTS. TWY A AND TWY B BTN RWY 07C/25C ALSO CLSD. CTC FRANKFURT GROUND ON 121.805 FOR TAXI INSTRUCTIONS.',
    );
    assert.match(d.plainSummary, /taxiway A and taxiway B between runway 07C\/25C/i);
    assert.match(d.plainSummary, /contact/i);
  });

  test('trailing whitespace and trailing blank lines', () => {
    const d = decodeNotam(ART_TRAILING);
    assert.equal(d.number, '1234/26');
    assert.equal(field(d, 'E'), 'RWY 07C/25C CLSD');
    assert.deepEqual(d.issues, []);
  });

  test('non-breaking spaces are treated as spaces everywhere', () => {
    const d = decodeNotam(ART_NBSP);
    assert.equal(d.series, 'A');
    assert.equal(d.type, 'NOTAMN');
    assert.equal(field(d, 'A'), 'EDDF');
    assert.equal(field(d, 'E'), 'RWY 07C/25C CLSD');
    assert.equal(d.plainSummary.includes('\u00a0'), false);
    assert.equal(d.qLine?.raw.includes('\u00a0'), false);
    assert.deepEqual(d.issues, []);
  });

  test('CRLF line endings', () => {
    const d = decodeNotam(ART_CRLF);
    assert.equal(d.number, '1234/26');
    assert.equal(field(d, 'E'), 'RWY 07C/25C CLSD');
    assert.equal(d.qLine?.upperFl, '999');
    assert.equal(d.qLine?.coordinates, '5002N00834E');
    assert.equal(d.qLine?.radiusNm, 5);
  });

  test('whole NOTAM collapsed onto one line keeps the Q-line geo part', () => {
    const d = decodeNotam(ART_ONE_LINE);
    assert.equal(d.number, '1234/26');
    assert.equal(d.qLine?.coordinates, '5002N00834E');
    assert.equal(d.qLine?.radiusNm, 5);
    near(d.qLine?.center?.lat, dms(50, 2));
    near(d.qLine?.center?.lon, dms(8, 34));
    assert.equal(field(d, 'E'), 'RWY 07C/25C CLSD DUE TO MAINT');
    assert.deepEqual(d.issues, []);
  });

  test('"SEE ITEM D) AND B) AND C) FIELDS" inside E stays in E', () => {
    const d = decodeNotam(ART_ITEM_REFS_IN_E);
    assert.deepEqual(codes(d), ['A', 'B', 'C', 'D', 'E']);
    assert.equal(field(d, 'D'), 'MON-FRI 0600-1800');
    assert.equal(field(d, 'E'), 'RWY 07C/25C CLSD OUTSIDE HOURS SEE ITEM D) AND B) AND C) FIELDS FOR TIMES.');
    assert.deepEqual(d.effectiveFrom, at(2026, 10, 28, 12, 0));
    assert.deepEqual(d.effectiveTo, at(2026, 10, 29, 6, 0));
  });
});

describe('splitNotams on mixed pastes', () => {
  test('ten mixed NOTAMs split into ten chunks, each with exactly one header', () => {
    const chunks = splitNotams(MIX);
    assert.equal(chunks.length, 10);
    const headerLine = /^\s*(?:!\S+\s+\d+\/\d+|\(?[A-Z]\d{4}\/\d{2}\s+NOTAM[NRC]|[A-Z]{4}\s+(?:RWY|TWY|AD)\b)/gm;
    for (const chunk of chunks) {
      assert.equal(chunk.match(headerLine)?.length, 1, chunk);
    }
  });

  test('chunks come back in order and without surrounding blank lines', () => {
    const chunks = splitNotams(MIX);
    assert.match(chunks[0], /^!SEA 10\/123/);
    assert.match(chunks[1], /^!FDC 6\/1234/);
    assert.match(chunks[2], /^CYVR RWY 08L\/26R/);
    assert.match(chunks[3], /^\(A1234\/26 NOTAMN/);
    assert.match(chunks[4], /^\(A1235\/26 NOTAMN/);
    assert.match(chunks[5], /^A0412\/26 NOTAMN/);
    assert.match(chunks[6], /^B1234\/26 NOTAMN/);
    assert.match(chunks[7], /^!BOS 10\/045/);
    assert.match(chunks[8], /^!DEN 10\/002/);
    assert.match(chunks[9], /^CYYZ TWY A/);
    for (const chunk of chunks) assert.equal(chunk, chunk.trim());
  });

  test('no blank lines between NOTAMs', () => {
    const chunks = splitNotams(MIX_ITEMS.join('\n'));
    assert.equal(chunks.length, 10);
  });

  test('CRLF with several blank lines between NOTAMs', () => {
    const chunks = splitNotams(MIX_ITEMS.join('\n\n\n\n').replace(/\n/g, '\r\n'));
    assert.equal(chunks.length, 10);
    for (const chunk of chunks) assert.equal(chunk.includes('\r'), false);
  });

  test('comment lines and blank-only chunks are ignored', () => {
    const chunks = splitNotams(`# Frankfurt and Seattle\n\n${FAA_RWY}\n# next\n\n   \n${EAD_PAREN}\n\n# end\n`);
    assert.equal(chunks.length, 2);
    for (const chunk of chunks) assert.doesNotMatch(chunk, /^#/m);
  });

  test('"n of m" page markers never end up inside a chunk', () => {
    const paged = `1 of 3\n${EAD_PAREN}\n\n2 of 3\n${EAD_PAREN_EST}\n\n3 of 3\n${EAD_REPLACE}`;
    const chunks = splitNotams(paged);
    assert.equal(chunks.length, 3);
    for (const chunk of chunks) assert.doesNotMatch(chunk, /\d+ of \d+/);
  });

  test('empty, whitespace-only and comment-only pastes give no chunks', () => {
    assert.deepEqual(splitNotams(''), []);
    assert.deepEqual(splitNotams('  \n\n \t\n'), []);
    assert.deepEqual(splitNotams('# nothing here\n# or here\n'), []);
    assert.deepEqual(decodeNotams(''), []);
  });

  test('a single NOTAM is one chunk', () => {
    assert.equal(splitNotams(EAD_PAREN).length, 1);
    assert.equal(splitNotams(FAA_RWY).length, 1);
  });

  test('line-numbered paste of one NOTAM is one chunk', () => {
    assert.equal(splitNotams(ART_LINE_NUMBERS).length, 1);
  });
});

describe('decodeNotams on mixed pastes', () => {
  test('ten results, each located correctly', () => {
    const decoded = decodeNotams(MIX);
    assert.equal(decoded.length, 10);
    assert.deepEqual(
      decoded.map((d) => (field(d, 'A') ?? '').split(/\s+/)[0]),
      MIX_LOCATIONS,
    );
  });

  test('headered mix: eight chunks and eight results', () => {
    assert.equal(splitNotams(MIX_HEADERED).length, 8);
    assert.equal(decodeNotams(MIX_HEADERED).length, 8);
  });

  test('headered mix: identifiers per format', () => {
    const decoded = decodeNotams(MIX_HEADERED);
    assert.match(decoded[0].number ?? '', /\b10\/123$/);
    assert.match(decoded[1].number ?? '', /\b6\/1234$/);
    assert.equal(decoded[2].series, 'A');
    assert.equal(decoded[2].number, '1234/26');
    assert.equal(decoded[3].number, '1235/26');
    assert.equal(decoded[4].number, '0412/26');
    assert.equal(decoded[5].series, 'B');
    assert.match(decoded[7].number ?? '', /\b10\/002$/);
  });

  test('headered mix: times per format', () => {
    const decoded = decodeNotams(MIX_HEADERED);
    assert.deepEqual(decoded[0].effectiveFrom, at(2026, 10, 28, 12, 0));
    assert.deepEqual(decoded[0].effectiveTo, at(2026, 10, 29, 6, 0));
    assert.deepEqual(decoded[1].effectiveFrom, at(2026, 10, 28, 20, 0));
    assert.deepEqual(decoded[1].effectiveTo, at(2026, 10, 29, 3, 0));
    assert.deepEqual(decoded[2].effectiveTo, at(2026, 10, 29, 6, 0));
    assert.deepEqual(decoded[6].effectiveTo, at(2026, 11, 1, 12, 0));
    assert.equal(decoded[6].estimatedEnd, true);
    assert.equal(decoded[7].permanent, true);
  });

  test('headered mix: no result contains another NOTAM, a stray header or a stray parenthesis', () => {
    const decoded = decodeNotams(MIX_HEADERED);
    for (const d of decoded) {
      const e = field(d, 'E') ?? '';
      assert.doesNotMatch(e, /NOTAM[NRC]/);
      assert.doesNotMatch(e, /^\s*!/);
      assert.doesNotMatch(e, /\)\s*$/);
      assert.doesNotMatch(d.plainSummary, /NOTAM[NRC]/);
      assert.equal(d.raw.split(/\n\s*\n/).length, 1);
    }
  });

  test('headered mix: Q-line centres only on results that have a Q-line', () => {
    const decoded = decodeNotams(MIX_HEADERED);
    assert.equal(decoded[0].qLine, null);
    assert.equal(decoded[1].qLine, null);
    near(decoded[2].qLine?.center?.lat, dms(50, 2));
    near(decoded[4].qLine?.center?.lat, -dms(37, 48));
    near(decoded[5].qLine?.center?.lon, -dms(0, 5));
  });

  test('headered mix: area NOTAM keeps its vertical limits', () => {
    const decoded = decodeNotams(MIX_HEADERED);
    assert.equal(field(decoded[5], 'F'), 'FL055');
    assert.equal(field(decoded[5], 'G'), 'FL195');
  });

  test('full mix: short-form NAV CANADA lines keep their own times', () => {
    const decoded = decodeNotams(MIX);
    assert.deepEqual(decoded[2]?.effectiveFrom, at(2026, 10, 28, 12, 0));
    assert.deepEqual(decoded[2]?.effectiveTo, at(2026, 10, 29, 6, 0));
    assert.deepEqual(decoded[9]?.effectiveTo, at(2026, 10, 29, 6, 0));
    assert.deepEqual(decoded[8]?.effectiveTo, null);
    assert.equal(decoded[8]?.permanent, true);
  });

  test('decodeNotams matches decodeNotam on each split chunk', () => {
    const chunks = splitNotams(MIX);
    const decoded = decodeNotams(MIX);
    assert.equal(decoded.length, chunks.length);
    decoded.forEach((d, i) => assert.deepEqual(d, decodeNotam(chunks[i])));
  });

  test('paginated paste decodes to three clean NOTAMs', () => {
    const paged = `1 of 3\n${EAD_PAREN}\n\n2 of 3\n${EAD_PAREN_EST}\n\n3 of 3\n${EAD_REPLACE}`;
    const decoded = decodeNotams(paged);
    assert.equal(decoded.length, 3);
    assert.equal(field(decoded[0], 'E'), 'RWY 07C/25C CLSD DUE TO MAINT.');
    assert.equal(field(decoded[1], 'E'), 'RWY 07C/25C CLSD DUE TO MAINT');
    assert.equal(field(decoded[2], 'E'), 'TWY N5 CLSD');
    for (const d of decoded) assert.deepEqual(d.issues, []);
  });
});
