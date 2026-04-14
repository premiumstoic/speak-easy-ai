# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Dev server at http://localhost:8080
npm run build     # Production build
npm run lint      # ESLint check
npm test          # Run tests once
npm run preview   # Preview production build
```

## Architecture Overview

**Umay** is a React + TypeScript SPA for couples relationship therapy using the Imago Dialogue technique, built on Vite, Tailwind CSS, shadcn/ui, and Supabase.

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

All tables use Row Level Security. The helper function `is_couple_member()` is used in RLS policies to avoid recursive checks.

### Therapy Session Architecture

The core feature is a configuration-driven Imago Dialogue state machine.

- **Protocol config**: `src/data/imagoProtocol.ts` — defines states, transitions, prompts, evaluation hooks, and per-phase timing
- **State machine hook**: `src/hooks/useSessionState.ts` — manages current state, active partner, transcripts, timers, and strike count (max 3 strikes for toxicity)
- **Session UI**: `src/pages/Session.tsx` — split-screen layout using `PartnerZone`, `CenterMediator`, and `GroundingOverlay` components

**Therapy phases (in order):** `grounding` → `sender` → `mirroring` → `validation` → `empathy` → `role_reversal` → (repeat)

The protocol config references evaluation engines (`background_analyst`, `llm_as_judge`) and frameworks (`gottman_toxicity`, `eft_needs`) — these are not yet implemented client-side.

### State Management

- **AuthContext** — global auth and profile state
- **`useSessionState`** — local session state machine; not persisted until session ends
- **React Query** — configured but lightly used; intended for future server-state caching
- **React Hook Form + Zod** — form validation throughout

### Styling

Tailwind CSS v3 with a custom Material Design 3-inspired theme. Design tokens defined in `src/index.css`. Typography: Playfair Display (headings) and Outfit (body). Role-based colors distinguish sender (green) vs receiver (blue) zones in the session UI.

### Environment Variables

Required in `.env`:
```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=
```
