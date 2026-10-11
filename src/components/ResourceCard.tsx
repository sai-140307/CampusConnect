import React from 'react';
import { 
  Building2, 
  Clock, 
  MapPin, 
  Bookmark, 
  CheckCircle2, 
  GraduationCap, 
  HeartHandshake, 
  Smile, 
  Wrench, 
  Briefcase 
} from 'lucide-react';
import { CampusResource } from '../types';
import { OpenStatusBadge } from './OpenStatusBadge';

interface ResourceCardProps {
  resource: CampusResource;
  isSaved: boolean;
  onToggleSave: (resId: string) => void;
  onOpenDetails: (res: CampusResource) => void;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  isSaved,
  onToggleSave,
  onOpenDetails,
}) => {
  const renderIcon = (name: string) => {
    switch (name) {
      case 'GraduationCap': return <GraduationCap className="w-5 h-5 text-ink-700" />;
      case 'HeartHandshake': return <HeartHandshake className="w-5 h-5 text-ink-700" />;
      case 'Smile': return <Smile className="w-5 h-5 text-ink-700" />;
      case 'Wrench': return <Wrench className="w-5 h-5 text-ink-700" />;
      case 'Briefcase': return <Briefcase className="w-5 h-5 text-ink-700" />;
      default: return <Building2 className="w-5 h-5 text-ink-700" />;
    }
  };

  return (
    <div
      id={`resource-card-${resource.id}`}
      onClick={() => onOpenDetails(resource)}
      className="cc-card group relative rounded-2xl bg-white border border-ink-200 p-5 flex flex-col justify-between cursor-pointer"
    >
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-ink-100 border border-ink-200 flex items-center justify-center">
              {renderIcon(resource.iconName)}
            </div>
            <div>
              <span className="text-2xs font-semibold text-ink-500 block">
                {resource.category}
              </span>
              <h3 className="font-display text-base font-semibold text-ink-900 group-hover:text-ink-700 transition-colors line-clamp-1">
                {resource.name}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(resource.id);
            }}
            className={`p-2 rounded-lg border transition-colors ${
              isSaved
                ? 'cc-btn-brand border-transparent'
                : 'bg-white hover:bg-ink-50 text-ink-400 hover:text-ink-700 border-ink-200'
            }`}
            aria-pressed={isSaved}
            aria-label={isSaved ? `Remove ${resource.name} from saved` : `Save ${resource.name}`}
            title={isSaved ? 'Saved' : 'Save'}
          >
            <Bookmark className="w-3.5 h-3.5 fill-current" />
          </button>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-2 mb-3">
          <OpenStatusBadge openHours={resource.openHours} />
          {resource.walkInsAllowed && (
            <span className="text-xs font-normal text-ink-500">
              ✓ Walk-ins allowed
            </span>
          )}
        </div>

        {/* Short Description */}
        <p className="text-xs text-ink-500 line-clamp-2 leading-relaxed mb-4">
          {resource.shortDesc}
        </p>

        {/* Services List Preview */}
        <div className="space-y-1 mb-4">
          {resource.servicesOffered.slice(0, 3).map((srv, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-xs text-ink-600">
              <CheckCircle2 className="w-3.5 h-3.5 text-ink-400 shrink-0" />
              <span className="truncate">{srv}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Location & Hours Footer */}
      <div className="pt-3 border-t border-ink-100 space-y-1 text-xs text-ink-500">
        <div className="flex items-center gap-1.5 text-ink-700 font-medium">
          <MapPin className="w-3.5 h-3.5 text-ink-400 shrink-0" />
          <span className="truncate">{resource.location}</span>
        </div>
        <div className="flex items-center gap-1.5 text-ink-500">
          <Clock className="w-3.5 h-3.5 text-ink-400 shrink-0" />
          <span className="truncate">{resource.openHours}</span>
        </div>
      </div>
    </div>
  );
};
