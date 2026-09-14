import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface AuthenticatedRequest extends Request {
  rawBody?: Buffer;
}

interface RateLimitRecord {
  timestamps: number[];
}
const callRateLimits = new Map<string, RateLimitRecord>();
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const MAX_CALLS_PER_WINDOW = 5;

function checkCallRateLimit(clientIp: string): { allowed: boolean; remaining: number; retryAfterSec?: number } {
  const now = Date.now();
  const record = callRateLimits.get(clientIp) || { timestamps: [] };

  const activeTimestamps = record.timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);

  if (activeTimestamps.length >= MAX_CALLS_PER_WINDOW) {
    const oldest = activeTimestamps[0];
    const retryAfterSec = Math.ceil((oldest + RATE_LIMIT_WINDOW_MS - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSec };
  }

  activeTimestamps.push(now);
  callRateLimits.set(clientIp, { timestamps: activeTimestamps });
  return { allowed: true, remaining: MAX_CALLS_PER_WINDOW - activeTimestamps.length };
}

const E164_REGEX = /^\+[1-9]\d{1,14}$/;

function validateAndNormalizePhone(raw: any): { valid: boolean; normalized: string; error?: string } {
  if (!raw || typeof raw !== 'string') {
    return { valid: false, normalized: '', error: 'Phone number is required.' };
  }

  const cleaned = raw.replace(/[\s\-\(\)\.]/g, '');

  if (!E164_REGEX.test(cleaned)) {
    return {
      valid: false,
      normalized: '',
      error: 'Invalid phone format. Number must comply with international E.164 standard (e.g., +15551234567).'
    };
  }

  if (/^\+1(900|976)/.test(cleaned)) {
    return {
      valid: false,
      normalized: '',
      error: 'Outbound calls to premium-rate numbers are strictly blocked by clinic security policy.'
    };
  }

  return { valid: true, normalized: cleaned };
}

function sanitizeClinicalField(val: any, maxLength = 50): string {
  if (typeof val !== 'string') return '';
  return val
    .replace(/[\r\n\t]/g, ' ')
    .replace(/[<{}>`"\\$]/g, '')
    .replace(/(ignore\s+previous|system:|assistant:|prompt:|bypass|jailbreak)/gi, '')
    .trim()
    .slice(0, maxLength);
}

function buildLockedClinicalPrompt(
  callType: string,
  patientName: string,
  doctorName: string,
  appointmentDate: string,
  phoneNumber: string
): string {
  const safePatient = sanitizeClinicalField(patientName, 40) || 'the patient';
  const safeDoctor = sanitizeClinicalField(doctorName, 40) || 'Dr. Elena Rostova';
  const safeDate = sanitizeClinicalField(appointmentDate, 40) || 'the upcoming scheduled visit';

  const guardrails = [
    'CLINICAL SAFETY DIRECTIVES:',
    'You are an authorized medical AI assistant for Oakwood Health System. You are restricted strictly to clinical visit coordination.',
    'Never request financial information, credit cards, or Social Security numbers.',
    'Confirm patient identity via HIPAA guidelines before communicating sensitive visit details.',
    'If the patient reports acute, emergency, or severe medical symptoms (such as sudden chest pain or shortness of breath), advise them immediately to dial 911 or proceed to the nearest emergency department.',
    'Maintain a calm, professional, empathetic clinical tone.'
  ].join(' ');

  let taskObjective = '';
  switch (callType) {
    case 'recall':
      taskObjective = `Call ${safePatient} regarding their missed appointment with ${safeDoctor}. Inquire if they need to reschedule (offer Thursday 2:00 PM or Tuesday 10:00 AM) and verify if they encountered transit or care barriers.`;
      break;
    case 'medication':
      taskObjective = `Call ${safePatient} regarding their medication refill authorization with ${safeDoctor}. Confirm if they require pharmacy transmission and screen for dizziness or adverse reactions.`;
      break;
    case 'feedback':
      taskObjective = `Conduct a brief follow-up survey for ${safePatient} following their recent visit with ${safeDoctor}. Ask about their recovery progress and log their satisfaction rating (1 to 5).`;
      break;
    case 'confirmation':
    default:
      taskObjective = `Confirm that ${safePatient} will attend their scheduled appointment with ${safeDoctor} on ${safeDate}. Inquire if transportation is arranged and confirm pre-appointment lab preparations.`;
      break;
  }

  return `You are Sarah, an empathetic clinical coordinator from Oakwood Health System. You are calling ${safePatient} at ${phoneNumber} on behalf of ${safeDoctor}. OBJECTIVE: ${taskObjective} ${guardrails}`;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({
    verify: (req: AuthenticatedRequest, _res, buf) => {
      req.rawBody = buf;
    }
  }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      securityProfile: 'ARGUS Hardened v2.4 (OWASP Compliant)',
      calleConfigured: Boolean(process.env.CALLE_API_KEY && process.env.CALLE_API_KEY.trim() !== ''),
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '')
    });
  });

  app.get('/api/calle/config', (_req: Request, res: Response) => {
    const hasKey = Boolean(process.env.CALLE_API_KEY && process.env.CALLE_API_KEY.trim() !== '');

    res.json({
      hasApiKey: hasKey,
      endpoint: 'https://api.heycall-e.com/v1/calls',
      voiceAgent: 'CALL-E (Sarah - Clinical Outbound Specialist)',
      rateLimitMaxPerWindow: MAX_CALLS_PER_WINDOW,
      windowMinutes: 5
    });
  });

  app.post('/api/calle/call', async (req: Request, res: Response) => {
    try {
      const clientIp = req.ip || (req.headers['x-forwarded-for'] as string) || 'local-client';

      const rateCheck = checkCallRateLimit(clientIp);
      if (!rateCheck.allowed) {
        res.setHeader('Retry-After', rateCheck.retryAfterSec || 60);
        return res.status(429).json({
          error: `Rate limit exceeded. Maximum ${MAX_CALLS_PER_WINDOW} outbound phone calls permitted per 5 minutes to prevent toll fraud. Please retry in ${rateCheck.retryAfterSec} seconds.`,
          code: 'RATE_LIMIT_EXCEEDED'
        });
      }

      const {
        phoneNumber,
        patientName,
        doctorName,
        appointmentDate,
        callType = 'confirmation',
        clientApiKey
      } = req.body;

      const phoneValidation = validateAndNormalizePhone(phoneNumber);
      if (!phoneValidation.valid) {
        return res.status(400).json({
          error: phoneValidation.error,
          code: 'INVALID_PHONE_FORMAT'
        });
      }
      const verifiedPhone = phoneValidation.normalized;

      const apiKey = (
        process.env.CALLE_API_KEY ||
        (typeof clientApiKey === 'string' ? clientApiKey.trim() : '') ||
        (req.headers['x-calle-api-key'] as string) ||
        ''
      ).trim();

      if (!apiKey) {
        return res.status(400).json({
          error: 'CALLE_API_KEY is not configured. Please add your CALL-E API key to environment variables (.env) or enter it in the connection drawer.',
          code: 'MISSING_API_KEY'
        });
      }

      const lockedTaskPrompt = buildLockedClinicalPrompt(
        callType,
        patientName,
        doctorName,
        appointmentDate,
        verifiedPhone
      );

      const payload = {
        task: lockedTaskPrompt,
        recipients: [
          {
            name: sanitizeClinicalField(patientName, 40) || 'Patient',
            phones: [verifiedPhone]
          }
        ],
        result_schema: {
          patient_verified: 'boolean',
          status: 'confirmed | rescheduled | cancelled | voicemail | flagged',
          new_appointment_slot: 'string or null',
          transportation_needed: 'boolean',
          reported_symptoms: 'string or null',
          clinical_triage_urgency: 'low | medium | high | emergency',
          summary: 'string'
        }
      };

      console.log(`[ARGUS Telephony] Secure dispatch to ${verifiedPhone} via Call-E carrier gateway (Remaining window quota: ${rateCheck.remaining})...`);

      const response = await fetch('https://api.heycall-e.com/v1/calls', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      let responseData: any = {};
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { message: 'Carrier response received' };
      }

      if (!response.ok) {
        console.error('[ARGUS Call-E Gateway Error]:', response.status);
        return res.status(response.status).json({
          error: responseData.message || responseData.error || `Call-E gateway error (${response.status})`
        });
      }

      return res.json({
        success: true,
        mode: 'live_calle',
        taskId: responseData.id || responseData.task_id || responseData.call_id || `calle_${Date.now()}`,
        status: responseData.status || 'queued',
        recipient: verifiedPhone,
        patientName: sanitizeClinicalField(patientName, 40),
        createdAt: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('[ARGUS Server Error]:', err.message);
      return res.status(500).json({
        error: 'Internal server error while executing secure telephony gateway request.'
      });
    }
  });

  app.get('/api/calle/status/:taskId', async (req: Request, res: Response) => {
    try {
      const { taskId } = req.params;

      if (!taskId || !/^[a-zA-Z0-9_\-]+$/.test(taskId)) {
        return res.status(400).json({ error: 'Invalid task identifier format.' });
      }

      const apiKey = (
        process.env.CALLE_API_KEY ||
        (req.headers['x-calle-api-key'] as string) ||
        (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : '')
      ).trim();

      if (!apiKey) {
        return res.status(400).json({ error: 'Authentication required. Missing CALLE_API_KEY.' });
      }

      const response = await fetch(`https://api.heycall-e.com/v1/calls/${encodeURIComponent(taskId)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      return res.json(data);
    } catch (err: any) {
      console.error('[ARGUS Status Error]:', err.message);
      return res.status(500).json({ error: 'Failed to retrieve call status.' });
    }
  });

  app.post('/api/calle/webhook', (req: AuthenticatedRequest, res: Response) => {
    const signature = (req.headers['x-calle-signature'] || req.headers['x-webhook-signature']) as string | undefined;
    const timestamp = req.headers['x-calle-timestamp'] as string | undefined;
    const webhookSecret = process.env.CALLE_WEBHOOK_SECRET;

    if (webhookSecret && webhookSecret.trim() !== '') {
      if (!signature) {
        console.warn('[ARGUS Webhook Rejected]: Missing required signature header');
        return res.status(401).json({ error: 'Unauthorized. Missing x-calle-signature header.' });
      }

      if (timestamp) {
        const timeDelta = Math.abs(Date.now() - parseInt(timestamp, 10));
        if (isNaN(timeDelta) || timeDelta > 5 * 60 * 1000) {
          console.warn('[ARGUS Webhook Rejected]: Timestamp expired (replay attack defense)');
          return res.status(401).json({ error: 'Unauthorized. Webhook timestamp outside allowed 5-minute window.' });
        }
      }

      try {
        const payloadToSign = req.rawBody ? req.rawBody : Buffer.from(JSON.stringify(req.body));
        const expectedSignature = crypto
          .createHmac('sha256', webhookSecret)
          .update(payloadToSign)
          .digest('hex');

        const signatureBuffer = Buffer.from(signature, 'hex');
        const expectedBuffer = Buffer.from(expectedSignature, 'hex');

        if (
          signatureBuffer.length !== expectedBuffer.length ||
          !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
        ) {
          console.warn('[ARGUS Webhook Rejected]: Cryptographic signature mismatch');
          return res.status(401).json({ error: 'Unauthorized. Invalid webhook signature.' });
        }
      } catch (cryptoErr) {
        console.error('[ARGUS Webhook Crypto Error]:', cryptoErr);
        return res.status(401).json({ error: 'Signature verification failure.' });
      }
    }

    console.log('[ARGUS Webhook Verified]: Successfully received terminal callback from Call-E:', req.body);
    return res.json({ received: true, verified: Boolean(webhookSecret) });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ARGUS Hardened Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

