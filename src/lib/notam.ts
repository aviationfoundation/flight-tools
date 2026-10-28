export interface DecodedField {
  code: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
  raw: string;
  plain: string;
}

export interface QLine {
  raw: string;
  fir: string | null;
  subjectCode: string | null;
  subjectPlain: string | null;
  conditionCode: string | null;
  conditionPlain: string | null;
  traffic: string | null;
  trafficPlain: string | null;
  purpose: string | null;
  purposePlain: string | null;
  scope: string | null;
  scopePlain: string | null;
  lowerFl: string | null;
  upperFl: string | null;
  coordinates: string | null;
  radiusNm: number | null;
  center: { lat: number; lon: number } | null;
}

export type IssueCode =
  | 'header-missing'
  | 'header-malformed'
  | 'ref-missing'
  | 'ref-unexpected'
  | 'q-malformed'
  | 'q-code-unknown'
  | 'q-geo-malformed'
  | 'q-geo-out-of-range'
  | 'q-limits-inverted'
  | 'q-limits-malformed'
  | 'field-missing'
  | 'time-malformed'
  | 'time-invalid'
  | 'time-order'
  | 'cancel-has-end'
  | 'schedule-invalid'
  | 'limits-inverted'
  | 'limits-malformed'
  | 'text-contradiction'
  | 'item-duplicated'
  | 'multiple-notams';

export interface NotamIssue {
  severity: 'error' | 'warning';
  code: IssueCode;
  field: 'header' | 'Q' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | null;
  message: string;
}

export interface DecodedNotam {
  raw: string;
  format: 'icao' | 'faa-domestic' | 'short' | 'text';
  series: string | null;
  number: string | null;
  type: 'NOTAMN' | 'NOTAMR' | 'NOTAMC' | null;
  replaces: string | null;
  qLine: QLine | null;
  fields: DecodedField[];
  effectiveFrom: NotamTime | null;
  effectiveTo: NotamTime | null;
  estimatedEnd: boolean;
  permanent: boolean;
  plainSummary: string;
  unrecognisedTokens: string[];
  unstructured: boolean;
  issues: NotamIssue[];
  textCoordinates: Array<{ raw: string; lat: number; lon: number }>;
}

export interface NotamTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

const SUBJECT_CODES: Record<string, string> = {
  AA: 'Minimum altitude',
  AC: 'Control zone',
  AD: 'Air defence identification zone',
  AE: 'Control area',
  AF: 'Flight information region',
  AH: 'Upper control area',
  AL: 'Minimum usable flight level',
  AN: 'Area navigation route',
  AO: 'Oceanic control area',
  AP: 'Reporting point',
  AR: 'ATS route',
  AT: 'Terminal control area',
  AU: 'Upper flight information region',
  AV: 'Upper advisory area',
  AX: 'Significant point',
  AZ: 'Aerodrome traffic zone',
  CA: 'Air/ground radio facility',
  CB: 'ADS-B',
  CC: 'ADS-C',
  CD: 'Controller-pilot data link communications',
  CE: 'En-route surveillance radar',
  CG: 'Ground controlled approach system',
  CL: 'Selective calling system (SELCAL)',
  CM: 'Surface movement radar',
  CP: 'Precision approach radar',
  CR: 'Surveillance radar element of precision approach radar',
  CS: 'Secondary surveillance radar',
  CT: 'Terminal area surveillance radar',
  FA: 'Aerodrome',
  FB: 'Braking action or friction measuring device',
  FC: 'Ceiling measurement equipment',
  FD: 'Docking system',
  FE: 'Oxygen',
  FF: 'Fire fighting and rescue',
  FG: 'Ground movement control',
  FH: 'Helicopter alighting area or platform',
  FI: 'Aircraft de-icing',
  FJ: 'Oils',
  FL: 'Landing direction indicator',
  FM: 'Meteorological service',
  FO: 'Fog dispersal system',
  FP: 'Heliport',
  FS: 'Snow removal equipment',
  FT: 'Transmissometer',
  FU: 'Fuel availability',
  FW: 'Wind direction indicator',
  FZ: 'Customs and immigration',
  GA: 'GNSS airfield-specific operations',
  GW: 'GNSS area-wide operations',
  IC: 'Instrument landing system',
  ID: 'DME associated with ILS',
  IG: 'ILS glide path',
  II: 'ILS inner marker',
  IL: 'ILS localizer',
  IM: 'ILS middle marker',
  IN: 'Localizer not associated with ILS',
  IO: 'ILS outer marker',
  IS: 'ILS Category I',
  IT: 'ILS Category II',
  IU: 'ILS Category III',
  IW: 'Microwave landing system',
  IX: 'ILS outer locator',
  IY: 'ILS middle locator',
  LA: 'Approach lighting system',
  LB: 'Aerodrome beacon',
  LC: 'Runway centre line lights',
  LD: 'Landing direction indicator lights',
  LE: 'Runway edge lights',
  LF: 'Sequenced flashing lights',
  LG: 'Pilot-controlled lighting',
  LH: 'High intensity runway lights',
  LI: 'Runway end identifier lights',
  LJ: 'Runway alignment indicator lights',
  LK: 'Category II components of approach lighting',
  LL: 'Low intensity runway lights',
  LM: 'Medium intensity runway lights',
  LP: 'Precision approach path indicator (PAPI)',
  LR: 'All landing area lighting',
  LS: 'Stopway lights',
  LT: 'Threshold lights',
  LU: 'Helicopter approach path indicator',
  LV: 'Visual approach slope indicator system (VASIS)',
  LW: 'Heliport lighting',
  LX: 'Taxiway centre line lights',
  LY: 'Taxiway edge lights',
  LZ: 'Runway touchdown zone lights',
  MA: 'Movement area',
  MB: 'Bearing strength',
  MC: 'Clearway',
  MD: 'Declared distances',
  MG: 'Taxiing guidance system',
  MH: 'Runway arresting gear',
  MK: 'Parking area',
  MM: 'Daylight markings',
  MN: 'Apron',
  MO: 'Stop bar',
  MP: 'Aircraft stands',
  MR: 'Runway',
  MS: 'Stopway',
  MT: 'Threshold',
  MU: 'Runway turning bay',
  MW: 'Runway strip or shoulder',
  MX: 'Taxiway',
  MY: 'Rapid exit taxiway',
  NA: 'All radio navigation facilities',
  NB: 'Non-directional beacon (NDB)',
  NC: 'DECCA',
  ND: 'Distance measuring equipment (DME)',
  NF: 'Fan marker',
  NL: 'Locator',
  NM: 'VOR/DME',
  NN: 'TACAN',
  NO: 'OMEGA',
  NT: 'VORTAC',
  NV: 'VOR',
  NX: 'Direction-finding station',
  OA: 'Aeronautical information service',
  OB: 'Obstacle',
  OE: 'Aircraft entry requirements',
  OL: 'Obstacle lights',
  OR: 'Rescue coordination centre',
  PA: 'Standard instrument arrival (STAR)',
  PB: 'Standard VFR arrival',
  PC: 'Contingency procedures',
  PD: 'Standard instrument departure (SID)',
  PE: 'Standard VFR departure',
  PF: 'Flow control procedure',
  PH: 'Holding procedure',
  PI: 'Instrument approach procedure',
  PK: 'VFR approach procedure',
  PL: 'Flight plan processing',
  PM: 'Aerodrome operating minima',
  PN: 'Noise operating restrictions',
  PO: 'Obstacle clearance altitude and height',
  PR: 'Radio failure procedure',
  PT: 'Transition altitude or transition level',
  PU: 'Missed approach procedure',
  PX: 'Minimum holding altitude',
  PZ: 'ADIZ procedure',
  RA: 'Airspace reservation',
  RD: 'Danger area',
  RM: 'Military operating area',
  RO: 'Overflying restriction',
  RP: 'Prohibited area',
  RR: 'Restricted area',
  RT: 'Temporary restricted area',
  SA: 'Automatic terminal information service (ATIS)',
  SB: 'ATS reporting office',
  SC: 'Area control centre',
  SE: 'Flight information service',
  SF: 'Aerodrome flight information service',
  SL: 'Flow control centre',
  SO: 'Oceanic area control centre',
  SP: 'Approach control service',
  SS: 'Flight service station',
  ST: 'Aerodrome control tower',
  SU: 'Upper area control centre',
  SV: 'VOLMET broadcast',
  SY: 'Upper advisory service',
  WA: 'Air display',
  WB: 'Aerobatics',
  WC: 'Captive balloon or kite',
  WD: 'Demolition of explosives',
  WE: 'Exercises',
  WF: 'Air refuelling',
  WG: 'Glider flying',
  WH: 'Blasting',
  WJ: 'Banner or target towing',
  WL: 'Ascent of free balloon',
  WM: 'Missile, gun or rocket firing',
  WP: 'Parachute jumping, paragliding or hang gliding',
  WR: 'Radioactive materials or toxic chemicals',
  WS: 'Burning or blowing gas',
  WT: 'Mass movement of aircraft',
  WU: 'Unmanned aircraft',
  WV: 'Formation flight',
  WW: 'Significant volcanic activity',
  WY: 'Aerial survey',
  WZ: 'Model flying',
  KK: 'Checklist',
  XX: 'Other information',
};

const CONDITION_CODES: Record<string, string> = {
  AC: 'Withdrawn for maintenance',
  AD: 'Available for daylight operation',
  AF: 'Flight checked and found reliable',
  AG: 'Operating but ground checked only, awaiting flight check',
  AH: 'Hours of service are now',
  AK: 'Resumed normal operation',
  AL: 'Operative, subject to previously published limitations',
  AM: 'Military operations only',
  AN: 'Available for night operation',
  AO: 'Operational',
  AP: 'Available, prior permission required',
  AR: 'Available on request',
  AS: 'Unserviceable',
  AU: 'Not available',
  AW: 'Completely withdrawn',
  AX: 'Previously announced shutdown cancelled',
  CA: 'Activated',
  CC: 'Completed',
  CD: 'Deactivated',
  CE: 'Erected',
  CF: 'Operating frequency changed to',
  CG: 'Downgraded to',
  CH: 'Changed',
  CI: 'Identification or radio call sign changed to',
  CL: 'Realigned',
  CM: 'Displaced',
  CN: 'Cancelled',
  CO: 'Operating',
  CP: 'Operating on reduced power',
  CR: 'Temporarily replaced by',
  CS: 'Installed',
  CT: 'On test, do not use',
  HA: 'Braking action is',
  HB: 'Friction coefficient is',
  HC: 'Covered by compacted snow to a depth of',
  HD: 'Covered by dry snow to a depth of',
  HE: 'Covered by water to a depth of',
  HF: 'Totally free of snow and ice',
  HG: 'Grass cutting in progress',
  HH: 'Hazard due to',
  HI: 'Covered by ice',
  HJ: 'Launch planned',
  HK: 'Bird migration in progress',
  HL: 'Snow clearance completed',
  HM: 'Marked by',
  HN: 'Covered by wet snow or slush to a depth of',
  HO: 'Obscured by snow',
  HP: 'Snow clearance in progress',
  HQ: 'Operation cancelled',
  HR: 'Standing water',
  HS: 'Sanding in progress',
  HT: 'Approach according to signal area only',
  HU: 'Launch in progress',
  HV: 'Work completed',
  HW: 'Work in progress',
  HX: 'Concentration of birds',
  HY: 'Snow banks exist',
  HZ: 'Covered by frozen ruts and ridges',
  LA: 'Operating on auxiliary power supply',
  LB: 'Reserved for aircraft based there',
  LC: 'Closed',
  LD: 'Unsafe',
  LE: 'Operating without auxiliary power supply',
  LF: 'Interference from',
  LG: 'Operating without identification',
  LH: 'Unserviceable for aircraft heavier than',
  LI: 'Closed to IFR operations',
  LK: 'Operating as a fixed light',
  LL: 'Usable for length and width of',
  LN: 'Closed to all night operations',
  LP: 'Prohibited to',
  LR: 'Aircraft restricted to runways and taxiways',
  LS: 'Subject to interruption',
  LT: 'Limited to',
  LV: 'Closed to VFR operations',
  LW: 'Will take place',
  LX: 'Operating, but caution advised due to',
  KK: 'Checklist',
  XX: 'See the plain-language text',
};

const TRAFFIC_CODES: Record<string, string> = { I: 'IFR', V: 'VFR', IV: 'IFR and VFR', K: 'Checklist' };
const PURPOSE_CODES: Record<string, string> = {
  N: 'immediate attention',
  B: 'briefing pack entry',
  O: 'operationally significant',
  M: 'miscellaneous',
  K: 'checklist',
  NB: 'immediate attention, briefing pack',
  BO: 'briefing pack, operationally significant',
  NBO: 'immediate attention, briefing pack, operationally significant',
};
const SCOPE_CODES: Record<string, string> = {
  A: 'aerodrome',
  E: 'en route',
  W: 'navigation warning',
  AE: 'aerodrome and en route',
  AW: 'aerodrome and navigation warning',
  K: 'checklist',
};

const WORDS: Record<string, string> = {
  ABN: 'aerodrome beacon',
  ABT: 'about',
  ABV: 'above',
  ACC: 'area control centre',
  ACFT: 'aircraft',
  ACT: 'active',
  AD: 'aerodrome',
  ADJ: 'adjacent',
  AGL: 'above ground level',
  ALS: 'approach lighting system',
  ALT: 'altitude',
  ALTN: 'alternate',
  AMDT: 'amendment',
  AMSL: 'above mean sea level',
  AP: 'airport',
  APCH: 'approach',
  APN: 'apron',
  APNS: 'aprons',
  APP: 'approach control',
  APRX: 'approximately',
  APRN: 'apron',
  APT: 'airport',
  ARFF: 'aircraft rescue and fire fighting',
  ARR: 'arrival',
  ASDA: 'accelerate-stop distance available',
  ASOS: 'automated surface observing system',
  ASPH: 'asphalt',
  ASR: 'airport surveillance radar',
  AUTH: 'authorization',
  AVBL: 'available',
  AWOS: 'automated weather observing system',
  BCST: 'broadcast',
  BLDG: 'building',
  BLW: 'below',
  BRG: 'bearing',
  BTN: 'between',
  BYD: 'beyond',
  CAT: 'category',
  CLSD: 'closed',
  CMSND: 'commissioned',
  CNL: 'cancel',
  CNLD: 'cancelled',
  CONC: 'concrete',
  CONST: 'construction',
  CTAF: 'common traffic advisory frequency',
  CTC: 'contact',
  DCMSND: 'decommissioned',
  DECMSN: 'decommissioned',
  DEG: 'degrees',
  DEP: 'departure',
  DISPL: 'displaced',
  DIST: 'distance',
  DLY: 'daily',
  EQPT: 'equipment',
  ELEV: 'elevation',
  EST: 'estimated',
  EXC: 'except',
  EXP: 'expect',
  FICON: 'field condition',
  FLT: 'flight',
  FLTS: 'flights',
  FLW: 'follow',
  FM: 'from',
  FREQ: 'frequency',
  GND: 'ground',
  GP: 'glide path',
  GRVL: 'gravel',
  HEL: 'helicopter',
  HGT: 'height',
  HJ: 'sunrise to sunset',
  HN: 'sunset to sunrise',
  HOL: 'holidays',
  IAW: 'in accordance with',
  IDENT: 'identification',
  IMM: 'immediately',
  IMMED: 'immediately',
  INFO: 'information',
  INOP: 'inoperative',
  INT: 'intersection',
  LDA: 'landing distance available',
  LDG: 'landing',
  LGT: 'lighting',
  LGTD: 'lighted',
  LGTH: 'length',
  LGTS: 'lights',
  LOC: 'localizer',
  LTD: 'limited',
  MAG: 'magnetic',
  MAINT: 'maintenance',
  MALSR: 'medium intensity approach lighting system with runway alignment indicator lights',
  MAX: 'maximum',
  MIL: 'military',
  MNM: 'minimum',
  MNT: 'monitor',
  MSL: 'mean sea level',
  NA: 'not authorized',
  NAV: 'navigation',
  NE: 'northeast',
  NML: 'normal',
  NW: 'northwest',
  OBSC: 'obscured',
  OBST: 'obstacle',
  OBSTN: 'obstruction',
  ODALS: 'omnidirectional approach lighting system',
  OPN: 'open',
  OPR: 'operating',
  OPS: 'operations',
  PAR: 'precision approach radar',
  PAX: 'passengers',
  PERM: 'permanent',
  PJE: 'parachute jumping exercise',
  PN: 'prior notice',
  PPR: 'prior permission required',
  PROC: 'procedure',
  PROCS: 'procedures',
  PSN: 'position',
  RFFS: 'rescue and fire fighting service',
  REDL: 'runway edge lights',
  REIL: 'runway end identifier lights',
  REQ: 'request',
  RLLS: 'runway lead-in lighting system',
  RQRD: 'required',
  RSTD: 'restricted',
  RTE: 'route',
  RWY: 'runway',
  RWYS: 'runways',
  SE: 'southeast',
  SER: 'service',
  SFC: 'surface',
  SKED: 'schedule',
  SR: 'sunrise',
  SS: 'sunset',
  STN: 'station',
  SVC: 'service',
  SW: 'southwest',
  TEMPO: 'temporary',
  TFC: 'traffic',
  TFR: 'temporary flight restriction',
  THR: 'threshold',
  THRU: 'through',
  TIL: 'until',
  TKOF: 'takeoff',
  TODA: 'takeoff distance available',
  TORA: 'takeoff run available',
  TRNG: 'training',
  TRU: 'true',
  TWR: 'tower',
  TWY: 'taxiway',
  TWYS: 'taxiways',
  UAS: 'unmanned aircraft system',
  UFN: 'until further notice',
  UNAVBL: 'unavailable',
  VASI: 'visual approach slope indicator',
  WEF: 'with effect from',
  WI: 'within',
  WID: 'width',
  WIE: 'with immediate effect',
  WIP: 'work in progress',
  WX: 'weather',
};

const DAYS: Record<string, string> = {
  MON: 'Monday',
  TUE: 'Tuesday',
  WED: 'Wednesday',
  THU: 'Thursday',
  FRI: 'Friday',
  SAT: 'Saturday',
  SUN: 'Sunday',
};

const PHONETIC = new Set(
  'ALFA ALPHA BRAVO CHARLIE DELTA ECHO FOXTROT GOLF HOTEL INDIA JULIETT JULIET KILO LIMA MIKE NOVEMBER OSCAR PAPA QUEBEC ROMEO SIERRA TANGO UNIFORM VICTOR WHISKEY WHISKY XRAY YANKEE ZULU'.split(' '),
);

const KEEP_AS_WRITTEN = new Set(
  'II III IIIA IIIB IIIC ACAS CFR FDC ADIZ ADS AIP AIRAC AIRMET ATC ATIS ATZ CPDLC CTA CTR DA DH DME FIR FL GBAS GNSS GPS HF IAP ICAO IFR ILS LNAV LPV MDA MDH NDB NM NOTAM NOTAMS PAPI PBN QFE QNH RAIM RNAV RNP RVR SBAS SID SIDS SIGMET SPECI STAR STARS TACAN TAF TMA UHF UTC VASIS VFR VHF VNAV VOLMET VOR VORTAC WAAS METAR'.split(' '),
);

const US_STATES = new Set('CT DC KS KY MD MN MS MT NC ND NH NJ NM NV NY PR SC SD TN TX VT WV WY'.split(' '));

const ENGLISH_WITHOUT_VOWELS = new Set(['BY', 'MY', 'FLY', 'DRY', 'SKY', 'WHY', 'TRY', 'SPY']);

const NAVAID_WORDS = new Set(['VOR', 'DME', 'NDB', 'VORTAC', 'TACAN', 'LOC', 'IDENT', 'ILS']);

export interface ExpansionResult {
  text: string;
  unrecognised: string[];
}

function plural(n: string, one: string, many: string): string {
  return `${n} ${Number(n) === 1 ? one : many}`;
}

function groupThousands(digits: string): string {
  const n = Number(digits);
  return n >= 10000 ? n.toLocaleString('en-US') : String(n);
}

export function expandWithReport(text: string, keep: Iterable<string> = []): ExpansionResult {
  const keepSet = new Set(keep);
  const unrecognised = new Set<string>();
  let out = text.toUpperCase();

  out = out
    .replace(/\b(SFC|GND|\d+ ?FT|FL ?\d{2,3}) ?- ?(\d+ ?FT|FL ?\d{2,3}|UNL)\b/g, '$1 TO $2')
    .replace(/\b(\d+(?:\.\d+)?) ?KG\b/g, '$1 kg')
    .replace(/\bNOT AVBL\b/g, 'not available')
    .replace(/\bU\/S\b/g, 'unserviceable')
    .replace(/\bO\/R\b/g, 'on request')
    .replace(/\bH24\b/g, 'continuous, 24 hours')
    .replace(/\bSR\s?-\s?SS\b/g, 'sunrise to sunset')
    .replace(/\bSS\s?-\s?SR\b/g, 'sunset to sunrise')
    .replace(/\b(MON|TUE|WED|THU|FRI|SAT|SUN)\s?-\s?(MON|TUE|WED|THU|FRI|SAT|SUN)\b/g, (_, a: string, b: string) => `${DAYS[a]} to ${DAYS[b]}`)
    .replace(/\b(MON|TUE|WED|THU|FRI|SAT|SUN)\b/g, (d: string) => DAYS[d])
    .replace(/\b(\d+(?:\.\d+)?)\s?MHZ\b/g, '$1 MHz')
    .replace(/\b(\d+(?:\.\d+)?)\s?KHZ\b/g, '$1 kHz')
    .replace(/\b(\d+)\s?(HRS?)\b/g, (_, n: string) => plural(n, 'hour', 'hours'))
    .replace(/\b(\d+)\s?(MINS?)\b/g, (_, n: string) => plural(n, 'minute', 'minutes'))
    .replace(/\b(\d+(?:\.\d+)?)\s?NM\b/g, '$1 NM')
    .replace(/\b(\d+)\s?FT\b/g, (_, n: string) => `${groupThousands(n)} ft`)
    .replace(/\b(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?) ft\b/g, '$1-$2 ft')
    .replace(/\b(\d+(?:\.\d+)?)\s?M\b(?!\s?(?:HZ|IN)\b)/g, '$1 m')
    .replace(/\bHRS?\b/g, (w: string) => (w === 'HR' ? 'hour' : 'hours'))
    .replace(/\bMINS?\b/g, 'minutes');

  const tokens = [...out.matchAll(/\b[A-Z][A-Z0-9']*\b/g)];
  let result = '';
  let last = 0;
  let previous = '';
  for (const match of tokens) {
    const word = match[0];
    const index = match.index!;
    result += out.slice(last, index);
    last = index + word.length;
    const gap = out.slice(index - 1, index);
    let replacement: string;
    const prefixed = /^([A-Z]+)(\d[\dA-Z]*)$/.exec(word);
    if (WORDS[word]) replacement = WORDS[word];
    else if (prefixed && WORDS[prefixed[1]]) replacement = `${WORDS[prefixed[1]]} ${prefixed[2]}`;
    else if (KEEP_AS_WRITTEN.has(word) || keepSet.has(word) || US_STATES.has(word) || /^Z[A-Z]{2}$/.test(word)) replacement = word;
    else if (ENGLISH_WITHOUT_VOWELS.has(word)) replacement = word.toLowerCase();
    else if (/\d/.test(word) || word.length === 1) replacement = word;
    else if (NAVAID_WORDS.has(previous) && gap === ' ' && word.length <= 3) replacement = word;
    else if (PHONETIC.has(word)) replacement = word[0] + word.slice(1).toLowerCase();
    else if (!/[AEIOU]/.test(word)) {
      replacement = word;
      unrecognised.add(word);
    } else replacement = word.toLowerCase();
    result += replacement;
    previous = word;
  }
  result += out.slice(last);

  result = result.replace(/(^|[.!?]\s+)([a-z])/g, (_, lead: string, letter: string) => lead + letter.toUpperCase());
  return { text: result, unrecognised: [...unrecognised] };
}

export function expandContractions(text: string, keep: Iterable<string> = []): string {
  return expandWithReport(text, keep).text;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function parseNotamTime(token: string): NotamTime | null {
  if (typeof token !== 'string') return null;
  let clean = token.trim().toUpperCase();
  if (clean.endsWith('EST')) clean = clean.slice(0, -3).trim();
  if (clean.length !== 10) return null;
  const match = /^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(clean);
  if (!match) return null;
  const [year, month, day, hour, minute] = [2000 + Number(match[1]), Number(match[2]), Number(match[3]), Number(match[4]), Number(match[5])];
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > daysInMonth(year, month)) return null;
  if (hour > 23 || minute > 59) return null;
  return { year, month, day, hour, minute };
}

export function notamTimeToDate(time: NotamTime): Date {
  return new Date(Date.UTC(time.year, time.month - 1, time.day, time.hour, time.minute));
}

export function formatNotamTime(time: NotamTime): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(time.day)} ${['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][time.month]} ${time.year} ${p(time.hour)}:${p(time.minute)}Z`;
}

const ITEM_START = /^\s*(?:[QA-G]\)|\(?[A-Z][A-Z0-9]{1,6}\/\d{2,4}\s+NOTAM|!)/i;
const LINE_NUMBER = /^\s*(\d{1,3})[.:)]?\s+/;

function cutTrailer(line: string): string {
  const upper = line.toUpperCase();
  let cut = line.length;
  for (const marker of ['CREATED:', 'SOURCE:']) {
    const at = upper.indexOf(marker);
    if (at >= 0 && at < cut && (at === 0 || upper[at - 1] === ' ')) cut = at;
  }
  return line.slice(0, cut).trimEnd();
}

function displayText(input: unknown): string {
  if (typeof input !== 'string') return '';
  let lines = input.replace(/^﻿/, '').split(/\r\n|\r|\n/).map(cutTrailer);
  lines = lines.filter((line) => !/^\s*#/.test(line) && !/^\s*\d+\s+of\s+\d+$/i.test(line.trim()));

  const numbered = lines.filter((line) => line.trim()).map((line) => LINE_NUMBER.exec(line)?.[1]);
  let consecutive = 0;
  for (let i = 1; i < numbered.length; i++) {
    if (numbered[i] && numbered[i - 1] && Number(numbered[i]) === Number(numbered[i - 1]) + 1) consecutive++;
  }
  const stripAll = consecutive >= 2;
  lines = lines.map((line) => {
    const m = LINE_NUMBER.exec(line);
    if (!m) return line;
    const rest = line.slice(m[0].length);
    return stripAll || ITEM_START.test(rest) ? rest : line;
  });
  return lines.join('\n').trim();
}

function parseText(display: string): string {
  let out = '';
  for (const ch of display) {
    let c = ch;
    if (/[   \t\f\v]/.test(c)) c = ' ';
    else if (/[‐-―−]/.test(c)) c = '-';
    else if (c === '‘' || c === '’') c = "'";
    else if (c === '“' || c === '”') c = '"';
    const upper = c.toUpperCase();
    out += upper.length === c.length ? upper : c;
  }
  return out;
}

const ICAO_HEADER = /^\s*(?:[A-Z]{4}\s+)?\(?\s*(?:[A-Z][A-Z0-9]{1,6}|\d{1,3})\/\d{2,5}\s+NOTAM[NRC]?\b/;
const DOMESTIC_HEADER = /^\s*!\s?[A-Z0-9]{3,4}\s+\d{1,2}\/\d{1,5}\b/;
const SHORT_FORM = /^\s*([A-Z]{4})\s+(?:RWY|RWYS|TWY|TWYS|APN|APRON|AD|NAV|OBST|SVC|COM|AIRSPACE|ILS|VOR|NDB|DME|LGT|FUEL|ATIS|PAPI|GP|LOC)\b/;
const TIMING_TAIL = /(?:^|\s)(?:WEF\s+)?(\d{10})(?:\s*(?:-|TIL|UNTIL|TO)\s*(\d{10}|PERM|UFN)(\s?EST)?|\s+(UFN|PERM))?\s*$/;

export function splitNotams(text: string): string[] {
  const display = displayText(text);
  if (!display) return [];
  const chunks: string[][] = [];
  let current: string[] = [];
  let lastLine = '';
  let sawE = false;
  for (const line of display.split('\n')) {
    const upper = parseText(line);
    const started = lastLine !== '';
    const header = ICAO_HEADER.test(upper) || DOMESTIC_HEADER.test(upper);
    const short = started && SHORT_FORM.test(upper) && (sawE || TIMING_TAIL.test(lastLine) || /\b(?:UFN|PERM)$/.test(lastLine));
    if ((header || short) && started) {
      chunks.push(current);
      current = [];
      lastLine = '';
      sawE = false;
    }
    current.push(line);
    if (upper.trim()) lastLine = upper.trim();
    if (/^\s*E\)/.test(upper)) sawE = true;
  }
  chunks.push(current);
  return chunks.map((lines) => lines.join('\n').trim()).filter(Boolean);
}

export function decodeNotams(text: string): DecodedNotam[] {
  return splitNotams(text).map((chunk) => decodeNotam(chunk));
}

function parseCoordinate(degLat: string, minLat: string, secLat: string | undefined, hemiLat: string, degLon: string, minLon: string, secLon: string | undefined, hemiLon: string): { lat: number; lon: number } | null {
  const mLat = Number(minLat);
  const mLon = Number(minLon);
  const sLat = secLat ? Number(secLat) : 0;
  const sLon = secLon ? Number(secLon) : 0;
  if (mLat > 59 || mLon > 59 || sLat >= 60 || sLon >= 60) return null;
  const lat = Number(degLat) + mLat / 60 + sLat / 3600;
  const lon = Number(degLon) + mLon / 60 + sLon / 3600;
  if (lat > 90 || lon > 180) return null;
  return { lat: hemiLat === 'S' ? -lat : lat, lon: hemiLon === 'W' ? -lon : lon };
}

function findTextCoordinates(text: string): Array<{ raw: string; lat: number; lon: number }> {
  const found: Array<{ raw: string; lat: number; lon: number }> = [];
  const pattern = /\b(\d{2})(\d{2})(\d{2}(?:\.\d+)?)?([NS]) ?(\d{3})(\d{2})(\d{2}(?:\.\d+)?)?([EW])\b/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text.toUpperCase())) !== null) {
    if (!match[3] !== !match[7]) continue;
    const point = parseCoordinate(match[1], match[2], match[3], match[4], match[5], match[6], match[7], match[8]);
    if (point) found.push({ raw: match[0], ...point });
  }
  return found;
}

type IssueField = NotamIssue['field'];
type Report = (severity: NotamIssue['severity'], code: IssueCode, field: IssueField, message: string) => void;

function parseQLine(raw: string, issue: Report): QLine {
  const parts = raw.split('/').map((p) => p.trim());
  if (parts.length !== 8) issue('error', 'q-malformed', 'Q', `The Q) line has ${parts.length} part${parts.length === 1 ? '' : 's'} separated by slashes; it should have 8.`);
  const [fir, code, traffic, purpose, scope, lower, upper, geo] = parts;

  let subjectCode: string | null = null;
  let conditionCode: string | null = null;
  if (code && /^Q[A-Z]{4}$/.test(code)) {
    subjectCode = code.slice(1, 3);
    conditionCode = code.slice(3, 5);
    if (!Object.hasOwn(SUBJECT_CODES, subjectCode) || !Object.hasOwn(CONDITION_CODES, conditionCode)) issue('warning', 'q-code-unknown', 'Q', `The Q-code ${code} is not in the ICAO tables.`);
  } else if (code !== undefined) {
    issue('warning', 'q-code-unknown', 'Q', `The Q-code "${code.slice(0, 12)}${code.length > 12 ? '…' : ''}" should be Q followed by four letters.`);
  }

  if ((lower && !/^\d{3}$/.test(lower)) || (upper && !/^\d{3}$/.test(upper))) {
    issue('warning', 'q-limits-malformed', 'Q', 'The Q) lower and upper limits should each be three digits, in hundreds of feet.');
  } else if (lower && upper && Number(upper) < Number(lower)) {
    issue('warning', 'q-limits-inverted', 'Q', `The Q) upper limit FL${upper} is below the lower limit FL${lower}.`);
  }

  let coordinates: string | null = null;
  let radiusNm: number | null = null;
  let center: { lat: number; lon: number } | null = null;
  if (geo !== undefined) {
    const geoMatch = geo.length <= 15 ? /^(\d{2})(\d{2})([NS])(\d{3})(\d{2})([EW])(\d{3})$/.exec(geo) : null;
    if (geoMatch) {
      coordinates = `${geoMatch[1]}${geoMatch[2]}${geoMatch[3]}${geoMatch[4]}${geoMatch[5]}${geoMatch[6]}`;
      radiusNm = Number(geoMatch[7]);
      center = parseCoordinate(geoMatch[1], geoMatch[2], undefined, geoMatch[3], geoMatch[4], geoMatch[5], undefined, geoMatch[6]);
      if (!center) {
        issue('error', 'q-geo-out-of-range', 'Q', `The Q) position ${coordinates} is not a real place, so it is not drawn on the map.`);
        radiusNm = null;
      }
    } else {
      issue('warning', 'q-geo-malformed', 'Q', 'The Q) position should look like 4911N12311W005: latitude, longitude, then the radius in nautical miles.');
    }
  }

  const known = (table: Record<string, string>, value: string | undefined) => (value && Object.hasOwn(table, value) ? table[value] : null);
  return {
    raw: `Q) ${raw}`,
    fir: fir || null,
    subjectCode,
    subjectPlain: subjectCode ? SUBJECT_CODES[subjectCode] ?? null : null,
    conditionCode,
    conditionPlain: conditionCode ? CONDITION_CODES[conditionCode] ?? null : null,
    traffic: traffic || null,
    trafficPlain: known(TRAFFIC_CODES, traffic),
    purpose: purpose || null,
    purposePlain: known(PURPOSE_CODES, purpose),
    scope: scope || null,
    scopePlain: known(SCOPE_CODES, scope),
    lowerFl: lower || null,
    upperFl: upper || null,
    coordinates,
    radiusNm,
    center,
  };
}

type ItemCode = 'Q' | DecodedField['code'];

interface Item {
  code: ItemCode;
  value: string;
  upper: string;
}

const LATE_ITEM_SHAPE: Partial<Record<ItemCode, RegExp>> = {
  Q: /^\s*[A-Z]{4}\/Q/,
  A: /^\s*[A-Z]{4}\b/,
  B: /^\s*\d{10}\b/,
  C: /^\s*(?:\d{10}|PERM|UFN)\b/,
  D: /^\s*(?:DAILY|DLY|H24|HJ|HN|SR|SS|MON|TUE|WED|THU|FRI|SAT|SUN|\d{4}-\d{4})\b/,
  F: /^\s*(?:SFC|GND|UNL|FL\s?\d|\d)/,
  G: /^\s*(?:SFC|GND|UNL|FL\s?\d|\d)/,
};

function splitItems(display: string, parse: string, issue: Report): Item[] {
  const marker = /(^|[\s(])([QA-G])\)/g;
  const accepted: Array<{ code: ItemCode; start: number; valueStart: number }> = [];
  const seen = new Set<string>();
  let inE = false;
  let match: RegExpExecArray | null;
  while ((match = marker.exec(parse)) !== null) {
    const code = match[2] as ItemCode;
    const start = match.index + match[1].length;
    const valueStart = start + 2;
    let back = start - 1;
    while (back >= 0 && parse[back] === ' ') back--;
    const atLineStart = back < 0 || parse[back] === '\n';
    const after = parse.slice(valueStart, valueStart + 40);
    if (seen.has(code)) {
      if (atLineStart) issue('warning', 'item-duplicated', code as IssueField, `Item ${code}) appears more than once; only the first is used.`);
      continue;
    }
    if (inE) {
      const shape = LATE_ITEM_SHAPE[code];
      const late = code === 'F' || code === 'G' ? atLineStart || shape!.test(after) : atLineStart && !!shape && shape.test(after);
      if (!late) continue;
    } else if ((code === 'F' || code === 'G') && !atLineStart) {
      continue;
    }
    seen.add(code);
    if (code === 'E') inE = true;
    accepted.push({ code, start, valueStart });
  }
  return accepted.map((item, i) => {
    const end = i + 1 < accepted.length ? accepted[i + 1].start : parse.length;
    const clean = (s: string) => s.slice(item.valueStart, end).trim().replace(/\s+/g, ' ');
    return { code: item.code, value: clean(display), upper: clean(parse) };
  });
}

type Limit = { ft: number; ref: 'SFC' | 'AMSL' | 'AGL' | 'STD' | 'UNL' };

function parseLimit(value: string): Limit | null {
  const v = value.trim().toUpperCase();
  if (v.length > 24) return null;
  if (/^(SFC|GND)$/.test(v)) return { ft: 0, ref: 'SFC' };
  if (v === 'UNL') return { ft: Infinity, ref: 'UNL' };
  const fl = /^FL\s?(\d{2,3})$/.exec(v);
  if (fl) return { ft: Number(fl[1]) * 100, ref: 'STD' };
  const height = /^(\d{1,6})\s?(FT|M)\s?(AMSL|MSL|AGL|SFC|GND)$/.exec(v);
  if (height) {
    const ft = Number(height[1]) * (height[2] === 'M' ? 3.28084 : 1);
    return { ft, ref: height[3] === 'AGL' || height[3] === 'SFC' || height[3] === 'GND' ? 'AGL' : 'AMSL' };
  }
  return null;
}

function comparable(a: Limit, b: Limit): boolean {
  if (a.ref === 'SFC' || b.ref === 'SFC' || a.ref === 'UNL' || b.ref === 'UNL') return true;
  if (a.ref === 'AGL' || b.ref === 'AGL') return a.ref === b.ref;
  return true;
}

function checkSchedule(value: string): string | null {
  for (const range of value.matchAll(/\b(\d{2})(\d{2})-(\d{2})(\d{2})\b/g)) {
    const [sh, sm, eh, em] = [Number(range[1]), Number(range[2]), Number(range[3]), Number(range[4])];
    if (sh > 23 || sm > 59) return `${range[1]}${range[2]}`;
    if (!(eh === 24 && em === 0) && (eh > 23 || em > 59)) return `${range[3]}${range[4]}`;
  }
  const stripped = value.replace(/\b\d{4}-\d{4}\b/g, ' ');
  for (const single of stripped.matchAll(/\b(\d{2})(\d{2})\b/g)) {
    if (Number(single[1]) > 23 || Number(single[2]) > 59) return single[0];
  }
  return null;
}

const CLOSED_CONDITIONS = new Set(['LC', 'AS', 'AU', 'AW', 'LI', 'LN', 'LV', 'CT']);
const OPEN_CONDITIONS = new Set(['AK', 'AO']);
const CLOSED_WORDS = /\b(?:CLSD|CLOSED|U\/S|UNSERVICEABLE|NOT AVBL|NOT AVAILABLE|UNAVBL|INOP|WITHDRAWN|SUSPENDED)\b/;
const OPEN_WORDS = /\b(?:OPEN|OPN|REOPENED|AVBL|AVAILABLE|OPR|OPERATIONAL|RESUMED|SERVICEABLE)\b/;

const FIELD_ORDER: DecodedField['code'][] = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

const FRENCH = new Set(['PISTE', 'FERMEE', 'FERME', 'FERMÉE', 'VOIE', 'ROULEMENT', 'HORS', 'SERVICE', 'SAUF', 'ENTRE', 'ET', 'DU', 'DES', 'AU', 'AUX', 'LE', 'LA', 'LES', 'POUR', 'AVEC', 'TRAVAUX', 'CIRCULATION', 'AERODROME', 'AÉRODROME']);

function dropFrench(text: string): string {
  const segments = text.split(/\s+\/\s+|\n/);
  if (segments.length < 2) return text;
  const english = segments.filter((segment) => {
    const words = segment.toUpperCase().split(/[^A-ZÀ-Ý]+/).filter(Boolean);
    return words.filter((w) => FRENCH.has(w)).length < 2;
  });
  return english.length ? english.join(' ') : text;
}

function emptyResult(raw: string, format: DecodedNotam['format'], issues: NotamIssue[], fields: DecodedField[], plainSummary: string): DecodedNotam {
  return {
    raw, format, series: null, number: null, type: null, replaces: null, qLine: null, fields,
    effectiveFrom: null, effectiveTo: null, estimatedEnd: false, permanent: false, plainSummary,
    unrecognisedTokens: [], unstructured: true, issues, textCoordinates: [],
  };
}

interface Timing {
  from: NotamTime | null;
  to: NotamTime | null;
  permanent: boolean;
  untilFurtherNotice: boolean;
  estimated: boolean;
  fromRaw: string;
  toRaw: string | null;
}

function readTimingTail(upper: string): { timing: Timing; index: number } | null {
  const m = TIMING_TAIL.exec(upper);
  if (!m) return null;
  const end = m[2] ?? m[4] ?? null;
  return {
    index: m.index,
    timing: {
      from: parseNotamTime(m[1]),
      to: end && /^\d{10}$/.test(end) ? parseNotamTime(end) : null,
      permanent: end === 'PERM',
      untilFurtherNotice: end === 'UFN',
      estimated: !!m[3],
      fromRaw: m[1],
      toRaw: end ? `${end}${m[3] ? ' EST' : ''}` : null,
    },
  };
}

function decodeLineFormat(raw: string, display: string, parse: string, format: 'faa-domestic' | 'short'): DecodedNotam {
  const issues: NotamIssue[] = [];
  let account: string | null = null;
  let number: string | null = null;
  let location: string;
  let textStart: number;

  if (format === 'faa-domestic') {
    const m = /^!\s?([A-Z0-9]{3,4})\s+(\d{1,2}\/\d{1,5})\s+([A-Z0-9]{3,5})\s+/.exec(parse);
    if (!m) {
      issues.push({ severity: 'error', code: 'header-malformed', field: 'header', message: 'This looks like a US domestic NOTAM, but the !ACCOUNT NN/NNN LOCATION start could not be read.' });
      const plainText = display.replace(/\s+/g, ' ').trim();
      const result = emptyResult(raw, 'faa-domestic', issues, [{ code: 'E', raw: plainText, plain: expandContractions(plainText) }], sentence(expandContractions(plainText)));
      result.unrecognisedTokens = expandWithReport(plainText).unrecognised;
      return result;
    }
    [, account, number, location] = m;
    textStart = m[0].length;
  } else {
    const m = /^\s*([A-Z]{4})\s+/.exec(parse)!;
    location = m[1];
    textStart = m[0].length;
  }

  let upperText = parse.slice(textStart).replace(/\s+/g, ' ').trim();
  let displayBody = display.slice(textStart).replace(/\s+/g, ' ').trim();
  let timing: Timing | null = null;
  const tail = readTimingTail(upperText);
  if (tail) {
    timing = tail.timing;
    upperText = upperText.slice(0, tail.index).trim();
    displayBody = displayBody.slice(0, tail.index).trim();
  }
  let plainUpper = upperText;
  const effective = /\bEFFECTIVE\s+(\d{10})\s*(?:UTC\s+)?(?:UNTIL|TIL)\s+(\d{10})\s*(?:UTC)?\.?/.exec(upperText);
  if (effective) {
    if (!timing) timing = { from: parseNotamTime(effective[1]), to: parseNotamTime(effective[2]), permanent: false, untilFurtherNotice: false, estimated: false, fromRaw: effective[1], toRaw: effective[2] };
    plainUpper = (upperText.slice(0, effective.index) + upperText.slice(effective.index + effective[0].length)).replace(/\s+/g, ' ').trim();
  }

  if (timing) {
    if (!timing.from) issues.push({ severity: 'error', code: 'time-invalid', field: 'B', message: `The start time ${timing.fromRaw} is not a real date and time.` });
    if (timing.toRaw && /^\d{10}/.test(timing.toRaw) && !timing.to) issues.push({ severity: 'error', code: 'time-invalid', field: 'C', message: `The end time ${timing.toRaw} is not a real date and time.` });
    if (timing.from && timing.to && notamTimeToDate(timing.to) <= notamTimeToDate(timing.from)) {
      issues.push({ severity: 'error', code: 'time-order', field: 'C', message: `The end time ${formatNotamTime(timing.to)} is not after the start time ${formatNotamTime(timing.from)}.` });
    }
  }

  const keep = new Set([location, account ?? '', 'FDC'].filter(Boolean));
  const englishUpper = format === 'short' ? dropFrench(plainUpper) : plainUpper;
  const fields: DecodedField[] = [{ code: 'A', raw: location, plain: describeField('A', location) }];
  if (timing) {
    fields.push({ code: 'B', raw: timing.fromRaw, plain: describeField('B', timing.fromRaw) });
    if (timing.toRaw) fields.push({ code: 'C', raw: timing.toRaw, plain: describeField('C', timing.toRaw) });
  }
  fields.push({ code: 'E', raw: displayBody, plain: expandContractions(englishUpper, keep) });
  fields.sort((a, b) => FIELD_ORDER.indexOf(a.code) - FIELD_ORDER.indexOf(b.code));

  const badOrder = issues.some((i) => i.code === 'time-order');
  return {
    raw,
    format,
    series: null,
    number: account && number ? `${account} ${number}` : null,
    type: null,
    replaces: null,
    qLine: null,
    fields,
    effectiveFrom: timing?.from ?? null,
    effectiveTo: timing?.to ?? null,
    estimatedEnd: timing?.estimated ?? false,
    permanent: timing?.permanent ?? false,
    plainSummary: buildPlainSummary({
      type: null, replaces: null, qLine: null, fields,
      effectiveFrom: timing?.from ?? null, effectiveTo: badOrder ? null : timing?.to ?? null,
      permanent: timing?.permanent ?? false, estimatedEnd: timing?.estimated ?? false,
      untilFurtherNotice: timing?.untilFurtherNotice ?? false, badOrder, unstructured: false,
    }),
    unrecognisedTokens: expandWithReport(englishUpper, keep).unrecognised,
    unstructured: false,
    issues,
    textCoordinates: findTextCoordinates(upperText),
  };
}

export function decodeNotam(input: string): DecodedNotam {
  const raw = typeof input === 'string' ? input.trim() : '';
  let display = displayText(input);
  const issues: NotamIssue[] = [];
  const issue: Report = (severity, code, field, message) => {
    issues.push({ severity, code, field, message });
  };

  if (!display) {
    issue('error', 'header-missing', 'header', 'Nothing was pasted. Paste a NOTAM, starting with its number, such as A1234/26 NOTAMN.');
    return emptyResult(raw, 'text', issues, [], 'Nothing was pasted.');
  }

  if (splitNotams(display).length > 1) {
    issue('warning', 'multiple-notams', 'header', 'This paste holds more than one NOTAM. Only the first is decoded here.');
  }

  let parse = parseText(display);
  const lines = parse.split('\n');
  const headerLine = lines.slice(0, 4).findIndex((line) => ICAO_HEADER.test(line) || DOMESTIC_HEADER.test(line));
  if (headerLine > 0) {
    const offset = lines.slice(0, headerLine).join('\n').length + 1;
    display = display.slice(offset);
    parse = parse.slice(offset);
  }

  const lead = /^\s*\(\s*/.exec(parse);
  if (lead) {
    display = display.slice(lead[0].length);
    parse = parse.slice(lead[0].length);
    const close = /\)\s*$/.exec(parse);
    if (close) {
      display = display.slice(0, close.index);
      parse = parse.slice(0, close.index);
    }
  }

  if (/^\s*!/.test(parse)) return decodeLineFormat(raw, display, parse, 'faa-domestic');

  let series: string | null = null;
  let number: string | null = null;
  let type: DecodedNotam['type'] = null;
  let replaces: string | null = null;
  let bodyStart = 0;

  const icao = /^\s*(?:([A-Z]{4})\s+)?([A-Z])([A-Z0-9]{1,6})\/(\d{2,5})\s+NOTAM([NRC])?\b(?:[ ]+([A-Z]?[A-Z0-9]{1,6}\/\d{2,5}))?/.exec(parse);
  const faa = icao ? null : /^\s*(?:([A-Z]{4})\s+)?(\d{1,3}\/\d{1,5})\s+NOTAM([NRC])\b(?:[ ]+(\d{1,3}\/\d{1,5}))?/.exec(parse);
  if (icao) {
    series = icao[2];
    number = `${icao[3]}/${icao[4]}`;
    type = icao[5] ? (`NOTAM${icao[5]}` as DecodedNotam['type']) : null;
    replaces = icao[6] ?? null;
    bodyStart = icao[0].length;
    if (!/^\d{4}$/.test(icao[3]) || !/^\d{2}$/.test(icao[4]) || !type) {
      issue('error', 'header-malformed', 'header', `The NOTAM number ${series}${number}${type ? '' : ' NOTAM'} should look like A1234/26 NOTAMN: a letter, four digits, a slash and a two-digit year.`);
    }
  } else if (faa) {
    number = faa[2];
    type = `NOTAM${faa[3]}` as DecodedNotam['type'];
    replaces = faa[4] ?? null;
    bodyStart = faa[0].length;
  }
  const header = !!(icao || faa);
  if (header) {
    if ((type === 'NOTAMR' || type === 'NOTAMC') && !replaces) issue('warning', 'ref-missing', 'header', `A ${type} must name the NOTAM it ${type === 'NOTAMR' ? 'replaces' : 'cancels'}.`);
    if (type === 'NOTAMN' && replaces) issue('warning', 'ref-unexpected', 'header', `A new NOTAM (NOTAMN) should not reference ${replaces}.`);
  }

  const items = splitItems(display.slice(bodyStart), parse.slice(bodyStart), issue);

  if (!header && items.length === 0 && SHORT_FORM.test(parse)) return decodeLineFormat(raw, display, parse, 'short');

  const unstructured = items.length === 0 && !header;
  if (!header) issue('error', 'header-missing', 'header', 'There is no NOTAM number and type line, such as A1234/26 NOTAMN.');

  const qItem = items.find((i) => i.code === 'Q');
  const qLine = qItem ? parseQLine(qItem.upper, issue) : null;
  if (!qItem && !unstructured) issue('error', 'q-malformed', 'Q', 'There is no Q) line, so the subject, area and altitudes are unknown.');

  const keep = new Set<string>();
  for (const item of items) if (item.code === 'A') for (const loc of item.upper.split(/\s+/)) keep.add(loc);
  if (qLine?.fir) keep.add(qLine.fir);

  const fields: DecodedField[] = [];
  const uppers = new Map<string, string>();
  for (const item of items) {
    if (item.code === 'Q' || !item.value) continue;
    uppers.set(item.code, item.upper);
    fields.push({ code: item.code, raw: item.value, plain: describeField(item.code, item.upper, keep) });
  }
  fields.sort((a, b) => FIELD_ORDER.indexOf(a.code) - FIELD_ORDER.indexOf(b.code));

  const bodyUpper = parse.slice(bodyStart).replace(/\s+/g, ' ').trim();
  if (unstructured) {
    const bodyDisplay = display.slice(bodyStart).replace(/\s+/g, ' ').trim();
    if (bodyDisplay) fields.push({ code: 'E', raw: bodyDisplay, plain: expandContractions(bodyUpper, keep) });
  }

  const has = (code: DecodedField['code']) => fields.some((f) => f.code === code);
  const up = (code: DecodedField['code']) => uppers.get(code) ?? null;

  if (!unstructured) {
    if (!has('A')) issue('error', 'field-missing', 'A', 'There is no A) item saying where the NOTAM applies.');
    if (!has('B') && type !== 'NOTAMC') issue('error', 'field-missing', 'B', 'There is no B) item saying when the NOTAM starts.');
    if (!has('C') && type !== 'NOTAMC') issue('warning', 'field-missing', 'C', 'There is no C) item saying when the NOTAM ends.');
    if (!has('E')) issue('error', 'field-missing', 'E', 'There is no E) item with the text of the NOTAM.');
  }

  let effectiveFrom: NotamTime | null = null;
  let effectiveTo: NotamTime | null = null;
  let permanent = false;
  let estimatedEnd = false;
  let untilFurtherNotice = false;

  const b = up('B');
  const c = up('C');
  if (b) {
    if (!/^\d{10}$/.test(b)) issue('error', 'time-malformed', 'B', `The B) start time "${b.slice(0, 40)}" should be 10 digits, YYMMDDhhmm.`);
    else {
      effectiveFrom = parseNotamTime(b);
      if (!effectiveFrom) issue('error', 'time-invalid', 'B', `The B) start time ${b} is not a real date and time.`);
    }
  } else if (unstructured) {
    const tail = readTimingTail(bodyUpper);
    if (tail) {
      effectiveFrom = tail.timing.from;
      effectiveTo = tail.timing.to;
      permanent = tail.timing.permanent;
      estimatedEnd = tail.timing.estimated;
      untilFurtherNotice = tail.timing.untilFurtherNotice;
    }
  }

  if (c) {
    if (type === 'NOTAMC') issue('warning', 'cancel-has-end', 'C', 'A cancellation (NOTAMC) should not have a C) end time.');
    if (c === 'PERM') permanent = true;
    else if (c === 'UFN') {
      untilFurtherNotice = true;
      issue('error', 'time-malformed', 'C', 'UFN (until further notice) is not allowed in an ICAO C) item, which needs an end time or PERM.');
    }
    else if (!/^\d{10}(?: ?EST)?$/.test(c)) issue('error', 'time-malformed', 'C', `The C) end time "${c.slice(0, 40)}" should be 10 digits, YYMMDDhhmm, optionally followed by EST, or PERM.`);
    else {
      estimatedEnd = c.endsWith('EST');
      effectiveTo = parseNotamTime(c);
      if (!effectiveTo) issue('error', 'time-invalid', 'C', `The C) end time ${c.replace(/ ?EST$/, '')} is not a real date and time.`);
    }
  }

  let badOrder = false;
  if (effectiveFrom && effectiveTo && notamTimeToDate(effectiveTo) <= notamTimeToDate(effectiveFrom)) {
    badOrder = true;
    issue('error', 'time-order', 'C', `The end time ${formatNotamTime(effectiveTo)} is not after the start time ${formatNotamTime(effectiveFrom)}.`);
  }

  const d = up('D');
  if (d) {
    const bad = checkSchedule(d);
    if (bad) issue('warning', 'schedule-invalid', 'D', `The D) schedule has ${bad}, which is not a valid time of day.`);
  }

  const f = up('F');
  const g = up('G');
  const lower = f ? parseLimit(f) : null;
  const upper = g ? parseLimit(g) : null;
  if (f && (!lower || lower.ref === 'UNL')) issue('warning', 'limits-malformed', 'F', `The F) lower limit "${f.slice(0, 40)}" should be SFC, GND, a flight level, or a height in FT or M followed by AMSL or AGL.`);
  if (g && (!upper || upper.ref === 'SFC')) issue('warning', 'limits-malformed', 'G', `The G) upper limit "${g.slice(0, 40)}" should be UNL, a flight level, or a height in FT or M followed by AMSL or AGL.`);
  if (lower && upper && lower.ref !== 'UNL' && upper.ref !== 'SFC' && comparable(lower, upper) && lower.ft > upper.ft) {
    issue('warning', 'limits-inverted', 'F', `The F) lower limit ${f} is above the G) upper limit ${g}.`);
  }
  if (lower && upper && lower.ref !== 'UNL' && upper.ref === 'SFC' && lower.ft > 0) {
    issue('warning', 'limits-inverted', 'F', `The F) lower limit ${f} is above the G) upper limit ${g}.`);
  }

  const e = up('E');
  if (e && qLine?.conditionCode && !unstructured && type !== 'NOTAMC') {
    const saysClosed = CLOSED_WORDS.test(e);
    const saysOpen = OPEN_WORDS.test(e);
    if (CLOSED_CONDITIONS.has(qLine.conditionCode) && saysOpen && !saysClosed) {
      issue('warning', 'text-contradiction', 'E', `The Q-code says ${(qLine.conditionPlain ?? '').toLowerCase()}, but the E) text only says it is open or available.`);
    } else if (OPEN_CONDITIONS.has(qLine.conditionCode) && saysClosed && !saysOpen) {
      issue('warning', 'text-contradiction', 'E', `The Q-code says ${(qLine.conditionPlain ?? '').toLowerCase()}, but the E) text says closed or unserviceable.`);
    }
  }

  const eText = e ?? (unstructured ? bodyUpper : '');
  const unrecognisedTokens = eText ? expandWithReport(eText, keep).unrecognised : [];
  const textCoordinates = eText ? findTextCoordinates(eText) : [];
  const plainSummary = buildPlainSummary({
    type, replaces, qLine, fields, effectiveFrom, effectiveTo: badOrder ? null : effectiveTo,
    permanent, estimatedEnd, untilFurtherNotice, badOrder, unstructured,
  });

  return {
    raw,
    format: unstructured ? 'text' : 'icao',
    series,
    number,
    type,
    replaces,
    qLine,
    fields,
    effectiveFrom,
    effectiveTo,
    estimatedEnd,
    permanent,
    plainSummary,
    unrecognisedTokens,
    unstructured,
    issues,
    textCoordinates,
  };
}

function formatLimit(value: string, keep: Iterable<string>): string {
  const v = value.trim().toUpperCase();
  if (/^(SFC|GND)$/.test(v)) return 'the surface';
  if (v === 'UNL') return 'unlimited';
  const fl = /^FL\s?(\d{2,3})$/.exec(v);
  if (fl) return `flight level ${Number(fl[1])}`;
  const height = /^(\d{1,6})\s?(FT|M)\s?(AMSL|MSL|AGL|SFC|GND)?$/.exec(v);
  if (height) {
    const n = Number(height[1]).toLocaleString('en-US');
    const unit = height[2] === 'M' ? 'm' : 'ft';
    const ref = height[3] === 'AGL' || height[3] === 'SFC' || height[3] === 'GND' ? ' above ground level' : height[3] ? ' above mean sea level' : '';
    return `${n} ${unit}${ref}`;
  }
  return expandContractions(v, keep);
}

function describeField(code: DecodedField['code'], value: string, keep: Iterable<string> = []): string {
  switch (code) {
    case 'A':
      return `Applies at ${value.split(/\s+/).join(', ')}.`;
    case 'B': {
      const t = parseNotamTime(value);
      return t ? `Effective from ${formatNotamTime(t)}.` : `${value} is not a valid start time.`;
    }
    case 'C': {
      if (value === 'PERM') return 'Permanent, with no end date.';
      if (value === 'UFN') return 'Until further notice.';
      const t = parseNotamTime(value);
      return t ? `Effective until ${formatNotamTime(t)}${/EST$/.test(value) ? ' (estimated)' : ''}.` : `${value} is not a valid end time.`;
    }
    case 'D':
      return `Active ${scheduleText(value, keep)} only.`;
    case 'E':
      return expandContractions(value, keep);
    case 'F':
      return `Lower limit: ${formatLimit(value, keep)}.`;
    case 'G':
      return `Upper limit: ${formatLimit(value, keep)}.`;
    default:
      return value;
  }
}

function scheduleText(value: string, keep: Iterable<string>): string {
  const text = expandContractions(value, keep);
  return /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/.test(text) ? text : text.charAt(0).toLowerCase() + text.slice(1);
}

function sentence(text: string): string {
  const t = text.trim();
  if (!t) return t;
  return /[.!?]$/.test(t) ? t : `${t}.`;
}

function buildPlainSummary(parts: {
  type: DecodedNotam['type'];
  replaces: string | null;
  qLine: QLine | null;
  fields: DecodedField[];
  effectiveFrom: NotamTime | null;
  effectiveTo: NotamTime | null;
  permanent: boolean;
  estimatedEnd: boolean;
  untilFurtherNotice?: boolean;
  badOrder?: boolean;
  unstructured: boolean;
}): string {
  const field = (code: DecodedField['code']) => parts.fields.find((f) => f.code === code);
  const eField = field('E');
  const aField = field('A');
  const dField = field('D');
  const fField = field('F');
  const gField = field('G');
  const subject = parts.qLine?.subjectPlain ?? null;
  const conditionCode = parts.qLine?.conditionCode ?? null;
  const condition = conditionCode && conditionCode !== 'XX' && !/ (is|are|now|to|of|from|by|than|due to)$/i.test(parts.qLine?.conditionPlain ?? '') ? parts.qLine!.conditionPlain : null;

  if (parts.unstructured) {
    return eField ? sentence(eField.plain) : 'This paste had no recognisable NOTAM structure.';
  }

  const keep = [...(aField?.raw.toUpperCase().split(/\s+/) ?? []), parts.qLine?.fir ?? ''].filter(Boolean);
  const out: string[] = [];
  if (parts.type === 'NOTAMC') out.push(parts.replaces ? `Cancels ${parts.replaces}.` : 'Cancels an earlier NOTAM.');
  if (parts.type === 'NOTAMR') out.push(parts.replaces ? `Replaces ${parts.replaces}.` : 'Replaces an earlier NOTAM.');

  const where = aField ? `At ${aField.raw.toUpperCase().split(/\s+/).join(', ')}: ` : '';
  const what = eField
    ? sentence(eField.plain)
    : subject
      ? sentence(condition ? `${subject} ${condition.charAt(0).toLowerCase()}${condition.slice(1)}` : subject)
      : 'No text was included.';
  out.push(`${where}${what}`);

  if (fField || gField) {
    const lower = fField ? formatLimit(fField.raw, keep) : null;
    const upper = gField ? formatLimit(gField.raw, keep) : null;
    out.push(lower && upper ? `From ${lower} up to ${upper}.` : lower ? `From ${lower} upwards.` : `Up to ${upper}.`);
  }

  if (parts.type !== 'NOTAMC') {
    const schedule = dField ? `, ${scheduleText(dField.raw, keep)} only` : '';
    if (parts.badOrder) {
      out.push('The end time is not after the start time, so when this applies is unclear.');
    } else if (parts.permanent) {
      out.push(parts.effectiveFrom ? `In effect from ${formatNotamTime(parts.effectiveFrom)}${schedule}, permanent with no end date.` : `In effect permanently${schedule}.`);
    } else if (parts.effectiveFrom && parts.effectiveTo) {
      out.push(`In effect from ${formatNotamTime(parts.effectiveFrom)} to ${formatNotamTime(parts.effectiveTo)}${parts.estimatedEnd ? ' (estimated)' : ''}${schedule}.`);
    } else if (parts.effectiveFrom) {
      out.push(`In effect from ${formatNotamTime(parts.effectiveFrom)}${parts.untilFurtherNotice ? ' until further notice' : ''}${schedule}.`);
    } else if (schedule) {
      out.push(`Active${schedule}.`);
    }
  }

  return out.join(' ').trim();
}
