import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  MessageSquare, 
  ChevronRight, 
  Download,
  PhoneCall
} from 'lucide-react';
import { CallRecord, CallType, CallStatus } from '../../types';
import { phiMask, auditLogger } from '../../utils/security';

interface CallHistoryTableProps {
  calls: CallRecord[];
  onSelectCall: (call: CallRecord) => void;
  onInitiateCall: (patientId?: string, callType?: CallType) => void;
  isPhiMasked?: boolean;
}

export const CallHistoryTable: React.FC<CallHistoryTableProps> = ({
  calls,
  onSelectCall,
  onInitiateCall,
  isPhiMasked = false
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | CallType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | string>('all');

  const filteredCalls = useMemo(() => {
    return calls.filter(call => {
      const matchesSearch = 
        call.patientName.toLowerCase().includes(search.toLowerCase()) ||
        call.doctorName.toLowerCase().includes(search.toLowerCase()) ||
        call.patientPhone.includes(search);

      const matchesType = typeFilter === 'all' || call.callType === typeFilter;
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'confirmed' && call.outcome.status === 'confirmed') ||
        (statusFilter === 'rescheduled' && call.outcome.status === 'rescheduled') ||
        (statusFilter === 'flagged' && call.outcome.status === 'flagged');

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [calls, search, typeFilter, statusFilter]);

  const handleExportCsv = () => {
    auditLogger.log(
      'EXPORT_RECORDS',
      'CALL_RECORD',
      'bulk',
      `Exported ${filteredCalls.length} call history logs to CSV`,
      'HIPAA § 164.312(b) Audit Controls'
    );

    let csv = 'Call ID,Patient Name,Phone,Doctor,Call Type,Status,Duration (s),Timestamp,Notes\n';
    filteredCalls.forEach(c => {
      csv += `"${c.id}","${c.patientName}","${c.patientPhone}","${c.doctorName}","${c.callType}","${c.outcome.status || c.status}","${c.durationSeconds}","${c.startedAt}","${(c.outcome.notes || '').replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartrecall-calls-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="call-history-container" className="space-y-4">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search calls by patient, phone number, or doctor..."
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-sky-500 placeholder:text-slate-400 shadow-2xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'all' | CallType)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-hidden focus:border-sky-500 shadow-2xs cursor-pointer font-medium"
          >
            <option value="all">All Call Skills</option>
            <option value="confirmation">Appointment Confirmation</option>
            <option value="recall">No-Show Recall</option>
            <option value="medication">Medication Reminder</option>
            <option value="feedback">Post-Visit Feedback</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-hidden focus:border-sky-500 shadow-2xs cursor-pointer font-medium"
          >
            <option value="all">All Outcomes</option>
            <option value="confirmed">Confirmed</option>
            <option value="rescheduled">Rescheduled</option>
            <option value="flagged">Clinical Flag</option>
          </select>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors whitespace-nowrap shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/90 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Patient & Contact</th>
                <th className="py-3.5 px-4">Assigned Provider</th>
                <th className="py-3.5 px-4">CALL-E Skill</th>
                <th className="py-3.5 px-4">Extracted Outcome</th>
                <th className="py-3.5 px-4">Duration</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCalls.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 bg-slate-50/40">
                    No call records found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredCalls.map((call) => (
                  <tr
                    key={call.id}
                    onClick={() => onSelectCall(call)}
                    className="hover:bg-sky-50/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                        {phiMask.maskName(call.patientName, isPhiMasked)}
                      </div>
                      <div className="text-slate-500 font-mono text-[11px]">
                        {phiMask.maskPhone(call.patientPhone, isPhiMasked)}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {call.doctorName}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="capitalize font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                        {call.callType}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {call.outcome.status === 'confirmed' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Confirmed
                        </span>
                      ) : call.outcome.status === 'rescheduled' ? (
                        <span className="inline-flex items-center gap-1 text-sky-700 font-semibold bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200/60">
                          <Clock className="w-3.5 h-3.5 text-sky-600" /> Rebooked: {call.outcome.newSlot}
                        </span>
                      ) : call.outcome.status === 'flagged' ? (
                        <span className="inline-flex items-center gap-1 text-rose-700 font-semibold bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200/60">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Triage Flag
                        </span>
                      ) : (
                        <span className="text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                          {call.outcome.status || 'Completed'}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                      {Math.floor(call.durationSeconds / 60)}m {call.durationSeconds % 60}s
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 font-medium">
                      {call.startedAt}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCall(call);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-sky-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                        >
                          Inspect
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onInitiateCall(call.patientId, call.callType);
                          }}
                          className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                          title="Redial patient"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
