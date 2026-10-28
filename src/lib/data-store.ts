import { env } from 'cloudflare:workers';

export const DATA_KEY = /^(categories\.json|board\.json|stations\.json|runways\/[A-Z0-9]{2}\.json)$/;

interface Bucket {
  get(key: string): Promise<{ body: ReadableStream; etag: string; uploaded: Date; json<T>(): Promise<T> } | null>;
  put(key: string, value: string, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
}

export function dataBucket(): Bucket | null {
  return ((env as Record<string, unknown>).DATA as Bucket | undefined) ?? null;
}

const memo = new Map<string, { at: number; value: unknown }>();

export async function readJson<T>(key: string, maxAgeMs: number): Promise<T | null> {
  const hit = memo.get(key);
  if (hit && Date.now() - hit.at < maxAgeMs) return hit.value as T;
  const bucket = dataBucket();
  if (!bucket) return null;
  try {
    const object = await bucket.get(key);
    if (!object) return null;
    const value = await object.json<T>();
    memo.set(key, { at: Date.now(), value });
    return value;
  } catch {
    return hit ? (hit.value as T) : null;
  }
}
