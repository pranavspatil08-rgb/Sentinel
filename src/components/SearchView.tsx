import { EvidenceFrame } from './EvidenceFrame';
import React, { useState } from 'react';
import { Camera, Sighting, normalizePlate, formatPlateWithSpaces, formatIST } from '../data/sentinelData';
import { 
  Search, 
  Car, 
  User, 
  MapPin, 
  Clock, 
  ArrowRight, 
  Eye,
  CheckCircle2,
  XCircle
} from 'lucide-react';

interface SearchViewProps {
  cameras: Camera[];
  sightings: Sighting[];
  initialSearchQuery?: string;
  onSelectSighting: (sightingId: string) => void;
  onLogSearch?: (query: string) => void;
  isLoading?: boolean;
}

export const SearchView: React.FC<SearchViewProps> = ({
  cameras,
  sightings,
  initialSearchQuery = '',
  onSelectSighting,
  onLogSearch,
  isLoading = false,
}) => {
  const [query, setQuery] = useState(initialSearchQuery);
  const [activeTab, setActiveTab] = useState<'vehicle' | 'person'>('vehicle');
  const [selectedCameraFilter, setSelectedCameraFilter] = useState<string>('all');
  const [timeWindowFilter, setTimeWindowFilter] = useState<'all' | 'morning' | 'dawn'>('all');
  const [statusFilter, setStatusFilter] = useState<'all'|'pending'|'confirmed'|'rejected'>('all');

  const normalizedInput = normalizePlate(query);

  // Filter sightings with normalized plate matching, partial matching, and OCR uncertainty handling
  const filteredSightings = sightings.filter((sighting) => {
    // Tab filter: Vehicle vs Person
    const queryIsPlate = /[0-9]/.test(query);
    const effectiveTab = query.trim() ? (queryIsPlate ? 'vehicle' : 'person') : activeTab;
    if (effectiveTab === 'vehicle' && sighting.type !== 'vehicle') return false;
    if (effectiveTab === 'person' && sighting.type !== 'person') return false;

    // Camera filter
    if (selectedCameraFilter !== 'all' && sighting.cameraId !== selectedCameraFilter) return false;
    if(statusFilter!=='all'&&sighting.decision!==statusFilter)return false;

    // Time window filter
    const ageMin = (Date.now() - new Date(sighting.time).getTime()) / 60000;
    if (timeWindowFilter === 'dawn' && ageMin > 30) return false;
    if (timeWindowFilter === 'morning' && ageMin > 60) return false;

    if (!query.trim()) return true;

    // For vehicles: compare normalized plate AND partial plate substrings
    if (sighting.type === 'vehicle') {
      const normSighting = normalizePlate(sighting.plateNumber || '');
      const normRaw = normalizePlate(sighting.rawPlateRead || '');

      if (normSighting.includes(normalizedInput) || normRaw.includes(normalizedInput)) {
        return true;
      }

      // Check if this is an OCR-uncertain similar match (e.g. GJ01A81234 when searching MH12AB1234)
      if (sighting.isOcrUncertain && normalizedInput.length >= 6) {
        let diffCount = 0;
        for (let i = 0; i < Math.min(normSighting.length, normalizedInput.length); i++) {
          if (normSighting[i] !== normalizedInput[i]) diffCount++;
        }
        if (diffCount <= 1) return true;
      }
    }

    // For persons: compare text description
    if (sighting.type === 'person' && sighting.personDescription) {
      const desc = sighting.personDescription.toLowerCase();
      if (query.trim().toLowerCase().split(/\s+/).every((w) => desc.includes(w))) {
        return true;
      }
    }

    return false;
  });

  const handleQueryChange = (val: string) => {
    setQuery(val);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onLogSearch && query.trim()) {
      onLogSearch(query.trim());
    }
  };

  const setPreset = (presetQuery: string, type: 'vehicle' | 'person') => {
    setActiveTab(type);
    setQuery(presetQuery);
    if (onLogSearch) onLogSearch(presetQuery);
  };

  if (isLoading) {
    return (
      <div className="bg-[#FFFFFF] border border-[#DCDAD4] rounded-[4px] p-8 text-center text-[#171B1F]">
        <div className="w-6 h-6 border-2 border-[#171B1F] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <div className="font-semibold text-sm">Searching municipal CCTV database...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-left">
      {/* Search Header & Filter Controls */}
      <div className="bg-[#FFFFFF] border border-[#DCDAD4] rounded-[4px] p-4 space-y-4">
        {/* Vehicle / Person Tab Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DCDAD4]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('vehicle');
                if (query.includes('red')) setQuery('MH 12 AB 1234');
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-[4px] font-medium text-xs border transition-colors cursor-pointer ${
                activeTab === 'vehicle'
                  ? 'bg-[#171B1F] text-white border-[#171B1F]'
                  : 'bg-[#F4F3EF] text-[#171B1F] border-[#DCDAD4] hover:bg-[#E9E7E0]'
              }`}
            >
              <Car className="w-3.5 h-3.5 text-[#D9822B]" />
              <span>Vehicle Tracking (ANPR Plate Match)</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('person');
                if (query.includes('MH')) setQuery('red jacket');
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-[4px] font-medium text-xs border transition-colors cursor-pointer ${
                activeTab === 'person'
                  ? 'bg-[#171B1F] text-white border-[#171B1F]'
                  : 'bg-[#F4F3EF] text-[#171B1F] border-[#DCDAD4] hover:bg-[#E9E7E0]'
              }`}
            >
              <User className="w-3.5 h-3.5 text-[#D9822B]" />
              <span>Person Tracking (Clothing Profile)</span>
            </button>
          </div>

          <select aria-label="Review status" value={statusFilter} onChange={e=>setStatusFilter(e.target.value as typeof statusFilter)} className="text-xs border border-[#DCDAD4] rounded px-2 py-1"><option value="all">All review statuses</option><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="rejected">Rejected</option></select>
          <button type="button" className="px-2 py-1 text-xs border rounded" onClick={()=>{const rows=[['id','time_ist','camera','target','confidence','status'],...filteredSightings.map(s=>[s.id,formatIST(s.time),cameras.find(c=>c.id===s.cameraId)?.name||s.cameraId,s.plateNumber||s.personDescription||'',String(s.confidence),s.decision])];const csv=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='sentinel-search.csv';a.click();URL.revokeObjectURL(a.href)}}>Export CSV</button>
          <div className="text-xs font-mono text-[#88857C]">
            {filteredSightings.length} Matching Records
          </div>
        </div>

        {/* Search Input Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#88857C]" />
            <input
              id="global-search"
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder={
                activeTab === 'vehicle'
                  ? 'Search registration plate (e.g., "MH 12 AB 1234", "MH-12-AB-1234", or "1234")...'
                  : 'Search appearance description (e.g., "red jacket", "backpack", "yellow vest")...'
              }
              className="w-full bg-[#FFFFFF] text-[#171B1F] text-xs font-mono pl-9 pr-3 py-2.5 rounded-[4px] border border-[#DCDAD4] focus:outline-none focus:border-[#D9822B] focus:ring-1 focus:ring-[#D9822B] placeholder:text-[#88857C]"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2.5 rounded-[4px] bg-[#171B1F] text-white font-medium text-xs hover:bg-[#252B32] transition-colors cursor-pointer shrink-0"
          >
            Execute Search
          </button>
        </form>
        <p className="text-xs text-[#88857C]">Maharashtra registration series MH-xx (e.g. MH-12 Pune, MH-14 Pimpri-Chinchwad, MH-01 Mumbai)</p>

        {/* Quick Search Preset Tags */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-[#88857C]">Operational Presets:</span>
          <button
            type="button"
            onClick={() => setPreset('MH 12 AB 1234', 'vehicle')}
            className="px-2.5 py-1 rounded-[2px] bg-[#FAFAF8] hover:bg-[#F4F3EF] border border-[#DCDAD4] font-mono text-[#171B1F] cursor-pointer"
          >
            Vehicle: MH 12 AB 1234
          </button>
          <button
            type="button"
            onClick={() => setPreset('1234', 'vehicle')}
            className="px-2.5 py-1 rounded-[2px] bg-[#FAFAF8] hover:bg-[#F4F3EF] border border-[#DCDAD4] font-mono text-[#171B1F] cursor-pointer"
          >
            Partial: 1234
          </button>
          <button
            type="button"
            onClick={() => setPreset('red jacket', 'person')}
            className="px-2.5 py-1 rounded-[2px] bg-[#FAFAF8] hover:bg-[#F4F3EF] border border-[#DCDAD4] text-[#171B1F] cursor-pointer"
          >
            Person: Red Jacket
          </button>
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-[#DC2626] hover:underline ml-2 cursor-pointer font-mono"
            >
              Clear Filter
            </button>
          )}
        </div>

        {/* Camera Node Filter & Time Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#DCDAD4]">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#88857C] shrink-0">Camera Node:</span>
            <select
              value={selectedCameraFilter}
              onChange={(e) => setSelectedCameraFilter(e.target.value)}
              className="w-full bg-[#FFFFFF] border border-[#DCDAD4] rounded-[4px] px-2.5 py-1.5 text-xs text-[#171B1F] font-mono focus:outline-none focus:border-[#D9822B]"
            >
              <option value="all">All Monitoring Points ({cameras.length})</option>
              {cameras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} - {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#88857C] shrink-0">Time Interval:</span>
            <div className="flex items-center gap-1 w-full bg-[#F4F3EF] p-1 rounded-[4px] border border-[#DCDAD4]">
              <button
                type="button"
                onClick={() => setTimeWindowFilter('all')}
                className={`flex-1 py-1 text-xs font-medium rounded-[2px] transition-colors cursor-pointer ${
                  timeWindowFilter === 'all'
                    ? 'bg-[#171B1F] text-white'
                    : 'text-[#6F7379] hover:text-[#171B1F]'
                }`}
              >
                All time
              </button>
              <button
                type="button"
                onClick={() => setTimeWindowFilter('dawn')}
                className={`flex-1 py-1 text-xs font-medium rounded-[2px] transition-colors cursor-pointer ${
                  timeWindowFilter === 'dawn'
                    ? 'bg-[#171B1F] text-white'
                    : 'text-[#6F7379] hover:text-[#171B1F]'
                }`}
              >
                Last 30 min
              </button>
              <button
                type="button"
                onClick={() => setTimeWindowFilter('morning')}
                className={`flex-1 py-1 text-xs font-medium rounded-[2px] transition-colors cursor-pointer ${
                  timeWindowFilter === 'morning'
                    ? 'bg-[#171B1F] text-white'
                    : 'text-[#6F7379] hover:text-[#171B1F]'
                }`}
              >
                Last 60 min
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sighting Results Roster */}
      <div className="space-y-3">
        {filteredSightings.length === 0 ? (
          <div className="bg-[#FFFFFF] border border-[#DCDAD4] rounded-[4px] p-12 text-center text-[#88857C] space-y-2">
            <Search className="w-6 h-6 mx-auto text-[#88857C]" />
            <div className="font-semibold text-sm text-[#171B1F]">No Matching Surveillance Records Found</div>
            <p className="text-xs text-[#88857C]">
              Verify normalized plate criteria (e.g., "MH 12 AB 1234") or clear the camera filters.
            </p>
          </div>
        ) : (
          filteredSightings.map((sighting) => {
            const cam = cameras.find((c) => c.id === sighting.cameraId);
            const isVehicle = sighting.type === 'vehicle';
            const displayPlate = sighting.plateNumber ? formatPlateWithSpaces(sighting.plateNumber) : null;
            const isConfirmed = sighting.decision === 'confirmed';
            const isRejected = sighting.decision === 'rejected';

            return (
              <div
                key={sighting.id}
                className="bg-[#FFFFFF] border border-[#DCDAD4] rounded-[4px] p-4 flex flex-col md:flex-row gap-4 hover:border-[#171B1F] transition-colors"
              >
                {/* CCTV Frame Thumbnail with Dark Screen & Simulated Tag */}
                <div className="w-full md:w-52 aspect-video relative bg-[#0E1217] rounded-[2px] border border-[#DCDAD4] overflow-hidden shrink-0">
                  <EvidenceFrame sighting={sighting} fit="cover" />
                </div>

                {/* Sighting Metadata */}
                <div className="flex-1 flex flex-col justify-between space-y-2 min-w-0">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono font-semibold text-xs text-[#171B1F] bg-white border border-[#DCDAD4] px-1.5 py-0.5 rounded-[2px]">
                          {sighting.id}
                        </span>
                        <span className="font-mono font-semibold text-sm text-[#171B1F] truncate">
                          {isVehicle ? displayPlate : sighting.personDescription}
                        </span>
                      </div>

                      <span className="font-mono font-bold text-xs text-[#D9822B] shrink-0">
                        {sighting.confidence}% Candidate Match
                      </span>
                    </div>

                    <div className="text-xs text-[#88857C] flex items-center gap-2 mt-1">
                      <span className="font-mono">{sighting.cameraId}</span>
                      <span>·</span>
                      <span className="truncate">{cam?.name || sighting.cameraId} ({cam?.location})</span>
                    </div>

                    <div className="text-[12px] font-mono text-[#88857C] mt-0.5">
                      {formatIST(sighting.time)}
                    </div>

                    {/* Short Reason Line */}
                    <div className="text-xs text-[#6F7379] mt-2 leading-relaxed bg-[#FAFAF8] p-2 rounded-[2px] border border-[#DCDAD4]">
                      <span className="font-semibold text-[#171B1F]">Reason: </span>
                      <span>{sighting.reason}</span>
                    </div>
                  </div>

                  {/* Footer & Action Control */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#DCDAD4] text-xs">
                    <span
                      className={`text-xs font-mono uppercase px-1.5 py-0.5 rounded-[2px] border ${
                        isConfirmed
                          ? 'bg-white border-[#16A34A] text-[#16A34A]'
                          : isRejected
                          ? 'bg-white border-[#DC2626] text-[#DC2626]'
                          : 'bg-white border-[#DCDAD4] text-[#D9822B]'
                      }`}
                    >
                      {isConfirmed
                        ? 'VERIFIED RECORD'
                        : isRejected
                        ? 'DISMISSED LEAD'
                        : 'AWAITING HUMAN REVIEW'}
                    </span>

                    <button
                      onClick={() => {
                        onSelectSighting(sighting.id);
                      }}
                      className="px-3 py-1 rounded-[4px] text-xs font-medium bg-[#171B1F] text-white hover:bg-[#252B32] transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Examine Frame</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
