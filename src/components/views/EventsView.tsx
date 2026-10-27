import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Flame, 
  Calendar as CalendarIcon, 
  MapPin, 
  Clock, 
  Filter, 
  LayoutGrid, 
  List, 
  X,
  Plus,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  History
} from 'lucide-react';
import { CampusEvent, EventCategory, PerkType, UserProfile } from '../../types';
import { EventCard } from '../EventCard';
import { compareEventsByStart, isEventEnded, isEventToday } from '../../utils/campusTime';
import { useNow } from '../../hooks/useNow';

interface EventsViewProps {
  events: CampusEvent[];
  userProfile: UserProfile;
  onSelectEvent: (event: CampusEvent) => void;
  onToggleRsvp: (eventId: string) => void;
  onOpenChat: (eventId: string) => void;
  onOpenCreateModal: () => void;
  onDeleteEvent?: (eventId: string) => void;
  currentUid?: string;
  isAdmin?: boolean;
}

const CATEGORIES: ('All' | EventCategory)[] = [
  'All',
  'Academic & STEM',
  'Free Food & Social',
  'Career & Professional',
  'Arts, Music & Culture',
  'Health & Wellness',
  'Tech & Hackathons',
  'Sports & Outdoors',
];

const PERK_OPTIONS: PerkType[] = [
  'Free Food 🍕',
  'Resume Drop 💼',
  'Free Swag 👕',
  'Pet Therapy 🐶',
  'Tutors On-Duty 📚',
  'Networking 🤝',
];

export const EventsView: React.FC<EventsViewProps> = ({
  events = [],
  userProfile,
  onSelectEvent,
  onToggleRsvp,
  onOpenChat,
  onOpenCreateModal,
  onDeleteEvent,
  currentUid,
  isAdmin = false,
}) => {
  const now = useNow();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | EventCategory>('All');
  const [selectedPerk, setSelectedPerk] = useState<PerkType | null>(null);
  const [showTodayOnly, setShowTodayOnly] = useState(false);
  const [showExpired, setShowExpired] = useState(false);
  const [permissionNoticeOpen, setPermissionNoticeOpen] = useState(false);

  const isOrganizer = userProfile?.role === 'organizer';

  const filteredEvents = useMemo(() => {
    const matches = (events || []).filter((ev) => {
      if (!ev) return false;
      const expired = isEventEnded(ev, now);
      // If showExpired is false, only show active non-expired events
      if (!showExpired && expired) return false;
      if (showExpired && !expired) return false;

      if (selectedCategory !== 'All' && ev.category !== selectedCategory) return false;
      if (selectedPerk && !(ev.perks || []).includes(selectedPerk)) return false;
      if (showTodayOnly && !isEventToday(ev, now)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = (ev.title || '').toLowerCase().includes(q);
        const matchesDesc = (ev.description || '').toLowerCase().includes(q);
        const matchesBuilding = (ev.building || '').toLowerCase().includes(q);
        const matchesOrganizer = (ev.organizer || '').toLowerCase().includes(q);
        const matchesTag = (ev.tags || []).some((t) => (t || '').toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesBuilding && !matchesOrganizer && !matchesTag) {
          return false;
        }
      }
      return true;
    });
    // Upcoming: soonest first. Past: most recent first.
    matches.sort(compareEventsByStart);
    return showExpired ? matches.reverse() : matches;
  }, [events, selectedCategory, selectedPerk, showTodayOnly, showExpired, searchQuery, now]);

  const hasFilters = Boolean(searchQuery.trim()) || selectedCategory !== 'All' || selectedPerk !== null || showTodayOnly;
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedPerk(null);
    setShowTodayOnly(false);
  };

  // The app decides: organizers get the publish form, everyone else the access request.
  const handlePostClick = () => onOpenCreateModal();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-200/70 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900 tracking-tight">
              Events
            </h1>
            {isOrganizer && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-950 border border-amber-300">
                Organizer Access
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-ink-600">
            {filteredEvents.length} {showExpired ? 'past' : 'upcoming'} {filteredEvents.length === 1 ? 'event' : 'events'}, {showExpired ? 'most recent first' : 'soonest first'}.
          </p>
        </div>

        <button
          onClick={handlePostClick}
          className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer ${
            isOrganizer 
              ? 'cc-btn-brand' 
              : 'bg-ink-100 hover:bg-ink-200 text-ink-700 border border-ink-200'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>{isOrganizer ? "Post an event" : "Post an event (organizers)"}</span>
        </button>
      </div>

      {/* Role Permission Modal if student clicks Post Event */}
      {permissionNoticeOpen && (
        <div className="cc-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-xs" onMouseDown={(e) => { if (e.target === e.currentTarget) setPermissionNoticeOpen(false); }}>
          <div className="cc-dialog bg-white border border-amber-300 rounded-2xl p-6 max-w-md shadow-xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-ink-900">Organizer Permissions Required</h3>
              <p className="text-xs text-ink-600 mt-1 leading-relaxed">
                To maintain verified academic and club integrity, only authorized <strong>Event Organizers & Faculty</strong> can publish or delete events on CampusConnect.
              </p>
            </div>
            <div className="bg-amber-50 p-3 rounded-xl text-xs text-amber-900 text-left border border-amber-200">
              💡 <strong>Tip:</strong> If you are a student club lead or organizer, you can sign in with an Organizer account or enter the verification key on the sign-in screen.
            </div>
            <button
              onClick={() => setPermissionNoticeOpen(false)}
              className="cc-btn-ink w-full py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-brand-200/80 shadow-2xs space-y-4">
        
        {/* Top Controls: Search Input + Quick Toggles */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-ink-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              aria-label="Search events"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by event title, host, building, or topic..."
              className="w-full bg-ink-50/80 border border-brand-200/80 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* Active vs Expired Toggle */}
            <button
              type="button"
              onClick={() => setShowExpired(!showExpired)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                showExpired
                  ? 'bg-amber-100 text-amber-950 border-amber-300 shadow-2xs'
                  : 'bg-ink-50 text-ink-600 hover:bg-ink-100 border-ink-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>{showExpired ? "Showing past events" : "Past events"}</span>
            </button>

            {/* Happening Today Toggle */}
            <button
              type="button"
              onClick={() => setShowTodayOnly(!showTodayOnly)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                showTodayOnly
                  ? 'cc-btn-brand border-brand-600 shadow-xs'
                  : 'bg-ink-50 text-ink-600 hover:bg-ink-100 border-ink-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Today</span>
            </button>
          </div>
        </div>

        {/* Categories Scroller */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'cc-btn-brand shadow-2xs'
                  : 'bg-ink-100/80 text-ink-600 hover:bg-brand-100/60 hover:text-ink-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Perks filter bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-brand-100">
          <span className="text-xs font-bold text-ink-500 mr-1 shrink-0">
            Perks:
          </span>
          {PERK_OPTIONS.map((perk) => (
            <button
              key={perk}
              onClick={() => setSelectedPerk(selectedPerk === perk ? null : perk)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                selectedPerk === perk
                  ? 'bg-amber-100 text-amber-950 border border-amber-300 font-bold'
                  : 'bg-ink-50 text-ink-600 border border-ink-200 hover:bg-ink-100'
              }`}
            >
              {perk}
            </button>
          ))}
          {selectedPerk && (
            <button
              onClick={() => setSelectedPerk(null)}
              className="text-xs text-brand-700 hover:underline font-bold px-1 shrink-0 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-brand-200/80 p-8 space-y-3">
          <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mx-auto">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-ink-900">
            {showExpired ? "No past events match" : "No events match"}
          </h3>
          <p className="text-xs text-ink-500 max-w-sm mx-auto">
            {hasFilters ? 'Try fewer filters or a different search.' : 'Check back soon. New events appear here as organizers publish them.'}
          </p>
          {hasFilters && (
            <button onClick={clearFilters} className="cc-btn-ink px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="cc-stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredEvents.map((ev) => (
            <div key={ev.id} className="relative group h-full">
              <EventCard
                event={ev}
                isRsvpd={userProfile.rsvpdEvents.includes(ev.id)}
                onRsvp={onToggleRsvp}
                onOpenDetails={onSelectEvent}
                onOpenChat={onOpenChat}
              />
              {/* Organizer Delete Button if user is an organizer */}
              {onDeleteEvent && (isAdmin || (isOrganizer && ev.createdBy === currentUid)) && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Are you sure you want to delete "${ev.title}"? This will remove it from the platform.`)) {
                      onDeleteEvent(ev.id);
                    }
                  }}
                  className="absolute top-14 right-3 p-2 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-800 border border-rose-200 transition-colors z-10 cursor-pointer"
                  title="Delete event"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
