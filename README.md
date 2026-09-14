# ARGUS Clinical Platform

**Autonomous voice outreach for outpatient care — appointment confirmations, post-discharge checks, preventative recall, and medication adherence, with HIPAA technical safeguards built into the application layer.**

[![Status](https://img.shields.io/badge/status-demo%20%2F%20pre--production-f59e0b.svg)](#project-status)
[![HIPAA Architecture](https://img.shields.io/badge/HIPAA-technical%20safeguards%20implemented-0284c7.svg)](#hipaa-architecture)
[![Telephony](https://img.shields.io/badge/telephony-Call--E%20carrier%20gateway-0f766e.svg)](#architecture)
[![AI](https://img.shields.io/badge/AI-Gemini%20clinical%20reasoning-6366f1.svg)](#architecture)
[![Stack](https://img.shields.io/badge/stack-React%2019%20%7C%20TS%205.8%20%7C%20Express%204-0284c7.svg)](#tech-stack)

<!-- Add a screenshot or GIF here. It is the single highest-value addition to this README.
     Suggested: the operations dashboard with PHI Shield toggling on and off.
![ARGUS operations dashboard](docs/screenshot-dashboard.png)
-->

---

## Project status

ARGUS is a working demonstration platform. Real outbound calls are placed over a live carrier gateway, and the technical safeguards described below are implemented in code.

It is **not** a HIPAA-certified product, and no such certification exists. HIPAA compliance is a property of a full deployment — Business Associate Agreements, encryption at rest, durable audit retention, a documented risk analysis, and administrative policy — not of a codebase. [What ARGUS implements versus what a covered entity must still provide](#hipaa-architecture) is set out explicitly, because being precise about that line matters more in healthcare than claiming a badge.

---

## Contents

- [The problem](#the-problem)
- [What ARGUS does](#what-argus-does)
- [Quickstart](#quickstart)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [Call lifecycle](#call-lifecycle)
- [HIPAA architecture](#hipaa-architecture)
- [Security pipeline](#security-pipeline)
- [Clinical safety guardrails](#clinical-safety-guardrails)
- [Testing](#testing)
- [Project structure](#project-structure)
- [Tech stack](#tech-stack)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [Disclaimer](#disclaimer)

---

## The problem

Missed appointments and unconfirmed procedures are estimated to cost the US healthcare system upward of $150 billion a year.<sup>[1]</sup> The cost is not only financial: recall outreach, post-operative follow-up, and adherence checks fall to nursing and coordination staff as repetitive phone work, and the calls that get dropped are the preventative ones.

The work is high-volume, protocol-driven, and mostly identical call to call — which makes it a good fit for automation, and a terrible fit for a generic voice bot. Patient calls touch PHI, need consent gating, and occasionally surface someone describing chest pain. ARGUS is built around those three constraints.

<sup>[1]</sup> <!-- Replace with a real citation before publishing — the commonly circulated $150B figure traces to a 2017 industry estimate and reviewers will ask for the source. -->

---

## What ARGUS does

| Capability | Detail |
|---|---|
| **Real carrier calls** | Dispatches live cellular and landline calls through the Call-E gateway with low-latency voice synthesis. |
| **Browser simulation** | Runs the full conversational flow with local speech synthesis — test consent gating, reschedules, and escalation without burning carrier minutes. |
| **PHI Shield** | One-click visual masking of names, phone numbers, emails, and record IDs across every list, card, and transcript. Built for busy nursing stations and open reception desks. |
| **Station lockdown** | PIN-gated session lock that blanks patient records instantly when a coordinator steps away. |
| **Audit trail** | Append-only event log for every patient view, call dispatch, and EHR export, with actor, target, and statutory rule citation. |
| **Consent gating** | Per-patient communication preference (`PHONE` / `SMS` / `OPT_OUT`) with a logged verification date. Unconsented records are excluded from outbound queues at dispatch. |
| **Triage guardrails** | Red-flag symptom detection halts routine conversation, delivers emergency guidance, and pages the on-duty triage nurse. |
| **EHR write-back** | Generates FHIR-aligned SOAP encounter summaries with the confirmed slot, transport needs, and clinical notes. |

---

## Quickstart

**Prerequisites:** Node.js 20+, npm 10+, a Call-E API key for live calling. A Gemini API key is optional — without it, the clinical reasoning and SOAP generation features fall back to canned responses, but the UI and browser simulation run.

```bash
git clone https://github.com/<your-org>/argus-clinical-platform.git
cd argus-clinical-platform
npm install
cp .env.example .env        # then fill in your keys — see Configuration
npm run dev                 # http://localhost:3000
```

Then open the Dashboard, find the **Live Phone Test** card, enter a number you control, and dispatch. See [Testing](#testing).

```bash
npm run lint                # typecheck + lint
npm run build && npm start  # production bundle
```

---

## Configuration

Create `.env` in the project root. Every value here is read server-side only and must never reach the client bundle.

| Variable | Required | Purpose |
|---|---|---|
| `CALLE_API_KEY` | for live calls | Call-E carrier gateway credential. Browser simulation works without it. |
| `GEMINI_API_KEY` | optional | Server-side clinical reasoning, transcript extraction, SOAP generation. |
| `NODE_ENV` | yes | `development` \| `production` |
| `PORT` | no | Defaults to `3000`. |

> **Before you point this at anything real:** the public Gemini API is not covered by a Google Business Associate Agreement. If PHI will ever reach the model, that traffic needs to move to a BAA-eligible service, and you need a signed BAA with your telephony vendor as well. See [HIPAA architecture](#hipaa-architecture).

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                 CLINICAL WORKSTATION (React 19)         │
│  • PHI Shield visual masking    • PIN station lockdown  │
│  • sessionStorage only          • One-click PHI purge   │
└───────────────────────────┬─────────────────────────────┘
                            │  TLS 1.3
                            ▼
┌─────────────────────────────────────────────────────────┐
│              EXPRESS SECURE PROXY (server.ts)           │
│  • E.164 normalization        • Premium-rate blocking   │
│  • Prompt-injection scrubbing • Rolling IP rate limit   │
│  • Credentials held server-side, never in the bundle    │
└──────────────┬─────────────────────────┬────────────────┘
               │                         │
   minimal task payload          audit event
   (no demographic objects)      (no PHI in the log body)
               ▼                         ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│   CALL-E CARRIER GATEWAY │  │        AUDIT TRAIL       │
│  • phones: [E.164] only  │  │  • actor + timestamp     │
│  • ephemeral execution   │  │  • action + target ID    │
│  • no PHI persisted      │  │  • § 164.312(b) tag      │
└──────────────────────────┘  └──────────────────────────┘
                                          │
                              ⚠ currently in-memory;
                                see Roadmap for the
                                durable store this needs
```

The Express layer exists for one reason: nothing that holds a credential or shapes an outbound payload should run in a browser tab. The client never sees an API key, and never decides what leaves the building.

---

## Call lifecycle

```
Scheduled appointment or recall trigger
        │
        ▼
Consent check ───────── not consented ──► blocked, logged, excluded from queue
        │
        ▼
Clinician dispatch queue  (protocol + variables reviewed)
        │
        ▼
Call-E gateway  ──►  outbound ring
        │
        ▼
Patient identity verification (two identifiers)
        │
        ├──── confirmed / rescheduled ──► SOAP generation ──► EHR export + audit write
        │
        └──── red-flag symptoms ────────► emergency guidance + triage nurse page
                                          (routine protocol abandoned)
```

---

## HIPAA architecture

ARGUS implements the safeguards that are implementable in application code. The table separates that from what a covered entity has to bring to a deployment — the second column is the one that gets skipped in most healthcare demos, and the one a compliance officer will read first.

| Safeguard | CFR | Implemented in ARGUS | Still required for production |
|---|---|---|---|
| Minimum necessary | § 164.502(b) | Carrier payloads carry only `phones: [E.164]` plus an ephemeral protocol instruction. No demographic charts or clinical history leave the proxy. | Documented minimum-necessary policy; periodic payload review. |
| Access control | § 164.312(a)(1) | PIN station lockdown; `sessionStorage` rather than `localStorage`, so PHI is disposed of when the tab closes; one-click session purge. | Unique user IDs and real authn/authz (a)(2)(i), automatic logoff (a)(2)(iii), encryption at rest (a)(2)(iv), RBAC by clinical role. |
| Audit controls | § 164.312(b) | Append-only event log: `VIEW_PATIENT`, `DISPATCH_CALL`, `EXPORT_EHR`, each with timestamp, actor, action, target type, target ID, description, rule citation. | A durable, tamper-evident store with six-year retention (§ 164.316(b)(2)(i)). The current log is in-memory and does not survive restart — it demonstrates the event schema, not the retention guarantee. |
| Transmission security | § 164.312(e)(1) | TLS 1.3 for all client ↔ proxy ↔ carrier traffic. Credentials server-side only. | Certificate management, cipher policy, and integrity controls verified in the deployed environment. |
| Business associates | § 164.308(b)(1), § 164.502(e) | Third-party payloads minimized by design so the blast radius of a vendor breach is a phone number and a call objective. | **Signed BAAs with the telephony vendor and the model provider.** Not optional, and not something code can satisfy. |
| Visual protection | — | PHI Shield masks names (`J****n T****r`), phones (`+1 (***) ***-1234`), and emails across all views to prevent shoulder-surfing. | Note the distinction: this is display-layer obfuscation against bystanders. It is **not** Safe Harbor de-identification under § 164.514(b) — the underlying records are still PHI in session memory, and only removal of all 18 identifiers from the data itself gets you de-identified. |
| Patient communication consent | § 164.520, TCPA | Per-patient preference plus logged verification date; unconsented records visually flagged and excluded from bulk campaigns. | Legal review of your TCPA position. The healthcare-message exemption for artificial-voice calls to mobile numbers is narrower than most teams assume. |
| Breach notification | §§ 164.400–414 | — | Detection, documentation, and notification procedures. Out of scope for the application. |
| Risk analysis | § 164.308(a)(1)(ii)(A) | — | A documented, organization-wide risk assessment. Prerequisite for everything above. |

---

## Security pipeline

Every outbound dispatch passes through `server.ts` in this order:

```
1. Rate limit          5 calls per 5-minute rolling window, per client IP
2. E.164 validation    rejects malformed, incomplete, and spoofed numbers
3. Premium blocking    refuses 1-900 / 1-976 and equivalent premium prefixes
4. Prompt sanitization strips control characters and system-role override attempts
5. Payload packaging   assembles the task objective — no demographic DB objects
```

Steps 2 and 3 are the ones that stop a bad day from becoming an expensive one: a compromised or mistyped record cannot bill you through a premium-rate route, and a number that does not normalize never reaches the carrier.

Step 4 matters because patient-supplied text (chief complaint, notes) reaches a prompt. That is an injection surface, and it is treated as untrusted input rather than as content.

---

## Clinical safety guardrails

The agent operates under hard negative constraints. It cannot diagnose, cannot alter a prescription, and cannot promise a clinical outcome.

Red-flag detection covers chest pain, shortness of breath, sudden weakness, and severe pain. On any of these, routine protocol is abandoned mid-call — the agent does not finish confirming the appointment first. It delivers emergency guidance ("Please hang up and dial 911, or proceed to the nearest emergency room"), flags the encounter as high urgency, and pages the on-duty triage nurse.

Detection rules and escalation paths are configuration, not hardcoded logic, and are meant to be reviewed and signed off by a clinical director before any live deployment.

---

## Testing

**Live phone call**

1. Open the **Dashboard** and locate the **Live Phone Test** card.
2. Enter a mobile number you personally control. Do not commit a real number to this repo.
3. Click **Call** to open the Call Dispatcher.
4. Select **Real Phone Call (Call-E API)** and click **Dispatch Call-E Voice Agent**.
5. Answer on the device to test IVR behaviour, latency, and identity verification.

**Browser simulation**

In the Call Dispatcher, choose **Browser Simulation (Interactive AI Audio)**. The session renders through local speech synthesis, which lets you exercise consent checks, slot changes, and nurse escalation with no carrier cost. Use this for everything except latency testing.

**Compliance walkthrough**

Toggle PHI Shield with a patient drawer open, then open the audit modal and confirm the `VIEW_PATIENT` event landed with the right actor and target ID. That path is the one auditors ask about.

---

## Project structure

<!-- Adjust to match the actual tree — `tree -L 2 -I 'node_modules|dist'` will generate it. -->

```
argus-clinical-platform/
├── server.ts              # Express secure proxy: security pipeline, carrier + model calls
├── src/
│   ├── components/        # Dashboard, patient directory, call dispatcher, audit modal
│   ├── hooks/             # PHI Shield, station lock, session storage
│   ├── lib/               # E.164 helpers, audit event builders, SOAP formatting
│   └── types/             # Patient, consent, audit event, call protocol schemas
├── .env.example
└── vite.config.ts
```

---

## Tech stack

**Frontend** — React 19, TypeScript 5.8, Vite 6.2, Tailwind CSS v4 with a custom clinical palette (Clinical Slate, Medical Sky, Alert Rose), `motion` v12 for modal transitions, `lucide-react` for iconography.

**Backend** — Node.js 20 with native TypeScript type stripping (`tsx` in development, `esbuild` for the production CommonJS bundle), Express 4.21 as a hardened reverse proxy.

**External services** — Call-E carrier network (`api.heycall-e.com/v1/calls`) for telephony; Google GenAI SDK (`@google/genai`) with Gemini models for clinical reasoning, transcript extraction, and SOAP generation.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Dispatch returns 4xx immediately | Number failed E.164 normalization, or hit the premium-prefix block. Check the proxy log for which pipeline step rejected it. |
| Call never rings | `CALLE_API_KEY` missing or expired. The browser simulation path does not exercise this credential, so a working simulation tells you nothing about the key. |
| Rate limit after a few test calls | Five dispatches per five minutes per IP, by design. Use browser simulation while iterating. |
| Patient records empty after refresh | Expected. `sessionStorage` is intentional — PHI is disposed of with the tab. |
| Audit log empty after restart | Expected in the current build; the log is in-memory. See [Roadmap](#roadmap). |
| SOAP summaries generic or missing | `GEMINI_API_KEY` unset; the platform is running on fallback responses. |

---

## Roadmap

Ordered by what stands between this build and a pilot deployment:

- [ ] **Durable audit store** — append-only persistence with WORM semantics and six-year retention. The current in-memory log is the largest gap between the implemented safeguards and § 164.312(b).
- [ ] **Real authentication and RBAC** — unique clinician identities, automatic logoff, role-scoped record access. The PIN lock is a physical-presence control, not an access control.
- [ ] **Encryption at rest** for any persisted record.
- [ ] **BAA-eligible model routing** so PHI never transits the public Gemini API.
- [ ] Per-clinic configurable red-flag symptom sets with clinical sign-off workflow.
- [ ] Real FHIR endpoint integration, replacing FHIR-aligned export objects.
- [ ] Multilingual outreach with per-patient language preference.
- [ ] Retry and voicemail-detection logic for unanswered dispatches.

---

## Disclaimer

ARGUS is a clinical coordination assistance tool. It does not provide independent medical advice, diagnosis, or treatment. All outreach protocols and triage escalation rules must be reviewed and approved by a licensed clinical director and a compliance officer before deployment in any live clinical environment. Deploying this software against real patient data without the controls listed in [HIPAA architecture](#hipaa-architecture) would not be compliant.

---

## License

Proprietary and confidential. Engineered for health systems and clinical provider networks.

<!-- If this repository is public, "proprietary and confidential" with no LICENSE file leaves the terms undefined.
     Either add an explicit proprietary license file or choose an open license. -->
