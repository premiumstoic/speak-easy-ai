# Design System Document: Calm Humanism

## 1. Overview & Creative North Star
**The Creative North Star: "The Digital Sanctuary"**

This design system is built to facilitate emotional healing. In the context of couple's therapy, the interface must never feel like a "tool" or a "utility," but rather an inviting, breathable space that de-escalates tension. We move beyond the rigid, boxy layouts of traditional SaaS by embracing **Organic Fluidity**. 

By utilizing intentional asymmetry, generous white space, and a rejection of harsh structural lines, we create a "High-End Editorial" experience. The layout should feel like a premium wellness journal—sophisticated, quiet, and deeply human. We prioritize the "breathing room" between elements as much as the elements themselves.

---

## 2. Colors & Tonal Depth

Our palette is rooted in the earth and the sky—muted, desaturated, and restorative.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section content. Boundaries must be defined solely through background color shifts. Use `surface-container-low` sections against a `surface` background to create soft zones.

### Surface Hierarchy & Nesting
We treat the UI as a series of layered, physical materials (fine paper, frosted glass).
*   **Base Layer:** `surface` (#fcf9f5) — The foundation of the sanctuary.
*   **In-Page Sections:** `surface-container-low` (#f6f3ef) — Used for grouping related content blocks.
*   **Elevated Elements:** `surface-container-lowest` (#ffffff) — Used for primary interactive cards to give them a "lifted" feel.

### The Glass & Gradient Rule
To achieve a signature, premium feel, all floating elements (Bottom Nav, Tooltips, Overlays) must use **Glassmorphism**.
*   **Token:** `surface` at 70% opacity + 24px backdrop-blur.
*   **Gradients:** Use subtle linear gradients for CTAs, transitioning from `primary` (#4d654d) to `primary-container` (#cfeacc) at a 45-degree angle. This adds "soul" and depth to the interaction points.

---

## 3. Typography: Editorial Authority

We use a dual-font approach to balance modern clarity with humanistic warmth.

*   **Display & Headlines (Manrope):** Use Manrope for all `display-` and `headline-` scales. Its geometric yet rounded forms feel authoritative yet approachable. 
    *   *Design Note:* Use `display-lg` (3.5rem) with `-0.04em` letter spacing for hero moments to create a "vogue" editorial impact.
*   **Body & Labels (Inter):** Inter provides world-class legibility for the sensitive text involved in therapy. 
    *   *Constraint:* Never use a line-height lower than 1.6 for body text. We need maximum "air" between lines to reduce cognitive load and anxiety.
*   **Hierarchy Tip:** Secondary text should use `on-surface-variant` (#5f5f5b). Avoid pure black; the goal is a "Soft Charcoal" look that is easier on the eyes.

---

## 4. Elevation & Depth

We eschew the "standard" web look by using **Tonal Layering** rather than drop shadows.

*   **The Layering Principle:** Depth is achieved by stacking. Place a `surface-container-lowest` card on top of a `surface-container-low` background. The subtle 2% shift in value creates enough contrast for the eye without the "noise" of a shadow.
*   **Ambient Shadows:** If a shadow is required for a floating state (e.g., a dragged card), use: `box-shadow: 0 20px 40px rgba(77, 101, 77, 0.06)`. This uses a tinted version of our `primary` green to mimic natural light filtered through a canopy.
*   **The Ghost Border Fallback:** For input fields or necessary containment, use the `outline-variant` (#b3b2ac) at **15% opacity**. It should be felt, not seen.

---

## 5. Components

### Buttons
*   **Primary:** Background: `primary` (#4d654d), Text: `on-primary` (#e9ffe5). Border-radius: `full`. High-end feel: 16px vertical padding, 32px horizontal.
*   **Secondary:** Background: `secondary-container` (#ecdcfd), Text: `on-secondary-container`. Use for "reflective" or "softer" actions.

### Cards & Lists
*   **Constraint:** Forbid the use of divider lines. 
*   **Execution:** Use `48px` of vertical white space (Spacing Scale) to separate list items. For complex data, use a `surface-container-high` (#eae8e2) background on hover to define the hit area.
*   **Corner Radius:** Cards must use `xl` (3rem/48px) to feel soft and non-threatening.

### Input Fields
*   **Styling:** Large, pill-shaped (`full`) or `xl` (3rem). 
*   **Background:** `surface-container-highest` (#e4e2dc) with a 0% border that transitions to a 1px `primary` "Ghost Border" on focus.

### Signature Component: The "Reflection Glass"
A specific container for AI-generated insights. Use a `secondary-container` background with a 40% opacity, a `24px` backdrop blur, and an `xl` corner radius. This visually separates "AI thoughts" from "User input."

---

## 6. Do's and Don'ts

### Do:
*   **Do** use asymmetrical margins. A wider left margin than right margin can make a page feel like a bespoke book layout.
*   **Do** use "Warm Amber" (`tertiary`) for moments of breakthrough or celebration—it’s our "emotional reward" color.
*   **Do** animate transitions with `cubic-bezier(0.2, 0.8, 0.2, 1)`. It should feel like an element is "floating into place" rather than "snapping."

### Don't:
*   **Don't** use 100% opaque borders or dividers. It creates "visual friction" and increases anxiety.
*   **Don't** use standard "Error Red." Use our `error` (#aa371c) which is a more organic, clay-like tone that feels like a gentle correction rather than a warning.
*   **Don't** crowd the screen. If you feel like you need more content, you probably need more pages or a scrollable "progressive disclosure" instead.