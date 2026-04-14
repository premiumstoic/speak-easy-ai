

# Rebrand: Sanctuary → Umay

## Summary
Rename the app from "Sanctuary" to **Umay** across all screens, add the custom SVG logo/favicon, and update the index.html metadata.

## Changes

### 1. Favicon & Logo (`public/umay-logo.svg`, `index.html`)
- Create `public/umay-logo.svg` with the provided Tree of Life SVG
- Update `index.html`: title → "Umay", meta descriptions → brand copy, add favicon reference to the SVG

### 2. Brand Name in Pages (4 files)
Replace every "Sanctuary" text + Leaf icon with the Umay SVG logo inline:

- **`src/pages/Home.tsx`** — Header brand name (line 14): "Sanctuary" → "Umay", replace `<Leaf>` with inline Umay tree SVG or an `<img>` referencing the logo
- **`src/pages/Journey.tsx`** — Header (line 58): same swap. Also update the insight quote (line 120) from "building a sanctuary" to "nurturing your connection"
- **`src/pages/Session.tsx`** — Header (line 58): same swap
- **`src/pages/Profile.tsx`** — No brand name shown currently, no change needed

### 3. Tailwind Config (`tailwind.config.ts`)
- Rename `sanctuary` timing function to `umay`

### 4. Memory Update
- Update `mem://index.md` core section: "Sanctuary" → "Umay"

### Files Modified
| File | Change |
|------|--------|
| `public/umay-logo.svg` | New — brand SVG |
| `index.html` | Title, meta, favicon |
| `src/pages/Home.tsx` | Brand name + logo |
| `src/pages/Journey.tsx` | Brand name + logo + insight copy |
| `src/pages/Session.tsx` | Brand name + logo |
| `tailwind.config.ts` | Timing function rename |
| `mem://index.md` | Core rule update |

