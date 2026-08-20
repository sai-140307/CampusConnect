import React, { useState, useMemo } from 'react';
import { Search, Building2, X } from 'lucide-react';
import { CampusResource, ResourceCategory } from '../../types';
import { ResourceCard } from '../ResourceCard';

interface ResourcesViewProps {
  resources: CampusResource[];
  userProfile: any;
  onSelectResource: (resource: CampusResource) => void;
  onToggleSaveResource: (resourceId: string) => void;
}

const RESOURCE_CATEGORIES: ('All' | ResourceCategory)[] = [
  'All',
  'Academic & Tutoring',
  'Makerspace & Tech',
  'Financial & Food Aid',
  'Health & Wellness',
  'Career & Jobs',
];

export const ResourcesView: React.FC<ResourcesViewProps> = ({
  resources = [],
  userProfile,
  onSelectResource,
  onToggleSaveResource,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | ResourceCategory>('All');

  const filteredResources = useMemo(() => {
    return (resources || []).filter((re) => {
      if (!re) return false;
      if (selectedCategory !== 'All' && re.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (re.name || '').toLowerCase().includes(q);
        const matchDesc = (re.description || '').toLowerCase().includes(q);
        const matchService = (re.servicesOffered || []).some((s) => (s || '').toLowerCase().includes(q));
        if (!matchName && !matchDesc && !matchService) return false;
      }
      return true;
    });
  }, [resources, selectedCategory, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Campus Facilities & Student Services
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Drop-in peer tutoring, 3D printing makerspaces, confidential food pantries, and career support centers.
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
            placeholder="Search tutoring centers, makerspaces, emergency aid, health facilities..."
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
          {RESOURCE_CATEGORIES.map((cat) => (
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

      {/* Resources Count */}
      <div className="text-xs text-slate-500 px-1">
        Showing <strong className="text-slate-900 font-semibold">{filteredResources.length}</strong> facilities
      </div>

      {/* Resources Grid */}
      {filteredResources.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-slate-200">
          <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No resources found</h3>
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
          {filteredResources.map((res) => (
            <ResourceCard
              key={res.id}
              resource={res}
              isSaved={userProfile.savedResources.includes(res.id)}
              onToggleSave={onToggleSaveResource}
              onOpenDetails={onSelectResource}
            />
          ))}
        </div>
      )}

    </div>
  );
};
