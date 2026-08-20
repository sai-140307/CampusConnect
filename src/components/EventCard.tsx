import React from 'react';
import { 
  Clock, 
  MapPin, 
  Flame, 
  MessageSquare, 
  CheckCircle2, 
  Share2, 
  ShieldCheck, 
  Utensils
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CampusEvent } from '../types';
import { handleImageFallback, FALLBACK_EVENT_IMAGE } from '../utils/imageUtils';

interface EventCardProps {
  event: CampusEvent;
  isRsvpd: boolean;
  onRsvp: (eventId: string) => void;
  onOpenDetails: (event: CampusEvent) => void;
  onOpenChat: (eventId: string) => void;
  onShare: (event: CampusEvent) => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  isRsvpd,
  onRsvp,
  onOpenDetails,
  onOpenChat,
  onShare,
}) => {
  const handleRsvpClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isRsvpd) {
      confetti({
        particleCount: 35,
        spread: 50,
        origin: { y: 0.8 },
      });
    }
    onRsvp(event.id);
  };

  const percentFull = Math.min(100, Math.round((event.rsvpCount / event.capacity) * 100));

  return (
    <div 
      id={`event-card-${event.id}`}
      onClick={() => onOpenDetails(event)}
      className="group relative rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer"
    >
      {/* Image Banner */}
      <div className="relative h-44 w-full overflow-hidden bg-slate-100">
        <img
          src={event.image}
          alt={event.title}
          referrerPolicy="no-referrer"
          onError={(e) => handleImageFallback(e, FALLBACK_EVENT_IMAGE)}
          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
          <div className="flex items-center gap-1.5 flex-wrap">
            {event.isHot && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                <Flame className="w-3 h-3" />
                Hot
              </span>
            )}
            {event.isToday && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-bold uppercase tracking-wider shadow-sm">
                Today
              </span>
            )}
            {event.facultyApproved && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/90 text-slate-800 text-[10px] font-semibold backdrop-blur-xs">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Verified
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onShare(event);
            }}
            className="pointer-events-auto p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-xs transition-colors"
            title="Share Event"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Bottom Banner Info */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs text-white">
          <span className="font-semibold text-white truncate pr-2 text-xs drop-shadow-xs">{event.organizer}</span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-black/50 backdrop-blur-xs text-slate-100 shrink-0">
            {event.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Time & Location */}
          <div className="flex items-center gap-2.5 text-xs text-slate-500 font-medium mb-1.5 flex-wrap">
            <span className="flex items-center gap-1 text-slate-700 font-semibold">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {event.displayTime}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 truncate text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {event.building} ({event.room})
            </span>
          </div>

          {/* Title */}
          <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-slate-700 transition-colors line-clamp-1 mb-1">
            {event.title}
          </h3>

          {/* Short Description */}
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
            {event.shortDesc}
          </p>

          {/* Perks */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {event.perks.map((perk, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
              >
                {perk}
              </span>
            ))}
          </div>

          {/* Food Details if present */}
          {event.foodDetails && (
            <div className="p-2 rounded-lg bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900 flex items-center gap-1.5 mb-3 font-normal">
              <Utensils className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="truncate">{event.foodDetails}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          
          {/* Attendees */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="font-semibold text-slate-800">{event.rsvpCount}</span>/{event.capacity} registered
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenChat(event.id);
              }}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Open Chat"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              id={`btn-rsvp-${event.id}`}
              onClick={handleRsvpClick}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                isRsvpd
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              {isRsvpd ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>RSVP’d</span>
                </>
              ) : (
                <span>RSVP</span>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
