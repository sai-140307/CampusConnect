import React, { useEffect, useRef, useState } from 'react';
import { Search, ArrowRight, Calendar, Loader2, X, Users, Building2, Play, CheckCircle2 } from 'lucide-react';
import { QUICK_PROMPTS } from '../data/mockData';
import { AIMatchResult, CampusEvent, CampusClub, CampusResource } from '../types';
import { formatEventWhen } from '../utils/campusTime';
import { useNow } from '../hooks/useNow';
import { CampusNowPanel } from './CampusNowPanel';

interface AIMatchmakerHeroProps {
  /** Events that have not ended, sorted by start time. */
  events: CampusEvent[];
  todayEvents?: CampusEvent[];
  userName?: string;
  onSearchAI: (query: string) => void;
  isLoading: boolean;
  matchResult: AIMatchResult | null;
  onClearMatchResult: () => void;
  onSelectEvent: (event: CampusEvent) => void;
  onSelectClub: (club: CampusClub) => void;
  onSelectResource: (resource: CampusResource) => void;
  onRsvpEvent: (eventId: string) => void;
  rsvpdEvents: string[];
  onViewAllEvents: () => void;
  onOpenVideoShowcase?: () => void;
}

export const AIMatchmakerHero: React.FC<AIMatchmakerHeroProps> = ({
  events,
  todayEvents,
  userName,
  onSearchAI,
  isLoading,
  matchResult,
  onClearMatchResult,
  onSelectEvent,
  onSelectClub,
  onSelectResource,
  onRsvpEvent,
  rsvpdEvents,
  onViewAllEvents,
  onOpenVideoShowcase,
}) => {
  const now = useNow();
  const [query, setQuery] = useState('');
  const resultsRef = useRef<HTMLDivElement>(null);

  // Bring new results into view; they sit below the fold on most screens.
  useEffect(() => {
    if (!matchResult || !resultsRef.current) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    resultsRef.current.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }, [matchResult]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) onSearchAI(query.trim());
  };

  const handlePromptClick = (text: string) => {
    if (isLoading) return;
    setQuery(text);
    onSearchAI(text);
  };

  const firstName = (userName || '').trim().split(/\s+/)[0];
  const noMatches =
    matchResult &&
    matchResult.matchedEvents.length + matchResult.matchedClubs.length + matchResult.matchedResources.length === 0;

  return (
    <section className="cc-hero relative overflow-hidden border-b border-ink-200">
      <div className="cc-hero-glow" aria-hidden="true" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7 min-w-0 cc-hero-copy">
            <p className="text-sm font-medium text-brand-700">
              {firstName && firstName !== 'Student' ? `Hi ${firstName}, welcome back.` : 'Vellore Institute of Technology'}
            </p>
            <h1 className="font-display mt-3 text-[2.1rem] sm:text-5xl lg:text-6xl font-semibold tracking-tight text-ink-950 leading-[1.05]">
              Everything on campus, timed to the minute.
            </h1>
            <p className="mt-4 text-base text-ink-600 leading-relaxed max-w-xl">
              Events, clubs and student services in one place. Say what you are in the mood for and get matches from
              what is on today.
            </p>

            <form onSubmit={handleSubmit} className="mt-7 max-w-xl" role="search">
              <label htmlFor="ai-query-input" className="sr-only">
                Describe what you are looking for
              </label>
              <div className="cc-search relative flex items-center bg-white border border-ink-300 rounded-2xl p-1.5 shadow-sm">
                <Search className="w-5 h-5 text-ink-400 ml-3 mr-2 shrink-0" />
                <input
                  id="ai-query-input"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Free food and new people tonight"
                  autoComplete="off"
                  className="w-full min-w-0 bg-transparent text-ink-900 placeholder-ink-400 text-base focus:outline-none px-1 py-2"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      onClearMatchResult();
                    }}
                    className="p-2 text-ink-400 hover:text-ink-700 rounded-lg mr-1 transition-colors cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  id="btn-submit-ai-search"
                  type="submit"
                  disabled={isLoading || !query.trim()}
                  className="cc-btn-brand cc-press px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="hidden sm:inline">Matching</span>
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Find matches</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {!matchResult && (
              <div className="mt-4 flex items-center gap-2 flex-wrap max-w-xl">
                {QUICK_PROMPTS.slice(0, 4).map((p) => (
                  <button
                    key={p.text}
                    type="button"
                    disabled={isLoading}
                    onClick={() => handlePromptClick(p.text)}
                    className="cc-chip px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-ink-200 text-ink-700 hover:border-brand-400 hover:text-brand-800 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span aria-hidden="true">{p.icon}</span>
                    <span>{p.text}</span>
                  </button>
                ))}
              </div>
            )}

            {onOpenVideoShowcase && !matchResult && (
              <button
                type="button"
                onClick={onOpenVideoShowcase}
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-ink-700 hover:text-brand-700 transition-colors cursor-pointer"
              >
                <span className="cc-btn-ink w-8 h-8 rounded-full flex items-center justify-center">
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </span>
                Take the 2-minute campus tour
              </button>
            )}
          </div>

          <div className="lg:col-span-5 min-w-0 cc-hero-panel cc-static">
            <CampusNowPanel events={events} todayEvents={todayEvents} onSelectEvent={onSelectEvent} onViewAll={onViewAllEvents} />
          </div>
        </div>

        {matchResult && (
          <div ref={resultsRef} className="cc-results mt-10 pt-8 border-t border-ink-200 scroll-mt-24" aria-live="polite">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="max-w-2xl">
                <h2 className="font-display text-xl font-semibold text-ink-900">Matches for “{matchResult.query}”</h2>
                <p className="text-sm text-ink-600 mt-1">{matchResult.summary}</p>
              </div>
              <button
                onClick={() => {
                  setQuery('');
                  onClearMatchResult();
                }}
                className="text-sm font-medium text-ink-600 hover:text-ink-900 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-ink-100 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            </div>

            {noMatches && (
              <p className="text-sm text-ink-600">Nothing matched. Try fewer or different words, like “hackathon” or “tutoring”.</p>
            )}

            {matchResult.matchedEvents.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-ink-700 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-ink-400" />
                  Events
                </h3>
                <div className="cc-stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {matchResult.matchedEvents.map(({ event, matchScore, reason }) => {
                    const going = rsvpdEvents.includes(event.id);
                    return (
                      <div
                        key={event.id}
                        onClick={() => onSelectEvent(event)}
                        className="cc-card p-4 rounded-2xl border border-ink-200 bg-white cursor-pointer flex flex-col"
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-800 tabular-nums">
                            {matchScore}% match
                          </span>
                          <span className="text-2xs text-ink-500 truncate">{event.category}</span>
                        </div>
                        <h4 className="font-display font-semibold text-ink-900 text-sm leading-snug line-clamp-2">{event.title}</h4>
                        <p className="text-xs text-ink-700 mt-1.5 tabular-nums">{formatEventWhen(event, now)}</p>
                        <p className="text-xs text-ink-500 mt-0.5 truncate">{event.building}</p>
                        <p className="text-xs text-ink-600 mt-2 line-clamp-2 leading-relaxed">{reason}</p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRsvpEvent(event.id);
                          }}
                          aria-pressed={going}
                          className={`cc-press mt-3 self-start px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                            going ? 'bg-emerald-600 text-white' : 'cc-btn-brand'
                          }`}
                        >
                          {going && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {going ? 'Going' : 'RSVP'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {matchResult.matchedClubs.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-ink-700 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-ink-400" />
                    Clubs
                  </h3>
                  <div className="space-y-2">
                    {matchResult.matchedClubs.map(({ club, reason }) => (
                      <button
                        key={club.id}
                        type="button"
                        onClick={() => onSelectClub(club)}
                        className="cc-card w-full text-left p-3.5 rounded-xl border border-ink-200 bg-white cursor-pointer"
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-ink-900 text-sm truncate">{club.name}</span>
                          <span className="text-2xs text-ink-500 shrink-0 tabular-nums">
                            {club.membersCount.toLocaleString('en-IN')} members
                          </span>
                        </span>
                        <span className="block text-xs text-ink-600 mt-1 line-clamp-2">{reason}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {matchResult.matchedResources.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-ink-700 mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-ink-400" />
                    Campus services
                  </h3>
                  <div className="space-y-2">
                    {matchResult.matchedResources.map(({ resource, reason }) => (
                      <button
                        key={resource.id}
                        type="button"
                        onClick={() => onSelectResource(resource)}
                        className="cc-card w-full text-left p-3.5 rounded-xl border border-ink-200 bg-white cursor-pointer"
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-ink-900 text-sm truncate">{resource.name}</span>
                          <span className="text-2xs text-ink-500 shrink-0">{resource.openHours}</span>
                        </span>
                        <span className="block text-xs text-ink-600 mt-1 line-clamp-2">{reason}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
