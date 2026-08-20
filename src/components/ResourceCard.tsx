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
      case 'GraduationCap': return <GraduationCap className="w-5 h-5 text-slate-700" />;
      case 'HeartHandshake': return <HeartHandshake className="w-5 h-5 text-slate-700" />;
      case 'Smile': return <Smile className="w-5 h-5 text-slate-700" />;
      case 'Wrench': return <Wrench className="w-5 h-5 text-slate-700" />;
      case 'Briefcase': return <Briefcase className="w-5 h-5 text-slate-700" />;
      default: return <Building2 className="w-5 h-5 text-slate-700" />;
    }
  };

  return (
    <div
      id={`resource-card-${resource.id}`}
      onClick={() => onOpenDetails(resource)}
      className="group relative rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between cursor-pointer"
    >
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
              {renderIcon(resource.iconName)}
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                {resource.category}
              </span>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-slate-700 transition-colors line-clamp-1">
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
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-700 border-slate-200'
            }`}
            title="Save Resource"
          >
            <Bookmark className="w-3.5 h-3.5 fill-current" />
          </button>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {resource.currentStatus}
          </span>
          {resource.walkInsAllowed && (
            <span className="text-[11px] font-normal text-slate-500">
              ✓ Walk-ins allowed
            </span>
          )}
        </div>

        {/* Short Description */}
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
          {resource.shortDesc}
        </p>

        {/* Services List Preview */}
        <div className="space-y-1 mb-4">
          {resource.servicesOffered.slice(0, 3).map((srv, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-600">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{srv}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Location & Hours Footer */}
      <div className="pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{resource.location}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500">
          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{resource.openHours}</span>
        </div>
      </div>
    </div>
  );
};
