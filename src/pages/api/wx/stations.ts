export const prerender = false;

import type { APIRoute } from 'astro';
import { z } from 'zod';
import { searchStations } from '../../../lib/wx-stations';

const querySchema = z.object({
  q: z.string().trim().min(2).max(60),
  limit: z.coerce.number().int().min(1).max(12).optional(),
});

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);

  const parsed = querySchema.safeParse({
    q: url.searchParams.get('q') ?? '',
    limit: url.searchParams.get('limit') ?? undefined,
  });
  if (!parsed.success) {
    return new Response(JSON.stringify({ items: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }

  const items = await searchStations(parsed.data.q, parsed.data.limit ?? 8);
  return new Response(JSON.stringify({ items }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300, s-maxage=86400',
    },
  });
};
