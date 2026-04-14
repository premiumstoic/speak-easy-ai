

# AI Couple Therapist — Hackathon MVP Plan

## Design Direction
- **Dark calming theme**: Slate-900/950 backgrounds, soft glows for active states
- **Typography**: Inter font, large legible transcript text
- **Split-screen**: 50/50 vertical split (top = Partner A, bottom = Partner B)
- **Active/Inactive contrast**: Active speaker fully opaque with colored glow; inactive side dimmed + grayscale

## Pages & Components

### Single-Page App (no routing needed)

**1. GroundingOverlay (State 0)**
- Full-screen overlay with expanding/contracting breathing circle (CSS animation, 60s timer)
- "Hold Both Thumbs Here" dual-touch zone (click/tap to simulate)
- Countdown timer, calming gradient background
- Auto-transitions to State 1 when complete (or skip button for demo)

**2. PartnerZone × 2 (Top & Bottom)**
- Role badge pill: `SENDER` (teal) / `RECEIVER` (muted)
- Live transcript box with scrolling text area
- Push-To-Talk button (large, centered):
  - **Active**: Green glow, mic icon, "Hold to Speak"
  - **Locked**: Gray, lock icon, disabled
  - **Warning**: Pulsing red border (strike 2 or >45s)
- 45-second speaking timer with visual progress bar

**3. CenterMediator (AI Boundary Bar)**
- Fixed horizontal bar between zones
- Shows contextual prompts per state:
  - State 2: "Start with: 'What I heard you say is...'"
  - State 3: "Start with: 'You make sense because...'"
  - State 4: Emotion word bank chips (Angry, Sad, Scared, Overwhelmed, Lonely)
- AI therapist avatar/icon with subtle pulse animation

**4. ToxicityStrike System (Debug Mock)**
- Hidden debug button to simulate toxicity detection
- 3-strike visual escalation: yellow flash → orange + shake → red hard-cut
- On strike 3: mic locks, red toast "Hard Cut: AI Intervention", auto role-swap

## State Machine Flow
- **State 0**: Grounding → breathing overlay
- **State 1**: Partner A sends (PTT active for A, locked for B)
- **State 2**: Partner B mirrors (PTT active for B, prompt shown)
- **State 3**: Partner B validates (different prompt)
- **State 4**: Partner B empathy (emotion word bank shown)
- **State 5**: Role reversal → back to State 1 with swapped roles

## Mock Interactions
- PTT hold → simulated text appearing word-by-word in transcript
- State transitions via "Continue" buttons (simulating AI pass/fail)
- Toxicity strike debug controls
- Acoustic warning: simulated volume flash if PTT held too long

## Tech Details
- All state managed with React useState/useReducer
- CSS animations for breathing circle, glows, and strike flashes
- Sonner toasts for AI interventions
- Lucide icons throughout (Mic, Lock, Shield, Heart, AlertTriangle)
- Fully responsive single-page experience, no nav/footer

