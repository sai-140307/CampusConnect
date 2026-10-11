/**
 * Campus time — the single source of truth for every date and time in the app.
 *
 * Two problems are solved here:
 *
 * 1. Time zone. Event dates and times ("2026-10-12", "17:30") are wall-clock
 *    times on campus. They must mean the same instant for every viewer, so
 *    they are always interpreted in the campus time zone, never in the
 *    viewer's own zone.
 *
 * 2. Clock drift. A device clock can be minutes off. `syncClock()` measures
 *    the difference between this device and the server and `now()` applies it,
 *    so "starts in 5 min" is right even on a wrong clock.
 */

export const CAMPUS_TIME_ZONE = 'Asia/Kolkata';
export const CAMPUS_TIME_ZONE_LABEL = 'IST';
/** India Standard Time is UTC+05:30 all year (no daylight saving). */
const CAMPUS_UTC_OFFSET_MIN = 330;

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// ---------------------------------------------------------------------------
// Synced clock
// ---------------------------------------------------------------------------

let clockOffsetMs = 0;
let lastSyncAt = 0;
let syncInFlight: Promise<number> | null = null;
const offsetListeners = new Set<() => void>();

/** Current time in epoch milliseconds, corrected for device clock drift. */
export function now(): number {
  return Date.now() + clockOffsetMs;
}

export function getClockOffsetMs(): number {
  return clockOffsetMs;
}

export function onClockOffsetChange(listener: () => void): () => void {
  offsetListeners.add(listener);
  return () => offsetListeners.delete(listener);
}

/**
 * Measure the offset between this device and the server that serves the app,
 * using the HTTP `Date` header. Safe to call often: it is throttled, never
 * throws, and leaves the previous offset in place if the request fails.
 */
export function syncClock(force = false): Promise<number> {
  if (typeof window === 'undefined' || typeof fetch === 'undefined') {
    return Promise.resolve(clockOffsetMs);
  }
  if (syncInFlight) return syncInFlight;
  if (!force && lastSyncAt && Date.now() - lastSyncAt < 5 * MINUTE) {
    return Promise.resolve(clockOffsetMs);
  }

  syncInFlight = (async () => {
    try {
      const sentAt = Date.now();
      const res = await fetch(`${window.location.origin}/?clock=${sentAt}`, {
        method: 'HEAD',
        cache: 'no-store',
      });
      const receivedAt = Date.now();
      const header = res.headers.get('date');
      const serverMs = header ? Date.parse(header) : NaN;
      if (!Number.isNaN(serverMs)) {
        // The header has one-second resolution, so aim for the middle of that
        // second and of the request round trip.
        const measured = serverMs + 500 - (sentAt + receivedAt) / 2;
        // Ignore noise below two seconds; a tiny offset is not worth a re-render.
        const next = Math.abs(measured) < 2000 ? 0 : Math.round(measured);
        if (next !== clockOffsetMs) {
          clockOffsetMs = next;
          offsetListeners.forEach((fn) => fn());
        }
      }
      lastSyncAt = Date.now();
    } catch {
      // Offline or blocked: keep the last known offset.
    } finally {
      syncInFlight = null;
    }
    return clockOffsetMs;
  })();

  return syncInFlight;
}

// ---------------------------------------------------------------------------
// Campus calendar helpers
// ---------------------------------------------------------------------------

const pad = (n: number) => String(n).padStart(2, '0');

/** Shift an instant so that its UTC fields read as campus wall-clock fields. */
function toCampusFields(ms: number): Date {
  return new Date(ms + CAMPUS_UTC_OFFSET_MIN * MINUTE);
}

/** 'YYYY-MM-DD' for the campus calendar day that contains `ms`. */
export function campusDateKey(ms: number = now()): string {
  const d = toCampusFields(ms);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Number of whole campus days since the Unix epoch. */
export function campusDayNumber(ms: number = now()): number {
  return Math.floor((ms + CAMPUS_UTC_OFFSET_MIN * MINUTE) / DAY);
}

export function dateKeyFromDayNumber(dayNumber: number): string {
  const d = new Date(dayNumber * DAY);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function addDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

function parseTime(time?: string): { h: number; min: number } | null {
  if (!time) return null;
  const match = /^(\d{1,2}):(\d{2})/.exec(time.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const min = Number(match[2]);
  if (h > 23 || min > 59) return null;
  return { h, min };
}

/** Epoch ms for a campus wall-clock date and time. NaN if the date is invalid. */
export function campusDateTimeToMs(dateKey: string, time?: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec((dateKey || '').trim());
  if (!match) return NaN;
  const t = parseTime(time) || { h: 0, min: 0 };
  return (
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), t.h, t.min) -
    CAMPUS_UTC_OFFSET_MIN * MINUTE
  );
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export interface TimedEvent {
  date: string;
  startTime: string;
  endTime?: string;
}

export function eventStartMs(event: TimedEvent): number {
  return campusDateTimeToMs(event.date, event.startTime);
}

export function eventEndMs(event: TimedEvent): number {
  const start = eventStartMs(event);
  const end = parseTime(event.endTime);
  if (!end) {
    // No end time: treat the event as running to the end of its campus day.
    return campusDateTimeToMs(event.date, '23:59') + MINUTE;
  }
  let endMs = campusDateTimeToMs(event.date, event.endTime);
  // An end time at or before the start means the event runs past midnight.
  if (!Number.isNaN(start) && endMs <= start) endMs += DAY;
  return endMs;
}

export type EventPhase = 'upcoming' | 'live' | 'ended';

export function getEventPhase(event: TimedEvent, at: number = now()): EventPhase {
  const start = eventStartMs(event);
  const end = eventEndMs(event);
  if (Number.isNaN(start) || Number.isNaN(end)) return 'upcoming';
  if (at >= end) return 'ended';
  if (at >= start) return 'live';
  return 'upcoming';
}

export function isEventEnded(event: TimedEvent, at: number = now()): boolean {
  return getEventPhase(event, at) === 'ended';
}

export function isEventToday(event: TimedEvent, at: number = now()): boolean {
  return event.date === campusDateKey(at);
}

export function compareEventsByStart(a: TimedEvent, b: TimedEvent): number {
  return eventStartMs(a) - eventStartMs(b);
}

/** True when two events overlap in time. Works across midnight. */
export function eventsOverlap(a: TimedEvent, b: TimedEvent): boolean {
  return eventStartMs(a) < eventEndMs(b) && eventStartMs(b) < eventEndMs(a);
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** '17:30' -> '5:30 PM' */
export function formatClockTime(time?: string): string {
  const t = parseTime(time);
  if (!t) return time || '';
  const suffix = t.h >= 12 ? 'PM' : 'AM';
  const h12 = t.h % 12 === 0 ? 12 : t.h % 12;
  return `${h12}:${pad(t.min)} ${suffix}`;
}

/** '5:30 – 9:30 PM' or '11:00 AM – 1:30 PM' */
export function formatTimeRange(startTime?: string, endTime?: string): string {
  const start = formatClockTime(startTime);
  const end = formatClockTime(endTime);
  if (!end) return start;
  const sameHalf = start.slice(-2) === end.slice(-2);
  return `${sameHalf ? start.slice(0, -3) : start} – ${end}`;
}

/** 'Today', 'Tomorrow', 'Yesterday' or 'Wed, 14 Oct' — relative to the campus day. */
export function formatDayLabel(dateKey: string, at: number = now()): string {
  const today = campusDateKey(at);
  if (dateKey === today) return 'Today';
  if (dateKey === addDays(today, 1)) return 'Tomorrow';
  if (dateKey === addDays(today, -1)) return 'Yesterday';
  const ms = campusDateTimeToMs(dateKey);
  if (Number.isNaN(ms)) return dateKey;
  const d = toCampusFields(ms);
  const label = `${WEEKDAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
  return d.getUTCFullYear() === toCampusFields(at).getUTCFullYear()
    ? label
    : `${label} ${d.getUTCFullYear()}`;
}

/** True when the viewer's device is in a different time zone from campus. */
export function viewerIsOffCampusZone(): boolean {
  return new Date().getTimezoneOffset() !== -CAMPUS_UTC_OFFSET_MIN;
}

/** 'Today, 5:30 – 9:30 PM' (adds 'IST' for viewers in another time zone). */
export function formatEventWhen(event: TimedEvent, at: number = now()): string {
  const base = `${formatDayLabel(event.date, at)}, ${formatTimeRange(event.startTime, event.endTime)}`;
  return viewerIsOffCampusZone() ? `${base} ${CAMPUS_TIME_ZONE_LABEL}` : base;
}

/** '2h 15m', '45 min', '3 days' */
export function formatDuration(ms: number): string {
  const totalMin = Math.max(1, Math.ceil(ms / MINUTE));
  if (totalMin < 60) return `${totalMin} min`;
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  if (hours < 24) return mins ? `${hours}h ${mins}m` : `${hours}h`;
  const days = Math.round(totalMin / (60 * 24));
  return `${days} day${days === 1 ? '' : 's'}`;
}

/** Short live status for an event: 'Starts in 2h 15m', 'Live, ends in 40 min', 'Ended'. */
export function formatEventStatus(event: TimedEvent, at: number = now()): string {
  const phase = getEventPhase(event, at);
  if (phase === 'ended') return 'Ended';
  if (phase === 'live') return `Live, ends in ${formatDuration(eventEndMs(event) - at)}`;
  return `Starts in ${formatDuration(eventStartMs(event) - at)}`;
}

/** 'Just now', '3m ago', '2h ago', 'Yesterday', '4d ago', then a date. */
export function formatRelativeTime(
  timestamp?: number | string | Date,
  fallback = 'Just now',
  at: number = now()
): string {
  if (timestamp === undefined || timestamp === null || timestamp === '') return fallback;

  let ms: number;
  if (typeof timestamp === 'number') ms = timestamp;
  else if (timestamp instanceof Date) ms = timestamp.getTime();
  else {
    ms = Date.parse(timestamp);
    if (Number.isNaN(ms)) return timestamp;
  }

  const diff = at - ms;
  if (diff < 45_000) return 'Just now';
  if (diff < HOUR) return `${Math.max(1, Math.floor(diff / MINUTE))}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < 2 * DAY) return 'Yesterday';
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}d ago`;
  const d = toCampusFields(ms);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/** Campus wall clock, e.g. '4:42 PM'. */
export function formatCampusClock(at: number = now()): string {
  const d = toCampusFields(at);
  return formatClockTime(`${d.getUTCHours()}:${pad(d.getUTCMinutes())}`);
}

/** 'Sunday, 11 October' on campus. */
export function formatCampusDate(at: number = now()): string {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: CAMPUS_TIME_ZONE,
  }).format(new Date(at));
}

/** Compact UTC stamp for calendar files and links: 20261012T120000Z */
export function toCalendarUtcStamp(ms: number): string {
  const d = new Date(ms);
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

/** Campus weekday (0 = Sunday) and minutes since campus midnight. */
export function campusWeekdayAndMinutes(at: number = now()): { weekday: number; minutes: number } {
  const d = toCampusFields(at);
  return { weekday: d.getUTCDay(), minutes: d.getUTCHours() * 60 + d.getUTCMinutes() };
}
