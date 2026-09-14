import React, { useState } from 'react';
import { PhoneCall, CheckCircle2, Clock, AlertTriangle, MessageSquare, Play } from 'lucide-react';
import { CallRecord, CallType } from '../../types';

interface LiveCallFeedProps {
  calls: CallRecord[];
  onSelectCall: (call: CallRecord) => void;
  onLaunchLiveSimulation: (patientId?: string, callType?: CallType) => void;
}

export const LiveCallFeed: React.FC<LiveCallFeedProps> = ({
  calls,
  onSelectCall,
  onLaunchLiveSimulation
}) => {
  const [filterType, setFilterType] = useState<'all' | CallType>('all');

  const filteredCalls = calls.filter(c => filterType === 'all' || c.callType === filterType);

  const getCallTypeBadge = (type: CallType) => {
    switch (type) {
      case 'confirmation':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200/80 whitespace-nowrap">Confirmation</span>;
      case 'recall':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80 whitespace-nowrap">Recall Outreach</span>;
      case 'medication':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 whitespace-nowrap">Medication</span>;
      case 'feedback':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200/80 whitespace-nowrap">Post-Visit CSAT</span>;
    }
  };

  const getStatusDisplay = (call: CallRecord) => {
    if (call.status === 'in_progress') {
      return (
        <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/70 whitespace-nowrap">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Live In-Progress
        </span>
      );
    }
    if (call.outcome.status === 'confirmed') {
      return (
        <span className="flex items-center gap-1 text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60 whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Confirmed
        </span>
      );
    }
    if (call.outcome.status === 'rescheduled') {
      return (
        <span className="flex items-center gap-1 text-xs text-sky-700 font-bold bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200/60 whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 text-sky-600" /> Rebooked
        </span>
      );
    }
    if (call.outcome.status === 'flagged') {
      return (
        <span className="flex items-center gap-1 text-xs text-rose-700 font-bold bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200/60 whitespace-nowrap">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Clinical Flag
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-xs text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200 whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" /> Completed
      </span>
    );
  };

  return (
    <div id="live-call-feed-card" className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100 shadow-2xs">
              <PhoneCall className="w-4 h-4" />
            </div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight font-display">
              Live Telephony Feed &amp; Outreach Stream
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 animate-pulse whitespace-nowrap">
              SSE Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time conversational streaming and structured clinical outcome extraction
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 overflow-x-auto">
          {(['all', 'confirmation', 'recall', 'medication', 'feedback'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-colors whitespace-nowrap cursor-pointer ${
                filterType === type
                  ? 'bg-white text-sky-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
        {filteredCalls.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No calls matching this filter category.
          </div>
        ) : (
          filteredCalls.map((call) => (
            <div
              key={call.id}
              id={`call-feed-item-${call.id}`}
              onClick={() => onSelectCall(call)}
              className="group bg-slate-50/70 hover:bg-sky-50/50 border border-slate-200/70 hover:border-sky-300 rounded-xl p-3.5 transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
                  call.status === 'in_progress'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 ring-2 ring-emerald-400/30'
                    : call.outcome.status === 'flagged'
                    ? 'bg-rose-100 text-rose-800 border border-rose-300 ring-2 ring-rose-400/30'
                    : 'bg-sky-100 text-sky-800 border border-sky-200/80'
                }`}>
                  {call.patientName.charAt(0)}
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 group-hover:text-sky-700 transition-colors font-display">
                      {call.patientName}
                    </span>
                    <span className="text-xs text-slate-500 font-mono tabular-nums">{call.patientPhone}</span>
                    {getCallTypeBadge(call.callType)}
                  </div>

                  <p className="text-xs text-slate-500 truncate">
                    {call.doctorName} &bull; <span className="text-slate-700 font-medium tabular-nums">{call.appointmentDateTime || 'General Recall'}</span>
                  </p>

                  {call.outcome.notes && (
                    <p className="text-xs text-slate-700 line-clamp-1 bg-white/90 px-2.5 py-1 rounded-lg border border-slate-200/70 shadow-2xs">
                      <span className="text-sky-700 font-semibold">Outcome: </span>
                      {call.outcome.notes}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                <div className="text-right tabular-nums">
                  <div>{getStatusDisplay(call)}</div>
                  <span className="text-[11px] text-slate-400 font-medium">{call.startedAt}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCall(call);
                  }}
                  className="p-2 rounded-xl bg-white border border-slate-200/80 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors shadow-2xs cursor-pointer group-hover:border-sky-300"
                  title="Inspect full call transcript and structured outcome"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-3.5 bg-gradient-to-r from-sky-50/90 via-blue-50/40 to-slate-50 border border-sky-200/70 rounded-xl flex items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="flex items-center gap-2 text-slate-700 font-medium">
          <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-sky-600/20">
            <Play className="w-3.5 h-3.5 fill-white" />
          </div>
          <span>Want to test an interactive CALL-E AI conversational call live?</span>
        </div>
        <button
          onClick={() => onLaunchLiveSimulation()}
          className="px-3.5 py-1.5 font-bold text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 rounded-xl transition-colors whitespace-nowrap shadow-xs cursor-pointer"
        >
          Simulate Call Now
        </button>
      </div>
    </div>
  );
};
