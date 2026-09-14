
import { useState, useEffect } from 'react';
import { 
  Patient, 
  CallRecord, 
  Campaign, 
  CallType 
} from './types';
import { 
  INITIAL_PATIENTS, 
  INITIAL_CALLS, 
  INITIAL_CAMPAIGNS 
} from './data/mockData';
import { Header } from './components/layout/Header';
import { Navigation, NavTab } from './components/layout/Navigation';
import { StatsOverview } from './components/dashboard/StatsOverview';
import { LiveCallFeed } from './components/dashboard/LiveCallFeed';
import { AnalyticsCharts } from './components/dashboard/AnalyticsCharts';
import { CallHistoryTable } from './components/calls/CallHistoryTable';
import { CallModal } from './components/calls/CallModal';
import { CallDetailModal } from './components/calls/CallDetailModal';
import { PatientDirectory } from './components/patients/PatientDirectory';
import { CampaignManager } from './components/campaigns/CampaignManager';
import { CalleAgentStudio } from './components/calle/CalleAgentStudio';
import { ClinicalWorkflowPresentation } from './components/workflow/ClinicalWorkflowPresentation';
import { AuditLogModal } from './components/audit/AuditLogModal';
import { 
  CheckCircle2, 
  PhoneCall, 
  Sparkles, 
  AlertCircle,
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  RefreshCw
} from 'lucide-react';
import { sessionStore } from './utils/security';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isStationLocked, setIsStationLocked] = useState(false);
  const [isPhiMasked, setIsPhiMasked] = useState<boolean>(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);

  const [patients, setPatients] = useState<Patient[]>(() => {
    return sessionStore.get<Patient[]>(sessionStore.KEYS.PATIENTS, INITIAL_PATIENTS);
  });

  const [calls, setCalls] = useState<CallRecord[]>(() => {
    return sessionStore.get<CallRecord[]>(sessionStore.KEYS.CALLS, INITIAL_CALLS);
  });

  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    return sessionStore.get<Campaign[]>(sessionStore.KEYS.CAMPAIGNS, INITIAL_CAMPAIGNS);
  });

  const [demoMode, setDemoMode] = useState<boolean>(true);
  const [apiKey, setApiKey] = useState<string>('');

  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [selectedCallForDetail, setSelectedCallForDetail] = useState<CallRecord | null>(null);
  const [callModalPatientId, setCallModalPatientId] = useState<string | undefined>(undefined);
  const [callModalCallType, setCallModalCallType] = useState<CallType | undefined>(undefined);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    sessionStore.set(sessionStore.KEYS.PATIENTS, patients);
  }, [patients]);

  useEffect(() => {
    sessionStore.set(sessionStore.KEYS.CALLS, calls);
  }, [calls]);

  useEffect(() => {
    sessionStore.set(sessionStore.KEYS.CAMPAIGNS, campaigns);
  }, [campaigns]);

  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        setIsStationLocked(true);
      }, 15 * 60 * 1000);
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    resetTimer();

    return () => {
      clearTimeout(inactivityTimer);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        setIsCallModalOpen(true);
      } else if (e.altKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        setIsStationLocked(true);
      } else if (e.key === 'Escape') {
        setIsCallModalOpen(false);
        setSelectedCallForDetail(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenCallModal = (patientId?: string, callType?: CallType) => {
    setCallModalPatientId(patientId);
    setCallModalCallType(callType || 'confirmation');
    setIsCallModalOpen(true);
  };

  const handleCallCompleted = (newCall: CallRecord) => {
    setCalls(prev => [newCall, ...prev]);
    setIsCallModalOpen(false);

    if (newCall.patientId && newCall.outcome.status) {
      setPatients(prev => prev.map(p => {
        if (p.id !== newCall.patientId) return p;
        if (newCall.outcome.status === 'rescheduled' && newCall.outcome.newSlot) {
          return {
            ...p,
            nextAppointmentDate: newCall.outcome.newSlot,
            notes: `Rebooked via CALL-E: ${newCall.outcome.newSlot}`
          };
        }
        if (newCall.outcome.status === 'confirmed') {
          return {
            ...p,
            notes: `Confirmed attendance via CALL-E on ${new Date().toLocaleDateString()}`
          };
        }
        return p;
      }));
    }

    showToast(`Call to ${newCall.patientName} completed & structured outcome logged!`);
  };

  const handleLaunchCampaign = (campaignId: string) => {
    setCampaigns(prev => prev.map(camp => {
      if (camp.id !== campaignId) return camp;
      const newCompleted = Math.min(camp.totalPatients, camp.completedCalls + 4);
      const isDone = newCompleted >= camp.totalPatients;
      return {
        ...camp,
        status: isDone ? 'completed' : 'running',
        completedCalls: newCompleted,
        confirmedCount: camp.confirmedCount + 3,
        rescheduledCount: camp.rescheduledCount + 1
      };
    }));

    showToast('Batch campaign dispatched! Calls queued and live updates streaming.');
  };

  const handleAddPatient = (newPatient: Patient) => {
    setPatients(prev => [newPatient, ...prev]);
    showToast(`Patient ${newPatient.name} enrolled in clinic system.`);
  };

  const handleCreateCampaign = (newCamp: Campaign) => {
    setCampaigns(prev => [newCamp, ...prev]);
    showToast(`Campaign "${newCamp.name}" scheduled.`);
  };

  const handleResetDemoData = () => {
    setPatients(INITIAL_PATIENTS);
    setCalls(INITIAL_CALLS);
    setCampaigns(INITIAL_CAMPAIGNS);
    showToast('Demo data successfully reset for fresh walkthrough.');
  };

  const activeCallsCount = calls.filter(c => c.status === 'in_progress').length;

  return (
    <div id="smartrecall-root" className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased selection:bg-sky-500 selection:text-white">
      <Header
        onQuickCall={() => handleOpenCallModal()}
        onNewCampaign={() => setCurrentTab('campaigns')}
        demoMode={demoMode}
        onToggleDemoMode={() => {
          setDemoMode(prev => !prev);
          showToast(!demoMode ? 'Mock Simulation Mode Enabled' : 'Live CALL-E Telephony API Mode Enabled');
        }}
        activeCallsCount={activeCallsCount}
        onLockStation={() => setIsStationLocked(true)}
        isPhiMasked={isPhiMasked}
        onTogglePhiMask={() => {
          setIsPhiMasked(prev => {
            const next = !prev;
            showToast(next ? 'Curtain Mode Active: Patient PHI masked' : 'Curtain Mode Disabled: Patient PHI unmasked');
            return next;
          });
        }}
        onOpenAuditLogs={() => setIsAuditModalOpen(true)}
      />

      <Navigation
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        activeCallsCount={activeCallsCount}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {currentTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <StatsOverview 
              calls={calls} 
              onViewWorkflow={() => setCurrentTab('workflow')}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7">
                <LiveCallFeed
                  calls={calls}
                  onSelectCall={(call) => setSelectedCallForDetail(call)}
                  onLaunchLiveSimulation={(patientId, type) => handleOpenCallModal(patientId, type)}
                />
              </div>

              <div className="lg:col-span-5 space-y-6">
                <AnalyticsCharts calls={calls} />
              </div>
            </div>
          </div>
        )}

        {currentTab === 'workflow' && (
          <ClinicalWorkflowPresentation
            patients={patients}
            onOpenCallModal={(patientId) => handleOpenCallModal(patientId)}
          />
        )}

        {currentTab === 'queue' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <PhoneCall className="w-5 h-5 text-sky-600" />
                  Live CALL-E Telephony Gateway & Queue
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Monitor active phone lines, initiate test calls, and observe real-time transcript streaming
                </p>
              </div>

              <button
                onClick={() => handleOpenCallModal()}
                className="px-4 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition-all shadow-xs whitespace-nowrap cursor-pointer"
              >
                Launch New AI Call
              </button>
            </div>

            <LiveCallFeed
              calls={calls}
              onSelectCall={(call) => setSelectedCallForDetail(call)}
              onLaunchLiveSimulation={(patientId, type) => handleOpenCallModal(patientId, type)}
            />
          </div>
        )}

        {currentTab === 'history' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <CallHistoryTable
              calls={calls}
              onSelectCall={(call) => setSelectedCallForDetail(call)}
              onInitiateCall={(patientId, type) => handleOpenCallModal(patientId, type)}
              isPhiMasked={isPhiMasked}
            />
          </div>
        )}

        {currentTab === 'patients' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <PatientDirectory
              patients={patients}
              onInitiateCall={(patientId, type) => handleOpenCallModal(patientId, type)}
              onAddPatient={handleAddPatient}
              isPhiMasked={isPhiMasked}
            />
          </div>
        )}

        {currentTab === 'campaigns' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <CampaignManager
              campaigns={campaigns}
              onLaunchCampaign={handleLaunchCampaign}
              onCreateCampaign={handleCreateCampaign}
            />
          </div>
        )}

        {currentTab === 'scripts' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <CalleAgentStudio
              onResetDemoData={handleResetDemoData}
              apiKey={apiKey}
              onUpdateApiKey={setApiKey}
            />
          </div>
        )}
      </main>

      <CallModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        patients={patients}
        preselectedPatientId={callModalPatientId}
        preselectedCallType={callModalCallType}
        onCallCompleted={handleCallCompleted}
        isPhiMasked={isPhiMasked}
      />

      <CallDetailModal
        call={selectedCallForDetail}
        onClose={() => setSelectedCallForDetail(null)}
      />

      <AuditLogModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />

      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white border border-slate-700/80 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs animate-in slide-in-from-bottom-3 duration-200 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {isStationLocked && (
        <div id="hipaa-lock-overlay" className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-2">
                HIPAA Safeguard § 164.312(a)(2)(iii)
              </div>
              <h3 className="text-lg font-black text-slate-900">Workstation Secured</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Protected Health Information (PHI) has been concealed. Session storage remains ephemeral to protect clinical records.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => setIsStationLocked(false)}
                className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                <span>Resume Clinical Session</span>
              </button>

              <button
                onClick={() => {
                  sessionStore.purgeAllPHI();
                  setPatients(INITIAL_PATIENTS);
                  setCalls(INITIAL_CALLS);
                  setCampaigns(INITIAL_CAMPAIGNS);
                  setIsStationLocked(false);
                  showToast('Clinical session purged and memory reset.');
                }}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Purge Session Cache &amp; Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
