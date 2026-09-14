import { AuditLogEntry } from '../types';

const SESSION_PATIENTS_KEY = 'argus_session_patients';
const SESSION_CALLS_KEY = 'argus_session_calls';
const SESSION_CAMPAIGNS_KEY = 'argus_session_campaigns';
const SESSION_AUDIT_LOGS_KEY = 'argus_session_audit_logs';

export const sessionStore = {
  get<T>(key: string, fallback: T): T {
    try {
      const item = sessionStorage.getItem(key);
      if (!item) return fallback;
      return JSON.parse(item) as T;
    } catch {
      return fallback;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('[ARGUS Security] Session storage write failed, maintaining in-memory only', e);
    }
  },

  purgeAllPHI(): void {
    try {
      sessionStorage.removeItem(SESSION_PATIENTS_KEY);
      sessionStorage.removeItem(SESSION_CALLS_KEY);
      sessionStorage.removeItem(SESSION_CAMPAIGNS_KEY);
      sessionStorage.removeItem(SESSION_AUDIT_LOGS_KEY);
      localStorage.removeItem('smartrecall_patients');
      localStorage.removeItem('smartrecall_calls');
      localStorage.removeItem('smartrecall_campaigns');
      localStorage.removeItem('smartrecall_calle_key');
    } catch (e) {
      console.error('[ARGUS Security] Error during PHI session purge:', e);
    }
  },

  KEYS: {
    PATIENTS: SESSION_PATIENTS_KEY,
    CALLS: SESSION_CALLS_KEY,
    CAMPAIGNS: SESSION_CAMPAIGNS_KEY,
    AUDIT_LOGS: SESSION_AUDIT_LOGS_KEY
  }
};

export const phiMask = {
  maskName(name: string, isMasked: boolean): string {
    if (!isMasked || !name) return name;
    const parts = name.trim().split(' ');
    return parts
      .map(part => (part.length <= 1 ? part : `${part[0]}${'*'.repeat(Math.max(2, part.length - 2))}${part[part.length - 1]}`))
      .join(' ');
  },

  maskPhone(phone: string, isMasked: boolean): string {
    if (!isMasked || !phone) return phone;
    const digits = phone.replace(/\D/g, '');
    if (digits.length >= 4) {
      const last4 = digits.slice(-4);
      return `+1 (***) ***-${last4}`;
    }
    return '+1 (***) ***-****';
  },

  maskEmail(email: string, isMasked: boolean): string {
    if (!isMasked || !email) return email;
    const [user, domain] = email.split('@');
    if (!domain) return '***@***';
    const maskedUser = user.length > 2 ? `${user[0]}***${user[user.length - 1]}` : '***';
    return `${maskedUser}@${domain}`;
  }
};

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud-001',
    timestamp: 'Today, 08:30:15',
    actor: 'Dr. Marcus Chen (ID: PR-882)',
    action: 'VIEW_PATIENT',
    targetType: 'PATIENT',
    targetId: 'pt-001',
    targetDescription: 'Viewed patient chart for Jordan Taylor',
    complianceRule: 'HIPAA § 164.312(b) Access Control'
  },
  {
    id: 'aud-002',
    timestamp: 'Today, 08:45:22',
    actor: 'Sarah (CALL-E AI Assistant)',
    action: 'DISPATCH_CALL',
    targetType: 'CALL_RECORD',
    targetId: 'call-101',
    targetDescription: 'Outbound appointment confirmation initiated with 2-identifier protocol',
    complianceRule: 'HIPAA § 164.502 Minimum Necessary'
  },
  {
    id: 'aud-003',
    timestamp: 'Today, 09:12:04',
    actor: 'Elena Rostova, RN',
    action: 'EXPORT_EHR',
    targetType: 'CALL_RECORD',
    targetId: 'call-101',
    targetDescription: 'Exported Clinical SOAP note into Epic EHR schedule',
    complianceRule: 'HIPAA § 164.312(c)(1) Integrity Controls'
  }
];

export const auditLogger = {
  getLogs(): AuditLogEntry[] {
    return sessionStore.get<AuditLogEntry[]>(sessionStore.KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  },

  log(
    action: AuditLogEntry['action'],
    targetType: AuditLogEntry['targetType'],
    targetId: string,
    targetDescription: string,
    complianceRule: string = 'HIPAA § 164.312(b)'
  ): AuditLogEntry {
    const newEntry: AuditLogEntry = {
      id: `aud-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      actor: 'Clinical Operator (Station #4)',
      action,
      targetType,
      targetId,
      targetDescription,
      complianceRule
    };

    const currentLogs = this.getLogs();
    const updated = [newEntry, ...currentLogs];
    sessionStore.set(sessionStore.KEYS.AUDIT_LOGS, updated);
    return newEntry;
  }
};
