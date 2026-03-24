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

## Execution Delta Batch 6 (March 23 2026)

- Large-service console-noise closure pass completed for the previously highlighted feature surfaces:
	- `src/modules/notifications/services/notificationService.js`
	- `src/modules/profile/services/profileService.js`
	- `src/modules/map/services/mapService.js`
	- `src/modules/jobs/services/jobsService.js`
	- `src/modules/hirer/services/hirerService.js`
	- `src/modules/dashboard/services/dashboardService.js`
- Normalized inline `if (import.meta.env.DEV)` warn/error blocks to local helper calls in each module while preserving fallback behavior and response payload shape.

Validation for this batch:
- PASS: `npm run build` in `kelmah-frontend`.

Current open focus after batch 6:
- residual console-noise clusters outside these modules (for example, calendar, notifications hooks, and selected slice/hook utilities)
- any remaining suppression/dependency items that require behavioral verification before removal.
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

## Execution Delta Batch 7 (March 24 2026)

- Secondary-surface normalization pass completed for contracts/reviews/settings/auth pages and services:
	- `src/modules/contracts/pages/CreateContractPage.jsx`
	- `src/modules/contracts/pages/ContractsPage.jsx`
	- `src/modules/contracts/contexts/ContractContext.jsx`
	- `src/modules/reviews/services/reviewService.js`
	- `src/modules/reviews/pages/ReviewsPage.jsx`
	- `src/modules/settings/hooks/useSettings.js`
	- `src/modules/auth/components/login/Login.jsx`
- Inline dev-gated `console.error` conditions were normalized to local helper wrappers (`devError`) per module for consistency with prior cleanup waves.
- Functional behavior remained unchanged; user-facing fallbacks/toasts/errors are preserved.

Validation for this batch:
- PASS: `npm run build` in `kelmah-frontend`.

Current open focus after batch 7:
- residual console-noise clusters still present in additional messaging/payment/worker/common surfaces outside this focused sub-batch.

## Execution Delta Batch 8 (March 24 2026)

- Residual module scan and closure pass:
	- confirmed no remaining inline guarded console patterns in `src/modules/messaging/**` and `src/modules/payment/**` for the targeted condition pattern.
	- identified and cleaned remaining residuals in `src/modules/worker/**` and `src/modules/common/**`.
- Worker/common normalization scope:
	- `src/modules/worker/pages/SkillsAssessmentPage.jsx`
	- `src/modules/worker/pages/PortfolioPage.jsx`
	- `src/modules/worker/components/WorkSampleUploader.jsx`
	- `src/modules/worker/components/ProjectGallery.jsx`
	- `src/modules/worker/components/EnhancedJobCard.jsx`
	- `src/modules/worker/components/UserPerformanceDashboard.jsx`
	- `src/modules/worker/components/EarningsTracker.jsx`
	- `src/modules/worker/components/WorkerProfile.jsx`
	- `src/modules/worker/components/JobManagement.jsx`
	- `src/modules/worker/components/JobApplicationForm.jsx`
	- `src/modules/worker/components/DocumentVerification.jsx`
	- `src/modules/worker/components/AvailabilityCalendar.jsx`
	- `src/modules/common/utils/lazyLoad.js`
	- `src/modules/common/services/fileUploadService.js`
	- `src/modules/common/components/GlobalErrorBoundary.jsx`
	- `src/modules/common/utils/errorHandler.js`
- All inline `if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_FRONTEND === 'true') console.error/console.warn` instances in worker/common were normalized to local helper wrappers.

Validation for this batch:
- PASS: `npm run build` in `kelmah-frontend`.

Current open focus after batch 8:
- broader non-inline console hygiene outside worker/common remains a potential follow-up if full-repo dev-log minimization is desired.

## Execution Delta Batch 9 (March 24 2026)

- Shared logger consolidation for messaging/payment/common:
	- introduced `src/modules/common/utils/devLogger.js` as a single feature-flag-aware logger utility.
	- migrated messaging and payment surfaces from file-local wrappers to shared logger imports.
	- migrated common utility/error-boundary surfaces to shared logger imports.
- Scope highlights:
	- messaging: `pages/MessagingPage.jsx`, `hooks/useAttachments.js`, `contexts/MessageContext.jsx`, `services/messagingService.js`, and common messaging components.
	- payment: `services/paymentService.js`, `contexts/PaymentContext.jsx`, and major payment components/pages.
	- common: `apiUtils.js`, `useLocalStorage.js`, `RouteErrorBoundary.jsx`, `ErrorBoundary.jsx`, `GlobalErrorBoundary.jsx`, `lazyLoad.js`, `errorHandler.js`, `fileUploadService.js`.

Validation for batch 9:
- PASS: `npm run build` in `kelmah-frontend`.

## Execution Delta Batch 10 (March 24 2026)

- Worker-wide logger normalization completed:
	- removed remaining worker file-local wrappers that directly called `console.*`.
	- switched worker services/pages/components to shared logger imports and worker-flag logger factories where applicable.
- Scope highlights:
	- services: `workerSlice.js`, `workerService.js`.
	- pages: `WorkerProfileEditPage.jsx`, `MyBidsPage.jsx`, `MyApplicationsPage.jsx`, `SkillsAssessmentPage.jsx`, `PortfolioPage.jsx`.
	- components: `WorkSampleUploader.jsx`, `WorkerProfile.jsx`, `UserPerformanceDashboard.jsx`, `ProjectGallery.jsx`, `JobManagement.jsx`, `JobApplicationForm.jsx`, `EnhancedJobCard.jsx`, `EarningsTracker.jsx`, `DocumentVerification.jsx`, `AvailabilityCalendar.jsx`.

Validation for batch 10:
- PASS: `npm run build` in `kelmah-frontend`.
- PASS: direct-console residual scan returned no `console.(error|warn|log|info|debug)` matches in:
	- `src/modules/messaging/**`
	- `src/modules/payment/**`
	- `src/modules/worker/**`
	- `src/modules/common/**`

Current open focus after batch 10:
- continue same consolidation approach in any remaining modules outside messaging/payment/worker/common to complete full-repo logger unification.

## Execution Delta Batch 11 (March 24 2026)

- Continued logger consolidation into profile and notifications domains:
	- profile: `services/profileService.js`, `hooks/useProfile.js`, `components/ProfilePicture.jsx`.
	- notifications: `services/notificationService.js`, `contexts/NotificationContext.jsx`, `pages/NotificationsPage.jsx`.
- Replaced local wrappers and inline warnings with shared logger imports from `src/modules/common/utils/devLogger.js`.

Validation for batch 11:
- PASS: `npm run build` in `kelmah-frontend`.
- PASS: broad scan for direct `console.*` usage in `src/modules/**` reduced from 88 to 59 matches after this batch.

Current open focus after batch 11:
- remaining direct console surfaces are concentrated in settings/search/scheduling/reviews/calendar/auth/jobs/map/hirer/dashboard/contracts modules.

## Execution Delta Batch 12 (March 24 2026)

- Completed the remaining concentrated-module cleanup wave across settings/search/scheduling/reviews/calendar/auth/jobs/map/hirer/dashboard/contracts.
- Final auth-service residue closure:
	- replaced direct console wrappers in `src/modules/auth/services/authSlice.js` and `src/modules/auth/services/authService.js` with shared logger utilities.
	- preserved auth-specific debug-gate behavior via `createFeatureLogger({ flagName: 'VITE_DEBUG_AUTH' })`.

Validation for batch 12:
- PASS: direct-console residual scan returned no `console.(error|warn|log|info|debug)` matches in `src/modules/**`.
- PASS: `npm run build` in `kelmah-frontend`.

Current open focus after batch 12:
- none for direct-console hygiene in `src/modules/**`.

## Execution Delta Batch 13 (March 24 2026)

- Extended direct-console cleanup from module scope to full frontend source scope.
- Closed remaining root-source wrappers and inline calls in:
	- `src/utils/**` (storage, warmup, health checks, secure storage, PWA helpers, formatter/lazy helpers)
	- `src/services/**` (websocket, api client, telemetry)
	- `src/hooks/**` (api/auth-check/api-health/proposals/websocket)
	- `src/config/**` (environment, env, dynamicConfig, constants)
	- selected app/page/components (`App.jsx`, `HomeLanding.jsx`, `ReviewSystem.jsx`, `SmartNavigation.jsx`, `ErrorBoundary.jsx`, `ThemeProvider.jsx`).

Validation for batch 13:
- PASS: direct-console residual scan returned no `console.(error|warn|log|info|debug)` matches in `src/**`.
- PASS: `npm run build` in `kelmah-frontend`.

Current open focus after batch 13:
- none for direct-console hygiene in `src/**`.

## Execution Delta Batch 14 (March 24 2026)

- Production runtime crash hardening for chunk export mismatch:
	- symptom addressed: `Uncaught SyntaxError: The requested module './shared-api-*.js' does not provide an export named 'u'`.
	- mitigation implemented in `public/sw.js`: hashed JS/CSS chunk requests now use network-first with `cache: 'no-store'`, avoiding stale importer/shared-chunk combinations.
	- cache namespace rotated to `kelmah-v1.0.10-chunk-coherence` and runtime-cache clear fallback retained for missing chunks.
- Client-side auto-recovery:
	- `src/utils/pwaHelpers.js` and `index.html` now detect chunk-mismatch signatures and perform bounded one-session cache-clear + reload recovery.
	- startup/bootstrap logs in `index.html` now run only under explicit debug conditions (localhost or `?pwa_debug=1`).

Validation for batch 14:
- PASS: direct-console residual scan returned no `console.(error|warn|log|info|debug)` matches in `src/**`, `index.html`, and `public/sw.js`.
- PASS: `npm run build` in `kelmah-frontend`.
- PASS: smoke suites (`routed-paths`, `critical-path-happy-flow`, `critical-path-gateway-contract`) all green.

Current open focus after batch 14:
- monitor deploy telemetry for any residual chunk mismatch incidents after this SW + bootstrap coherence hardening.

## Execution Delta Batch 15 (March 24 2026)

- New runtime blocker identified from live deploy crash report:
	- `Uncaught TypeError: Failed to resolve module specifier "". Invalid relative url or base scheme isn't hierarchical.`
- Root cause:
	- multiple module files contained invalid ESM imports as `from ''`.
- Fix applied:
	- bulk-repaired 69 broken imports under `src/modules/**` to `from '@/modules/common/utils/devLogger'`.
	- validated zero remaining empty-specifier patterns in `src/**`.

Validation for batch 15:
- PASS: empty-specifier scan (`from ''`, `from ""`, `import("")`) in `src/**` returned zero matches.
- PASS: `npm run build` in `kelmah-frontend`.
- PASS: smoke suites (`routed-paths`, `critical-path-happy-flow`, `critical-path-gateway-contract`) all green.

Current open focus after batch 15:
- continue monitoring live deploy for residual client cache incidents after import integrity repair.
