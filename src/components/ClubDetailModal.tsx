import React from 'react';
import { X, Users, Calendar, MapPin, MessageSquare, CheckCircle2, ShieldCheck } from 'lucide-react';
import { CampusClub } from '../types';
import { handleImageFallback, FALLBACK_CLUB_IMAGE } from '../utils/imageUtils';

interface ClubDetailModalProps {
  club: CampusClub | null;
  isOpen: boolean;
  onClose: () => void;
  isJoined: boolean;
  onToggleJoin: (clubId: string) => void;
  onOpenChat: (clubId: string) => void;
}

export const ClubDetailModal: React.FC<ClubDetailModalProps> = ({
  club,
  isOpen,
  onClose,
  isJoined,
  onToggleJoin,
  onOpenChat,
}) => {
  if (!isOpen || !club) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden my-8 animate-in fade-in duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner */}
        <div className="relative h-52 w-full bg-slate-100">
          <img
            src={club.banner}
            alt={club.name}
            referrerPolicy="no-referrer"
            onError={(e) => handleImageFallback(e, FALLBACK_CLUB_IMAGE)}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-xs transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="absolute bottom-4 left-4 right-4">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-white text-slate-900 shadow-sm mb-1.5 inline-block">
              {club.category}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
              {club.name}
            </h2>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[calc(85vh-16rem)] overflow-y-auto text-slate-900">
          
          {/* Quick Schedule info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
              <Calendar className="w-4 h-4 text-slate-600 shrink-0" />
              <div>
                <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Regular Meetings</p>
                <p className="text-xs font-semibold text-slate-800">{club.meetingSchedule}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
              <MapPin className="w-4 h-4 text-slate-600 shrink-0" />
              <div>
                <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Meeting Room</p>
                <p className="text-xs font-semibold text-slate-800">{club.location}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">About This Organization</h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line font-normal">
              {club.description}
            </p>
          </div>

          {/* Perks */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Member Perks & Opportunities
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {club.perks.map((perk, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                >
                  {perk}
                </span>
              ))}
            </div>
          </div>

          {/* Leadership & Contact */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Student President:</span>
              <span className="font-semibold text-slate-800">{club.president}</span>
            </div>
            {club.facultyAdvisor && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Faculty Advisor:</span>
                <span className="font-semibold text-slate-800">{club.facultyAdvisor}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Contact Email:</span>
              <span className="font-medium text-slate-700">{club.contactEmail}</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              onClose();
              onOpenChat(club.id);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors"
          >
            <MessageSquare className="w-4 h-4 text-slate-600" />
            <span>Club Discussion Feed</span>
          </button>

          <button
            onClick={() => onToggleJoin(club.id)}
            className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              isJoined
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
            }`}
          >
            {isJoined ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>You’re a Member (Leave)</span>
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
