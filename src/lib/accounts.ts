import { env } from 'cloudflare:workers';

export const ACCOUNTS_ORIGIN = 'https://aviation.foundation';
const SESSION_COOKIE = 'af_session';
const SESSION_TOKEN = /^[0-9a-f]{64}$/;
const TIMEOUT_MS = 5000;

export interface Account {
  name: string;
}

export interface LessonProgress {
  lesson: string;
  correct: number;
  total: number;
  completedAt: string;
}

export type AccountState =
  | { status: 'signed-in'; account: Account; token: string }
  | { status: 'signed-out' }
  | { status: 'unavailable' };

interface ServiceBinding {
  fetch(request: Request): Promise<Response>;
}

interface AccountsEnv {
  ACCOUNTS?: ServiceBinding;
  ACCOUNTS_DEV_URL?: string;
  DEV_ACCOUNT?: string;
}

function accountsEnv(): AccountsEnv {
  return env as unknown as AccountsEnv;
}

const devProgress = new Map<string, LessonProgress>();

function devStub(): boolean {
  return import.meta.env.DEV && accountsEnv().DEV_ACCOUNT === '1';
}

export function accountsOrigin(): string {
  const devUrl = accountsEnv().ACCOUNTS_DEV_URL;
  return import.meta.env.DEV && devUrl ? devUrl.replace(/\/$/, '') : ACCOUNTS_ORIGIN;
}

export function signInUrl(returnTo: string, register = false): string {
  const params = new URLSearchParams({ returnTo });
  if (register) params.set('mode', 'register');
  return `${accountsOrigin()}/login?${params}`;
}

export function sessionToken(request: Request): string | null {
  const header = request.headers.get('Cookie');
  if (!header) return null;
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name !== SESSION_COOKIE) continue;
    const value = rest.join('=');
    return SESSION_TOKEN.test(value) ? value : null;
  }
  return null;
}

async function callAccounts(path: string, token: string, init: { method?: string; body?: unknown } = {}): Promise<Response | null> {
  const headers = new Headers({ Cookie: `${SESSION_COOKIE}=${token}`, Accept: 'application/json' });
  const body = init.body === undefined ? undefined : JSON.stringify(init.body);
  if (body !== undefined) {
    headers.set('Content-Type', 'application/json');
    headers.set('Origin', ACCOUNTS_ORIGIN);
  }
  const options: RequestInit = { method: init.method ?? 'GET', headers, body, signal: AbortSignal.timeout(TIMEOUT_MS) };
  const { ACCOUNTS, ACCOUNTS_DEV_URL } = accountsEnv();
  try {
    if (import.meta.env.DEV && ACCOUNTS_DEV_URL) return await fetch(`${accountsOrigin()}${path}`, options);
    if (!ACCOUNTS) return null;
    return await ACCOUNTS.fetch(new Request(`${ACCOUNTS_ORIGIN}${path}`, options));
  } catch {
    return null;
  }
}

export async function getAccount(request: Request): Promise<AccountState> {
  if (devStub()) return { status: 'signed-in', account: { name: 'Local learner' }, token: 'dev' };
  const token = sessionToken(request);
  if (!token) return { status: 'signed-out' };
  const response = await callAccounts('/api/auth/me', token);
  if (!response || !response.ok) return { status: 'unavailable' };
  try {
    const data = (await response.json()) as { authenticated?: boolean; user?: { name?: unknown } | null };
    if (!data.authenticated || !data.user) return { status: 'signed-out' };
    const name = typeof data.user.name === 'string' && data.user.name.trim() ? data.user.name.trim().slice(0, 60) : 'Pilot';
    return { status: 'signed-in', account: { name }, token };
  } catch {
    return { status: 'unavailable' };
  }
}

function parseLessons(value: unknown): LessonProgress[] {
  if (!value || typeof value !== 'object' || !Array.isArray((value as { lessons?: unknown }).lessons)) return [];
  return ((value as { lessons: unknown[] }).lessons)
    .filter((row): row is LessonProgress => {
      const r = row as Partial<LessonProgress>;
      return typeof r.lesson === 'string' && typeof r.correct === 'number' && typeof r.total === 'number' && typeof r.completedAt === 'string';
    });
}

export async function getProgress(token: string, course: string): Promise<LessonProgress[] | null> {
  if (devStub()) return [...devProgress.values()];
  const response = await callAccounts(`/api/courses/progress?course=${encodeURIComponent(course)}`, token);
  if (!response || !response.ok) return null;
  try {
    return parseLessons(await response.json());
  } catch {
    return null;
  }
}

export async function saveProgress(token: string, course: string, lesson: string, correct: number, total: number): Promise<{ status: number; lessons: LessonProgress[] }> {
  if (devStub()) {
    const previous = devProgress.get(lesson);
    const better = !previous || correct * previous.total > previous.correct * total;
    devProgress.set(lesson, better ? { lesson, correct, total, completedAt: previous?.completedAt ?? new Date().toISOString() } : previous);
    return { status: 200, lessons: [...devProgress.values()] };
  }
  const response = await callAccounts('/api/courses/progress', token, { method: 'POST', body: { course, lesson, correct, total } });
  if (!response) return { status: 503, lessons: [] };
  try {
    return { status: response.status, lessons: response.ok ? parseLessons(await response.json()) : [] };
  } catch {
    return { status: 502, lessons: [] };
  }
}
