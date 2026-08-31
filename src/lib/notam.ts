export type NotamItemKind = 'series-number' | 'type' | 'q-line' | 'field' | 'schedule' | 'lower-upper' | 'unknown';

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
}

export interface DecodedNotam {
  raw: string;
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
  AC: 'Class B/C/D/E surface area',
  AD: 'Aerodrome',
  AE: 'Air traffic services airspace',
  AF: 'Aerodrome flight information service',
  AH: 'Minimum sector altitude / altitude area',
  AL: 'Approach lighting system',
  AN: 'Runway approach navigation aid',
  AO: 'Aerodrome obstacle',
  AP: 'Aerodrome or apron',
  AR: 'Air traffic services route',
  AT: 'Terminal control area',
  AU: 'Upper control area',
  AV: 'Upper information region',
  AW: 'Airway',
  AX: 'Intersection',
  AZ: 'Aerodrome traffic zone',
  CA: 'Air traffic services airspace, communications',
  CB: 'ADS-B',
  CE: 'En-route surveillance radar',
  CG: 'GNSS',
  CL: 'Selective calling system',
  CM: 'Surface movement radar',
  CP: 'CPDLC',
  CR: 'Surveillance radar',
  CS: 'Secondary surveillance radar',
  CT: 'Radio telephony',
  FA: 'Aerodrome',
  FF: 'Fire fighting and rescue',
  FM: 'Meteorological service',
  FS: 'Snow removal equipment',
  FU: 'Fuel availability',
  GA: 'GNSS airfield-specific',
  GW: 'Wide area augmentation system',
  IC: 'Instrument landing system',
  ID: 'ILS DME',
  IG: 'Glide path',
  II: 'Inner marker',
  IL: 'Localizer',
  IM: 'Middle marker',
  IN: 'Localizer (non-ILS)',
  IO: 'Outer marker',
  IS: 'ILS category I',
  IT: 'ILS category II',
  IU: 'ILS category III',
  IW: 'Microwave landing system',
  IX: 'Locator, outer',
  IY: 'Locator, middle',
  LA: 'Approach lighting',
  LB: 'Aerodrome beacon',
  LC: 'Runway centre-line lights',
  LD: 'Landing direction indicator lights',
  LE: 'Runway edge lights',
  LF: 'Sequenced flashing lights',
  LG: 'Pilot-controlled lighting',
  LH: 'High intensity runway lights',
  LI: 'Runway end identifier lights',
  LJ: 'Runway alignment indicator lights',
  LK: 'CAT II components of ALS',
  LL: 'Low intensity runway lights',
  LM: 'Medium intensity runway lights',
  LP: 'PAPI',
  LR: 'All landing area lighting',
  LS: 'Stopway lights',
  LT: 'Threshold lights',
  LU: 'Helicopter approach path indicator',
  LV: 'VASIS',
  LW: 'Heliport lighting',
  LX: 'Taxiway centre-line lights',
  LY: 'Taxiway edge lights',
  LZ: 'Runway touchdown zone lights',
  MA: 'Movement area',
  MB: 'Bearing strength',
  MD: 'Declared distances',
  MG: 'Taxiing guidance system',
  MH: 'Runway arresting gear',
  MK: 'Parking area',
  MM: 'Daylight markings',
  MN: 'Apron',
  MO: 'Stopbar',
  MP: 'Aircraft stands',
  MR: 'Stopway',
  MS: 'Runway strip / shoulder',
  MT: 'Threshold',
  MU: 'Runway turning bay',
  MW: 'Strip / shoulder',
  MX: 'Taxiway',
  MY: 'Rapid exit taxiway',
  NA: 'Air navigation service overall',
  NB: 'NDB',
  NC: 'DECCA',
  NF: 'Fan marker',
  NL: 'Locator',
  NM: 'VOR/DME',
  NN: 'TACAN',
  NO: 'OMEGA',
  NT: 'VORTAC',
  NV: 'VOR',
  NX: 'DME',
  OA: 'Aeronautical information service',
  OB: 'Obstacle',
  OE: 'Aircraft entry requirements',
  OL: 'Obstacle lights on structures',
  OR: 'Rescue coordination centre',
  PA: 'Standard instrument arrival',
  PB: 'Noise abatement procedure',
  PC: 'Contingency procedure',
  PD: 'Standard instrument departure',
  PE: 'Standard VFR route',
  PF: 'Flow control procedure',
  PH: 'Holding procedure',
  PI: 'Instrument approach procedure',
  PK: 'VFR approach/departure/transit route',
  PL: 'Flight plan processing',
  PM: 'Aerodrome operating minima',
  PN: 'RNAV procedure',
  PO: 'Obstacle clearance altitude/height',
  PR: 'Radio failure procedure',
  PT: 'Transition altitude/level',
  PU: 'Missed approach procedure',
  PX: 'Minimum holding altitude',
  PZ: 'ADIZ procedure',
  RA: 'Airspace reservation',
  RD: 'Danger area',
  RM: 'Military operating area',
  RO: 'Overflying of danger/military area',
  RP: 'Prohibited area',
  RR: 'Restricted area',
  RT: 'ATS route',
  SA: 'Automatic terminal information service',
  SB: 'ATS reporting office',
  SC: 'Area control centre',
  SE: 'Flight information service',
  SF: 'Flight service station',
  SL: 'Flow control centre',
  SO: 'Oceanic area control centre',
  SP: 'Approach control service',
  SS: 'Flight service station (aeradio)',
  ST: 'Aerodrome control tower',
  SU: 'Upper area control centre',
  SV: 'VOLMET service',
  SY: 'Approach control radar service',
  WA: 'Air display',
  WB: 'Aerobatics',
  WC: 'Captive balloon or kite',
  WD: 'Demolition of explosives',
  WE: 'Exercises',
  WF: 'Air refuelling',
  WG: 'Glider flying',
  WH: 'Blasting',
  WJ: 'Banner/target towing',
  WL: 'Ascent of free balloon',
  WM: 'Missile, gun or rocket firing',
  WP: 'Parachute jumping, paragliding, hang gliding',
  WR: 'Radioactive materials/toxic chemicals',
  WS: 'Burning/blowing gas',
  WT: 'Mass movement of aircraft',
  WU: 'Unmanned aircraft',
  WV: 'Formation flight',
  WW: 'Significant volcanic activity',
  WY: 'Aerial survey',
  WZ: 'Model flying',
  XX: 'Other information',
};

const CONDITION_CODES: Record<string, string> = {
  AC: 'Withdrawn for maintenance',
  AD: 'Available for daylight use',
  AF: 'Flight checked and found reliable',
  AG: 'Operating but ground checked only, awaiting flight check',
  AH: 'Hours of service changed',
  AK: 'Resumed normal operations',
  AM: 'Military operations only',
  AN: 'Available for night use',
  AO: 'Operational',
  AP: 'Available for prior permission only',
  AR: 'Available on request',
  AS: 'Unserviceable',
  AU: 'Not available',
  AW: 'Completely withdrawn',
  AX: 'Previously promulgated shutdown cancelled',
  CA: 'Activated',
  CC: 'Completed',
  CD: 'Deactivated',
  CE: 'Erected',
  CF: 'Operating frequency changed',
  CG: 'Downgraded',
  CH: 'Changed',
  CI: 'Identification or radio call sign changed',
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
  HC: 'Covered by compacted snow',
  HD: 'Dry',
  HE: 'Covered by water',
  HF: 'Free of snow and ice',
  HG: 'Grass cutting in progress or completed',
  HH: 'Hazard due to',
  HI: 'Covered by ice',
  HJ: 'Launch planned',
  HK: 'Bird migration in progress',
  HL: 'Snow clearance completed',
  HM: 'Marked by',
  HN: 'Covered by wet snow',
  HO: 'Obscured by snow',
  HP: 'Snow clearance in progress',
  HQ: 'Operation cancelled',
  HR: 'Standing water',
  HS: 'Sanding in progress or completed',
  HT: 'Approach according to signal area only',
  HU: 'Under water',
  HV: 'Work completed',
  HW: 'Work in progress',
  HX: 'Concentration of birds',
  HY: 'Snow banks or ridges',
  HZ: 'Covered by frozen ruts or ridges',
  LA: 'Operating without auxiliary power supply',
  LB: 'Reduced intensity',
  LC: 'Colour or intensity changed',
  LE: 'Erected',
  LF: 'Failed or unserviceable',
  LG: 'Operating with standby power',
  LH: 'Damaged',
  LI: 'Improperly signed or marked',
  LL: 'Illuminated',
  LN: 'Not illuminated',
  LP: 'Switched off',
  LR: 'Withdrawn',
  LS: 'No control from tower',
  LT: 'Temporary',
  LU: 'Not available',
  LW: 'Will take place',
  LX: 'Operating',
  MA: 'Withdrawn',
  MC: 'Closed',
  MD: 'Displaced',
  MG: 'Downgraded',
  MH: 'Damaged',
  MK: 'Not usable for aircraft ground movement',
  MM: 'Marking incomplete or missing',
  MN: 'Entry prohibited',
  MO: 'Operational',
  MP: 'Prohibited to a certain category',
  MR: 'Temporarily closed',
  MS: 'Unsafe',
  MT: 'Not maintained',
  MU: 'Reduced strength',
  MW: 'Reduced width',
  MX: 'Closed',
  NA: 'Resumed normal operations',
  NB: 'Reduced capacity',
  NC: 'Cancelled',
  NE: 'New procedure',
  NF: 'Flow control procedure',
  NL: 'Long-term plan',
  NM: 'Military use only',
  NO: 'Not applicable',
  NP: 'Prohibited to',
  NS: 'New system in use',
  NT: 'New',
  NW: 'Will take place',
  OA: 'Reduced hours',
  OL: 'Obscured',
  OR: 'Sunrise/sunset',
  RD: 'Deactivated',
  RE: 'Erected',
  RR: 'Activated',
  WA: 'Will take place',
  WB: 'Present',
  WC: 'Cancelled',
  WE: 'Withdrawn',
  WT: 'Temporarily',
};

const TRAFFIC_CODES: Record<string, string> = { I: 'IFR', V: 'VFR', IV: 'IFR and VFR', K: 'NOTAMC (checklist)' };
const PURPOSE_CODES: Record<string, string> = {
  N: 'immediate attention',
  B: 'briefing pack entry',
  O: 'operationally significant',
  M: 'miscellaneous',
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

const CONTRACTIONS: Array<[RegExp, string]> = [
  [/\bRWY\b/g, 'runway'],
  [/\bRWYS\b/g, 'runways'],
  [/\bTWY\b/g, 'taxiway'],
  [/\bTWYS\b/g, 'taxiways'],
  [/\bAPRON\b/g, 'apron'],
  [/\bAPRN\b/g, 'apron'],
  [/\bAD\b/g, 'aerodrome'],
  [/\bARR\b/g, 'arrival'],
  [/\bDEP\b/g, 'departure'],
  [/\bCLSD\b/g, 'closed'],
  [/\bCLOSED\b/g, 'closed'],
  [/\bU\/S\b/g, 'unserviceable'],
  [/\bUNSERVICEABLE\b/g, 'unserviceable'],
  [/\bWIP\b/g, 'work in progress'],
  [/\bOBST\b/g, 'obstacle'],
  [/\bOBSTN\b/g, 'obstruction'],
  [/\bCRANE\b/g, 'crane'],
  [/\bELEV\b/g, 'elevation'],
  [/\bAGL\b/g, 'above ground level'],
  [/\bAMSL\b/g, 'above mean sea level'],
  [/\bMSL\b/g, 'mean sea level'],
  [/\bPPR\b/g, 'prior permission required'],
  [/\bO\/R\b/g, 'on request'],
  [/\bH24\b/g, 'continuous, 24 hours'],
  [/\bDLY\b/g, 'daily'],
  [/\bHR\b/g, 'hour'],
  [/\bHRS\b/g, 'hours'],
  [/\bMIN\b/g, 'minute'],
  [/\bMINS\b/g, 'minutes'],
  [/\bEXC\b/g, 'except'],
  [/\bBTN\b/g, 'between'],
  [/\bAPCH\b/g, 'approach'],
  [/\bAPPROACH\b/g, 'approach'],
  [/\bDEP'G\b/g, 'departing'],
  [/\bLGT\b/g, 'lighting'],
  [/\bLGTS\b/g, 'lights'],
  [/\bLGTD\b/g, 'lighted'],
  [/\bILS\b/g, 'instrument landing system'],
  [/\bLOC\b/g, 'localizer'],
  [/\bGP\b/g, 'glide path'],
  [/\bDME\b/g, 'distance measuring equipment'],
  [/\bVOR\b/g, 'VOR'],
  [/\bNDB\b/g, 'non-directional beacon'],
  [/\bGPS\b/g, 'GPS'],
  [/\bGNSS\b/g, 'satellite navigation'],
  [/\bMAINT\b/g, 'maintenance'],
  [/\bCONST\b/g, 'construction'],
  [/\bEQPT\b/g, 'equipment'],
  [/\bAVBL\b/g, 'available'],
  [/\bNOT AVBL\b/g, 'not available'],
  [/\bUNAVBL\b/g, 'unavailable'],
  [/\bTEMPO\b/g, 'temporarily'],
  [/\bPERM\b/g, 'permanently'],
  [/\bDECMSN\b/g, 'decommissioned'],
  [/\bDECOMMISSIONED\b/g, 'decommissioned'],
  [/\bCTC\b/g, 'contact'],
  [/\bFREQ\b/g, 'frequency'],
  [/\bIAW\b/g, 'in accordance with'],
  [/\bWEF\b/g, 'with effect from'],
  [/\bTIL\b/g, 'until'],
  [/\bIMMED\b/g, 'immediately'],
  [/\bIMM\b/g, 'immediately'],
  [/\bIDENT\b/g, 'identification'],
  [/\bMAX\b/g, 'maximum'],
  [/\bMNM\b/g, 'minimum'],
  [/\bALT\b/g, 'altitude'],
  [/\bHGT\b/g, 'height'],
  [/\bAPT\b/g, 'airport'],
  [/\bTFC\b/g, 'traffic'],
  [/\bACFT\b/g, 'aircraft'],
  [/\bPSN\b/g, 'position'],
  [/\bDIST\b/g, 'distance'],
  [/\bTHR\b/g, 'threshold'],
  [/\bDISPL\b/g, 'displaced'],
  [/\bREDL\b/g, 'runway edge lights'],
  [/\bPAPI\b/g, 'precision approach path indicator'],
  [/\bVASI\b/g, 'visual approach slope indicator'],
  [/\bASPH\b/g, 'asphalt'],
  [/\bCONC\b/g, 'concrete'],
  [/\bSFC\b/g, 'surface'],
  [/\bDEG\b/g, 'degrees'],
  [/\bMAG\b/g, 'magnetic'],
  [/\bTRU\b/g, 'true'],
  [/\bFLW\b/g, 'follow'],
  [/\bINFO\b/g, 'information'],
  [/\bNML\b/g, 'normal'],
  [/\bOPR\b/g, 'operate'],
  [/\bOPS\b/g, 'operations'],
  [/\bPROC\b/g, 'procedure'],
  [/\bPROCS\b/g, 'procedures'],
  [/\bREQ\b/g, 'require'],
  [/\bRTE\b/g, 'route'],
  [/\bSKED\b/g, 'schedule'],
  [/\bSVC\b/g, 'service'],
  [/\bSER\b/g, 'service'],
  [/\bSTN\b/g, 'station'],
  [/\bVICTOR\b/g, 'Victor airway'],
  [/\bWI\b/g, 'within'],
  [/\bWIE\b/g, 'with immediate effect'],
  [/\bFLT\b/g, 'flight'],
  [/\bFLTS\b/g, 'flights'],
  [/\bNR\b/g, 'number'],
  [/\bEXP\b/g, 'expect'],
  [/\bEST\b/g, 'estimated'],
  [/\bDECLARED\b/g, 'declared'],
  [/\bTORA\b/g, 'takeoff run available'],
  [/\bTODA\b/g, 'takeoff distance available'],
  [/\bASDA\b/g, 'accelerate-stop distance available'],
  [/\bLDA\b/g, 'landing distance available'],
];

export function expandContractions(text: string): string {
  let out = text;
  for (const [pattern, replacement] of CONTRACTIONS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

export function parseNotamTime(token: string): NotamTime | null {
  const clean = token.trim().replace(/\s*EST\s*$/i, '').trim();
  const match = /^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(clean);
  if (!match) return null;
  const [, yy, mm, dd, hh, min] = match;
  return {
    year: 2000 + Number(yy),
    month: Number(mm),
    day: Number(dd),
    hour: Number(hh),
    minute: Number(min),
  };
}

export function notamTimeToDate(time: NotamTime): Date {
  return new Date(Date.UTC(time.year, time.month - 1, time.day, time.hour, time.minute));
}

export function formatNotamTime(time: NotamTime): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(time.day)} ${['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][time.month]} ${time.year} ${p(time.hour)}:${p(time.minute)}Z`;
}

function parseQLine(raw: string): QLine {
  const body = raw.replace(/^Q\)\s*/, '').trim();
  const parts = body.split('/').map((p) => p.trim());
  const [fir, code, traffic, purpose, scope, lower, upper, geo] = parts;

  const subjectCode = code && code.length >= 5 ? code.slice(1, 3) : null;
  const conditionCode = code && code.length >= 5 ? code.slice(3, 5) : null;

  let coordinates: string | null = null;
  let radiusNm: number | null = null;
  if (geo) {
    const geoMatch = /^(\d{4}[NS]\d{5}[EW])(\d{3})$/.exec(geo);
    if (geoMatch) {
      coordinates = geoMatch[1];
      radiusNm = Number(geoMatch[2]);
    }
  }

  return {
    raw,
    fir: fir || null,
    subjectCode,
    subjectPlain: subjectCode ? SUBJECT_CODES[subjectCode] ?? null : null,
    conditionCode,
    conditionPlain: conditionCode ? CONDITION_CODES[conditionCode] ?? null : null,
    traffic: traffic || null,
    trafficPlain: traffic ? TRAFFIC_CODES[traffic] ?? null : null,
    purpose: purpose || null,
    purposePlain: purpose ? PURPOSE_CODES[purpose] ?? null : null,
    scope: scope || null,
    scopePlain: scope ? SCOPE_CODES[scope] ?? null : null,
    lowerFl: lower || null,
    upperFl: upper || null,
    coordinates,
    radiusNm,
  };
}

const FIELD_LABELS: Record<DecodedField['code'], string> = {
  A: 'Location',
  B: 'Effective from',
  C: 'Effective until',
  D: 'Schedule',
  E: 'Text',
  F: 'Lower limit',
  G: 'Upper limit',
};

export function decodeNotam(input: string): DecodedNotam {
  const raw = input.trim();
  const unrecognisedTokens: string[] = [];

  let series: string | null = null;
  let number: string | null = null;
  let type: DecodedNotam['type'] = null;
  let replaces: string | null = null;

  const headerMatch = /^([A-Z])(\d{4}\/\d{2})\s+(NOTAM[NRC])(?:\s+([A-Z]\d{4}\/\d{2}))?/.exec(raw);
  if (headerMatch) {
    series = headerMatch[1];
    number = headerMatch[2];
    type = headerMatch[3] as DecodedNotam['type'];
    replaces = headerMatch[4] ?? null;
  }

  const qLineMatch = /Q\)[^\n]*/.exec(raw);
  const qLine = qLineMatch ? parseQLine(qLineMatch[0]) : null;

  const fields: DecodedField[] = [];
  const fieldRegex = /([A-G])\)\s*([\s\S]*?)(?=(?:[A-G]\)|$))/g;
  let match: RegExpExecArray | null;
  while ((match = fieldRegex.exec(raw)) !== null) {
    const code = match[1];
    if (code === 'Q') continue;
    const value = match[2].trim().replace(/\s+/g, ' ');
    if (!value) continue;
    const kind = code as DecodedField['code'];
    fields.push({ code: kind, raw: value, plain: describeField(kind, value) });
  }

  const unstructured = fields.length === 0 && !qLine && !series;
  if (unstructured) {
    const plain = expandContractions(raw.replace(/^!\S+\s*/, '').replace(/\s+/g, ' ').trim());
    fields.push({ code: 'E', raw: raw.trim(), plain });
  }

  const bField = fields.find((f) => f.code === 'B');
  const cField = fields.find((f) => f.code === 'C');
  const wefMatch = unstructured ? /\bWEF\s*(\d{10})\b/i.exec(raw) : null;
  const tilMatch = unstructured ? /\bTIL\s*(\d{10})\b/i.exec(raw) : null;
  const effectiveFrom = bField ? parseNotamTime(bField.raw) : wefMatch ? parseNotamTime(wefMatch[1]) : null;
  const permanent = /\bPERM\b/i.test(cField?.raw ?? '') || (unstructured && /\bUFN\b/i.test(raw));
  const estimatedEnd = /EST\s*$/i.test(cField?.raw ?? '');
  const effectiveTo = cField && !permanent ? parseNotamTime(cField.raw) : tilMatch && !permanent ? parseNotamTime(tilMatch[1]) : null;

  const eField = fields.find((f) => f.code === 'E');
  if (eField) {
    const expanded = expandContractions(eField.raw);
    const leftoverTokens = expanded.match(/\b[A-Z]{2,6}\b/g) ?? [];
    const KNOWN_ACRONYMS = new Set(['GPS', 'VOR', 'GNSS', 'NOTAM', 'BY', 'MY']);
    for (const token of leftoverTokens) {
      if (/[AEIOU]/.test(token)) continue;
      if (KNOWN_ACRONYMS.has(token) || unrecognisedTokens.includes(token)) continue;
      unrecognisedTokens.push(token);
    }
  }

  const plainSummary = buildPlainSummary({ series, number, type, replaces, qLine, fields, effectiveFrom, effectiveTo, permanent, estimatedEnd, unstructured });

  return {
    raw,
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
  };
}

function describeField(code: DecodedField['code'], value: string): string {
  switch (code) {
    case 'A':
      return `Applies at ${value.split(/\s+/).join(', ')}.`;
    case 'B': {
      const t = parseNotamTime(value);
      return t ? `Effective from ${formatNotamTime(t)}.` : `Effective from ${value}.`;
    }
    case 'C': {
      if (/PERM/i.test(value)) return 'Permanent — no end date given.';
      const t = parseNotamTime(value);
      return t ? `Effective until ${formatNotamTime(t)}${/EST/i.test(value) ? ' (estimated)' : ''}.` : `Effective until ${value}.`;
    }
    case 'D':
      return `Active on this schedule: ${expandContractions(value)}.`;
    case 'E':
      return expandContractions(value);
    case 'F':
      return `Lower limit ${value}.`;
    case 'G':
      return `Upper limit ${value}.`;
    default:
      return value;
  }
}

function buildPlainSummary(parts: {
  series: string | null;
  number: string | null;
  type: DecodedNotam['type'];
  replaces: string | null;
  qLine: QLine | null;
  fields: DecodedField[];
  effectiveFrom: NotamTime | null;
  effectiveTo: NotamTime | null;
  permanent: boolean;
  estimatedEnd: boolean;
  unstructured: boolean;
}): string {
  const eField = parts.fields.find((f) => f.code === 'E');
  const aField = parts.fields.find((f) => f.code === 'A');
  const subject = parts.qLine?.subjectPlain ?? null;
  const condition = parts.qLine?.conditionPlain ?? null;

  if (parts.unstructured) {
    return eField ? eField.plain : 'This paste had no recognisable NOTAM structure.';
  }

  const chunks: string[] = [];
  if (aField) chunks.push(`At ${aField.raw.split(/\s+/).join(', ')}`);
  if (subject) chunks.push(condition ? `${subject.toLowerCase()} — ${condition.toLowerCase()}` : subject.toLowerCase());
  const lead = chunks.join(', ') || 'This NOTAM';

  const bodyText = eField ? expandContractions(eField.raw) : 'no free-text description was included.';

  const timing = parts.permanent
    ? 'in effect with no scheduled end.'
    : parts.effectiveFrom && parts.effectiveTo
      ? `from ${formatNotamTime(parts.effectiveFrom)} to ${formatNotamTime(parts.effectiveTo)}${parts.estimatedEnd ? ' (estimated)' : ''}.`
      : parts.effectiveFrom
        ? `starting ${formatNotamTime(parts.effectiveFrom)}.`
        : '';

  return `${lead[0].toUpperCase()}${lead.slice(1)}: ${bodyText}${timing ? ` In effect ${timing}` : ''}`.trim();
}
