import React, { useState, useMemo } from 'react';
import { 
  Search, 
  UserPlus, 
  PhoneCall, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Pill, 
  Clock,
  Download,
  CheckSquare,
  Square,
  Play,
  X,
  ShieldCheck,
  AlertTriangle,
  Ban,
  MessageSquare
} from 'lucide-react';
import { Patient, CallType } from '../../types';
import { phiMask, auditLogger } from '../../utils/security';

interface PatientDirectoryProps {
  patients: Patient[];
  onInitiateCall: (patientId: string, callType: CallType) => void;
  onAddPatient: (newPatient: Patient) => void;
  isPhiMasked?: boolean;
}

export const PatientDirectory: React.FC<PatientDirectoryProps> = ({
  patients,
  onInitiateCall,
  onAddPatient,
  isPhiMasked = false
}) => {
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [consentFilter, setConsentFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchActionFeedback, setBatchActionFeedback] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [doctorName, setDoctorName] = useState('Dr. Marcus Chen');
  const [clinicDepartment, setClinicDepartment] = useState('Cardiology');
  const [nextAppointmentDate, setNextAppointmentDate] = useState('Tomorrow');
  const [nextAppointmentTime, setNextAppointmentTime] = useState('10:00 AM');
  const [riskStatus, setRiskStatus] = useState<'low' | 'moderate' | 'high'>('moderate');
  const [consentStatus, setConsentStatus] = useState<'consented' | 'sms_only' | 'revoked'>('consented');

  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const matchesSearch = 
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.phone.includes(search) ||
        p.doctorName.toLowerCase().includes(search.toLowerCase());

      const matchesDept = departmentFilter === 'all' || p.clinicDepartment === departmentFilter;
      const matchesRisk = riskFilter === 'all' || p.riskStatus === riskFilter;
      const matchesConsent = consentFilter === 'all' || (p.consentStatus || 'consented') === consentFilter;
      return matchesSearch && matchesDept && matchesRisk && matchesConsent;
    });
  }, [patients, search, departmentFilter, riskFilter, consentFilter]);

  const departments = useMemo(() => {
    return Array.from(new Set(patients.map(p => p.clinicDepartment)));
  }, [patients]);

  const allFilteredSelected = filteredPatients.length > 0 && filteredPatients.every(p => selectedIds.has(p.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPatients.map(p => p.id)));
    }
  };

  const toggleSelectPatient = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleExportCsv = () => {
    const targetPatients = patients.filter(p => selectedIds.has(p.id));
    if (targetPatients.length === 0) return;

    auditLogger.log(
      'EXPORT_EHR',
      'PATIENT',
      targetPatients.map(p => p.id).join(', '),
      `Exported ${targetPatients.length} patient records into CSV format`,
      'HIPAA § 164.312(c)(1)'
    );

    const headers = ['ID', 'Name', 'Phone', 'Provider', 'Department', 'Next Visit Date', 'Time', 'Risk Status', 'Consent Status'];
    const rows = targetPatients.map(p => [
      p.id,
      `"${p.name}"`,
      `"${p.phone}"`,
      `"${p.doctorName}"`,
      `"${p.clinicDepartment}"`,
      `"${p.nextAppointmentDate || ''}"`,
      `"${p.nextAppointmentTime || ''}"`,
      p.riskStatus,
      p.consentStatus || 'consented'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ARGUS_patient_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setBatchActionFeedback(`Exported ${targetPatients.length} patient records to CSV (HIPAA Audit Logged)`);
    setTimeout(() => setBatchActionFeedback(null), 3500);
  };

  const handleLaunchBatchRecall = () => {
    const eligiblePatients = patients.filter(p => selectedIds.has(p.id) && p.consentStatus !== 'revoked');
    if (eligiblePatients.length === 0) {
      setBatchActionFeedback('Cannot launch calls: Selected patient(s) have revoked voice consent.');
      setTimeout(() => setBatchActionFeedback(null), 4000);
      return;
    }

    const firstPatient = eligiblePatients[0];
    onInitiateCall(firstPatient.id, firstPatient.nextAppointmentDate?.includes('Missed') ? 'recall' : 'confirmation');
    setBatchActionFeedback(`Dispatched batch sequence for ${eligiblePatients.length} consented patients. Starting with ${firstPatient.name}.`);
    setTimeout(() => setBatchActionFeedback(null), 4000);
  };

  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const newPt: Patient = {
      id: `pt-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      dateOfBirth: '1980-01-01',
      doctorName,
      clinicDepartment,
      nextAppointmentDate,
      nextAppointmentTime,
      riskStatus,
      consentStatus,
      consentDate: new Date().toISOString().split('T')[0],
      notes: 'Added via clinic dashboard'
    };

    onAddPatient(newPt);
    setName('');
    setPhone('');
    setIsAddModalOpen(false);
  };

  return (
    <div id="patient-directory-container" className="space-y-4 pb-16">
      {batchActionFeedback && (
        <div className="bg-sky-50 border border-sky-200 text-sky-900 px-4 py-2.5 rounded-2xl text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-sky-600" />
            <span className="font-semibold">{batchActionFeedback}</span>
          </div>
          <button onClick={() => setBatchActionFeedback(null)} className="text-sky-400 hover:text-sky-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patients by name, phone, or assigned provider..."
            className="w-full text-xs pl-9.5 pr-8 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-slate-900 focus:outline-hidden focus:border-sky-500 focus:bg-white placeholder:text-slate-400 shadow-2xs transition-colors font-medium"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-hidden focus:border-sky-500 shadow-2xs font-semibold cursor-pointer hover:bg-slate-100 transition-colors"
          >
            <option value="all">All Specialties</option>
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-hidden focus:border-sky-500 shadow-2xs font-semibold cursor-pointer hover:bg-slate-100 transition-colors"
          >
            <option value="all">All Risk Tiers</option>
            <option value="high">High Risk</option>
            <option value="moderate">Moderate Risk</option>
            <option value="low">Low Risk</option>
          </select>

          <select
            value={consentFilter}
            onChange={(e) => setConsentFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-hidden focus:border-sky-500 shadow-2xs font-semibold cursor-pointer hover:bg-slate-100 transition-colors"
          >
            <option value="all">All Consents</option>
            <option value="consented">Voice &amp; SMS Consented</option>
            <option value="sms_only">SMS Only</option>
            <option value="revoked">Consent Revoked</option>
          </select>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white rounded-xl transition-all whitespace-nowrap shadow-xs shadow-sky-600/20 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Patient</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/90 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-3 w-10 text-center">
                  <button
                    onClick={toggleSelectAll}
                    className="text-slate-400 hover:text-sky-600 transition-colors cursor-pointer"
                    title={allFilteredSelected ? 'Deselect All' : 'Select All'}
                  >
                    {allFilteredSelected ? (
                      <CheckSquare className="w-4 h-4 text-sky-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-4 font-display">Patient Profile {isPhiMasked && '(Curtain On)'}</th>
                <th className="py-3.5 px-4 font-display">Specialty &amp; Doctor</th>
                <th className="py-3.5 px-4 font-display">Next Visit / Status</th>
                <th className="py-3.5 px-4 font-display">Care Plan / Rx</th>
                <th className="py-3.5 px-4 font-display">No-Show Risk</th>
                <th className="py-3.5 px-4 font-display">HIPAA Consent</th>
                <th className="py-3.5 px-4 text-right font-display">Outreach Telephony</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.map((patient) => {
                const isSelected = selectedIds.has(patient.id);
                const isConsentRevoked = patient.consentStatus === 'revoked';

                const riskBadgeConfig = {
                  high: 'bg-rose-50 text-rose-800 border-rose-300 ring-1 ring-rose-400/20',
                  moderate: 'bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-400/20',
                  low: 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400/20'
                }[patient.riskStatus || 'low'];

                const avatarRiskConfig = {
                  high: 'bg-rose-50 text-rose-700 border-rose-200 ring-2 ring-rose-400/20',
                  moderate: 'bg-amber-50 text-amber-700 border-amber-200 ring-2 ring-amber-400/20',
                  low: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-2 ring-emerald-400/20'
                }[patient.riskStatus || 'low'];

                return (
                  <tr 
                    key={patient.id} 
                    className={`transition-colors group ${isSelected ? 'bg-sky-50/70' : 'hover:bg-slate-50/80'}`}
                  >
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => toggleSelectPatient(patient.id)}
                        className="text-slate-400 hover:text-sky-600 transition-colors cursor-pointer"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-sky-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center border shrink-0 shadow-2xs ${avatarRiskConfig}`}>
                          {patient.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-sky-700 transition-colors font-display">
                            {phiMask.maskName(patient.name, isPhiMasked)}
                          </div>
                          <div className="text-slate-500 font-mono text-[11px] tabular-nums">
                            {phiMask.maskPhone(patient.phone, isPhiMasked)}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-slate-800 font-semibold">{patient.doctorName}</div>
                      <div className="text-slate-500 text-[11px] font-medium">{patient.clinicDepartment}</div>
                    </td>

                    <td className="py-3 px-4 tabular-nums">
                      {patient.nextAppointmentDate?.includes('Missed') ? (
                        <span className="text-amber-800 font-bold flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80 w-fit text-[11px]">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> {patient.nextAppointmentDate}
                        </span>
                      ) : (
                        <div className="text-slate-700 font-medium">
                          {patient.nextAppointmentDate} {patient.nextAppointmentTime && `at ${patient.nextAppointmentTime}`}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {patient.prescriptionName ? (
                        <div className="text-slate-700 font-medium flex items-center gap-1.5">
                          <Pill className="w-3 h-3 text-sky-600" />
                          <span>{patient.prescriptionName}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-medium">Standard Follow-up</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {patient.riskStatus === 'high' ? (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${riskBadgeConfig}`}>
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          High Risk
                        </span>
                      ) : patient.riskStatus === 'moderate' ? (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${riskBadgeConfig}`}>
                          <Clock className="w-3 h-3 text-amber-600" />
                          Moderate Risk
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${riskBadgeConfig}`}>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Low Risk
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {isConsentRevoked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200" title="Patient explicitly revoked automated voice call consent">
                          <Ban className="w-3 h-3 text-rose-600" />
                          Opted Out
                        </span>
                      ) : patient.consentStatus === 'sms_only' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                          <MessageSquare className="w-3 h-3 text-sky-600" />
                          SMS Only
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Voice Consented
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isConsentRevoked ? (
                          <span 
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-400 bg-slate-100 rounded-xl border border-slate-200 cursor-not-allowed"
                            title="HIPAA &amp; TCPA Rule: Outbound call blocked because patient revoked automated voice outreach consent."
                          >
                            <Ban className="w-3 h-3 text-rose-400" />
                            <span>Call Blocked</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => onInitiateCall(patient.id, patient.nextAppointmentDate?.includes('Missed') ? 'recall' : 'confirmation')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 rounded-xl transition-all whitespace-nowrap shadow-2xs hover:shadow-xs cursor-pointer group-hover:bg-sky-500"
                          >
                            <PhoneCall className="w-3 h-3" />
                            <span>Call Patient</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white rounded-2xl px-5 py-3 shadow-2xl border border-slate-800 flex items-center gap-4 max-w-xl w-full animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-sky-500 text-white text-xs font-bold flex items-center justify-center">
              {selectedIds.size}
            </span>
            <span className="text-xs font-bold">
              {selectedIds.size === 1 ? 'Patient Selected' : 'Patients Selected'}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleLaunchBatchRecall}
              className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Launch Batch Recall</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-700"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => setSelectedIds(new Set())}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Clear Selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreatePatient}
            className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Enroll New Clinic Patient</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-xs font-semibold text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-semibold">Patient Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold">Phone Number (E.164) *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 font-semibold">Specialty</label>
                  <input
                    type="text"
                    value={clinicDepartment}
                    onChange={(e) => setClinicDepartment(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold">Attending Doctor</label>
                  <input
                    type="text"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 font-semibold">Appointment Date</label>
                  <input
                    type="text"
                    value={nextAppointmentDate}
                    onChange={(e) => setNextAppointmentDate(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold">Appointment Time</label>
                  <input
                    type="text"
                    value={nextAppointmentTime}
                    onChange={(e) => setNextAppointmentTime(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 font-semibold">No-Show Risk Level</label>
                  <select
                    value={riskStatus}
                    onChange={(e) => setRiskStatus(e.target.value as any)}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-sky-500"
                  >
                    <option value="low">Low Risk</option>
                    <option value="moderate">Moderate Risk</option>
                    <option value="high">High Risk</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold">HIPAA Outreach Consent</label>
                  <select
                    value={consentStatus}
                    onChange={(e) => setConsentStatus(e.target.value as any)}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-sky-500"
                  >
                    <option value="consented">Voice &amp; SMS Consented</option>
                    <option value="sms_only">SMS Only</option>
                    <option value="revoked">Consent Revoked</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-xl transition-colors shadow-2xs cursor-pointer"
              >
                Enroll Patient
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
