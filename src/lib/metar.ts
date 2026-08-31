export type TokenKind =
  | 'type'
  | 'station'
  | 'time'
  | 'modifier'
  | 'wind'
  | 'wind-var'
  | 'wind-shear'
  | 'visibility'
  | 'rvr'
  | 'weather'
  | 'sky'
  | 'temp'
  | 'pressure'
  | 'trend'
  | 'valid'
  | 'period'
  | 'remark'
  | 'unknown';

export interface ReportToken {
  raw: string;
  start: number;
  end: number;
  kind: TokenKind;
  label: string;
  plain: string;
}

export type CloudCover = 'SKC' | 'CLR' | 'NSC' | 'NCD' | 'FEW' | 'SCT' | 'BKN' | 'OVC' | 'VV';

export interface CloudLayer {
  cover: CloudCover;
  coverLabel: string;
  oktas: number | null;
  baseFt: number | null;
  type: 'CB' | 'TCU' | null;
  typeLabel: string | null;
  raw: string;
}

export interface Wind {
  directionDeg: number | null;
  variable: boolean;
  speed: number | null;
  gust: number | null;
  unit: 'KT' | 'MPS' | 'KMH';
  speedKt: number | null;
  gustKt: number | null;
  varyFrom: number | null;
  varyTo: number | null;
  calm: boolean;
  raw: string;
}

export interface Visibility {
  meters: number | null;
  statuteMiles: number | null;
  greaterThan: boolean;
  lessThan: boolean;
  cavok: boolean;
  raw: string;
  text: string;
}

export interface RunwayVisualRange {
  runway: string;
  min: number | null;
  max: number | null;
  unit: 'FT' | 'M';
  modifier: 'M' | 'P' | null;
  trend: 'U' | 'D' | 'N' | null;
  text: string;
  raw: string;
}

export interface WeatherPhenomenon {
  raw: string;
  intensity: string | null;
  descriptor: string | null;
  precipitation: string[];
  obscuration: string | null;
  other: string | null;
  text: string;
}

export interface WindShear {
  heightFt: number | null;
  runway: string | null;
  wind: Wind | null;
  text: string;
  raw: string;
}

export interface ReportTime {
  day: number;
  hour: number;
  minute: number;
}

export interface RemarkItem {
  code: string;
  label: string;
  plain: string;
}

export interface Conditions {
  wind: Wind | null;
  visibility: Visibility | null;
  weather: WeatherPhenomenon[];
  clouds: CloudLayer[];
  cavok: boolean;
  windShear: WindShear | null;
}

export interface DecodedMetar extends Conditions {
  raw: string;
  type: 'METAR' | 'SPECI';
  station: string | null;
  time: ReportTime | null;
  auto: boolean;
  corrected: boolean;
  rvr: RunwayVisualRange[];
  temperatureC: number | null;
  dewpointC: number | null;
  altimeterInHg: number | null;
  altimeterHpa: number | null;
  seaLevelPressureHpa: number | null;
  trend: string | null;
  remarks: string | null;
  remarkItems: RemarkItem[];
  tokens: ReportToken[];
  warnings: string[];
}

export type TafPeriodKind = 'INITIAL' | 'FM' | 'TEMPO' | 'BECMG' | 'PROB' | 'INTER';

export interface TafPeriod extends Conditions {
  kind: TafPeriodKind;
  kindLabel: string;
  probability: number | null;
  from: ReportTime | null;
  to: ReportTime | null;
  raw: string;
}

export interface DecodedTaf {
  raw: string;
  station: string | null;
  issued: ReportTime | null;
  validFrom: ReportTime | null;
  validTo: ReportTime | null;
  amended: boolean;
  corrected: boolean;
  periods: TafPeriod[];
  tokens: ReportToken[];
  warnings: string[];
}

const COVER_LABEL: Record<CloudCover, string> = {
  SKC: 'Sky clear',
  CLR: 'Clear below 12,000 ft',
  NSC: 'No significant cloud',
  NCD: 'No cloud detected',
  FEW: 'Few',
  SCT: 'Scattered',
  BKN: 'Broken',
  OVC: 'Overcast',
  VV: 'Vertical visibility',
};

const COVER_OKTAS: Record<CloudCover, number | null> = {
  SKC: 0,
  CLR: 0,
  NSC: 0,
  NCD: 0,
  FEW: 2,
  SCT: 4,
  BKN: 6,
  OVC: 8,
  VV: null,
};

const INTENSITY: Record<string, string> = {
  '-': 'Light',
  '+': 'Heavy',
  VC: 'In the vicinity',
};

const DESCRIPTOR: Record<string, string> = {
  MI: 'shallow',
  PR: 'partial',
  BC: 'patches of',
  DR: 'low drifting',
  BL: 'blowing',
  SH: 'showers of',
  TS: 'thunderstorm with',
  FZ: 'freezing',
};

const PRECIPITATION: Record<string, string> = {
  DZ: 'drizzle',
  RA: 'rain',
  SN: 'snow',
  SG: 'snow grains',
  IC: 'ice crystals',
  PL: 'ice pellets',
  GR: 'hail',
  GS: 'small hail / snow pellets',
  UP: 'unknown precipitation',
};

const OBSCURATION: Record<string, string> = {
  BR: 'mist',
  FG: 'fog',
  FU: 'smoke',
  VA: 'volcanic ash',
  DU: 'widespread dust',
  SA: 'sand',
  HZ: 'haze',
  PY: 'spray',
};

const OTHER: Record<string, string> = {
  PO: 'dust/sand whirls',
  SQ: 'squalls',
  FC: 'funnel cloud',
  SS: 'sandstorm',
  DS: 'duststorm',
};

const KT_PER_MPS = 1.943844;
const KT_PER_KMH = 0.539957;

export function toKnots(speed: number | null, unit: 'KT' | 'MPS' | 'KMH'): number | null {
  if (speed == null) return null;
  if (unit === 'MPS') return Math.round(speed * KT_PER_MPS);
  if (unit === 'KMH') return Math.round(speed * KT_PER_KMH);
  return speed;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function compassPoint(deg: number): string {
  const points = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return points[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16];
}

export function resolveTime(time: ReportTime | null, reference: Date = new Date()): Date | null {
  if (!time) return null;
  const d = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), time.day, time.hour, time.minute));
  const diffDays = (d.getTime() - reference.getTime()) / 86400000;
  if (diffDays > 20) d.setUTCMonth(d.getUTCMonth() - 1);
  else if (diffDays < -20) d.setUTCMonth(d.getUTCMonth() + 1);
  return d;
}

function tokenizeRaw(raw: string): Array<{ text: string; start: number; end: number }> {
  const out: Array<{ text: string; start: number; end: number }> = [];
  const re = /\S+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    out.push({ text: m[0], start: m.index, end: m.index + m[0].length });
  }
  return out;
}

const WIND_RE = /^(\d{3}|VRB|\/{3})(\d{2,3}|\/{2})(?:G(\d{2,3}))?(KT|MPS|KMH)$/;

function parseWind(text: string): Wind | null {
  const m = WIND_RE.exec(text);
  if (!m) return null;
  const unit = m[4] as 'KT' | 'MPS' | 'KMH';
  const variable = m[1] === 'VRB';
  const directionDeg = variable || m[1] === '///' ? null : parseInt(m[1], 10);
  const speed = m[2] === '//' ? null : parseInt(m[2], 10);
  const gust = m[3] ? parseInt(m[3], 10) : null;
  return {
    directionDeg,
    variable,
    speed,
    gust,
    unit,
    speedKt: toKnots(speed, unit),
    gustKt: toKnots(gust, unit),
    varyFrom: null,
    varyTo: null,
    calm: speed === 0,
    raw: text,
  };
}

export function windText(wind: Wind): string {
  if (wind.calm) return 'Calm';
  const unitWord = wind.unit === 'KT' ? 'knots' : wind.unit === 'MPS' ? 'm/s' : 'km/h';
  const speed = wind.speed == null ? 'an unmeasured speed' : `${wind.speed} ${unitWord}`;
  const dir = wind.variable
    ? 'Variable direction'
    : wind.directionDeg == null
      ? 'Unknown direction'
      : `From ${pad2(wind.directionDeg)}° (${compassPoint(wind.directionDeg)})`;
  let out = `${dir} at ${speed}`;
  if (wind.gust != null) out += `, gusting ${wind.gust}`;
  if (wind.varyFrom != null && wind.varyTo != null) out += `, varying between ${wind.varyFrom}° and ${wind.varyTo}°`;
  return out;
}

const VIS_SM_RE = /^(M|P)?(\d{1,2})(?:\/(\d{1,2}))?SM$/;
const VIS_METERS_RE = /^(\d{4})(NDV|[NSEW]{1,2})?$/;

function parseVisibilitySm(text: string, wholePrefix?: string): Visibility | null {
  const m = VIS_SM_RE.exec(text);
  if (!m) return null;
  const numerator = parseInt(m[2], 10);
  const denominator = m[3] ? parseInt(m[3], 10) : null;
  let miles = denominator ? numerator / denominator : numerator;
  if (wholePrefix) miles += parseInt(wholePrefix, 10);
  const raw = wholePrefix ? `${wholePrefix} ${text}` : text;
  return {
    meters: Math.round(miles * 1609.344),
    statuteMiles: miles,
    greaterThan: m[1] === 'P',
    lessThan: m[1] === 'M',
    cavok: false,
    raw,
    text: `${m[1] === 'P' ? 'Greater than ' : m[1] === 'M' ? 'Less than ' : ''}${formatMiles(miles)} statute miles`,
  };
}

function parseVisibilityMeters(text: string): Visibility | null {
  const m = VIS_METERS_RE.exec(text);
  if (!m) return null;
  const meters = parseInt(m[1], 10);
  const unlimited = meters === 9999;
  return {
    meters: unlimited ? 10000 : meters,
    statuteMiles: (unlimited ? 10000 : meters) / 1609.344,
    greaterThan: unlimited,
    lessThan: false,
    cavok: false,
    raw: text,
    text: unlimited
      ? '10 km or more'
      : `${meters.toLocaleString('en-US')} metres${m[2] && m[2] !== 'NDV' ? ` toward the ${m[2]}` : ''}`,
  };
}

export function formatMiles(miles: number): string {
  if (Number.isInteger(miles)) return String(miles);
  const whole = Math.floor(miles);
  const frac = miles - whole;
  const known: Array<[number, string]> = [
    [0.125, '1/8'],
    [0.25, '1/4'],
    [0.375, '3/8'],
    [0.5, '1/2'],
    [0.625, '5/8'],
    [0.75, '3/4'],
    [0.875, '7/8'],
  ];
  const hit = known.find(([value]) => Math.abs(value - frac) < 0.01);
  if (!hit) return miles.toFixed(2).replace(/0$/, '');
  return whole > 0 ? `${whole} ${hit[1]}` : hit[1];
}

const RVR_RE = /^R(\d{2}[LCR]?)\/([MP])?(\d{3,4})(?:V([MP])?(\d{3,4}))?(FT)?\/?([UDN])?$/;

function parseRvr(text: string): RunwayVisualRange | null {
  const m = RVR_RE.exec(text);
  if (!m) return null;
  const unit: 'FT' | 'M' = m[6] === 'FT' ? 'FT' : 'M';
  const min = parseInt(m[3], 10);
  const max = m[5] ? parseInt(m[5], 10) : null;
  const modifier = (m[2] || m[4] || null) as 'M' | 'P' | null;
  const unitWord = unit === 'FT' ? 'ft' : 'm';
  const trend = (m[7] || null) as 'U' | 'D' | 'N' | null;
  const trendWord = trend === 'U' ? ', improving' : trend === 'D' ? ', deteriorating' : trend === 'N' ? ', no change' : '';
  const value = max != null
    ? `varying between ${min.toLocaleString('en-US')} and ${max.toLocaleString('en-US')} ${unitWord}`
    : `${modifier === 'M' ? 'less than ' : modifier === 'P' ? 'greater than ' : ''}${min.toLocaleString('en-US')} ${unitWord}`;
  return {
    runway: m[1],
    min,
    max,
    unit,
    modifier,
    trend,
    text: `Runway ${m[1]} visual range ${value}${trendWord}`,
    raw: text,
  };
}

const WEATHER_RE =
  /^(-|\+|VC)?(MI|PR|BC|DR|BL|SH|TS|FZ)?((?:DZ|RA|SN|SG|IC|PL|GR|GS|UP)+)?(BR|FG|FU|VA|DU|SA|HZ|PY)?(PO|SQ|FC|SS|DS)?$/;

function parseWeather(text: string): WeatherPhenomenon | null {
  if (text === 'NSW') {
    return {
      raw: text,
      intensity: null,
      descriptor: null,
      precipitation: [],
      obscuration: null,
      other: null,
      text: 'No significant weather',
    };
  }
  const body = text.startsWith('RE') ? text.slice(2) : text;
  const m = WEATHER_RE.exec(body);
  if (!m) return null;
  const [, intensity, descriptor, precipRun, obscuration, other] = m;
  if (!descriptor && !precipRun && !obscuration && !other) return null;

  const precipitation: string[] = [];
  if (precipRun) {
    for (let i = 0; i < precipRun.length; i += 2) precipitation.push(precipRun.slice(i, i + 2));
  }

  if (intensity === '+' && other === 'FC') {
    return {
      raw: text,
      intensity,
      descriptor: descriptor || null,
      precipitation,
      obscuration: obscuration || null,
      other,
      text: 'Tornado or waterspout',
    };
  }

  const words: string[] = [];
  if (intensity && intensity !== 'VC') words.push(INTENSITY[intensity]);
  if (descriptor) words.push(DESCRIPTOR[descriptor]);
  if (precipitation.length) words.push(precipitation.map((code) => PRECIPITATION[code]).join(' and '));
  if (obscuration) words.push(OBSCURATION[obscuration]);
  if (other) words.push(OTHER[other]);
  let sentence = words.join(' ').replace(/\s+/g, ' ').trim();
  if (intensity === 'VC') sentence += ' in the vicinity';
  if (text.startsWith('RE')) sentence = `Recent ${sentence.toLowerCase()}`;
  sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);

  return {
    raw: text,
    intensity: intensity || null,
    descriptor: descriptor || null,
    precipitation,
    obscuration: obscuration || null,
    other: other || null,
    text: sentence,
  };
}

const SKY_RE = /^(FEW|SCT|BKN|OVC|VV|SKC|CLR|NSC|NCD)(\d{3}|\/{3})?(CB|TCU|\/{3})?$/;

function parseSky(text: string): CloudLayer | null {
  const m = SKY_RE.exec(text);
  if (!m) return null;
  const cover = m[1] as CloudCover;
  const baseFt = m[2] && m[2] !== '///' ? parseInt(m[2], 10) * 100 : null;
  const type = m[3] === 'CB' ? 'CB' : m[3] === 'TCU' ? 'TCU' : null;
  return {
    cover,
    coverLabel: COVER_LABEL[cover],
    oktas: COVER_OKTAS[cover],
    baseFt,
    type,
    typeLabel: type === 'CB' ? 'cumulonimbus' : type === 'TCU' ? 'towering cumulus' : null,
    raw: text,
  };
}

export function cloudText(layer: CloudLayer): string {
  if (layer.cover === 'VV') {
    return layer.baseFt == null
      ? 'Sky obscured, vertical visibility not measured'
      : `Sky obscured, vertical visibility ${layer.baseFt.toLocaleString('en-US')} ft`;
  }
  if (layer.oktas === 0) return COVER_LABEL[layer.cover];
  const base = layer.baseFt == null ? 'height not reported' : `${layer.baseFt.toLocaleString('en-US')} ft AGL`;
  const suffix = layer.typeLabel ? ` (${layer.typeLabel})` : '';
  return `${layer.coverLabel} at ${base}${suffix}`;
}

const TEMP_RE = /^(M?\d{2})\/(M?\d{2})?$/;

function signed(value: string): number {
  return value.startsWith('M') ? -parseInt(value.slice(1), 10) : parseInt(value, 10);
}

const WS_RE = /^WS(\d{3})\/(\d{3})(\d{2,3})(?:G(\d{2,3}))?(KT|MPS)$/;

function parseWindShear(text: string): WindShear | null {
  if (text === 'WS' || text === 'ALL' || text === 'RWY') return null;
  const all = /^WSALL$/.exec(text);
  if (all) {
    return { heightFt: null, runway: null, wind: null, text: 'Wind shear reported on all runways', raw: text };
  }
  const rwy = /^WSR(\d{2}[LCR]?)$/.exec(text);
  if (rwy) {
    return { heightFt: null, runway: rwy[1], wind: null, text: `Wind shear on runway ${rwy[1]}`, raw: text };
  }
  const m = WS_RE.exec(text);
  if (!m) return null;
  const unit = m[5] as 'KT' | 'MPS';
  const speed = parseInt(m[3], 10);
  const gust = m[4] ? parseInt(m[4], 10) : null;
  const heightFt = parseInt(m[1], 10) * 100;
  const wind: Wind = {
    directionDeg: parseInt(m[2], 10),
    variable: false,
    speed,
    gust,
    unit,
    speedKt: toKnots(speed, unit),
    gustKt: toKnots(gust, unit),
    varyFrom: null,
    varyTo: null,
    calm: false,
    raw: text,
  };
  return {
    heightFt,
    runway: null,
    wind,
    text: `Low-level wind shear at ${heightFt.toLocaleString('en-US')} ft: ${windText(wind).toLowerCase()}`,
    raw: text,
  };
}

function slpToHpa(code: string): number {
  const value = parseInt(code, 10) / 10;
  return value < 50 ? 1000 + value : 900 + value;
}

function tenthsTemp(code: string): number {
  const sign = code[0] === '1' ? -1 : 1;
  return sign * (parseInt(code.slice(1), 10) / 10);
}

interface RemarkParseResult {
  items: RemarkItem[];
  seaLevelPressureHpa: number | null;
  temperatureC: number | null;
  dewpointC: number | null;
}

function parseRemarks(tokens: string[]): RemarkParseResult {
  const items: RemarkItem[] = [];
  let seaLevelPressureHpa: number | null = null;
  let temperatureC: number | null = null;
  let dewpointC: number | null = null;

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    let m: RegExpExecArray | null;

    if (t === 'AO1') {
      items.push({ code: t, label: 'Station type', plain: 'Automated station without a precipitation discriminator' });
      continue;
    }
    if (t === 'AO2') {
      items.push({ code: t, label: 'Station type', plain: 'Automated station with a precipitation discriminator' });
      continue;
    }
    if (t === 'PK' && tokens[i + 1] === 'WND' && tokens[i + 2]) {
      const pk = /^(\d{3})(\d{2,3})\/(\d{2})(\d{2})$/.exec(tokens[i + 2]);
      if (pk) {
        items.push({
          code: `PK WND ${tokens[i + 2]}`,
          label: 'Peak wind',
          plain: `Peak wind from ${pk[1]}° at ${parseInt(pk[2], 10)} kt at ${pk[3]}:${pk[4]}Z`,
        });
        i += 2;
        continue;
      }
    }
    if (t === 'WSHFT' && tokens[i + 1] && /^\d{4}$/.test(tokens[i + 1])) {
      items.push({
        code: `WSHFT ${tokens[i + 1]}`,
        label: 'Wind shift',
        plain: `Wind shift at ${tokens[i + 1].slice(0, 2)}:${tokens[i + 1].slice(2)}Z`,
      });
      i += 1;
      continue;
    }
    if (t === 'VIS' && tokens[i + 1]) {
      items.push({ code: `VIS ${tokens[i + 1]}`, label: 'Variable visibility', plain: `Visibility varying: ${tokens[i + 1]}` });
      i += 1;
      continue;
    }
    if (t === 'CIG' && tokens[i + 1]) {
      const cig = /^(\d{3})V(\d{3})$/.exec(tokens[i + 1]);
      if (cig) {
        items.push({
          code: `CIG ${tokens[i + 1]}`,
          label: 'Variable ceiling',
          plain: `Ceiling varying between ${parseInt(cig[1], 10) * 100} and ${parseInt(cig[2], 10) * 100} ft`,
        });
        i += 1;
        continue;
      }
    }
    if ((m = /^SLP(\d{3})$/.exec(t))) {
      seaLevelPressureHpa = slpToHpa(m[1]);
      items.push({ code: t, label: 'Sea-level pressure', plain: `${seaLevelPressureHpa.toFixed(1)} hPa` });
      continue;
    }
    if (t === 'SLPNO') {
      items.push({ code: t, label: 'Sea-level pressure', plain: 'Sea-level pressure not available' });
      continue;
    }
    if ((m = /^T([01]\d{3})([01]\d{3})?$/.exec(t))) {
      temperatureC = tenthsTemp(m[1]);
      if (m[2]) dewpointC = tenthsTemp(m[2]);
      items.push({
        code: t,
        label: 'Precise temperature',
        plain: `Temperature ${temperatureC.toFixed(1)}°C${dewpointC != null ? `, dew point ${dewpointC.toFixed(1)}°C` : ''}`,
      });
      continue;
    }
    if ((m = /^1([01]\d{3})$/.exec(t))) {
      items.push({ code: t, label: '6-hour maximum', plain: `Maximum temperature ${tenthsTemp(m[1]).toFixed(1)}°C in the last 6 hours` });
      continue;
    }
    if ((m = /^2([01]\d{3})$/.exec(t))) {
      items.push({ code: t, label: '6-hour minimum', plain: `Minimum temperature ${tenthsTemp(m[1]).toFixed(1)}°C in the last 6 hours` });
      continue;
    }
    if ((m = /^4([01]\d{3})([01]\d{3})$/.exec(t))) {
      items.push({
        code: t,
        label: '24-hour extremes',
        plain: `24-hour maximum ${tenthsTemp(m[1]).toFixed(1)}°C, minimum ${tenthsTemp(m[2]).toFixed(1)}°C`,
      });
      continue;
    }
    if ((m = /^5([0-8])(\d{3})$/.exec(t))) {
      const tendency = [
        'increasing, then decreasing',
        'increasing, then steady',
        'increasing steadily',
        'increasing, then increasing faster',
        'steady',
        'decreasing, then increasing',
        'decreasing, then steady',
        'decreasing steadily',
        'decreasing, then decreasing faster',
      ][parseInt(m[1], 10)];
      items.push({
        code: t,
        label: 'Pressure tendency',
        plain: `Pressure ${tendency}; net change ${(parseInt(m[2], 10) / 10).toFixed(1)} hPa over 3 hours`,
      });
      continue;
    }
    if ((m = /^P(\d{4})$/.exec(t))) {
      items.push({ code: t, label: 'Hourly precipitation', plain: `${(parseInt(m[1], 10) / 100).toFixed(2)} in in the last hour` });
      continue;
    }
    if ((m = /^6(\d{4})$/.exec(t))) {
      items.push({ code: t, label: '3/6-hour precipitation', plain: `${(parseInt(m[1], 10) / 100).toFixed(2)} in` });
      continue;
    }
    if ((m = /^7(\d{4})$/.exec(t))) {
      items.push({ code: t, label: '24-hour precipitation', plain: `${(parseInt(m[1], 10) / 100).toFixed(2)} in` });
      continue;
    }
    if ((m = /^4\/(\d{3})$/.exec(t))) {
      items.push({ code: t, label: 'Snow depth', plain: `${parseInt(m[1], 10)} in of snow on the ground` });
      continue;
    }
    if ((m = /^([A-Z]{2})B(\d{2,4})(?:E(\d{2,4}))?$/.exec(t)) && PRECIPITATION[m[1]]) {
      const began = m[2].length === 4 ? `${m[2].slice(0, 2)}:${m[2].slice(2)}` : `:${m[2]}`;
      const ended = m[3] ? (m[3].length === 4 ? `${m[3].slice(0, 2)}:${m[3].slice(2)}` : `:${m[3]}`) : null;
      items.push({
        code: t,
        label: 'Precipitation timing',
        plain: `${PRECIPITATION[m[1]].replace(/^./, (c) => c.toUpperCase())} began at ${began}${ended ? `, ended at ${ended}` : ''}`,
      });
      continue;
    }
    if (t === 'PRESRR') {
      items.push({ code: t, label: 'Pressure', plain: 'Pressure rising rapidly' });
      continue;
    }
    if (t === 'PRESFR') {
      items.push({ code: t, label: 'Pressure', plain: 'Pressure falling rapidly' });
      continue;
    }
    if (t === 'TSNO') {
      items.push({ code: t, label: 'Sensor status', plain: 'Thunderstorm information not available' });
      continue;
    }
    if (t === 'RVRNO') {
      items.push({ code: t, label: 'Sensor status', plain: 'Runway visual range not available' });
      continue;
    }
    if (t === 'PWINO') {
      items.push({ code: t, label: 'Sensor status', plain: 'Present-weather sensor not available' });
      continue;
    }
    if (t === 'PNO') {
      items.push({ code: t, label: 'Sensor status', plain: 'Precipitation gauge not available' });
      continue;
    }
    if (t === 'FZRANO') {
      items.push({ code: t, label: 'Sensor status', plain: 'Freezing-rain sensor not available' });
      continue;
    }
    if (t === '$') {
      items.push({ code: t, label: 'Maintenance', plain: 'Station needs maintenance' });
      continue;
    }
    if (t === 'CORR' || t === 'COR') {
      items.push({ code: t, label: 'Correction', plain: 'Corrected observation' });
      continue;
    }
    if ((m = /^(LTG[A-Z]*)$/.exec(t))) {
      const kinds: Record<string, string> = { IC: 'in cloud', CC: 'cloud to cloud', CG: 'cloud to ground', CA: 'cloud to air' };
      const types = (m[1].slice(3).match(/../g) || []).map((k) => kinds[k] || k).join(', ');
      items.push({ code: t, label: 'Lightning', plain: types ? `Lightning ${types}` : 'Lightning observed' });
      continue;
    }

    const weather = parseWeather(t);
    if (weather) {
      items.push({ code: t, label: 'Weather note', plain: weather.text });
      continue;
    }

    items.push({ code: t, label: 'Remark', plain: 'Coded remark not decoded by this tool' });
  }

  return { items, seaLevelPressureHpa, temperatureC, dewpointC };
}

const TREND_LABELS: Record<string, string> = {
  NOSIG: 'No significant change expected in the next two hours',
  TEMPO: 'Temporary fluctuations expected',
  BECMG: 'Conditions becoming',
};

export function decodeMetar(input: string): DecodedMetar {
  const raw = input.replace(/\s+/g, ' ').replace(/=+\s*$/, '').trim();
  const tokens = tokenizeRaw(raw);
  const out: DecodedMetar = {
    raw,
    type: 'METAR',
    station: null,
    time: null,
    auto: false,
    corrected: false,
    wind: null,
    visibility: null,
    rvr: [],
    weather: [],
    clouds: [],
    cavok: false,
    windShear: null,
    temperatureC: null,
    dewpointC: null,
    altimeterInHg: null,
    altimeterHpa: null,
    seaLevelPressureHpa: null,
    trend: null,
    remarks: null,
    remarkItems: [],
    tokens: [],
    warnings: [],
  };

  const push = (from: number, to: number, kind: TokenKind, label: string, plain: string) => {
    out.tokens.push({
      raw: raw.slice(tokens[from].start, tokens[to].end),
      start: tokens[from].start,
      end: tokens[to].end,
      kind,
      label,
      plain,
    });
  };

  let i = 0;
  while (i < tokens.length) {
    const t = tokens[i].text;
    let m: RegExpExecArray | null;

    if (t === 'RMK' || t === 'RMKS') {
      const rest = tokens.slice(i + 1).map((tok) => tok.text);
      out.remarks = rest.join(' ');
      const parsed = parseRemarks(rest);
      out.remarkItems = parsed.items;
      if (parsed.seaLevelPressureHpa != null) out.seaLevelPressureHpa = parsed.seaLevelPressureHpa;
      if (parsed.temperatureC != null) out.temperatureC = parsed.temperatureC;
      if (parsed.dewpointC != null) out.dewpointC = parsed.dewpointC;
      push(i, i, 'remark', 'Remarks', 'Everything after RMK is supplementary, largely US-specific coded detail.');
      for (let r = i + 1; r < tokens.length; r++) {
        const match = out.remarkItems.find((item) => item.code === tokens[r].text || item.code.startsWith(`${tokens[r].text} `));
        out.tokens.push({
          raw: tokens[r].text,
          start: tokens[r].start,
          end: tokens[r].end,
          kind: 'remark',
          label: match ? match.label : 'Remark',
          plain: match ? match.plain : 'Supplementary remark',
        });
      }
      break;
    }

    if (i === 0 && (t === 'METAR' || t === 'SPECI')) {
      out.type = t as 'METAR' | 'SPECI';
      push(i, i, 'type', 'Report type', t === 'SPECI' ? 'Special report, issued off-schedule because conditions changed' : 'Routine hourly aerodrome observation');
      i++;
      continue;
    }
    if (!out.station && /^[A-Z][A-Z0-9]{3}$/.test(t) && !SKY_RE.test(t)) {
      out.station = t;
      push(i, i, 'station', 'Station', `Reporting station ${t}`);
      i++;
      continue;
    }
    if (!out.time && (m = /^(\d{2})(\d{2})(\d{2})Z$/.exec(t))) {
      out.time = { day: parseInt(m[1], 10), hour: parseInt(m[2], 10), minute: parseInt(m[3], 10) };
      push(i, i, 'time', 'Observation time', `Day ${out.time.day} of the month at ${pad2(out.time.hour)}:${pad2(out.time.minute)} UTC`);
      i++;
      continue;
    }
    if (t === 'AUTO' || t === 'COR' || t === 'CCA' || t === 'CCB' || t === 'NIL' || t === 'RTD') {
      if (t === 'AUTO') out.auto = true;
      if (t !== 'AUTO' && t !== 'NIL') out.corrected = true;
      push(
        i,
        i,
        'modifier',
        'Modifier',
        t === 'AUTO'
          ? 'Fully automated observation, with no human augmentation'
          : t === 'NIL'
            ? 'No report available'
            : 'Corrected report, replacing an earlier transmission',
      );
      i++;
      continue;
    }

    const wind = parseWind(t);
    if (wind && !out.wind) {
      out.wind = wind;
      push(i, i, 'wind', 'Wind', windText(wind));
      i++;
      continue;
    }
    if ((m = /^(\d{3})V(\d{3})$/.exec(t)) && out.wind) {
      out.wind.varyFrom = parseInt(m[1], 10);
      out.wind.varyTo = parseInt(m[2], 10);
      push(i, i, 'wind-var', 'Wind variation', `Direction varying between ${m[1]}° and ${m[2]}°`);
      i++;
      continue;
    }
    if (t === 'CAVOK') {
      out.cavok = true;
      out.visibility = {
        meters: 10000,
        statuteMiles: 10000 / 1609.344,
        greaterThan: true,
        lessThan: false,
        cavok: true,
        raw: t,
        text: '10 km or more',
      };
      push(i, i, 'visibility', 'CAVOK', 'Ceiling and visibility OK: 10 km or more, no cloud below 5,000 ft or the highest minimum sector altitude, no cumulonimbus, and no significant weather');
      i++;
      continue;
    }
    if (/^\d{1,2}$/.test(t) && tokens[i + 1] && VIS_SM_RE.test(tokens[i + 1].text) && !out.visibility) {
      const vis = parseVisibilitySm(tokens[i + 1].text, t);
      if (vis) {
        out.visibility = vis;
        push(i, i + 1, 'visibility', 'Visibility', `Prevailing visibility ${vis.text.toLowerCase()}`);
        i += 2;
        continue;
      }
    }
    if (!out.visibility) {
      const vis = parseVisibilitySm(t) || parseVisibilityMeters(t);
      if (vis) {
        out.visibility = vis;
        push(i, i, 'visibility', 'Visibility', `Prevailing visibility ${vis.text.toLowerCase()}`);
        i++;
        continue;
      }
    }
    const rvr = parseRvr(t);
    if (rvr) {
      out.rvr.push(rvr);
      push(i, i, 'rvr', 'Runway visual range', rvr.text);
      i++;
      continue;
    }
    const shear = parseWindShear(t);
    if (shear) {
      out.windShear = shear;
      push(i, i, 'wind-shear', 'Wind shear', shear.text);
      i++;
      continue;
    }
    const sky = parseSky(t);
    if (sky) {
      out.clouds.push(sky);
      push(i, i, 'sky', 'Sky condition', cloudText(sky));
      i++;
      continue;
    }
    if ((m = TEMP_RE.exec(t))) {
      out.temperatureC = signed(m[1]);
      out.dewpointC = m[2] ? signed(m[2]) : null;
      push(
        i,
        i,
        'temp',
        'Temperature / dew point',
        `${out.temperatureC}°C air temperature${out.dewpointC != null ? `, ${out.dewpointC}°C dew point` : ', dew point not reported'}`,
      );
      i++;
      continue;
    }
    if ((m = /^A(\d{4})$/.exec(t))) {
      out.altimeterInHg = parseInt(m[1], 10) / 100;
      out.altimeterHpa = out.altimeterInHg * 33.8639;
      push(i, i, 'pressure', 'Altimeter', `Altimeter setting ${out.altimeterInHg.toFixed(2)} inHg (${out.altimeterHpa.toFixed(0)} hPa)`);
      i++;
      continue;
    }
    if ((m = /^Q(\d{4})$/.exec(t))) {
      out.altimeterHpa = parseInt(m[1], 10);
      out.altimeterInHg = out.altimeterHpa / 33.8639;
      push(i, i, 'pressure', 'QNH', `Pressure setting ${out.altimeterHpa} hPa (${out.altimeterInHg.toFixed(2)} inHg)`);
      i++;
      continue;
    }
    if (t === 'NOSIG' || t === 'TEMPO' || t === 'BECMG') {
      out.trend = t;
      push(i, i, 'trend', 'Trend', TREND_LABELS[t]);
      i++;
      continue;
    }
    const weather = parseWeather(t);
    if (weather) {
      if (!t.startsWith('RE')) out.weather.push(weather);
      push(i, i, 'weather', t.startsWith('RE') ? 'Recent weather' : 'Present weather', weather.text);
      i++;
      continue;
    }

    out.warnings.push(t);
    push(i, i, 'unknown', 'Not decoded', `“${t}” is not a group this decoder recognises.`);
    i++;
  }

  return out;
}

const PERIOD_LABEL: Record<TafPeriodKind, string> = {
  INITIAL: 'Initial forecast',
  FM: 'From',
  TEMPO: 'Temporarily',
  BECMG: 'Becoming',
  PROB: 'Probability',
  INTER: 'Intermittent',
};

function emptyConditions(): Conditions {
  return { wind: null, visibility: null, weather: [], clouds: [], cavok: false, windShear: null };
}

export function decodeTaf(input: string): DecodedTaf {
  const raw = input.replace(/\s+/g, ' ').replace(/=+\s*$/, '').trim();
  const tokens = tokenizeRaw(raw);
  const out: DecodedTaf = {
    raw,
    station: null,
    issued: null,
    validFrom: null,
    validTo: null,
    amended: false,
    corrected: false,
    periods: [],
    tokens: [],
    warnings: [],
  };

  const push = (index: number, kind: TokenKind, label: string, plain: string) => {
    out.tokens.push({
      raw: tokens[index].text,
      start: tokens[index].start,
      end: tokens[index].end,
      kind,
      label,
      plain,
    });
  };

  let current: TafPeriod = {
    ...emptyConditions(),
    kind: 'INITIAL',
    kindLabel: PERIOD_LABEL.INITIAL,
    probability: null,
    from: null,
    to: null,
    raw: '',
  };
  let started = false;
  let pendingProbability: number | null = null;
  let lastBase: TafPeriod | null = current;

  const commit = () => {
    if (started) out.periods.push(current);
  };
  const startPeriod = (kind: TafPeriodKind, from: ReportTime | null, to: ReportTime | null, probability: number | null) => {
    commit();
    current = {
      ...emptyConditions(),
      kind,
      kindLabel: PERIOD_LABEL[kind],
      probability,
      from,
      to,
      raw: '',
    };
    started = true;
  };

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i].text;
    let m: RegExpExecArray | null;

    if (i === 0 && (t === 'TAF' || t === 'TAF.')) {
      push(i, 'type', 'Report type', 'Terminal aerodrome forecast');
      continue;
    }
    if (t === 'AMD') {
      out.amended = true;
      push(i, 'modifier', 'Modifier', 'Amended forecast, replacing the previous issue');
      continue;
    }
    if (t === 'COR') {
      out.corrected = true;
      push(i, 'modifier', 'Modifier', 'Corrected forecast');
      continue;
    }
    if (!out.station && /^[A-Z][A-Z0-9]{3}$/.test(t) && !SKY_RE.test(t)) {
      out.station = t;
      push(i, 'station', 'Station', `Forecast for ${t}`);
      continue;
    }
    if (!out.issued && (m = /^(\d{2})(\d{2})(\d{2})Z$/.exec(t))) {
      out.issued = { day: parseInt(m[1], 10), hour: parseInt(m[2], 10), minute: parseInt(m[3], 10) };
      push(i, 'time', 'Issued', `Issued day ${out.issued.day} at ${pad2(out.issued.hour)}:${pad2(out.issued.minute)} UTC`);
      continue;
    }
    if (!out.validFrom && (m = /^(\d{2})(\d{2})\/(\d{2})(\d{2})$/.exec(t))) {
      out.validFrom = { day: parseInt(m[1], 10), hour: parseInt(m[2], 10), minute: 0 };
      out.validTo = { day: parseInt(m[3], 10), hour: parseInt(m[4], 10), minute: 0 };
      current.from = out.validFrom;
      current.to = out.validTo;
      started = true;
      push(
        i,
        'valid',
        'Valid period',
        `Valid from day ${out.validFrom.day} at ${pad2(out.validFrom.hour)}:00Z through day ${out.validTo.day} at ${pad2(out.validTo.hour)}:00Z`,
      );
      continue;
    }
    if ((m = /^FM(\d{2})(\d{2})(\d{2})$/.exec(t))) {
      const from = { day: parseInt(m[1], 10), hour: parseInt(m[2], 10), minute: parseInt(m[3], 10) };
      if (lastBase) lastBase.to = from;
      startPeriod('FM', from, out.validTo, null);
      lastBase = current;
      push(i, 'period', 'Change group', `From day ${from.day} at ${pad2(from.hour)}:${pad2(from.minute)}Z, these conditions replace the previous line entirely`);
      continue;
    }
    if ((m = /^PROB(\d{2})$/.exec(t))) {
      pendingProbability = parseInt(m[1], 10);
      push(i, 'period', 'Probability', `${pendingProbability}% chance of the conditions that follow`);
      continue;
    }
    if (t === 'TEMPO' || t === 'BECMG' || t === 'INTER') {
      const next = tokens[i + 1] ? /^(\d{2})(\d{2})\/(\d{2})(\d{2})$/.exec(tokens[i + 1].text) : null;
      const from = next ? { day: parseInt(next[1], 10), hour: parseInt(next[2], 10), minute: 0 } : null;
      const to = next ? { day: parseInt(next[3], 10), hour: parseInt(next[4], 10), minute: 0 } : null;
      const kind = pendingProbability != null ? 'PROB' : (t as TafPeriodKind);
      startPeriod(kind, from, to, pendingProbability);
      current.kindLabel = pendingProbability != null ? `${pendingProbability}% ${t === 'TEMPO' ? 'temporarily' : t.toLowerCase()}` : PERIOD_LABEL[t as TafPeriodKind];
      pendingProbability = null;
      push(
        i,
        'period',
        'Change group',
        t === 'TEMPO'
          ? 'Temporary fluctuations lasting under an hour each, covering less than half the period'
          : t === 'BECMG'
            ? 'Conditions changing gradually to those that follow'
            : 'Intermittent conditions',
      );
      if (next) {
        push(i + 1, 'period', 'Period', `Day ${from!.day} ${pad2(from!.hour)}:00Z to day ${to!.day} ${pad2(to!.hour)}:00Z`);
        i += 1;
      }
      continue;
    }
    if ((m = /^(\d{2})(\d{2})\/(\d{2})(\d{2})$/.exec(t)) && pendingProbability != null) {
      const from = { day: parseInt(m[1], 10), hour: parseInt(m[2], 10), minute: 0 };
      const to = { day: parseInt(m[3], 10), hour: parseInt(m[4], 10), minute: 0 };
      startPeriod('PROB', from, to, pendingProbability);
      current.kindLabel = `${pendingProbability}% probability`;
      pendingProbability = null;
      push(i, 'period', 'Period', `Day ${from.day} ${pad2(from.hour)}:00Z to day ${to.day} ${pad2(to.hour)}:00Z`);
      continue;
    }

    const wind = parseWind(t);
    if (wind && !current.wind) {
      current.wind = wind;
      push(i, 'wind', 'Wind', windText(wind));
      continue;
    }
    if (t === 'CAVOK') {
      current.cavok = true;
      current.visibility = {
        meters: 10000,
        statuteMiles: 10000 / 1609.344,
        greaterThan: true,
        lessThan: false,
        cavok: true,
        raw: t,
        text: '10 km or more',
      };
      push(i, 'visibility', 'CAVOK', 'Ceiling and visibility OK');
      continue;
    }
    if (/^\d{1,2}$/.test(t) && tokens[i + 1] && VIS_SM_RE.test(tokens[i + 1].text) && !current.visibility) {
      const vis = parseVisibilitySm(tokens[i + 1].text, t);
      if (vis) {
        current.visibility = vis;
        push(i, 'visibility', 'Visibility', `Forecast visibility ${vis.text.toLowerCase()}`);
        push(i + 1, 'visibility', 'Visibility', `Forecast visibility ${vis.text.toLowerCase()}`);
        i += 1;
        continue;
      }
    }
    if (!current.visibility) {
      const vis = parseVisibilitySm(t) || parseVisibilityMeters(t);
      if (vis) {
        current.visibility = vis;
        push(i, 'visibility', 'Visibility', `Forecast visibility ${vis.text.toLowerCase()}`);
        continue;
      }
    }
    const shear = parseWindShear(t);
    if (shear) {
      current.windShear = shear;
      push(i, 'wind-shear', 'Wind shear', shear.text);
      continue;
    }
    const sky = parseSky(t);
    if (sky) {
      current.clouds.push(sky);
      push(i, 'sky', 'Sky condition', cloudText(sky));
      continue;
    }
    const weather = parseWeather(t);
    if (weather) {
      current.weather.push(weather);
      push(i, 'weather', 'Weather', weather.text);
      continue;
    }
    if ((m = /^T(X|N)(M?\d{2})\/(\d{2})(\d{2})Z$/.exec(t))) {
      push(
        i,
        'temp',
        m[1] === 'X' ? 'Maximum temperature' : 'Minimum temperature',
        `${m[1] === 'X' ? 'Maximum' : 'Minimum'} of ${signed(m[2])}°C on day ${m[3]} at ${m[4]}:00Z`,
      );
      continue;
    }
    if (t === 'RMK' || t === 'RMKS') {
      push(i, 'remark', 'Remarks', 'Supplementary forecast remarks');
      for (let r = i + 1; r < tokens.length; r++) {
        push(r, 'remark', 'Remark', 'Supplementary forecast remark');
      }
      break;
    }

    out.warnings.push(t);
    push(i, 'unknown', 'Not decoded', `“${t}” is not a group this decoder recognises.`);
  }

  commit();
  return out;
}

export function looksLikeTaf(text: string): boolean {
  return /^\s*TAF\b/i.test(text) || /\bFM\d{6}\b/.test(text) || /\b\d{4}\/\d{4}\b/.test(text);
}
