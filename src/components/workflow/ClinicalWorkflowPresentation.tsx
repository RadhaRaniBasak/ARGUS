import React, { useState } from 'react';
import { 
  GitBranch, 
  Cpu, 
  PhoneCall, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Activity, 
  Clock, 
  Database, 
  FileCheck, 
  AlertTriangle, 
  Play, 
  RotateCcw, 
  Zap, 
  Calendar, 
  Users, 
  Check, 
  ChevronRight,
  TrendingUp,
  Volume2
} from 'lucide-react';
import { Patient } from '../../types';

interface ClinicalWorkflowPresentationProps {
  patients: Patient[];
  onOpenCallModal: (patientId?: string) => void;
}

export const ClinicalWorkflowPresentation: React.FC<ClinicalWorkflowPresentationProps> = ({
  patients,
  onOpenCallModal
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || 'p1');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const selectedPatient = patients.find(p => p.id === selectedPatientId) || patients[0];

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setActiveStep(1);

    const timer1 = setTimeout(() => setActiveStep(2), 1200);
    const timer2 = setTimeout(() => setActiveStep(3), 2600);
    const timer3 = setTimeout(() => {
      setActiveStep(4);
      setIsSimulating(false);
    }, 4200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  };

  const workflowSteps = [
    {
      step: 1,
      id: 'ingestion',
      title: 'EHR Ingestion & Smart Trigger',
      subtitle: 'Schedule sync & risk stratification',
      badge: 'Step 01 • Data Ingestion',
      icon: Database,
      details: {
        headline: 'Automated Cohort Identification',
        description: 'Continuously queries the clinical EHR via FHIR R4 APIs. Identifies overdue recalls, upcoming high-risk consultations, and unconfirmed slots 48 hours in advance.',
        telemetry: 'Query latency: 18ms • FHIR standard compliant',
        items: [
          'Automatic pull from clinic scheduling calendar',
          'Patient risk-score weighting (Cardiology, Endocrinology, Primary)',
          'Contact cadence optimization to prevent fatigue'
        ],
        codeSnippet: `{
  "resourceType": "Appointment",
  "status": "pending_confirmation",
  "patient": "${selectedPatient?.name || 'Jordan Taylor'}",
  "practitioner": "${selectedPatient?.doctorName || 'Dr. Elena Rostova'}",
  "triggerType": "48h_pre_visit_confirmation"
}`
      }
    },
    {
      step: 2,
      id: 'telephony',
      title: 'Voice AI Telephony Execution',
      subtitle: 'Sub-400ms conversational dialogue',
      badge: 'Step 02 • Voice AI Agent',
      icon: PhoneCall,
      details: {
        headline: 'Conversational Voice Agent (CALL-E Sarah)',
        description: 'Initiates natural, empathetic outbound phone outreach. Employs advanced voice synthesis and barge-in interruption handling for natural human-like cadence.',
        telemetry: 'Latency: 380ms • Full duplex voice channel',
        items: [
          'Verified HIPAA identity check before disclosure',
          'Intelligent intent classification (confirm vs. reschedule request)',
          'Natural prosody and medical terminology pronunciation'
        ],
        codeSnippet: `AGENT: "Hello ${selectedPatient?.name?.split(' ')[0] || 'Jordan'}, this is Sarah from Oakwood Health System calling to confirm your visit with ${selectedPatient?.doctorName || 'Dr. Rostova'} this ${selectedPatient?.nextAppointmentDate || 'Wednesday'}."
PATIENT: "Hi Sarah! Yes, I will be there."`
      }
    },
    {
      step: 3,
      id: 'triage',
      title: 'Clinical Screening & Triage',
      subtitle: 'Adverse symptom detection & guardrails',
      badge: 'Step 03 • Clinical Safety',
      icon: ShieldCheck,
      details: {
        headline: 'Automated Safety Guardrails & Flagging',
        description: 'Every interaction parses patient vocal feedback for contraindications, post-procedure complications, or medication tolerance issues with zero hallucinations.',
        telemetry: 'Zero false negatives threshold • Real-time triage escalation',
        items: [
          'Pre-visit prep instructions (fasting, lab reminders)',
          'Red-flag clinical symptoms immediately flagged to nursing staff',
          'Instant conflict resolution for alternative time slots'
        ],
        codeSnippet: `{
  "clinicalSafetyScreen": "PASS",
  "adverseSymptomsDetected": false,
  "transportationHurdle": false,
  "requiresNurseEscalation": false,
  "confidenceScore": 0.994
}`
      }
    },
    {
      step: 4,
      id: 'writeback',
      title: 'Structured EHR Write-Back',
      subtitle: 'Instant calendar update & staff alert',
      badge: 'Step 04 • Closed-Loop Resolution',
      icon: FileCheck,
      details: {
        headline: 'Bi-Directional System Synchronization',
        description: 'Structured outcomes are normalized and written back into the clinic database and calendar, ensuring care team visibility without manual nursing data entry.',
        telemetry: 'Write-back execution: 142ms • Audit logged',
        items: [
          'Appointment status marked as "Confirmed" in EMR',
          'Automated SMS confirmation calendar invite sent to patient',
          'Auditable transcript and audio recording stored with HIPAA encryption'
        ],
        codeSnippet: `{
  "appointmentId": "apt_99214",
  "updatedStatus": "CONFIRMED",
  "writtenToEhr": true,
  "patientNotifiedSms": true,
  "timestamp": "${new Date().toLocaleDateString()}"
}`
      }
    }
  ];

  const currentStepData = workflowSteps.find(s => s.step === activeStep) || workflowSteps[0];
  const StepIcon = currentStepData.icon;

  return (
    <div id="clinical-workflow-presentation-view" className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-gradient-to-br from-white via-sky-50/40 to-blue-50/30 border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-sky-100/60 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-10 bottom-0 opacity-10 pointer-events-none hidden md:block">
          <Activity className="w-64 h-64 text-sky-600" />
        </div>

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-sky-100/80 text-sky-800 border border-sky-200">
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            <span>ARGUS Architecture • Clinical Automation Engine</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            ARGUS Core Features &amp; Clinical Workflow Architecture
          </h1>

          <p className="text-sm text-slate-600 leading-relaxed max-w-2xl font-normal">
            Discover how ARGUS unifies automated EHR data ingestion, real-time Call-E conversational voice telephony, clinical safety screening, and closed-loop EHR write-back into a seamless clinical operations pipeline.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={handleRunSimulation}
              disabled={isSimulating}
              className={`inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs transition-all cursor-pointer ${
                isSimulating 
                  ? 'bg-sky-400 cursor-not-allowed' 
                  : 'bg-sky-600 hover:bg-sky-500 active:bg-sky-700'
              }`}
            >
              <Play className={`w-3.5 h-3.5 fill-white ${isSimulating ? 'animate-spin' : ''}`} />
              <span>{isSimulating ? 'Executing Clinical Pipeline...' : 'Run Interactive Pipeline'}</span>
            </button>

            <button
              onClick={() => onOpenCallModal(selectedPatientId)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5 text-sky-600" />
              <span>Simulate Real Patient Call</span>
            </button>

            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/80 border border-slate-200 text-xs text-slate-500 shadow-2xs">
              <span className="font-semibold text-slate-700">Select Test Record:</span>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="bg-transparent text-slate-800 font-bold focus:outline-hidden cursor-pointer"
              >
                {patients.slice(0, 5).map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.clinicDepartment})</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-sky-600" />
              End-to-End Clinical Automation Pipeline
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Click any stage below to inspect its data flow, telemetry metrics, and FHIR response structure
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Telemetry: All 4 Pipeline Nodes Online</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {workflowSteps.map((s) => {
            const Icon = s.icon;
            const isCurrent = activeStep === s.step;
            const isCompleted = activeStep > s.step;

            return (
              <button
                key={s.step}
                onClick={() => setActiveStep(s.step)}
                className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden cursor-pointer ${
                  isCurrent
                    ? 'bg-white border-sky-500 shadow-sm ring-2 ring-sky-500/20'
                    : isCompleted
                    ? 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    : 'bg-white/70 border-slate-200/80 text-slate-500 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                    isCurrent
                      ? 'bg-sky-600 text-white shadow-2xs'
                      : isCompleted
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : `0${s.step}`}
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isCurrent 
                      ? 'bg-sky-100 text-sky-800' 
                      : isCompleted 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {isCurrent ? 'Active Stage' : isCompleted ? 'Completed' : 'Queued'}
                  </span>
                </div>

                <h3 className={`text-xs font-bold leading-tight ${isCurrent ? 'text-slate-900' : 'text-slate-700'}`}>
                  {s.title}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 font-medium">
                  {s.subtitle}
                </p>

                {isCurrent && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-sky-600" />
                )}
              </button>
            );
          })}
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-sky-100 text-sky-800 uppercase tracking-wide">
                {currentStepData.badge}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-500" />
                {currentStepData.details.telemetry}
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {currentStepData.details.headline}
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-normal">
                {currentStepData.details.description}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Clinical Workflow Verification Points
              </h4>
              <div className="space-y-2">
                {currentStepData.details.items.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                disabled={activeStep <= 1}
                onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                Previous Stage
              </button>

              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4].map(s => (
                  <button
                    key={s}
                    onClick={() => setActiveStep(s)}
                    className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                      s === activeStep ? 'w-6 bg-sky-600' : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>

              <button
                disabled={activeStep >= 4}
                onClick={() => setActiveStep(prev => Math.min(4, prev + 1))}
                className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-500 text-white shadow-2xs disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 cursor-pointer"
              >
                <span>Next Stage</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 bg-slate-900 rounded-2xl p-4.5 text-slate-200 space-y-3 font-mono shadow-md border border-slate-800">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span className="text-[11px] text-slate-400 font-sans ml-1">EHR Payload & Telemetry Inspector</span>
              </div>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                LIVE STREAM
              </span>
            </div>

            <div className="text-[11px] leading-relaxed overflow-x-auto text-sky-300 max-h-56 scrollbar-thin">
              <pre className="whitespace-pre font-mono">{currentStepData.details.codeSnippet}</pre>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-sans">
              <span>Patient: <strong className="text-white">{selectedPatient?.name}</strong></span>
              <span>Physician: <strong className="text-white">{selectedPatient?.doctorName}</strong></span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-sky-600" />
            Core Platform Architecture & Capabilities
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Modular healthcare AI services engineered for clinical accuracy, speed, and HIPAA compliance
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs hover:shadow-xs transition-shadow space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Conversational Voice Engine</h3>
              <p className="text-xs text-slate-500 mt-1 font-normal leading-relaxed">
                CALL-E voice agents operate with ultra-low latency (&lt;400ms), conversational barge-in support, and natural empathetic cadence tuned for senior patient comfort.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-2 text-[11px] font-semibold text-sky-700">
              <span className="px-2 py-0.5 rounded-md bg-sky-50 border border-sky-200">Full Duplex</span>
              <span className="px-2 py-0.5 rounded-md bg-sky-50 border border-sky-200">&lt;380ms Latency</span>
              <span className="px-2 py-0.5 rounded-md bg-sky-50 border border-sky-200">No Hallucinations</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs hover:shadow-xs transition-shadow space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Autonomous Reschedule Engine</h3>
              <p className="text-xs text-slate-500 mt-1 font-normal leading-relaxed">
                When patients communicate schedule conflicts, the agent instantly queries doctor availability rules and presents immediate 1-click alternative slots during the live call.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-2 text-[11px] font-semibold text-emerald-800">
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200">Double-Booking Guard</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200">Real-time Booking</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs hover:shadow-xs transition-shadow space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Clinical Safety & Symptom Triage</h3>
              <p className="text-xs text-slate-500 mt-1 font-normal leading-relaxed">
                Monitors patient responses for critical clinical alerts (e.g. chest pain, dizziness, adverse medication reactions). Automatically dispatches urgent notifications to nursing staff.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-2 text-[11px] font-semibold text-rose-800">
              <span className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200">Red Flag Detection</span>
              <span className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200">Nurse Escalation</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-600" />
              Clinical Health Economics & Verified Value Proposition
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Measurable operational and financial improvements delivered across outpatient clinic networks
            </p>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
            Oakwood Health Pilot Data
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-xs text-slate-500 font-semibold">No-Show Rate Reduction</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-sky-700 font-sans">-78%</span>
              <span className="text-xs text-emerald-600 font-bold">from 18.2% to 4.0%</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Eliminates unfilled clinical schedule blocks with automated proactive outreach.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-xs text-slate-500 font-semibold">Nurse Hours Recovered</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-emerald-700 font-sans">18.5 hrs</span>
              <span className="text-xs text-emerald-600 font-bold">per week/dept</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Frees certified nurses from repetitive phone dialing to direct patient bedside care.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-xs text-slate-500 font-semibold">Annual Revenue Protected</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 font-sans">$184,000</span>
              <span className="text-xs text-sky-600 font-bold">per 10 doctors</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Recaptures lost patient consult value through automated same-day slot re-allocation.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-xs text-slate-500 font-semibold">Patient Satisfaction (CSAT)</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-amber-600 font-sans">99.2%</span>
              <span className="text-xs text-amber-600 font-bold">★ 4.96/5.0</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Patients praise the polite, responsive phone reminders without frustrating hold times.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
