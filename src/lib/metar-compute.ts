import type { Conditions, DecodedMetar, CloudLayer, Wind } from './metar';

export type FlightCategory = 'VFR' | 'MVFR' | 'IFR' | 'LIFR' | 'UNKNOWN';

export const CATEGORY_MEANING: Record<FlightCategory, string> = {
  VFR: 'Ceiling above 3,000 ft and visibility greater than 5 sm.',
  MVFR: 'Marginal VFR - ceiling 1,000–3,000 ft or visibility 3–5 sm.',
  IFR: 'Ceiling 500–999 ft or visibility 1 to under 3 sm.',
  LIFR: 'Low IFR - ceiling under 500 ft or visibility under 1 sm.',
  UNKNOWN: 'Not enough reported data to determine a category.',
};

export function ceilingFt(clouds: CloudLayer[]): number | null {
  const ceilings = clouds
    .filter((layer) => layer.cover === 'BKN' || layer.cover === 'OVC' || layer.cover === 'VV')
    .map((layer) => layer.baseFt)
    .filter((base): base is number => base != null);
  return ceilings.length ? Math.min(...ceilings) : null;
}

export function flightCategory(conditions: Conditions): FlightCategory {
  const vis = conditions.visibility?.statuteMiles ?? null;
  const ceiling = ceilingFt(conditions.clouds);
  if (vis == null && ceiling == null) return conditions.cavok ? 'VFR' : 'UNKNOWN';

  const byVis: FlightCategory = vis == null ? 'VFR' : vis < 1 ? 'LIFR' : vis < 3 ? 'IFR' : vis <= 5 ? 'MVFR' : 'VFR';
  const byCeiling: FlightCategory =
    ceiling == null ? 'VFR' : ceiling < 500 ? 'LIFR' : ceiling < 1000 ? 'IFR' : ceiling <= 3000 ? 'MVFR' : 'VFR';

  const rank: FlightCategory[] = ['VFR', 'MVFR', 'IFR', 'LIFR'];
  return rank.indexOf(byVis) > rank.indexOf(byCeiling) ? byVis : byCeiling;
}

function saturationVapourPressure(tempC: number): number {
  return 6.112 * Math.exp((17.67 * tempC) / (tempC + 243.5));
}

export function relativeHumidity(tempC: number | null, dewpointC: number | null): number | null {
  if (tempC == null || dewpointC == null) return null;
  const rh = (saturationVapourPressure(dewpointC) / saturationVapourPressure(tempC)) * 100;
  return Math.max(0, Math.min(100, rh));
}

export function pressureAltitudeFt(elevationFt: number | null, altimeterInHg: number | null): number | null {
  if (elevationFt == null || altimeterInHg == null) return null;
  return Math.round(elevationFt + (29.92 - altimeterInHg) * 1000);
}

export function densityAltitudeFt(pressureAlt: number | null, tempC: number | null): number | null {
  if (pressureAlt == null || tempC == null) return null;
  const isaTemp = 15 - 1.98 * (pressureAlt / 1000);
  return Math.round(pressureAlt + 118.8 * (tempC - isaTemp));
}

export function estimatedCloudBaseFt(tempC: number | null, dewpointC: number | null): number | null {
  if (tempC == null || dewpointC == null) return null;
  const spread = tempC - dewpointC;
  if (spread < 0) return 0;
  return Math.round(((spread / 2.5) * 1000) / 100) * 100;
}

export interface WindComponents {
  headwindKt: number;
  crosswindKt: number;
  from: 'left' | 'right' | 'none';
  angleDeg: number;
  gustCrosswindKt: number | null;
  gustHeadwindKt: number | null;
}

export function windComponents(wind: Wind | null, runwayHeadingDeg: number): WindComponents | null {
  if (!wind || wind.speedKt == null) return null;
  if (wind.variable || wind.directionDeg == null) return null;
  const angle = (((wind.directionDeg - runwayHeadingDeg) % 360) + 360) % 360;
  const rad = (angle * Math.PI) / 180;
  const head = wind.speedKt * Math.cos(rad);
  const cross = wind.speedKt * Math.sin(rad);
  const gustHead = wind.gustKt != null ? wind.gustKt * Math.cos(rad) : null;
  const gustCross = wind.gustKt != null ? wind.gustKt * Math.sin(rad) : null;
  return {
    headwindKt: Math.round(head * 10) / 10,
    crosswindKt: Math.round(Math.abs(cross) * 10) / 10,
    from: Math.abs(cross) < 0.05 ? 'none' : cross > 0 ? 'right' : 'left',
    angleDeg: angle,
    gustCrosswindKt: gustCross == null ? null : Math.round(Math.abs(gustCross) * 10) / 10,
    gustHeadwindKt: gustHead == null ? null : Math.round(gustHead * 10) / 10,
  };
}

export function bestRunway(wind: Wind | null): number {
  if (!wind || wind.directionDeg == null || wind.variable) return 36;
  const rounded = Math.round(wind.directionDeg / 10);
  return rounded === 0 ? 36 : rounded;
}

export function windChillC(tempC: number | null, windKt: number | null): number | null {
  if (tempC == null || windKt == null || tempC > 10 || windKt < 3) return null;
  const v = Math.pow(windKt * 1.852, 0.16);
  return Math.round((13.12 + 0.6215 * tempC - 11.37 * v + 0.3965 * tempC * v) * 10) / 10;
}

export interface Advisory {
  tone: 'danger' | 'warning' | 'info';
  title: string;
  detail: string;
}

export function advisories(report: DecodedMetar, elevationFt: number | null): Advisory[] {
  const out: Advisory[] = [];
  const category = flightCategory(report);
  const ceiling = ceilingFt(report.clouds);

  if (category === 'LIFR' || category === 'IFR') {
    out.push({
      tone: 'danger',
      title: `${category} conditions`,
      detail: CATEGORY_MEANING[category],
    });
  } else if (category === 'MVFR') {
    out.push({ tone: 'warning', title: 'Marginal VFR', detail: CATEGORY_MEANING.MVFR });
  }

  if (report.wind?.gustKt != null && report.wind.speedKt != null) {
    const spread = report.wind.gustKt - report.wind.speedKt;
    if (report.wind.gustKt >= 25 || spread >= 10) {
      out.push({
        tone: report.wind.gustKt >= 35 ? 'danger' : 'warning',
        title: `Gusting to ${report.wind.gustKt} kt`,
        detail: `${spread} kt gust spread over a steady ${report.wind.speedKt} kt.`,
      });
    }
  }

  if (report.wind?.varyFrom != null && report.wind.varyTo != null) {
    const swing = (((report.wind.varyTo - report.wind.varyFrom) % 360) + 360) % 360;
    if (swing >= 60) {
      out.push({
        tone: 'warning',
        title: 'Wind direction unsteady',
        detail: `Varying across ${swing}°, between ${report.wind.varyFrom}° and ${report.wind.varyTo}°.`,
      });
    }
  }

  if (report.windShear) {
    out.push({ tone: 'danger', title: 'Wind shear', detail: report.windShear.text });
  }

  for (const weather of report.weather) {
    if (weather.descriptor === 'TS') {
      out.push({ tone: 'danger', title: 'Thunderstorm', detail: weather.text });
    } else if (weather.descriptor === 'FZ') {
      out.push({ tone: 'danger', title: 'Freezing precipitation', detail: `${weather.text} - airframe icing on the ground and in the climb.` });
    } else if (weather.other === 'FC') {
      out.push({ tone: 'danger', title: 'Funnel cloud', detail: weather.text });
    }
  }

  if (report.clouds.some((layer) => layer.type === 'CB')) {
    out.push({ tone: 'danger', title: 'Cumulonimbus reported', detail: 'Convective cloud in the vicinity of the field.' });
  }

  const spread = report.temperatureC != null && report.dewpointC != null ? report.temperatureC - report.dewpointC : null;
  if (spread != null && spread <= 2 && (report.temperatureC ?? 0) > 0) {
    out.push({
      tone: 'warning',
      title: 'Fog risk',
      detail: `Temperature and dew point are ${spread.toFixed(1)} °C apart. Fog can form quickly at this spread.`,
    });
  }

  if (report.temperatureC != null && report.temperatureC <= 3 && report.temperatureC >= -12 && (report.clouds.some((c) => c.oktas != null && c.oktas >= 5) || report.weather.length > 0)) {
    out.push({
      tone: 'warning',
      title: 'Structural icing range',
      detail: 'Visible moisture with a surface temperature in the icing band.',
    });
  }

  const pa = pressureAltitudeFt(elevationFt, report.altimeterInHg);
  const da = densityAltitudeFt(pa, report.temperatureC);
  if (da != null && elevationFt != null && da - elevationFt >= 2000) {
    out.push({
      tone: da - elevationFt >= 4000 ? 'danger' : 'warning',
      title: `Density altitude ${da.toLocaleString('en-US')} ft`,
      detail: `${(da - elevationFt).toLocaleString('en-US')} ft above field elevation. Expect degraded climb and longer ground roll.`,
    });
  }

  if (ceiling != null && ceiling < 1000 && out.every((item) => item.title !== 'LIFR conditions' && item.title !== 'IFR conditions')) {
    out.push({ tone: 'warning', title: 'Low ceiling', detail: `Lowest broken or overcast layer at ${ceiling.toLocaleString('en-US')} ft AGL.` });
  }

  if (report.rvr.length) {
    const worst = report.rvr.reduce((acc, item) => (item.min != null && (acc.min == null || item.min < acc.min) ? item : acc), report.rvr[0]);
    if (worst.min != null && ((worst.unit === 'FT' && worst.min <= 2400) || (worst.unit === 'M' && worst.min <= 730))) {
      out.push({ tone: 'warning', title: 'Restricted runway visual range', detail: worst.text });
    }
  }

  out.push(...plausibilityFlags(report));

  return out;
}

export function plausibilityFlags(report: DecodedMetar): Advisory[] {
  const out: Advisory[] = [];

  if (report.temperatureC != null && report.dewpointC != null && report.dewpointC - report.temperatureC > 0.5) {
    out.push({
      tone: 'warning',
      title: 'Unrealistic METAR: dew point above temperature',
      detail: `Dew point ${report.dewpointC.toFixed(1)}°C is higher than temperature ${report.temperatureC.toFixed(1)}°C. Dew point cannot exceed temperature - likely a transcription or sensor error.`,
    });
  }

  if (report.temperatureC != null && (report.temperatureC < -62 || report.temperatureC > 58)) {
    out.push({
      tone: 'warning',
      title: 'Unrealistic METAR: temperature out of range',
      detail: `${report.temperatureC.toFixed(1)}°C is outside the range ever recorded at a surface station. Check the raw group for a misread digit.`,
    });
  }

  if (report.altimeterInHg != null && (report.altimeterInHg < 25 || report.altimeterInHg > 32.5)) {
    out.push({
      tone: 'warning',
      title: 'Unrealistic METAR: altimeter out of range',
      detail: `${report.altimeterInHg.toFixed(2)} inHg falls outside the range of any recorded sea-level pressure. Check the raw group for a dropped or shifted digit.`,
    });
  }

  if (report.wind?.speedKt != null && report.wind.speedKt > 150) {
    out.push({
      tone: 'warning',
      title: 'Unrealistic METAR: wind speed out of range',
      detail: `${report.wind.speedKt} kt sustained is far beyond any surface report on record. Check the raw group for a unit or digit error.`,
    });
  }

  if (report.wind?.gustKt != null && report.wind.speedKt != null && report.wind.gustKt <= report.wind.speedKt) {
    out.push({
      tone: 'warning',
      title: 'Unrealistic METAR: gust not above sustained wind',
      detail: `Gust of ${report.wind.gustKt} kt is not greater than the sustained ${report.wind.speedKt} kt. A gust group only appears when it exceeds the sustained speed.`,
    });
  }

  if (report.clouds.some((c) => c.baseFt != null && c.baseFt > 60000)) {
    out.push({
      tone: 'warning',
      title: 'Unrealistic METAR: cloud base out of range',
      detail: 'A reported cloud base above 60,000 ft is beyond what a station\'s ceilometer measures - check the raw group.',
    });
  }

  return out;
}
