import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Download, 
  ExternalLink, 
  AlertTriangle, 
  Trash2
} from 'lucide-react';
import { CampusEvent } from '../types';
import { generateGoogleCalendarUrl, downloadIcsFile } from '../services/calendarService';

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
  const myEvents = (allEvents || [])
    .filter((e) => (rsvpdEvents || []).includes(e.id))
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));

  // Check if any events overlap in time
  const conflicts: { [key: string]: boolean } = {};
  for (let i = 0; i < myEvents.length; i++) {
    for (let j = i + 1; j < myEvents.length; j++) {
      const e1 = myEvents[i];
      const e2 = myEvents[j];
      if (e1.date === e2.date) {
        if (
          (e1.startTime >= e2.startTime && e1.startTime < e2.endTime) ||
          (e1.endTime > e2.startTime && e1.endTime <= e2.endTime)
        ) {
          conflicts[e1.id] = true;
          conflicts[e2.id] = true;
        }
      }
    }
  }

  const handleDownloadAllIcs = () => {
    if (myEvents.length === 0) return;
    myEvents.forEach((ev, idx) => {
      setTimeout(() => downloadIcsFile(ev), idx * 200);
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <CalendarIcon className="w-3.5 h-3.5 text-slate-600" />
            Personal Schedule
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            My Social & Academic Calendar
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            {myEvents.length} registered event{myEvents.length === 1 ? '' : 's'}. Sync to your personal calendar.
          </p>
        </div>

        {/* Sync Actions */}
        {myEvents.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadAllIcs}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors flex items-center gap-2 shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export All (.ICS)</span>
            </button>
          </div>
        )}
      </div>

      {/* Conflict Warning */}
      {Object.keys(conflicts).length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold text-amber-900">Time Conflict Detected: </strong>
            You have overlapping events scheduled for the same time window.
          </div>
        </div>
      )}

      {/* Empty State */}
      {myEvents.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Your Calendar is Open</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            You haven’t RSVP’d to any campus events yet. Explore upcoming club workshops and sessions.
          </p>
          <button
            onClick={onNavigateExplore}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-xs"
          >
            Explore Events
          </button>
        </div>
      ) : (
        /* Timeline List */
        <div className="space-y-3">
          {myEvents.map((event) => {
            const hasConflict = conflicts[event.id];
            return (
              <div
                key={event.id}
                onClick={() => onSelectEvent(event)}
                className={`p-4 rounded-2xl bg-white border transition-all hover:shadow-xs cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  hasConflict
                    ? 'border-amber-300 bg-amber-50/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Left info */}
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {event.category}
                      </span>
                      {hasConflict && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Time Overlap
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm sm:text-base font-bold text-slate-900 hover:text-slate-700 transition-colors line-clamp-1">
                      {event.title}
                    </h4>

                    <div className="flex items-center gap-3 text-xs text-slate-500 font-medium flex-wrap">
                      <span className="flex items-center gap-1 text-slate-700 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {event.displayTime}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {event.building} ({event.room})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right actions */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <a
                    href={generateGoogleCalendarUrl(event)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors"
                    title="Add to Google Calendar"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadIcsFile(event);
                    }}
                    className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors"
                    title="Download .ICS"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveRsvp(event.id);
                    }}
                    className="p-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 transition-colors"
                    title="Cancel RSVP"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
