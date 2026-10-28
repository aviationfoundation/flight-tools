export type StationTuple = [
  icao: string,
  iata: string | null,
  name: string,
  region: string | null,
  country: string | null,
  lat: number | null,
  lon: number | null,
  elevationFt: number | null,
];

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

export function toStation(t: StationTuple): WxStation {
  return { icao: t[0], iata: t[1], name: t[2], city: null, region: t[3], country: t[4], lat: t[5], lon: t[6], elevationFt: t[7] };
}

export function searchIndex(index: StationTuple[], rawQuery: string, limit = 8): WxStation[] {
  const query = rawQuery.trim();
  if (query.length < 2) return [];
  const code = query.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const text = query.toLowerCase();

  const scored: Array<{ score: number; t: StationTuple }> = [];
  for (const t of index) {
    const name = t[2].toLowerCase();
    let score = -1;
    if (code && t[0] === code) score = 0;
    else if (code && t[1] === code) score = 1;
    else if (code.length >= 2 && t[0].startsWith(code)) score = 2;
    else if (name.startsWith(text)) score = 3;
    else if (name.includes(text)) score = 4;
    if (score >= 0) scored.push({ score, t });
  }

  scored.sort((a, b) => a.score - b.score || Number(!a.t[1]) - Number(!b.t[1]) || a.t[2].localeCompare(b.t[2]));
  return scored.slice(0, limit).map((entry) => toStation(entry.t));
}
