# Theme Refresh – November 14, 2025

## Summary
- **Problem**: Light/dark theme modes felt artificial and "unwealthy" because brand gold (#FFD700) was used as a background fill instead of an accent, creating harsh contrast and readability issues.
- **Goal**: Deliver a professional dual-tone system where Kelmah gold remains the hero accent while surfaces rely on premium charcoal and parchment neutrals.
- **Scope**: `kelmah-frontend/src/theme/index.js`, shared `BRAND_COLORS`, and `themeValidator` compliance palette.

## Baseline Observations
- Dark mode surfaces were pure black (#000) with minimal depth, causing UI elements to blend.
- Light mode set both `background.default` and `paper` to solid gold, making content unreadable and unprofessional.
- Component overrides (Paper, Card, Drawer, Dialog, Tooltip) recycled the same flat colors; hover states simply added more gold.
- Validation helper still whitelisted only the legacy palette, so newer neutrals would be flagged during audits.

## Changes Implemented
1. **Neutral Surface Tokens**
   - Added `SURFACE_TOKENS` for dark and light stacks (body, surface, raised, overlay, strokes, copy colors).
   - Preserved existing brand color keys and reintroduced the legacy black tokens for compatibility.
2. **Palette Rebuild**
   - Dark mode now uses `#050507` → `#0E0F14` surfaces with parchment typography; light mode uses `#F9F7ED` → `#FFFFFF` stack.
   - Added `background.elevated`, richer `action` states, and a `neutral` slot for subdued chips/badges.
3. **Component Refinement**
   - Paper/Card/Dialog/Drawer/AppBar now reference the new surfaces, bumping radius, depth, and hover borders for a luxury feel.
   - Buttons keep the gold gradient but gain balanced shadows; outlined/text buttons became neutral so gold only signals primary actions.
   - Added overrides for Tabs, ListItemButton, ToggleButton, Alerts, LinearProgress, Skeleton, and Tooltips to ensure consistent treatment across navigation and feedback components.
   - Scrollbars, selections, and containers adopt the new neutrals for cohesive chrome.
4. **Compliance Helper Update**
   - `src/utils/themeValidator.js` now recognizes every neutral/gold tone introduced in the refresh to prevent false positives in future audits.
5. **Persistent Theme Sync (Nov 19 Update)**
   - `src/theme/ThemeProvider.jsx` now reads the saved user preference (localStorage/sessionStorage), falls back to the OS `prefers-color-scheme`, and applies `<html data-theme>`/`<meta name="theme-color">` before paint to eliminate flicker.
   - Theme changes mirror to both storage layers, broadcast via the `storage` event for multi-tab sync, and continue following the OS scheme until a user explicitly toggles, closing the “toggle resets on navigation” bug.

## Verification & Testing
- `npm --prefix kelmah-frontend run lint` (pending after workspace changes) – ensures the updated theme compiles and respects lint rules.
- Manual theme toggle via `KelmahThemeProvider` to confirm:
   - Dark mode: backgrounds are charcoal, paper surfaces show subtle gold borders, and content text is parchment white.
   - Light mode: backgrounds shift to parchment/white, with gold restricted to CTAs and indicators.
   - Brand color (#FFD700) remains untouched for primary accents and gradients.
- Persistence checks (Nov 19 update): toggle the theme, navigate across `/`, `/jobs`, `/hirer/dashboard`, and `/find-talents`, then open a second tab to ensure the mode synchronizes instantly via the `storage` event and survives a full page reload without reverting.

## Follow-Up
- Capture updated screenshots for style guide once QA signs off.
- Revisit `JobSystemTheme.js` if legacy modules still import it; migrate to the new shared tokens for parity.
- Monitor analytics for any accessibility regressions (contrast ratios meeting WCAG AA in both modes).
