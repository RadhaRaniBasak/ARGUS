import { ConversationScript } from '../types';

export const CALL_SCRIPTS: Record<string, ConversationScript> = {
  confirmation: {
    type: 'confirmation',
    title: '24-Hour Appointment Confirmation (HIPAA Compliant)',
    triggerCondition: 'Triggered automatically 24 hours prior to scheduled patient visit.',
    greetingPrompt: 'Hello, this is Sarah from Oakwood Clinic calling for {PatientName}. Under HIPAA privacy rules, could you please confirm your identity before we discuss your appointment?',
    coreQuestions: [
      'I am calling to confirm your upcoming visit with Dr. {DoctorName} on {AppointmentDate} at {AppointmentTime}. Will you still be able to make that time?',
      'If you need to reschedule, Dr. {DoctorName} has openings this Thursday at 2:00 PM or Friday at 10:30 AM.',
      'Thank you! We look forward to seeing you. Please remember to bring your insurance card and current medication list.'
    ],
    fallbackSlotOffer: [
      'Thursday, Oct 16 at 2:00 PM',
      'Friday, Oct 17 at 10:30 AM',
      'Monday, Oct 20 at 3:15 PM'
    ],
    outputSchemaDescription: '{ status: "confirmed" | "rescheduled" | "cancelled", newSlot?: string, notes?: string }'
  },
  recall: {
    type: 'recall',
    title: 'No-Show Recall & Rebooking (HIPAA Compliant)',
    triggerCondition: 'Triggered 2 hours after a patient missed their appointment without notice.',
    greetingPrompt: 'Hello, this is Sarah from Oakwood Clinic calling for {PatientName}. To protect your privacy, can you please confirm I am speaking with {PatientName}?',
    coreQuestions: [
      'We noticed you were unable to make your visit today with Dr. {DoctorName}. Was everything okay?',
      'Your care continuity is very important to Dr. {DoctorName}. Would you like me to find a convenient new time for you to come in this week?',
      'I can get you booked for tomorrow at 11:00 AM or Wednesday afternoon. Which works better?'
    ],
    fallbackSlotOffer: [
      'Tomorrow at 11:00 AM',
      'Wednesday at 2:30 PM',
      'Next Monday at 9:00 AM'
    ],
    outputSchemaDescription: '{ reason: string, wantsReschedule: boolean, preferredTime?: string }'
  },
  medication: {
    type: 'medication',
    title: 'Care Plan & Medication Adherence (HIPAA Compliant)',
    triggerCondition: 'Triggered 3 days before a chronic prescription refill or lab follow-up is due.',
    greetingPrompt: 'Good day, this is Sarah from Oakwood Clinic calling for {PatientName}. For patient privacy verification, could you confirm your identity before we review your prescription schedule?',
    coreQuestions: [
      'Our records show your {PrescriptionName} is due for refill by {RefillDate}. Have you already requested this from your pharmacy?',
      'Have you experienced any unexpected side effects or unusual symptoms with your current dosage?',
      'Would you like a clinical nurse to review your lab requests or schedule a brief virtual consultation?'
    ],
    fallbackSlotOffer: [
      'Pharmacy electronic refill sent to Walgreens #492',
      'Nurse phone callback within 2 business hours'
    ],
    outputSchemaDescription: '{ acknowledged: boolean, hasConcerns: boolean, concernDetails?: string }'
  },
  feedback: {
    type: 'feedback',
    title: 'Post-Visit Care & Satisfaction (HIPAA Compliant)',
    triggerCondition: 'Triggered 48 hours following a completed clinic appointment.',
    greetingPrompt: 'Hello, this is Sarah from Oakwood Clinic calling for {PatientName}. Can you please confirm I am speaking with {PatientName}?',
    coreQuestions: [
      'How are you feeling since your visit? Are you following the discharge instructions comfortably?',
      'On a scale from 1 to 5, how satisfied were you with the care and attention you received from Dr. {DoctorName} and our staff?',
      'Is there anything our team could improve for your next appointment, or do you have any remaining questions?'
    ],
    fallbackSlotOffer: [
      'Flag for Clinic Director review if rating <= 3'
    ],
    outputSchemaDescription: '{ rating: 1-5, feedback: string, followUpNeeded: boolean }'
  }
};

export const MCP_TOOLS_SPEC = [
  {
    name: 'lookup_patient_availability',
    description: 'Queries clinic EHR scheduling calendar to return real-time open slots for a specific provider.',
    parameters: {
      doctorId: 'string',
      preferredDay: 'string',
      rangeDays: 'number'
    }
  },
  {
    name: 'update_appointment_status',
    description: 'Directly updates appointment confirmation or new rescheduled timestamp in clinic database.',
    parameters: {
      appointmentId: 'string',
      newStatus: 'confirmed | rescheduled | cancelled',
      newSlot: 'string'
    }
  },
  {
    name: 'flag_clinical_concern',
    description: 'Notifies the triage nurse queue when a patient reports adverse medication symptoms.',
    parameters: {
      patientId: 'string',
      severity: 'low | medium | high',
      concernDetails: 'string'
    }
  }
];
