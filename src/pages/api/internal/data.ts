export const prerender = false;

import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { DATA_KEY, dataBucket } from '../../../lib/data-store';

const MAX_BODY_BYTES = 6_000_000;
const MAX_OBJECTS = 50;

function reply(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function tokenMatches(given: string, expected: string): boolean {
  const a = new TextEncoder().encode(given);
  const b = new TextEncoder().encode(expected);
  if (a.byteLength !== b.byteLength) return false;
  const subtle = crypto.subtle as SubtleCrypto & { timingSafeEqual?: (x: ArrayBufferView, y: ArrayBufferView) => boolean };
  if (subtle.timingSafeEqual) return subtle.timingSafeEqual(a, b);
  let diff = 0;
  for (let i = 0; i < a.byteLength; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export const POST: APIRoute = async ({ request }) => {
  const expected = (env as Record<string, unknown>).DATA_PUSH_TOKEN;
  const bucket = dataBucket();
  if (typeof expected !== 'string' || expected.length < 32 || !bucket) return reply(404);

  const header = request.headers.get('Authorization') ?? '';
  const given = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!tokenMatches(given, expected)) return reply(401, { error: 'unauthorized' });

  const length = Number(request.headers.get('Content-Length') ?? '0');
  if (length > MAX_BODY_BYTES) return reply(413, { error: 'too_large' });

  let payload: { objects?: Array<{ key?: unknown; body?: unknown }> };
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) return reply(413, { error: 'too_large' });
    payload = JSON.parse(text);
  } catch {
    return reply(400, { error: 'invalid_json' });
  }

  const objects = Array.isArray(payload.objects) ? payload.objects : [];
  if (!objects.length || objects.length > MAX_OBJECTS) return reply(400, { error: 'bad_batch' });
  for (const object of objects) {
    if (typeof object.key !== 'string' || !DATA_KEY.test(object.key) || typeof object.body !== 'string') {
      return reply(400, { error: 'bad_object' });
    }
    try {
      JSON.parse(object.body);
    } catch {
      return reply(400, { error: 'bad_object' });
    }
  }

  await Promise.all(
    objects.map((object) =>
      bucket.put(object.key as string, object.body as string, { httpMetadata: { contentType: 'application/json' } }),
    ),
  );
  return reply(200, { stored: objects.length });
};
