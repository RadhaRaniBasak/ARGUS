import React, { useState } from 'react';
import { 
  Megaphone, 
  Play, 
  Pause, 
  CheckCircle2, 
  Plus, 
  Users, 
  Clock, 
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Campaign, CallType } from '../../types';

interface CampaignManagerProps {
  campaigns: Campaign[];
  onLaunchCampaign: (campaignId: string) => void;
  onCreateCampaign: (newCampaign: Campaign) => void;
}

export const CampaignManager: React.FC<CampaignManagerProps> = ({
  campaigns,
  onLaunchCampaign,
  onCreateCampaign
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [callType, setCallType] = useState<CallType>('confirmation');
  const [targetCriteria, setTargetCriteria] = useState('All patients with visits tomorrow');
  const [totalPatients, setTotalPatients] = useState(15);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCamp: Campaign = {
      id: `cmp-${Date.now()}`,
      name: name.trim(),
      callType,
      status: 'draft',
      totalPatients: Number(totalPatients) || 10,
      completedCalls: 0,
      confirmedCount: 0,
      rescheduledCount: 0,
      targetCriteria,
      createdAt: 'Just now'
    };

    onCreateCampaign(newCamp);
    setName('');
    setIsModalOpen(false);
  };

  return (
    <div id="campaign-manager-container" className="space-y-4">
      <div className="bg-gradient-to-r from-sky-50 via-blue-50/50 to-slate-50 border border-sky-100/90 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <Megaphone className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Automated Batch Recall & Attendance Campaigns
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Batch-dispatch CALL-E AI conversational agents to dozens of patients concurrently. Proactively recover unconfirmed appointments, reduce clinic no-show leakage, and capture live schedule updates.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition-colors whitespace-nowrap shadow-2xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Campaign</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {campaigns.map((camp) => {
          const progressPercent = camp.totalPatients > 0 
            ? Math.round((camp.completedCalls / camp.totalPatients) * 100) 
            : 0;

          return (
            <div
              key={camp.id}
              className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 hover:border-sky-300 hover:shadow-xs transition-all flex flex-col justify-between shadow-2xs"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-bold text-slate-900 leading-snug">
                    {camp.name}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    camp.status === 'running'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 animate-pulse'
                      : camp.status === 'completed'
                      ? 'bg-sky-50 text-sky-700 border border-sky-200/80'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {camp.status}
                  </span>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2">
                  {camp.targetCriteria}
                </p>

                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Execution Progress</span>
                    <span className="font-bold text-slate-800">{camp.completedCalls} / {camp.totalPatients} ({progressPercent}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-sky-600 to-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/70">
                    <span className="text-slate-500 text-[10px] font-medium block">Confirmed</span>
                    <span className="text-emerald-700 font-bold text-sm">{camp.confirmedCount}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/70">
                    <span className="text-slate-500 text-[10px] font-medium block">Rescheduled</span>
                    <span className="text-sky-700 font-bold text-sm">{camp.rescheduledCount}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">{camp.createdAt}</span>

                {camp.status !== 'completed' ? (
                  <button
                    onClick={() => onLaunchCampaign(camp.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition-colors whitespace-nowrap shadow-2xs cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>{camp.status === 'running' ? 'Simulate Next Batch' : 'Launch Campaign'}</span>
                  </button>
                ) : (
                  <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Completed
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreate}
            className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Create AI Call Campaign</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-xs font-semibold text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-semibold">Campaign Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Monday Morning Orthopedic Recalls"
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-hidden focus:border-sky-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold">Conversation Skill (CALL-E Persona)</label>
                <select
                  value={callType}
                  onChange={(e) => setCallType(e.target.value as CallType)}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 shadow-2xs"
                >
                  <option value="confirmation">24-Hour Appointment Confirmation</option>
                  <option value="recall">No-Show Recall & Rebooking</option>
                  <option value="medication">Medication Adherence & Care Plan</option>
                  <option value="feedback">Post-Visit Patient CSAT</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-semibold">Target Patient Cohort Criteria</label>
                <input
                  type="text"
                  value={targetCriteria}
                  onChange={(e) => setTargetCriteria(e.target.value)}
                  placeholder="e.g. Unconfirmed visits in next 24 hours"
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 shadow-2xs"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold">Patient Batch Size</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={totalPatients}
                  onChange={(e) => setTotalPatients(Number(e.target.value))}
                  className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 shadow-2xs"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition-colors shadow-2xs cursor-pointer"
              >
                Queue Campaign
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
