export interface Station {
  name: string;
  weightLb: number | null;
  armIn: number | null;
}

export interface StationRow extends Station {
  momentInLb: number | null;
}

export interface WeightBalanceInput {
  emptyWeightLb: number | null;
  emptyArmIn: number | null;
  stations: Station[];
}

export interface WeightBalanceResult {
  rows: StationRow[];
  totalWeightLb: number;
  totalMomentInLb: number;
  cgIn: number | null;
}

export function computeWeightBalance(input: WeightBalanceInput): WeightBalanceResult {
  const rows: StationRow[] = [];
  let totalWeight = 0;
  let totalMoment = 0;

  if (input.emptyWeightLb != null && input.emptyArmIn != null) {
    const moment = input.emptyWeightLb * input.emptyArmIn;
    rows.push({ name: 'Empty aircraft', weightLb: input.emptyWeightLb, armIn: input.emptyArmIn, momentInLb: moment });
    totalWeight += input.emptyWeightLb;
    totalMoment += moment;
  }

  for (const station of input.stations) {
    if (station.weightLb == null || station.armIn == null) {
      rows.push({ ...station, momentInLb: null });
      continue;
    }
    const moment = station.weightLb * station.armIn;
    rows.push({ ...station, momentInLb: moment });
    totalWeight += station.weightLb;
    totalMoment += moment;
  }

  return {
    rows,
    totalWeightLb: totalWeight,
    totalMomentInLb: totalMoment,
    cgIn: totalWeight > 0 ? totalMoment / totalWeight : null,
  };
}

export interface EnvelopePoint {
  armIn: number;
  weightLb: number;
}

export function pointInEnvelope(armIn: number, weightLb: number, polygon: EnvelopePoint[]): boolean {
  if (polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].armIn;
    const yi = polygon[i].weightLb;
    const xj = polygon[j].armIn;
    const yj = polygon[j].weightLb;
    const intersects = yi > weightLb !== yj > weightLb && armIn < ((xj - xi) * (weightLb - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

export function parseEnvelope(text: string): EnvelopePoint[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [armRaw, weightRaw] = line.split(',').map((v) => v.trim());
      const armIn = Number(armRaw);
      const weightLb = Number(weightRaw);
      return Number.isFinite(armIn) && Number.isFinite(weightLb) ? { armIn, weightLb } : null;
    })
    .filter((p): p is EnvelopePoint => p !== null);
}

export interface LimitCheck {
  maxGrossLb: number | null;
  overGross: boolean;
  fwdLimitIn: number | null;
  aftLimitIn: number | null;
  withinSimpleLimits: boolean | null;
  envelope: EnvelopePoint[];
  withinEnvelope: boolean | null;
}

export function checkLimits(
  totalWeightLb: number,
  cgIn: number | null,
  opts: { maxGrossLb: number | null; fwdLimitIn: number | null; aftLimitIn: number | null; envelope: EnvelopePoint[] }
): LimitCheck {
  const overGross = opts.maxGrossLb != null && totalWeightLb > opts.maxGrossLb;

  let withinSimpleLimits: boolean | null = null;
  if (cgIn != null && opts.fwdLimitIn != null && opts.aftLimitIn != null) {
    withinSimpleLimits = cgIn >= opts.fwdLimitIn && cgIn <= opts.aftLimitIn;
  }

  let withinEnvelope: boolean | null = null;
  if (cgIn != null && opts.envelope.length >= 3) {
    withinEnvelope = pointInEnvelope(cgIn, totalWeightLb, opts.envelope);
  }

  return {
    maxGrossLb: opts.maxGrossLb,
    overGross,
    fwdLimitIn: opts.fwdLimitIn,
    aftLimitIn: opts.aftLimitIn,
    withinSimpleLimits,
    envelope: opts.envelope,
    withinEnvelope,
  };
}
