// Flight categories for every reporting station, built from NOAA's METAR cache CSV.
// A port of the `categories` job in pipeline/build_data.py, which now runs on the Worker's
// five-minute cron (src/worker.ts) instead of on a machine that can go quiet.

export const ORDER = ['VFR', 'MVFR', 'IFR', 'LIFR'] as const;
export type Category = (typeof ORDER)[number];

const CEILING_COVERS = new Set(['BKN', 'OVC', 'OVX', 'VV']);

export type StationRow = [
  icao: string,
  lat: number,
  lon: number,
  category: Category,
  visibilitySm: number | null,
  visibilityPlus: 0 | 1,
  ceilingFt: number | null,
  observed: string,
];

export interface Categories {
  generated: string;
  fields: string[];
  stations: StationRow[];
}

export interface Board {
  generated: string;
  count: number;
  columns: Array<{ category: Category; items: Array<{ icao: string; place: string; why: string }> }>;
}

/** RFC 4180 rows: quoted fields may hold commas, doubled quotes and newlines. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function parseNumber(text: string | undefined): number | null {
  const t = (text ?? '').trim();
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function flightCategory(vis: number | null, ceiling: number | null, hasClouds: boolean): Category | null {
  if (vis === null && ceiling === null && !hasClouds) return null;
  const byVis: Category = vis === null ? 'VFR' : vis < 1 ? 'LIFR' : vis < 3 ? 'IFR' : vis <= 5 ? 'MVFR' : 'VFR';
  const byCeiling: Category = ceiling === null ? 'VFR' : ceiling < 500 ? 'LIFR' : ceiling < 1000 ? 'IFR' : ceiling <= 3000 ? 'MVFR' : 'VFR';
  return ORDER.indexOf(byVis) > ORDER.indexOf(byCeiling) ? byVis : byCeiling;
}

export function formatMiles(value: number | null): string | null {
  if (value === null) return null;
  if (Math.abs(value - Math.round(value)) < 0.01) return String(Math.round(value));
  const whole = Math.trunc(value);
  const fractions: Array<[number, string]> = [[0.125, '1/8'], [0.25, '1/4'], [0.375, '3/8'], [0.5, '1/2'], [0.625, '5/8'], [0.75, '3/4'], [0.875, '7/8']];
  const rest = value - whole;
  const frac = fractions.reduce((best, f) => (Math.abs(f[0] - rest) < Math.abs(best[0] - rest) ? f : best))[1];
  return whole ? `${whole} ${frac}` : frac;
}

export function buildCategories(csvText: string, now: Date = new Date()): Categories {
  const rows = parseCsv(csvText);
  // NOAA puts a few comment lines above the header; the header is the row naming station_id.
  const headerAt = rows.findIndex((r) => r.includes('station_id'));
  if (headerAt < 0) throw new Error('METAR cache has no header row');
  const header = rows[headerAt];
  const col = (name: string) => header.indexOf(name);
  const coverCols = header.flatMap((name, i) => (name === 'sky_cover' ? [i] : []));
  const baseCols = header.flatMap((name, i) => (name === 'cloud_base_ft_agl' ? [i] : []));
  const c = {
    icao: col('station_id'),
    lat: col('latitude'),
    lon: col('longitude'),
    vis: col('visibility_statute_mi'),
    vert: col('vert_vis_ft'),
    observed: col('observation_time'),
  };

  const stations: StationRow[] = [];
  for (const row of rows.slice(headerAt + 1)) {
    if (row.length < header.length) continue;
    const icao = row[c.icao].trim();
    const lat = parseNumber(row[c.lat]);
    const lon = parseNumber(row[c.lon]);
    if (!icao || lat === null || lon === null) continue;
    const visText = (row[c.vis] ?? '').trim();
    const plus = visText.endsWith('+');
    const vis = parseNumber(visText.replace(/\+$/, ''));
    const ceilings: number[] = [];
    let hasClouds = false;
    coverCols.forEach((ci, k) => {
      const cover = row[ci].trim();
      if (!cover) return;
      hasClouds = true;
      const base = parseNumber(row[baseCols[k]]);
      if (CEILING_COVERS.has(cover) && base !== null) ceilings.push(Math.trunc(base));
    });
    // vert_vis_ft holds the METAR's VV digits, hundreds of feet: VV002 arrives as 2, not 200.
    const vert = parseNumber(row[c.vert]);
    if (vert !== null) ceilings.push(Math.trunc(vert * 100));
    const ceiling = ceilings.length ? Math.min(...ceilings) : null;
    const category = flightCategory(vis, ceiling, hasClouds);
    if (category === null) continue;
    stations.push([icao, Math.round(lat * 1000) / 1000, Math.round(lon * 1000) / 1000, category, vis, plus ? 1 : 0, ceiling, row[c.observed]]);
  }
  stations.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  return {
    generated: now.toISOString().replace(/\.\d{3}Z$/, 'Z'),
    fields: ['icao', 'lat', 'lon', 'category', 'visibilitySm', 'visibilityPlus', 'ceilingFt', 'observed'],
    stations,
  };
}

/** Station names from stations.json rows: [icao, iata, site, state, country, lat, lon, elevFt]. */
export function namesFromIndex(index: unknown[][]): Record<string, string> {
  const names: Record<string, string> = {};
  for (const s of index) {
    const [icao, , site, state, country] = s as [string, unknown, string, string | null, string | null];
    if (typeof icao === 'string') names[icao] = `${site ?? ''}, ${state || country || ''}`.replace(/[, ]+$/, '');
  }
  return names;
}

export function buildBoard(categories: Categories, names: Record<string, string>, wanted: string[]): Board {
  const byIcao = new Map(categories.stations.map((s) => [s[0], s]));
  const columns = Object.fromEntries(ORDER.map((cat) => [cat, [] as Board['columns'][number]['items']])) as Record<Category, Board['columns'][number]['items']>;
  for (const icao of wanted) {
    const s = byIcao.get(icao);
    if (!s) continue;
    const [, , , category, vis, plus, ceiling] = s;
    const parts: string[] = [];
    if (vis !== null) parts.push(`${formatMiles(vis)}${plus ? '+' : ''} sm`);
    parts.push(ceiling !== null ? `ceiling ${ceiling.toLocaleString('en-US')} ft` : 'no ceiling');
    const place = (names[icao] ?? icao).replaceAll(', US', '').replaceAll(', CA', '');
    columns[category].push({ icao, place, why: parts.join(', ') });
  }
  return {
    generated: categories.generated,
    count: ORDER.reduce((n, cat) => n + columns[cat].length, 0),
    columns: ORDER.map((category) => ({ category, items: columns[category] })),
  };
}

/** How long ago, in the largest unit that reads naturally: "just now", "12 min ago", "5 h ago", "3 days ago". */
export function formatAge(ms: number): string {
  const minutes = Math.max(0, Math.floor(ms / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.floor(hours / 24)} days ago`;
}
