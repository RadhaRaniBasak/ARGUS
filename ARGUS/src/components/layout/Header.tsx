import React from 'react';
import { 
  PhoneCall, 
  ShieldCheck, 
  Activity, 
  Sparkles, 
  Eye, 
  EyeOff, 
  Lock,
  Radio,
  CheckCircle2
} from 'lucide-react';

interface HeaderProps {
  onQuickCall: () => void;
  onNewCampaign: () => void;
  demoMode: boolean;
  onToggleDemoMode: () => void;
  activeCallsCount: number;
  onLockStation?: () => void;
  isPhiMasked: boolean;
  onTogglePhiMask: () => void;
  onOpenAuditLogs: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onQuickCall,
  demoMode,
  onToggleDemoMode,
  activeCallsCount,
  onLockStation,
  isPhiMasked,
  onTogglePhiMask,
  onOpenAuditLogs
}) => {
  return (
    <header id="clinic-header" className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
      <div className="bg-slate-900 text-slate-300 text-[11px] px-4 sm:px-6 lg:px-8 py-1 flex items-center justify-between border-b border-slate-800 tabular-nums">
        <div className="flex items-center gap-4 overflow-x-auto whitespace-nowrap py-0.5">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Call-E Autonomous Gateway: Operational
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-300">
            <strong className="text-white font-semibold">3</strong> High-Risk Recalls Pending
          </span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-slate-300 hidden sm:inline">
            <strong className="text-white font-semibold">94%</strong> Visit Confirmation Rate
          </span>
          <span className="text-slate-600 hidden md:inline">•</span>
          <span className="text-slate-400 hidden md:inline flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> HIPAA Security Verified (§ 164.502)
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-3 text-slate-400 text-[10px]">
          <span>Oakwood Regional Health • Station 04-A</span>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[9px]">
            Alt + L to Lock
          </kbd>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-700 p-0.5 shadow-sm shadow-sky-600/20 flex items-center justify-center text-white shrink-0">
            <Activity className="w-5 h-5 text-white stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold tracking-tight text-slate-900 font-display">
                ARGUS
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200/80">
                <Radio className="w-2.5 h-2.5 text-sky-600 animate-pulse" />
                Call-E Voice OS
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:flex items-center gap-1.5 font-medium">
              <span>Oakwood Health System</span>
              <span className="text-slate-300">•</span>
              <span>Autonomous Clinical Patient Recall &amp; Safety</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs shadow-2xs tabular-nums">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${activeCallsCount > 0 ? 'bg-emerald-400' : 'bg-sky-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${activeCallsCount > 0 ? 'bg-emerald-500' : 'bg-sky-500'}`}></span>
            </span>
            <span className="text-slate-700 font-semibold text-[11px]">
              {activeCallsCount > 0 ? `${activeCallsCount} Active AI Calls` : 'PSTN Standby'}
            </span>
          </div>

          <div className="flex items-center bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80 gap-1">
            <button
              id="phi-privacy-mask-toggle-btn"
              onClick={onTogglePhiMask}
              className={`px-2.5 py-1 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                isPhiMasked
                  ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50 shadow-2xs'
              }`}
              title={isPhiMasked ? 'Curtain Mode Active: Patient names & phones masked from public view' : 'Curtain Mode Off: Click to mask PHI for reception privacy'}
            >
              {isPhiMasked ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-slate-500" />}
              <span className="hidden sm:inline text-[11px] font-medium">
                {isPhiMasked ? 'Curtain On' : 'Mask PHI'}
              </span>
            </button>

            <button
              id="audit-trail-btn"
              onClick={onOpenAuditLogs}
              className="px-2.5 py-1 text-xs font-semibold rounded-xl bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Open HIPAA § 164.312(b) Immutable Compliance Audit Trail"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden md:inline text-[11px] font-medium">Audit Trail</span>
            </button>

            <button
              id="demo-mode-toggle-btn"
              onClick={onToggleDemoMode}
              className={`px-2.5 py-1 text-xs font-semibold rounded-xl border transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                demoMode
                  ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100 shadow-2xs'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100 shadow-2xs'
              }`}
              title="Toggle between Interactive Demo Simulation and Live CALL-E Telephony"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline text-[11px] font-medium">{demoMode ? 'Simulation' : 'Live API'}</span>
            </button>

            {onLockStation && (
              <button
                id="header-lock-station-btn"
                onClick={onLockStation}
                className="p-1.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-xl border border-slate-200/80 transition-colors cursor-pointer shadow-2xs"
                title="Lock Station (Alt+L) — Conceals PHI instantly"
              >
                <Lock className="w-3.5 h-3.5 text-slate-600" />
              </button>
            )}
          </div>

          <button
            id="header-quick-call-btn"
            onClick={onQuickCall}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 rounded-xl shadow-sm shadow-sky-600/25 transition-all whitespace-nowrap cursor-pointer group"
          >
            <PhoneCall className="w-3.5 h-3.5 stroke-[2.5] group-hover:scale-110 transition-transform" />
            <span>Call Patient</span>
            <span className="hidden lg:inline text-[10px] opacity-75 font-mono bg-sky-700 px-1.5 py-0.5 rounded-md">
              ⌘N
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
