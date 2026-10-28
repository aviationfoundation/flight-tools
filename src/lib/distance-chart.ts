import type { DistanceStep } from './takeoff-landing';

export interface ChartRow {
  label: string;
  runningFt: number;
  basePct: number;
  deltaPct: number;
  deltaLeftPct: number;
  direction: 'up' | 'down' | 'none';
  factor: number;
}

export function chartRows(steps: DistanceStep[]): ChartRow[] {
  const max = Math.max(1, ...steps.map((s) => s.runningFt));
  let previous = steps[0]?.runningFt ?? 0;
  return steps.map((step, i) => {
    const prev = i === 0 ? step.runningFt : previous;
    previous = step.runningFt;
    const low = Math.min(prev, step.runningFt);
    const high = Math.max(prev, step.runningFt);
    return {
      label: step.label,
      runningFt: step.runningFt,
      basePct: (low / max) * 100,
      deltaLeftPct: (low / max) * 100,
      deltaPct: ((high - low) / max) * 100,
      direction: i === 0 || Math.abs(step.runningFt - prev) < 0.5 ? 'none' : step.runningFt > prev ? 'up' : 'down',
      factor: step.factor,
    };
  });
}
