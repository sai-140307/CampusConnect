import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as t from '../campusTime';
import { getOpenStatus } from '../openHours';

/**
 * Run with: npm test
 * These hold for any device time zone. Try: TZ=America/Los_Angeles npm test
 */

const eq = (name: string, actual: unknown, expected: unknown) => assert.equal(actual, expected, name);

// 11 Oct 2026, 5:30 PM on campus (IST) is 12:00 UTC. It is a Sunday.
const at = Date.UTC(2026, 9, 11, 12, 0);
const ev = { date: '2026-10-11', startTime: '17:30', endTime: '21:30' };
const overnight = { date: '2026-10-11', startTime: '22:30', endTime: '01:00' };
const H1 = 'Mon - Thu: 9:00 AM - 10:00 PM | Fri: 9:00 AM - 5:00 PM | Sun: 2:00 PM - 9:00 PM';

test('campus calendar days', () => {
  eq('dateKey', t.campusDateKey(at), '2026-10-11');
  eq('dateKey late UTC', t.campusDateKey(Date.UTC(2026, 9, 11, 19, 0)), '2026-10-12'); // 00:30 IST next day
  eq('start', t.campusDateTimeToMs('2026-10-11', '17:30'), at);
  eq('stamp', t.toCalendarUtcStamp(at), '20261011T120000Z');
  eq('addDays month', t.addDays('2026-10-31', 1), '2026-11-01');
  eq('invalid', Number.isNaN(t.campusDateTimeToMs('nope', '10:00')), true);
});

test('event phases and overlap', () => {
  eq('phase before', t.getEventPhase(ev, at - 1), 'upcoming');
  eq('phase live', t.getEventPhase(ev, at), 'live');
  eq('phase ended', t.getEventPhase(ev, at + 4 * 3600e3), 'ended');
  eq('phase live last ms', t.getEventPhase(ev, at + 4 * 3600e3 - 1), 'live');
  eq('overnight end', t.eventEndMs(overnight) - t.eventStartMs(overnight), 2.5 * 3600e3);
  eq('overnight live after midnight', t.getEventPhase(overnight, Date.UTC(2026, 9, 11, 19, 0)), 'live');
  eq('no end', t.eventEndMs({ date: '2026-10-11', startTime: '10:00' }), t.campusDateTimeToMs('2026-10-12', '00:00'));
  eq('overlap', t.eventsOverlap(ev, { date: '2026-10-11', startTime: '21:00', endTime: '22:00' }), true);
  eq('touching no overlap', t.eventsOverlap(ev, { date: '2026-10-11', startTime: '21:30', endTime: '22:00' }), false);
  eq('overnight overlap next day', t.eventsOverlap(overnight, { date: '2026-10-12', startTime: '00:30', endTime: '02:00' }), true);
});

test('formatting', () => {
  eq('range same half', t.formatTimeRange('17:30', '21:30'), '5:30 – 9:30 PM');
  eq('range cross', t.formatTimeRange('11:00', '13:30'), '11:00 AM – 1:30 PM');
  eq('noon', t.formatClockTime('12:00'), '12:00 PM'); eq('midnight', t.formatClockTime('00:05'), '12:05 AM');
  eq('today', t.formatDayLabel('2026-10-11', at), 'Today'); eq('tomorrow', t.formatDayLabel('2026-10-12', at), 'Tomorrow');
  eq('other', t.formatDayLabel('2026-10-14', at), 'Wed, 14 Oct'); eq('year', t.formatDayLabel('2027-01-02', at), 'Sat, 2 Jan 2027');
  eq('today near midnight IST', t.formatDayLabel('2026-10-12', Date.UTC(2026, 9, 11, 18, 31)), 'Today');
  eq('status up', t.formatEventStatus(ev, at - 135 * 60e3), 'Starts in 2h 15m');
  eq('status live', t.formatEventStatus(ev, at + 200 * 60e3), 'Live, ends in 40 min');
  eq('status end', t.formatEventStatus(ev, at + 9e8), 'Ended');
  eq('rel now', t.formatRelativeTime(at - 10e3, 'x', at), 'Just now'); eq('rel m', t.formatRelativeTime(at - 5 * 60e3, 'x', at), '5m ago');
  eq('rel h', t.formatRelativeTime(at - 3 * 3600e3, 'x', at), '3h ago'); eq('rel y', t.formatRelativeTime(at - 30 * 3600e3, 'x', at), 'Yesterday');
  eq('rel fallback', t.formatRelativeTime(undefined, 'Just now', at), 'Just now'); eq('rel future', t.formatRelativeTime(at + 5000, 'x', at), 'Just now');
  eq('clock', t.formatCampusClock(at), '5:30 PM');
});

test('opening hours', () => {
  eq('open sun', getOpenStatus(H1, at).label, 'Open until 9:00 PM');
  eq('closing soon', getOpenStatus(H1, at + 170 * 60e3).label, 'Closes in 40 min');
  eq('closed sun night', getOpenStatus(H1, at + 4 * 3600e3).label, 'Closed, opens tomorrow 9:00 AM');
  eq('closed sat', getOpenStatus(H1, at - 24 * 3600e3).label, 'Closed, opens tomorrow 2:00 PM');
  eq('weekday only on sunday', getOpenStatus('Mon - Fri: 9:00 AM - 5:00 PM', at).label, 'Closed, opens tomorrow 9:00 AM');
  eq('fri eve', getOpenStatus('Mon - Fri: 9:00 AM - 5:00 PM', at - 2 * 24 * 3600e3).label, 'Closed, opens Mon 9:00 AM');
  eq('247 + clinic open', getOpenStatus('24/7 On-Call Support | Walk-in clinic Mon - Fri: 8:30 AM - 5:00 PM', at + 18 * 3600e3).state, 'open');
  eq('247 only', getOpenStatus('24/7', at).label, 'Open 24/7');
  eq('before open same day', getOpenStatus(H1, at - 5 * 3600e3).label, 'Closed, opens 2:00 PM');
});

