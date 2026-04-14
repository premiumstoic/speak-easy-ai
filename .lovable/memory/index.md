# Project Memory

## Core
"Umay" Calm Humanism design. Light warm palette (#fcf9f5), Sage green primary (#4d654d).
Playfair Display headlines, Inter body. No borders — tonal layering only.
Glassmorphism for floating elements. Border-radius: xl (3rem) cards, full buttons.
Single-page therapy app with 3 routes: / (Home), /session, /journey.
JSON-driven session engine: TherapyConfig in src/types/therapyConfig.ts, default Imago protocol in src/data/imagoProtocol.ts.
useSessionState accepts TherapyConfig, uses string state keys not numeric indices.

## Memories
- [Design tokens](mem://design/sanctuary-tokens) — Full color palette, surface hierarchy, glassmorphism rules
