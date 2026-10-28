import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { decodeNotam, formatNotamTime } from '../../src/lib/notam.ts';

const FIXTURE_PATH = join(import.meta.dirname, 'fixtures', 'notams.txt');

interface Fixture {
  id: string;
  raw: string;
  series: string;
  number: string;
  type: 'NOTAMN' | 'NOTAMR' | 'NOTAMC';
  ref: string | null;
  items: Record<string, string>;
}

function loadFixtures(): Fixture[] {
  const chunks = readFileSync(FIXTURE_PATH, 'utf8')
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((c) => c.trim())
    .filter(Boolean);
  return chunks.map((raw) => {
    const lines = raw.split('\n');
    const header = /^([A-Z])(\d{4}\/\d{2}) (NOTAM[NRC])(?: ([A-Z]\d{4}\/\d{2}))?$/.exec(lines[0]);
    assert.ok(header, `bad fixture header: ${lines[0]}`);
    const items: Record<string, string> = {};
    for (const line of lines.slice(1)) {
      const m = /^([QABCDEFG])\)\s*(.*)$/.exec(line);
      if (m) items[m[1]] = m[2].trim();
    }
    return {
      id: `${header[1]}${header[2]}`,
      raw,
      series: header[1],
      number: header[2],
      type: header[3] as Fixture['type'],
      ref: header[4] ?? null,
      items,
    };
  });
}

const fixtures = loadFixtures();
const byId = new Map(fixtures.map((f) => [f.id, f]));

function fx(id: string): Fixture {
  const f = byId.get(id);
  assert.ok(f, `missing fixture ${id}`);
  return f;
}

function shortId(f: Fixture): string {
  return f.id.replace('/26', '');
}

function parseTime(token: string) {
  const m = /^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/.exec(token);
  assert.ok(m, `bad time ${token}`);
  return { year: 2000 + Number(m[1]), month: Number(m[2]), day: Number(m[3]), hour: Number(m[4]), minute: Number(m[5]) };
}

function qParts(f: Fixture) {
  const p = f.items.Q.split('/');
  const geo = /^(\d{2})(\d{2})([NS])(\d{3})(\d{2})([EW])(\d{3})$/.exec(p[7]);
  assert.ok(geo, `bad geo ${p[7]}`);
  const lat = (Number(geo[1]) + Number(geo[2]) / 60) * (geo[3] === 'S' ? -1 : 1);
  const lon = (Number(geo[4]) + Number(geo[5]) / 60) * (geo[6] === 'W' ? -1 : 1);
  return { fir: p[0], traffic: p[2], purpose: p[3], scope: p[4], lower: p[5], upper: p[6], lat, lon, radius: Number(geo[7]) };
}

function dms(raw: string) {
  const m = /^(\d{2})(\d{2})(\d{2})([NS])\s*(\d{3})(\d{2})(\d{2})([EW])$/.exec(raw);
  assert.ok(m, `bad dms ${raw}`);
  const lat = (Number(m[1]) + Number(m[2]) / 60 + Number(m[3]) / 3600) * (m[4] === 'S' ? -1 : 1);
  const lon = (Number(m[5]) + Number(m[6]) / 60 + Number(m[7]) / 3600) * (m[8] === 'W' ? -1 : 1);
  return { lat, lon };
}

function near(actual: number, expected: number, label: string) {
  assert.ok(Math.abs(actual - expected) < 1e-6, `${label}: expected ${expected}, got ${actual}`);
}

function word(token: string): RegExp {
  return new RegExp(`(^|[^A-Za-z0-9])${token.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}($|[^A-Za-z0-9])`);
}

const TEXT_COORDS: Record<string, string[]> = {
  'A9038/26': ['491230N 1231020W'],
  'A9051/26': ['491245N 1231020W'],
  'A9052/26': ['533800N 1133600W'],
  'A9054/26': ['434015N 0793720W'],
  'A9065/26': ['602255N 1350420W'],
  'A9095/26': ['510812N 1140020W'],
};

const PERMANENT = new Set(['A9051/26', 'A9052/26', 'A9056/26', 'A9057/26', 'A9058/26', 'A9060/26', 'A9061/26', 'A9065/26']);
const ESTIMATED = new Set(['A9031/26', 'A9036/26', 'A9041/26', 'A9046/26']);
const NO_TIMES = new Set(['A9097/26', 'A9099/26']);
const XX_CONDITION = ['A9044/26', 'A9049/26', 'A9053/26', 'A9057/26', 'A9058/26', 'A9063/26'];
const ON_REQ = ['A9002/26', 'A9005/26', 'A9008/26', 'A9011/26', 'A9014/26', 'A9017/26', 'A9020/26', 'A9023/26', 'A9026/26', 'A9029/26'];
const LIMIT_FIXTURES = fixtures.filter((f) => f.items.F !== undefined && f.items.G !== undefined);

const SUBJECT_CONDITION: Record<string, [string, string]> = {
  'A9001/26': ['Runway', 'Closed'],
  'A9002/26': ['Taxiway', 'Closed'],
  'A9003/26': ['Apron', 'Closed'],
  'A9031/26': ['Instrument landing system', 'Unserviceable'],
  'A9032/26': ['VOR', 'Unserviceable'],
  'A9033/26': ['Non-directional beacon (NDB)', 'Unserviceable'],
  'A9034/26': ['Distance measuring equipment (DME)', 'Unserviceable'],
  'A9035/26': ['Runway edge lights', 'Unserviceable'],
  'A9036/26': ['Runway centre line lights', 'Unserviceable'],
  'A9037/26': ['Runway touchdown zone lights', 'Unserviceable'],
  'A9038/26': ['Obstacle lights', 'Unserviceable'],
  'A9039/26': ['Fire fighting and rescue', 'Unserviceable'],
  'A9040/26': ['Fuel availability', 'Not available'],
  'A9041/26': ['Automatic terminal information service (ATIS)', 'Unserviceable'],
  'A9042/26': ['Aerodrome control tower', 'Unserviceable'],
  'A9043/26': ['Aircraft de-icing', 'Not available'],
  'A9045/26': ['Aerodrome', 'Closed'],
  'A9046/26': ['Runway', 'Closed to IFR operations'],
  'A9047/26': ['Runway', 'Closed to all night operations'],
  'A9049/26': ['Customs and immigration', 'See the plain-language text'],
  'A9051/26': ['Obstacle', 'Erected'],
  'A9052/26': ['Obstacle', 'Changed'],
  'A9054/26': ['Obstacle lights', 'Unserviceable'],
  'A9055/26': ['Instrument approach procedure', 'Changed'],
  'A9056/26': ['Standard instrument departure (SID)', 'Changed'],
  'A9066/26': ['Unmanned aircraft', 'Will take place'],
  'A9067/26': ['Aerial survey', 'Will take place'],
  'A9068/26': ['Parachute jumping, paragliding or hang gliding', 'Will take place'],
  'A9069/26': ['Aerobatics', 'Will take place'],
  'A9071/26': ['Temporary restricted area', 'Activated'],
  'A9072/26': ['Air display', 'Will take place'],
  'A9073/26': ['Model flying', 'Will take place'],
  'A9074/26': ['Captive balloon or kite', 'Will take place'],
  'A9075/26': ['Demolition of explosives', 'Will take place'],
  'A9076/26': ['Missile, gun or rocket firing', 'Will take place'],
  'A9077/26': ['Glider flying', 'Will take place'],
  'A9078/26': ['Air refuelling', 'Will take place'],
  'A9079/26': ['Ascent of free balloon', 'Will take place'],
  'A9080/26': ['Formation flight', 'Will take place'],
  'A9082/26': ['Restricted area', 'Activated'],
  'A9097/26': ['Taxiway', 'Cancelled'],
  'A9099/26': ['Obstacle', 'Cancelled'],
};

const TRAFFIC: Record<string, string> = { I: 'IFR', V: 'VFR', IV: 'IFR and VFR' };
const PURPOSE: Record<string, string> = {
  NBO: 'immediate attention, briefing pack, operationally significant',
  BO: 'briefing pack, operationally significant',
  M: 'miscellaneous',
};
const SCOPE: Record<string, string> = { A: 'aerodrome', AE: 'aerodrome and en route', W: 'navigation warning' };

const ALLOWED_CAPS = new Set([
  'ATC', 'AIP', 'ATIS', 'METAR', 'SPECI', 'RNAV', 'GNSS', 'VOR', 'DME', 'NDB', 'ILS', 'UTC', 'NOTAM',
  'IFR', 'VFR', 'SID', 'STAR', 'ABC', 'XYZ', 'BRAVO', 'DELTA', 'ALPHA',
]);

const RAW_CONTRACTIONS = [
  'APN', 'THRU', 'PN', 'RFFS', 'PJE', 'UAS', 'MIL', 'CAT', 'AUTH', 'HOL', 'NE', 'REQ', 'WI', 'EXC',
  'TEMPO', 'MHZ', 'KHZ', 'APP', 'ACC', 'MON-FRI', 'DAILY', 'SFC', 'AMSL', 'AGL', 'U/S', 'ACFT', 'OPS',
  'BTN', 'TWY', 'RWY', 'CLSD', 'AVBL', 'MAINT', 'HGT', 'ELEV', 'LGTD', 'OBST', 'EST', 'FLT', 'APCH',
];

const EXPECTED_PHRASES: Array<[string, RegExp]> = [
  ['A9001/26', /work in progress/i],
  ['A9003/26', /apron stand 12 through 14/i],
  ['A9031/26', /RNAV approach available/i],
  ['A9032/26', /113\.20 MHz/],
  ['A9033/26', /329 kHz/],
  ['A9035/26', /day operations only/i],
  ['A9039/26', /category 5/i],
  ['A9039/26', /category 6/i],
  ['A9041/26', /127\.15 MHz/],
  ['A9042/26', /approach control/i],
  ['A9042/26', /area control/i],
  ['A9048/26', /reopening time estimated/i],
  ['A9051/26', /285 ?(ft|feet) above ground level/i],
  ['A9051/26', /512 ?(ft|feet) above mean sea level/i],
  ['A9055/26', /RNAV \(GNSS\)/],
  ['A9058/26', /40 ?(m|metres|meters)\b/i],
  ['A9060/26', /northeast of aerodrome/i],
  ['A9060/26', /0\.8 ?(NM|nautical miles?)/i],
  ['A9064/26', /Monday to Friday/i],
  ['A9064/26', /except holidays?/i],
  ['A9066/26', /unmanned aircraft system/i],
  ['A9068/26', /parachute jumping exercise/i],
  ['A9071/26', /temporary restricted area/i],
  ['A9071/26', /prior authori[sz]ation/i],
  ['A9078/26', /military aircraft/i],
  ['A9081/26', /military exercise/i],
  ['A9084/26', /unmanned aircraft systems? may operate/i],
  ['A9094/26', /rescue and fire ?fighting service/i],
  ['A9094/26', /category 7/i],
  ['A9094/26', /category 8/i],
  ['A9094/26', /30 minutes/i],
  ['A9094/26', /prior notice/i],
  ...ON_REQ.map((id): [string, RegExp] => [id, /follow-me available on request/i]),
];

describe('fixture set', () => {
  test('contains 100 NOTAMs numbered A9001/26 to A9100/26', () => {
    assert.equal(fixtures.length, 100);
    fixtures.forEach((f, i) => assert.equal(f.id, `A${String(9001 + i)}/26`));
  });
});

describe('structure and issues', () => {
  for (const f of fixtures) {
    if (f.id === 'A9064/26') continue;
    test(`${f.id} decodes with no issues`, () => {
      const d = decodeNotam(f.raw);
      assert.deepEqual(d.issues, []);
      assert.equal(d.unstructured, false);
    });
  }

  test('A9064/26 uses QFXXX, whose subject FX is not an ICAO subject, and is the only expected warning', () => {
    const d = decodeNotam(fx('A9064/26').raw);
    assert.equal(d.qLine?.subjectCode, 'FX');
    assert.deepEqual(
      d.issues.map((i) => [i.severity, i.code, i.field]),
      [['warning', 'q-code-unknown', 'Q']],
    );
  });

  for (const f of fixtures) {
    test(`${f.id} header`, () => {
      const d = decodeNotam(f.raw);
      assert.equal(d.series, f.series);
      assert.equal(d.number, f.number);
      assert.equal(d.type, f.type);
      assert.equal(d.replaces, f.ref);
    });
  }

  for (const f of fixtures) {
    test(`${f.id} field items are captured verbatim`, () => {
      const d = decodeNotam(f.raw);
      for (const code of ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const) {
        const field = d.fields.find((x) => x.code === code);
        if (f.items[code] === undefined) {
          assert.equal(field, undefined, `unexpected ${code}) field`);
        } else {
          assert.ok(field, `missing ${code}) field`);
          assert.equal(field.raw, f.items[code]);
        }
      }
    });
  }
});

describe('Q-line', () => {
  for (const f of fixtures) {
    test(`${f.id} Q-line parts and centre`, () => {
      const d = decodeNotam(f.raw);
      const q = qParts(f);
      assert.ok(d.qLine);
      assert.equal(d.qLine.fir, q.fir);
      assert.equal(d.qLine.traffic, q.traffic);
      assert.equal(d.qLine.trafficPlain, TRAFFIC[q.traffic]);
      assert.equal(d.qLine.purpose, q.purpose);
      assert.equal(d.qLine.purposePlain, PURPOSE[q.purpose]);
      assert.equal(d.qLine.scope, q.scope);
      assert.equal(d.qLine.scopePlain, SCOPE[q.scope]);
      assert.equal(d.qLine.lowerFl, q.lower);
      assert.equal(d.qLine.upperFl, q.upper);
      assert.equal(d.qLine.radiusNm, q.radius);
      assert.ok(d.qLine.center, 'centre missing');
      near(d.qLine.center.lat, q.lat, 'lat');
      near(d.qLine.center.lon, q.lon, 'lon');
    });
  }

  for (const [id, [subject, condition]] of Object.entries(SUBJECT_CONDITION)) {
    test(`${id} subject "${subject}" and condition "${condition}"`, () => {
      const d = decodeNotam(fx(id).raw);
      assert.equal(d.qLine?.subjectPlain, subject);
      assert.equal(d.qLine?.conditionPlain, condition);
    });
  }

  for (const f of fixtures) {
    const code = f.items.Q.split('/')[1];
    test(`${f.id} Q-code ${code} splits into subject and condition`, () => {
      const d = decodeNotam(f.raw);
      assert.equal(d.qLine?.subjectCode, code.slice(1, 3));
      assert.equal(d.qLine?.conditionCode, code.slice(3, 5));
    });
  }
});

describe('times', () => {
  for (const f of fixtures) {
    test(`${f.id} effectiveFrom, effectiveTo, estimated and permanent`, () => {
      const d = decodeNotam(f.raw);
      if (NO_TIMES.has(f.id)) {
        assert.equal(d.effectiveFrom, null);
        assert.equal(d.effectiveTo, null);
        assert.equal(d.estimatedEnd, false);
        assert.equal(d.permanent, false);
        return;
      }
      assert.deepEqual(d.effectiveFrom, parseTime(f.items.B));
      assert.equal(d.permanent, PERMANENT.has(f.id));
      assert.equal(d.estimatedEnd, ESTIMATED.has(f.id));
      if (PERMANENT.has(f.id)) {
        assert.equal(d.effectiveTo, null);
      } else {
        assert.deepEqual(d.effectiveTo, parseTime(f.items.C));
      }
    });
  }
});

describe('D) schedules', () => {
  for (const f of fixtures.filter((x) => x.items.D !== undefined)) {
    test(`${f.id} schedule "${f.items.D}" is expanded and reaches the summary`, () => {
      const d = decodeNotam(f.raw);
      const field = d.fields.find((x) => x.code === 'D');
      assert.ok(field);
      const [days, window] = f.items.D.split(' ');
      const [start, end] = window.split('-');
      const dayWord = days === 'DAILY' ? /daily/i : /Monday to Friday/i;
      assert.ok(!/DAILY|MON-FRI/.test(field.plain), `D plain still has raw contraction: ${field.plain}`);
      assert.match(field.plain, dayWord);
      for (const text of [field.plain, d.plainSummary]) {
        const digits = text.replace(/[:\s]/g, '');
        assert.ok(digits.includes(start) && digits.includes(end), `schedule ${window} missing in: ${text}`);
      }
      assert.match(d.plainSummary, dayWord);
    });
  }
});

describe('F) and G) limits', () => {
  for (const f of LIMIT_FIXTURES) {
    test(`${f.id} lower and upper limits are plain English and reach the summary`, () => {
      const d = decodeNotam(f.raw);
      const lower = d.fields.find((x) => x.code === 'F');
      const upper = d.fields.find((x) => x.code === 'G');
      assert.ok(lower && upper);
      assert.match(lower.plain, /surface/i);
      assert.ok(!/SFC/.test(lower.plain), lower.plain);
      assert.match(upper.plain, /8,?000 ?(ft|feet) above mean sea level/i);
      assert.ok(!/AMSL|08000FT/.test(upper.plain), upper.plain);
      assert.match(d.plainSummary, /surface/i);
      assert.match(d.plainSummary, /8,?000 ?(ft|feet)/i);
    });
  }
});

describe('NOTAMR and NOTAMC', () => {
  for (const f of fixtures.filter((x) => x.type === 'NOTAMR')) {
    test(`${f.id} summary says it replaces ${f.ref}`, () => {
      const d = decodeNotam(f.raw);
      assert.equal(d.replaces, f.ref);
      assert.ok(d.plainSummary.includes(f.ref!), d.plainSummary);
      assert.match(d.plainSummary, /replac/i);
      assert.match(d.plainSummary, /In effect from/);
    });
  }

  for (const f of fixtures.filter((x) => x.type === 'NOTAMC')) {
    test(`${f.id} summary says it cancels ${f.ref}`, () => {
      const d = decodeNotam(f.raw);
      assert.equal(d.replaces, f.ref);
      assert.equal(d.effectiveFrom, null);
      assert.equal(d.effectiveTo, null);
      assert.ok(d.plainSummary.includes(f.ref!), d.plainSummary);
      assert.match(d.plainSummary, /cancel/i);
      assert.ok(!/ cancelled:/i.test(d.plainSummary), d.plainSummary);
      assert.ok(!/In effect/.test(d.plainSummary), d.plainSummary);
    });
  }
});

describe('coordinates in E)', () => {
  for (const f of fixtures) {
    const expected = TEXT_COORDS[f.id] ?? [];
    test(`${f.id} textCoordinates has ${expected.length} entr${expected.length === 1 ? 'y' : 'ies'}`, () => {
      const d = decodeNotam(f.raw);
      assert.ok(Array.isArray(d.textCoordinates), 'textCoordinates missing');
      assert.equal(d.textCoordinates.length, expected.length);
      expected.forEach((raw, i) => {
        const want = dms(raw);
        assert.equal(d.textCoordinates[i].raw.replace(/\s+/g, ''), raw.replace(/\s+/g, ''));
        near(d.textCoordinates[i].lat, want.lat, 'lat');
        near(d.textCoordinates[i].lon, want.lon, 'lon');
      });
    });
  }
});

describe('summary wording', () => {
  for (const f of fixtures) {
    test(`${f.id} summary punctuation and structure`, () => {
      const s = decodeNotam(f.raw).plainSummary;
      assert.ok(!/ {2,}/.test(s), `double space in: ${s}`);
      assert.ok(!/\.\.|\s[.,;:]/.test(s), `stray punctuation in: ${s}`);
      assert.ok(s.endsWith('.'), `no final full stop: ${s}`);
      assert.ok(!/in effect in effect/i.test(s), `doubled "in effect": ${s}`);
      const at = s.indexOf(' In effect');
      if (at >= 0) assert.equal(s[at - 1], '.', `no full stop before "In effect": ${s}`);
      assert.match(s, /^[A-Z]/);
    });
  }

  for (const f of fixtures.filter((x) => x.type !== 'NOTAMC')) {
    test(`${f.id} summary states the effective period`, () => {
      const d = decodeNotam(f.raw);
      const from = formatNotamTime(d.effectiveFrom!);
      assert.ok(d.plainSummary.includes(`In effect from ${from}`), d.plainSummary);
      if (d.permanent) {
        assert.match(d.plainSummary, /permanent|no (scheduled )?end/i);
      } else {
        assert.ok(d.plainSummary.includes(`to ${formatNotamTime(d.effectiveTo!)}`), d.plainSummary);
        if (d.estimatedEnd) assert.match(d.plainSummary, /\(estimated\)/);
      }
    });
  }

  for (const id of XX_CONDITION) {
    test(`${id} summary does not read the XX condition out as a status`, () => {
      const d = decodeNotam(fx(id).raw);
      assert.equal(d.qLine?.conditionCode, 'XX');
      assert.ok(!/plain-language text/i.test(d.plainSummary), d.plainSummary);
    });
  }

  for (const f of fixtures) {
    test(`${f.id} acronyms keep their capitals in the summary`, () => {
      const s = decodeNotam(f.raw).plainSummary;
      assert.ok(!/\b(vor|dme|ndb|ifr|vfr|sid|atis|ils|atc|aip)\b/.test(s), s);
    });
  }

  for (const f of fixtures) {
    test(`${f.id} summary has no shouted English words`, () => {
      const s = decodeNotam(f.raw).plainSummary;
      const location = f.items.A;
      const shouted = (s.match(/\b[A-Z]{3,}\b/g) ?? []).filter((t) => !ALLOWED_CAPS.has(t) && t !== location);
      assert.deepEqual(shouted, [], s);
    });
  }

  for (const f of fixtures) {
    const body = [f.items.D, f.items.E, f.items.F, f.items.G].filter(Boolean).join(' ');
    const present = RAW_CONTRACTIONS.filter((t) => word(t).test(body));
    if (present.length === 0) continue;
    test(`${f.id} contractions ${present.join(' ')} are expanded in the summary`, () => {
      const s = decodeNotam(f.raw).plainSummary;
      const left = present.filter((t) => word(t).test(s));
      assert.deepEqual(left, [], s);
    });
  }

  for (const f of fixtures) {
    test(`${f.id} units are spaced from their numbers`, () => {
      const s = decodeNotam(f.raw).plainSummary;
      assert.ok(!/\d(FT|NM|KT)\b/.test(s), s);
      assert.ok(!/\b\d+M\b/.test(s), s);
    });
  }

  for (const [id, pattern] of EXPECTED_PHRASES) {
    test(`${id} summary matches ${pattern}`, () => {
      const s = decodeNotam(fx(id).raw).plainSummary;
      assert.match(s, pattern);
    });
  }

  for (const id of ['A9066/26', 'A9074/26']) {
    test(`${id} lead does not say an aircraft or balloon "will take place"`, () => {
      const s = decodeNotam(fx(id).raw).plainSummary;
      assert.ok(!/\b(aircraft|kite|balloon) will take place/i.test(s), s);
    });
  }

  test('REQ in "ON REQ" is expanded as request, not require', () => {
    for (const id of ON_REQ) {
      const s = decodeNotam(fx(id).raw).plainSummary;
      assert.ok(!/\bon require\b/i.test(s), `${id}: ${s}`);
    }
  });
});

describe('unrecognisedTokens', () => {
  for (const f of fixtures) {
    test(`${f.id} has no unrecognised tokens`, () => {
      assert.deepEqual(decodeNotam(f.raw).unrecognisedTokens, []);
    });
  }
});
