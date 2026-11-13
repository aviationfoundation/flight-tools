// The five-minute refresh of categories.json and board.json, run from the Worker's cron
// (src/worker.ts). It fetches NOAA's METAR cache, builds both files and writes them to R2.
// A failed fetch or a suspiciously small result leaves the last good files in place.

import { buildBoard, buildCategories, namesFromIndex } from './categories';
import wanted from '../data/board-stations.json';

const METARS_URL = 'https://aviationweather.gov/data/cache/metars.cache.csv.gz';
const USER_AGENT = 'flight-tools/1.0 (+https://tools.aviation.foundation/tools/metar)';
// North America alone reports a few thousand stations; far fewer means a truncated or broken feed.
const MIN_STATIONS = 1000;
const NAMES_TTL_MS = 24 * 60 * 60 * 1000;

interface R2Like {
  get(key: string): Promise<{ json<T>(): Promise<T> } | null>;
  put(key: string, value: string, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
}

let namesMemo: { at: number; names: Record<string, string> } | null = null;

async function stationNames(bucket: R2Like): Promise<Record<string, string>> {
  if (namesMemo && Date.now() - namesMemo.at < NAMES_TTL_MS) return namesMemo.names;
  try {
    const object = await bucket.get('stations.json');
    const data = object ? await object.json<{ stations?: unknown }>() : null;
    const names = Array.isArray(data?.stations) ? namesFromIndex(data.stations as unknown[][]) : {};
    // An empty list is not remembered, so names come back as soon as stations.json does.
    if (Object.keys(names).length) namesMemo = { at: Date.now(), names };
    return names;
  } catch {
    return namesMemo?.names ?? {};
  }
}

async function fetchMetarCache(): Promise<string> {
  const response = await fetch(METARS_URL, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok || !response.body) throw new Error(`METAR cache returned HTTP ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  // The file is gzip on disk; some paths hand it over already decoded.
  if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    return new Response(stream).text();
  }
  return new TextDecoder().decode(bytes);
}

export async function refreshCategories(bucket: R2Like): Promise<{ stations: number }> {
  const categories = buildCategories(await fetchMetarCache());
  if (categories.stations.length < MIN_STATIONS) {
    throw new Error(`only ${categories.stations.length} stations in the METAR cache; keeping the last good files`);
  }
  const board = buildBoard(categories, await stationNames(bucket), wanted as string[]);
  const json = { httpMetadata: { contentType: 'application/json' } };
  await Promise.all([
    bucket.put('categories.json', JSON.stringify(categories), json),
    bucket.put('board.json', JSON.stringify(board), json),
  ]);
  return { stations: categories.stations.length };
}
