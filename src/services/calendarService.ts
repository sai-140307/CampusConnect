import { CampusEvent } from '../types';

export function generateGoogleCalendarUrl(event: CampusEvent): string {
  const title = encodeURIComponent(event.title);
  const details = encodeURIComponent(`${event.description}\n\nPerks: ${event.perks.join(', ')}\nLocation: ${event.building} - ${event.room}`);
  const location = encodeURIComponent(`${event.building}, Room ${event.room}, Campus`);

  // Simple date format conversion YYYYMMDDTHHMMSSZ
  const dateStr = event.date.replace(/-/g, '');
  const startHour = event.startTime.replace(':', '') + '00';
  const endHour = event.endTime.replace(':', '') + '00';
  const dates = `${dateStr}T${startHour}/${dateStr}T${endHour}`;

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${dates}`;
}

export function generateOutlookCalendarUrl(event: CampusEvent): string {
  const title = encodeURIComponent(event.title);
  const details = encodeURIComponent(`${event.description}\n\nPerks: ${event.perks.join(', ')}\nLocation: ${event.building} - ${event.room}`);
  const location = encodeURIComponent(`${event.building}, Room ${event.room}`);
  
  // Format as ISO string YYYY-MM-DDTHH:MM:SS
  const startIso = `${event.date}T${event.startTime}:00`;
  const endIso = `${event.date}T${event.endTime}:00`;

  return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&body=${details}&location=${location}&startdt=${startIso}&enddt=${endIso}`;
}

export function downloadIcsFile(event: CampusEvent) {
  const dateStr = event.date.replace(/-/g, '');
  const startHour = event.startTime.replace(':', '') + '00';
  const endHour = event.endTime.replace(':', '') + '00';

  const icsData = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CampusPulse//Campus Event Discovery//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.shortDesc.replace(/\n/g, ' ')}`,
    `LOCATION:${event.building} Room ${event.room}`,
    `DTSTART:${dateStr}T${startHour}`,
    `DTEND:${dateStr}T${endHour}`,
    `STATUS:CONFIRMED`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function detectScheduleConflict(
  targetEvent: CampusEvent,
  allEvents: CampusEvent[] = [],
  rsvpdEventIds: string[] = []
): { hasConflict: boolean; conflictingEvent?: CampusEvent } {
  const rsvpdList = (allEvents || []).filter((e) => (rsvpdEventIds || []).includes(e.id) && e.id !== targetEvent.id);
  
  for (const existing of rsvpdList) {
    if (existing.date === targetEvent.date) {
      // Compare time ranges
      if (
        (targetEvent.startTime >= existing.startTime && targetEvent.startTime < existing.endTime) ||
        (targetEvent.endTime > existing.startTime && targetEvent.endTime <= existing.endTime) ||
        (targetEvent.startTime <= existing.startTime && targetEvent.endTime >= existing.endTime)
      ) {
        return { hasConflict: true, conflictingEvent: existing };
      }
    }
  }

  return { hasConflict: false };
}
