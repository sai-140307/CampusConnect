import React, { useState } from 'react';
import { useModal } from '../hooks/useModal';
import { formatEventWhen } from '../utils/campusTime';
import { OpenStatusBadge } from './OpenStatusBadge';
import { 
  X, 
  User, 
  CheckCircle2, 
  Calendar, 
  Users, 
  Bookmark, 
  Building2,
  Trash2
} from 'lucide-react';
import { UserProfile, PerkType, CampusEvent, CampusClub, CampusResource } from '../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  allEvents: CampusEvent[];
  allClubs: CampusClub[];
  allResources: CampusResource[];
  onSelectEvent: (event: CampusEvent) => void;
  onSelectClub: (club: CampusClub) => void;
  onSelectResource: (resource: CampusResource) => void;
  onRemoveRsvp: (eventId: string) => void;
  onRemoveClub: (clubId: string) => void;
  onRemoveResource: (resId: string) => void;
}

const ALL_INTEREST_TAGS = [
  'Artificial Intelligence',
  'Free Food',
  'Hackathons',
  'Robotics',
  'Consulting',
  'Design & UX',
  'Mental Health',
  'Intramural Sports',
  'Career Prep',
  'Live Music',
];

const ALL_PERKS: PerkType[] = [
  'Free Food 🍕',
  'Free Swag 👕',
  'Resume Drop 💼',
  'Free Coffee ☕',
  'Pet Therapy 🐶',
  'Networking 🤝',
  'Live Music / DJ 🎵',
  'Hardware / 3D Print 🛠️',
  'Certificates 📜',
  'Tutors On-Duty 📚',
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdateProfile,
  allEvents,
  allClubs,
  allResources,
  onSelectEvent,
  onSelectClub,
  onSelectResource,
  onRemoveRsvp,
  onRemoveClub,
  onRemoveResource,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'rsvps' | 'clubs' | 'saved'>('profile');
  
  const [name, setName] = useState(userProfile.name);
  const [major, setMajor] = useState(userProfile.major);
  const [year, setYear] = useState(userProfile.year);
  const [campusZone, setCampusZone] = useState(userProfile.campusZone);
  const [interests, setInterests] = useState<string[]>(userProfile?.interests || []);
  const [preferredPerks, setPreferredPerks] = useState<PerkType[]>(userProfile?.preferredPerks || []);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  useModal(isOpen, onClose);

  if (!isOpen) return null;

  const toggleInterest = (interest: string) => {
    if ((interests || []).includes(interest)) {
      setInterests((interests || []).filter((i) => i !== interest));
    } else {
      setInterests([...(interests || []), interest]);
    }
  };

  const togglePerk = (perk: PerkType) => {
    if ((preferredPerks || []).includes(perk)) {
      setPreferredPerks((preferredPerks || []).filter((p) => p !== perk));
    } else {
      setPreferredPerks([...(preferredPerks || []), perk]);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name,
      major,
      year,
      campusZone,
      interests,
      preferredPerks,
    });
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 1500);
  };

  const rsvpdEventsList = (allEvents || []).filter((e) => (userProfile?.rsvpdEvents || []).includes(e.id));
  const joinedClubsList = (allClubs || []).filter((c) => (userProfile?.joinedClubs || []).includes(c.id));
  const savedResourcesList = (allResources || []).filter((r) => (userProfile?.savedResources || []).includes(r.id));

  return (
    <div className="cc-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-xs overflow-y-auto" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div 
        className="cc-dialog relative w-full max-w-2xl bg-white border border-ink-200 rounded-2xl shadow-xl overflow-hidden my-8 text-ink-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-ink-50 border-b border-ink-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="cc-btn-ink w-12 h-12 rounded-xl font-bold text-lg flex items-center justify-center shadow-xs">
              {userProfile.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-ink-900">{userProfile.name}</h2>
              <p className="text-xs text-ink-500 font-medium">{userProfile.major} • {userProfile.year}</p>
              <p className="text-xs text-ink-400 font-medium">Vellore Institute of Technology</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white border border-ink-200 hover:bg-ink-100 text-ink-600 hover:text-ink-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Header */}
        <div className="flex border-b border-ink-200 px-6 bg-white gap-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-ink-900 text-ink-900'
                : 'border-transparent text-ink-500 hover:text-ink-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile & Preferences</span>
          </button>

          <button
            onClick={() => setActiveTab('rsvps')}
            className={`py-3 px-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'rsvps'
                ? 'border-ink-900 text-ink-900'
                : 'border-transparent text-ink-500 hover:text-ink-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>RSVPs ({rsvpdEventsList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('clubs')}
            className={`py-3 px-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'clubs'
                ? 'border-ink-900 text-ink-900'
                : 'border-transparent text-ink-500 hover:text-ink-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Clubs ({joinedClubsList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`py-3 px-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'saved'
                ? 'border-ink-900 text-ink-900'
                : 'border-transparent text-ink-500 hover:text-ink-800'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Saved ({savedResourcesList.length})</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 max-h-[calc(85vh-14rem)] overflow-y-auto">
          
          {/* TAB 1: EDIT PREFERENCES */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-ink-700">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-ink-50 border border-ink-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-ink-900 focus:outline-none focus:border-ink-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-ink-700">Academic Major</label>
                  <input
                    type="text"
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    className="w-full bg-ink-50 border border-ink-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-ink-900 focus:outline-none focus:border-ink-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-ink-700">Academic Standing</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value as any)}
                    className="w-full bg-ink-50 border border-ink-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-ink-900 focus:outline-none focus:border-ink-800"
                  >
                    <option value="Freshman">Freshman</option>
                    <option value="Sophomore">Sophomore</option>
                    <option value="Junior">Junior</option>
                    <option value="Senior">Senior</option>
                    <option value="Graduate">Graduate</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-ink-700">Primary Campus Zone</label>
                  <select
                    value={campusZone}
                    onChange={(e) => setCampusZone(e.target.value)}
                    className="w-full bg-ink-50 border border-ink-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-ink-900 focus:outline-none focus:border-ink-800"
                  >
                    <option value="Central Hub">Central Hub</option>
                    <option value="West Tech Park">West Tech Park</option>
                    <option value="North Campus">North Campus</option>
                    <option value="South Quad">South Quad</option>
                  </select>
                </div>
              </div>

              {/* Interests */}
              <div>
                <label className="text-xs font-semibold text-ink-700 block mb-1.5">
                  Academic & Extracurricular Interests (Powers AI Matchmaking)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_INTEREST_TAGS.map((tag) => {
                    const isSelected = interests.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleInterest(tag)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                          isSelected
                            ? 'cc-btn-ink'
                            : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preferred Perks */}
              <div>
                <label className="text-xs font-semibold text-ink-700 block mb-1.5">
                  Preferred Perks & Incentives
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_PERKS.map((perk) => {
                    const isSelected = preferredPerks.includes(perk);
                    return (
                      <button
                        key={perk}
                        type="button"
                        onClick={() => togglePerk(perk)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                          isSelected
                            ? 'cc-btn-ink'
                            : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
                        }`}
                      >
                        {perk}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-ink-100 flex items-center justify-between">
                {isSavedNotice ? (
                  <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Preferences Updated
                  </span>
                ) : <span />}
                <button
                  type="submit"
                  className="cc-btn-ink px-5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all"
                >
                  Save Profile
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: RSVPS */}
          {activeTab === 'rsvps' && (
            <div className="space-y-2">
              {rsvpdEventsList.length === 0 ? (
                <p className="text-xs text-ink-400 text-center py-8">No active RSVPs found.</p>
              ) : (
                rsvpdEventsList.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 rounded-xl bg-ink-50 border border-ink-200 flex items-center justify-between gap-3"
                  >
                    <div 
                      onClick={() => {
                        onClose();
                        onSelectEvent(ev);
                      }}
                      className="cursor-pointer truncate"
                    >
                      <h4 className="text-xs font-bold text-ink-900 hover:text-ink-700 truncate">{ev.title}</h4>
                      <p className="text-xs text-ink-500">{formatEventWhen(ev)} • {ev.building}</p>
                    </div>
                    <button
                      onClick={() => onRemoveRsvp(ev.id)}
                      className="p-1.5 rounded-lg text-ink-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Cancel RSVP"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: CLUBS */}
          {activeTab === 'clubs' && (
            <div className="space-y-2">
              {joinedClubsList.length === 0 ? (
                <p className="text-xs text-ink-400 text-center py-8">No joined clubs found.</p>
              ) : (
                joinedClubsList.map((cl) => (
                  <div
                    key={cl.id}
                    className="p-3 rounded-xl bg-ink-50 border border-ink-200 flex items-center justify-between gap-3"
                  >
                    <div 
                      onClick={() => {
                        onClose();
                        onSelectClub(cl);
                      }}
                      className="cursor-pointer truncate"
                    >
                      <h4 className="text-xs font-bold text-ink-900 hover:text-ink-700 truncate">{cl.name}</h4>
                      <p className="text-xs text-ink-500">{cl.meetingSchedule} • {cl.location}</p>
                    </div>
                    <button
                      onClick={() => onRemoveClub(cl.id)}
                      className="p-1.5 rounded-lg text-ink-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Leave Club"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: SAVED RESOURCES */}
          {activeTab === 'saved' && (
            <div className="space-y-2">
              {savedResourcesList.length === 0 ? (
                <p className="text-xs text-ink-400 text-center py-8">No saved resources found.</p>
              ) : (
                savedResourcesList.map((res) => (
                  <div
                    key={res.id}
                    className="p-3 rounded-xl bg-ink-50 border border-ink-200 flex items-center justify-between gap-3"
                  >
                    <div 
                      onClick={() => {
                        onClose();
                        onSelectResource(res);
                      }}
                      className="cursor-pointer truncate"
                    >
                      <h4 className="text-xs font-bold text-ink-900 hover:text-ink-700 truncate">{res.name}</h4>
                      <p className="text-xs text-ink-500"><OpenStatusBadge openHours={res.openHours} plain /> • {res.location}</p>
                    </div>
                    <button
                      onClick={() => onRemoveResource(res.id)}
                      className="p-1.5 rounded-lg text-ink-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Remove Bookmark"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
