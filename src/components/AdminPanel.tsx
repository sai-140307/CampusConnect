import React, { useEffect, useMemo, useState } from 'react';
import { X, ShieldCheck, Users, CalendarPlus, History, Inbox, Trash2, Check, Ban, Search, LayoutDashboard } from 'lucide-react';
import { AuditEntry, CampusEvent, OrganizerRequest, StaffMember } from '../types';
import {
  adminDeleteEvent,
  approveOrganizer,
  countUsers,
  rejectOrganizer,
  revokeOrganizer,
  saveEventsInBulk,
  subscribeToAdmins,
  subscribeToAuditLog,
  subscribeToOrganizerRequests,
  subscribeToOrganizers,
} from '../firebase';
import { useModal } from '../hooks/useModal';
import { useNow } from '../hooks/useNow';
import {
  compareEventsByStart,
  formatDayLabel,
  formatEventWhen,
  formatRelativeTime,
  getEventPhase,
  isEventToday,
} from '../utils/campusTime';
import { DAYS_AFTER, DAYS_BEFORE, missingScheduleEvents, scheduleWindow } from '../data/eventSchedule';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  actor: { uid: string; email: string };
  /** Every event in the database. */
  events: CampusEvent[];
  registrationCount: number;
  onToast: (message: string) => void;
}

type Tab = 'overview' | 'requests' | 'organizers' | 'events' | 'activity';

const ACTION_LABELS: Record<string, string> = {
  'organizer.approve': 'Approved organizer',
  'organizer.reject': 'Rejected organizer request',
  'organizer.revoke': 'Removed organizer',
  'event.delete': 'Deleted event',
  'events.load': 'Loaded events',
};

/**
 * Admin console: approve organizers, remove them, load the event schedule into
 * the database, delete events and read the activity log. Every action here is
 * also enforced by the database rules, so hiding this panel is not the security;
 * the rules are.
 */
export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose, actor, events, registrationCount, onToast }) => {
  useModal(isOpen, onClose);
  const now = useNow();
  const [tab, setTab] = useState<Tab>('overview');
  const [requests, setRequests] = useState<(OrganizerRequest & { id: string })[]>([]);
  const [organizers, setOrganizers] = useState<StaffMember[]>([]);
  const [admins, setAdmins] = useState<StaffMember[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [eventFilter, setEventFilter] = useState<'upcoming' | 'past'>('upcoming');
  const [eventSearch, setEventSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onError = () => setLoadError(true);
    setLoadError(false);
    const stops = [
      subscribeToOrganizerRequests(setRequests, onError),
      subscribeToOrganizers(setOrganizers, onError),
      subscribeToAdmins(setAdmins, onError),
      subscribeToAuditLog(setAudit, onError),
    ];
    countUsers().then(setUserCount).catch(() => setUserCount(null));
    return () => stops.forEach((stop) => stop());
  }, [isOpen]);

  const stats = useMemo(() => {
    let past = 0;
    let today = 0;
    let upcoming = 0;
    events.forEach((e) => {
      if (getEventPhase(e, now) === 'ended') past += 1;
      else if (isEventToday(e, now)) today += 1;
      else upcoming += 1;
    });
    return { past, today, upcoming };
  }, [events, now]);

  const days = useMemo(() => scheduleWindow(now), [now]);
  const missing = useMemo(() => missingScheduleEvents(new Set(events.map((e) => e.id)), actor.uid, now), [events, actor.uid, now]);
  const daysWithEvents = useMemo(() => {
    const dates = new Set(events.map((e) => e.date));
    return days.filter((d) => dates.has(d)).length;
  }, [events, days]);

  const pending = requests.filter((r) => r.status === 'pending').sort((a, b) => a.requestedAt - b.requestedAt);
  const decided = requests.filter((r) => r.status !== 'pending').sort((a, b) => (b.decidedAt || 0) - (a.decidedAt || 0));

  const listedEvents = useMemo(() => {
    const q = eventSearch.trim().toLowerCase();
    const list = events
      .filter((e) => (eventFilter === 'past' ? getEventPhase(e, now) === 'ended' : getEventPhase(e, now) !== 'ended'))
      .filter((e) => !q || e.title.toLowerCase().includes(q) || e.organizer.toLowerCase().includes(q))
      .sort(compareEventsByStart);
    return (eventFilter === 'past' ? list.reverse() : list).slice(0, 60);
  }, [events, eventFilter, eventSearch, now]);

  if (!isOpen) return null;

  const run = async (id: string, action: () => Promise<void>, done: string, failed: string) => {
    setBusyId(id);
    try {
      await action();
      onToast(done);
    } catch (err) {
      console.warn(err);
      onToast(failed);
    }
    setBusyId(null);
  };

  const loadSchedule = async () => {
    if (missing.length === 0) return;
    setProgress({ done: 0, total: missing.length });
    try {
      await saveEventsInBulk(actor, missing, (done, total) => setProgress({ done, total }));
      onToast(`Added ${missing.length} events to the database.`);
    } catch (err) {
      console.warn(err);
      onToast('Could not save the events. Check that the database rules are deployed.');
    }
    setProgress(null);
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    { id: 'requests', label: 'Requests', icon: <Inbox className="w-3.5 h-3.5" />, badge: pending.length },
    { id: 'organizers', label: 'Organizers', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'events', label: 'Events', icon: <CalendarPlus className="w-3.5 h-3.5" /> },
    { id: 'activity', label: 'Activity log', icon: <History className="w-3.5 h-3.5" /> },
  ];

  const stat = (label: string, value: number | string) => (
    <div className="p-4 rounded-xl bg-white border border-ink-200">
      <p className="text-2xl font-display font-semibold text-ink-900 tabular-nums">{value}</p>
      <p className="text-xs text-ink-500 mt-0.5">{label}</p>
    </div>
  );

  return (
    <div
      className="cc-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/50 backdrop-blur-xs overflow-y-auto"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div role="dialog" aria-modal="true" aria-label="Admin console" className="cc-dialog relative w-full max-w-3xl bg-white border border-ink-200 rounded-2xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh] text-ink-900">
        <div className="p-5 border-b border-ink-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl cc-btn-ink flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-lg">Admin console</h2>
              <p className="text-xs text-ink-500">Signed in as {actor.email}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-xl border border-ink-200 hover:bg-ink-100 text-ink-500 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-1 px-4 pt-2 border-b border-ink-100 overflow-x-auto no-scrollbar" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`pb-2.5 px-2.5 text-sm font-medium border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                tab === t.id ? 'border-brand-600 text-ink-900' : 'border-transparent text-ink-500 hover:text-ink-800'
              }`}
            >
              {t.icon}
              {t.label}
              {Boolean(t.badge) && <span className="min-w-5 px-1.5 rounded-full bg-rose-600 text-white text-2xs font-semibold tabular-nums">{t.badge}</span>}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 bg-ink-50/50 text-sm">
          {loadError && (
            <p role="alert" className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
              Some admin data could not be loaded. Make sure the latest database rules are deployed and your email is verified.
            </p>
          )}

          {tab === 'overview' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {stat('Past events', stats.past)}
                {stat('Still to come today', stats.today)}
                {stat('Upcoming events', stats.upcoming)}
                {stat('Registrations', registrationCount)}
                {stat('Accounts', userCount ?? '–')}
                {stat('Organizers', organizers.length)}
              </div>
              <div className="p-4 rounded-xl bg-white border border-ink-200 space-y-1">
                <p className="font-semibold text-ink-900">Schedule coverage</p>
                <p className="text-ink-600">
                  {daysWithEvents} of {days.length} days from {formatDayLabel(days[0], now)} to {formatDayLabel(days.at(-1) || days[0], now)} have
                  events.{' '}
                  {missing.length > 0 ? (
                    <button onClick={() => setTab('events')} className="text-brand-700 font-medium hover:underline cursor-pointer">
                      Add the {missing.length} missing events
                    </button>
                  ) : (
                    'Nothing missing.'
                  )}
                </p>
              </div>
              {pending.length > 0 && (
                <button onClick={() => setTab('requests')} className="w-full text-left p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 cursor-pointer">
                  {pending.length} organizer {pending.length === 1 ? 'request is' : 'requests are'} waiting for review.
                </button>
              )}
            </div>
          )}

          {tab === 'requests' && (
            <div className="space-y-5">
              {pending.length === 0 && <p className="text-ink-600">No requests waiting.</p>}
              {pending.map((r) => (
                <div key={r.id} className="p-4 rounded-xl bg-white border border-ink-200 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink-900 truncate">{r.name}</p>
                      <p className="text-ink-600 truncate">{r.email}</p>
                      <p className="text-ink-600">{r.department}</p>
                    </div>
                    <span className="text-xs text-ink-500 shrink-0">{formatRelativeTime(r.requestedAt, '', now)}</span>
                  </div>
                  {r.reason && <p className="text-ink-700 bg-ink-50 rounded-lg p-2.5">“{r.reason}”</p>}
                  <div className="flex gap-2">
                    <button
                      disabled={busyId === r.id}
                      onClick={() => run(r.id, () => approveOrganizer(actor, r), `${r.name} is now an organizer.`, 'Could not approve. Try again.')}
                      className="cc-btn-brand cc-press px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Approve
                    </button>
                    <button
                      disabled={busyId === r.id}
                      onClick={() => run(r.id, () => rejectOrganizer(actor, r), 'Request rejected.', 'Could not reject. Try again.')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-ink-200 bg-white hover:bg-rose-50 hover:text-rose-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
              {decided.length > 0 && (
                <div>
                  <h3 className="font-semibold text-ink-700 mb-2">Decided</h3>
                  <ul className="divide-y divide-ink-100 bg-white rounded-xl border border-ink-200">
                    {decided.map((r) => (
                      <li key={r.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
                        <span className="truncate">
                          {r.name} <span className="text-ink-500">{r.email}</span>
                        </span>
                        <span className={`text-xs font-semibold ${r.status === 'approved' ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {r.status === 'approved' ? 'Approved' : 'Rejected'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {tab === 'organizers' && (
            <div className="space-y-5">
              <div>
                <h3 className="font-semibold text-ink-700 mb-2">Organizers ({organizers.length})</h3>
                {organizers.length === 0 ? (
                  <p className="text-ink-600">No organizers yet. Approve a request to add one.</p>
                ) : (
                  <ul className="divide-y divide-ink-100 bg-white rounded-xl border border-ink-200">
                    {organizers.map((o) => (
                      <li key={o.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
                        <span className="min-w-0">
                          <span className="block font-medium truncate">{o.name || o.email}</span>
                          <span className="block text-xs text-ink-500 truncate">
                            {[o.email, o.department].filter(Boolean).join(' · ')}
                          </span>
                        </span>
                        <button
                          disabled={busyId === o.id}
                          onClick={() => {
                            if (window.confirm(`Remove organizer access for ${o.name || o.email}?`)) {
                              run(o.id, () => revokeOrganizer(actor, o), 'Organizer access removed.', 'Could not remove. Try again.');
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-ink-200 hover:bg-rose-50 hover:text-rose-700 cursor-pointer disabled:opacity-50 shrink-0"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-ink-700 mb-2">Admins ({admins.length})</h3>
                <ul className="divide-y divide-ink-100 bg-white rounded-xl border border-ink-200">
                  {admins.map((a) => (
                    <li key={a.id} className="px-4 py-2.5">
                      <span className="block font-medium truncate">{a.name || a.email || a.id}</span>
                      {a.email && a.name && <span className="block text-xs text-ink-500 truncate">{a.email}</span>}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-ink-500 mt-2">
                  Admins can only be added or removed in the Firebase console, never from the app.
                </p>
              </div>
            </div>
          )}

          {tab === 'events' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-white border border-ink-200 space-y-3">
                <div>
                  <p className="font-semibold text-ink-900">Campus schedule</p>
                  <p className="text-ink-600 mt-0.5">
                    Keeps 2 or 3 events a day in the database, from {DAYS_BEFORE} days ago to {DAYS_AFTER} days ahead. Run it again any time
                    to fill new days. Existing events are never changed or duplicated.
                  </p>
                </div>
                {progress ? (
                  <div>
                    <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
                      <div className="cc-meter h-full bg-brand-600" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
                    </div>
                    <p className="text-xs text-ink-500 mt-1 tabular-nums">
                      Saved {progress.done} of {progress.total}
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={loadSchedule}
                    disabled={missing.length === 0}
                    className="cc-btn-brand cc-press px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <CalendarPlus className="w-4 h-4" />
                    {missing.length > 0 ? `Add ${missing.length} missing events` : 'Schedule is complete'}
                  </button>
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {(['upcoming', 'past'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setEventFilter(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${eventFilter === f ? 'cc-btn-ink' : 'bg-white border border-ink-200 text-ink-600'}`}
                    >
                      {f === 'upcoming' ? `Upcoming and live (${stats.today + stats.upcoming})` : `Past (${stats.past})`}
                    </button>
                  ))}
                  <div className="relative flex-1 min-w-40">
                    <Search className="w-3.5 h-3.5 text-ink-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="search"
                      aria-label="Search events"
                      value={eventSearch}
                      onChange={(e) => setEventSearch(e.target.value)}
                      placeholder="Search title or organizer"
                      className="w-full rounded-lg pl-8 pr-2 py-1.5 text-xs bg-white border border-ink-200 focus:outline-none focus:border-brand-600"
                    />
                  </div>
                </div>
                <ul className="divide-y divide-ink-100 bg-white rounded-xl border border-ink-200">
                  {listedEvents.length === 0 && <li className="px-4 py-3 text-ink-600">No events here yet.</li>}
                  {listedEvents.map((e) => (
                    <li key={e.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block font-medium truncate">{e.title}</span>
                        <span className="block text-xs text-ink-500 truncate tabular-nums">
                          {formatEventWhen(e, now)} · {e.organizer}
                        </span>
                      </span>
                      <button
                        disabled={busyId === e.id}
                        aria-label={`Delete ${e.title}`}
                        onClick={() => {
                          if (window.confirm(`Delete "${e.title}" on ${e.date}? Registrations for it stay in the log.`)) {
                            run(e.id, () => adminDeleteEvent(actor, e), 'Event deleted.', 'Could not delete. Try again.');
                          }
                        }}
                        className="p-2 rounded-lg text-ink-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer disabled:opacity-50 shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
                {listedEvents.length === 60 && <p className="text-xs text-ink-500 mt-2">Showing the first 60. Search to narrow the list.</p>}
              </div>
            </div>
          )}

          {tab === 'activity' && (
            <div>
              {audit.length === 0 ? (
                <p className="text-ink-600">No admin actions yet.</p>
              ) : (
                <ul className="divide-y divide-ink-100 bg-white rounded-xl border border-ink-200">
                  {[...audit]
                    .sort((a, b) => b.at - a.at)
                    .slice(0, 100)
                    .map((a) => (
                      <li key={a.id} className="px-4 py-2.5 flex items-start justify-between gap-3">
                        <span className="min-w-0">
                          <span className="block font-medium">{ACTION_LABELS[a.action] || a.action}</span>
                          <span className="block text-xs text-ink-600 truncate">{a.detail}</span>
                          <span className="block text-xs text-ink-400 truncate">by {a.actorEmail}</span>
                        </span>
                        <span className="text-xs text-ink-500 shrink-0">{formatRelativeTime(a.at, '', now)}</span>
                      </li>
                    ))}
                </ul>
              )}
              <p className="text-xs text-ink-500 mt-2">Entries can be added but never edited or deleted, so this is a reliable record.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
