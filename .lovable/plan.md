

# Visual Language Shift: Humanistic Editorial Direction

## What Changes

Inspired by the Basil design reference, we shift from the current "Sanctuary" geometric feel to a warmer, more literary and editorial aesthetic.

| Aspect | Current Sanctuary | New Humanistic |
|--------|------------------|----------------|
| Headlines | Manrope (geometric sans) | **Playfair Display** (serif) |
| Body | Inter | **Outfit** (softer sans) |
| Primary green | #4d654d (sage) | **#6F8F72** (basil — warmer, lighter) |
| Pressed/deep | #3d523d | **#4F6B52** (basilDeep) |
| Background | #fcf9f5 | **#F9F5F1** (paper) |
| Elevated surface | white | **#FBF7F1** (paperElevated) |
| Text | #333 charcoal | **#1C1917** (ink) |
| Muted text | #5f5f5b | **#5F5750** (inkMuted) |
| Borders | None (tonal only) | **Subtle allowed** — #D8CEC2 (line) on light surfaces |
| Card radius | 3rem (48px) | **24px** |
| Button radius | full (999px) | **999px** (same) |
| Input radius | 1rem | **18px** |
| Shadows | Glassmorphism | **Soft single shadow** (blur 24, offset 10, 14% opacity) |
| Animations | Spring/bounce/glow | **easeOut only**, 200-240ms, no bounce |
| Error color | #aa371c | **#9C5B4B** (errorBrick — warmer) |
| Secondary | Lavender #665a75 | **#A79AB7** (lavender, lighter) + **#7A8458** (olive) |
| Warm accent | Tertiary amber | **#B86C4F** (terracotta) |

## Scope — Files to Modify

### 1. Design System Foundation
- **`src/index.css`** — Replace CSS variables with Basil palette tokens; add Playfair Display + Outfit font imports; replace glassmorphism utilities with soft-shadow approach; tone down glow animations to simpler easeOut fades
- **`tailwind.config.ts`** — Update font families (Playfair Display for headlines, Outfit for body/labels); adjust border-radius values (24px cards, 18px inputs, 999px buttons); update color tokens; simplify animation durations to 200-240ms

### 2. All Pages — Typography & Surface Updates
- **`src/pages/Home.tsx`** — Swap headline font classes; replace `session-glow` with a subtler shadow pulse; use paperElevated for cards; soften the CTA animation
- **`src/pages/Journey.tsx`** — Apply serif headlines to card titles; use `line` border color for card separation; soften tag chip styling
- **`src/pages/Profile.tsx`** — Serif for name/headings; replace reflection-glass with soft-shadow card; use line borders between settings rows
- **`src/pages/Session.tsx`** — Update background blurs to be subtler; apply new palette to header

### 3. Components
- **`src/components/BottomNav.tsx`** — Replace glassmorphism with solid paper background + top `line` border
- **`src/components/InsightCard.tsx`** — Use paperElevated background + soft shadow instead of tonal-only layering
- **`src/components/CenterMediator.tsx`** — Replace reflection-glass with paperElevated + soft shadow card
- **`src/components/PartnerZone.tsx`** — Update glow colors to basil green #6F8F72
- **`src/components/GroundingOverlay.tsx`** — Warmer palette, simpler transitions

### 4. Memory Update
- Update `mem://design/sanctuary-tokens` and `mem://index.md` to reflect the new Basil-inspired humanistic tokens

## What Stays the Same
- All state machine logic in `useSessionState.ts`
- Route structure (/, /session, /journey, /profile)
- Page layouts and content structure
- Component architecture

