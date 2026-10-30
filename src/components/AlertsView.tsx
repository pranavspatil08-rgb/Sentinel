import { EvidenceFrame } from './EvidenceFrame';
import React, { useState } from 'react';
import { WatchlistItem, AlertItem, Sighting, SightingType, formatPlateWithSpaces } from '../data/sentinelData';
import { 
  Bell, 
  Car, 
  User, 
  Plus, 
  Trash2, 
  MapPin, 
  Clock, 
  Zap,
  CheckCircle2,
  XCircle,
  FolderArchive
} from 'lucide-react';

interface AlertsViewProps {
  watchlist: WatchlistItem[];
  alerts: AlertItem[];
  sightings?: Sighting[];
  userRole: 'Admin' | 'Investigator';
  onAcknowledgeAlert: (alertId: string) => void;
  onSimulateSighting: () => void;
  onAddWatchlist?: (item: { type: SightingType; target: string; description: string; priority: 'High' | 'Medium' }) => void;
  onRemoveWatchlist?: (id: string) => void;
  onOpenEvidence: (sightingId: string) => void;
  isLoading?: boolean;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  watchlist,
  alerts,
  sightings = [],
  userRole,
  onAcknowledgeAlert,
  onSimulateSighting,
  onAddWatchlist,
  onRemoveWatchlist,
  onOpenEvidence,
  isLoading = false,
}) => {
  const [newTarget, setNewTarget] = useState('');
  const [newType, setNewType] = useState<SightingType>('vehicle');
  const [newDesc, setNewDesc] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-[#FFFFFF] border border-[#DCDAD4] rounded-[4px] p-8 text-center text-[#171B1F]">
        <div className="w-6 h-6 border-2 border-[#171B1F] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <div className="font-semibold text-sm">Loading CCTV target alerts queue...</div>
      </div>
    );
  }

  const activeAlerts = alerts.filter((a) => a.status === 'active');
  const ackAlerts = alerts.filter((a) => a.status === 'acknowledged');

  // Filter reviewed sightings for the compact "Recent decisions" table
  const reviewedSightings = sightings
    .filter((s) => s.decision !== 'pending')
    .sort((a, b) => {
      const timeA = a.decisionTime || a.time;
      const timeB = b.decisionTime || b.time;
      return new Date(timeB.replace(' ', 'T')).getTime() - new Date(timeA.replace(' ', 'T')).getTime();
    });

  const handleSimulate = async () => {
    setIsSimulating(true);
    await onSimulateSighting();
    setIsSimulating(false);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTarget.trim() || !onAddWatchlist) return;
    onAddWatchlist({
      type: newType,
      target: newTarget.trim(),
      description: newDesc.trim() || 'Active police target register entry',
      priority: 'High',
    });
    setNewTarget('');
    setNewDesc('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-4 text-left">
      {/* Top Banner & Operational Trigger */}
      <div className="bg-[#FFFFFF] border border-[#DCDAD4] rounded-[4px] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#D9822B]" />
            <h2 className="text-sm font-semibold text-[#171B1F] tracking-wide uppercase">
              CCTV Target Registry & Active Match Alerts
            </h2>
            <span className="text-xs font-mono px-1.5 py-0.5 rounded-[2px] bg-[#F4F3EF] border border-[#DCDAD4] text-[#171B1F]">
              REAL-TIME QUEUE
            </span>
          </div>
          <p className="text-xs text-[#88857C]">
            Optical registration recognition and appearance profile correlation against active police target registers.
          </p>
        </div>

        {/* Live Simulation Trigger Button */}
        <button
          onClick={handleSimulate}
          disabled={isSimulating}
          className="flex items-center gap-2 px-3.5 py-2 rounded-[4px] bg-[#D9822B] text-white font-medium text-xs hover:bg-[#C27324] transition-colors cursor-pointer disabled:opacity-50"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>{isSimulating ? 'Simulating Detection...' : 'Simulate Live CCTV Match'}</span>
        </button>
      </div>

      {/* Main Grid: Active Alerts (7 cols) + Watchlist Panel (5 cols) - Equal Height Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left Column: Alerts Queue (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-[#FFFFFF] rounded-[4px] border border-[#DCDAD4] p-4 h-full">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#DCDAD4] mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
                <h3 className="font-semibold text-[#171B1F] text-xs uppercase tracking-wide">
                  Active Match Alerts ({activeAlerts.length})
                </h3>
              </div>
              <span className="text-xs font-mono text-[#88857C]">Requires Operator Triage</span>
            </div>

            {activeAlerts.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#88857C] border border-dashed border-[#DCDAD4] rounded-[4px]">
                No pending match alerts in active queue. All notifications acknowledged.
              </div>
            ) : (
              <div className="space-y-3">
                {activeAlerts.map((alert) => {
                  const displayTarget = alert.type === 'vehicle' ? formatPlateWithSpaces(alert.target) : alert.target;

                  return (
                    <div
                      key={alert.id}
                      className="rounded-[4px] border border-[#DCDAD4] p-3 flex flex-col sm:flex-row gap-3 bg-[#FAFAF8] hover:border-[#171B1F] transition-colors"
                    >
                      {/* Dark CCTV frame with grain and simulated footage tag */}
                      <div className="w-full sm:w-40 aspect-video relative bg-[#0E1217] rounded-[2px] border border-[#DCDAD4] overflow-hidden shrink-0">
                        <EvidenceFrame sighting={sightings.find(x=>x.id===alert.sightingId)!} />
                      </div>

                      <div className="flex-1 flex flex-col justify-between space-y-2 min-w-0">
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-mono font-semibold text-xs text-[#171B1F] bg-white border border-[#DCDAD4] px-1 rounded-[2px]">
                                {alert.id}
                              </span>
                              <span className="font-mono font-semibold text-xs text-[#171B1F] truncate">
                                {displayTarget}
                              </span>
                            </div>
                            <span className="px-1.5 py-0.5 rounded-[2px] bg-white border border-[#D9822B] text-[#D9822B] text-xs font-mono font-semibold shrink-0">
                              {alert.confidence}% Match
                            </span>
                          </div>

                          <div className="text-xs text-[#88857C] flex items-center gap-2 mt-1">
                            <span className="font-mono">{alert.cameraId}</span>
                            <span>·</span>
                            <span className="truncate">{alert.location}</span>
                          </div>

                          <div className="text-[12px] font-mono text-[#88857C] mt-0.5">
                            {alert.time}
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DCDAD4]">
                          <button
                            onClick={() => {
                              onOpenEvidence(alert.sightingId);
                            }}
                            className="px-2.5 py-1 rounded-[4px] text-xs font-medium border border-[#DCDAD4] bg-[#FFFFFF] text-[#171B1F] hover:bg-[#F4F3EF] cursor-pointer"
                          >
                            Examine Frame
                          </button>
                          <button
                            onClick={() => {
                              onAcknowledgeAlert(alert.id);
                            }}
                            className="px-2.5 py-1 rounded-[4px] text-xs font-medium bg-[#171B1F] text-white hover:bg-[#252B32] cursor-pointer"
                          >
                            Acknowledge
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Acknowledged items summary */}
          {ackAlerts.length > 0 && (
            <div className="pt-3 border-t border-[#DCDAD4] mt-3 flex items-center justify-between text-xs text-[#88857C]">
              <span>Acknowledged notifications: {ackAlerts.length}</span>
              <span className="font-mono">Cleared from dispatch banner</span>
            </div>
          )}
        </div>

        {/* Right Column: Watchlist Registry Panel (5 cols) - Equal Height */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-[#FFFFFF] rounded-[4px] border border-[#DCDAD4] p-4 h-full">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#DCDAD4] mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#171B1F]" />
                <h3 className="font-semibold text-[#171B1F] text-xs uppercase tracking-wide">
                  Target Watchlist Registry ({watchlist.length})
                </h3>
              </div>
              {userRole === 'Admin' && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-1 px-2 py-1 rounded-[4px] text-xs font-medium bg-[#171B1F] text-white hover:bg-[#252B32] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Target</span>
                </button>
              )}
            </div>

            {watchlist.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#88857C] border border-dashed border-[#DCDAD4] rounded-[4px]">
                Watchlist is empty. No automated triggers active.
              </div>
            ) : (
              <div className="space-y-3">
                {watchlist.map((item) => {
                  const displayTarget = item.type === 'vehicle' ? formatPlateWithSpaces(item.target) : item.target;

                  return (
                    <div
                      key={item.id}
                      className="border border-[#DCDAD4] rounded-[4px] p-3 bg-[#FAFAF8] text-left hover:border-[#171B1F] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-[#171B1F] bg-white border border-[#DCDAD4] px-1 rounded-[2px]">
                              {item.id}
                            </span>
                            <span className="font-mono text-xs font-semibold text-[#171B1F] truncate">
                              {displayTarget}
                            </span>
                          </div>
                          <p className="text-xs text-[#6F7379] mt-1.5 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-mono uppercase px-1.5 py-0.5 rounded-[2px] border shrink-0 ${
                            item.priority === 'High'
                              ? 'bg-white border-[#DC2626] text-[#DC2626]'
                              : 'bg-white border-[#DCDAD4] text-[#171B1F]'
                          }`}
                        >
                          {item.priority}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#DCDAD4] mt-2 text-xs text-[#88857C]">
                        <span className="font-mono text-xs">{item.addedAt}</span>
                        {userRole === 'Admin' && onRemoveWatchlist && (
                          <button
                            onClick={() => {
                              onRemoveWatchlist(item.id);
                            }}
                            className="text-[#DC2626] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#DCDAD4] mt-3 text-xs text-[#88857C]">
            Target entries automatically trigger alerts when optical confidence exceeds threshold.
          </div>
        </div>
      </div>

      {/* COMPACT RECENT DECISIONS TABLE (Fills space below cards) */}
      <div className="bg-[#FFFFFF] rounded-[4px] border border-[#DCDAD4] p-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#DCDAD4] mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[#171B1F] text-xs uppercase tracking-wide">
              Recent Operational Decisions Log
            </h3>
            <span className="text-xs font-mono px-1.5 py-0.5 rounded-[2px] border border-[#DCDAD4] text-[#88857C]">
              {reviewedSightings.length} Human-Reviewed Records
            </span>
          </div>
          <span className="text-xs font-mono text-[#88857C]">Review Archive</span>
        </div>

        {reviewedSightings.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#88857C]">
            No verified or dismissed decision records logged yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAFAF8] border-b border-[#DCDAD4] text-[#88857C] font-mono uppercase text-xs">
                <tr>
                  <th className="py-2.5 px-3">Sighting ID</th>
                  <th className="py-2.5 px-3">Target Registration / Profile</th>
                  <th className="py-2.5 px-3">Camera Node</th>
                  <th className="py-2.5 px-3">Decision</th>
                  <th className="py-2.5 px-3">Reviewing Officer</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Operational Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCDAD4]">
                {reviewedSightings.map((s) => {
                  const isConfirmed = s.decision === 'confirmed';
                  const displayTarget = s.plateNumber ? formatPlateWithSpaces(s.plateNumber) : (s.personDescription || s.id);

                  return (
                    <tr key={s.id} className="hover:bg-[#FAFAF8] transition-colors">
                      <td className="py-2 px-3 font-mono text-[#171B1F] font-semibold">
                        <button
                          onClick={() => onOpenEvidence(s.id)}
                          className="hover:underline hover:text-[#D9822B] cursor-pointer"
                        >
                          {s.id}
                        </button>
                      </td>
                      <td className="py-2 px-3 font-mono text-[#171B1F]">
                        {displayTarget}
                      </td>
                      <td className="py-2 px-3 font-mono text-[#88857C]">
                        {s.cameraId}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`text-xs font-mono uppercase px-1.5 py-0.5 rounded-[2px] border ${
                            isConfirmed
                              ? 'bg-white border-[#16A34A] text-[#16A34A]'
                              : 'bg-white border-[#DC2626] text-[#DC2626]'
                          }`}
                        >
                          {isConfirmed ? 'VERIFIED' : 'DISMISSED'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-[#171B1F]">
                        {s.decisionBy || 'Officer on duty'}
                      </td>
                      <td className="py-2 px-3 font-mono text-xs text-[#88857C] whitespace-nowrap">
                        {s.decisionTime || s.time}
                      </td>
                      <td className="py-2 px-3 text-[#6F7379] truncate max-w-xs">
                        {s.notes || s.reason}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Target Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#0E1217]/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#DCDAD4] rounded-[4px] p-6 max-w-md w-full text-left space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCDAD4]">
              <h3 className="font-semibold text-sm text-[#171B1F]">Add Watchlist Target</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#88857C] hover:text-[#171B1F] text-xs font-mono cursor-pointer"
              >
                ESC
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#171B1F] mb-1">
                  Target Category
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setNewType('vehicle')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-[4px] border ${
                      newType === 'vehicle'
                        ? 'bg-[#171B1F] text-white border-[#171B1F]'
                        : 'bg-white text-[#171B1F] border-[#DCDAD4]'
                    }`}
                  >
                    Vehicle (ANPR Plate)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType('person')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-[4px] border ${
                      newType === 'person'
                        ? 'bg-[#171B1F] text-white border-[#171B1F]'
                        : 'bg-white text-[#171B1F] border-[#DCDAD4]'
                    }`}
                  >
                    Person Appearance
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#171B1F] mb-1">
                  Target Identifier {newType === 'vehicle' ? '(e.g. MH 12 AB 1234)' : '(e.g. red jacket)'}
                </label>
                <input
                  type="text"
                  required
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  placeholder={newType === 'vehicle' ? 'MH 12 AB 1234' : 'red jacket'}
                  className="w-full bg-[#FFFFFF] border border-[#DCDAD4] rounded-[4px] px-3 py-2 text-xs font-mono text-[#171B1F] focus:outline-none focus:border-[#D9822B] focus:ring-1 focus:ring-[#D9822B]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#171B1F] mb-1">
                  Case Reference / Reason Note
                </label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Flagged in Maharashtra Police BOLO #5120..."
                  className="w-full bg-[#FFFFFF] border border-[#DCDAD4] rounded-[4px] px-3 py-2 text-xs text-[#171B1F] focus:outline-none focus:border-[#D9822B] focus:ring-1 focus:ring-[#D9822B]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DCDAD4]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-[4px] text-xs border border-[#DCDAD4] text-[#171B1F] hover:bg-[#F4F3EF] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-[4px] text-xs font-medium bg-[#171B1F] text-white hover:bg-[#252B32] cursor-pointer"
                >
                  Save to Watchlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
