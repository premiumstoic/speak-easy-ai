

# Plan: Add "Guided Enactment" Therapy Method

## Overview

This is a significant feature. The new technique ("Open Mediation") has fundamentally different mechanics from the existing Imago Dialogue — open mic streaming for both partners simultaneously, AI-driven tripwire detection, system interruptions with audio/TTS, and an "orb" UI instead of split-screen partner zones. This requires extending types, creating new UI components, adding technique selection, and wiring up AI evaluation.

## What Changes

### 1. Extend the Type System (`src/types/therapyConfig.ts`)
- Add new `type` values: `"open_mic_stream"`, `"system_interruption"`
- Add new `layout` values: `"shared_hearth_orb"`, `"ai_focus"`
- Add `"BOTH"` and `"SYSTEM"` to `active_role`
- Add optional fields: `tripwires`, `confidence_threshold`, `context_window_size`, `action_sequence`, `intervention_templates`, `orb_state` to the relevant interfaces

### 2. Create the Protocol Config (`src/data/openMediationProtocol.ts`)
- Store the full JSON you provided as a typed `TherapyConfig` object, analogous to `imagoProtocol.ts`

### 3. Add Technique Selection to the Home Page
- Before navigating to `/session`, show a picker (modal or inline) letting the user choose between "Imago Dialogue" and "Guided Enactment"
- Pass the selected technique ID via route state or URL param (`/session?technique=open_mediation_enactment`)

### 4. Update Session Page (`src/pages/Session.tsx`)
- Read the technique param and load the correct protocol config
- Conditionally render **either** the existing split-screen layout (PartnerZone + CenterMediator) **or** a new `HearthOrb` layout based on the current state's `layout` field

### 5. Create New UI Components
- **`HearthOrb`** — the central animated orb (pulsing/listening, expanded/speaking/amber states). Both partners share one view with a shared mic
- **`AIInterventionOverlay`** — fullscreen overlay when AI interrupts: plays a chime sound, shows the intervention text (generated from templates), locks mic

### 6. Extend the State Machine (`src/hooks/useSessionState.ts`)
- Handle `open_mic_stream` type: both partners can speak, no turn-taking
- Handle `system_interruption` type: lock mic, play action sequence, then transition back
- Add tripwire trigger logic (for now, the debug button can simulate a tripwire detection; real AI streaming evaluation is a future backend feature)

### 7. Future / Stubbed Work
- **Streaming LLM evaluation**: The `llm_as_judge_streaming` agent and acoustic markers require a real-time backend pipeline — this will be stubbed with a debug trigger button (similar to the existing toxicity strike button)
- **TTS playback**: The `generate_tts` action would need an edge function (ElevenLabs or similar) — stubbed for now with text display
- **Audio chime**: Can embed a short chime sound file or use Web Audio API for the singing bowl effect

## Technical Details

```text
src/
├── types/therapyConfig.ts        ← extend interfaces
├── data/
│   ├── imagoProtocol.ts           ← existing (unchanged)
│   └── openMediationProtocol.ts   ← new protocol config
├── hooks/useSessionState.ts       ← extend for new state types
├── pages/
│   ├── Home.tsx                   ← add technique picker
│   └── Session.tsx                ← conditional layout rendering
├── components/
│   ├── HearthOrb.tsx              ← new: shared orb UI
│   ├── AIInterventionOverlay.tsx  ← new: intervention screen
│   ├── PartnerZone.tsx            ← existing (unchanged)
│   └── CenterMediator.tsx         ← existing (unchanged)
```

## Scope for This Implementation

- Full type system extension
- Protocol config file
- Technique selection UI on Home page
- HearthOrb shared-mic layout with animated orb states
- AI Intervention overlay with template-based text
- Debug button to simulate tripwire detection
- Chime sound effect (Web Audio API tone)
- TTS and real streaming AI evaluation **stubbed** (marked as future backend work)

