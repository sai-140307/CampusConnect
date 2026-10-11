import React, { useState } from 'react';
import { 
  Building2, 
  Compass, 
  Calendar, 
  ChevronRight,
  Info
} from 'lucide-react';
import { CAMPUS_BUILDINGS } from '../data/mockData';
import { CampusEvent, CampusResource } from '../types';
import { formatEventWhen } from '../utils/campusTime';
import { useNow } from '../hooks/useNow';
import { OpenStatusBadge } from './OpenStatusBadge';

interface InteractiveCampusMapProps {
  events: CampusEvent[];
  resources: CampusResource[];
  onSelectEvent: (event: CampusEvent) => void;
  onSelectResource: (resource: CampusResource) => void;
}

export const InteractiveCampusMap: React.FC<InteractiveCampusMapProps> = ({
  events = [],
  resources = [],
  onSelectEvent,
  onSelectResource,
}) => {
  const now = useNow();
  const [selectedZone, setSelectedZone] = useState<string>('All');
  const [activeBuildingId, setActiveBuildingId] = useState<string>('bldg-su');

  const filteredBuildings = selectedZone === 'All'
    ? CAMPUS_BUILDINGS
    : CAMPUS_BUILDINGS.filter((b) => b.zone === selectedZone);

  const currentBuilding = CAMPUS_BUILDINGS.find((b) => b.id === activeBuildingId) || CAMPUS_BUILDINGS[0];

  const buildingEvents = (events || []).filter((e) => e.building.toLowerCase().includes(currentBuilding.shortName.toLowerCase()) || currentBuilding.name.toLowerCase().includes(e.building.toLowerCase()));
  const buildingResources = (resources || []).filter((r) => r.building.toLowerCase().includes(currentBuilding.shortName.toLowerCase()) || currentBuilding.name.toLowerCase().includes(r.building.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header & Zone Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-ink-100 border border-ink-200 text-ink-700 text-xs font-semibold mb-2">
            <Compass className="w-3.5 h-3.5 text-ink-600" />
            Vellore Institute of Technology • Campus Map
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-ink-900">
            Interactive Campus Map & Room Finder
          </h2>
          <p className="text-xs sm:text-sm text-ink-500 font-normal">
            Locate active club meeting spaces, catered sessions, and 24/7 student facilities across campus zones.
          </p>
        </div>

        {/* Zone Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {['All', 'Central Hub', 'West Tech Park', 'North Campus', 'South Quad'].map((zone) => (
            <button
              key={zone}
              onClick={() => setSelectedZone(zone)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                selectedZone === zone
                  ? 'cc-btn-ink font-semibold shadow-xs'
                  : 'bg-white text-ink-600 hover:text-ink-900 border border-ink-200 hover:bg-ink-50'
              }`}
            >
              {zone}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Map Canvas */}
        <div className="lg:col-span-8 rounded-2xl bg-white border border-ink-200 p-4 sm:p-6 shadow-sm relative overflow-hidden">
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs text-ink-700 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Live Campus Radar</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-ink-500">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>Food Event</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-ink-900" />
                <span>Academic & Tech</span>
              </div>
            </div>
          </div>

          {/* Minimalist Architectural Map Canvas */}
          <div className="relative w-full h-[360px] sm:h-[450px] bg-ink-50 rounded-xl border border-ink-200/80 overflow-hidden flex items-center justify-center">
            
            {/* Minimal Grid Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] opacity-60" />

            {/* Central Quad Lawn */}
            <div className="absolute w-44 h-44 rounded-full bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-xs uppercase font-bold tracking-widest text-emerald-800/40 pointer-events-none">
              Memorial Quad
            </div>

            {/* Clickable Building Nodes */}
            {filteredBuildings.map((bldg) => {
              const isActive = bldg.id === activeBuildingId;
              const hasFood = (events || []).some((e) => (e.building.includes(bldg.shortName) || bldg.name.includes(e.building)) && (e.perks || []).includes('Free Food 🍕'));
              const eventCount = (events || []).filter((e) => e.building.includes(bldg.shortName) || bldg.name.includes(e.building)).length;

              return (
                <div
                  key={bldg.id}
                  onClick={() => setActiveBuildingId(bldg.id)}
                  style={{ left: `${bldg.coords.x}%`, top: `${bldg.coords.y}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-150 z-20 ${
                    isActive ? 'scale-105' : 'hover:scale-102'
                  }`}
                >
                  <div className="relative">
                    <div
                      className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 shadow-xs transition-all ${
                        isActive
                          ? 'cc-btn-ink border-ink-900'
                          : 'bg-white text-ink-800 border-ink-300 hover:border-ink-400'
                      }`}
                    >
                      <Building2 className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-ink-500'}`} />
                      <div>
                        <p className={`text-xs font-bold leading-tight ${isActive ? 'text-white' : 'text-ink-900'}`}>
                          {bldg.shortName}
                        </p>
                        <p className={`text-2xs leading-none ${isActive ? 'text-ink-300' : 'text-ink-500'}`}>
                          {eventCount} event{eventCount === 1 ? '' : 's'}
                        </p>
                      </div>

                      {hasFood && (
                        <span className="w-4 h-4 rounded-full bg-amber-400 text-ink-900 text-2xs flex items-center justify-center font-bold">
                          🍕
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-ink-500">
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-ink-400" />
              Click any building marker to inspect rooms and scheduled activities.
            </span>
            <span className="font-medium text-ink-700">
              {filteredBuildings.length} Locations
            </span>
          </div>

        </div>

        {/* Building Details Sidebar */}
        <div className="lg:col-span-4 rounded-2xl bg-white border border-ink-200 p-5 sm:p-6 shadow-sm space-y-5">
          
          <div className="border-b border-ink-100 pb-4">
            <span className="px-2.5 py-0.5 rounded-md text-2xs font-semibold bg-ink-100 text-ink-700 border border-ink-200 mb-2 inline-block">
              {currentBuilding.zone}
            </span>
            <h3 className="text-lg font-bold text-ink-900">
              {currentBuilding.name}
            </h3>
            <p className="text-xs text-ink-500 mt-1 leading-relaxed">
              {currentBuilding.description}
            </p>
          </div>

          {/* Key Amenities */}
          <div>
            <h4 className="text-xs font-semibold text-ink-500 mb-2">
              Building Amenities
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {currentBuilding.amenities.map((amenity, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-ink-50 text-ink-700 border border-ink-200"
                >
                  {amenity}
                </span>
              ))}
            </div>
          </div>

          {/* Active Events */}
          <div>
            <h4 className="text-xs font-semibold text-ink-500 mb-2 flex items-center justify-between">
              <span>Happenings Here ({buildingEvents.length})</span>
              <Calendar className="w-3.5 h-3.5 text-ink-400" />
            </h4>
            {buildingEvents.length === 0 ? (
              <p className="text-xs text-ink-500 p-3 rounded-xl bg-ink-50 border border-ink-200/60 text-center font-normal">
                No active events scheduled. Open for quiet study.
              </p>
            ) : (
              <div className="space-y-2">
                {buildingEvents.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => onSelectEvent(ev)}
                    className="p-3 rounded-xl bg-ink-50 border border-ink-200 hover:border-ink-300 cursor-pointer transition-all flex items-center justify-between gap-3 group"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-2xs font-semibold px-2 py-0.5 rounded bg-white text-ink-700 border border-ink-200">
                          {ev.room}
                        </span>
                        {ev.perks.includes('Free Food 🍕') && (
                          <span className="text-2xs font-semibold text-amber-700">
                            Free Food 🍕
                          </span>
                        )}
                      </div>
                      <h5 className="text-xs font-bold text-ink-900 group-hover:text-ink-700 line-clamp-1">
                        {ev.title}
                      </h5>
                      <p className="text-xs text-ink-500">{formatEventWhen(ev, now)}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-ink-400 group-hover:text-ink-700 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resources */}
          {buildingResources.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-ink-500 mb-2 flex items-center justify-between">
                <span>Facilities in Building</span>
                <Building2 className="w-3.5 h-3.5 text-ink-400" />
              </h4>
              <div className="space-y-2">
                {buildingResources.map((res) => (
                  <div
                    key={res.id}
                    onClick={() => onSelectResource(res)}
                    className="p-2.5 rounded-xl bg-ink-50 border border-ink-200 hover:border-ink-300 cursor-pointer transition-all flex items-center justify-between gap-2"
                  >
                    <div className="truncate">
                      <p className="text-xs font-semibold text-ink-800 truncate">{res.name}</p>
                      <p className="text-2xs font-medium"><OpenStatusBadge openHours={res.openHours} plain /> <span className="text-ink-500">• {res.location}</span></p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-ink-400 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
