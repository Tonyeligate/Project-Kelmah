# Theme Toggle Data Flow – November 19, 2025

## Feature Name
Theme toggle & persistence system

## UI Component Chain
- **Component File**: `kelmah-frontend/src/modules/layout/components/Header.jsx`
- **Coordination Component**: `kelmah-frontend/src/modules/layout/components/Layout.jsx`
- **Context Provider**: `kelmah-frontend/src/theme/ThemeProvider.jsx`
- **Hook Consumers**: `kelmah-frontend/src/App.jsx` (`AppShell`) supplies `mode`/`toggleTheme` props into `Layout`/`Header`
- **Storage Layer**: Browser `localStorage`, `sessionStorage`, and `document.documentElement[data-theme]`

## Flow Map
```
index.html pre-paint script runs before React boot
  ↓
Script reads `kelmah-theme-mode` from storage/session/`<html data-theme>` and applies the winner to `<html data-theme>` + `<meta name="theme-color">`
  ↓
User taps the new theme palette button in Header.jsx (around line 1350)
  ↓
Header renders a theme palette button that opens a menu with Light/Dark explicit options (call `setThemeMode('light' | 'dark')`) plus a "Quick Toggle" action that triggers `toggleTheme`
  ↓
Layout (Layout.jsx) receives `toggleTheme`, `mode`, `setThemeMode` from `AppShell` and forwards them to Header so the UI can show the right icon/tooltips
  ↓
AppShell (App.jsx) calls `useThemeMode()` from ThemeProvider to get `{ mode, toggleTheme, setThemeMode }`
  ↓
ThemeProvider.jsx updates internal React state, persists `{ mode, updatedAt, version }` metadata into both storages, reapplies `data-theme` + `<meta name="theme-color">`
  ↓
MuiThemeProvider re-renders the entire tree with either `darkTheme` or `lightTheme`, so every MUI component sees the new palette immediately
  ↓
`storage` + `visibilitychange` listeners reconcile the freshest preference, ensuring other tabs or resumed sessions converge on the same value (and rerender Layout/Header accordingly)
```

## Issues Found
1. ❌ Previous implementation stored plain strings independently in localStorage/sessionStorage. When one storage (often sessionStorage on Safari/mobile) cleared while the other retained an older value, the next navigation or resume would pick up the stale copy and revert the UI to the wrong theme.
2. ❌ No reconciliation step meant `data-theme` and storage could diverge, so components reading CSS variables saw an outdated palette until users toggled again.

## Fix / Current State
- ThemeProvider now writes a unified JSON payload `{ mode, updatedAt, version }` to both storages and always selects the freshest copy (falls back to the DOM attribute if needed).
- Added a `visibilitychange` listener so background → foreground transitions re-check persisted metadata and reapply the user preference if the browser wiped sessionStorage while the tab was suspended.
- Existing `storage` listener was updated to parse metadata and guard against redundant re-renders; this keeps multi-tab sessions synchronized without manual refreshes.
- **NEW (Nov 19)**: Added an inline bootstrap script in `kelmah-frontend/index.html` that mirrors the ThemeProvider reconciliation logic before the first paint. It reads both storage layers plus any prior `<html data-theme>` attribute, applies the resolved mode immediately, and swaps the `<meta name="theme-color">` content. This eliminates the flash-of-wrong-theme on hard refreshes and cold loads.
- Regression coverage: `kelmah-frontend/src/theme/__tests__/ThemeProvider.test.jsx` asserts persistence across remounts and storage-event synchronization.

## Recommendations / Next Steps
1. ✅ Explicit mode selection now ships in the Header theme palette (uses `setThemeMode`). Still consider mirroring the control inside Settings for accessibility parity.
2. Surface the persisted timestamp (e.g., in developer diagnostics) to confirm when mismatched environments last updated the preference.
3. ✅ Pre-paint inline script now runs in `index.html`; revisit if SSR introduces new hydration paths or if we need to expand it into a dedicated module for reuse across microfrontends.
