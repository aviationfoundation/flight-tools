const BASE = 'https://aviationweather.gov/api/data';
const USER_AGENT = 'aviation.foundation METAR decoder (+https://aviation.foundation/tools/metar)';
const CACHE_SECONDS = 240;
const TIMEOUT_MS = 8000;

export interface SourceStation {
  icao: string;
  name: string | null;
  lat: number | null;
  lon: number | null;
  elevationFt: number | null;
}

export interface ObservationBundle {
  station: SourceStation | null;
  metarRaw: string | null;
  tafRaw: string | null;
  fetchedAt: string;
  error: string | null;
}

function timeoutSignal(): AbortSignal | undefined {
  try {
    return AbortSignal.timeout(TIMEOUT_MS);
  } catch {
    return undefined;
  }
}

async function cachedFetch(url: string): Promise<Response | null> {
  const request = new Request(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json, text/plain, */*' },
  });

  const cache = typeof caches !== 'undefined' ? (caches as unknown as { default?: Cache }).default : undefined;
  if (cache) {
    const hit = await cache.match(request);
    if (hit) return hit;
  }

  let upstream: Response;
  try {
    upstream = await fetch(request, { signal: timeoutSignal() });
  } catch {
    return null;
  }
  if (!upstream.ok) return null;

  const body = await upstream.arrayBuffer();
  const response = new Response(body, {
    status: 200,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') || 'text/plain; charset=utf-8',
      'Cache-Control': `public, s-maxage=${CACHE_SECONDS}`,
    },
  });
  if (cache) {
    try {
      await cache.put(request, response.clone());
    } catch {
    }
  }
  return response;
}

interface AwcMetarRow {
  icaoId?: string;
  rawOb?: string;
  name?: string;
  lat?: number;
  lon?: number;
  elev?: number;
}

const METERS_TO_FEET = 3.280839895;

export interface BoardRow {
  icao: string;
  name: string | null;
  metarRaw: string;
}

export async function fetchBoard(icaos: string[]): Promise<BoardRow[] | null> {
  const ids = icaos.map((icao) => icao.trim().toUpperCase()).filter((id) => /^[A-Z][A-Z0-9]{2,3}$/.test(id));
  if (!ids.length) return [];

  const response = await cachedFetch(`${BASE}/metar?ids=${ids.join(',')}&format=json`);
  if (!response) return null;

  try {
    const rows = (await response.json()) as AwcMetarRow[];
    if (!Array.isArray(rows)) return null;
    return rows
      .filter((row) => row.icaoId && row.rawOb)
      .map((row) => ({ icao: row.icaoId!, name: row.name ?? null, metarRaw: row.rawOb!.trim() }));
  } catch {
    return null;
  }
}

export async function fetchObservation(icao: string): Promise<ObservationBundle> {
  const id = icao.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const fetchedAt = new Date().toISOString();
  if (!/^[A-Z][A-Z0-9]{2,3}$/.test(id)) {
    return { station: null, metarRaw: null, tafRaw: null, fetchedAt, error: 'invalid_station' };
  }

  const [metarResponse, tafResponse] = await Promise.all([
    cachedFetch(`${BASE}/metar?ids=${id}&format=json`),
    cachedFetch(`${BASE}/taf?ids=${id}&format=raw`),
  ]);

  let station: SourceStation | null = null;
  let metarRaw: string | null = null;

  if (metarResponse) {
    try {
      const rows = (await metarResponse.json()) as AwcMetarRow[];
      const row = Array.isArray(rows) ? rows[0] : null;
      if (row?.rawOb) {
        metarRaw = row.rawOb.trim();
        station = {
          icao: row.icaoId || id,
          name: row.name ?? null,
          lat: typeof row.lat === 'number' ? row.lat : null,
          lon: typeof row.lon === 'number' ? row.lon : null,
          elevationFt: typeof row.elev === 'number' ? Math.round(row.elev * METERS_TO_FEET) : null,
        };
      }
    } catch {
      metarRaw = null;
    }
  }

  let tafRaw: string | null = null;
  if (tafResponse) {
    const text = (await tafResponse.text()).trim();
    if (text && !/^\s*$/.test(text) && !/no data/i.test(text)) tafRaw = text;
  }

  return {
    station,
    metarRaw,
    tafRaw,
    fetchedAt,
    error: metarRaw ? null : metarResponse ? 'no_observation' : 'upstream_unavailable',
  };
}
