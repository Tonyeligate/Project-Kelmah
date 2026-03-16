# Frontend UI/UX Route + Mobile Continuation Audit (March 16, 2026)

## Scope
- Continue static audit of all route-mounted web pages plus shared layout/navigation surfaces.
- Focus areas: mobile UI behavior, routing consistency, and structural design/UX risks.
- Method: source audit only (no runtime screenshots in this pass).

## Remediation Update (Applied March 16, 2026)
- Top 3 routing/layout issues from this audit are now implemented in code:
  - Layout shell route classification no longer uses broad profile/support substring behavior.
  - Support CTA links no longer pass unsupported query contracts (`tab`, `category`).
  - Nearby jobs floating action button now uses bottom-nav constant + safe-area aware offset.
- Validation after fixes:
  - Route smoke suite: PASS (15/15)
  - Frontend production build: PASS
- Visual evidence artifact:
  - `spec-kit/FRONTEND_ROUTE_MOBILE_SCREENSHOT_EVIDENCE_MAR16_2026.md`
- Decomposition planning artifact:
  - `spec-kit/FRONTEND_PAGE_DECOMPOSITION_PLAN_MAR16_2026.md`

## Coverage Snapshot
- Route-imported page components: 59
- Total module page files: 62
- Unmounted page files: 3
- Key shared surfaces audited: route config, layout shell, mobile bottom nav, mobile drawer nav, support pages, messaging deep-link logic, quick-jobs nearby page.

## Findings (Verified)

### 1) Public worker profile alias is forced into dashboard layout (Sev 3)
- Evidence:
  - `kelmah-frontend/src/routes/config.jsx` defines a public route `path: 'profile/:workerId'`.
  - `kelmah-frontend/src/modules/layout/components/Layout.jsx` includes `'/profile'` in `DASHBOARD_PATH_MATCHERS` and classifies any path containing `/profile` as a dashboard route.
- Impact:
  - Public worker profiles opened via `/profile/:workerId` can render dashboard shell behavior instead of public-page shell behavior.
  - This can produce inconsistent chrome, spacing, and nav expectations, especially on mobile.
- Recommended fix:
  - Remove broad `'/profile'` substring matching and use explicit route-prefix checks for authenticated profile paths only (for example, `/worker/profile` and `/hirer/profile`).

### 2) Support routes are public, but dashboard layout logic treats `/support` as internal shell (Sev 3)
- Evidence:
  - `kelmah-frontend/src/routes/config.jsx` exposes public support routes (`/support`, `/support/help-center`, `/help`) without `ProtectedRoute`.
  - `kelmah-frontend/src/modules/layout/components/Layout.jsx` includes `/support` inside `DASHBOARD_PATH_PREFIXES`.
- Impact:
  - Public help pages can be rendered in dashboard-layout mode rather than public-layout mode.
  - Desktop shell behavior can diverge from expected public help-center experience.
- Recommended fix:
  - Remove `/support` from dashboard prefixes and render support/help pages consistently through the public layout path.

### 3) Support-page deep links use query contracts that target pages do not consume (Sev 2)
- Evidence:
  - `kelmah-frontend/src/modules/support/pages/HelpCenterPage.jsx` navigates to `/messages?tab=support` and `/docs?category=support`.
  - `kelmah-frontend/src/modules/messaging/pages/MessagingPage.jsx` deep-link parsing currently handles `conversation` and `recipient/userId`, not `tab`.
  - `kelmah-frontend/src/modules/support/pages/HelpCenterPage.jsx` mode resolution is pathname-based (`/docs`, `/community`, default), not `category` query-based.
- Impact:
  - Support CTAs imply targeted views but land on generic views.
  - User intent can be lost, especially on mobile quick-action flows.
- Recommended fix:
  - Either implement `tab` and `category` query handling in target pages or remove unsupported query params from support CTAs.

### 4) Nearby jobs floating action button uses hardcoded bottom offset (Sev 2)
- Evidence:
  - `kelmah-frontend/src/modules/quickjobs/pages/NearbyJobsPage.jsx` uses `sx={{ position: 'fixed', bottom: 80, right: 16 }}` for the floating refresh button.
- Impact:
  - On small phones with bottom nav + safe-area inset, this can overlap touch zones or sit too close to navigation elements.
  - Introduces fragile mobile spacing drift if global bottom-nav height changes.
- Recommended fix:
  - Replace hardcoded `80` with a shared layout constant and safe-area expression, for example `calc(BOTTOM_NAV_HEIGHT + env(safe-area-inset-bottom) + spacing)`.

### 5) Route surface contains unmounted page files (design/system drift risk) (Sev 2)
- Evidence (not imported into route config):
  - `kelmah-frontend/src/modules/contracts/pages/ContractManagementPage.jsx`
  - `kelmah-frontend/src/modules/home/pages/HomePage.jsx`
  - `kelmah-frontend/src/modules/profile/pages/ProfilePage.jsx`
- Impact:
  - Increases design drift and maintenance overhead.
  - Raises the chance of teams updating stale page files that are never rendered.
- Recommended fix:
  - Mark these explicitly as archived or wire them intentionally; avoid ambiguous dead-page surfaces.

### 6) Multiple route-mounted pages remain very large, increasing UI regression risk (Sev 2)
- Evidence (line counts):
  - `kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx`: 2801
  - `kelmah-frontend/src/modules/messaging/pages/MessagingPage.jsx`: 2448
  - `kelmah-frontend/src/modules/hirer/pages/ApplicationManagementPage.jsx`: 1505
  - `kelmah-frontend/src/modules/worker/pages/SkillsAssessmentPage.jsx`: 1495
  - `kelmah-frontend/src/modules/hirer/pages/JobPostingPage.jsx`: 1458
- Impact:
  - Harder to maintain coherent UX behavior across breakpoints.
  - Increases probability of mobile regressions and inconsistent interaction patterns over time.
- Recommended fix:
  - Continue decomposition into page sections + reusable subcomponents with per-section tests/smokes.

### 7) Dashboard-route detection remains brittle due substring strategy (Sev 2)
- Evidence:
  - `kelmah-frontend/src/modules/layout/components/Layout.jsx` uses `path.includes(segment)` against generic segments (for example `/applications`, `/contracts`, `/reviews`, `/profile`).
- Impact:
  - Non-dashboard paths can be accidentally pulled into dashboard shell behavior when path segments overlap.
  - Routing/layout intent is harder to reason about and easier to break.
- Recommended fix:
  - Move to explicit prefix matching or route-handle metadata instead of generic substring checks.

## What Was Checked For Mobile In This Pass
- Fixed-position elements near top/bottom overlays.
- Desktop-table vs mobile-card branch behavior for key pages.
- Query-link navigation fidelity from support and quick-action entry points.
- Public-route shell behavior consistency.

## Suggested Next Audit Step
- Run a screenshot validation pass at 320/360/390/768 widths for all public support/profile aliases and quick-jobs pages to confirm the shell and overlay fixes visually.

## Visual Evidence Appendix (Executed March 16, 2026)
- Screenshot pass completed at widths 320/360/390/768 for support/profile alias routes.
- Artifact manifest:
  - `kelmah-frontend/qa-artifacts/screenshots/route-mobile-audit-mar16/evidence.json`
- Human-readable evidence summary:
  - `spec-kit/FRONTEND_ROUTE_MOBILE_SCREENSHOT_EVIDENCE_MAR16_2026.md`
- Total generated files in evidence folder: 27
