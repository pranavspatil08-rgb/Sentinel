import React, { useState } from 'react';
import { ActivityLogItem } from '../data/sentinelData';
import { FileText, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';

interface ActivityLogViewProps {
  activityLog: ActivityLogItem[];
  userRole?: 'Admin' | 'Investigator';
  onResetDemoData?: () => Promise<void> | void;
  isLoading?: boolean;
}

export const ActivityLogView: React.FC<ActivityLogViewProps> = ({ 
  activityLog, 
  userRole = 'Admin',
  onResetDemoData,
  isLoading = false 
}) => {
  const [filter, setFilter] = useState<'ALL' | 'CONFIRM' | 'REJECT'>('ALL');
  const [isResetting, setIsResetting] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-[#FFFFFF] border border-[#DCDAD4] rounded-[4px] p-8 text-center text-[#171B1F]">
        <div className="w-6 h-6 border-2 border-[#171B1F] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <div className="font-semibold text-sm">Loading audit trail records...</div>
      </div>
    );
  }

  const filteredLog = activityLog.filter((item) => {
    if (filter === 'CONFIRM') return item.action.includes('CONFIRM');
    if (filter === 'REJECT') return item.action.includes('REJECT');
    return true;
  });

  const handleReset = async () => {
    if (!onResetDemoData) return;
    const confirmReset = window.confirm('Reset all demonstration data to the baseline operational state?');
    if (!confirmReset) return;

    setIsResetting(true);
    await onResetDemoData();
    setIsResetting(false);
  };

  return (
    <div className="space-y-4 text-left">
      {/* Header & Controls */}
      <div className="bg-[#FFFFFF] border border-[#DCDAD4] rounded-[4px] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#171B1F]" />
            <h2 className="text-sm font-semibold text-[#171B1F] tracking-wide uppercase">
              Operational Activity & Decision Audit Trail
            </h2>
            <span className="text-xs font-mono px-1.5 py-0.5 rounded-[2px] bg-[#F4F3EF] border border-[#DCDAD4] text-[#171B1F]">
              {userRole === 'Admin' ? 'FULL AUDIT' : 'OWN ENTRIES'}
            </span>
          </div>
          <p className="text-xs text-[#88857C]">
            Persistent system audit log recording all operator queries, sighting confirmations, and case updates.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {userRole === 'Admin' && <button onClick={async()=>{const r=await fetch('/api/audit/export');if(r.ok){const a=document.createElement('a');a.href=URL.createObjectURL(await r.blob());a.download='sentinel-audit.csv';a.click();URL.revokeObjectURL(a.href)}}} className="px-3 py-1.5 text-xs border rounded">Export audit CSV</button>}
          {/* Filter Buttons */}
          <div className="flex items-center gap-1 bg-[#F4F3EF] p-1 rounded-[4px] border border-[#DCDAD4]">
            <button
              onClick={() => {
                setFilter('ALL');
              }}
              className={`px-2.5 py-1 rounded-[2px] text-xs font-medium transition-colors cursor-pointer ${
                filter === 'ALL'
                  ? 'bg-[#171B1F] text-white'
                  : 'text-[#6F7379] hover:text-[#171B1F]'
              }`}
            >
              All ({activityLog.length})
            </button>
            <button
              onClick={() => {
                setFilter('CONFIRM');
              }}
              className={`px-2.5 py-1 rounded-[2px] text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                filter === 'CONFIRM'
                  ? 'bg-[#171B1F] text-white'
                  : 'text-[#6F7379] hover:text-[#171B1F]'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-[#16A34A]" />
              <span>Verified</span>
            </button>
            <button
              onClick={() => {
                setFilter('REJECT');
              }}
              className={`px-2.5 py-1 rounded-[2px] text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                filter === 'REJECT'
                  ? 'bg-[#171B1F] text-white'
                  : 'text-[#6F7379] hover:text-[#171B1F]'
              }`}
            >
              <XCircle className="w-3 h-3 text-[#DC2626]" />
              <span>Dismissed</span>
            </button>
          </div>

          {/* Small "Reset demo data" Button (Requested) */}
          {onResetDemoData && (
            <button
              onClick={handleReset}
              disabled={isResetting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] text-xs font-medium border border-[#DCDAD4] bg-[#FFFFFF] text-[#171B1F] hover:bg-[#F4F3EF] transition-colors cursor-pointer disabled:opacity-50"
              title="Reset sample sightings, alerts, and cases back to initial baseline"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#D9822B]" />
              <span>{isResetting ? 'Resetting...' : 'Reset demo data'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Structured Police Log Table */}
      <div className="bg-[#FFFFFF] rounded-[4px] border border-[#DCDAD4] overflow-hidden">
        {filteredLog.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#88857C]">
            No audit log entries found matching current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAFAF8] border-b border-[#DCDAD4] text-[#88857C] font-mono uppercase text-xs">
                <tr>
                  <th className="py-2.5 px-3 w-44">Timestamp</th>
                  <th className="py-2.5 px-3 w-48">Operator</th>
                  <th className="py-2.5 px-3 w-36">Action Code</th>
                  <th className="py-2.5 px-3">Operational Decision Details</th>
                  <th className="py-2.5 px-3 w-28 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCDAD4]">
                {filteredLog.map((item) => {
                  const isConfirm = item.action.includes('CONFIRM');
                  const isReject = item.action.includes('REJECT');

                  return (
                    <tr key={item.id} className="hover:bg-[#FAFAF8] transition-colors">
                      {/* Timestamp */}
                      <td className="py-2.5 px-3 font-mono text-xs text-[#88857C] tabular-nums whitespace-nowrap">
                        {item.timestamp}
                      </td>

                      {/* Operator Profile */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#171B1F]">{item.user}</span>
                          <span className="text-xs font-mono px-1.5 py-0.2 rounded-[2px] bg-[#F4F3EF] text-[#171B1F] border border-[#DCDAD4]">
                            {item.role}
                          </span>
                        </div>
                      </td>

                      {/* Action Type */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="text-xs font-mono font-medium text-[#171B1F]">
                          {item.action}
                        </span>
                      </td>

                      {/* Decision Details */}
                      <td className="py-2.5 px-3 text-[#171B1F] leading-relaxed">
                        {item.details}
                      </td>

                      {/* Verification Status */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        {isConfirm ? (
                          <span className="text-xs font-mono px-1.5 py-0.5 rounded-[2px] border border-[#16A34A] text-[#16A34A] bg-white uppercase">
                            Verified
                          </span>
                        ) : isReject ? (
                          <span className="text-xs font-mono px-1.5 py-0.5 rounded-[2px] border border-[#DC2626] text-[#DC2626] bg-white uppercase">
                            Dismissed
                          </span>
                        ) : (
                          <span className="text-xs font-mono px-1.5 py-0.5 rounded-[2px] border border-[#DCDAD4] text-[#88857C] bg-white uppercase">
                            Logged
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
