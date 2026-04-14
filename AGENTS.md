# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Dev server at http://localhost:8080
npm run build     # Production build
npm run lint      # ESLint check
npm test          # Run tests once
npm run preview   # Preview production build
```

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
| `therapy_logs` | Real-time observer log of turns and AI interventions (JSONB `ai_analysis`) |

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

**Imago phases (in order):** `grounding` → `sender` → `mirroring` → `validation` → `empathy` → `role_reversal` → (repeat)

**Open Mediation states:** `state_open_floor` (both speaking freely) → `state_ai_intervention` (on tripwire) → back to `state_open_floor`

**Tripwires (Open Mediation):** `the_loop` · `the_missed_drop` · `the_escalation` · `the_stonewall`

### Speech-to-Text Pipeline (`useFalStreaming.ts`)

Dual-layer architecture for real-time + accurate transcription:

1. **Web Speech API** (local, instant) — streams interim results while speaking
2. **FAL.ai Whisper** (cloud, on stop) — high-accuracy final transcript from the recorded audio blob

On `stopRecording()`, if the recorded audio blob > 500 bytes, it's sent to `fal.ai/whisper`. Falls back to the Web Speech result if FAL fails. Requires `VITE_FAL_KEY`.

### Therapy Logging (`useTherapyLogger.ts`)

Writes to the `therapy_logs` Supabase table for a real-time observer dashboard.

- `logTurn(speaker, transcript, stateKey)` — records a partner speaking turn
- `logIntervention(tripwireId, text)` — records an AI tripwire intervention with `confidence`, `action_decision: "interrupt"`, and `chain_of_thought`

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

Required in `.env`:
```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=
VITE_FAL_KEY=          # FAL.ai API key — required for Whisper transcription
```
