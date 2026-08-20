import { CampusEvent, NotificationItem, UserProfile } from '../types';
import { sendMissedEventEmail } from '../services/emailService';

/**
 * Formats elapsed time relative to current real-world clock time
 * e.g. "Just now", "3m ago", "1h ago", "2d ago"
 */
export function formatRelativeTime(
  timestamp?: number | string | Date,
  fallback: string = 'Just now'
): string {
  if (!timestamp) return fallback;

  let timeMs: number;
  if (typeof timestamp === 'number') {
    timeMs = timestamp;
  } else if (typeof timestamp === 'string') {
    const parsed = Date.parse(timestamp);
    if (!isNaN(parsed)) {
      timeMs = parsed;
    } else {
      return timestamp;
    }
  } else if (timestamp instanceof Date) {
    timeMs = timestamp.getTime();
  } else {
    return fallback;
  }

  const now = Date.now();
  const diffSeconds = Math.floor((now - timeMs) / 1000);

  if (diffSeconds < 45) {
    return 'Just now';
  }
  if (diffSeconds < 3600) {
    const mins = Math.max(1, Math.floor(diffSeconds / 60));
    return `${mins}m ago`;
  }
  if (diffSeconds < 86400) {
    const hours = Math.floor(diffSeconds / 3600);
    return `${hours}h ago`;
  }
  if (diffSeconds < 172800) {
    return 'Yesterday';
  }
  const days = Math.floor(diffSeconds / 86400);
  return `${days}d ago`;
}

/**
 * Checks if a given event has passed its completion deadline.
 * Handles dates like '2026-08-20', '2026-08-21' and times like '17:00', '19:30'
 */
export function isEventExpired(event: CampusEvent): boolean {
  try {
    const eventDateStr = event.date; // 'YYYY-MM-DD'
    const endTimeStr = event.endTime || '23:59'; // 'HH:mm'
    
    const [hours, minutes] = endTimeStr.split(':').map(Number);
    const eventDateTime = new Date(eventDateStr);
    if (!isNaN(hours) && !isNaN(minutes)) {
      eventDateTime.setHours(hours, minutes, 0, 0);
    } else {
      eventDateTime.setHours(23, 59, 59, 999);
    }

    const now = new Date();
    return now.getTime() > eventDateTime.getTime();
  } catch {
    return false;
  }
}

/**
 * Filter and categorize active vs expired events
 */
export function partitionEventsByStatus(events: CampusEvent[] = []): {
  activeEvents: CampusEvent[];
  expiredEvents: CampusEvent[];
} {
  const activeEvents: CampusEvent[] = [];
  const expiredEvents: CampusEvent[] = [];

  (events || []).forEach((ev) => {
    if (!ev) return;
    if (isEventExpired(ev)) {
      expiredEvents.push({ ...ev, isToday: false });
    } else {
      activeEvents.push(ev);
    }
  });

  return { activeEvents, expiredEvents };
}

const MISSED_EVENTS_SENT_KEY = 'campuspulse_sent_missed_event_alerts_v2';

export function getSentMissedEventIds(): string[] {
  try {
    const data = localStorage.getItem(MISSED_EVENTS_SENT_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function markMissedEventAsSent(eventId: string): void {
  try {
    const sent = getSentMissedEventIds();
    if (!sent.includes(eventId)) {
      localStorage.setItem(MISSED_EVENTS_SENT_KEY, JSON.stringify([...sent, eventId]));
    }
  } catch {
    // Ignore storage errors
  }
}

/**
 * Scans events whose deadline is completed.
 * ONLY notifies the student if they actually RSVP'd/registered for it.
 * Returns the list of expired event IDs to remove from the active database/state.
 */
export function processExpiredEventsAndNotify(
  events: CampusEvent[] = [],
  rsvpdEventIds: string[] = [],
  userEmail: string,
  userProfile: UserProfile,
  onAddNotification: (notif: NotificationItem) => void
): string[] {
  const rsvpSet = new Set(rsvpdEventIds || []);
  const alreadySentIds = new Set(getSentMissedEventIds());
  const expiredEventIdsToRemove: string[] = [];

  (events || []).forEach((ev) => {
    if (!ev) return;
    if (isEventExpired(ev)) {
      expiredEventIdsToRemove.push(ev.id);

      // Notify the student ONLY if they registered for this event
      if (rsvpSet.has(ev.id) && !alreadySentIds.has(ev.id)) {
        const notifKey = `missed-event-${ev.id}`;

        const missedNotif: NotificationItem = {
          id: notifKey,
          title: `⚠️ Event Completed & Resources Available: ${ev.title}`,
          body: `The deadline for ${ev.title} has completed. Slide deck, recap notes, and attendee discussion are now accessible in your hub.`,
          timestamp: 'Just now',
          createdAt: Date.now(),
          isRead: false,
          type: 'reminder',
          urgent: true,
          eventId: ev.id,
        };

        onAddNotification(missedNotif);

        // Dispatch Missed Event email to user's real email address
        sendMissedEventEmail(userProfile, ev, userEmail);

        // Record that alert has been sent to avoid any duplication
        markMissedEventAsSent(ev.id);
      }
    }
  });

  return expiredEventIdsToRemove;
}
