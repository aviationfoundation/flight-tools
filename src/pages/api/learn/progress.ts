export const prerender = false;

import type { APIRoute } from 'astro';
import { getAccount, saveProgress } from '../../../lib/accounts';
import { COURSES, courseById, lessonIn } from '../../../lib/learn/courses';
import { checkCount } from '../../../lib/learn/types';
import { readBodyLimited } from '../../../lib/request-limits';

const MAX_BODY_BYTES = 512;

function reply(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export const POST: APIRoute = async ({ request, url }) => {
  if (request.headers.get('Origin') !== url.origin) return reply(403, { error: 'forbidden' });
  if (!request.headers.get('Content-Type')?.includes('application/json')) return reply(415, { error: 'send_json' });

  const text = await readBodyLimited(request, MAX_BODY_BYTES);
  if (text === null) return reply(413, { error: 'too_large' });
  let body: { course?: unknown; lesson?: unknown; correct?: unknown };
  try {
    body = JSON.parse(text);
  } catch {
    return reply(400, { error: 'invalid_json' });
  }

  // A page loaded before there were two courses sends no course; it was the NOTAM course.
  const course = body.course === undefined ? COURSES[0] : typeof body.course === 'string' ? courseById(body.course) : undefined;
  if (!course) return reply(400, { error: 'unknown_course' });
  const lesson = typeof body.lesson === 'string' ? lessonIn(course, body.lesson) : undefined;
  if (!lesson) return reply(400, { error: 'unknown_lesson' });
  const total = checkCount(lesson);
  const correct = body.correct;
  if (typeof correct !== 'number' || !Number.isInteger(correct) || correct < 0 || correct > total) return reply(400, { error: 'invalid_score' });

  const state = await getAccount(request);
  if (state.status === 'signed-out') return reply(401, { error: 'sign_in' });
  if (state.status === 'unavailable') return reply(503, { error: 'accounts_unavailable' });

  const saved = await saveProgress(state.token, course.id, lesson.id, correct, total);
  if (saved.status === 401) return reply(401, { error: 'sign_in' });
  if (saved.status !== 200) return reply(502, { error: 'not_saved' });
  return reply(200, { ok: true, lessons: saved.lessons });
};
