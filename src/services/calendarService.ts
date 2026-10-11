import { CampusEvent } from '../types';
import {
  CAMPUS_TIME_ZONE,
  eventEndMs,
  eventStartMs,
  eventsOverlap,
  now,
  toCalendarUtcStamp,
} from '../utils/campusTime';

/**
 * Calendar exports always carry absolute UTC instants, so an event lands at
 * the right moment in any calendar app, whatever time zone the student is in.
 */

function eventDetails(event: CampusEvent): string {
  const perks = (event.perks || []).join(', ');
  return [event.description, perks ? `Perks: ${perks}` : '', `Location: ${event.building}, ${event.room}`]
    .filter(Boolean)
    .join('\n\n');
}

export function generateGoogleCalendarUrl(event: CampusEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    details: eventDetails(event),
    location: `${event.building}, ${event.room}`,
    dates: `${toCalendarUtcStamp(eventStartMs(event))}/${toCalendarUtcStamp(eventEndMs(event))}`,
    ctz: CAMPUS_TIME_ZONE,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function generateOutlookCalendarUrl(event: CampusEvent): string {
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    body: eventDetails(event),
    location: `${event.building}, ${event.room}`,
    startdt: new Date(eventStartMs(event)).toISOString(),
    enddt: new Date(eventEndMs(event)).toISOString(),
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/** Escape text for an iCalendar property value (RFC 5545 §3.3.11). */
function icsEscape(value: string): string {
  return (value || '')
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\;');
}

function icsEventBlock(event: CampusEvent): string[] {
  return [
    'BEGIN:VEVENT',
    `UID:${event.id}-${event.date}@campusconnect`,
    `DTSTAMP:${toCalendarUtcStamp(now())}`,
    `DTSTART:${toCalendarUtcStamp(eventStartMs(event))}`,
    `DTEND:${toCalendarUtcStamp(eventEndMs(event))}`,
    `SUMMARY:${icsEscape(event.title)}`,
    `DESCRIPTION:${icsEscape(event.shortDesc || event.description)}`,
    `LOCATION:${icsEscape(`${event.building}, ${event.room}`)}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Starts in 30 minutes',
    'TRIGGER:-PT30M',
    'END:VALARM',
    'END:VEVENT',
  ];
}

function downloadIcs(filename: string, events: CampusEvent[]) {
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CampusConnect//Campus Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events.flatMap(icsEventBlock),
    'END:VCALENDAR',
  ].join('\r\n');

  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadIcsFile(event: CampusEvent) {
  const slug = event.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'event';
  downloadIcs(`${slug}.ics`, [event]);
}

/** One .ics file holding every event, instead of one download per event. */
export function downloadIcsBundle(events: CampusEvent[]) {
  if (events.length === 0) return;
  downloadIcs('my-campus-schedule.ics', events);
}

export function detectScheduleConflict(
  targetEvent: CampusEvent,
  allEvents: CampusEvent[] = [],
  rsvpdEventIds: string[] = []
): { hasConflict: boolean; conflictingEvent?: CampusEvent } {
  const mine = new Set(rsvpdEventIds || []);
  const conflictingEvent = (allEvents || []).find(
    (e) => e.id !== targetEvent.id && mine.has(e.id) && eventsOverlap(e, targetEvent)
  );
  return conflictingEvent ? { hasConflict: true, conflictingEvent } : { hasConflict: false };
}
