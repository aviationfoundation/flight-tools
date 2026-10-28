export const prerender = false;

import type { APIRoute } from 'astro';
import { DATA_KEY, dataBucket } from '../../lib/data-store';

const LIVE = new Set(['categories.json', 'board.json']);

export const GET: APIRoute = async ({ params, request }) => {
  const key = params.key ?? '';
  const bucket = dataBucket();
  if (!DATA_KEY.test(key) || !bucket) return new Response('Not found', { status: 404 });

  const object = await bucket.get(key);
  if (!object) return new Response('Not found', { status: 404 });

  const etag = `"${object.etag}"`;
  const cacheControl = LIVE.has(key) ? 'public, max-age=60' : 'public, max-age=86400';
  if (request.headers.get('If-None-Match') === etag) {
    return new Response(null, { status: 304, headers: { ETag: etag, 'Cache-Control': cacheControl } });
  }

  return new Response(object.body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cacheControl,
      ETag: etag,
    },
  });
};
