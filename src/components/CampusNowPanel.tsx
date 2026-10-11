import React, { useMemo } from 'react';
import { ArrowRight, CheckCircle2, RefreshCw } from 'lucide-react';
import { CampusEvent } from '../types';
import {
  CAMPUS_TIME_ZONE_LABEL,
  campusDateTimeToMs,
  campusDateKey,
  eventEndMs,
  eventStartMs,
  formatCampusClock,
  formatCampusDate,
  formatClockTime,
  formatDayLabel,
  formatDuration,
  getClockOffsetMs,
  getEventPhase,
} from '../utils/campusTime';
import { useNow } from '../hooks/useNow';

interface CampusNowPanelProps {
  /** Events that have not ended, sorted by start time. */
  events: CampusEvent[];
  /** Every event today, including ones that already ended, for the day chart. */
  todayEvents?: CampusEvent[];
  onSelectEvent: (event: CampusEvent) => void;
  onViewAll: () => void;
}

const DAY_START_HOUR = 8;
const DAY_END_HOUR = 24;

/**
 * The campus clock: what is on right now and what starts next, on one timeline
 * of today. Everything here is driven by the shared synced clock.
 */
export const CampusNowPanel: React.FC<CampusNowPanelProps> = ({ events, todayEvents, onSelectEvent, onViewAll }) => {
  const now = useNow();
  const today = campusDateKey(now);
  const allToday = useMemo(() => (todayEvents || events).filter((e) => e.date === today), [todayEvents, events, today]);

  const { live, next, hours } = useMemo(() => {
    const liveEvents = events.filter((e) => getEventPhase(e, now) === 'live');
    const upcoming = events.filter((e) => getEventPhase(e, now) === 'upcoming');
    // How many events are running in each hour of today.
    const start = campusDateTimeToMs(today, `${DAY_START_HOUR}:00`);
    const counts = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => {
      const from = start + i * 3_600_000;
      const to = from + 3_600_000;
      return {
        count: allToday.filter((e) => eventStartMs(e) < to && eventEndMs(e) > from).length,
        current: now >= from && now < to,
        past: now >= to,
      };
    });
    return { live: liveEvents, next: upcoming.slice(0, 3), hours: counts };
  }, [events, allToday, now, today]);

  const busiest = Math.max(1, ...hours.map((h) => h.count));
  const dayStart = campusDateTimeToMs(today, `${DAY_START_HOUR}:00`);
  const nowPosition = Math.max(0, Math.min(1, (now - dayStart) / ((DAY_END_HOUR - DAY_START_HOUR) * 3_600_000)));
  const offsetSeconds = Math.round(getClockOffsetMs() / 1000);
  const featured = live.length > 0 ? live.slice(0, 2) : [];
  const list = [...featured, ...next].slice(0, 3);

  return (
    <aside className="cc-now-panel rounded-3xl p-5 sm:p-6" aria-label="Right now on campus">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-white/70">{formatCampusDate(now)}</p>
          <p className="font-display text-4xl sm:text-5xl font-semibold tracking-tight tabular-nums text-white mt-1">
            {formatCampusClock(now)}
            <span className="text-base font-medium text-white/60 ml-2">{CAMPUS_TIME_ZONE_LABEL}</span>
          </p>
        </div>
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-2xs font-medium text-white/80"
          title={
            offsetSeconds === 0
              ? 'Your device clock matches the server.'
              : `Your device clock is ${Math.abs(offsetSeconds)}s ${offsetSeconds > 0 ? 'behind' : 'ahead'}. Times here are corrected.`
          }
        >
          {offsetSeconds === 0 ? <CheckCircle2 className="w-3 h-3 text-emerald-300" /> : <RefreshCw className="w-3 h-3 text-amber-300" />}
          {offsetSeconds === 0 ? 'Clock in sync' : 'Clock corrected'}
        </span>
      </div>

      {/* Today at a glance: one column per hour, taller when more is on. */}
      <div className="mt-6" aria-hidden="true">
        <div className="relative h-14 flex items-end gap-[3px]">
          {hours.map((h, i) => (
            <span
              key={i}
              className={`cc-hour-bar flex-1 rounded-sm ${h.current ? 'bg-amber-300' : h.past ? 'bg-white/15' : 'bg-white/40'}`}
              style={{ height: `${h.count === 0 ? 6 : 14 + (h.count / busiest) * 86}%`, animationDelay: `${300 + i * 25}ms` }}
            />
          ))}
          <span className="cc-now-marker absolute -top-1 -bottom-1 w-0.5 rounded-full bg-white" style={{ left: `${nowPosition * 100}%` }} />
        </div>
        <div className="flex justify-between text-2xs text-white/50 mt-2 tabular-nums">
          <span>8 AM</span>
          <span>12 PM</span>
          <span>4 PM</span>
          <span>8 PM</span>
          <span>12 AM</span>
        </div>
      </div>

      <div className="mt-5 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-white">
          {live.length > 0 ? `${live.length} happening now` : 'Coming up next'}
        </h2>
        <button
          type="button"
          onClick={onViewAll}
          className="text-xs font-medium text-white/80 hover:text-white inline-flex items-center gap-1 cursor-pointer"
        >
          All events
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {list.length === 0 ? (
        <p className="mt-3 text-sm text-white/70">Nothing else is scheduled right now. Check the events page for the days ahead.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {list.map((ev) => {
            const isLive = getEventPhase(ev, now) === 'live';
            return (
              <li key={ev.id}>
                <button
                  type="button"
                  onClick={() => onSelectEvent(ev)}
                  className="w-full text-left flex items-center gap-3 p-3 rounded-xl bg-white/8 hover:bg-white/14 transition-colors cursor-pointer"
                >
                  <span className="w-16 shrink-0 text-xs font-semibold text-white tabular-nums leading-tight">
                    {formatClockTime(ev.startTime)}
                    {ev.date !== today && <span className="block text-2xs font-normal text-white/60">{formatDayLabel(ev.date, now)}</span>}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-white truncate">{ev.title}</span>
                    <span className="block text-xs text-white/65 truncate">{ev.building}</span>
                  </span>
                  <span
                    className={`shrink-0 text-2xs font-semibold px-2 py-1 rounded-full tabular-nums ${
                      isLive ? 'bg-amber-300 text-amber-950' : 'bg-white/12 text-white/85'
                    }`}
                  >
                    {isLive ? `${formatDuration(eventEndMs(ev) - now)} left` : `in ${formatDuration(eventStartMs(ev) - now)}`}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
};
