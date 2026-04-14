

# Redesign: From Dark Utility to "Sanctuary" Calm Humanism

## What Changed

Your screen-ideas introduce a fundamentally different design direction from the current dark-mode implementation:

| Aspect | Current | New "Sanctuary" |
|--------|---------|-----------------|
| Theme | Dark (Slate-900) | Light warm (#fcf9f5 surfaces) |
| Primary | Teal (#14b8a6) | Sage green (#4d654d) |
| Typography | Inter only | Manrope (headlines) + Inter (body) |
| Borders | Standard 1px borders | "No-Line Rule" — tonal layering only |
| Radius | 0.75rem | 3rem (xl) for cards, full for buttons |
| Elevation | Drop shadows | Glassmorphism + backdrop-blur |
| Feel | Functional tool | Premium wellness journal |

## Scope for MVP (Hackathon)

We'll implement **3 screens** that form the core flow, plus the new design system:

### 1. Design System Overhaul
- Replace all CSS variables in `index.css` with the Sanctuary palette (surfaces, primary sage green, secondary lavender, tertiary amber, organic error red)
- Add Manrope font import, configure `font-headline` and `font-body` families in Tailwind
- Add glassmorphism utilities (`.glass-nav`, `.reflection-glass`)
- Update border-radius defaults to match the softer, organic feel
- Add custom easing `cubic-bezier(0.2, 0.8, 0.2, 1)` for transitions

### 2. Home Screen — "The Pulse" (new page)
Based on `home_the_pulse/code.html`:
- Hero section: "How is your heart today?" with large Start Session CTA button (gradient sage green, mic icon)
- Insights Feed: Horizontal scrolling cards (Notification, Deep Question, Reminder)
- Relationship Pulse card + Today's Focus checklist
- Glassmorphic bottom navigation bar (3 tabs: Journey, Session, Profile)
- Add routing: `/` = Home, `/session` = Therapy Session

### 3. Therapy Session Redesign
Based on `therapy_session/code.html`:
- Replace dark split-screen with light, airy 50/50 layout
- Active partner: full opacity with sage-green gradient avatar ring + audio pulse visualizer bars
- Inactive partner: dimmed (opacity-40, slight grayscale), smaller avatar, `mic_off` icon
- Center AI Mediator: "Reflection Glass" component (lavender glassmorphism, backdrop-blur) replacing the current bordered bar
- PTT button: Clean circular design (not rectangular), matching the screen mockup
- Keep all existing state machine logic (useSessionState) — only visual changes
- GroundingOverlay: Restyle with warm palette, keep breathing animation logic

### 4. Relationship Journey (stretch goal)
Based on `relationship_journey/code.html`:
- Timeline page with vertical gradient line and session history nodes
- "Reflection Glass" AI insight breakouts between timeline items
- Route: `/journey`

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/index.css` | Replace all CSS vars with Sanctuary palette, add glassmorphism utilities |
| `tailwind.config.ts` | Add Manrope font, new color tokens, updated radius, custom easing |
| `src/pages/Home.tsx` | New — The Pulse landing page |
| `src/pages/Session.tsx` | New — Refactored from current Index.tsx |
| `src/pages/Journey.tsx` | New — Relationship timeline |
| `src/pages/Index.tsx` | Becomes router to Home |
| `src/App.tsx` | Add routes for `/`, `/session`, `/journey` |
| `src/components/GroundingOverlay.tsx` | Restyle with warm palette |
| `src/components/PartnerZone.tsx` | Full redesign: circular avatars, audio bars, light theme |
| `src/components/CenterMediator.tsx` | Redesign as "Reflection Glass" floating card |
| `src/components/BottomNav.tsx` | New — Glassmorphic 3-tab navigation |
| `src/components/InsightCard.tsx` | New — Reusable insight feed card |

## What Stays the Same
- All state machine logic in `useSessionState.ts` (untouched)
- Session flow (States 0-5), strike system, PTT mechanics
- Sonner toasts for interventions

