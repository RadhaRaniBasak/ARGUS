import React, { useState, useMemo } from 'react';
import { 
  X, 
  ShieldCheck, 
  Search, 
  Download, 
  FileText, 
  Clock, 
  User, 
  Lock, 
  CheckCircle2, 
  Filter,
  Check
} from 'lucide-react';
import { AuditLogEntry } from '../../types';
import { auditLogger } from '../../utils/security';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose }) => {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [copiedExport, setCopiedExport] = useState(false);

  const logs = useMemo(() => auditLogger.getLogs(), [isOpen]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        log.actor.toLowerCase().includes(search.toLowerCase()) ||
        log.targetDescription.toLowerCase().includes(search.toLowerCase()) ||
        log.targetId.toLowerCase().includes(search.toLowerCase()) ||
        log.complianceRule.toLowerCase().includes(search.toLowerCase());

      const matchesFilter = actionFilter === 'ALL' || log.action === actionFilter;
      return matchesSearch && matchesFilter;
    });
  }, [logs, search, actionFilter]);

  if (!isOpen) return null;

  const handleExportAuditCsv = () => {
    const headers = ['Log ID', 'Timestamp', 'Actor', 'Action', 'Target Type', 'Target ID', 'Description', 'HIPAA Rule'];
    const rows = filteredLogs.map(l => [
      l.id,
      `"${l.timestamp}"`,
      `"${l.actor}"`,
      l.action,
      l.targetType,
      l.targetId,
      `"${l.targetDescription}"`,
      `"${l.complianceRule}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ARGUS_HIPAA_Audit_Trail_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2500);
  };

  return (
    <div id="audit-modal-backdrop" className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div id="audit-modal-card" className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  HIPAA § 164.312(b) Audit Trail
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Tamper-Evident Session
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Immutable chronological log of all PHI accesses, voice dispatches, and EHR exports
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-b border-slate-100">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search audit trail by actor, patient ID, action, or HIPAA clause..."
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-sky-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:border-sky-500 font-medium"
            >
              <option value="ALL">All Event Types</option>
              <option value="DISPATCH_CALL">Dispatched AI Calls</option>
              <option value="READ_TRANSCRIPT">Read Transcripts</option>
              <option value="EXPORT_EHR">EHR / SOAP Exports</option>
              <option value="VIEW_PATIENT">Viewed Patient Charts</option>
              <option value="LOCK_TERMINAL">Workstation Locks</option>
            </select>

            <button
              onClick={handleExportAuditCsv}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              {copiedExport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
              <span>{copiedExport ? 'Exported' : 'Export Audit CSV'}</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2 space-y-2 pr-1">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No audit records matching your criteria.
            </div>
          ) : (
            filteredLogs.map((entry) => (
              <div 
                key={entry.id}
                className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[10px] text-slate-400 font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      {entry.id}
                    </span>
                    <span className="font-semibold text-slate-900">{entry.actor}</span>
                    <span className="text-[10px] text-slate-400 font-mono">• {entry.timestamp}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      entry.action === 'DISPATCH_CALL'
                        ? 'bg-sky-50 text-sky-700 border border-sky-200'
                        : entry.action === 'EXPORT_EHR'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : entry.action === 'LOCK_TERMINAL'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {entry.action.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs">
                    {entry.targetDescription}
                  </p>
                </div>

                <div className="sm:text-right shrink-0">
                  <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 font-medium inline-block">
                    {entry.complianceRule}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-mono text-[11px]">Audit Storage: Ephemeral Active Session</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Close Audit Log
          </button>
        </div>
      </div>
    </div>
  );
};
