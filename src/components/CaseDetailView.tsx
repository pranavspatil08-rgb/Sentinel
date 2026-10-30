import { EvidenceFrame } from './EvidenceFrame';
import React, { useEffect, useState } from 'react';
import { Camera, Sighting, Case, UserSession, formatPlateWithSpaces, formatIST, normalizePlate } from '../data/sentinelData';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Printer, 
  Clock, 
  MapPin, 
  Camera as CameraIcon,
  Check
} from 'lucide-react';

interface CaseDetailViewProps {
  sightingId: string;
  cameras: Camera[];
  sightings: Sighting[];
  cases: Case[];
  userSession: UserSession;
  onBackToSearch: () => void;
  onUpdateDecision: (sightingId: string, decision: 'confirmed' | 'rejected', notes?: string) => void;
  onOpenMapForCase?: (caseId: string) => void;
  isLoading?: boolean;
}

export const CaseDetailView: React.FC<CaseDetailViewProps> = ({
  sightingId,
  cameras,
  sightings,
  cases,
  userSession,
  onBackToSearch,
  onUpdateDecision,
  onOpenMapForCase,
  isLoading = false,
}) => {
  const [officerNote, setOfficerNote] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [integrity, setIntegrity] = useState('');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [zoom, setZoom] = useState(1);
  const [showBox, setShowBox] = useState(true);
  const sighting = sightings.find((s) => s.id === sightingId) || sightings[0];
  useEffect(()=>{if(!sighting?.evidenceUrl){setIntegrity(sighting?.sampleImageUrl?'Illustrative bundled sample image (not verified evidence)':'No evidence image yet');return}fetch(`/api/evidence/${sighting.id}/verify`).then(r=>r.json()).then(d=>setIntegrity(d.verified?`SHA-256 ${sighting.evidenceSha256?.slice(0,12)}… (verified)`:'MISMATCH – file changed')).catch(()=>setIntegrity('Verification unavailable'))},[sighting?.id,sighting?.evidenceUrl,sighting?.evidenceSha256]);

  // Gemini AI Analysis State
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [aiResult, setAiResult] = useState<{
    recognizedText: string;
    confidence: number;
    explanation: string;
  } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="bg-[#FFFFFF] border border-[#DCDAD4] rounded-[4px] p-8 text-center text-[#171B1F]">
        <div className="w-6 h-6 border-2 border-[#171B1F] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <div className="font-semibold text-sm">Loading CCTV evidence examination package...</div>
      </div>
    );
  }

  if (!sighting) {
    return (
      <div className="bg-[#FFFFFF] border border-[#DCDAD4] rounded-[4px] p-12 text-center text-[#88857C] space-y-3">
        <div className="font-semibold text-sm text-[#171B1F]">Sighting Record Not Found</div>
        <p className="text-xs">The requested camera detection could not be located in active storage.</p>
        <button
          onClick={onBackToSearch}
          className="px-3 py-1.5 rounded-[4px] bg-[#171B1F] text-white text-xs font-medium cursor-pointer"
        >
          Return to Search
        </button>
      </div>
    );
  }

  const camera = cameras.find((c) => c.id === sighting.cameraId);
  const associatedCase = cases.find((c) => c.linkedSightingIds.includes(sighting.id));

  // Confirm or reject handler
  const handleDecision = (decision: 'confirmed' | 'rejected') => {
    if(decision==='rejected'&&!officerNote.trim()){setAiError('Enter a rejection reason before rejecting this sighting.');return}
    onUpdateDecision(sighting.id, decision, officerNote.trim() || undefined);
    const msg = `Decision logged: Sighting ${sighting.id} marked as ${decision.toUpperCase()} by ${userSession.username}.`;
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 5000);
  };

  // Real Server-side Gemini AI Call
  const handleRunAiAnalysis = async () => {
    setIsAnalyzingAi(true);
    setAiError(null);

    try {
      const res = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sightingId: sighting.id,
          type: sighting.type,
          description: sighting.plateNumber || sighting.personDescription,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setAiError(data.error || 'AI optical analysis currently unavailable. Please review manually.');
      } else {
        setAiResult(data.suggestion);
      }
    } catch {
      setAiError('Network error communicating with analysis endpoint. Forensic record intact.');
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  const isConfirmed = sighting.decision === 'confirmed';
  const isRejected = sighting.decision === 'rejected';
  const displayPlate = sighting.plateNumber ? formatPlateWithSpaces(sighting.plateNumber) : null;

  return (
    <div className="space-y-4 text-left">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#FFFFFF] rounded-[4px] border border-[#DCDAD4] print:hidden">
        <button
          onClick={() => {
            onBackToSearch();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-[#FFFFFF] text-[#171B1F] hover:bg-[#F4F3EF] border border-[#DCDAD4] text-xs font-medium transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sightings Search</span>
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#88857C]">Evidence Dossier:</span>
          <span className="font-mono font-semibold text-[#171B1F]">{sighting.id}</span>
          {associatedCase && (
            <button
              onClick={() => onOpenMapForCase && onOpenMapForCase(associatedCase.caseId)}
              className="text-[#171B1F] underline hover:text-[#D9822B] font-mono ml-1 cursor-pointer"
            >
              (Linked to {associatedCase.caseId})
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-[#FFFFFF] text-[#171B1F] hover:bg-[#F4F3EF] border border-[#DCDAD4] text-xs font-medium cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Decision Notification Banner */}
      {actionNotice && (
        <div className="p-3 bg-[#F4F3EF] border border-[#DCDAD4] rounded-[4px] text-xs font-medium text-[#171B1F] flex items-center gap-2">
          <Check className="w-4 h-4 text-[#16A34A] shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Main Grid: Left Evidence Frame (7 cols) + Right Review & Model Telemetry (5 cols) - Equal Height Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left Column: CCTV Frame & Camera Information (7 cols) */}
        <div className="lg:col-span-7 bg-[#FFFFFF] rounded-[4px] border border-[#DCDAD4] p-4 flex flex-col justify-between h-full space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#DCDAD4] mb-3">
              <div className="flex items-center gap-2">
                <CameraIcon className="w-4 h-4 text-[#D9822B]" />
                <h3 className="font-semibold text-xs text-[#171B1F] uppercase tracking-wide">
                  Surveillance Frame Inspection
                </h3>
              </div>
              <span className="text-xs font-mono text-[#88857C]">
                {sighting.cameraId} · {formatIST(sighting.time)}
              </span>
            </div>

            <div className="w-full aspect-video relative bg-[#E8E8E8] rounded-[2px] border border-[#DCDAD4] overflow-hidden mb-3">
              <div style={{filter:`brightness(${brightness}%) contrast(${contrast}%)`,transform:`scale(${zoom})`,transformOrigin:'center'}} className="w-full h-full"><EvidenceFrame sighting={sighting} fit="contain" showBox={showBox} /></div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs mb-3"><label>Zoom <input aria-label="Zoom" type="range" min="1" max="3" step="0.1" value={zoom} onChange={e=>setZoom(Number(e.target.value))}/></label><label>Brightness <input aria-label="Brightness" type="range" min="50" max="150" value={brightness} onChange={e=>setBrightness(Number(e.target.value))}/></label><label>Contrast <input aria-label="Contrast" type="range" min="50" max="150" value={contrast} onChange={e=>setContrast(Number(e.target.value))}/></label><button onClick={()=>setShowBox(!showBox)} className="underline">{showBox?'Hide':'Show'} detection box</button>{sighting.evidenceUrl&&<a className="underline" href={`/api/evidence/${sighting.id}/file`} download>Download original</a>}<span className={integrity.startsWith('MISMATCH')?'text-[#DC2626]':'text-[#6F7379]'}>Integrity: {integrity}</span></div>

            {/* Reason Line Banner */}
            <div className="p-3 bg-[#FAFAF8] rounded-[4px] border border-[#DCDAD4] text-xs leading-relaxed space-y-1">
              <div className="font-semibold text-[#171B1F]">Match Correlation Reason:</div>
              <p className="text-[#6F7379]">{sighting.reason}</p>
            </div>

            {/* Camera Sensor Telemetry */}
            <div className="mt-4 p-3 bg-[#FAFAF8] rounded-[4px] border border-[#DCDAD4] text-xs space-y-2">
              <div className="flex items-center justify-between font-semibold text-[#171B1F]">
                <span>Monitoring Node Metadata</span>
                <span className="font-mono text-xs">{sighting.cameraId}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[#88857C]">Node Name: </span>
                  <span className="font-medium text-[#171B1F]">{camera?.name}</span>
                </div>
                <div>
                  <span className="text-[#88857C]">Status: </span>
                  <span className="font-mono text-[#16A34A] font-medium uppercase">{camera?.status}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[#88857C]">Location: </span>
                  <span className="text-[#171B1F]">{camera?.location}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[#88857C]">Optical Reliability: </span>
                  <span className="text-[#171B1F]">{camera?.reliability.grade} — {camera?.reliability.reason}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#DCDAD4] text-xs text-[#88857C]">
            Visual frame archived in Maharashtra Police evidence repository under custody token.
          </div>
        </div>

        {/* Right Column: Model Scoring, Gemini Optical Tool, & Verification Controls (5 cols) */}
        <div className="lg:col-span-5 bg-[#FFFFFF] rounded-[4px] border border-[#DCDAD4] p-4 flex flex-col justify-between h-full space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#DCDAD4] mb-3">
              <h3 className="font-semibold text-xs text-[#171B1F] uppercase tracking-wide">
                Model Match Telemetry
              </h3>
              <span className="font-mono text-xs font-bold text-[#D9822B]">
                {sighting.confidence}% Candidate Score
              </span>
            </div>

            {/* Target Profile Card */}
            <div className="p-3 bg-[#FAFAF8] rounded-[4px] border border-[#DCDAD4] space-y-1.5 mb-4 text-xs">
              <div className="text-[#88857C]">Target Subject / Vehicle:</div>
              <div className="font-mono text-sm font-bold text-[#171B1F]">
                {displayPlate || sighting.personDescription}
              </div>
              {sighting.rawPlateRead && (
                <div className="text-[12px] font-mono text-[#88857C]">
                  Raw Sensor Read: "{sighting.rawPlateRead}" (Confidence: {sighting.plateReadConfidence}%)
                </div>
              )}
            </div>

            {/* 3-Bar Confidence Metric Breakdown */}
            <div className="space-y-3 mb-4">
              <div className="text-xs font-semibold text-[#171B1F]">Model Metric Breakdown</div>

              {/* Optical Appearance */}
              <div>
                <div className="flex justify-between text-xs text-[#6F7379] mb-1">
                  <span>Visual & ANPR Read Quality</span>
                  <span className="font-mono font-medium text-[#171B1F]">{sighting.confidenceBreakdown.readOrAppearance}%</span>
                </div>
                <div className="w-full bg-[#E9E7E0] rounded-[2px] h-2 overflow-hidden">
                  <div
                    className="bg-[#171B1F] h-2 rounded-[2px]"
                    style={{ width: `${sighting.confidenceBreakdown.readOrAppearance}%` }}
                  />
                </div>
              </div>

              {/* Temporal Plausibility */}
              <div>
                <div className="flex justify-between text-xs text-[#6F7379] mb-1">
                  <span>Spatio-Temporal Plausibility</span>
                  <span className="font-mono font-medium text-[#171B1F]">{sighting.confidenceBreakdown.timePlausibility}%</span>
                </div>
                <div className="w-full bg-[#E9E7E0] rounded-[2px] h-2 overflow-hidden">
                  <div
                    className="bg-[#D9822B] h-2 rounded-[2px]"
                    style={{ width: `${sighting.confidenceBreakdown.timePlausibility}%` }}
                  />
                </div>
              </div>

              {/* Camera Sensor Quality */}
              <div>
                <div className="flex justify-between text-xs text-[#6F7379] mb-1">
                  <span>Camera Optical Calibration</span>
                  <span className="font-mono font-medium text-[#171B1F]">{sighting.confidenceBreakdown.cameraQuality}%</span>
                </div>
                <div className="w-full bg-[#E9E7E0] rounded-[2px] h-2 overflow-hidden">
                  <div
                    className="bg-[#88857C] h-2 rounded-[2px]"
                    style={{ width: `${sighting.confidenceBreakdown.cameraQuality}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Server-side Gemini AI Analysis Trigger */}
            <div className="p-3 bg-[#FAFAF8] rounded-[4px] border border-[#DCDAD4] space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#171B1F]">Optical AI Assistant</span>
                <button
                  onClick={handleRunAiAnalysis}
                  disabled={isAnalyzingAi}
                  className="flex items-center gap-1 px-2 py-1 rounded-[4px] bg-[#171B1F] text-white text-xs font-medium hover:bg-[#252B32] transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#D9822B]" />
                  <span>{isAnalyzingAi ? 'Analyzing...' : 'Run Gemini Analysis'}</span>
                </button>
              </div>

              {aiResult && (
                <div className="p-2.5 bg-white rounded-[2px] border border-[#DCDAD4] space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#171B1F]">{aiResult.recognizedText}</span>
                    <span className="font-mono text-[#D9822B] font-bold">{aiResult.confidence}% Conf</span>
                  </div>
                  <p className="text-[#6F7379] text-xs leading-relaxed">{aiResult.explanation}</p>
                  {sighting.plateNumber && normalizePlate(aiResult.recognizedText) !== normalizePlate(sighting.plateNumber) && <div className="p-2 bg-[#FFFBEB] border border-[#D9822B] text-[#9A5C12]">AI read differs from system read – review manually</div>}
                </div>
              )}

              {aiError && (
                <div className="p-2 bg-[#FEF2F2] border border-[#DC2626] rounded-[2px] text-xs text-[#DC2626]">
                  {aiError}
                </div>
              )}
            </div>

            {/* Officer Verification & Decision Controls */}
            <div className="space-y-3 pt-3 border-t border-[#DCDAD4]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#171B1F]">Officer Verification Decision</span>
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
                    ? 'VERIFIED'
                    : isRejected
                    ? 'DISMISSED'
                    : 'AWAITING DECISION'}
                </span>
              </div>

              <div>
                <label className="block text-xs text-[#88857C] mb-1">
                  Investigative Decision Note
                </label>
                <input
                  type="text"
                  value={officerNote}
                  onChange={(e) => setOfficerNote(e.target.value)}
                  placeholder="e.g. Visual match confirmed against CAD dispatch log..."
                  className="w-full bg-[#FFFFFF] border border-[#DCDAD4] rounded-[4px] px-3 py-1.5 text-xs text-[#171B1F] focus:outline-none focus:border-[#D9822B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => handleDecision('rejected')}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-[4px] border border-[#DCDAD4] bg-[#FFFFFF] text-[#DC2626] hover:bg-[#FEF2F2] hover:border-[#DC2626] font-medium text-xs transition-colors cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Dismiss Lead</span>
                </button>

                <button
                  onClick={() => handleDecision('confirmed')}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-[4px] bg-[#171B1F] text-white hover:bg-[#252B32] font-medium text-xs transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                  <span>Confirm Match</span>
                </button>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#DCDAD4] text-xs text-[#88857C]">
            Verified sightings are incorporated into the primary chronological movement route.
          </div>
        </div>
      </div>
    </div>
  );
};

