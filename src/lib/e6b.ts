const ISA_SL_TEMP_C = 15;
const ISA_LAPSE_PER_1000FT = 1.98;
const KELVIN = 273.15;

export function isaTempC(pressureAltFt: number): number {
  return ISA_SL_TEMP_C - ISA_LAPSE_PER_1000FT * (pressureAltFt / 1000);
}

export function isaDeviationC(pressureAltFt: number, oatC: number): number {
  return oatC - isaTempC(pressureAltFt);
}

export function densityRatio(pressureAltFt: number, oatC: number): number {
  const pressureRatio = Math.pow(1 - 6.8755856e-6 * pressureAltFt, 5.2558797);
  const tempRatioSL = (oatC + KELVIN) / (ISA_SL_TEMP_C + KELVIN);
  return pressureRatio / tempRatioSL;
}

export interface TasResult {
  tasKt: number;
  densityAltFt: number;
  densityRatio: number;
  isaDevC: number;
}

export function trueAirspeed(casKt: number, pressureAltFt: number, oatC: number): TasResult {
  const sigma = densityRatio(pressureAltFt, oatC);
  const isaDev = isaDeviationC(pressureAltFt, oatC);
  const densityAltFt = pressureAltFt + 118.8 * isaDev;
  return {
    tasKt: casKt / Math.sqrt(sigma),
    densityAltFt: Math.round(densityAltFt),
    densityRatio: sigma,
    isaDevC: isaDev,
  };
}

export interface WindTriangleInput {
  trueCourseDeg: number;
  tasKt: number;
  windFromDeg: number;
  windSpeedKt: number;
}

export interface WindTriangleResult {
  headingDeg: number;
  windCorrectionAngleDeg: number;
  groundSpeedKt: number;
  relativeWindAngleDeg: number;
  headwindKt: number;
  crosswindKt: number;
  crosswindFrom: 'left' | 'right' | 'none';
}

function normalize180(deg: number): number {
  let d = deg % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

function normalize360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

export function windTriangle(input: WindTriangleInput): WindTriangleResult | null {
  const { trueCourseDeg, tasKt, windFromDeg, windSpeedKt } = input;
  if (tasKt <= 0) return null;

  const relative = normalize180(windFromDeg - trueCourseDeg);
  const relRad = (relative * Math.PI) / 180;

  const ratio = (windSpeedKt / tasKt) * Math.sin(relRad);
  if (Math.abs(ratio) > 1) return null;

  const wcaRad = Math.asin(ratio);
  const wcaDeg = (wcaRad * 180) / Math.PI;
  const heading = normalize360(trueCourseDeg + wcaDeg);
  const groundSpeed = tasKt * Math.cos(wcaRad) - windSpeedKt * Math.cos(relRad);

  const crosswind = windSpeedKt * Math.sin(relRad);
  const headwind = windSpeedKt * Math.cos(relRad);

  return {
    headingDeg: heading,
    windCorrectionAngleDeg: wcaDeg,
    groundSpeedKt: groundSpeed,
    relativeWindAngleDeg: relative,
    headwindKt: headwind,
    crosswindKt: Math.abs(crosswind),
    crosswindFrom: crosswind > 0.05 ? 'right' : crosswind < -0.05 ? 'left' : 'none',
  };
}

export interface TfdInput {
  distanceNm: number | null;
  groundSpeedKt: number | null;
  timeMin: number | null;
  fuelBurnGph: number | null;
  fuelOnBoardGal: number | null;
}

export interface TfdResult {
  distanceNm: number | null;
  groundSpeedKt: number | null;
  timeMin: number | null;
  fuelUsedGal: number | null;
  fuelRemainingGal: number | null;
  enduranceMin: number | null;
  solvedFor: string[];
}

export function timeFuelDistance(input: TfdInput): TfdResult {
  let { distanceNm, groundSpeedKt, timeMin } = input;
  const solvedFor: string[] = [];
  const timeHr = () => (timeMin != null ? timeMin / 60 : null);

  if (timeMin == null && distanceNm != null && groundSpeedKt != null && groundSpeedKt > 0) {
    timeMin = (distanceNm / groundSpeedKt) * 60;
    solvedFor.push('time');
  } else if (distanceNm == null && groundSpeedKt != null && timeMin != null) {
    distanceNm = groundSpeedKt * (timeMin / 60);
    solvedFor.push('distance');
  } else if (groundSpeedKt == null && distanceNm != null && timeMin != null && timeMin > 0) {
    groundSpeedKt = distanceNm / (timeMin / 60);
    solvedFor.push('groundspeed');
  }

  const hr = timeHr();
  const fuelUsedGal = input.fuelBurnGph != null && hr != null ? input.fuelBurnGph * hr : null;
  const fuelRemainingGal =
    input.fuelOnBoardGal != null && fuelUsedGal != null ? input.fuelOnBoardGal - fuelUsedGal : null;
  const enduranceMin =
    input.fuelOnBoardGal != null && input.fuelBurnGph != null && input.fuelBurnGph > 0
      ? (input.fuelOnBoardGal / input.fuelBurnGph) * 60
      : null;

  return {
    distanceNm: distanceNm ?? null,
    groundSpeedKt: groundSpeedKt ?? null,
    timeMin: timeMin ?? null,
    fuelUsedGal,
    fuelRemainingGal,
    enduranceMin,
    solvedFor,
  };
}

export function formatHm(minutes: number | null): string {
  if (minutes == null || !Number.isFinite(minutes) || minutes < 0) return '—';
  const totalMin = Math.round(minutes);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m} min`;
}

export function pad3(n: number): string {
  return String(Math.round(n)).padStart(3, '0');
}
