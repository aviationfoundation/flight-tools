import { readJson } from './data-store';
import { searchIndex, toStation, type StationTuple, type WxStation } from './station-search';

export type { WxStation };

const INDEX_MAX_AGE = 6 * 3600 * 1000;

async function loadIndex(): Promise<StationTuple[] | null> {
  const data = await readJson<{ stations: StationTuple[] }>('stations.json', INDEX_MAX_AGE);
  return data?.stations ?? null;
}

export function normalizeStationId(input: string): string {
  return input.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
}

export async function searchStations(rawQuery: string, limit = 8): Promise<WxStation[]> {
  const index = await loadIndex();
  return index ? searchIndex(index, rawQuery, limit) : [];
}

export async function getStation(icao: string): Promise<WxStation | null> {
  const id = normalizeStationId(icao);
  if (!id) return null;
  const index = await loadIndex();
  const found = index?.find((t) => t[0] === id || t[1] === id);
  return found ? toStation(found) : null;
}

export interface RunwayData {
  le: string;
  he: string | null;
  headingTrue: number;
  lengthFt: number | null;
  surface: string | null;
  approximate: boolean;
}

type RunwayTuple = [string, string | null, number, number | null, string | null, number];

export async function getRunways(icao: string): Promise<RunwayData[]> {
  const id = normalizeStationId(icao);
  if (id.length !== 4) return [];
  const shard = await readJson<Record<string, RunwayTuple[]>>(`runways/${id.slice(0, 2)}.json`, INDEX_MAX_AGE);
  return (shard?.[id] ?? []).map((r) => ({
    le: r[0],
    he: r[1],
    headingTrue: r[2],
    lengthFt: r[3],
    surface: r[4],
    approximate: r[5] === 1,
  }));
}
