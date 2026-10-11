import React, { useMemo } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Download, ExternalLink, AlertTriangle, X } from 'lucide-react';
import { CampusEvent } from '../types';
import { generateGoogleCalendarUrl, downloadIcsFile, downloadIcsBundle } from '../services/calendarService';
import {
  compareEventsByStart,
  eventsOverlap,
  formatDayLabel,
  formatEventStatus,
  formatTimeRange,
  getEventPhase,
} from '../utils/campusTime';
import { useNow } from '../hooks/useNow';
import { handleImageFallback, FALLBACK_EVENT_IMAGE } from '../utils/imageUtils';

interface SocialCalendarViewProps {
  rsvpdEvents: string[];
  allEvents: CampusEvent[];
  onSelectEvent: (event: CampusEvent) => void;
  onRemoveRsvp: (eventId: string) => void;
  onNavigateExplore: () => void;
}

export const SocialCalendarView: React.FC<SocialCalendarViewProps> = ({
  rsvpdEvents = [],
  allEvents = [],
  onSelectEvent,
  onRemoveRsvp,
  onNavigateExplore,
}) => {
  const now = useNow();

  const { upcoming, past, days, conflicts } = useMemo(() => {
    const mine = new Set(rsvpdEvents || []);
    const myEvents = (allEvents || []).filter((e) => mine.has(e.id)).sort(compareEventsByStart);
    const upcomingEvents = myEvents.filter((e) => getEventPhase(e, now) !== 'ended');
    const pastEvents = myEvents.filter((e) => getEventPhase(e, now) === 'ended').reverse();

    const conflictIds = new Set<string>();
    for (let i = 0; i < upcomingEvents.length; i++) {
      for (let j = i + 1; j < upcomingEvents.length; j++) {
        if (eventsOverlap(upcomingEvents[i], upcomingEvents[j])) {
          conflictIds.add(upcomingEvents[i].id);
          conflictIds.add(upcomingEvents[j].id);
        }
      }
    }

    const byDay = new Map<string, CampusEvent[]>();
    upcomingEvents.forEach((e) => byDay.set(e.date, [...(byDay.get(e.date) || []), e]));

    return { upcoming: upcomingEvents, past: pastEvents, days: Array.from(byDay.entries()), conflicts: conflictIds };
  }, [allEvents, rsvpdEvents, now]);

  const renderRow = (event: CampusEvent, isPast: boolean) => {
    const hasConflict = conflicts.has(event.id);
    const phase = getEventPhase(event, now);
    return (
      <li key={event.id}>
        <div
          onClick={() => onSelectEvent(event)}
          className={`cc-card p-4 rounded-2xl bg-white border cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            hasConflict ? 'border-amber-300' : 'border-ink-200'
          } ${isPast ? 'opacity-70' : ''}`}
        >
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-xl bg-ink-100 overflow-hidden shrink-0">
              <img
                src={event.image}
                alt=""
                referrerPolicy="no-referrer"
                loading="lazy"
                onError={(e) => handleImageFallback(e, FALLBACK_EVENT_IMAGE)}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="min-w-0 space-y-1">
              <h4 className="font-display text-base font-semibold text-ink-900 leading-snug line-clamp-1">{event.title}</h4>
              <div className="flex items-center gap-x-3 gap-y-1 text-xs text-ink-600 flex-wrap">
                <span className="flex items-center gap-1 font-medium text-ink-800 tabular-nums">
                  <Clock className="w-3.5 h-3.5 text-ink-400" />
                  {isPast ? `${formatDayLabel(event.date, now)}, ` : ''}
                  {formatTimeRange(event.startTime, event.endTime)}
                </span>
                <span className="flex items-center gap-1 min-w-0">
                  <MapPin className="w-3.5 h-3.5 text-ink-400 shrink-0" />
                  <span className="truncate">
                    {event.building}, {event.room}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-2xs font-semibold px-2 py-0.5 rounded-full tabular-nums flex items-center gap-1.5 ${
                    phase === 'live' ? 'bg-rose-600 text-white' : 'bg-ink-100 text-ink-700'
                  }`}
                >
                  {phase === 'live' && <span className="cc-live-dot" />}
                  {formatEventStatus(event, now)}
                </span>
                {hasConflict && (
                  <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Overlaps another event
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            {!isPast && (
              <>
                <a
                  href={generateGoogleCalendarUrl(event)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-ink-50 text-xs font-medium text-ink-700 border border-ink-200 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Google
                </a>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadIcsFile(event);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-ink-50 text-xs font-medium text-ink-700 border border-ink-200 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  .ics
                </button>
              </>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveRsvp(event.id);
              }}
              aria-label={isPast ? `Remove ${event.title} from history` : `Cancel RSVP for ${event.title}`}
              title={isPast ? 'Remove from history' : 'Cancel RSVP'}
              className="p-2 rounded-xl bg-white hover:bg-rose-50 text-ink-500 hover:text-rose-600 border border-ink-200 hover:border-rose-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </li>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-ink-200 pb-6">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-ink-900">My schedule</h1>
          <p className="text-sm text-ink-600 mt-1.5">
            {upcoming.length === 0
              ? 'Nothing coming up yet.'
              : `${upcoming.length} upcoming ${upcoming.length === 1 ? 'event' : 'events'}. Times are campus time.`}
          </p>
        </div>

        {upcoming.length > 0 && (
          <button
            onClick={() => downloadIcsBundle(upcoming)}
            className="cc-btn-ink cc-press px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <Download className="w-4 h-4" />
            Export all to calendar
          </button>
        )}
      </div>

      {conflicts.size > 0 && (
        <div role="alert" className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p>
            <strong className="font-semibold">Some of your events overlap.</strong> They are marked below so you can decide which to keep.
          </p>
        </div>
      )}

      {upcoming.length === 0 && past.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-white border border-ink-200 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto text-brand-600">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-ink-900">Your schedule is empty</h2>
            <p className="text-sm text-ink-600 max-w-sm mx-auto mt-1">RSVP to an event and it shows up here, with a countdown and calendar export.</p>
          </div>
          <button onClick={onNavigateExplore} className="cc-btn-brand cc-press px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer">
            Browse events
          </button>
        </div>
      )}

      {days.map(([dateKey, dayEvents]) => (
        <section key={dateKey} aria-label={formatDayLabel(dateKey, now)}>
          <h2 className="font-display text-lg font-semibold text-ink-900 mb-3">{formatDayLabel(dateKey, now)}</h2>
          <ul className="cc-stagger space-y-3">{dayEvents.map((e) => renderRow(e, false))}</ul>
        </section>
      ))}

      {upcoming.length === 0 && past.length > 0 && (
        <button onClick={onNavigateExplore} className="cc-btn-brand cc-press px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer">
          Browse events
        </button>
      )}

      {past.length > 0 && (
        <section aria-label="Past events">
          <h2 className="font-display text-lg font-semibold text-ink-900 mb-3">Past</h2>
          <ul className="space-y-3">{past.map((e) => renderRow(e, true))}</ul>
        </section>
      )}
    </div>
  );
};
