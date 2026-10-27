import { CampusEvent } from '../types';
import { MOCK_CAMPUS_EVENTS } from './mockEvents';
import { addDays, campusDateKey, campusDateTimeToMs, now } from '../utils/campusTime';

/**
 * Builds the campus event schedule that an admin loads into the database.
 *
 * Each day in the range gets 2 or 3 events in fixed slots (morning,
 * afternoon, evening), drawn in rotation from the event catalogue in
 * `mockEvents.ts`. The same day always produces the same events with the same
 * ids (`sched-YYYY-MM-DD-n`), so loading twice never creates duplicates and a
 * later load only adds the days that are missing.
 */

export const DAYS_BEFORE = 30;
export const DAYS_AFTER = 60;

const SLOTS = [
  { start: '09:30', end: '12:00' },
  { start: '14:00', end: '16:30' },
  { start: '18:00', end: '20:30' },
];

/** One entry per distinct event in the catalogue (follow-up sessions and finals removed). */
const CATALOGUE: CampusEvent[] = (() => {
  const seen = new Set<string>();
  return MOCK_CAMPUS_EVENTS.filter((e) => {
    if (/\(Track II|Grand Invitational/.test(e.title)) return false;
    if (seen.has(e.title)) return false;
    seen.add(e.title);
    return true;
  });
})();

/** Small deterministic hash, so a given day always gets the same choices. */
function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function dayIndex(dateKey: string): number {
  return Math.round(campusDateTimeToMs(dateKey) / 86_400_000);
}

export function scheduleEventId(dateKey: string, n: number): string {
  return `sched-${dateKey}-${n}`;
}

/** The events for one campus day. */
export function eventsForDay(dateKey: string, createdBy: string, at: number = now()): CampusEvent[] {
  const day = dayIndex(dateKey);
  const count = 2 + (hash(dateKey) % 2); // 2 or 3
  const slots = count === 3 ? SLOTS : hash(`${dateKey}-slots`) % 2 ? [SLOTS[0], SLOTS[2]] : [SLOTS[1], SLOTS[2]];
  const today = campusDateKey(at);
  const daysAhead = dayIndex(dateKey) - dayIndex(today);

  return slots.map((slot, k) => {
    const template = CATALOGUE[(((day * 3 + k) % CATALOGUE.length) + CATALOGUE.length) % CATALOGUE.length];
    const share = (hash(`${dateKey}-${k}`) % 1000) / 1000;
    // Past events: mostly full. Upcoming: fewer sign-ups the further away they are.
    const fill = daysAhead < 0 ? 0.6 + 0.35 * share : Math.max(0.05, 0.55 - daysAhead * 0.008) * (0.6 + 0.8 * share);
    const capacity = template.capacity;
    const {
      displayTime: _displayTime,
      isToday: _isToday,
      ...rest
    } = template;
    return {
      ...rest,
      id: scheduleEventId(dateKey, k + 1),
      date: dateKey,
      startTime: slot.start,
      endTime: slot.end,
      rsvpCount: Math.min(capacity, Math.round(capacity * fill)),
      isHot: Boolean(template.isHot) && daysAhead >= 0 && daysAhead <= 14,
      createdBy,
      createdAt: at,
      seeded: true,
    };
  });
}

/** Every day from `DAYS_BEFORE` days ago to `DAYS_AFTER` days ahead, as campus date keys. */
export function scheduleWindow(at: number = now()): string[] {
  const today = campusDateKey(at);
  return Array.from({ length: DAYS_BEFORE + DAYS_AFTER + 1 }, (_, i) => addDays(today, i - DAYS_BEFORE));
}

/** Events in the window whose ids are not in `existingIds`. */
export function missingScheduleEvents(existingIds: Set<string>, createdBy: string, at: number = now()): CampusEvent[] {
  return scheduleWindow(at)
    .flatMap((dateKey) => eventsForDay(dateKey, createdBy, at))
    .filter((e) => !existingIds.has(e.id));
}
