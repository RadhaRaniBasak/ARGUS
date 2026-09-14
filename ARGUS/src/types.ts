export type CallType = 'confirmation' | 'recall' | 'medication' | 'feedback';

export type CallStatus = 'queued' | 'ringing' | 'in_progress' | 'completed' | 'failed' | 'no_answer';

export interface StructuredOutcome {
  status?: 'confirmed' | 'rescheduled' | 'cancelled' | 'acknowledged' | 'flagged' | 'in_progress';
  newSlot?: string;
  rescheduleReason?: string;
  hasConcerns?: boolean;
  concernDetails?: string;
  rating?: number;
  feedback?: string;
  followUpNeeded?: boolean;
  notes?: string;
}

export interface TranscriptMessage {
  speaker: 'agent' | 'patient';
  text: string;
  timestamp: string;
}

export interface Patient {
  id: string;
  name: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  doctorName: string;
  clinicDepartment: string;
  nextAppointmentDate?: string;
  nextAppointmentTime?: string;
  lastVisitDate?: string;
  prescriptionName?: string;
  refillDueDate?: string;
  riskStatus: 'low' | 'moderate' | 'high';
  consentStatus?: 'consented' | 'sms_only' | 'revoked';
  consentDate?: string;
  notes?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: 'READ_TRANSCRIPT' | 'DISPATCH_CALL' | 'EXPORT_EHR' | 'EXPORT_RECORDS' | 'UPDATE_CONSENT' | 'LOCK_TERMINAL' | 'VIEW_PATIENT' | 'PURGE_SESSION';
  targetType: 'PATIENT' | 'CALL_RECORD' | 'SYSTEM';
  targetId: string;
  targetDescription: string;
  complianceRule: string;
}

export interface CallRecord {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  callType: CallType;
  status: CallStatus;
  calleCallId?: string;
  appointmentDateTime?: string;
  durationSeconds: number;
  startedAt: string;
  completedAt?: string;
  transcript: TranscriptMessage[];
  outcome: StructuredOutcome;
  costSavedUsd?: number;
}

export interface Campaign {
  id: string;
  name: string;
  callType: CallType;
  status: 'draft' | 'running' | 'paused' | 'completed';
  totalPatients: number;
  completedCalls: number;
  confirmedCount: number;
  rescheduledCount: number;
  targetCriteria: string;
  createdAt: string;
}

export interface ConversationScript {
  type: CallType;
  title: string;
  triggerCondition: string;
  greetingPrompt: string;
  coreQuestions: string[];
  fallbackSlotOffer: string[];
  outputSchemaDescription: string;
}
