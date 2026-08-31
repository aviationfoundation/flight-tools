export type CurrencyEventType = 'landing' | 'flight_review' | 'instrument' | 'ipc';

export interface CurrencyEvent {
  id?: string;
  type: CurrencyEventType;
  occurredOn: string;
  dayLandings?: number;
  nightLandings?: number;
  approaches?: number;
  holds?: boolean;
  tracking?: boolean;
  notes?: string;
}

function toUtcDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86400000);
}

function addCalendarMonths(date: Date, months: number): Date {
  const d = new Date(date.getTime());
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

function endOfMonthAfter(date: Date, months: number): Date {
  const shifted = addCalendarMonths(date, months);
  return new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, 0));
}

function iso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export interface RollingCurrency {
  current: boolean;
  count: number;
  expiresOn: string | null;
}

function rollingLandingCurrency(events: CurrencyEvent[], kind: 'day' | 'night', asOf: Date): RollingCurrency {
  const landings = events.filter((e) => e.type === 'landing');
  const countAt = (atDate: Date): number => {
    const windowStart = addDays(atDate, -90);
    return landings
      .filter((e) => {
        const d = toUtcDate(e.occurredOn);
        return d > windowStart && d <= atDate;
      })
      .reduce((sum, e) => sum + (kind === 'day' ? e.dayLandings ?? 0 : e.nightLandings ?? 0), 0);
  };

  const count = countAt(asOf);
  const current = count >= 3;
  if (!current) return { current, count, expiresOn: null };

  let expiresOn: string | null = null;
  for (let d = 1; d <= 95; d++) {
    const future = addDays(asOf, d);
    if (countAt(future) < 3) {
      expiresOn = iso(future);
      break;
    }
  }
  return { current, count, expiresOn };
}

export interface FlightReviewStatus {
  current: boolean;
  lastDate: string | null;
  dueBy: string | null;
}

function flightReviewStatus(events: CurrencyEvent[], asOf: Date): FlightReviewStatus {
  const reviews = events.filter((e) => e.type === 'flight_review').sort((a, b) => (a.occurredOn < b.occurredOn ? 1 : -1));
  const last = reviews[0] ?? null;
  if (!last) return { current: false, lastDate: null, dueBy: null };

  const dueBy = endOfMonthAfter(toUtcDate(last.occurredOn), 24);
  return { current: asOf <= dueBy, lastDate: last.occurredOn, dueBy: iso(dueBy) };
}

export interface InstrumentCurrency {
  status: 'current' | 'grace' | 'lapsed' | 'no-data';
  approachesInWindow: number;
  hasHoldInWindow: boolean;
  hasTrackingInWindow: boolean;
  lastCurrentOn: string | null;
  graceEndsOn: string | null;
}

function instrumentCurrentAt(events: CurrencyEvent[], atDate: Date): { current: boolean; approaches: number; hold: boolean; tracking: boolean } {
  const windowStart = addCalendarMonths(atDate, -6);
  const inWindow = events.filter((e) => {
    if (e.type !== 'instrument' && e.type !== 'ipc') return false;
    const d = toUtcDate(e.occurredOn);
    return d > windowStart && d <= atDate;
  });
  if (inWindow.some((e) => e.type === 'ipc')) return { current: true, approaches: 6, hold: true, tracking: true };

  const approaches = inWindow.reduce((sum, e) => sum + (e.approaches ?? 0), 0);
  const hold = inWindow.some((e) => e.holds);
  const tracking = inWindow.some((e) => e.tracking);
  return { current: approaches >= 6 && hold && tracking, approaches, hold, tracking };
}

function instrumentCurrency(events: CurrencyEvent[], asOf: Date): InstrumentCurrency {
  const now = instrumentCurrentAt(events, asOf);
  if (now.current) {
    return { status: 'current', approachesInWindow: now.approaches, hasHoldInWindow: now.hold, hasTrackingInWindow: now.tracking, lastCurrentOn: null, graceEndsOn: null };
  }

  let lastCurrentOn: Date | null = null;
  for (let d = 1; d <= 365 * 3; d++) {
    const past = addDays(asOf, -d);
    if (instrumentCurrentAt(events, past).current) {
      lastCurrentOn = past;
      break;
    }
  }

  if (!lastCurrentOn) {
    return { status: 'no-data', approachesInWindow: now.approaches, hasHoldInWindow: now.hold, hasTrackingInWindow: now.tracking, lastCurrentOn: null, graceEndsOn: null };
  }

  const graceEnds = endOfMonthAfter(lastCurrentOn, 6);
  return {
    status: asOf <= graceEnds ? 'grace' : 'lapsed',
    approachesInWindow: now.approaches,
    hasHoldInWindow: now.hold,
    hasTrackingInWindow: now.tracking,
    lastCurrentOn: iso(lastCurrentOn),
    graceEndsOn: iso(graceEnds),
  };
}

export interface CurrencyStatus {
  passengerDay: RollingCurrency;
  passengerNight: RollingCurrency;
  flightReview: FlightReviewStatus;
  instrument: InstrumentCurrency;
  asOf: string;
}

export function computeCurrency(events: CurrencyEvent[], asOf: Date = new Date()): CurrencyStatus {
  const at = new Date(Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), asOf.getUTCDate()));
  return {
    passengerDay: rollingLandingCurrency(events, 'day', at),
    passengerNight: rollingLandingCurrency(events, 'night', at),
    flightReview: flightReviewStatus(events, at),
    instrument: instrumentCurrency(events, at),
    asOf: iso(at),
  };
}

export function summarizeCurrency(status: CurrencyStatus): { label: string; tone: 'ok' | 'warning' | 'danger'; detail: string } {
  const issues: Array<{ label: string; tone: 'warning' | 'danger'; detail: string }> = [];

  if (!status.passengerDay.current) issues.push({ label: 'Day currency lapsed', tone: 'danger', detail: `Only ${status.passengerDay.count} of 3 landings in the last 90 days.` });
  if (!status.flightReview.current) issues.push({ label: status.flightReview.lastDate ? 'Flight review due' : 'No flight review on record', tone: 'danger', detail: status.flightReview.dueBy ? `Was due ${status.flightReview.dueBy}.` : 'Log your most recent flight review to start tracking.' });
  if (status.instrument.status === 'lapsed') issues.push({ label: 'IPC required', tone: 'danger', detail: 'Instrument currency lapsed beyond the 6-month grace period.' });
  if (status.instrument.status === 'grace') issues.push({ label: 'Instrument currency lapsed', tone: 'warning', detail: `Grace period to requalify without an IPC ends ${status.instrument.graceEndsOn}.` });
  if (!status.passengerNight.current && status.passengerNight.count > 0) issues.push({ label: 'Night currency lapsed', tone: 'warning', detail: `Only ${status.passengerNight.count} of 3 night landings in the last 90 days.` });

  const danger = issues.find((i) => i.tone === 'danger');
  if (danger) return danger;
  const warning = issues.find((i) => i.tone === 'warning');
  if (warning) return warning;

  return { label: 'All current', tone: 'ok', detail: 'Day passenger currency, flight review, and instrument currency all check out.' };
}
