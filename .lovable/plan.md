

# JSON-Driven Session Architecture

## The Problem

Currently, the session logic is hardcoded: state numbers 0-5, fixed prompts in `CenterMediator`, fixed emotion words, hardcoded recording limits (45s), and hardcoded role-switching logic in `useSessionState`. This means every therapy technique would require code changes.

## The Solution

Make the frontend a **generic state machine renderer** that reads a `TherapyConfig` JSON object and drives everything from it — prompts, roles, emotion banks, recording limits, and state transitions.

## Architecture

```text
TherapyConfig JSON (static file or API)
        │
        ▼
┌─────────────────────┐
│  useSessionState()  │  ← reads config, manages currentStateKey
│                     │     instead of numeric sessionState
└────────┬────────────┘
         │
    ┌────┴────┐
    ▼         ▼
PartnerZone  CenterMediator
(reads from   (reads prompt,
 config:       emotions from
 active_role,  config state)
 max_time)
```

## Files to Create / Modify

### 1. New: `src/types/therapyConfig.ts` — TypeScript interfaces
Define the full JSON schema as TS types:
- `TherapyConfig` — top-level with `technique_id`, `initial_state`, `states` dictionary
- `TherapyState` — per-state: `type`, `layout`, `active_role`, `ui_config`, `transitions`
- `UIConfig` — `prompt_overlay`, `emotion_bank_visible`, `emotion_words`, `max_recording_time`
- `EvaluationEngine` — `agent`, `frameworks`, `system_prompt`, transitions (`on_pass`, `on_fail`, `on_fail_toxicity`)

### 2. New: `src/data/imagoProtocol.ts` — Default config
The Imago Dialogue JSON from the report, exported as a typed `TherapyConfig` constant. This is the default technique loaded on app start.

### 3. Rewrite: `src/hooks/useSessionState.ts` — Config-driven state machine
- Accept a `TherapyConfig` parameter
- Replace numeric `sessionState: 0|1|2|3|4|5` with `currentStateKey: string` (e.g. `"state_0_grounding"`, `"state_1_sender"`)
- `advanceState` reads `transitions.on_complete` or `transitions.on_pass` from the current state to determine the next state key
- `max_recording_time` comes from `config.states[currentStateKey].ui_config.max_recording_time` instead of hardcoded 45
- `active_role` comes from config instead of hardcoded partner logic
- Grounding duration from `config.states[initial_state].duration_seconds`
- Keep PTT, strike, speaking timer mechanics intact — just parameterize them

### 4. Update: `src/components/CenterMediator.tsx`
- Remove hardcoded `STATE_PROMPTS` and `EMOTIONS` arrays
- Accept current state's `ui_config` as a prop
- Read `prompt_overlay` for the prompt text
- Read `emotion_bank_visible` + `emotion_words` for the emotion chips
- Read state `type` for the label (e.g. "speaking_turn" → show role label)

### 5. Update: `src/components/PartnerZone.tsx`
- Read `max_recording_time` from config instead of hardcoded 45
- Warning threshold becomes `max_recording_time - 10` instead of hardcoded 35

### 6. Update: `src/pages/Session.tsx`
- Import and pass `imagoProtocol` config to `useSessionState(config)`
- Derive `isActive`, `role` from `config.states[currentStateKey].active_role` instead of hardcoded conditionals
- Pass `ui_config` to `CenterMediator`

### 7. Update: `src/components/GroundingOverlay.tsx`
- Accept `duration_seconds` as a prop from the grounding state config

## What Stays the Same
- All visual components, styling, animations
- PTT press/release mechanics
- Strike system (toxicity count, flash, hard cut)
- Route structure
- The `evaluation_engine` field is defined in the type but **not implemented yet** — it's a placeholder for when the backend LLM grading is connected

## Example: How a New Technique Would Work

To add "Emotionally Focused Therapy" later, you just create a new JSON file:
```typescript
// src/data/eftProtocol.ts
export const eftProtocol: TherapyConfig = {
  technique_id: "eft_hold_me_tight",
  initial_state: "grounding",
  states: {
    grounding: { type: "breathing_exercise", duration_seconds: 45, ... },
    reach: { type: "speaking_turn", active_role: "SENDER", ui_config: { prompt_overlay: "Tell your partner what you need right now..." } },
    ...
  }
};
```

No component code changes needed.

