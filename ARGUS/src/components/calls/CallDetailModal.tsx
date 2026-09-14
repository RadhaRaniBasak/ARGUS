import React, { useState } from 'react';
import { 
  X, 
  Phone, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  User, 
  FileText, 
  Play, 
  Pause, 
  Copy, 
  Check, 
  Calendar,
  Sparkles,
  ShieldCheck,
  Stethoscope,
  Code2,
  Gauge
} from 'lucide-react';
import { CallRecord } from '../../types';

interface CallDetailModalProps {
  call: CallRecord | null;
  onClose: () => void;
}

type DetailTab = 'overview' | 'soap' | 'fhir';

export const CallDetailModal: React.FC<CallDetailModalProps> = ({ call, onClose }) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [scrubPercent, setScrubPercent] = useState<number>(35);
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedSoap, setCopiedSoap] = useState(false);
  const [copiedFhir, setCopiedFhir] = useState(false);

  if (!call) return null;

  const generateSoapNote = () => {
    const outcome = call.outcome;
    const isRecall = call.callType === 'recall';
    const isMed = call.callType === 'medication';

    const subjective = outcome.concernDetails 
      ? `Patient contacted via ARGUS/Call-E telephony. Patient reported: "${outcome.concernDetails}". Expressed willingness to coordinate with attending provider.`
      : `Patient contacted via automated clinical voice agent. Confirmed identity and verified upcoming healthcare arrangements with ${call.doctorName}. No acute complaints reported during initial intake.`;

    const objective = `Method: Outbound AI Clinical Telephony (Call-E Sarah). Duration: ${call.durationSeconds}s. Destination: ${call.patientPhone}. Call Outcome: ${outcome.status || 'Completed'}. Transcripts logged and timestamped under HIPAA secure session.`;

    const assessment = outcome.hasConcerns
      ? `FLAGGED CLINICAL FOLLOW-UP: Potential adverse symptoms or care barrier identified. Clinical triage review required by attending nurse.`
      : `Routine healthcare coordination successful. Status: ${outcome.status?.toUpperCase() || 'CONFIRMED'}. Patient adherent to scheduled protocol.`;

    const plan = outcome.newSlot
      ? `1. Rebook clinic slot to ${outcome.newSlot} in EHR schedule.\n2. Transmit SMS confirmation notice.\n3. Verify transit accommodations prior to appointment.`
      : outcome.hasConcerns
      ? `1. Routed to urgent nurse callback queue.\n2. Provider ${call.doctorName} notified via EHR inbox.\n3. Re-evaluate refill dosage if dizziness persists.`
      : `1. Maintain appointment on master clinical ledger.\n2. Proceed with standard pre-visit lab prep.\n3. Send day-of arrival instructions.`;

    return `CLINICAL SOAP NOTE — ARGUS HEALTH TELEPHONY
PATIENT: ${call.patientName} | MRN: PT-${call.id.slice(-6)}
PROVIDER: ${call.doctorName}
DATE OF SERVICE: ${call.startedAt}

[SUBJECTIVE]
${subjective}

[OBJECTIVE]
${objective}

[ASSESSMENT]
${assessment}

[PLAN]
${plan}

COORDINATOR: Sarah (ARGUS / Call-E Autonomous Voice Agent)
SUPERVISING PHYSICIAN: ${call.doctorName}
`;
  };

  const generateFhirResource = () => {
    return {
      resourceType: "Communication",
      id: `argus-call-${call.id}`,
      status: "completed",
      category: [
        {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/communication-category",
              code: "reminder",
              display: "Appointment Reminder / Clinical Recall"
            }
          ]
        }
      ],
      subject: {
        reference: `Patient/${call.patientId}`,
        display: call.patientName
      },
      recipient: [
        {
          reference: `Patient/${call.patientId}`,
          display: call.patientName
        }
      ],
      sender: {
        display: "ARGUS Autonomous Voice Agent (Sarah - Call-E)"
      },
      sent: new Date().toISOString(),
      payload: [
        {
          contentString: call.outcome.notes || "Clinical coordination call completed."
        }
      ],
      note: [
        {
          authorString: call.doctorName,
          text: `Outcome: ${call.outcome.status}. Rescheduled Slot: ${call.outcome.newSlot || 'N/A'}. CSAT Rating: ${call.outcome.rating || 'N/A'}`
        }
      ]
    };
  };

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(call.outcome, null, 2));
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } catch {
    }
  };

  const handleCopySoap = async () => {
    try {
      await navigator.clipboard.writeText(generateSoapNote());
      setCopiedSoap(true);
      setTimeout(() => setCopiedSoap(false), 2000);
    } catch {
    }
  };

  const handleCopyFhir = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(generateFhirResource(), null, 2));
      setCopiedFhir(true);
      setTimeout(() => setCopiedFhir(false), 2000);
    } catch {
    }
  };

  return (
    <div id="call-detail-modal-backdrop" className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div id="call-detail-modal-card" className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 border border-sky-200 flex items-center justify-center font-bold">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Call Record &amp; EHR Integration
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200 font-semibold">
                  {call.calleCallId || 'calle_session'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {call.patientName} ({call.patientPhone}) • {call.doctorName} • {call.durationSeconds}s duration
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

        <div className="flex items-center gap-1.5 pt-3 pb-1 border-b border-slate-100 text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Overview &amp; Transcript</span>
          </button>

          <button
            onClick={() => setActiveTab('soap')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'soap'
                ? 'bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Clinical SOAP Note</span>
          </button>

          <button
            onClick={() => setActiveTab('fhir')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'fhir'
                ? 'bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>HL7 / FHIR JSON</span>
          </button>
        </div>

        <div className="py-4 space-y-4 flex-1 overflow-y-auto pr-1">
          <div className="bg-slate-900 text-white rounded-2xl p-3.5 flex flex-col gap-3 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setIsPlayingAudio(prev => !prev)}
                  className="w-8 h-8 rounded-full bg-sky-500 hover:bg-sky-400 text-white flex items-center justify-center transition-colors shrink-0 shadow-xs cursor-pointer"
                  title={isPlayingAudio ? 'Pause playback' : 'Play audio'}
                >
                  {isPlayingAudio ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white ml-0.5" />}
                </button>
                <div>
                  <span className="text-xs font-bold text-slate-100 block">Call-E Audio Stream</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {isPlayingAudio ? `00:${Math.round(call.durationSeconds * (scrubPercent / 100)).toString().padStart(2, '0')}` : '00:00'} / 00:{call.durationSeconds.toString().padStart(2, '0')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-slate-800 rounded-xl p-1 border border-slate-700">
                {[1.0, 1.25, 1.5, 2.0].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setPlaybackSpeed(spd)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      playbackSpeed === spd
                        ? 'bg-sky-600 text-white shadow-2xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <input
                type="range"
                min="0"
                max="100"
                value={scrubPercent}
                onChange={(e) => setScrubPercent(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>Speed: {playbackSpeed}x</span>
                <span className="text-emerald-400">HIPAA Secure Carrier Channel</span>
              </div>
            </div>
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-600" />
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Structured Clinical Outcome
                    </h4>
                  </div>
                  <button
                    onClick={handleCopyJson}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 transition-colors cursor-pointer"
                  >
                    {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedJson ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                    <span className="text-slate-500 text-[11px] font-medium">Primary Status</span>
                    <p className="font-bold text-sky-700 capitalize mt-0.5">
                      {call.outcome.status || 'Completed'}
                    </p>
                  </div>

                  {call.outcome.newSlot && (
                    <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                      <span className="text-slate-500 text-[11px] font-medium">Rescheduled Slot</span>
                      <p className="font-bold text-slate-900 mt-0.5">{call.outcome.newSlot}</p>
                    </div>
                  )}

                  {call.outcome.rating && (
                    <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                      <span className="text-slate-500 text-[11px] font-medium">Patient CSAT Rating</span>
                      <p className="font-bold text-amber-600 mt-0.5">★ {call.outcome.rating} / 5.0</p>
                    </div>
                  )}

                  {call.outcome.hasConcerns && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 sm:col-span-2 shadow-2xs">
                      <span className="text-rose-700 text-[11px] font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Clinical Triage Alert
                      </span>
                      <p className="text-rose-800 font-medium mt-0.5">{call.outcome.concernDetails}</p>
                    </div>
                  )}
                </div>

                {call.outcome.notes && (
                  <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200/80 leading-relaxed shadow-2xs">
                    <strong className="text-slate-900">Summary: </strong> {call.outcome.notes}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Full Audio Conversation Transcript
                </h4>

                <div className="bg-slate-50/60 border border-slate-200 rounded-2xl p-4 space-y-3.5">
                  {call.transcript.map((msg, idx) => {
                    const isAgent = msg.speaker === 'agent';
                    return (
                      <div
                        key={idx}
                        className={`flex flex-col ${isAgent ? 'items-start' : 'items-end'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-700">
                            {isAgent ? 'Sarah (AI Voice Agent)' : call.patientName}
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
                </div>
              </div>
            </div>
          )}

          {activeTab === 'soap' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between bg-sky-50/70 border border-sky-200/80 p-3 rounded-2xl">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-sky-700" />
                  <span className="text-xs font-bold text-sky-900">Standard Clinical SOAP Note</span>
                </div>
                <button
                  onClick={handleCopySoap}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  {copiedSoap ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSoap ? 'Copied to Clipboard' : 'Copy for EHR (Epic/Cerner)'}</span>
                </button>
              </div>

              <pre className="bg-slate-900 text-slate-100 p-4 rounded-2xl text-xs font-mono whitespace-pre-wrap leading-relaxed border border-slate-800 overflow-x-auto shadow-inner">
                {generateSoapNote()}
              </pre>
            </div>
          )}

          {activeTab === 'fhir' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between bg-slate-100 border border-slate-200 p-3 rounded-2xl">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-slate-700" />
                  <span className="text-xs font-bold text-slate-900">HL7 FHIR R4 Communication Resource</span>
                </div>
                <button
                  onClick={handleCopyFhir}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  {copiedFhir ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedFhir ? 'Copied FHIR JSON' : 'Copy FHIR Payload'}</span>
                </button>
              </div>

              <pre className="bg-slate-900 text-emerald-300 p-4 rounded-2xl text-xs font-mono whitespace-pre-wrap leading-relaxed border border-slate-800 overflow-x-auto shadow-inner">
                {JSON.stringify(generateFhirResource(), null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Recorded at {call.startedAt} • Protected Health Information (HIPAA)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
