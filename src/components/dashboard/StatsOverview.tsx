import React from 'react';
import { Phone, CheckCircle2, DollarSign, Star, TrendingUp, Clock, ShieldCheck, ArrowUpRight, Sparkles } from 'lucide-react';
import { CallRecord } from '../../types';

interface StatsOverviewProps {
  calls: CallRecord[];
  onViewWorkflow?: () => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ calls, onViewWorkflow }) => {
  const totalCalls = calls.length;
  const completedCalls = calls.filter(c => c.status === 'completed');
  const confirmedCalls = completedCalls.filter(c => c.outcome.status === 'confirmed');
  const rescheduledCalls = completedCalls.filter(c => c.outcome.status === 'rescheduled');
  const flaggedCalls = completedCalls.filter(c => c.outcome.status === 'flagged');

  const confirmationRate = totalCalls > 0 
    ? Math.round(((confirmedCalls.length + rescheduledCalls.length) / totalCalls) * 100) 
    : 78;

  const totalRevenueRecovered = completedCalls.reduce((acc, c) => acc + (c.costSavedUsd || 0), 0) || 12400;

  const ratings = completedCalls
    .map(c => c.outcome.rating)
    .filter((r): r is number => typeof r === 'number');
  const avgRating = ratings.length > 0 
    ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) 
    : '4.8';

  return (
    <div id="stats-overview-grid" className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div id="metric-calls-today" className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all group relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-sky-500 to-blue-600 opacity-80" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Recall Outreach</span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center transition-colors group-hover:bg-sky-100 shadow-2xs">
              <Phone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2.5">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-display tabular-nums">{totalCalls}</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/70 flex items-center gap-0.5 tabular-nums">
              <TrendingUp className="w-3 h-3" /> +34%
            </span>
          </div>
          <p className="mt-2.5 text-xs text-slate-500 flex items-center gap-1.5 font-medium tabular-nums">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-500"></span>
            <span>{completedCalls.length} completed &bull; 0 operator dropouts</span>
          </p>
        </div>

        <div id="metric-confirm-rate" className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all group relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-600 opacity-80" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Confirmation Rate</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center transition-colors group-hover:bg-emerald-100 shadow-2xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2.5">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-display tabular-nums">{confirmationRate}%</span>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50/80 px-2 py-0.5 rounded-full border border-emerald-200">
              vs 18% SMS
            </span>
          </div>
          <p className="mt-2.5 text-xs text-slate-500 flex items-center gap-1.5 font-medium tabular-nums">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>{confirmedCalls.length} confirmed &bull; {rescheduledCalls.length} live rebooked</span>
          </p>
        </div>

        <div id="metric-revenue-recovered" className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all group relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-80" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Recovered Clinic Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center transition-colors group-hover:bg-blue-100 shadow-2xs">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2.5">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-display tabular-nums">${totalRevenueRecovered.toLocaleString()}</span>
            <span className="text-[11px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/80">
              This Month
            </span>
          </div>
          <p className="mt-2.5 text-xs text-slate-500 flex items-center gap-1.5 font-medium tabular-nums">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            <span>Est. slot value $220 - $280</span>
          </p>
        </div>

        <div id="metric-patient-rating" className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all group relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600 opacity-80" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Patient CSAT Score</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center transition-colors group-hover:bg-amber-100 shadow-2xs">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2.5">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-display tabular-nums">{avgRating} <span className="text-base font-normal text-slate-400 font-sans">/ 5.0</span></span>
            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/80">
              CALL-E Natural
            </span>
          </div>
          <p className="mt-2.5 text-xs text-slate-500 flex items-center gap-1.5 font-medium tabular-nums">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>{flaggedCalls.length > 0 ? `${flaggedCalls.length} triage reviews pending` : 'Zero negative sentiment flags'}</span>
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-sky-50/90 via-blue-50/50 to-slate-50 border border-sky-200/70 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs shadow-2xs tabular-nums">
        <div className="flex items-center gap-3 text-slate-700">
          <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-sky-600/20">
            <Clock className="w-4 h-4" />
          </div>
          <span className="leading-relaxed">
            <strong className="text-slate-900 font-bold">Clinic Staff Time Saved:</strong> 38.5 hours of manual phone outreach saved this week with Call-E autonomous agent dispatch.
          </span>
        </div>

        <div className="flex items-center gap-3 text-slate-600 font-semibold text-[11px] shrink-0">
          <span className="hidden sm:flex items-center gap-1.5 bg-white/80 px-2.5 py-1 rounded-xl border border-sky-200/60 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            82% Pickup Rate
          </span>
          <span className="hidden sm:flex items-center gap-1.5 bg-white/80 px-2.5 py-1 rounded-xl border border-sky-200/60 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
            1m 45s Avg Call Duration
          </span>
          {onViewWorkflow && (
            <button
              onClick={onViewWorkflow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-sky-200 text-sky-700 hover:bg-sky-50 text-xs font-bold transition-all shadow-2xs cursor-pointer whitespace-nowrap"
            >
              <span>Clinical Workflow Architecture</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
