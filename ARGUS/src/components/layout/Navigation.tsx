import React from 'react';
import { LayoutDashboard, PhoneForwarded, History, Users, Megaphone, Terminal, GitBranch } from 'lucide-react';

export type NavTab = 'dashboard' | 'workflow' | 'queue' | 'history' | 'patients' | 'campaigns' | 'scripts';

interface NavigationProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  activeCallsCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onTabChange, activeCallsCount }) => {
  const tabs: { id: NavTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'workflow', label: 'Clinical Workflow & Features', icon: GitBranch },
    { id: 'queue', label: 'Live Telephony & Queue', icon: PhoneForwarded, badge: activeCallsCount > 0 ? activeCallsCount : undefined },
    { id: 'history', label: 'Call Logs & Transcripts', icon: History },
    { id: 'patients', label: 'Patient Directory', icon: Users },
    { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
    { id: 'scripts', label: 'CALL-E Agent Studio', icon: Terminal }
  ];

  return (
    <nav id="clinic-nav-tabs" className="border-b border-slate-200/80 bg-white/60 backdrop-blur-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-white text-sky-700 font-semibold border border-slate-200/90 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent font-medium'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
