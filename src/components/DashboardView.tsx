import { EvidenceFrame } from './EvidenceFrame';
import React from 'react';
import { Camera, Sighting, Case, formatPlateWithSpaces, formatIST } from '../data/sentinelData';
import { 
  Car, 
  User, 
  MapPin, 
  ArrowRight,
  FolderArchive,
  ChevronRight
} from 'lucide-react';

interface DashboardViewProps {
  cameras: Camera[];
  sightings: Sighting[];
  cases: Case[];
  onOpenCase: (caseId: string) => void;
  onQuickSearch: (query: string) => void;
  onOpenMapForCase: (caseId: string) => void;
  isLoading?: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  cameras,
  sightings,
  cases,
  onOpenCase,
  onQuickSearch,
  onOpenMapForCase,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="bg-[#FFFFFF] border border-[#DCDAD4] rounded-[4px] p-8 text-center text-[#171B1F]">
        <div className="w-6 h-6 border-2 border-[#171B1F] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <div className="font-semibold text-sm">Loading surveillance grid telemetry...</div>
        <div className="text-xs text-[#88857C] mt-1">Synchronizing live municipal camera nodes.</div>
      </div>
    );
  }

  // Real data calculations
  const totalCameras = cameras.length;
  const onlineCameras = cameras.filter((c) => c.status === 'online').length;
  const offlineCameras = cameras.filter((c) => c.status === 'offline').length;
  const totalSightings = sightings.length;
  const highConfidenceCount = sightings.filter((s) => s.confidence >= 90).length;
  const confirmedCount = sightings.filter((s) => s.decision === 'confirmed').length;
  const rejectedCount = sightings.filter((s) => s.decision === 'rejected').length;
  const pendingCount = sightings.filter((s) => s.decision === 'pending').length;
  const activeCasesCount = cases.filter((c) => c.status === 'Open').length;

  // Recent chronological detections
  const recentSightings = [...sightings]
    .sort((a, b) => new Date(b.time.replace(' ', 'T')).getTime() - new Date(a.time.replace(' ', 'T')).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Top Operational Command Bar */}
      <div className="bg-[#FFFFFF] border border-[#DCDAD4] rounded-[4px] p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="text-left">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
            <h2 className="text-sm font-semibold text-[#171B1F] tracking-wide uppercase">
              Maharashtra Police Surveillance Operations Grid
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-[4px] font-mono font-medium bg-[#F4F3EF] text-[#171B1F] border border-[#DCDAD4]">
              PUNE CITY SAMPLE REGION
            </span>
          </div>
          <p className="text-xs text-[#88857C]">
            Pilot region: Pune City · Scalable to all districts of Maharashtra. Camera detections are simulated in this prototype.
          </p>
        </div>

        {/* Quick Search Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-[#88857C]">Active Targets:</span>
          <button
            onClick={() => {
              onQuickSearch('MH 12 AB 1234');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] text-xs font-mono font-medium bg-[#171B1F] text-white hover:bg-[#252B32] transition-colors cursor-pointer"
          >
            <Car className="w-3.5 h-3.5 shrink-0 text-[#D9822B]" />
            <span>MH 12 AB 1234</span>
          </button>
          <button
            onClick={() => {
              onQuickSearch('red jacket');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] text-xs font-medium bg-[#171B1F] text-white hover:bg-[#252B32] transition-colors cursor-pointer"
          >
            <User className="w-3.5 h-3.5 shrink-0 text-[#D9822B]" />
            <span>CASE-2026-002</span>
          </button>
        </div>
      </div>

      {/* COMPACT STATUS STRIP: A single row with six numbers separated by thin dividers, no icons */}
      <div className="bg-[#FFFFFF] border border-[#DCDAD4] rounded-[4px] overflow-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-[#DCDAD4]">
          {/* 1. Online Cameras */}
          <div className="p-3 text-left">
            <div className="text-xs font-mono uppercase text-[#88857C] mb-1">Online Cameras</div>
            <div className="text-xl font-bold font-mono text-[#171B1F] flex items-baseline gap-1">
              <span>{onlineCameras}</span>
              <span className="text-xs text-[#88857C] font-normal">/ {totalCameras}</span>
            </div>
            <div className="text-[12px] text-[#16A34A] mt-1 font-mono">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#16A34A] mr-1" />
              {onlineCameras} of {totalCameras} cameras online
            </div>
          </div>

          {/* 2. Awaiting Review */}
          <div className="p-3 text-left">
            <div className="text-xs font-mono uppercase text-[#88857C] mb-1">Awaiting Review</div>
            <div className="text-xl font-bold font-mono text-[#D9822B]">
              {pendingCount}
            </div>
            <div className="text-[12px] text-[#88857C] mt-1 font-mono">
              of {totalSightings} total records
            </div>
          </div>

          {/* 3. Active Cases */}
          <div className="p-3 text-left">
            <div className="text-xs font-mono uppercase text-[#88857C] mb-1">Active Cases</div>
            <div className="text-xl font-bold font-mono text-[#171B1F]">
              {activeCasesCount}
            </div>
            <div className="text-[12px] text-[#88857C] mt-1">
              Open investigations
            </div>
          </div>

          {/* 4. Verified Records */}
          <div className="p-3 text-left">
            <div className="text-xs font-mono uppercase text-[#88857C] mb-1">Verified Records</div>
            <div className="text-xl font-bold font-mono text-[#171B1F]">
              {confirmedCount}
            </div>
            <div className="text-[12px] text-[#88857C] mt-1 font-mono">
              + {rejectedCount} dismissed
            </div>
          </div>

          {/* 5. Total Sightings */}
          <div className="p-3 text-left">
            <div className="text-xs font-mono uppercase text-[#88857C] mb-1">Total Sightings</div>
            <div className="text-xl font-bold font-mono text-[#171B1F]">
              {totalSightings}
            </div>
            <div className="text-[12px] text-[#88857C] mt-1">
              Recorded in grid
            </div>
          </div>

          {/* 6. High Match Candidates */}
          <div className="p-3 text-left">
            <div className="text-xs font-mono uppercase text-[#88857C] mb-1">High Candidates</div>
            <div className="text-xl font-bold font-mono text-[#171B1F]">
              {highConfidenceCount}
            </div>
            <div className="text-[12px] text-[#88857C] mt-1 font-mono">
              Score &ge; 90.0%
            </div>
          </div>
        </div>
      </div>

      {/* Row 1: Active Investigations (6 cols) & Camera Network Inventory (6 cols) - Same Height */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left Column: Active Investigations (6 cols) */}
        <div className="lg:col-span-6 bg-[#FFFFFF] rounded-[4px] border border-[#DCDAD4] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#DCDAD4] mb-3">
              <div className="flex items-center gap-2">
                <FolderArchive className="w-4 h-4 text-[#D9822B]" />
                <h3 className="font-semibold text-[#171B1F] text-xs uppercase tracking-wide">
                  Active Investigations ({cases.length})
                </h3>
              </div>
              <span className="text-xs font-mono text-[#88857C]">Maharashtra Police</span>
            </div>

            {cases.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#88857C]">
                No active investigations recorded.
              </div>
            ) : (
              <div className="space-y-3">
                {cases.map((c) => {
                  const linkedCount = sightings.filter((s) => c.linkedSightingIds.includes(s.id)).length;
                  const verifiedCount = sightings.filter((s) => c.linkedSightingIds.includes(s.id) && s.decision === 'confirmed').length;

                  return (
                    <div
                      key={c.caseId}
                      className="border border-[#DCDAD4] rounded-[4px] p-3 hover:border-[#171B1F] transition-colors bg-[#FAFAF8] text-left"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-[#171B1F] bg-[#FFFFFF] px-1.5 py-0.5 border border-[#DCDAD4] rounded-[2px]">
                              {c.caseId}
                            </span>
                            <span className="text-xs font-mono px-1.5 py-0.5 border border-[#DCDAD4] rounded-[2px] bg-white text-[#171B1F] uppercase">
                              {c.status}
                            </span>
                          </div>
                          <h4 className="font-semibold text-sm text-[#171B1F] mt-1.5 truncate">
                            {c.title}
                          </h4>
                        </div>
                        <span className="text-xs font-mono text-[#88857C] shrink-0">
                          {linkedCount} Sightings ({verifiedCount} Verified)
                        </span>
                      </div>

                      <p className="text-xs text-[#6F7379] line-clamp-2 mb-3 leading-relaxed">
                        {c.notes}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-[#DCDAD4] text-xs">
                        <div className="text-xs text-[#88857C]">
                          Criteria: <span className="font-mono font-medium text-[#171B1F]">{formatPlateWithSpaces(c.searchCriteria)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              onOpenMapForCase(c.caseId);
                            }}
                            className="px-2.5 py-1 rounded-[4px] text-xs font-medium border border-[#DCDAD4] bg-[#FFFFFF] text-[#171B1F] hover:bg-[#F4F3EF] cursor-pointer"
                          >
                            Reconstruct Route
                          </button>
                          <button
                            onClick={() => {
                              onOpenCase(c.caseId);
                            }}
                            className="px-2.5 py-1 rounded-[4px] text-xs font-medium bg-[#171B1F] text-white hover:bg-[#252B32] cursor-pointer"
                          >
                            Open File
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Camera Network Inventory (6 cols) */}
        <div className="lg:col-span-6 bg-[#FFFFFF] rounded-[4px] border border-[#DCDAD4] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#DCDAD4] mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                <h3 className="font-semibold text-[#171B1F] text-xs uppercase tracking-wide">
                  Camera Network Inventory ({totalCameras})
                </h3>
              </div>
              <div className="text-xs font-mono text-[#88857C]">
                {onlineCameras} Online · {offlineCameras} Offline
              </div>
            </div>

            <div className="divide-y divide-[#DCDAD4]">
              {cameras.map((cam) => {
                const isOnline = cam.status === 'online';
                const camSightings = sightings.filter((s) => s.cameraId === cam.id).length;

                return (
                  <div key={cam.id} className="py-2.5 flex items-center justify-between gap-3 text-left">
                    <div className="min-w-0 flex items-center gap-2.5">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isOnline ? 'bg-[#16A34A]' : 'bg-[#DC2626]'
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-[#171B1F]">
                            {cam.id}
                          </span>
                          <span className="font-medium text-xs text-[#171B1F] truncate">
                            {cam.name}
                          </span>
                        </div>
                        <div className="text-xs text-[#88857C] truncate flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span>{cam.location}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-right">
                      <div className="text-xs font-mono text-[#88857C]">
                        {camSightings} detections
                      </div>
                      <span
                        className={`text-xs font-mono px-1.5 py-0.5 rounded-[2px] border ${
                          isOnline
                            ? 'bg-[#FFFFFF] border-[#DCDAD4] text-[#16A34A]'
                            : 'bg-[#FFFFFF] border-[#DC2626] text-[#DC2626]'
                        }`}
                      >
                        {isOnline ? 'ONLINE' : 'OFFLINE'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-[#DCDAD4] mt-3 text-xs text-[#88857C] text-left">
            CAM-PU-06 (Katraj Chowk) flagged as offline due to municipal public works cable fault.
          </div>
        </div>
      </div>

      {/* Row 2: Recent Sighting Detections Stream */}
      <div className="bg-[#FFFFFF] rounded-[4px] border border-[#DCDAD4] p-4 text-left">
        <div className="flex items-center justify-between pb-3 border-b border-[#DCDAD4] mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[#171B1F] text-xs uppercase tracking-wide">
              Recent CCTV Detections Stream
            </h3>
            <span className="text-xs font-mono px-1.5 py-0.5 rounded-[2px] border border-[#DCDAD4] text-[#88857C]">
              Latest {recentSightings.length}
            </span>
          </div>
          <span className="text-xs font-mono text-[#88857C]">Chronological Order</span>
        </div>

        {recentSightings.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#88857C]">
            No recent detections found in surveillance log.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {recentSightings.map((sighting) => {
              const cam = cameras.find((c) => c.id === sighting.cameraId);
              const isVehicle = sighting.type === 'vehicle';
              const displayPlate = sighting.plateNumber ? formatPlateWithSpaces(sighting.plateNumber) : null;

              return (
                <div
                  key={sighting.id}
                  className="border border-[#DCDAD4] rounded-[4px] overflow-hidden bg-[#FAFAF8] flex flex-col justify-between"
                >
                  {/* CCTV Thumbnail with Dark Screen & Telemetry */}
                  <div className="w-full aspect-video bg-[#0E1217] relative border-b border-[#DCDAD4] overflow-hidden">
                    <EvidenceFrame sighting={sighting} fit="cover" />
                  </div>

                  {/* Body Content */}
                  <div className="p-2.5 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center justify-between gap-1 text-xs mb-1">
                        <span className="font-mono font-semibold text-[#171B1F] bg-white border border-[#DCDAD4] px-1 rounded-[2px]">
                          {sighting.id}
                        </span>
                        <span className="font-mono text-xs text-[#D9822B] font-semibold">
                          {sighting.confidence}%
                        </span>
                      </div>

                      <div className="font-mono font-medium text-xs text-[#171B1F] truncate">
                        {isVehicle ? (
                          <span>{displayPlate}</span>
                        ) : (
                          <span className="font-sans">{sighting.personDescription || 'CASE-2026-002'}</span>
                        )}
                      </div>

                      <div className="text-[12px] font-mono text-[#88857C] mt-1">
                        {formatIST(sighting.time)}
                      </div>

                      <div className="text-[12px] text-[#6F7379] line-clamp-2 mt-1">
                        {sighting.reason}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#DCDAD4] flex items-center justify-between text-xs">
                      <span className="font-mono text-[12px] text-[#88857C]">
                        {sighting.cameraId}
                      </span>
                      <span
                        className={`text-xs font-mono uppercase px-1.5 py-0.5 rounded-[2px] border ${
                          sighting.decision === 'confirmed'
                            ? 'bg-white border-[#16A34A] text-[#16A34A]'
                            : sighting.decision === 'rejected'
                            ? 'bg-white border-[#DC2626] text-[#DC2626]'
                            : 'bg-white border-[#DCDAD4] text-[#D9822B]'
                        }`}
                      >
                        {sighting.decision === 'confirmed'
                          ? 'VERIFIED'
                          : sighting.decision === 'rejected'
                          ? 'DISMISSED'
                          : 'PENDING'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
