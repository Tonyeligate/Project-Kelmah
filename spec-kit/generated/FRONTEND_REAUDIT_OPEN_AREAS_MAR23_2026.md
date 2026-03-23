# Frontend Re-Audit: Still-Open Areas (March 23 2026)

This report captures the current open frontend issues after re-checking the areas that were previously fixed. It intentionally excludes the resolved navigation, error boundary, warm-up, and hook-cancellation findings so the backlog stays current.

---

## Current Open Findings

### 1) `useResponsive.js` still mixes theme breakpoints with hard-coded pixel breakpoints
- The hook now standardizes the main breakpoint helpers, but it still exposes `isActualMobile`, `isActualTablet`, and `isActualDesktop` using literal pixel ranges (`768px`, `1024px`, `1025px`).
- This reintroduces breakpoint drift risk when the theme changes, and it creates a second interpretation of "mobile/tablet/desktop" that can diverge from the design system.
- The `useMaxWidth()` helper also accepts raw pixel strings, which is useful for legacy compatibility but should be treated as a migration path rather than the preferred API.

Impact:
- Display behavior may differ between screens that use theme breakpoints and screens that consume the legacy pixel-based values.
- Mobile/desktop layout decisions can drift over time if new views rely on the legacy fields instead of the theme-based helpers.

Priority:
- Medium-high. This is not a blocking runtime bug, but it is a real layout-consistency risk for a marketplace that depends on clean responsive behavior.

### 2) Dev-only console noise remains widespread across core workflows
- The codebase still contains a large number of dev-gated `console.log`, `console.warn`, and `console.error` calls across auth, messaging, search, worker, theme, storage, and websocket modules.
- Many are acceptable during active development, but the volume is now high enough that it reduces signal-to-noise when chasing genuine production issues.
- A few non-gated calls still appear in utility and telemetry code paths, which increases the chance of noisy browser consoles and harder triage.

Impact:
- Makes debugging harder for real regressions.
- Reduces confidence in production hygiene even where the messages are harmless.

Priority:
- Medium. This is mostly technical hygiene, but the blast radius is broad.

### 3) Residual lint suppressions still hide a few dependency and module-loading risks
- There are still a handful of active `eslint-disable` suppressions, including dependency-array suppressions in hooks/pages and `global-require` suppressions in the integration test.
- Some are likely deliberate, but each suppression is a spot where stale dependencies or reload behavior could hide.

Impact:
- Makes hook churn and refactor regressions easier to miss.
- Increases the chance that new code copies a suppression instead of solving the dependency issue.

Priority:
- Medium.

### 4) Messaging and search remain the noisiest feature areas
- Messaging and search still produce most of the remaining console noise and are the most complex interaction surfaces.
- They are also the areas most likely to accumulate display, responsiveness, and async-state regressions as new features are added.

Impact:
- Higher risk of future stale UI, retry confusion, and inconsistent mobile/desktop behavior.

Priority:
- Medium-high for future backlog rotation.

---

## What Should Be Kept Closed

The following findings are current fixes and should not be re-opened as backlog items unless they regress:
- `useApi.js` cancellation and stale retry behavior
- `ErrorBoundary.jsx` missing recovery actions
- `MobileBottomNav.jsx` and `MobileNav.jsx` duplicate-navigation and unclear-label issues
- `serviceHealthCheck.js` and `serviceWarmUp.js` warm-up observability gaps
- `SavedSearches.jsx` missing demand-insight header treatment

---

## Updated Backlog Direction

The backlog should now lean toward:
- removing legacy pixel-based responsive decisions from `useResponsive.js`
- reducing console noise in messaging, search, auth, worker, and storage flows
- eliminating or justifying remaining lint suppressions
- continuing visual polish on the unresolved pages instead of re-reporting resolved issues

---

## Re-Audit Result

- Fixed areas: **closed**
- Open areas: **responsive hook drift, console noise, lint suppressions, messaging/search hygiene**
- Backlog status: should be refreshed against these current findings only

---

## Execution Delta (March 23 2026)

- Implemented first-batch fix in `kelmah-frontend/src/hooks/useResponsive.js`:
	- removed hard-coded `768/1024/1025` breakpoint queries from `isActualMobile/isActualTablet/isActualDesktop`
	- aligned legacy alias fields to theme breakpoint helpers to prevent future drift.
- Kept backward compatibility in `useMaxWidth()` while adding preferred support for theme breakpoint keys (for migration away from raw pixel strings).
- Reduced lint suppression surface:
	- removed unnecessary suppression in `src/hooks/useNavLinks.js`
	- removed `react-hooks/exhaustive-deps` suppression in `src/modules/auth/pages/MfaSetupPage.jsx` by wiring the dependency correctly.

Remaining open focus after this execution batch:
- console-noise reduction (especially messaging/search)
- remaining lint suppressions requiring deeper behavior review
- ongoing messaging/search hygiene and visual-polish backlog rotation.

## Execution Delta Batch 2 (March 23 2026)

- Messaging console-noise reduction (high-frequency hotspot):
	- reduced routine debug chatter in `src/modules/messaging/contexts/MessageContext.jsx` by routing transient logs through the existing `messagingLog` verbose-debug gate (`VITE_DEBUG_MESSAGING=true` required).
	- kept actionable error diagnostics in dev mode for real failures.
- Lint-suppression cleanup pass:
	- removed `global-require` lint suppressions from `src/services/apiClient.integration.test.js` by refactoring module loading to async `import()` in `beforeEach`.
	- verified `CreateContractPage.jsx` and `NearbyJobsPage.jsx` currently have no active `eslint-disable` suppressions.

Remaining open focus after batch 2:
- broad console-noise reduction outside messaging context (search/auth/worker/storage surfaces)
- residual dependency-array suppressions in other modules that still require behavioral review.

## Execution Delta Batch 3 (March 23 2026)

- Responsive dependency cleanup continuation:
	- removed legacy `useMaxWidth(768)` usage from `WorkerProfile` and aligned to theme-driven `useBreakpointDown('md')`.
	- dependent-usage sweep confirms only one intentional ultra-compact check remains (`useMaxWidth(390)` in `JobDetailsPage`) for narrow handset layout behavior.
- Console-noise closure sweep:
	- normalized remaining direct dev-log guards across auth/search/worker/messaging modules to explicit opt-in mode via `VITE_DEBUG_FRONTEND=true`.
	- preserved functional behavior and user-facing alerts/toasts while reducing default dev-console chatter.
- Lint-suppression verification:
	- no active `eslint-disable` directives found in `kelmah-frontend/src/**/*` at sweep time.

Validation for this batch:
- PASS: `npm run build` in `kelmah-frontend`.

## Execution Delta Batch 5 (March 23 2026)

- Shared utility cleanup:
	- normalized `src/utils/storageQuota.js`, `src/utils/prefetchLazyIcons.js`, `src/utils/lazyWithRetry.js`, and `src/utils/formatters.js` to use local debug helpers for their remaining warning paths.
	- restored `src/utils/serviceWarmUp.js` to a self-contained warm-up helper after the earlier refactor so the file stayed compile-safe.
- Core service and hook cleanup:
	- routed `src/modules/auth/utils/tokenUtils.js`, `src/hooks/useAuthCheck.js`, `src/modules/settings/services/settingsService.js`, `src/modules/dashboard/services/dashboardService.js`, `src/hooks/useProposals.js`, and `src/services/apiClient.js` through local debug helpers for the latest console-noise reduction pass.
	- cleaned the legacy websocket compatibility hook in `src/hooks/useWebSocket.js` so its message, connection, and disconnected-socket logs stay gated behind the existing frontend debug flag.
- Validation:
	- `npm run build` in `kelmah-frontend` passed after the utility and hook batches.

Current open focus after batch 5:
- larger feature services with remaining dev-gated console noise, especially dashboard, notifications, profile, jobs, hirer, and map flows
- any remaining dependency-array suppressions that need explicit behavioral review rather than mechanical removal
- PASS: `npx jest --runInBand --testPathPattern="routed-paths\.smoke|critical-path-happy-flow|critical-path-gateway-contract"` in `kelmah-frontend`.

Current open focus after batch 3:
- none in the original March 23 open-findings scope.

## Execution Delta Batch 4 (March 23 2026)

- Final residual utility/service console-noise closure:
	- normalized direct dev-log guards in `src/utils/*` and `src/services/errorTelemetry.js` to explicit frontend opt-in debug mode (`VITE_DEBUG_FRONTEND=true`).
	- preserved diagnostics when explicitly enabled while keeping default dev sessions quieter.
- Scope verification:
	- no direct `if (import.meta.env.DEV)` guards remained in `kelmah-frontend/src/utils/**/*` and `kelmah-frontend/src/services/**/*` after this pass.

Validation for this batch:
- PASS: `npm run build` in `kelmah-frontend`.
- PASS: `npx jest --runTestsByPath src/tests/smoke/routed-paths.smoke.test.jsx src/tests/smoke/critical-path-happy-flow.smoke.test.jsx src/tests/smoke/critical-path-gateway-contract.smoke.test.js --runInBand` in `kelmah-frontend`.

Current open focus after batch 4:
- none in the original March 23 open-findings scope.

## Execution Delta Batch 5 (March 23 2026)

- Broad remaining-source normalization:
	- applied a final wide pass across unresolved frontend source surfaces and normalized remaining direct dev-guard checks to explicit frontend opt-in debug mode (`VITE_DEBUG_FRONTEND=true`).
	- this extended prior targeted scope to additional shared/config/page/module files where direct `if (import.meta.env.DEV)` checks still existed.
- Residual-pattern verification:
	- no direct `if (import.meta.env.DEV)` pattern remained in `kelmah-frontend/src/**/*.{js,jsx,ts,tsx}` after this batch.

Validation for this batch:
- PASS: `npm run build` in `kelmah-frontend`.
- PASS: `npx jest --runTestsByPath src/tests/smoke/routed-paths.smoke.test.jsx src/tests/smoke/critical-path-happy-flow.smoke.test.jsx src/tests/smoke/critical-path-gateway-contract.smoke.test.js --runInBand` in `kelmah-frontend`.

Current open focus after batch 5:
- none in the original March 23 open-findings scope.

## Execution Delta Batch 6 (March 23 2026)

- Final residual inline-condition cleanup:
	- patched the last two remaining inline `import.meta.env.DEV` condition sites in worker scope to explicit opt-in frontend debug gating (`VITE_DEBUG_FRONTEND=true`).
- Residual verification after batch 6:
	- no direct `if (import.meta.env.DEV)` pattern remains in `kelmah-frontend/src/**/*.{js,jsx,ts,tsx}`.
	- one intentional boolean usage remains in `src/utils/pwaHelpers.js` (`Boolean(import.meta.env.DEV)`), used as environment detection rather than console-noise gating.

Validation for this batch:
- PASS: `npm run build` in `kelmah-frontend`.
- PASS: `npx jest --runTestsByPath src/tests/smoke/routed-paths.smoke.test.jsx src/tests/smoke/critical-path-happy-flow.smoke.test.jsx src/tests/smoke/critical-path-gateway-contract.smoke.test.js --runInBand` in `kelmah-frontend`.

Current open focus after batch 6:
- none in the original March 23 open-findings scope.
