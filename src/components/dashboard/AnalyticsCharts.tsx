import React from 'react';
import { BarChart3, PieChart, CheckCircle2, RotateCw, AlertTriangle, XCircle } from 'lucide-react';
import { CallRecord } from '../../types';

interface AnalyticsChartsProps {
  calls: CallRecord[];
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ calls }) => {
  const days = [
    { day: 'Mon', calls: 28, confirmed: 22, rescheduled: 4 },
    { day: 'Tue', calls: 35, confirmed: 29, rescheduled: 3 },
    { day: 'Wed', calls: 42, confirmed: 34, rescheduled: 5 },
    { day: 'Thu', calls: 38, confirmed: 30, rescheduled: 6 },
    { day: 'Fri', calls: 45, confirmed: 39, rescheduled: 4 },
    { day: 'Sat', calls: 16, confirmed: 13, rescheduled: 2 },
    { day: 'Sun', calls: 8, confirmed: 7, rescheduled: 1 },
  ];

  const maxCalls = Math.max(...days.map(d => d.calls));

  const confirmed = calls.filter(c => c.outcome.status === 'confirmed').length || 18;
  const rescheduled = calls.filter(c => c.outcome.status === 'rescheduled').length || 8;
  const acknowledged = calls.filter(c => c.outcome.status === 'acknowledged').length || 6;
  const flagged = calls.filter(c => c.outcome.status === 'flagged').length || 2;
  const noAnswer = 3;

  const total = confirmed + rescheduled + acknowledged + flagged + noAnswer;

  return (
    <div id="analytics-panel-grid" className="space-y-6">
      <div id="weekly-volume-chart-card" className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100 shadow-2xs">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 font-display">
                Weekly Outreach Volume &amp; Confirmations
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">Daily automated patient outreach vs verified attendance</p>
          </div>
          <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-xl border border-sky-200/80 shadow-2xs tabular-nums font-mono">
            212 Total Calls
          </span>
        </div>

        <div className="pt-4 flex items-end justify-between gap-2.5 h-44 tabular-nums">
          {days.map((item) => {
            const heightPercent = Math.round((item.calls / maxCalls) * 100);
            const confirmedPercent = Math.round((item.confirmed / item.calls) * 100);

            return (
              <div key={item.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div className="relative w-full flex flex-col items-center justify-end h-32 bg-slate-100/90 rounded-xl p-1 shadow-inner">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-900 text-white text-[10px] font-semibold py-1 px-2.5 rounded-lg whitespace-nowrap z-10 pointer-events-none shadow-md tabular-nums">
                    {item.confirmed} / {item.calls} confirmed ({confirmedPercent}%)
                  </div>

                  <div
                    className="w-full bg-gradient-to-t from-sky-600 to-blue-500 rounded-lg transition-all duration-300 relative overflow-hidden shadow-2xs"
                    style={{ height: `${heightPercent}%` }}
                  >
                    <div 
                      className="absolute bottom-0 inset-x-0 bg-sky-950/20"
                      style={{ height: `${100 - confirmedPercent}%` }}
                    />
                  </div>
                </div>
                <span className="text-[11px] font-bold text-slate-600 group-hover:text-sky-700 transition-colors">
                  {item.day}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-6 pt-3 border-t border-slate-100 text-xs text-slate-600 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-sky-500"></span>
            Confirmed / Rebooked
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-slate-300"></span>
            Pending / Unanswered
          </div>
        </div>
      </div>

      <div id="outcome-donut-chart-card" className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-2xs">
                <PieChart className="w-4 h-4" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 font-display">
                Outcome Distribution &amp; Clinical Triage
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">Structured intent classification across all Call-E skills</p>
          </div>
          <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200/80 shadow-2xs tabular-nums">
            94% Resolved
          </span>
        </div>

        <div className="pt-2 space-y-2">
          <div className="h-4 w-full bg-slate-100 rounded-xl overflow-hidden flex p-0.5 gap-0.5 border border-slate-200/70 shadow-2xs">
            <div 
              className="bg-emerald-500 rounded-sm transition-all shadow-xs"
              style={{ width: `${(confirmed / total) * 100}%` }}
              title={`Confirmed: ${confirmed}`}
            />
            <div 
              className="bg-sky-500 rounded-sm transition-all shadow-xs"
              style={{ width: `${(rescheduled / total) * 100}%` }}
              title={`Rescheduled: ${rescheduled}`}
            />
            <div 
              className="bg-indigo-500 rounded-sm transition-all shadow-xs"
              style={{ width: `${(acknowledged / total) * 100}%` }}
              title={`Acknowledged: ${acknowledged}`}
            />
            <div 
              className="bg-rose-500 rounded-sm transition-all shadow-xs"
              style={{ width: `${(flagged / total) * 100}%` }}
              title={`Clinical Flags: ${flagged}`}
            />
            <div 
              className="bg-slate-300 rounded-sm transition-all"
              style={{ width: `${(noAnswer / total) * 100}%` }}
              title={`No Answer: ${noAnswer}`}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs pt-1 tabular-nums">
          <div className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-200/70 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-slate-700 font-medium">Confirmed Visits</span>
            </div>
            <span className="font-bold text-slate-900">{Math.round((confirmed / total) * 100)}%</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-200/70 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <RotateCw className="w-3.5 h-3.5 text-sky-600" />
              <span className="text-slate-700 font-medium">Live Rescheduled</span>
            </div>
            <span className="font-bold text-slate-900">{Math.round((rescheduled / total) * 100)}%</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-200/70 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span className="text-slate-700 font-medium">Triage Concerns</span>
            </div>
            <span className="font-bold text-rose-600">{Math.round((flagged / total) * 100)}%</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-200/70 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <XCircle className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-600 font-medium">Voicemail / No Answer</span>
            </div>
            <span className="font-bold text-slate-700">{Math.round((noAnswer / total) * 100)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
