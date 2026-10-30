import { EvidenceFrame } from './EvidenceFrame';
import React, { useState } from 'react';
import { Case, Sighting, Camera, formatPlateWithSpaces, formatIST } from '../data/sentinelData';
import { 
  FolderArchive, 
  Car, 
  User, 
  MapPin, 
  Clock, 
  ArrowRight, 
  Plus, 
  Download, 
  Printer, 
  X,
  Eye
} from 'lucide-react';

interface CasesViewProps {
  cases: Case[];
  sightings: Sighting[];
  cameras: Camera[];
  userRole: 'Admin' | 'Investigator';
  onSelectCaseForMap: (caseId: string) => void;
  onOpenEvidence: (sightingId: string) => void;
  onUpdateCase: (caseId: string, updates: Partial<Case>) => void;
  onExportCase?: (caseId: string) => void;
  isLoading?: boolean;
}

export const CasesView: React.FC<CasesViewProps> = ({
  cases,
  sightings,
  cameras,
  userRole,
  onSelectCaseForMap,
  onOpenEvidence,
  onUpdateCase,
  onExportCase,
  isLoading = false,
}) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>(cases[0]?.caseId || '');
  const [showAddSightingModal, setShowAddSightingModal] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-[#FFFFFF] border border-[#DCDAD4] rounded-[4px] p-8 text-center text-[#171B1F]">
        <div className="w-6 h-6 border-2 border-[#171B1F] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <div className="font-semibold text-sm">Loading investigation dossiers...</div>
      </div>
    );
  }

  const selectedCase = cases.find((c) => c.caseId === selectedCaseId) || cases[0];

  // Linked sightings for selected case
  const linkedSightings = sightings.filter((s) => selectedCase && selectedCase.linkedSightingIds.includes(s.id));
  // Unlinked candidate sightings
  const unlinkedSightings = sightings.filter((s) => selectedCase && !selectedCase.linkedSightingIds.includes(s.id));

  const toggleStatus = () => {
    if (!selectedCase) return;
    const nextStatus = selectedCase.status === 'Open' ? 'Closed' : 'Open';
    onUpdateCase(selectedCase.caseId, { status: nextStatus });
  };

  const handleSaveNotes = () => {
    if (!selectedCase) return;
    onUpdateCase(selectedCase.caseId, { notes: editNotes });
    setIsEditingNotes(false);
  };

  const handleAddSightingToCase = (sightingId: string) => {
    if (!selectedCase) return;
    const updated = [...selectedCase.linkedSightingIds, sightingId];
    onUpdateCase(selectedCase.caseId, { linkedSightingIds: updated });
    setShowAddSightingModal(false);
  };

  const handleRemoveSightingFromCase = (sightingId: string) => {
    if (!selectedCase) return;
    const updated = selectedCase.linkedSightingIds.filter((id) => id !== sightingId);
    onUpdateCase(selectedCase.caseId, { linkedSightingIds: updated });
  };

  return (
    <div className="space-y-4 text-left">
      {/* Top Banner */}
      <div className="bg-[#FFFFFF] border border-[#DCDAD4] rounded-[4px] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[4px] bg-[#171B1F] flex items-center justify-center text-white shrink-0">
            <FolderArchive className="w-4 h-4 text-[#D9822B]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#171B1F] tracking-wide uppercase">
              Investigative Case Management Dossiers
            </h2>
            <p className="text-xs text-[#88857C]">
              Correlate multiple CCTV sightings into formal police case records, reconstruct transit vectors, and export evidence packages.
            </p>
          </div>
        </div>

        {/* Action Link to Map */}
        {selectedCase && (
          <button
            onClick={() => {
              onSelectCaseForMap(selectedCase.caseId);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-[#171B1F] text-white font-medium text-xs hover:bg-[#252B32] transition-colors cursor-pointer shrink-0"
          >
            <span>Reconstruct Route on Map</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#D9822B]" />
          </button>
        )}
      </div>

      {/* Grid: Case List (4 cols) + Case Dossier Detail (8 cols) - Equal Height Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left Column: Cases Roster (4 cols) */}
        <div className="lg:col-span-4 bg-[#FFFFFF] rounded-[4px] border border-[#DCDAD4] p-4 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-[#DCDAD4] mb-3">
              <span className="font-semibold text-[#171B1F] text-xs uppercase tracking-wide">
                Case Roster ({cases.length})
              </span>
              <span className="text-xs font-mono text-[#88857C]">Maharashtra Police</span>
            </div>

            {cases.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#88857C] border border-dashed border-[#DCDAD4] rounded-[4px]">
                No case dossiers registered in system.
              </div>
            ) : (
              <div className="space-y-2">
                {cases.map((c) => {
                  const isSelected = selectedCase && c.caseId === selectedCase.caseId;
                  const isOpen = c.status === 'Open';

                  return (
                    <div
                      key={c.caseId}
                      onClick={() => {
                        setSelectedCaseId(c.caseId);
                        setEditNotes(c.notes);
                        setIsEditingNotes(false);
                      }}
                      className={`p-3 rounded-[4px] border transition-colors cursor-pointer text-left ${
                        isSelected
                          ? 'bg-[#F4F3EF] border-[#171B1F]'
                          : 'bg-[#FAFAF8] border-[#DCDAD4] hover:bg-[#F4F3EF]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-mono text-xs font-semibold text-[#171B1F] bg-white border border-[#DCDAD4] px-1 rounded-[2px]">
                          {c.caseId}
                        </span>
                        <span
                          className={`text-xs font-mono uppercase px-1.5 py-0.5 rounded-[2px] border ${
                            isOpen
                              ? 'bg-white border-[#16A34A] text-[#16A34A]'
                              : 'bg-white border-[#DCDAD4] text-[#88857C]'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>

                      <div className="font-semibold text-xs text-[#171B1F] line-clamp-1">
                        {c.title}
                      </div>

                      <div className="flex items-center justify-between text-xs text-[#88857C] mt-2 pt-2 border-t border-[#DCDAD4]">
                        <span className="font-mono">
                          Target: {formatPlateWithSpaces(c.searchCriteria)}
                        </span>
                        <span className="font-mono">
                          {c.linkedSightingIds.length} sightings
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#DCDAD4] mt-3 text-xs text-[#88857C]">
            Select a case to inspect evidence or link additional sightings.
          </div>
        </div>

        {/* Right Column: Case Dossier Detail (8 cols) */}
        <div className="lg:col-span-8 bg-[#FFFFFF] rounded-[4px] border border-[#DCDAD4] p-4 flex flex-col justify-between h-full">
          {!selectedCase ? (
            <div className="p-12 text-center text-xs text-[#88857C]">
              No case selected. Please select a case from the roster.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Dossier Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#DCDAD4]">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-semibold text-[#171B1F] bg-white border border-[#DCDAD4] px-1.5 py-0.5 rounded-[2px]">
                      {selectedCase.caseId}
                    </span>
                    <h3 className="font-bold text-sm text-[#171B1F]">
                      {selectedCase.title}
                    </h3>
                  </div>
                  <p className="text-xs font-mono text-[#88857C]">
                    Search Criteria: {formatPlateWithSpaces(selectedCase.searchCriteria)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Status Toggle */}
                  <button
                    onClick={toggleStatus}
                    className="px-2.5 py-1 rounded-[4px] text-xs font-medium border border-[#DCDAD4] bg-[#FFFFFF] text-[#171B1F] hover:bg-[#F4F3EF] cursor-pointer"
                  >
                    Status: {selectedCase.status}
                  </button>

                  {/* Export Button (Admin Only) */}
                  {userRole === 'Admin' && onExportCase && (
                    <button
                      onClick={() => {
                        onExportCase(selectedCase.caseId);
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] text-xs font-medium bg-[#171B1F] text-white hover:bg-[#252B32] cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-[#D9822B]" />
                      <span>Export Case Package</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Case Narrative Notes */}
              <div className="border border-[#DCDAD4] rounded-[4px] p-3 bg-[#FAFAF8] space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-[#171B1F]">
                  <span>Investigative Narrative Notes</span>
                  {!isEditingNotes ? (
                    <button
                      onClick={() => {
                        setEditNotes(selectedCase.notes);
                        setIsEditingNotes(true);
                      }}
                      className="text-xs text-[#171B1F] underline hover:text-[#D9822B] cursor-pointer"
                    >
                      Edit Notes
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsEditingNotes(false)}
                        className="text-xs text-[#88857C] hover:underline cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveNotes}
                        className="px-2 py-0.5 rounded-[2px] bg-[#171B1F] text-white text-xs font-medium cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>

                {!isEditingNotes ? (
                  <p className="text-xs text-[#6F7379] leading-relaxed">
                    {selectedCase.notes}
                  </p>
                ) : (
                  <textarea
                    rows={3}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full bg-white border border-[#DCDAD4] rounded-[4px] p-2 text-xs text-[#171B1F] focus:outline-none focus:border-[#D9822B]"
                  />
                )}
              </div>

              {/* Correlated Sightings Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#DCDAD4]">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-[#171B1F] uppercase tracking-wide">
                      Correlated Sightings ({linkedSightings.length})
                    </span>
                  </div>
                  <button
                    onClick={() => setShowAddSightingModal(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-xs font-medium bg-[#171B1F] text-white hover:bg-[#252B32] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Link Sighting</span>
                  </button>
                </div>

                {linkedSightings.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#88857C] border border-dashed border-[#DCDAD4] rounded-[4px]">
                    No camera sightings linked to this case dossier.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {linkedSightings.map((sighting, idx) => {
                      const cam = cameras.find((c) => c.id === sighting.cameraId);
                      const isConfirmed = sighting.decision === 'confirmed';
                      const displayTarget = sighting.plateNumber ? formatPlateWithSpaces(sighting.plateNumber) : (sighting.personDescription || sighting.id);

                      return (
                        <div
                          key={sighting.id}
                          className="border border-[#DCDAD4] rounded-[4px] p-3 bg-[#FAFAF8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-[#171B1F] transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Small evidence preview */}
                            <div className="w-16 h-10 relative bg-[#0E1217] rounded-[2px] border border-[#DCDAD4] overflow-hidden shrink-0">
                              <EvidenceFrame sighting={sighting} fit="cover" />
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-semibold text-[#171B1F]">
                                  {sighting.id}
                                </span>
                                <span className="font-mono font-medium text-xs text-[#171B1F] truncate">
                                  {displayTarget}
                                </span>
                              </div>
                              <div className="text-xs text-[#88857C] truncate flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span>{cam?.name || sighting.cameraId}</span>
                                <span>·</span>
                                <span className="font-mono">{formatIST(sighting.time)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
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
                              className="px-2 py-1 rounded-[2px] border border-[#DCDAD4] bg-white text-xs font-medium hover:bg-[#F4F3EF] cursor-pointer"
                            >
                              Inspect
                            </button>

                            <button
                              onClick={() => handleRemoveSightingFromCase(sighting.id)}
                              className="p-1 text-[#88857C] hover:text-[#DC2626] rounded-[2px] cursor-pointer"
                              title="Unlink sighting from case"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-[#DCDAD4] mt-3 text-xs text-[#88857C]">
            Exported packages compile linked camera evidence frames, officer notes, and cryptographic chain-of-custody metadata.
          </div>
        </div>
      </div>

      {/* Modal: Link Sighting to Case */}
      {showAddSightingModal && (
        <div className="fixed inset-0 bg-[#0E1217]/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#DCDAD4] rounded-[4px] p-6 max-w-lg w-full text-left space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCDAD4]">
              <h3 className="font-semibold text-sm text-[#171B1F]">
                Link Candidate Sighting to {selectedCase.caseId}
              </h3>
              <button
                onClick={() => setShowAddSightingModal(false)}
                className="text-[#88857C] hover:text-[#171B1F] text-xs font-mono cursor-pointer"
              >
                ESC
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2">
              {unlinkedSightings.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#88857C]">
                  All current sightings are already linked to this case.
                </div>
              ) : (
                unlinkedSightings.map((s) => (
                  <div
                    key={s.id}
                    className="p-2.5 rounded-[4px] border border-[#DCDAD4] flex items-center justify-between gap-3 bg-[#FAFAF8]"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-[#171B1F]">{s.id}</span>
                        <span className="font-mono text-xs text-[#171B1F]">
                          {s.plateNumber ? formatPlateWithSpaces(s.plateNumber) : s.personDescription}
                        </span>
                      </div>
                      <div className="text-[12px] font-mono text-[#88857C] mt-0.5">
                        {s.cameraId} · {s.time} ({s.confidence}%)
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddSightingToCase(s.id)}
                      className="px-2.5 py-1 rounded-[2px] bg-[#171B1F] text-white text-xs font-medium hover:bg-[#252B32] cursor-pointer shrink-0"
                    >
                      Link
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-[#DCDAD4] flex justify-end">
              <button
                onClick={() => setShowAddSightingModal(false)}
                className="px-3 py-1.5 rounded-[4px] text-xs border border-[#DCDAD4] text-[#171B1F] hover:bg-[#F4F3EF] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
