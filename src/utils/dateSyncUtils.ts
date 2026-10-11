import { CampusEvent } from '../types';
import { formatRelativeTime as formatRelative, isEventEnded, now } from './campusTime';

/**
 * Kept for existing imports. All time logic lives in `campusTime.ts`.
 */

export function formatRelativeTime(
  timestamp?: number | string | Date,
  fallback: string = 'Just now',
  at: number = now()
): string {
  return formatRelative(timestamp, fallback, at);
}

/** True once the event's end time has passed on campus. */
export function isEventExpired(event: CampusEvent, at: number = now()): boolean {
  return isEventEnded(event, at);
}

export function partitionEventsByStatus(
  events: CampusEvent[] = [],
  at: number = now()
): { activeEvents: CampusEvent[]; expiredEvents: CampusEvent[] } {
  const activeEvents: CampusEvent[] = [];
  const expiredEvents: CampusEvent[] = [];
  (events || []).forEach((ev) => {
    if (!ev) return;
    (isEventEnded(ev, at) ? expiredEvents : activeEvents).push(ev);
  });
  return { activeEvents, expiredEvents };
}

const WRAP_UP_SENT_KEY = 'campusconnect_wrapup_sent_v1';

/** Keys ("eventId@date") of events whose wrap-up notice has already been sent. */
export function getSentWrapUpKeys(): string[] {
  try {
    const data = localStorage.getItem(WRAP_UP_SENT_KEY);
    const parsed = data ? JSON.parse(data) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function markWrapUpSent(key: string): void {
  try {
    const sent = getSentWrapUpKeys();
    if (!sent.includes(key)) {
      // Keep the list bounded so it cannot grow forever.
      localStorage.setItem(WRAP_UP_SENT_KEY, JSON.stringify([...sent, key].slice(-200)));
    }
  } catch {
    // Storage unavailable: the notice may repeat next session, which is acceptable.
  }
}

export function wrapUpKey(event: CampusEvent): string {
  return `${event.id}@${event.date}`;
}
