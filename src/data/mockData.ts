import { Patient, CallRecord, Campaign } from '../types';

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'pt-101',
    name: 'Eleanor Vance',
    phone: '+1 (555) 234-8901',
    email: 'eleanor.vance@example.com',
    dateOfBirth: '1978-04-12',
    doctorName: 'Dr. Marcus Chen',
    clinicDepartment: 'Cardiology',
    nextAppointmentDate: 'Tomorrow',
    nextAppointmentTime: '10:30 AM',
    lastVisitDate: '2026-08-14',
    prescriptionName: 'Metoprolol Tartrate 50mg',
    refillDueDate: '2026-09-28',
    riskStatus: 'high',
    consentStatus: 'consented',
    consentDate: '2026-01-15',
    notes: 'Prior history of missing morning follow-up appointments.'
  },
  {
    id: 'pt-102',
    name: 'David Rodriguez',
    phone: '+1 (555) 891-3420',
    email: 'drodriguez99@example.com',
    dateOfBirth: '1985-11-23',
    doctorName: 'Dr. Sarah Jenkins',
    clinicDepartment: 'Primary Care',
    nextAppointmentDate: 'Tomorrow',
    nextAppointmentTime: '02:15 PM',
    lastVisitDate: '2026-07-02',
    prescriptionName: 'Lisinopril 10mg',
    refillDueDate: '2026-09-20',
    riskStatus: 'low',
    consentStatus: 'consented',
    consentDate: '2026-02-20',
    notes: 'Responsive via phone, prefers early afternoon visits.'
  },
  {
    id: 'pt-103',
    name: 'Grace Thorne',
    phone: '+1 (555) 672-9912',
    email: 'grace.t@example.com',
    dateOfBirth: '1962-09-08',
    doctorName: 'Dr. Robert Zhao',
    clinicDepartment: 'Orthopedics',
    nextAppointmentDate: 'Missed Yesterday',
    nextAppointmentTime: '09:00 AM',
    lastVisitDate: '2026-06-19',
    riskStatus: 'high',
    consentStatus: 'consented',
    consentDate: '2026-03-10',
    notes: 'Missed post-op knee evaluation yesterday. Urgent recall needed.'
  },
  {
    id: 'pt-104',
    name: 'Samuel Miller',
    phone: '+1 (555) 430-1178',
    email: 'sam.miller@example.com',
    dateOfBirth: '1992-02-17',
    doctorName: 'Dr. Marcus Chen',
    clinicDepartment: 'Cardiology',
    nextAppointmentDate: '2026-09-18',
    nextAppointmentTime: '11:00 AM',
    prescriptionName: 'Atorvastatin 20mg',
    refillDueDate: '2026-09-15',
    riskStatus: 'moderate',
    consentStatus: 'sms_only',
    consentDate: '2026-04-05',
    notes: 'Due for 90-day medication compliance check.'
  },
  {
    id: 'pt-105',
    name: 'Amara Patel',
    phone: '+1 (555) 349-8012',
    email: 'amara.patel@example.com',
    dateOfBirth: '1990-07-31',
    doctorName: 'Dr. Sarah Jenkins',
    clinicDepartment: 'Primary Care',
    nextAppointmentDate: 'Completed (2d ago)',
    nextAppointmentTime: '03:45 PM',
    lastVisitDate: '2026-09-11',
    riskStatus: 'low',
    consentStatus: 'consented',
    consentDate: '2026-05-12',
    notes: 'Routine physical completed. Candidate for post-visit feedback call.'
  },
  {
    id: 'pt-106',
    name: 'Arthur Pendelton',
    phone: '+1 (555) 781-9043',
    email: 'arthur.p@example.com',
    dateOfBirth: '1954-12-05',
    doctorName: 'Dr. Robert Zhao',
    clinicDepartment: 'Orthopedics',
    nextAppointmentDate: 'Tomorrow',
    nextAppointmentTime: '04:00 PM',
    prescriptionName: 'Meloxicam 15mg',
    refillDueDate: '2026-09-24',
    riskStatus: 'moderate',
    consentStatus: 'consented',
    consentDate: '2026-06-18',
    notes: 'Transportation assistance usually required.'
  },
  {
    id: 'pt-107',
    name: 'Chloe Bennett',
    phone: '+1 (555) 512-8834',
    email: 'cbennett@example.com',
    dateOfBirth: '1988-06-19',
    doctorName: 'Dr. Marcus Chen',
    clinicDepartment: 'Cardiology',
    nextAppointmentDate: 'Missed (3h ago)',
    nextAppointmentTime: '11:30 AM',
    riskStatus: 'high',
    consentStatus: 'revoked',
    consentDate: '2026-08-30',
    notes: 'Patient revoked automated voice consent on 2026-08-30. Direct staff contact only.'
  }
];

export const INITIAL_CALLS: CallRecord[] = [
  {
    id: 'call-901',
    patientId: 'pt-101',
    patientName: 'Eleanor Vance',
    patientPhone: '+1 (555) 234-8901',
    doctorName: 'Dr. Marcus Chen',
    callType: 'confirmation',
    status: 'completed',
    calleCallId: 'calle_live_8912_a7b',
    appointmentDateTime: 'Tomorrow at 10:30 AM',
    durationSeconds: 94,
    startedAt: '10 mins ago',
    completedAt: '8 mins ago',
    costSavedUsd: 220,
    transcript: [
      { speaker: 'agent', text: 'Hello, this is Sarah from Oakwood Clinic calling for Eleanor Vance. Am I speaking with Eleanor?', timestamp: '00:04' },
      { speaker: 'patient', text: 'Yes, speaking! Who is this again?', timestamp: '00:09' },
      { speaker: 'agent', text: 'This is the Oakwood Clinic virtual assistant. I am calling to confirm your cardiology visit with Dr. Marcus Chen tomorrow at 10:30 AM. Will you be able to attend?', timestamp: '00:18' },
      { speaker: 'patient', text: 'Oh yes, I have it on my calendar. I will definitely be there.', timestamp: '00:24' },
      { speaker: 'agent', text: 'Wonderful! We have your visit confirmed. Please remember to bring your insurance card and current medication bottles. Have a great day!', timestamp: '00:32' },
      { speaker: 'patient', text: 'Thank you Sarah, see you tomorrow.', timestamp: '00:36' }
    ],
    outcome: {
      status: 'confirmed',
      notes: 'Patient confirmed attendance for tomorrow at 10:30 AM. Reminded to bring medication bottles.'
    }
  },
  {
    id: 'call-902',
    patientId: 'pt-103',
    patientName: 'Grace Thorne',
    patientPhone: '+1 (555) 672-9912',
    doctorName: 'Dr. Robert Zhao',
    callType: 'recall',
    status: 'completed',
    calleCallId: 'calle_live_8913_c4e',
    appointmentDateTime: 'Missed Yesterday 09:00 AM',
    durationSeconds: 142,
    startedAt: '35 mins ago',
    completedAt: '32 mins ago',
    costSavedUsd: 280,
    transcript: [
      { speaker: 'agent', text: 'Hi Grace, this is Oakwood Orthopedics calling. We noticed you missed your post-op checkup with Dr. Robert Zhao yesterday and wanted to make sure you are doing alright.', timestamp: '00:06' },
      { speaker: 'patient', text: 'Oh dear, yes. My daughter was delayed in traffic and could not drive me. I was so worried I would be charged.', timestamp: '00:15' },
      { speaker: 'agent', text: 'No worries at all Grace, your health is our priority. Dr. Zhao wants to inspect your knee healing. Would you like to reschedule for this Thursday at 2:00 PM?', timestamp: '00:28' },
      { speaker: 'patient', text: 'Yes please! Thursday at 2:00 PM works much better for my ride.', timestamp: '00:35' },
      { speaker: 'agent', text: 'All set! You are rebooked for Thursday at 2:00 PM with Dr. Zhao. We will send a confirmation summary to your phone.', timestamp: '00:46' },
      { speaker: 'patient', text: 'Thank you so much for calling me directly.', timestamp: '00:52' }
    ],
    outcome: {
      status: 'rescheduled',
      newSlot: 'Thursday, Oct 16 at 2:00 PM',
      rescheduleReason: 'Transportation conflict with family driver',
      notes: 'Successfully recovered no-show. Rebooked with Dr. Zhao for Thursday 2:00 PM.'
    }
  },
  {
    id: 'call-903',
    patientId: 'pt-104',
    patientName: 'Samuel Miller',
    patientPhone: '+1 (555) 430-1178',
    doctorName: 'Dr. Marcus Chen',
    callType: 'medication',
    status: 'completed',
    calleCallId: 'calle_live_8914_f91',
    appointmentDateTime: 'Prescription Refill Due',
    durationSeconds: 110,
    startedAt: '1 hour ago',
    completedAt: '58 mins ago',
    transcript: [
      { speaker: 'agent', text: 'Good morning Samuel, calling from Dr. Marcus Chen\'s cardiology team regarding your Atorvastatin refill due on September 15th.', timestamp: '00:07' },
      { speaker: 'patient', text: 'Hi. Yes, I noticed I only have about 3 pills left in the bottle.', timestamp: '00:14' },
      { speaker: 'agent', text: 'Glad we connected! Would you like Dr. Chen\'s team to electronically approve the 90-day refill to your CVS pharmacy on Main St?', timestamp: '00:24' },
      { speaker: 'patient', text: 'Yes, but I have also been feeling mild muscle soreness in my calves since we increased to 20mg.', timestamp: '00:33' },
      { speaker: 'agent', text: 'Thank you for flagging that, Samuel. I am recording that mild muscle ache in your clinical chart, and I will have Nurse Brenda review your potassium labs and call you back this afternoon.', timestamp: '00:49' },
      { speaker: 'patient', text: 'That gives me peace of mind. Appreciate the proactive call.', timestamp: '00:55' }
    ],
    outcome: {
      status: 'flagged',
      hasConcerns: true,
      concernDetails: 'Patient reported mild muscle soreness in calves on Atorvastatin 20mg. Triage nurse callback queued.',
      followUpNeeded: true,
      notes: 'Refill sent to CVS Main St; clinical symptom flagged for provider review.'
    }
  },
  {
    id: 'call-904',
    patientId: 'pt-105',
    patientName: 'Amara Patel',
    patientPhone: '+1 (555) 349-8012',
    doctorName: 'Dr. Sarah Jenkins',
    callType: 'feedback',
    status: 'completed',
    calleCallId: 'calle_live_8915_b20',
    appointmentDateTime: 'Post-Visit Sept 11',
    durationSeconds: 82,
    startedAt: '2 hours ago',
    completedAt: '1 hour 58 mins ago',
    transcript: [
      { speaker: 'agent', text: 'Hello Amara, this is Oakwood Clinic following up on your annual wellness exam with Dr. Sarah Jenkins two days ago.', timestamp: '00:05' },
      { speaker: 'patient', text: 'Hi! Everything went great.', timestamp: '00:09' },
      { speaker: 'agent', text: 'Wonderful! On a 1 to 5 scale, how satisfied were you with Dr. Jenkins\'s care and our team\'s assistance?', timestamp: '00:18' },
      { speaker: 'patient', text: 'Definitely a 5. Dr. Jenkins took the time to answer all my preventive screening questions.', timestamp: '00:27' },
      { speaker: 'agent', text: 'That is fantastic to hear. Did you receive your patient portal login to view your lab bloodwork?', timestamp: '00:35' },
      { speaker: 'patient', text: 'Yes, downloaded it yesterday. Thank you!', timestamp: '00:40' }
    ],
    outcome: {
      status: 'acknowledged',
      rating: 5,
      feedback: 'Rated 5/5. Praised Dr. Jenkins for thorough preventive screening. Patient portal active.',
      followUpNeeded: false,
      notes: 'High satisfaction rating logged for Dr. Sarah Jenkins.'
    }
  },
  {
    id: 'call-905',
    patientId: 'pt-107',
    patientName: 'Chloe Bennett',
    patientPhone: '+1 (555) 512-8834',
    doctorName: 'Dr. Marcus Chen',
    callType: 'recall',
    status: 'in_progress',
    calleCallId: 'calle_live_8916_z90',
    appointmentDateTime: 'Missed Today 11:30 AM',
    durationSeconds: 46,
    startedAt: 'Just now',
    transcript: [
      { speaker: 'agent', text: 'Hello Chloe, this is Oakwood Cardiology checking in regarding your missed visit today.', timestamp: '00:05' },
      { speaker: 'patient', text: 'Hi, I had an emergency meeting at work and could not call in time.', timestamp: '00:14' },
      { speaker: 'agent', text: 'We completely understand. Dr. Chen has an open slot Friday at 3:30 PM. Would that work for you?', timestamp: '00:26' }
    ],
    outcome: {
      status: 'in_progress',
      notes: 'Active live call in progress via CALL-E engine...'
    }
  }
];

export const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: 'cmp-01',
    name: '24-Hour Cardiology Confirmations',
    callType: 'confirmation',
    status: 'running',
    totalPatients: 18,
    completedCalls: 14,
    confirmedCount: 11,
    rescheduledCount: 2,
    targetCriteria: 'Appointments scheduled for tomorrow under Cardiology',
    createdAt: '2026-09-13 08:00 AM'
  },
  {
    id: 'cmp-02',
    name: 'Orthopedic No-Show Recovery Blitz',
    callType: 'recall',
    status: 'completed',
    totalPatients: 12,
    completedCalls: 12,
    confirmedCount: 0,
    rescheduledCount: 9,
    targetCriteria: 'No-shows in last 48 hours across Orthopedic specialists',
    createdAt: '2026-09-12 04:30 PM'
  },
  {
    id: 'cmp-03',
    name: 'Monthly Chronic Care Adherence Check',
    callType: 'medication',
    status: 'draft',
    totalPatients: 24,
    completedCalls: 0,
    confirmedCount: 0,
    rescheduledCount: 0,
    targetCriteria: 'Hypertension and Statin patients with refills due within 5 days',
    createdAt: '2026-09-13 09:15 AM'
  }
];
