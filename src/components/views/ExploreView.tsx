import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Calendar, 
  Users, 
  Building2, 
  MapPin, 
  Flame, 
  ShieldCheck, 
  Clock,
  ChevronRight,
  TrendingUp,
  Compass,
  Play,
  Film,
  Video,
  CheckCircle2
} from 'lucide-react';
import { CampusEvent, CampusClub, CampusResource, AIMatchResult } from '../../types';
import { AIMatchmakerHero } from '../AIMatchmakerHero';
import { EventCard } from '../EventCard';
import { ClubCard } from '../ClubCard';
import { ResourceCard } from '../ResourceCard';

interface ExploreViewProps {
  events: CampusEvent[];
  clubs: CampusClub[];
  resources: CampusResource[];
  userProfile: any;
  onSelectEvent: (event: CampusEvent) => void;
  onSelectClub: (club: CampusClub) => void;
  onSelectResource: (resource: CampusResource) => void;
  onToggleRsvp: (eventId: string) => void;
  onToggleJoinClub: (clubId: string) => void;
  onToggleSaveResource: (resourceId: string) => void;
  onOpenChat: (targetId: string, type: 'event' | 'club', title: string) => void;
  onSearchAI: (query: string) => void;
  isAiMatching: boolean;
  aiMatchResult: AIMatchResult | null;
  onClearMatchResult: () => void;
  onNavigateTab: (tab: 'events' | 'clubs' | 'resources' | 'map' | 'calendar') => void;
  onOpenVideoShowcase?: () => void;
}

export const ExploreView: React.FC<ExploreViewProps> = ({
  events,
  clubs,
  resources,
  userProfile,
  onSelectEvent,
  onSelectClub,
  onSelectResource,
  onToggleRsvp,
  onToggleJoinClub,
  onToggleSaveResource,
  onOpenChat,
  onSearchAI,
  isAiMatching,
  aiMatchResult,
  onClearMatchResult,
  onNavigateTab,
  onOpenVideoShowcase,
}) => {
  // Spotlight / Today's featured events (top 4)
  const featuredEvents = events.slice(0, 4);
  const featuredClubs = clubs.slice(0, 3);
  const featuredResources = resources.slice(0, 3);

  return (
    <div className="space-y-12 pb-16">
      {/* AI & Discovery Search Hero */}
      <AIMatchmakerHero
        onSearchAI={onSearchAI}
        isLoading={isAiMatching}
        matchResult={aiMatchResult}
        onClearMatchResult={onClearMatchResult}
        onSelectEvent={onSelectEvent}
        onSelectClub={onSelectClub}
        onSelectResource={onSelectResource}
        onRsvpEvent={onToggleRsvp}
        rsvpdEvents={userProfile.rsvpdEvents}
        onNavigateTab={onNavigateTab}
        onOpenVideoShowcase={onOpenVideoShowcase}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Quick Hub Navigation Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={() => onNavigateTab('events')}
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer group flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Campus Events</h3>
                <p className="text-xs text-slate-500">{events.length} upcoming gatherings</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
          </div>

          <div
            onClick={() => onNavigateTab('clubs')}
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer group flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Student Clubs</h3>
                <p className="text-xs text-slate-500">{clubs.length} registered organizations</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
          </div>

          <div
            onClick={() => onNavigateTab('resources')}
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer group flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Support Resources</h3>
                <p className="text-xs text-slate-500">{resources.length} campus services</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
          </div>
        </section>

        {/* Campus Intro Video Banner */}
        {onOpenVideoShowcase && (
          <section 
            onClick={onOpenVideoShowcase}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-stone-900 via-stone-800 to-orange-950 text-white p-6 sm:p-8 border border-stone-800 shadow-xl cursor-pointer group transition-all hover:border-orange-500/50"
          >
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-300 text-xs font-bold">
                  <Play className="w-3 h-3 fill-current text-orange-400" />
                  <span>Interactive Video Tour</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Experience CampusConnect & VIT Infrastructure
                </h3>
                <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                  Watch our guided walkthrough of the campus tech hubs, research makerspaces, and learn how CampusConnect pairs you with hackathons, study squads, and catering drops.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="w-14 h-14 rounded-2xl bg-orange-600 group-hover:bg-orange-500 text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-all">
                  <Play className="w-6 h-6 fill-current ml-0.5" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-white">Watch HD Tour</p>
                  <p className="text-[11px] text-orange-300">2 min overview</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 1: FEATURED EVENTS */}
        <section>
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Featured Events & Perks
                </h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  Top Picks
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Popular student mixers, tech hackathons, and catered workshops this week.
              </p>
            </div>

            <button
              onClick={() => onNavigateTab('events')}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
            >
              <span>View all {events.length}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {featuredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                isRsvpd={userProfile.rsvpdEvents.includes(event.id)}
                isSaved={userProfile.savedEvents?.includes(event.id) || false}
                onSelectEvent={() => onSelectEvent(event)}
                onToggleRsvp={() => onToggleRsvp(event.id)}
                onOpenChat={() => onOpenChat(event.id, 'event', event.title)}
              />
            ))}
          </div>
        </section>

        {/* SECTION 2: POPULAR STUDENT CLUBS */}
        <section>
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Active Student Clubs
                </h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  Communities
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Find your squad, attend hands-on project nights, and build portfolio projects.
              </p>
            </div>

            <button
              onClick={() => onNavigateTab('clubs')}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
            >
              <span>Explore all {clubs.length} clubs</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {featuredClubs.map((club) => (
              <ClubCard
                key={club.id}
                club={club}
                isJoined={userProfile.joinedClubs.includes(club.id)}
                onSelectClub={() => onSelectClub(club)}
                onToggleJoin={() => onToggleJoinClub(club.id)}
                onOpenChat={() => onOpenChat(club.id, 'club', club.name)}
              />
            ))}
          </div>
        </section>

        {/* SECTION 3: CAMPUS SERVICES & ACADEMIC SUPPORT */}
        <section>
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Essential Campus Services
                </h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  Student Life
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Tutoring, mental wellness pods, makerspaces, and career advancement hubs.
              </p>
            </div>

            <button
              onClick={() => onNavigateTab('resources')}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
            >
              <span>All {resources.length} services</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {featuredResources.map((res) => (
              <ResourceCard
                key={res.id}
                resource={res}
                isSaved={userProfile.savedResources.includes(res.id)}
                onSelectResource={() => onSelectResource(res)}
                onToggleSave={() => onToggleSaveResource(res.id)}
              />
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};
