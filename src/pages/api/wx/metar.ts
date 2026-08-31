export const prerender = false;

import type { APIRoute } from 'astro';
import { z } from 'zod';
import { fetchObservation } from '../../../lib/wx-source';
import { getStation, normalizeStationId } from '../../../lib/wx-stations';

const querySchema = z.object({
  station: z.string().trim().min(3).max(6),
});

function json(body: unknown, status: number, cacheSeconds = 0): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': cacheSeconds ? `public, max-age=60, s-maxage=${cacheSeconds}` : 'no-store',
    },
  });
}

export const GET: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime.env;
  const url = new URL(request.url);

  const parsed = querySchema.safeParse({ station: url.searchParams.get('station') ?? '' });
  if (!parsed.success) return json({ error: 'invalid_station' }, 400);

  const id = normalizeStationId(parsed.data.station);
  if (!id) return json({ error: 'invalid_station' }, 400);

  const bundle = await fetchObservation(id);
  const known = env.DB ? await getStation(env.DB, id) : null;

  return json(
    {
      station: bundle.station ?? (known ? { icao: known.icao, name: known.name, lat: known.lat, lon: known.lon, elevationFt: known.elevationFt } : null),
      known,
      metarRaw: bundle.metarRaw,
      tafRaw: bundle.tafRaw,
      fetchedAt: bundle.fetchedAt,
      error: bundle.error,
    },
    bundle.error === 'upstream_unavailable' ? 502 : 200,
    bundle.metarRaw ? 120 : 0,
  );
};
