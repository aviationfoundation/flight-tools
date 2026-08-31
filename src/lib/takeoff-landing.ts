import { densityRatio } from './e6b';

export type Surface = 'paved-dry' | 'paved-wet' | 'grass-dry' | 'grass-wet';

export const SURFACE_LABELS: Record<Surface, string> = {
  'paved-dry': 'Paved, dry',
  'paved-wet': 'Paved, wet',
  'grass-dry': 'Grass or turf, dry and firm',
  'grass-wet': 'Grass or turf, wet or soft',
};

const SURFACE_FACTORS: Record<Surface, { takeoff: number; landing: number }> = {
  'paved-dry': { takeoff: 1.0, landing: 1.0 },
  'paved-wet': { takeoff: 1.0, landing: 1.3 },
  'grass-dry': { takeoff: 1.15, landing: 1.15 },
  'grass-wet': { takeoff: 1.3, landing: 1.45 },
};

export interface DistanceInput {
  phase: 'takeoff' | 'landing';
  baselineDistanceFt: number;
  baselineWeightLb: number;
  actualWeightLb: number;
  pressureAltFt: number;
  oatC: number;
  windComponentKt: number;
  surface: Surface;
  slopePercent: number;
}

export interface DistanceStep {
  key: string;
  label: string;
  factor: number;
  runningFt: number;
  detail: string;
}

export interface DistanceResult {
  steps: DistanceStep[];
  finalFt: number;
  densityAltFt: number;
  densityRatio: number;
  totalFactor: number;
}

export function computeDistance(input: DistanceInput): DistanceResult {
  const steps: DistanceStep[] = [];
  let running = input.baselineDistanceFt;

  steps.push({
    key: 'baseline',
    label: 'POH baseline',
    factor: 1,
    runningFt: running,
    detail: `Sea level, standard day, ${input.baselineWeightLb.toLocaleString('en-US')} lb, no wind, paved level runway — read straight off your chart.`,
  });

  const weightRatio = input.actualWeightLb / input.baselineWeightLb;
  const weightFactor = weightRatio * weightRatio;
  running *= weightFactor;
  steps.push({
    key: 'weight',
    label: 'Weight',
    factor: weightFactor,
    runningFt: running,
    detail: `${input.actualWeightLb.toLocaleString('en-US')} lb vs. ${input.baselineWeightLb.toLocaleString('en-US')} lb baseline — distance scales with the square of the weight ratio (${weightRatio.toFixed(3)}²).`,
  });

  const sigma = densityRatio(input.pressureAltFt, input.oatC);
  const densityFactor = 1 / sigma;
  running *= densityFactor;
  const densityAltFt = Math.round(input.pressureAltFt + 118.8 * (input.oatC - (15 - 1.98 * (input.pressureAltFt / 1000))));
  steps.push({
    key: 'density',
    label: 'Density altitude',
    factor: densityFactor,
    runningFt: running,
    detail: `Pressure altitude ${input.pressureAltFt.toLocaleString('en-US')} ft, OAT ${input.oatC}°C — density altitude ${densityAltFt.toLocaleString('en-US')} ft, σ = ${sigma.toFixed(3)}. Thinner air needs more ground speed to reach the same lift, so distance grows by 1/σ.`,
  });

  const wind = input.windComponentKt;
  const windFactor = wind >= 0 ? Math.max(0.4, 1 - 0.1 * (wind / 9)) : 1 + 0.1 * (Math.abs(wind) / 2);
  running *= windFactor;
  steps.push({
    key: 'wind',
    label: 'Wind',
    factor: windFactor,
    runningFt: running,
    detail:
      wind === 0
        ? 'No wind component entered — no correction applied.'
        : wind > 0
          ? `${wind} kt headwind component — roughly 10% less distance per 9 kt, by the FAA rule of thumb.`
          : `${Math.abs(wind)} kt tailwind component — roughly 10% more distance per 2 kt, by the FAA rule of thumb. Most POHs do not certify tailwind takeoffs or landings beyond about 10 kt.`,
  });

  const surfaceFactor = SURFACE_FACTORS[input.surface][input.phase];
  running *= surfaceFactor;
  steps.push({
    key: 'surface',
    label: 'Runway surface',
    factor: surfaceFactor,
    runningFt: running,
    detail:
      surfaceFactor === 1
        ? `${SURFACE_LABELS[input.surface]} — matches the baseline surface, no correction.`
        : `${SURFACE_LABELS[input.surface]} — a generic allowance, not your aircraft's chart. Check your POH supplement or AC 91-79A if one applies to your type.`,
  });

  const slope = input.slopePercent;
  const slopeSignedForPhase = input.phase === 'takeoff' ? slope : -slope;
  const slopeFactor = Math.max(0.5, 1 + 0.1 * slopeSignedForPhase);
  running *= slopeFactor;
  steps.push({
    key: 'slope',
    label: 'Runway slope',
    factor: slopeFactor,
    runningFt: running,
    detail:
      slope === 0
        ? 'Level runway — no correction applied.'
        : `${Math.abs(slope)}% ${slope > 0 ? 'upslope' : 'downslope'} — roughly 10% more ${input.phase} distance per 1% of grade working against the roll.`,
  });

  return {
    steps,
    finalFt: running,
    densityAltFt,
    densityRatio: sigma,
    totalFactor: running / input.baselineDistanceFt,
  };
}
