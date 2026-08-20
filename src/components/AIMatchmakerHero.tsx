import React, { useState } from 'react';
import { 
  Search, 
  ArrowRight, 
  MapPin, 
  Calendar, 
  Loader2, 
  X,
  Sparkles,
  Users,
  Building2,
  Check,
  Play,
  Video,
  Film
} from 'lucide-react';
import { QUICK_PROMPTS } from '../data/mockData';
import { AIMatchResult, CampusEvent, CampusClub, CampusResource } from '../types';

interface AIMatchmakerHeroProps {
  onSearchAI: (query: string) => void;
  isLoading: boolean;
  matchResult: AIMatchResult | null;
  onClearMatchResult: () => void;
  onSelectEvent: (event: CampusEvent) => void;
  onSelectClub: (club: CampusClub) => void;
  onSelectResource: (resource: CampusResource) => void;
  onRsvpEvent: (eventId: string) => void;
  rsvpdEvents: string[];
  onNavigateTab?: (tab: string) => void;
  onOpenVideoShowcase?: () => void;
}

export const AIMatchmakerHero: React.FC<AIMatchmakerHeroProps> = ({
  onSearchAI,
  isLoading,
  matchResult,
  onClearMatchResult,
  onSelectEvent,
  onSelectClub,
  onSelectResource,
  onRsvpEvent,
  rsvpdEvents,
  onNavigateTab,
  onOpenVideoShowcase,
}) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearchAI(query.trim());
    }
  };

  const handlePromptClick = (text: string) => {
    setQuery(text);
    onSearchAI(text);
  };

  return (
    <section className="bg-white border-b border-slate-200/80 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative ambient background accents */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-100/30 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto">
        
        {/* Header Title */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-slate-700 text-xs font-medium shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Vellore Institute of Technology</span>
              <span className="text-slate-300">•</span>
              <span className="font-semibold text-slate-900">CampusConnect</span>
            </div>

            {onOpenVideoShowcase && (
              <button
                type="button"
                onClick={onOpenVideoShowcase}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 hover:bg-orange-100 border border-orange-200/80 text-orange-900 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              >
                <Play className="w-3 h-3 fill-current text-orange-600" />
                <span>Watch Campus & Project Tour</span>
              </button>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
            Discover your campus community.
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 font-normal leading-relaxed">
            Search events, student clubs, and support resources across VIT in one unified directory. Describe what you're looking for or pick a topic below.
          </p>
        </div>

        {/* Minimal Search Bar */}
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-4">
          <div className="relative flex items-center bg-white border border-slate-300 rounded-xl p-1 shadow-2xs focus-within:border-slate-800 focus-within:ring-2 focus-within:ring-slate-900/5 transition-all">
            <div className="pl-3 pr-2 text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              id="ai-query-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. 'I want free food and to meet people' or 'CS tutoring tonight'"
              className="w-full bg-transparent text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none px-1"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  onClearMatchResult();
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md mr-1 transition-colors"
                aria-label="Clear query"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              id="btn-submit-ai-search"
              type="submit"
              disabled={isLoading || !query.trim()}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <span>Search</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Quick Suggestion Chips */}
        {!matchResult && (
          <div className="flex items-center justify-center gap-1.5 flex-wrap max-w-2xl mx-auto pt-1">
            <span className="text-[11px] text-slate-400 mr-1 font-medium">Try:</span>
            {QUICK_PROMPTS.slice(0, 4).map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePromptClick(p.text)}
                className="px-2.5 py-1 rounded-full text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>{p.icon}</span>
                <span className="truncate max-w-[180px] sm:max-w-none">{p.text}</span>
              </button>
            ))}
          </div>
        )}

        {/* Search & Recommendation Results View */}
        {matchResult && (
          <div className="mt-8 pt-6 border-t border-slate-100 animate-in fade-in duration-200">
            <div className="flex items-center justify-between gap-4 mb-4 pb-2 border-b border-slate-100">
              <div>
                <span className="text-xs font-semibold text-slate-900">
                  Matches for "{matchResult.query}"
                </span>
                <p className="text-[11px] text-slate-500">
                  {matchResult.summary}
                </p>
              </div>
              <button
                onClick={onClearMatchResult}
                className="text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>

            {/* Matched Events */}
            {matchResult.matchedEvents.length > 0 && (
              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-600" />
                  <span>Matching Events ({matchResult.matchedEvents.length})</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {matchResult.matchedEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => onSelectEvent(event)}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-2xs transition-all bg-white cursor-pointer group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {event.category}
                          </span>
                          <span className="text-[10px] text-slate-400">{event.displayTime}</span>
                        </div>
                        <h5 className="font-bold text-slate-900 text-sm group-hover:text-slate-700 transition-colors line-clamp-1">
                          {event.title}
                        </h5>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                          {event.shortDesc}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-xs">
                        <span className="text-slate-500 text-[11px] truncate max-w-[140px]">
                          {event.building}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRsvpEvent(event.id);
                          }}
                          className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                            rsvpdEvents.includes(event.id)
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-slate-900 text-white hover:bg-slate-800'
                          }`}
                        >
                          {rsvpdEvents.includes(event.id) ? 'RSVP’d ✓' : 'RSVP'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Matched Clubs */}
            {matchResult.matchedClubs.length > 0 && (
              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-600" />
                  <span>Matching Student Clubs ({matchResult.matchedClubs.length})</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {matchResult.matchedClubs.map((club) => (
                    <div
                      key={club.id}
                      onClick={() => onSelectClub(club)}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-2xs transition-all bg-white cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {club.category}
                        </span>
                        <span className="text-[10px] text-slate-400">{club.membersCount} members</span>
                      </div>
                      <h5 className="font-bold text-slate-900 text-sm group-hover:text-slate-700 transition-colors line-clamp-1">
                        {club.name}
                      </h5>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {club.shortDesc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Matched Resources */}
            {matchResult.matchedResources.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-600" />
                  <span>Campus Resources & Facilities ({matchResult.matchedResources.length})</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {matchResult.matchedResources.map((res) => (
                    <div
                      key={res.id}
                      onClick={() => onSelectResource(res)}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-2xs transition-all bg-white cursor-pointer group"
                    >
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {res.category}
                      </span>
                      <h5 className="font-bold text-slate-900 text-sm group-hover:text-slate-700 transition-colors line-clamp-1 mt-1.5">
                        {res.title}
                      </h5>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {res.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
