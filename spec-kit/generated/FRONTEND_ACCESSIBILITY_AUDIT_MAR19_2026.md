# Frontend Accessibility Quantum Audit (March 19 2026)

This audit focuses on **accessibility (a11y)** across the Kelmah frontend, with emphasis on **mobile + desktop visual display**, **keyboard navigation**, **screen reader experience**, and **contrast/readability**. Findings are derived from a code-level scan, component review, and accessibility best practices.

---

## 🎯 High-Level Observations

- The app already uses many ARIA attributes (`aria-label`, `aria-live`, `aria-labelledby`) in key components, which is excellent.
- There are still many visual and interactive controls that lack explicit accessibility markers (e.g., icons used as buttons without `aria-label`, focus order not guaranteed in custom components, and modals with missing keyboard trap).
- Contrast and responsive typography are not consistently enforced across all pages.
- Keyboard-only navigation and focus visibility need coverage, especially for mobile-oriented UI elements.

---

## 🧭 Key Accessibility Findings (with code pointers)

### 1) **Missing or inconsistent ARIA labeling on interactive icons / buttons**
- **Problem**: Some icon buttons (e.g., social icons in `Footer.jsx`, "save" icons in lists, and list action icons) are missing explicit `aria-label`/`aria-labelledby`.
- **Files to review**:
  - `src/modules/layout/components/Footer.jsx` (social icons use `IconButton` with only `aria-label` absent)
  - `src/modules/messaging/components/common/MessageList.jsx` (action icons in message rows)
  - `src/modules/worker/components/WorkerProfile.jsx` (share/save buttons where label is added but may be missing on some variants)

### 2) **Keyboard focus and trap issues in modals/dialogs**
- **Problem**: Several dialog components are created via MUI and rely on default behavior, but custom dialogs or panels (e.g., `MobileFilterSheet`, `ErrorBoundary` retry modal, `SwipeToAction`) may not correctly trap focus or restore it.
- **Files to validate**:
  - `src/components/common/MobileFilterSheet.jsx`
  - `src/components/common/ErrorBoundary.jsx`
  - `src/components/common/SwipeToAction.jsx` (swipe actions should remain keyboard accessible)

### 3) **Missing `alt` text / decorative images**
- **Problem**: Some images (e.g., profile/work images, social icons, background illustrations) may lack `alt` or have generic constructs. Any `<img>` without `alt` is a11y failure.
- **Scan note**: No reliable tool in this audit, but manual review should target all `<img>` usage.

### 4) **Contrast ratio issues**
- **Problem**: Theme uses dark gray backgrounds (`#0a0a0a`, `#1a1a2e`) with light text but there are places (buttons, badges, low-contrast text) where contrast may fall below WCAG AA.
- **Files to inspect**:
  - `src/theme/JobSystemTheme.js` (custom colors, gradients)
  - `src/modules/layout/components/Footer.jsx` (light text on dark background)
  - Any `Box` / `Typography` styled with `rgba(..., 0.5)` or similar.

### 5) **Focus visibility and keyboard navigation**
- **Problem**: Some interactive elements (cards, list items, grid cells) are clickable but not focusable, preventing keyboard access.
- **Areas to audit**:
  - Job cards (`src/modules/jobs/components/...`)
  - Worker cards (`src/modules/worker/components/WorkerCard.jsx`)
  - Sidebar navigation items in `SmartNavigation.jsx`

### 6) **ARIA roles and landmarks**
- **Problem**: Many pages rely on implicit landmarks but do not use `<main>`, `<nav>`, `<header>`, etc. explicitly.
- **Files/areas to validate**:
  - `src/App.jsx` and `src/modules/layout/components/Layout.jsx` should use proper landmarks.
  - Ensure each page has a `<main>` with `id="main-content"` and a `Skip to main content` link works.

### 7) **Screen reader announcements for dynamic content**
- **Problem**: The `OfflineBanner`, `PageSkeleton`, and `ErrorBoundary` use `aria-live` correctly, but other dynamic updates (e.g., filter application, job status changes, message arrival) may not announce.
- **Files to inspect**:
  - `src/components/common/OfflineBanner.jsx` (good)
  - `src/components/common/PullToRefresh.jsx` (good)
  - `src/modules/messaging` (new messages should be announced)

### 8) **Mobile-specific accessibility**
- **Problem**: Mobile bottom navigation, swipe-to-action lists, and drawer components need additional keyboard/screen reader checks due to custom touch behavior.
- **Files to validate**:
  - `src/modules/layout/components/MobileBottomNav.jsx`
  - `src/components/common/SwipeToAction.jsx`

---

## ✅ Priority Accessibility Action Items (Suggested)

1. **Add missing `aria-label`/`aria-labelledby`** to all icon buttons and clickable icons (Footer social, message actions, card actions).
2. **Audit and enforce focus trapping in all dialogs**, especially custom ones (`MobileFilterSheet`, `SwipeToAction`, etc.).
3. **Run a contrast audit** across the theme palette and fix any text < 4.5:1 contrast ratio.
4. **Ensure all images have `alt` text** (decorative images should have `alt=""`).
5. **Validate keyboard navigation** for all list/grid card UI; convert clickable containers to `<button>`/`<a>` where needed.
6. **Add explicit ARIA landmarks (`<main>`, `<nav>`, `<header>`, `<footer>`)** and keep the "skip to main" link functional.
7. **Add screen reader announcements** for key dynamic updates (filter changes, new messages, job status changes).
8. **Add a11y tests using axe-core** to prevent regressions.

---

## 🔭 Next focused audit targets (choose one)

- ✅ **Network error handling**: Scan every API call, retry behavior, and user-facing error messages.
- ✅ **Performance**: Audit slow pages, bundle sizes, caching, and mobile performance budgets.
- ✅ **Visual consistency**: Audit spacing, typography, iconography, and responsive layout across desktops and mobiles.

Tell me which one to run next (or I can continue expanding the backlog to 4,000 / 5,000 / 1,000,000 items).