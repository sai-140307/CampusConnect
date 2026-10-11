import React from 'react';
import { Users, Calendar, MapPin, CheckCircle2, ShieldCheck, MessageSquare } from 'lucide-react';
import { CampusClub } from '../types';
import { handleImageFallback, FALLBACK_CLUB_IMAGE } from '../utils/imageUtils';

interface ClubCardProps {
  club: CampusClub;
  isJoined: boolean;
  onToggleJoin: (clubId: string) => void;
  onOpenDetails: (club: CampusClub) => void;
  onOpenChat: (clubId: string) => void;
}

export const ClubCard: React.FC<ClubCardProps> = ({
  club,
  isJoined,
  onToggleJoin,
  onOpenDetails,
  onOpenChat,
}) => {
  return (
    <div
      id={`club-card-${club.id}`}
      onClick={() => onOpenDetails(club)}
      className="cc-card group relative rounded-2xl bg-white border border-ink-200 flex flex-col justify-between overflow-hidden cursor-pointer"
    >
      {/* Banner */}
      <div className="cc-static relative h-36 w-full overflow-hidden bg-ink-100">
        <img
          src={club.banner}
          alt={club.name}
          referrerPolicy="no-referrer"
          onError={(e) => handleImageFallback(e, FALLBACK_CLUB_IMAGE)}
          className="w-full h-full object-cover cc-card-img"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-md text-2xs font-semibold bg-white text-ink-900 shadow-sm">
            {club.category}
          </span>
          {club.verifiedBadge && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/90 text-emerald-800 text-2xs font-semibold backdrop-blur-xs">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Verified
            </span>
          )}
        </div>

        <div className="absolute bottom-2 right-3 text-xs text-white flex items-center gap-1 font-medium">
          <Users className="w-3.5 h-3.5 text-ink-200" />
          <span>{club.membersCount} members</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-display text-base font-semibold text-ink-900 group-hover:text-ink-700 transition-colors line-clamp-1 mb-1">
            {club.name}
          </h3>
          <p className="text-xs text-ink-500 line-clamp-2 leading-relaxed mb-3">
            {club.shortDesc}
          </p>

          <div className="space-y-1.5 mb-3 text-xs font-medium">
            <div className="flex items-center gap-1.5 text-ink-700">
              <Calendar className="w-3.5 h-3.5 text-ink-400 shrink-0" />
              <span className="truncate">{club.meetingSchedule}</span>
            </div>
            <div className="flex items-center gap-1.5 text-ink-500">
              <MapPin className="w-3.5 h-3.5 text-ink-400 shrink-0" />
              <span className="truncate">{club.location}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 mb-3">
            {club.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md text-2xs font-medium bg-ink-100 text-ink-600 border border-ink-200"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-ink-100 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenChat(club.id);
            }}
            className="p-1.5 rounded-lg text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition-colors"
            title="Club Chat"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleJoin(club.id);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
              isJoined
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'cc-btn-brand'
            }`}
          >
            {isJoined ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Joined</span>
              </>
            ) : (
              <span>Join Club</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
