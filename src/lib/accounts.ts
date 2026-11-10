import { env } from 'cloudflare:workers';
import { CERTIFICATE_CODE } from './learn/certificate-code.ts';

export { normaliseCertificateCode, printedCode } from './learn/certificate-code.ts';

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

// token is null for the calls anyone may make, such as checking a certificate code.
async function callAccounts(path: string, token: string | null, init: { method?: string; body?: unknown } = {}): Promise<Response | null> {
  const headers = new Headers({ Accept: 'application/json' });
  if (token) headers.set('Cookie', `${SESSION_COOKIE}=${token}`);
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
  if (devStub()) return [...devProgress.entries()].filter(([key]) => key.startsWith(`${course}:`)).map(([, row]) => row);
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
    const key = `${course}:${lesson}`;
    const previous = devProgress.get(key);
    const better = !previous || correct * previous.total > previous.correct * total;
    devProgress.set(key, better ? { lesson, correct, total, completedAt: previous?.completedAt ?? new Date().toISOString() } : previous);
    return { status: 200, lessons: (await getProgress(token, course)) ?? [] };
  }
  const response = await callAccounts('/api/courses/progress', token, { method: 'POST', body: { course, lesson, correct, total } });
  if (!response) return { status: 503, lessons: [] };
  try {
    return { status: response.status, lessons: response.ok ? parseLessons(await response.json()) : [] };
  } catch {
    return { status: 502, lessons: [] };
  }
}

export interface Certificate {
  code: string;
  course: string;
  name: string;
  lessons: number;
  correct: number;
  total: number;
  completedAt: string;
  issuedAt: string;
}

function parseCertificate(value: unknown): Certificate | null {
  if (!value || typeof value !== 'object') return null;
  const c = value as Partial<Certificate>;
  const text = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 200;
  const count = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 100000;
  if (!text(c.code) || !CERTIFICATE_CODE.test(c.code) || !text(c.course) || !text(c.name) || !text(c.completedAt) || !text(c.issuedAt)) return null;
  if (!count(c.lessons) || !count(c.correct) || !count(c.total)) return null;
  return { code: c.code, course: c.course, name: c.name, lessons: c.lessons, correct: c.correct, total: c.total, completedAt: c.completedAt, issuedAt: c.issuedAt };
}

function parseMissing(value: unknown): string[] {
  const missing = (value as { missing?: unknown } | null)?.missing;
  return Array.isArray(missing) ? missing.filter((id): id is string => typeof id === 'string') : [];
}

const devCertificates = new Map<string, Certificate>();

function devStanding(course: string, lessonIds: string[]) {
  const rows = lessonIds.map((id) => devProgress.get(`${course}:${id}`));
  return {
    missing: lessonIds.filter((_, i) => !rows[i]),
    correct: rows.reduce((sum, row) => sum + (row?.correct ?? 0), 0),
    total: rows.reduce((sum, row) => sum + (row?.total ?? 0), 0),
    completedAt: rows.map((row) => row?.completedAt ?? '').sort().at(-1) ?? '',
  };
}

export interface CertificateStanding {
  certificate: Certificate | null;
  // Lessons still to finish. Empty once the course is complete.
  missing: string[];
}

/** The member's certificate for a course, or the lessons still to do. Null when accounts can't be reached. */
export async function getCertificate(token: string, course: string, lessonIds: string[]): Promise<CertificateStanding | null> {
  if (devStub()) return { certificate: devCertificates.get(course) ?? null, missing: devStanding(course, lessonIds).missing };
  const response = await callAccounts(`/api/courses/certificate?course=${encodeURIComponent(course)}`, token);
  if (!response || !response.ok) return null;
  try {
    const data = await response.json();
    return { certificate: parseCertificate((data as { certificate?: unknown }).certificate), missing: parseMissing(data) };
  } catch {
    return null;
  }
}

export type IssueResult =
  | { status: 'issued'; certificate: Certificate }
  | { status: 'incomplete'; missing: string[] }
  | { status: 'bad-name' }
  | { status: 'signed-out' }
  | { status: 'failed' };

/** Issues the certificate, or changes the name printed on one already issued. */
export async function issueCertificate(token: string, course: string, name: string, lessonIds: string[]): Promise<IssueResult> {
  if (devStub()) {
    const state = devStanding(course, lessonIds);
    if (state.missing.length) return { status: 'incomplete', missing: state.missing };
    const clean = name.replace(/\s+/g, ' ').trim();
    if (clean.length < 2 || clean.length > 80) return { status: 'bad-name' };
    const previous = devCertificates.get(course);
    const certificate: Certificate = {
      code: previous?.code ?? '2345DEV6789X', course, name: clean, lessons: lessonIds.length, correct: state.correct, total: state.total,
      completedAt: state.completedAt, issuedAt: previous?.issuedAt ?? new Date().toISOString(),
    };
    devCertificates.set(course, certificate);
    return { status: 'issued', certificate };
  }
  const response = await callAccounts('/api/courses/certificate', token, { method: 'POST', body: { course, name } });
  if (!response) return { status: 'failed' };
  try {
    const data = await response.json();
    if (response.ok) {
      const certificate = parseCertificate((data as { certificate?: unknown }).certificate);
      return certificate ? { status: 'issued', certificate } : { status: 'failed' };
    }
    if (response.status === 409) return { status: 'incomplete', missing: parseMissing(data) };
    if (response.status === 400 && (data as { error?: unknown }).error === 'name') return { status: 'bad-name' };
    if (response.status === 401) return { status: 'signed-out' };
    return { status: 'failed' };
  } catch {
    return { status: 'failed' };
  }
}

export type CheckResult = { status: 'valid'; certificate: Certificate } | { status: 'not-found' } | { status: 'unavailable' };

/** Looks a certificate up by its code. Needs no account: this is the check a teacher makes. */
export async function checkCertificate(code: string): Promise<CheckResult> {
  if (devStub()) {
    const found = [...devCertificates.values()].find((c) => c.code === code);
    return found ? { status: 'valid', certificate: found } : { status: 'not-found' };
  }
  const response = await callAccounts(`/api/courses/certificate?code=${encodeURIComponent(code)}`, null);
  if (!response) return { status: 'unavailable' };
  if (response.status === 404) return { status: 'not-found' };
  if (!response.ok) return { status: 'unavailable' };
  try {
    const certificate = parseCertificate(((await response.json()) as { certificate?: unknown }).certificate);
    return certificate ? { status: 'valid', certificate } : { status: 'unavailable' };
  } catch {
    return { status: 'unavailable' };
  }
}
