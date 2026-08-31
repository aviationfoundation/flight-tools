export interface WxStation {
  icao: string;
  iata: string | null;
  name: string;
  city: string | null;
  region: string | null;
  country: string | null;
  lat: number | null;
  lon: number | null;
  elevationFt: number | null;
}

interface StationRow {
  icao: string;
  iata: string | null;
  name: string;
  city: string | null;
  region: string | null;
  country: string | null;
  lat: number | null;
  lon: number | null;
  elevation_ft: number | null;
}

function toStation(row: StationRow): WxStation {
  return {
    icao: row.icao,
    iata: row.iata,
    name: row.name,
    city: row.city,
    region: row.region,
    country: row.country,
    lat: row.lat,
    lon: row.lon,
    elevationFt: row.elevation_ft,
  };
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export function normalizeStationId(input: string): string {
  return input.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
}

export async function searchStations(db: D1Database, rawQuery: string, limit = 8): Promise<WxStation[]> {
  const q = rawQuery.trim();
  if (q.length < 2) return [];
  const code = q.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const like = `%${escapeLike(q)}%`;
  const startsWith = `${escapeLike(q)}%`;
  const codePrefix = `${escapeLike(code)}%`;

  try {
    const result = await db
      .prepare(
        `SELECT icao, iata, name, city, region, country, lat, lon, elevation_ft
           FROM wx_stations
          WHERE icao LIKE ?1 ESCAPE '\\'
             OR iata LIKE ?1 ESCAPE '\\'
             OR name LIKE ?2 ESCAPE '\\'
             OR city LIKE ?2 ESCAPE '\\'
          ORDER BY
            CASE
              WHEN icao = ?3 THEN 0
              WHEN iata = ?3 THEN 1
              WHEN icao LIKE ?1 ESCAPE '\\' THEN 2
              WHEN city LIKE ?4 ESCAPE '\\' THEN 3
              WHEN name LIKE ?4 ESCAPE '\\' THEN 4
              ELSE 5
            END,
            priority DESC,
            name ASC
          LIMIT ?5`,
      )
      .bind(codePrefix, like, code, startsWith, limit)
      .all<StationRow>();
    return (result.results ?? []).map(toStation);
  } catch {
    return [];
  }
}

export async function getStation(db: D1Database, icao: string): Promise<WxStation | null> {
  const id = normalizeStationId(icao);
  if (!id) return null;
  try {
    const row = await db
      .prepare(
        `SELECT icao, iata, name, city, region, country, lat, lon, elevation_ft
           FROM wx_stations WHERE icao = ?1 OR iata = ?1 LIMIT 1`,
      )
      .bind(id)
      .first<StationRow>();
    return row ? toStation(row) : null;
  } catch {
    return null;
  }
}
