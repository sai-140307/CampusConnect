import React, { useState } from 'react';
import { Clock, MapPin, Flame, MessageSquare, CheckCircle2, Share2, ShieldCheck, Utensils, Check } from 'lucide-react';
import { CampusEvent } from '../types';
import { handleImageFallback, FALLBACK_EVENT_IMAGE } from '../utils/imageUtils';
import { formatEventStatus, formatEventWhen, getEventPhase, isEventToday } from '../utils/campusTime';
import { useNow } from '../hooks/useNow';

interface EventCardProps {
  event: CampusEvent;
  isRsvpd: boolean;
  onRsvp: (eventId: string) => void;
  onOpenDetails: (event: CampusEvent) => void;
  onOpenChat: (eventId: string) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, isRsvpd, onRsvp, onOpenDetails, onOpenChat }) => {
  const now = useNow();
  const [copied, setCopied] = useState(false);

  const phase = getEventPhase(event, now);
  const isFull = event.rsvpCount >= event.capacity;
  const percentFull = Math.min(100, Math.round((event.rsvpCount / Math.max(1, event.capacity)) * 100));
  const when = formatEventWhen(event, now);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `${event.title}: ${when}, ${event.building} (${event.room})`;
    try {
      if (navigator.share) {
        await navigator.share({ title: event.title, text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Share sheet dismissed or clipboard blocked: nothing to do.
    }
  };

  return (
    <article
      id={`event-card-${event.id}`}
      tabIndex={0}
      role="button"
      aria-label={`${event.title}, ${when}`}
      onClick={() => onOpenDetails(event)}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onOpenDetails(event);
        }
      }}
      className={`cc-card group relative h-full rounded-2xl bg-white border border-ink-200 flex flex-col overflow-hidden cursor-pointer ${
        phase === 'ended' ? 'opacity-75' : ''
      }`}
    >
      <div className="cc-static relative h-40 w-full overflow-hidden bg-ink-100">
        <img
          src={event.image}
          alt=""
          referrerPolicy="no-referrer"
          onError={(e) => handleImageFallback(e, FALLBACK_EVENT_IMAGE)}
          className="cc-card-img w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-black/25" />

        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {phase === 'live' && (
              <span className="cc-live-badge flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-600 text-white text-2xs font-semibold shadow-sm">
                <span className="cc-live-dot" />
                Live now
              </span>
            )}
            {phase === 'upcoming' && isEventToday(event, now) && (
              <span className="px-2.5 py-1 rounded-full bg-amber-400 text-amber-950 text-2xs font-semibold shadow-sm">
                Today
              </span>
            )}
            {phase === 'ended' && (
              <span className="px-2.5 py-1 rounded-full bg-black/60 text-white text-2xs font-semibold backdrop-blur-xs">
                Ended
              </span>
            )}
            {event.isHot && phase !== 'ended' && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/55 text-white text-2xs font-semibold backdrop-blur-xs">
                <Flame className="w-3 h-3 text-amber-300" />
                Popular
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleShare}
            className="p-2 rounded-full bg-black/45 hover:bg-black/70 text-white backdrop-blur-xs transition-colors cursor-pointer"
            aria-label={copied ? 'Copied to clipboard' : `Share ${event.title}`}
            title={copied ? 'Copied' : 'Share'}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between gap-2 text-white">
          <span className="font-medium truncate text-xs drop-shadow-xs flex items-center gap-1">
            {event.facultyApproved && <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0" aria-label="Verified organizer" />}
            <span className="truncate">{event.organizer}</span>
          </span>
          <span className="text-2xs font-medium px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-xs shrink-0">
            {event.category}
          </span>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-display text-base font-semibold text-ink-900 leading-snug line-clamp-2 mb-2">
          {event.title}
        </h3>

        <div className="space-y-1 text-xs text-ink-600 mb-3">
          <p className="flex items-center gap-1.5 font-medium text-ink-800">
            <Clock className="w-3.5 h-3.5 text-ink-400 shrink-0" />
            <span className="tabular-nums">{when}</span>
          </p>
          <p className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-ink-400 shrink-0" />
            <span className="truncate">
              {event.building}, {event.room}
            </span>
          </p>
        </div>

        <p className="text-xs text-ink-500 line-clamp-2 leading-relaxed mb-3">{event.shortDesc}</p>

        {event.foodDetails ? (
          <div className="px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200/80 text-xs text-amber-900 flex items-center gap-1.5 mb-3">
            <Utensils className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="truncate">{event.foodDetails}</span>
          </div>
        ) : (
          event.perks.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {event.perks.slice(0, 3).map((perk) => (
                <span key={perk} className="px-2 py-0.5 rounded-md text-2xs font-medium bg-ink-100 text-ink-700">
                  {perk}
                </span>
              ))}
            </div>
          )
        )}

        <div className="mt-auto pt-3 border-t border-ink-100">
          <div className="flex items-center justify-between gap-2 text-2xs text-ink-500 mb-1.5">
            <span className={`font-medium tabular-nums ${phase === 'live' ? 'text-rose-600' : 'text-ink-600'}`}>
              {formatEventStatus(event, now)}
            </span>
            <span className="tabular-nums">
              {event.rsvpCount.toLocaleString('en-IN')} of {event.capacity.toLocaleString('en-IN')} going
            </span>
          </div>
          <div className="h-1 rounded-full bg-ink-100 overflow-hidden mb-3" aria-hidden="true">
            <div
              className={`cc-meter h-full rounded-full ${percentFull >= 90 ? 'bg-rose-500' : 'bg-brand-500'}`}
              style={{ width: `${percentFull}%` }}
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenChat(event.id);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium text-ink-600 hover:text-ink-900 hover:bg-ink-100 transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Discuss
            </button>

            <button
              type="button"
              id={`btn-rsvp-${event.id}`}
              disabled={!isRsvpd && (phase === 'ended' || isFull)}
              onClick={(e) => {
                e.stopPropagation();
                onRsvp(event.id);
              }}
              aria-pressed={isRsvpd}
              className={`cc-press px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                isRsvpd ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'cc-btn-brand'
              }`}
            >
              {isRsvpd ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Going
                </>
              ) : phase === 'ended' ? (
                'Ended'
              ) : isFull ? (
                'Full'
              ) : (
                'RSVP'
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
