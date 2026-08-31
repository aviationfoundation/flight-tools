#!/usr/bin/env node

import { gunzipSync } from 'node:zlib';
import { batchInsert, sqlEscape } from './lib/d1.mjs';

const NOAA_CACHE = 'https://aviationweather.gov/data/cache/stations.cache.json.gz';
const OURAIRPORTS = 'https://davidmegginson.github.io/ourairports-data/airports.csv';
const USER_AGENT = 'aviation.foundation station sync (+https://aviation.foundation)';
const METERS_TO_FEET = 3.280839895;

const args = process.argv.slice(2);
const remote = args.includes('--remote');
const dryRun = args.includes('--dry-run');
const limitArg = args.find((a) => a.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity;

function log(...parts) {
  console.log(`[wx-stations] ${parts.join(' ')}`);
}

function pick(row, ...keys) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return null;
}

function toNumber(value) {
  if (value === null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function cleanIcao(value) {
  if (!value) return null;
  const id = String(value).trim().toUpperCase();
  return /^[A-Z][A-Z0-9]{3}$/.test(id) ? id : null;
}

function normalizeNoaa(row) {
  const icao = cleanIcao(pick(row, 'icaoId', 'icao', 'stationId', 'id'));
  if (!icao) return null;
  const elevM = toNumber(pick(row, 'elev', 'elevation', 'elev_m'));
  return {
    icao,
    iata: null,
    name: String(pick(row, 'site', 'name', 'station') || icao).trim().slice(0, 120),
    city: null,
    region: pick(row, 'state', 'region'),
    country: pick(row, 'country', 'ctry'),
    lat: toNumber(pick(row, 'lat', 'latitude')),
    lon: toNumber(pick(row, 'lon', 'longitude')),
    elevationFt: elevM === null ? null : Math.round(elevM * METERS_TO_FEET),
    priority: Number(pick(row, 'priority')) || 20,
  };
}

function parseCsv(text) {
  const rows = [];
  let field = '';
  let record = [];
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === ',') {
      record.push(field);
      field = '';
    } else if (c === '\n') {
      record.push(field);
      rows.push(record);
      record = [];
      field = '';
    } else if (c !== '\r') {
      field += c;
    }
  }
  if (field.length || record.length) {
    record.push(field);
    rows.push(record);
  }
  const header = rows.shift() || [];
  return rows
    .filter((r) => r.length === header.length)
    .map((r) => Object.fromEntries(header.map((key, idx) => [key, r[idx]])));
}

const OURAIRPORTS_PRIORITY = {
  large_airport: 90,
  medium_airport: 60,
  small_airport: 30,
};

function normalizeOurAirports(row) {
  const icao = cleanIcao(row.ident || row.gps_code || row.icao_code);
  if (!icao) return null;
  if (!OURAIRPORTS_PRIORITY[row.type]) return null;
  const elevFt = toNumber(row.elevation_ft);
  return {
    icao,
    iata: row.iata_code && /^[A-Z]{3}$/.test(row.iata_code) ? row.iata_code : null,
    name: String(row.name || icao).trim().slice(0, 120),
    city: row.municipality || null,
    region: row.iso_region ? String(row.iso_region).split('-').pop() : null,
    country: row.iso_country || null,
    lat: toNumber(row.latitude_deg),
    lon: toNumber(row.longitude_deg),
    elevationFt: elevFt === null ? null : Math.round(elevFt),
    priority: OURAIRPORTS_PRIORITY[row.type],
  };
}

async function get(url, { binary = false } = {}) {
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) throw new Error(`${url} responded ${response.status}`);
  return binary ? Buffer.from(await response.arrayBuffer()) : response.text();
}

async function loadFromNoaa() {
  const buffer = await get(NOAA_CACHE, { binary: true });
  const text = buffer[0] === 0x1f && buffer[1] === 0x8b ? gunzipSync(buffer).toString('utf-8') : buffer.toString('utf-8');
  const parsed = JSON.parse(text);
  const rows = Array.isArray(parsed) ? parsed : parsed.features || parsed.data || [];
  return rows.map(normalizeNoaa).filter(Boolean);
}

async function loadFromOurAirports() {
  const text = await get(OURAIRPORTS);
  return parseCsv(text).map(normalizeOurAirports).filter(Boolean);
}

function buildInsert(chunk) {
  const values = chunk
    .map((s) =>
      `(${[
        sqlEscape(s.icao),
        sqlEscape(s.iata),
        sqlEscape(s.name),
        sqlEscape(s.city),
        sqlEscape(s.region),
        sqlEscape(s.country),
        s.lat === null ? 'NULL' : s.lat,
        s.lon === null ? 'NULL' : s.lon,
        s.elevationFt === null ? 'NULL' : s.elevationFt,
        s.priority,
        sqlEscape(new Date().toISOString()),
      ].join(',')})`,
    )
    .join(',\n  ');
  if (!values) return null;
  return `INSERT INTO wx_stations
  (icao, iata, name, city, region, country, lat, lon, elevation_ft, priority, updated_at)
VALUES
  ${values}
ON CONFLICT(icao) DO UPDATE SET
  iata = COALESCE(excluded.iata, wx_stations.iata),
  name = COALESCE(NULLIF(wx_stations.name, ''), excluded.name),
  city = COALESCE(wx_stations.city, excluded.city),
  region = COALESCE(wx_stations.region, excluded.region),
  country = COALESCE(wx_stations.country, excluded.country),
  lat = COALESCE(wx_stations.lat, excluded.lat),
  lon = COALESCE(wx_stations.lon, excluded.lon),
  elevation_ft = COALESCE(wx_stations.elevation_ft, excluded.elevation_ft),
  priority = MAX(wx_stations.priority, excluded.priority),
  updated_at = excluded.updated_at;`;
}

async function main() {
  let stations = [];
  try {
    log('fetching NOAA station cache...');
    stations = await loadFromNoaa();
    log(`NOAA returned ${stations.length} usable stations`);
  } catch (error) {
    log(`NOAA source failed (${error.message}); falling back to OurAirports`);
  }

  if (stations.length < 500) {
    log('fetching OurAirports catalogue...');
    const fallback = await loadFromOurAirports();
    log(`OurAirports returned ${fallback.length} usable airports`);
    const seen = new Set(stations.map((s) => s.icao));
    for (const row of fallback) {
      if (!seen.has(row.icao)) {
        stations.push(row);
        seen.add(row.icao);
      }
    }
  }

  if (!stations.length) {
    log('no stations resolved from any source; aborting without writing');
    process.exitCode = 1;
    return;
  }

  const rows = stations.slice(0, limit);
  log(`${rows.length} stations ready (${remote ? 'remote' : 'local'} D1)${dryRun ? ', dry run' : ''}`);
  if (dryRun) {
    console.table(rows.slice(0, 10));
    return;
  }

  batchInsert(rows, buildInsert, { remote, chunkSize: 300 });
  log('done');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
