import React from 'react';
import { X, Building2, Clock, MapPin, CheckCircle2, Bookmark, Navigation } from 'lucide-react';
import { CampusResource } from '../types';

interface ResourceDetailModalProps {
  resource: CampusResource | null;
  isOpen: boolean;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: (resId: string) => void;
  onLocateOnMap: (resource: CampusResource) => void;
}

export const ResourceDetailModal: React.FC<ResourceDetailModalProps> = ({
  resource,
  isOpen,
  onClose,
  isSaved,
  onToggleSave,
  onLocateOnMap,
}) => {
  if (!isOpen || !resource) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden my-8 animate-in fade-in duration-150 text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-white border border-slate-200 text-slate-700">
                {resource.category}
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                {resource.currentStatus}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              {resource.name}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[calc(85vh-12rem)] overflow-y-auto">
          
          {/* Quick info boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
              <MapPin className="w-4 h-4 text-slate-600 shrink-0" />
              <div>
                <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Campus Location</p>
                <p className="text-xs font-semibold text-slate-800">{resource.location}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
              <Clock className="w-4 h-4 text-slate-600 shrink-0" />
              <div>
                <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Operating Hours</p>
                <p className="text-xs font-semibold text-slate-800">{resource.openHours}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Overview</h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line font-normal">
              {resource.description}
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Available Services & Amenities
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {resource.servicesOffered.map((srv, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center gap-2 text-xs font-medium text-slate-700"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{srv}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contact info */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            <p className="text-slate-500 font-semibold uppercase tracking-wider mb-1">Contact & Inquiries</p>
            <p className="text-slate-800 font-medium">{resource.contactInfo}</p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={() => onToggleSave(resource.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
              isSaved
                ? 'bg-slate-900 text-white'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 fill-current" />
            <span>{isSaved ? 'Saved in Profile' : 'Bookmark'}</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onLocateOnMap(resource);
            }}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>View on Map</span>
          </button>
        </div>
      </div>
    </div>
  );
};
