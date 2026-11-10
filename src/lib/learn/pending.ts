// Scores a learner earned in this browser that are not on an account yet: lessons of an open
// course finished while signed out, or a save that failed. They wait here until a signed-in
// page sends them. Browser storage can be missing or blocked, so every call may do nothing.

const KEY = 'af-learn-pending';
const ID = /^[a-z0-9][a-z0-9-]{0,47}$/;

export interface PendingScore {
  correct: number;
  total: number;
}

type Store = Record<string, Record<string, PendingScore>>;

function read(): Store {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Store) : {};
  } catch {
    return {};
  }
}

function write(store: Store): void {
  try {
    if (Object.keys(store).length) localStorage.setItem(KEY, JSON.stringify(store));
    else localStorage.removeItem(KEY);
  } catch {
    // Nothing to do: the score stays on the page the learner is looking at.
  }
}

export function validScore(value: unknown): value is PendingScore {
  if (!value || typeof value !== 'object') return false;
  const { correct, total } = value as Partial<PendingScore>;
  return Number.isInteger(correct) && Number.isInteger(total) && total! > 0 && total! <= 500 && correct! >= 0 && correct! <= total!;
}

export function pendingFor(course: string): Record<string, PendingScore> {
  const lessons = read()[course];
  if (!lessons || typeof lessons !== 'object') return {};
  return Object.fromEntries(Object.entries(lessons).filter(([id, score]) => ID.test(id) && validScore(score)));
}

// Keeps the better of two attempts at the same lesson, as the account does.
export function better(a: PendingScore, b: PendingScore | undefined): PendingScore {
  return !b || a.correct * b.total > b.correct * a.total ? a : b;
}

export function keepPending(course: string, lesson: string, score: PendingScore): void {
  if (!ID.test(course) || !ID.test(lesson) || !validScore(score)) return;
  const store = read();
  const lessons = pendingFor(course);
  lessons[lesson] = better(score, lessons[lesson]);
  store[course] = lessons;
  write(store);
}

export function dropPending(course: string, lesson: string): void {
  const store = read();
  if (!store[course]) return;
  delete store[course][lesson];
  if (!Object.keys(store[course]).length) delete store[course];
  write(store);
}

// Sends every waiting score for a course to the signed-in account. Returns the lessons that
// were saved. A score the server refuses outright is dropped; anything else waits for next time.
export async function sendPending(course: string): Promise<string[]> {
  const saved: string[] = [];
  for (const [lesson, score] of Object.entries(pendingFor(course))) {
    try {
      const response = await fetch('/api/learn/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course, lesson, correct: score.correct }),
      });
      if (response.ok) saved.push(lesson);
      if (response.ok || response.status === 400) dropPending(course, lesson);
      else break;
    } catch {
      break;
    }
  }
  return saved;
}
