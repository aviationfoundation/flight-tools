import { env } from 'cloudflare:workers';

interface Limiter {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export async function readBodyLimited(request: Request, maxBytes: number): Promise<string | null> {
  const declared = Number(request.headers.get('Content-Length'));
  if (Number.isFinite(declared) && declared > maxBytes) return null;
  if (!request.body) return '';
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

export async function allowDecode(request: Request): Promise<boolean> {
  const limiter = (env as Record<string, unknown>).DECODE_LIMITER as Limiter | undefined;
  if (!limiter) return true;
  try {
    return (await limiter.limit({ key: request.headers.get('CF-Connecting-IP') ?? 'unknown' })).success;
  } catch {
    return true;
  }
}
