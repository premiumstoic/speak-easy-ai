# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev           # Dev server at http://localhost:8080
npm run build         # Production build
npm run build:dev     # Development build (includes source maps)
npm run lint          # ESLint check
npm test              # Run Vitest tests once
npm run test:watch    # Run Vitest in watch mode
npm run test:ai       # Run AI stack integration smoke tests (requires FAL_KEY or VITE_FAL_KEY)
npm run preview       # Preview production build
```

Run a single Vitest test file:
```bash
npm test -- src/test/example.test.ts
```

The `test:ai` script (`scripts/test-ai-stack.mjs`) tests Whisper connectivity, the Insight Generator, Process Observer tripwire detection, and Mirroring/Empathy judges. It uses FAL.ai as the LLM gateway; override defaults with `FAL_LLM_ENDPOINT` (default: `openrouter/router`) and `FAL_LLM_MODEL` (default: `openai/gpt-4o-mini`).

The Edge Function (`supabase/functions/process-therapy-event/`) has its own Deno unit tests (`index.test.ts`) run with `deno test`.

## Architecture Overview

**Umay** is a React + TypeScript SPA for couples relationship therapy, supporting two modalities — Imago Dialogue and Open Mediation — built on Vite, Tailwind CSS, shadcn/ui, and Supabase.

### Routing & Route Guards

All routes defined in `src/App.tsx`. Two custom guards:
- `ProtectedRoute` (`src/components/ProtectedRoute.tsx`) — requires authenticated user with a `couple_id`. Redirects to `/onboarding` if missing.
- `OnboardingGuard` (inline in `App.tsx`) — requires authenticated user *without* `couple_id`. Redirects to `/` if already paired.

Authenticated users always land in one of two flows: onboarding (set name + create/join couple) or the main app (Home, Session, Journey, Profile).

### Authentication

Managed by `AuthContext` (`src/contexts/AuthContext.tsx`). Provides `user`, `session`, `profile`, `loading`, `refreshProfile()`, and `signOut()`.

- Supabase Auth with email/password and Google OAuth (via `@lovable.dev/cloud-auth-js` in `src/integrations/lovable/`)
- On user creation, a Supabase trigger (`handle_new_user`) auto-creates a row in `profiles`
- Session persisted to localStorage; tokens auto-refreshed

### Supabase Integration

Client at `src/integrations/supabase/client.ts`. Auto-generated TypeScript types at `src/integrations/supabase/types.ts`.

**Key tables:**
| Table | Purpose |
|-------|---------|
| `profiles` | User metadata; `couple_id` determines app routing state |
| `couples` | Pair of users (`partner_a`, `partner_b`) |
| `couple_invites` | 6-char invite codes for pairing (`pending`/`accepted`/`expired`) |
| `sessions` | Therapy session records per couple |
| `session_turns` | Individual speaking turns within a session |
| `therapy_logs` | `session_id`, `speaker`, `raw_transcript`, `ai_analysis` (JSONB) — written by the Edge Function |

All tables use Row Level Security. The helper function `is_couple_member()` is used in RLS policies to avoid recursive checks.

### Therapy Session Architecture

The core feature is a configuration-driven state machine. The active protocol is selected on the Home screen and passed into `useSessionState`.

**Two protocols:**

| Protocol | File | Technique |
|----------|------|-----------|
| Imago Core Dialogue | `src/data/imagoProtocol.ts` | Structured turn-taking: Sender → Mirroring → Validation → Empathy → Role Reversal |
| Open Mediation | `src/data/openMediationProtocol.ts` | Free-form conversation; AI observes silently and interrupts only on tripwire detection |

- **State machine hook**: `src/hooks/useSessionState.ts` — manages current state, active partner, transcripts, timers, and strike count (max 3 strikes for toxicity). Accepts a `TherapyConfig` object defined in `src/types/therapyConfig.ts`.
- **Session UI**: `src/pages/Session.tsx` — renders either split-screen (`PartnerZone` + `CenterMediator`) for Imago or shared-orb (`HearthOrb`) for Open Mediation, plus `GroundingOverlay` and `AIInterventionOverlay`.

**Imago phases (in order):** `grounding` → `sender` → `mirroring` → `validation` → `empathy` → `role_reversal` → (repeat up to `config.max_turns`)

**Open Mediation states:** `state_open_floor` (both speaking freely) → `state_ai_intervention` (on tripwire) → back to `state_open_floor`

**Tripwires (Open Mediation):** `the_loop` · `the_missed_drop` · `the_escalation` · `the_stonewall`

### Speech-to-Text Pipeline (`useFalStreaming.ts`)

Dual-layer architecture for real-time + accurate transcription:

1. **Web Speech API** (local, instant) — streams interim results while speaking
2. **FAL.ai Whisper** (cloud, on stop) — high-accuracy final transcript from the recorded audio blob

On `stopRecording()`, if the recorded audio blob > 500 bytes, it's sent to `fal.ai/whisper`. Falls back to the Web Speech result if FAL fails. Requires `VITE_FAL_KEY`.

### Therapy Logging & AI Decision Pipeline

`useTherapyLogger` (`src/hooks/useTherapyLogger.ts`) is **not** a direct Supabase write. It posts `TherapyEventRequest` payloads to the `process-therapy-event` Supabase Edge Function, which persists to `therapy_logs` and returns a `TherapyDecisionResponse`.

**Three methods on the hook:**
- `logAnalysisTick(speaker, transcript, stateKey, chunkIndex)` — mid-turn streaming analysis; fires `event_type: "analysis_tick"`
- `logTurn(speaker, transcript, stateKey, chunkIndex)` — final turn; fires `event_type: "turn_final"`
- `logIntervention(interventionText)` — records system interventions as speaker `"System"`

**`process-therapy-event` Edge Function** (`supabase/functions/process-therapy-event/index.ts`):
- Validates `TherapyEventRequest` (session_id, speaker, transcript, event_type, etc.)
- For `technique_id: "open_mediation_enactment"` only: runs a keyword heuristic (`heuristicDecision`), then optionally upgrades to an OpenAI call (`OPENAI_API_KEY` env var; default model `gpt-4.1-mini`)
- Normalizes the decision: `action_decision` is forced to `"null"` if `confidence_score < 0.85` or `detected_tripwire` is missing
- Inserts the result into `therapy_logs` (`ai_analysis` JSONB column) and returns `TherapyDecisionResponse`
- Without `OPENAI_API_KEY`, falls back to heuristic keyword matching only

### AI Intervention UI (`AIInterventionOverlay.tsx`)

Triggered when a tripwire is detected in Open Mediation. Three phases:
1. **Chime** — plays a 528 Hz → 264 Hz sine wave via Web Audio API for 1.8s
2. **Speaking** — types out the intervention text character-by-character
3. **Done** — shows "Continue Conversation" button, calls `onComplete`

### State Management

- **AuthContext** — global auth and profile state
- **`useSessionState`** — local session state machine; not persisted until session ends
- **React Query** — configured but lightly used; intended for future server-state caching
- **React Hook Form + Zod** — form validation throughout

### Styling

Tailwind CSS v3 with a custom Material Design 3-inspired theme. Design tokens defined in `src/index.css`. Typography: Playfair Display (headings) and Outfit (body). Role-based colors distinguish sender (green) vs receiver (blue) zones in the Imago session UI.

### Environment Variables

**Frontend** (`.env`):
```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=
VITE_FAL_KEY=          # FAL.ai API key — required for Whisper transcription
```

**Edge Function** (`supabase/functions/process-therapy-event/.env.example`):
```
OPENAI_API_KEY=        # Optional — enables AI-powered tripwire detection; heuristic fallback if absent
OPENAI_MODEL=gpt-4.1-mini
```
