import React, { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { CampusEvent, CampusClub, CampusResource, AIMatchResult, UserProfile } from '../../types';
import { AIMatchmakerHero } from '../AIMatchmakerHero';
import { EventCard } from '../EventCard';
import { ClubCard } from '../ClubCard';
import { ResourceCard } from '../ResourceCard';
import { Reveal } from '../Reveal';

type NavTab = 'events' | 'clubs' | 'resources' | 'map' | 'calendar';

interface ExploreViewProps {
  /** Events that have not ended, sorted by start time. */
  events: CampusEvent[];
  /** Every event, including ended ones, for the day chart. */
  allEvents: CampusEvent[];
  clubs: CampusClub[];
  resources: CampusResource[];
  userProfile: UserProfile;
  onSelectEvent: (event: CampusEvent) => void;
  onSelectClub: (club: CampusClub) => void;
  onSelectResource: (resource: CampusResource) => void;
  onToggleRsvp: (eventId: string) => void;
  onToggleJoinClub: (clubId: string) => void;
  onToggleSaveResource: (resourceId: string) => void;
  onOpenEventChat: (eventId: string) => void;
  onOpenClubChat: (clubId: string) => void;
  onSearchAI: (query: string) => void;
  isAiMatching: boolean;
  aiMatchResult: AIMatchResult | null;
  onClearMatchResult: () => void;
  onNavigateTab: (tab: NavTab) => void;
  onOpenVideoShowcase?: () => void;
}

const SectionHeader: React.FC<{ title: string; description: string; action: string; onAction: () => void }> = ({
  title,
  description,
  action,
  onAction,
}) => (
  <div className="flex items-end justify-between gap-4 mb-5">
    <div>
      <h2 className="font-display text-2xl font-semibold tracking-tight text-ink-900">{title}</h2>
      <p className="text-sm text-ink-600 mt-1">{description}</p>
    </div>
    <button
      onClick={onAction}
      className="cc-link text-sm font-medium text-brand-700 hover:text-brand-900 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
    >
      {action}
      <ChevronRight className="w-4 h-4" />
    </button>
  </div>
);

export const ExploreView: React.FC<ExploreViewProps> = ({
  events,
  allEvents,
  clubs,
  resources,
  userProfile,
  onSelectEvent,
  onSelectClub,
  onSelectResource,
  onToggleRsvp,
  onToggleJoinClub,
  onToggleSaveResource,
  onOpenEventChat,
  onOpenClubChat,
  onSearchAI,
  isAiMatching,
  aiMatchResult,
  onClearMatchResult,
  onNavigateTab,
  onOpenVideoShowcase,
}) => {
  // Soonest first, with popular events winning ties inside the next few hours.
  const featuredEvents = useMemo(() => {
    const soon = events.slice(0, 12);
    const popular = soon.filter((e) => e.isHot);
    const rest = soon.filter((e) => !e.isHot);
    return [...popular, ...rest].slice(0, 4).sort((a, b) => events.indexOf(a) - events.indexOf(b));
  }, [events]);

  const featuredClubs = clubs.slice(0, 3);
  const featuredResources = resources.slice(0, 3);

  return (
    <div className="pb-16">
      <AIMatchmakerHero
        events={events}
        todayEvents={allEvents}
        userName={userProfile.name}
        onSearchAI={onSearchAI}
        isLoading={isAiMatching}
        matchResult={aiMatchResult}
        onClearMatchResult={onClearMatchResult}
        onSelectEvent={onSelectEvent}
        onSelectClub={onSelectClub}
        onSelectResource={onSelectResource}
        onRsvpEvent={onToggleRsvp}
        rsvpdEvents={userProfile.rsvpdEvents}
        onViewAllEvents={() => onNavigateTab('events')}
        onOpenVideoShowcase={onOpenVideoShowcase}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-14">
        <section aria-labelledby="explore-events">
          <SectionHeader
            title="On now and up next"
            description="What you can walk into right now, then what starts next."
            action={`All ${events.length} events`}
            onAction={() => onNavigateTab('events')}
          />
          {featuredEvents.length === 0 ? (
            <p className="p-8 text-center rounded-2xl bg-white border border-ink-200 text-sm text-ink-600">
              No upcoming events right now. New ones appear here as soon as organizers publish them.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featuredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isRsvpd={userProfile.rsvpdEvents.includes(event.id)}
                  onRsvp={onToggleRsvp}
                  onOpenDetails={onSelectEvent}
                  onOpenChat={onOpenEventChat}
                />
              ))}
            </div>
          )}
        </section>

        <Reveal as="section">
          <SectionHeader
            title="Clubs to join"
            description="Find your people. Most clubs meet weekly."
            action={`All ${clubs.length} clubs`}
            onAction={() => onNavigateTab('clubs')}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {featuredClubs.map((club) => (
              <ClubCard
                key={club.id}
                club={club}
                isJoined={userProfile.joinedClubs.includes(club.id)}
                onToggleJoin={onToggleJoinClub}
                onOpenDetails={onSelectClub}
                onOpenChat={onOpenClubChat}
              />
            ))}
          </div>
        </Reveal>

        <Reveal as="section">
          <SectionHeader
            title="Help when you need it"
            description="Tutoring, wellness, makerspaces and career support."
            action={`All ${resources.length} services`}
            onAction={() => onNavigateTab('resources')}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {featuredResources.map((res) => (
              <ResourceCard
                key={res.id}
                resource={res}
                isSaved={userProfile.savedResources.includes(res.id)}
                onToggleSave={onToggleSaveResource}
                onOpenDetails={onSelectResource}
              />
            ))}
          </div>
        </Reveal>
      </div>
    </div>
  );
};
