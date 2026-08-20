import React, { useState, useMemo } from 'react';
import { Search, Users, X } from 'lucide-react';
import { CampusClub, EventCategory } from '../../types';
import { ClubCard } from '../ClubCard';

interface ClubsViewProps {
  clubs: CampusClub[];
  userProfile: any;
  onSelectClub: (club: CampusClub) => void;
  onToggleJoinClub: (clubId: string) => void;
  onOpenChat: (clubId: string, type: 'club', title: string) => void;
}

const CLUB_CATEGORIES = [
  'All',
  'Tech & Hackathons',
  'Academic & STEM',
  'Free Food & Social',
  'Arts, Music & Culture',
  'Health & Wellness',
  'Sports & Outdoors',
];

export const ClubsView: React.FC<ClubsViewProps> = ({
  clubs = [],
  userProfile,
  onSelectClub,
  onToggleJoinClub,
  onOpenChat,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredClubs = useMemo(() => {
    return (clubs || []).filter((cl) => {
      if (!cl) return false;
      if (selectedCategory !== 'All' && cl.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (cl.name || '').toLowerCase().includes(q);
        const matchDesc = (cl.description || '').toLowerCase().includes(q);
        const matchTag = (cl.tags || []).some((t) => (t || '').toLowerCase().includes(q));
        if (!matchName && !matchDesc && !matchTag) return false;
      }
      return true;
    });
  }, [clubs, selectedCategory, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Student Organizations & Clubs
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Explore registered student clubs, competitive engineering teams, professional fraternities, and hobby circles.
        </p>
      </div>

      {/* Search & Category Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search clubs by name, topic, or tags (e.g., AI, Robotics, Hiking)..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          {CLUB_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Clubs Count */}
      <div className="text-xs text-slate-500 px-1">
        Showing <strong className="text-slate-900 font-semibold">{filteredClubs.length}</strong> active clubs
      </div>

      {/* Clubs Grid */}
      {filteredClubs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-slate-200">
          <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No clubs found</h3>
          <p className="text-xs text-slate-500 mt-1">Try another search keyword or category filter.</p>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSearchQuery('');
            }}
            className="mt-4 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 text-white"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClubs.map((club) => (
            <ClubCard
              key={club.id}
              club={club}
              isJoined={userProfile.joinedClubs.includes(club.id)}
              onToggleJoin={onToggleJoinClub}
              onOpenDetails={onSelectClub}
              onOpenChat={(id) => onOpenChat(id, 'club', club.name)}
            />
          ))}
        </div>
      )}

    </div>
  );
};
