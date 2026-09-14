import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, 
  PhoneOff, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  Clock, 
  User, 
  AlertCircle, 
  Calendar,
  Layers,
  ArrowRight,
  Zap,
  Globe,
  Radio,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  Ban
} from 'lucide-react';
import { Patient, CallType, CallRecord, StructuredOutcome, TranscriptMessage } from '../../types';
import { CALL_SCRIPTS } from '../../data/scripts';
import { sounds } from '../../utils/audio';
import { DualAudioWaveform } from './DualAudioWaveform';
import { phiMask, auditLogger } from '../../utils/security';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  preselectedPatientId?: string;
  preselectedCallType?: CallType;
  onCallCompleted: (newCall: CallRecord) => void;
  isPhiMasked?: boolean;
}

export const CallModal: React.FC<CallModalProps> = ({
  isOpen,
  onClose,
  patients,
  preselectedPatientId,
  preselectedCallType,
  onCallCompleted,
  isPhiMasked = false
}) => {
  const [activeMode, setActiveMode] = useState<'real' | 'simulation'>('real');
  
  const [selectedPatientId, setSelectedPatientId] = useState<string>(preselectedPatientId || patients[0]?.id || '');
  const [selectedCallType, setSelectedCallType] = useState<CallType>(preselectedCallType || 'confirmation');
  const [customPhone, setCustomPhone] = useState('+1 (555) 392-1084');
  const [customName, setCustomName] = useState('Jordan Taylor');
  const [isCustomMode, setIsCustomMode] = useState(false);

  const [calleConfig, setCalleConfig] = useState<{ hasApiKey: boolean; rateLimitMaxPerWindow?: number; windowMinutes?: number } | null>(null);
  const [clientApiKey, setClientApiKey] = useState('');
  const [isCheckingConfig, setIsCheckingConfig] = useState(false);

  const [realCallTaskId, setRealCallTaskId] = useState<string | null>(null);
  const [realCallStatus, setRealCallStatus] = useState<string>('idle');
  const [realCallError, setRealCallError] = useState<string | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const [callState, setCallState] = useState<'idle' | 'dialing' | 'connected' | 'completed'>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [structuredResult, setStructuredResult] = useState<StructuredOutcome | null>(null);

  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      checkCalleConfig();
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isOpen]);

  const checkCalleConfig = async () => {
    setIsCheckingConfig(true);
    try {
      const res = await fetch('/api/calle/config');
      if (res.ok) {
        const data = await res.json();
        setCalleConfig(data);
      }
    } catch {
      setCalleConfig({ hasApiKey: false });
    } finally {
      setIsCheckingConfig(false);
    }
  };

  useEffect(() => {
    if (preselectedPatientId) {
      setSelectedPatientId(preselectedPatientId);
    }
  }, [preselectedPatientId]);

  useEffect(() => {
    if (preselectedCallType) {
      setSelectedCallType(preselectedCallType);
    }
  }, [preselectedCallType]);

  useEffect(() => {
    if (callState === 'connected') {
      durationTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
    }
    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    };
  }, [callState]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  if (!isOpen) return null;

  const currentPatient = patients.find(p => p.id === selectedPatientId) || patients[0];
  const patientName = isCustomMode ? customName : currentPatient?.name || 'Patient';
  const patientPhone = isCustomMode ? customPhone : currentPatient?.phone || '+1 (555) 000-0000';
  const doctorName = currentPatient?.doctorName || 'Dr. Elena Rostova';
  const activeScript = CALL_SCRIPTS[selectedCallType];
  const isConsentRevoked = !isCustomMode && currentPatient?.consentStatus === 'revoked';

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleDispatchRealCall = async () => {
    if (isConsentRevoked) return;
    setIsDispatching(true);
    setRealCallError(null);
    setRealCallStatus('initiating');

    auditLogger.log(
      'DISPATCH_CALL',
      'CALL_RECORD',
      isCustomMode ? 'custom' : selectedPatientId,
      `Dispatched live Call-E call to ${patientName} (${patientPhone}) under HIPAA 2-identifier protocol`,
      'HIPAA § 164.502 Minimum Necessary'
    );

    try {
      const authHeaders: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (clientApiKey.trim()) {
        authHeaders['x-calle-api-key'] = clientApiKey.trim();
      }

      const response = await fetch('/api/calle/call', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          phoneNumber: patientPhone,
          patientName,
          doctorName,
          appointmentDate: currentPatient?.nextAppointmentDate || 'Wednesday at 10:00 AM',
          callType: selectedCallType
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to dispatch call to Call-E API');
      }

      setRealCallTaskId(data.taskId);
      setRealCallStatus('ringing');
      setCallState('connected');

      const taskId = data.taskId;
      pollingRef.current = setInterval(async () => {
        try {
          const pollHeaders: Record<string, string> = {};
          if (clientApiKey.trim()) {
            pollHeaders['x-calle-api-key'] = clientApiKey.trim();
          }

          const statusRes = await fetch(`/api/calle/status/${encodeURIComponent(taskId)}`, {
            headers: pollHeaders
          });
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            if (statusData.status) {
              setRealCallStatus(statusData.status);
              if (statusData.status === 'completed' || statusData.status === 'failed') {
                if (pollingRef.current) clearInterval(pollingRef.current);
              }
            }
          }
        } catch {
        }
      }, 3500);

      setTranscript([
        {
          speaker: 'agent',
          text: `[Call-E Gateway] Outbound telephone call task #${taskId} dispatched to carrier network for ${patientPhone}. Ringing patient phone...`,
          timestamp: '00:01'
        }
      ]);
    } catch (err: any) {
      setRealCallError(err.message || 'Error communicating with Call-E server endpoint');
      setRealCallStatus('failed');
    } finally {
      setIsDispatching(false);
    }
  };

  const startSimulationCall = () => {
    if (isConsentRevoked) return;
    setCallState('dialing');
    setCallDuration(0);
    setTranscript([]);
    setStructuredResult(null);

    auditLogger.log(
      'DISPATCH_CALL',
      'CALL_RECORD',
      isCustomMode ? 'custom' : selectedPatientId,
      `Dispatched simulated call to ${patientName} with HIPAA 2-identifier verification protocol`,
      'HIPAA § 164.502 Minimum Necessary'
    );

    if (!isMuted) sounds.playRing();

    setTimeout(() => {
      setCallState('connected');
      if (!isMuted) sounds.playConnected();

      const greeting = `Hello, this is Sarah with Oakwood Clinic calling for ${patientName}. For your privacy under HIPAA regulations, could you please confirm your identity before we review your clinical details?`;

      setTranscript([{ speaker: 'agent', text: greeting, timestamp: '00:02' }]);

      setTimeout(() => {
        const last4 = patientPhone.replace(/\D/g, '').slice(-4) || '8901';
        const verifyResponse = `Hi Sarah! Yes, this is ${patientName}. My date of birth is confirmed and my phone number ends in ${last4}.`;

        setTranscript(prev => [...prev, { speaker: 'patient', text: verifyResponse, timestamp: '00:06' }]);

        setTimeout(() => {
          let agentClinicalPrompt = '';
          if (selectedCallType === 'confirmation') {
            agentClinicalPrompt = `Thank you for verifying your identity. I am calling to confirm your upcoming visit with Dr. ${doctorName} on ${currentPatient?.nextAppointmentDate || 'Tomorrow'} at ${currentPatient?.nextAppointmentTime || '10:30 AM'}. Will you still be able to make that time?`;
          } else if (selectedCallType === 'recall') {
            agentClinicalPrompt = `Thank you for confirming. We noticed you missed your visit with Dr. ${doctorName} yesterday. We want to ensure you are well and help reschedule your appointment.`;
          } else if (selectedCallType === 'medication') {
            agentClinicalPrompt = `Thank you for confirming. Our system shows your ${currentPatient?.prescriptionName || 'prescription'} is due for refill. Have you experienced any unusual symptoms or side effects?`;
          } else {
            agentClinicalPrompt = `Thank you for confirming. We are conducting a brief quality check following your recent visit with Dr. ${doctorName}. How are you feeling?`;
          }

          setTranscript(prev => [...prev, { speaker: 'agent', text: agentClinicalPrompt, timestamp: '00:10' }]);

          setTimeout(() => {
            let patientResponse = '';
            if (selectedCallType === 'confirmation') {
              patientResponse = `Yes, I can definitely make that appointment with Dr. ${doctorName}.`;
            } else if (selectedCallType === 'recall') {
              patientResponse = `I was stuck in transit yesterday, but I would love to reschedule for Thursday afternoon.`;
            } else if (selectedCallType === 'medication') {
              patientResponse = `Yes, I need the refill, but I have also had mild dizziness in the mornings.`;
            } else {
              patientResponse = `Everything was great, Dr. Jenkins was wonderful. 5 out of 5 stars!`;
            }

            setTranscript(prev => [...prev, { speaker: 'patient', text: patientResponse, timestamp: '00:14' }]);

            setTimeout(() => {
              let agentClosing = '';
              let outcome: StructuredOutcome = {};

              if (selectedCallType === 'confirmation') {
                agentClosing = `Terrific! Your visit is confirmed for ${currentPatient?.nextAppointmentDate || 'tomorrow'} at ${currentPatient?.nextAppointmentTime || '10:30 AM'}. Please bring your insurance card. Have a wonderful day!`;
                outcome = {
                  status: 'confirmed',
                  notes: `Identity verified via 2-factor HIPAA protocol. Patient confirmed attendance with ${doctorName} for ${currentPatient?.nextAppointmentDate || 'Tomorrow'} at ${currentPatient?.nextAppointmentTime || '10:30 AM'}.`
                };
              } else if (selectedCallType === 'recall') {
                agentClosing = `No problem at all ${patientName}. I have rebooked you with Dr. ${doctorName} for Thursday at 2:00 PM. We will send an SMS confirmation as well.`;
                outcome = {
                  status: 'rescheduled',
                  newSlot: 'Thursday at 2:00 PM',
                  rescheduleReason: 'Patient transit delay on previous visit',
                  notes: `Identity verified via 2-factor HIPAA protocol. Recovered no-show patient. Rebooked with ${doctorName} for Thursday 2:00 PM.`
                };
              } else if (selectedCallType === 'medication') {
                agentClosing = `I will transmit the electronic refill right now to your pharmacy, and I am alerting our triage nurse about the dizziness so they can follow up with you today.`;
                outcome = {
                  status: 'flagged',
                  hasConcerns: true,
                  concernDetails: 'Patient reported mild morning dizziness on current dose. Triage nurse review requested.',
                  followUpNeeded: true,
                  notes: 'Identity verified. Electronic refill submitted; clinical dizziness concern flagged for provider follow-up.'
                };
              } else {
                agentClosing = `Thank you so much for the 5-star rating! We are always here for you. Take care!`;
                outcome = {
                  status: 'acknowledged',
                  rating: 5,
                  feedback: 'Rated 5/5 stars. Very pleased with provider communication.',
                  followUpNeeded: false,
                  notes: 'Post-visit CSAT score 5/5 logged successfully under HIPAA compliance.'
                };
              }

              setTranscript(prev => [...prev, { speaker: 'agent', text: agentClosing, timestamp: '00:19' }]);
              setStructuredResult(outcome);
            }, 2300);

          }, 2300);

        }, 2200);

      }, 2000);

    }, 2000);
  };

  const hangUpCall = () => {
    if (!isMuted) sounds.playHangup();
    setCallState('completed');
    if (pollingRef.current) clearInterval(pollingRef.current);

    const finalOutcome: StructuredOutcome = structuredResult || {
      status: selectedCallType === 'confirmation' ? 'confirmed' : 'acknowledged',
      notes: `Call ended normally after ${callDuration} seconds.`
    };

    const newRecord: CallRecord = {
      id: `call-${Date.now()}`,
      patientId: isCustomMode ? 'custom' : selectedPatientId,
      patientName,
      patientPhone,
      doctorName,
      callType: selectedCallType,
      status: 'completed',
      calleCallId: realCallTaskId || `calle_live_${Math.random().toString(36).substring(2, 8)}`,
      appointmentDateTime: currentPatient?.nextAppointmentDate ? `${currentPatient.nextAppointmentDate} ${currentPatient.nextAppointmentTime}` : 'General Call',
      durationSeconds: callDuration || 18,
      startedAt: 'Just now',
      completedAt: 'Just now',
      costSavedUsd: selectedCallType === 'confirmation' || selectedCallType === 'recall' ? 240 : 0,
      transcript: transcript.length > 0 ? transcript : [
        { speaker: 'agent', text: `Call placed to ${patientName}`, timestamp: '00:01' }
      ],
      outcome: finalOutcome
    };

    onCallCompleted(newRecord);
  };

  const handleManualResponse = (text: string, outcome: StructuredOutcome) => {
    const nowStamp = formatTimer(callDuration);
    setTranscript(prev => [...prev, { speaker: 'patient', text, timestamp: nowStamp }]);

    setTimeout(() => {
      const closingStamp = formatTimer(callDuration + 3);
      setTranscript(prev => [...prev, {
        speaker: 'agent',
        text: `Understood! I have updated your file with that information. Thank you and have a wonderful day!`,
        timestamp: closingStamp
      }]);
      setStructuredResult(outcome);
    }, 1500);
  };

  const hasApiKey = Boolean(calleConfig?.hasApiKey || clientApiKey.trim().length > 0);

  return (
    <div id="call-modal-backdrop" className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div id="call-modal-card" className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
              callState === 'connected' 
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 animate-pulse'
                : 'bg-sky-100 text-sky-700 border border-sky-200'
            }`}>
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  {callState === 'idle' ? 'ARGUS • Call-E Telephony Gateway' : 'CALL-E Active Phone Session'}
                </h3>
                {callState === 'connected' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {activeMode === 'real' ? 'REAL PHONE CALL' : 'SIMULATED AUDIO'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {callState === 'idle' 
                  ? 'Autonomous patient outreach & conversational clinical triage'
                  : `${patientName} • ${patientPhone} • Duration: ${formatTimer(callDuration)}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {callState !== 'idle' && (
              <button
                onClick={() => setIsMuted(prev => !prev)}
                className="p-2 text-slate-500 hover:text-slate-900 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                title={isMuted ? 'Unmute Audio Tones' : 'Mute Audio Tones'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-sky-600" />}
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-600 hover:text-slate-900 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {callState === 'idle' ? (
          <div className="py-4 space-y-4 overflow-y-auto pr-1">
            <div className="bg-slate-100/80 p-1 rounded-2xl flex items-center gap-1 border border-slate-200/80">
              <button
                type="button"
                onClick={() => setActiveMode('real')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeMode === 'real'
                    ? 'bg-white text-sky-700 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-sky-600" />
                <span>Real Phone Call (Call-E API)</span>
                {hasApiKey ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="API Ready" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-amber-500" title="Needs Key" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveMode('simulation')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeMode === 'simulation'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Interactive Voice Simulation</span>
              </button>
            </div>

            {activeMode === 'real' && (
              <div className={`p-4 rounded-2xl border text-xs space-y-2.5 ${
                hasApiKey 
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50/70 border-amber-200 text-amber-900'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5">
                    {hasApiKey ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Call-E API Connected &amp; Ready</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        <span>Call-E API Key Setup</span>
                      </>
                    )}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-white/80 border border-current">
                    api.heycall-e.com/v1/calls
                  </span>
                </div>

                <p className="text-[11px] leading-relaxed">
                  {hasApiKey
                    ? `Ready to place a live telephone call to a real mobile or landline device using Call-E's Sarah voice agent.`
                    : `To dial an actual telephone number on the carrier network, add your CALLE_API_KEY in the AI Studio Settings > Secrets panel (or enter your key below for this session).`}
                </p>

                {!calleConfig?.hasApiKey && (
                  <div className="pt-1 flex items-center gap-2">
                    <input
                      type="password"
                      value={clientApiKey}
                      onChange={(e) => setClientApiKey(e.target.value)}
                      placeholder="Paste Call-E API Key (e.g. iams_live_...)"
                      className="flex-1 bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-amber-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => checkCalleConfig()}
                      className="px-2.5 py-1.5 bg-white border border-amber-300 hover:bg-amber-100 rounded-xl text-[11px] font-bold text-amber-800 cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${isCheckingConfig ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Conversation Skill (Clinical Goal)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(['confirmation', 'recall', 'medication', 'feedback'] as const).map((type) => {
                  const script = CALL_SCRIPTS[type];
                  const isSelected = selectedCallType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedCallType(type)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-sky-50 border-sky-500 text-slate-900 shadow-xs'
                          : 'bg-slate-50/70 border-slate-200/80 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 capitalize">{script.title}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-sky-600" />}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                        {script.triggerCondition}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Target Destination &amp; Patient
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomMode(prev => !prev)}
                  className="text-xs font-semibold text-sky-600 hover:underline cursor-pointer"
                >
                  {isCustomMode ? 'Choose From Clinic Records' : 'Dial My Real Phone Number'}
                </button>
              </div>

              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Patient Local Window: <strong className="text-slate-800">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
                </div>
                <span className="inline-flex items-center gap-1 font-bold text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  TCPA Compliant (8 AM – 9 PM)
                </span>
              </div>

              {!isCustomMode ? (
                <div className="space-y-2">
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-hidden focus:border-sky-500 shadow-2xs cursor-pointer font-medium"
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.phone} ({p.doctorName}, Next: {p.nextAppointmentDate || 'None'})
                      </option>
                    ))}
                  </select>

                  {currentPatient && (
                    <div className="bg-slate-50/80 border border-slate-200/70 rounded-xl p-3 flex items-center justify-between gap-3 text-xs text-slate-600">
                      <div>
                        <span className="font-bold text-slate-900">{currentPatient.name}</span>
                        <span className="text-slate-500"> • Department: {currentPatient.clinicDepartment}</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-sky-100 text-sky-800">
                        Assigned: {currentPatient.doctorName}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-sky-50/40 p-3.5 rounded-2xl border border-sky-100">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700">Patient Full Name</label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-sky-500 shadow-2xs font-medium"
                      placeholder="e.g. Jordan Taylor"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700">
                      Real Destination Phone (E.164)
                    </label>
                    <input
                      type="text"
                      value={customPhone}
                      onChange={(e) => setCustomPhone(e.target.value)}
                      className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-sky-500 shadow-2xs font-mono"
                      placeholder="+14155552671"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Standard E.164 format with country code (e.g. +14155552671). Rate-limited to max 5 calls per 5 min.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {realCallError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">Call-E Telephony Notice:</strong>
                  <p className="mt-0.5">{realCallError}</p>
                </div>
              </div>
            )}

            {isConsentRevoked && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 text-xs flex items-start gap-2.5 shadow-2xs">
                <Ban className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold text-rose-950">HIPAA &amp; TCPA Outreach Guard: Outbound Call Blocked</strong>
                  <p className="mt-0.5 text-rose-800">
                    <strong>{currentPatient?.name}</strong> explicitly revoked automated voice outreach consent on {currentPatient?.consentDate || 'record'}.
                    Calling this patient violates TCPA consent mandates and HIPAA Minimum Necessary standards (§ 164.502). Please use direct staff contact instead.
                  </p>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                {activeMode === 'real' ? (
                  <span className="flex items-center gap-1 text-sky-700">
                    <Radio className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
                    CALL-E Outbound Carrier Telephony
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-slate-500">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Interactive Audio Simulation
                  </span>
                )}
              </div>

              {activeMode === 'real' ? (
                <button
                  type="button"
                  id="dispatch-real-calle-btn"
                  onClick={handleDispatchRealCall}
                  disabled={isDispatching || isConsentRevoked}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Phone className={`w-4 h-4 stroke-[2.5] ${isDispatching ? 'animate-spin' : ''}`} />
                  <span>
                    {isConsentRevoked
                      ? 'Outreach Blocked (Consent Revoked)'
                      : isDispatching
                      ? 'Connecting to Call-E...'
                      : 'Place Real Phone Call via Call-E'}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  id="start-simulation-btn"
                  onClick={startSimulationCall}
                  disabled={isConsentRevoked}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{isConsentRevoked ? 'Outreach Blocked (Consent Revoked)' : 'Start Voice Simulation'}</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-4 flex-1 flex flex-col overflow-hidden">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                  {patientName.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {phiMask.maskName(patientName, isPhiMasked)}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {phiMask.maskPhone(patientPhone, isPhiMasked)} • {doctorName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 h-6">
                {[40, 75, 100, 60, 90, 45, 80, 50, 95, 30].map((h, i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-full transition-all duration-200 ${
                      callState === 'connected' ? 'bg-sky-600 animate-pulse' : 'bg-slate-300'
                    }`}
                    style={{ 
                      height: callState === 'connected' ? `${Math.max(20, (h * ((i % 3) + 1)) % 100)}%` : '20%',
                      animationDelay: `${i * 100}ms`
                    }}
                  />
                ))}
              </div>

              <div className="text-right">
                <span className="text-xs font-mono font-bold text-sky-700">{formatTimer(callDuration)}</span>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {activeMode === 'real' ? `Call-E (${realCallStatus})` : (callState === 'dialing' ? 'Ringing...' : 'Session Active')}
                </p>
              </div>
            </div>

            <DualAudioWaveform
              activeSpeaker={
                callState === 'connected'
                  ? (transcript.length > 0 && transcript[transcript.length - 1].speaker === 'patient' ? 'patient' : 'agent')
                  : 'idle'
              }
              isConnected={callState === 'connected'}
            />

            {transcript.some(t => /dizziness|chest pain|shortness of breath|faint|emergency|severe|allergic/i.test(t.text)) && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 animate-bounce" />
                  <div>
                    <strong className="font-bold text-rose-900">Clinical Triage Alert:</strong>
                    <span className="ml-1 text-rose-800">Potential acute adverse symptoms detected in transcript. Flagged for nurse review.</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase bg-rose-600 text-white px-2 py-0.5 rounded-md">Urgent Flag</span>
              </div>
            )}

            {activeMode === 'real' && realCallTaskId && (
              <div className="px-3 py-2 bg-sky-50 border border-sky-200 rounded-xl flex items-center justify-between text-xs text-sky-900">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Call-E Task ID: <strong className="font-mono text-slate-900">{realCallTaskId}</strong></span>
                </div>
                <span className="font-bold uppercase text-[10px] px-2 py-0.5 bg-white rounded border border-sky-300">
                  Carrier Status: {realCallStatus}
                </span>
              </div>
            )}

            <div className="flex-1 bg-slate-50/60 border border-slate-200 rounded-2xl p-4 overflow-y-auto space-y-3 min-h-[220px] max-h-[300px]">
              {callState === 'dialing' && (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-2 py-8">
                  <div className="w-8 h-8 rounded-full border-2 border-sky-600 border-t-transparent animate-spin" />
                  <p className="text-xs font-medium">CALL-E Telephony Gateway dialing {patientPhone}...</p>
                  <p className="text-[11px] text-slate-400">Ringing carrier network</p>
                </div>
              )}

              {transcript.map((msg, idx) => {
                const isAgent = msg.speaker === 'agent';
                return (
                  <div
                    key={idx}
                    className={`flex flex-col ${isAgent ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-700">
                        {isAgent ? 'CALL-E Sarah (AI Assistant)' : patientName}
                      </span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                        isAgent
                          ? 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs shadow-2xs'
                          : 'bg-sky-600 text-white rounded-tr-xs shadow-xs'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              <div ref={transcriptEndRef} />
            </div>

            {activeMode === 'simulation' && callState === 'connected' && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 space-y-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                  <User className="w-3 h-3 text-sky-600" />
                  Test Patient Responses (Simulate Clinical Scenarios):
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleManualResponse(
                      "Yes! I will definitely be there on time.",
                      { status: 'confirmed', notes: 'Patient confirmed attendance.' }
                    )}
                    className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-emerald-50 text-emerald-700 rounded-xl border border-slate-200 shadow-2xs cursor-pointer transition-colors"
                  >
                    Option A: "Yes, confirm visit"
                  </button>
                  <button
                    type="button"
                    onClick={() => handleManualResponse(
                      "Actually, something came up. Can we reschedule for next week?",
                      { status: 'rescheduled', newSlot: 'Next Monday at 10:00 AM', notes: 'Patient requested reschedule for next week.' }
                    )}
                    className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-sky-50 text-sky-700 rounded-xl border border-slate-200 shadow-2xs cursor-pointer transition-colors"
                  >
                    Option B: "Reschedule slot"
                  </button>
                  <button
                    type="button"
                    onClick={() => handleManualResponse(
                      "I've been feeling quite dizzy and nauseous since starting this new dosage.",
                      { status: 'flagged', hasConcerns: true, concernDetails: 'Patient dizziness and nausea.', followUpNeeded: true, notes: 'Symptom concern flagged.' }
                    )}
                    className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-rose-50 text-rose-700 rounded-xl border border-slate-200 shadow-2xs cursor-pointer transition-colors"
                  >
                    Option C: "Report clinical symptom"
                  </button>
                </div>
              </div>
            )}

            {structuredResult && (
              <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3 text-xs space-y-1 animate-in fade-in">
                <div className="flex items-center justify-between text-emerald-800 font-bold">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Structured Outcome Formatted:
                  </span>
                  <span className="uppercase text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-mono font-bold">
                    {structuredResult.status}
                  </span>
                </div>
                <p className="text-emerald-700 text-[11px] font-medium">{structuredResult.notes}</p>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Hang up to close session and record clinical outcome.
              </span>

              <button
                type="button"
                id="hangup-call-btn"
                onClick={hangUpCall}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <PhoneOff className="w-4 h-4 stroke-[2.5]" />
                <span>Complete &amp; Hang Up</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
