import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Camera, Sighting, Case, computeLegMetrics, formatPlateWithSpaces, formatIST } from '../data/sentinelData';
import { 
  Play, 
  RotateCcw, 
  Clock, 
  MapPin, 
  Navigation, 
  Eye,
  Car,
  User
} from 'lucide-react';

interface RealLeafletMapProps {
  cameras: Camera[];
  sightings: Sighting[];
  cases: Case[];
  selectedCaseId: string;
  onSelectCase: (caseId: string) => void;
  onOpenEvidence: (sightingId: string) => void;
  isLoading?: boolean;
}

export const RealLeafletMap: React.FC<RealLeafletMapProps> = ({
  cameras,
  sightings,
  cases,
  selectedCaseId,
  onSelectCase,
  onOpenEvidence,
  isLoading = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);
  const [isReplaying, setIsReplaying] = useState(false);

  const selectedCase = cases.find((c) => c.caseId === selectedCaseId) || cases[0];

  // 1. Filter out rejected sightings
  const nonRejectedSightings = sightings.filter(
    (s) => selectedCase && selectedCase.linkedSightingIds.includes(s.id) && s.decision !== 'rejected'
  );

  // 2. Sort sightings in strict chronological order
  const orderedSightings = [...nonRejectedSightings].sort(
    (a, b) => new Date(a.time.replace(' ', 'T')).getTime() - new Date(b.time.replace(' ', 'T')).getTime()
  ).filter((s) => s.decision === 'confirmed');

  // 3. Newest confirmed sighting
  const confirmedSightings = orderedSightings.filter((s) => s.decision === 'confirmed');
  const lastConfirmedSighting = confirmedSightings.length > 0 
    ? confirmedSightings[confirmedSightings.length - 1] 
    : orderedSightings[orderedSightings.length - 1];

  // Initialize Leaflet Map centered on Pune City corridor
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on Pune City
    const map = L.map(mapContainerRef.current, {
      center: [18.5204, 73.8567],
      zoom: 12,
      zoomControl: true,
    });

    // Clean OpenStreetMap Tile Layer
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors · Maharashtra Police GIS',
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    layerGroupRef.current = layerGroup;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Replay route step-by-step controller
  useEffect(() => {
    if (!isReplaying || orderedSightings.length === 0) return;

    let current = 0;
    setActiveStepIndex(0);

    const interval = setInterval(() => {
      current += 1;
      if (current >= orderedSightings.length) {
        setIsReplaying(false);
        setActiveStepIndex(null);
        clearInterval(interval);
      } else {
        setActiveStepIndex(current);
      }
    }, 8000 / orderedSightings.length);

    return () => clearInterval(interval);
  }, [isReplaying, orderedSightings.length]);

  // Render Map layers whenever case, sightings, or replay step changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layers = layerGroupRef.current;
    if (!map || !layers) return;

    layers.clearLayers();

    // 1. Draw all camera pins with 4px corners, 1px border, no drop shadows
    cameras.forEach((cam) => {
      const isOnline = cam.status === 'online';
      const camIcon = L.divIcon({
        className: 'custom-cam-pin',
        html: `
          <div style="
            background: #FFFFFF;
            border: 1px solid #DCDAD4;
            color: #171B1F;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <span style="
              display: inline-block;
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background: ${isOnline ? '#16A34A' : '#DC2626'};
            "></span>
          </div>
        `,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const marker = L.marker([cam.lat, cam.lng], { icon: camIcon });
      marker.bindPopup(`
        <div style="font-family: 'Public Sans', sans-serif; font-size: 12px; line-height: 1.4;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #DCDAD4; padding-bottom: 4px; margin-bottom: 4px;">
            <strong style="font-family: 'JetBrains Mono', monospace; font-size: 12px;">${cam.id}</strong>
            <span style="font-size: 10px; font-weight: 600; color: ${isOnline ? '#16A34A' : '#DC2626'}; font-family: 'JetBrains Mono', monospace;">
              ${isOnline ? 'ONLINE' : 'NO COVERAGE'}
            </span>
          </div>
          <div style="font-weight: 600; color: #171B1F;">${cam.name}</div>
          <div style="color: #6F7379; margin-top: 2px;">${cam.location}</div>
          <div style="margin-top: 6px; padding: 4px 6px; background: #F4F3EF; border-radius: 2px; font-size: 11px;">
            <strong>Optical Grade:</strong> ${cam.reliability.grade}<br/>
            <span style="color: #6F7379;">${cam.reliability.reason}</span>
          </div>
        </div>
      `);
      layers.addLayer(marker);
    });

    if (orderedSightings.length === 0) return;

    // 2. Draw Route Polyline connecting chronological sightings
    const routeCoords: [number, number][] = [];
    orderedSightings.forEach((s) => {
      const cam = cameras.find((c) => c.id === s.cameraId);
      if (cam) {
        routeCoords.push([cam.lat, cam.lng]);
      }
    });

    if (routeCoords.length > 1) {
      // Background route track
      const polylineBg = L.polyline(routeCoords, {
        color: '#171B1F',
        weight: 3.5,
        opacity: 0.85,
      });
      layers.addLayer(polylineBg);

      // Accent dashed path (animated pulse visual)
      const polylineFg = L.polyline(routeCoords, {
        color: '#D9822B',
        weight: 2,
        dashArray: isReplaying ? '6, 6' : undefined,
        opacity: 0.95,
      });
      layers.addLayer(polylineFg);
    }

    // 3. Draw Chronological Sighting Badges (1, 2, 3...)
    orderedSightings.forEach((sighting, idx) => {
      const cam = cameras.find((c) => c.id === sighting.cameraId);
      if (!cam) return;

      const isStepActive = activeStepIndex === idx;
      const isConfirmed = sighting.decision === 'confirmed';
      const isLastSeen = lastConfirmedSighting && lastConfirmedSighting.id === sighting.id;

      // Color scheme: active step = amber pulse, verified = dark graphite with green border, pending = amber
      const badgeBg = isStepActive ? '#D9822B' : '#171B1F';
      const badgeBorder = isLastSeen ? '#D9822B' : isConfirmed ? '#16A34A' : '#DCDAD4';

      const sightingPin = L.divIcon({
        className: 'sighting-seq-pin',
        html: `
          <div style="
            background: ${badgeBg};
            color: #FFFFFF;
            border: 2px solid ${badgeBorder};
            width: 26px;
            height: 26px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            font-weight: 700;
            ${isStepActive ? 'transform: scale(1.2); transition: transform 0.2s;' : ''}
          ">
            ${idx + 1}
          </div>
          ${
            isLastSeen
              ? `
              <div style="
                position: absolute;
                top: -18px;
                left: 50%;
                transform: translateX(-50%);
                background: #D9822B;
                color: #FFFFFF;
                font-family: 'JetBrains Mono', monospace;
                font-size: 9px;
                font-weight: 700;
                padding: 1px 4px;
                border-radius: 2px;
                white-space: nowrap;
              ">
                LAST SEEN
              </div>
            `
              : ''
          }
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const sMarker = L.marker([cam.lat, cam.lng], { icon: sightingPin, zIndexOffset: isStepActive ? 1000 : 500 });
      sMarker.bindPopup(`
        <div style="font-family: 'Public Sans', sans-serif; font-size: 12px; line-height: 1.4;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #DCDAD4; padding-bottom: 4px; margin-bottom: 4px;">
            <strong style="font-family: 'JetBrains Mono', monospace; font-size: 12px;">STEP #${idx + 1}: ${sighting.id}</strong>
            <span style="font-size: 10px; font-weight: 700; color: #D9822B; font-family: 'JetBrains Mono', monospace;">
              ${sighting.confidence}% SCORE
            </span>
          </div>
          <div><strong>Location:</strong> ${cam.name} (${cam.id})</div>
          <div style="font-family: 'JetBrains Mono', monospace; color: #88857C; margin-top: 2px;">${formatIST(sighting.time)}</div>
          <div style="margin-top: 4px; font-size: 11px; color: #171B1F;"><strong>Reason:</strong> ${sighting.reason}</div>
          <div style="margin-top: 4px;">
            <span style="font-size: 10px; font-family: 'JetBrains Mono', monospace; padding: 2px 4px; border: 1px solid ${isConfirmed ? '#16A34A' : '#DCDAD4'}; color: ${isConfirmed ? '#16A34A' : '#D9822B'};">
              ${isConfirmed ? 'VERIFIED RECORD' : 'AWAITING REVIEW'}
            </span>
          </div>
        </div>
      `);
      layers.addLayer(sMarker);
    });

    // Auto-fit bounds if we have valid route coordinates
    if (routeCoords.length > 0) {
      const bounds = L.latLngBounds(routeCoords);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [cameras, orderedSightings, activeStepIndex, isReplaying, lastConfirmedSighting]);

  if (isLoading) {
    return (
      <div className="bg-[#FFFFFF] border border-[#DCDAD4] rounded-[4px] p-8 text-center text-[#171B1F]">
        <div className="w-6 h-6 border-2 border-[#171B1F] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <div className="font-semibold text-sm">Loading GIS route telemetry...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-left">
      {/* Top Controls Bar */}
      <div className="bg-[#FFFFFF] border border-[#DCDAD4] rounded-[4px] p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#171B1F]" />
            <h2 className="text-sm font-semibold text-[#171B1F] tracking-wide uppercase">
              Chronological Route Reconstruction GIS
            </h2>
            <span className="text-xs font-mono px-1.5 py-0.5 rounded-[2px] bg-[#F4F3EF] border border-[#DCDAD4] text-[#171B1F]">
              PUNE CITY SAMPLE GRID
            </span>
          </div>
          <p className="text-xs text-[#88857C]">
            Correlates verified sightings into sequential transit vectors with computed arterial velocity metrics.
          </p>
        </div>

        {/* Case Switcher & Replay Button */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          <div className="flex items-center gap-1 bg-[#F4F3EF] p-1 rounded-[4px] border border-[#DCDAD4]">
            {cases.map((c) => (
              <button
                key={c.caseId}
                onClick={() => {
                  onSelectCase(c.caseId);
                }}
                className={`px-2.5 py-1 rounded-[2px] text-xs font-medium transition-colors cursor-pointer ${
                  c.caseId === selectedCase.caseId
                    ? 'bg-[#171B1F] text-white'
                    : 'text-[#6F7379] hover:text-[#171B1F]'
                }`}
              >
                {c.type === 'vehicle' ? 'Vehicle: MH 12 AB 1234' : 'Missing: CASE-2026-002'}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setIsReplaying(!isReplaying);
            }}
            disabled={orderedSightings.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-[#171B1F] text-white font-medium text-xs hover:bg-[#252B32] transition-colors cursor-pointer disabled:opacity-50"
          >
            {isReplaying ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 text-[#D9822B]" />
                <span>Stop Replay</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-[#D9822B]" />
                <span>Replay Movement</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Container: Map (8 cols) + Chronological Timeline (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Leaflet Map Canvas (8 cols) */}
        <div className="lg:col-span-8 bg-[#FFFFFF] rounded-[4px] border border-[#DCDAD4] p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#DCDAD4] text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#171B1F]">{selectedCase.title}</span>
              <span className="font-mono text-xs text-[#88857C]">({orderedSightings.length} chronological points)</span>
            </div>
            {lastConfirmedSighting && (
              <span className="font-mono text-xs text-[#D9822B]">
                Last Confirmed: {formatIST(lastConfirmedSighting.time)}
              </span>
            )}
          </div>

          {/* Real Leaflet Map DIV */}
          <div
            ref={mapContainerRef}
            className="w-full h-[520px] rounded-[4px] border border-[#DCDAD4] z-10"
          />

          <div className="flex items-center justify-between pt-2 mt-2 border-t border-[#DCDAD4] text-xs text-[#88857C]">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" /> Camera Online
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" /> Camera Offline
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#D9822B]" /> Reconstructed Route
              </span>
            </div>
            <span className="font-mono text-xs">OpenStreetMap EPSG:3857</span>
          </div>
        </div>

        {/* Chronological Timeline Sidebar (4 cols) */}
        <div className="lg:col-span-4 bg-[#FFFFFF] rounded-[4px] border border-[#DCDAD4] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-[#DCDAD4] mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#D9822B]" />
                <h3 className="font-semibold text-[#171B1F] text-xs uppercase tracking-wide">
                  Movement Chronology ({orderedSightings.length})
                </h3>
              </div>
              <span className="text-xs font-mono text-[#88857C]">Time Ascending</span>
            </div>

            {orderedSightings.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#88857C] border border-dashed border-[#DCDAD4] rounded-[4px]">
                No active sightings linked to this case file.
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {orderedSightings.map((sighting, idx) => {
                  const cam = cameras.find((c) => c.id === sighting.cameraId);
                  const isConfirmed = sighting.decision === 'confirmed';
                  const isCurrentStep = activeStepIndex === idx;

                  // Telemetry with previous sighting
                  let legMetrics = null;
                  if (idx > 0) {
                    const prevSighting = orderedSightings[idx - 1];
                    const prevCam = cameras.find((c) => c.id === prevSighting.cameraId);
                    if (cam && prevCam) {
                      legMetrics = computeLegMetrics(prevSighting, sighting, cameras);
                    }
                  }

                  return (
                    <div key={sighting.id} className="space-y-1">
                      {/* Leg Speed Telemetry Indicator between nodes */}
                      {legMetrics && (
                        <div className="pl-6 py-1 flex items-center gap-2 text-xs font-mono text-[#88857C]">
                          <Navigation className="w-3 h-3 text-[#D9822B] shrink-0" />
                          <span>{legMetrics.distance} km in {legMetrics.minutes} mins</span>
                          <span>·</span>
                          <span className="font-bold text-[#171B1F]">{legMetrics.speed} km/h</span>
                          <span className={`text-xs ${legMetrics.label.startsWith('Plausible')?'text-[#16A34A]':'text-[#D9822B]'}`}>{legMetrics.label}</span>
                        </div>
                      )}

                      {/* Sighting Timeline Card */}
                      <div
                        className={`rounded-[4px] border p-2.5 transition-colors text-left ${
                          isCurrentStep
                            ? 'bg-[#FFFBEB] border-[#D9822B]'
                            : 'bg-[#FAFAF8] border-[#DCDAD4] hover:border-[#171B1F]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded-[2px] bg-[#171B1F] text-white flex items-center justify-center font-mono text-xs font-bold shrink-0">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <div className="font-mono text-xs font-semibold text-[#171B1F] truncate">
                                {sighting.plateNumber ? formatPlateWithSpaces(sighting.plateNumber) : (sighting.personDescription || sighting.id)}
                              </div>
                              <div className="text-xs text-[#88857C] truncate flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span>{cam?.name || sighting.cameraId}</span>
                              </div>
                            </div>
                          </div>

                          <span className="font-mono text-xs text-[#D9822B] font-semibold shrink-0">
                            {sighting.confidence}%
                          </span>
                        </div>

                        <div className="text-[12px] font-mono text-[#88857C] mt-1.5">
                          {formatIST(sighting.time)}
                        </div>

                        <div className="text-[12px] text-[#6F7379] line-clamp-2 mt-1 leading-relaxed">
                          {sighting.reason}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-[#DCDAD4] mt-2 text-xs">
                          <span
                            className={`text-xs font-mono uppercase px-1.5 py-0.5 rounded-[2px] border ${
                              isConfirmed
                                ? 'bg-white border-[#16A34A] text-[#16A34A]'
                                : 'bg-white border-[#DCDAD4] text-[#D9822B]'
                            }`}
                          >
                            {isConfirmed ? 'VERIFIED' : 'PENDING'}
                          </span>

                          <button
                            onClick={() => {
                              onOpenEvidence(sighting.id);
                            }}
                            className="text-xs font-medium text-[#171B1F] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Inspect</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#DCDAD4] mt-3 text-xs text-[#88857C]">
            Locations are real Maharashtra coordinates; camera feeds are simulated in this prototype.
          </div>
        </div>
      </div>
    </div>
  );
};
