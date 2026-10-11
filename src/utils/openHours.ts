import { campusWeekdayAndMinutes, formatClockTime, formatDuration, now } from './campusTime';

/**
 * Works out whether a campus service is open right now from its opening-hours
 * text, e.g. "Mon - Thu: 9:00 AM - 10:00 PM | Fri: 9:00 AM - 5:00 PM".
 * The answer is always computed from the live campus clock, never stored.
 */

export type OpenState = 'open' | 'closing_soon' | 'closed' | 'unknown';

export interface OpenStatus {
  state: OpenState;
  /** Short label, e.g. "Open until 10:00 PM" or "Closed, opens Mon 9:00 AM". */
  label: string;
}

const DAY_INDEX: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SEGMENT =
  /(sun|mon|tue|wed|thu|fri|sat)[a-z]*\s*(?:[-–]\s*(sun|mon|tue|wed|thu|fri|sat)[a-z]*)?\s*:\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*[-–]\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/gi;

interface Window {
  day: number;
  open: number;
  close: number;
}

const toMinutes = (h: string, m: string | undefined, half: string): number => {
  let hour = Number(h) % 12;
  if (half.toLowerCase() === 'pm') hour += 12;
  return hour * 60 + Number(m || 0);
};

const clock = (minutes: number) => formatClockTime(`${Math.floor(minutes / 60) % 24}:${String(minutes % 60).padStart(2, '0')}`);

function parseWindows(text: string): Window[] {
  const windows: Window[] = [];
  for (const match of text.matchAll(SEGMENT)) {
    const from = DAY_INDEX[match[1].toLowerCase()];
    const to = match[2] ? DAY_INDEX[match[2].toLowerCase()] : from;
    const open = toMinutes(match[3], match[4], match[5]);
    let close = toMinutes(match[6], match[7], match[8]);
    if (close <= open) close += 24 * 60; // closes after midnight
    for (let d = from; ; d = (d + 1) % 7) {
      windows.push({ day: d, open, close });
      if (d === to) break;
    }
  }
  return windows;
}

export function getOpenStatus(openHours: string, at: number = now()): OpenStatus {
  const text = openHours || '';
  const windows = parseWindows(text);

  // A round-the-clock service is open even when its walk-in desk is not.
  if (/24\s*\/\s*7/.test(text)) return { state: 'open', label: 'Open 24/7' };
  if (windows.length === 0) return { state: 'unknown', label: 'See hours' };

  const { weekday, minutes } = campusWeekdayAndMinutes(at);

  // Open now? Also check yesterday's window in case it runs past midnight.
  for (const w of windows) {
    const sinceOpen = w.day === weekday ? minutes : w.day === (weekday + 6) % 7 ? minutes + 24 * 60 : -1;
    if (sinceOpen >= w.open && sinceOpen < w.close) {
      const left = w.close - sinceOpen;
      return left <= 60
        ? { state: 'closing_soon', label: `Closes in ${formatDuration(left * 60_000)}` }
        : { state: 'open', label: `Open until ${clock(w.close)}` };
    }
  }

  // Closed: find the next opening within the coming week.
  for (let offset = 0; offset < 8; offset++) {
    const day = (weekday + offset) % 7;
    const next = windows
      .filter((w) => w.day === day && (offset > 0 || w.open > minutes))
      .sort((a, b) => a.open - b.open)[0];
    if (next) {
      const when = offset === 0 ? '' : offset === 1 ? 'tomorrow ' : `${DAY_NAMES[day]} `;
      return { state: 'closed', label: `Closed, opens ${when}${clock(next.open)}` };
    }
  }

  return { state: 'closed', label: 'Closed' };
}
