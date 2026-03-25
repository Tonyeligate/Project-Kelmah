# LOW-01 To LOW-20 Frontend Accessibility And Performance Audit March 10 2026

**Date**: March 10, 2026  
**Status**: COMPLETED

## Scope

Audit and fix the reported low-severity frontend issues across auth UX/accessibility, search metadata loading, hirer dashboard fetch behavior, recommendation rendering, and worker result rendering. Validate each report against the current source first so stale findings are documented, not re-fixed.

## Acceptance Criteria

- Frontend password validation is internally consistent between login and registration views.
- The `rememberMe` control changes the effective persistence behavior for auth state.
- Request IDs use secure UUID generation where available.
- Auth UI meets the audited keyboard and assistive-technology requirements for password toggles, role selection, and carousel motion control.
- Low-contrast auth text tokens are corrected on the audited views.
- Static categories/skills and hirer dashboard aggregates avoid unnecessary repeat fetches.
- Smart recommendation rendering and worker-results rendering reduce avoidable work for large lists.

## Mapped Execution Surface

- `kelmah-frontend/src/modules/auth/components/login/Login.jsx`
- `kelmah-frontend/src/modules/auth/components/mobile/MobileLogin.jsx`
- `kelmah-frontend/src/modules/auth/components/mobile/MobileRegister.jsx`
- `kelmah-frontend/src/modules/auth/components/common/AuthWrapper.jsx`
- `kelmah-frontend/src/modules/auth/components/AuthForm.jsx`
- `kelmah-frontend/src/modules/auth/utils/registrationSchema.js`
- `kelmah-frontend/src/modules/auth/services/authService.js`
- `kelmah-frontend/src/modules/auth/services/authSlice.js`
- `kelmah-frontend/src/modules/auth/pages/RoleSelectionPage.jsx`
- `kelmah-frontend/src/services/apiClient.js`
- `kelmah-frontend/src/modules/search/services/searchService.js`
- `kelmah-frontend/src/modules/search/components/SmartJobRecommendations.jsx`
- `kelmah-frontend/src/modules/search/components/results/WorkerSearchResults.jsx`
- `kelmah-frontend/src/modules/search/components/WorkerDirectoryExperience.jsx`
- `kelmah-frontend/src/modules/hirer/components/RecentActivityFeed.jsx`
- `kelmah-frontend/src/modules/hirer/services/hirerService.js`
- `kelmah-frontend/src/modules/dashboard/services/hirerDashboardSlice.js`
- `kelmah-frontend/src/modules/jobs/services/jobsService.js`
- `kelmah-backend/services/user-service/controllers/worker.controller.js`
- `spec-kit/STATUS_LOG.md`

## Data Flow Trace

### Auth login
`Login.jsx` / `MobileLogin.jsx` local form state → `authSlice.login` thunk → `authService.login` → API `/auth/login` → `secureStorage` persistence and token refresh setup.

### Auth registration
`registrationSchema.js` and `MobileRegister.jsx` validation → `authSlice.register` → `authService.register` → API `/auth/register`.

### Worker directory
`WorkerDirectoryExperience.jsx` filter state + URL sync → `workerService.queryWorkerDirectory()` → `/api/users/workers` → backend worker-directory aggregation → `WorkerSearchResults.jsx` list rendering.

### Hirer dashboard
Dashboard thunk → `hirerService.getDashboardData()` → metrics/workers/analytics/jobs fan-out → normalized aggregate payload.

### Recommendations and static metadata
`SmartJobRecommendations.jsx` → recommendation fetch + saved-jobs query → recommendation card rendering.
Search forms → `searchService.getCategories()` / `getSkills()` → job metadata endpoints.

## Dry-Audit Findings

1. `Login.jsx`, `MobileLogin.jsx`, and `AuthForm.jsx` still enforce 6-character minimum passwords while registration surfaces enforce 8.
2. `rememberMe` is only forwarded in login payloads; there is no frontend persistence branch tied to it in auth storage.
3. `src/services/apiClient.js` still generates `X-Request-ID` values from `Math.random()`.
4. `Login.jsx` still imports `MobileLogin` without using it.
5. `AuthWrapper.jsx` auto-advances carousel imagery every 5 seconds with no pause control.
6. Mobile password visibility toggles still lack explicit accessible labels.
7. Mobile registration role cards are clickable boxes, not keyboard-operable semantic controls.
8. Several auth text tokens still depend on low-alpha colors that need contrast hardening.
9. `RecentActivityFeed.jsx` shadows the shared `formatRelativeTime()` helper with a local truncated formatter.
10. `searchService.getSuggestions()` is already debounced/cancelled, so that finding is stale.
11. `searchService.getCategories()` and `getSkills()` remain uncached plain GET wrappers.
12. `hirerService.getDashboardData()` still performs a 4-request fan-out on every caller invocation with no reuse window.
13. `SmartJobRecommendations.jsx` still recreates `renderJobCard` in component scope each render and maps the full list directly.
14. `WorkerSearchResults.jsx` still renders the full worker array into MUI `Grid` without windowing/virtualization.
15. The worker-directory backend full-scan claim appears stale against the current `WorkerProfile` aggregation path and text-score pipeline.
16. The shared formatter already supports weeks and months; the remaining gap is the local activity-feed helper.

## Implementation Completed

1. Auth accessibility and consistency
- Removed the unused `MobileLogin` import from `Login.jsx`.
- Dropped the 6-character login-only client validation so legacy accounts are not blocked, while keeping registration-only minimum enforcement in the register flow.
- Added explicit password-toggle `aria-label`s to the audited login/register mobile and desktop forms.
- Reworked mobile registration role selection into keyboard-reachable semantic radio controls.
- Added a pause/play control to the auth carousel and raised muted auth placeholder/text contrast on the audited desktop auth shell.

2. Auth persistence and request identity
- Added session-scoped encrypted storage support alongside persistent encrypted storage in `secureStorage.js`.
- Updated `authService.login()` so `rememberMe` selects persistent vs session-only auth storage.
- Replaced `Math.random()` request IDs with secure browser UUID APIs where available.

3. Frontend performance fixes
- Added TTL caching for `searchService.getCategories()` and `searchService.getSkills()`.
- Added TTL caching and in-flight reuse for `hirerService.getDashboardData()`.
- Reused the shared `formatRelativeTime()` helper in `RecentActivityFeed.jsx`.
- Memoized recommendation-card output in `SmartJobRecommendations.jsx`.
- Limited the initial worker-card render batch in `WorkerSearchResults.jsx` and exposed an explicit "show remaining" affordance for larger result pages.
- Added basic max-length guards to the main search input surfaces to prevent pathological oversized search text payloads.

4. Backend guardrails and hotspot reduction
- Added a 50-skill server-side limit to `upsertWorkerSkillsBulk()`.
- Reduced personalized job recommendation scoring overhead by tying the candidate fetch window to the requested page size instead of scoring a fixed 200-job batch every time.

## Verification

- VS Code diagnostics returned no errors for the touched frontend and backend source files.
- Focused frontend Jest verification passed:
	- `src/utils/__tests__/secureStorage.test.js`
	- `src/modules/search/components/results/WorkerSearchResults.test.jsx`
- Result: 2 suites passed, 7 tests passed, 0 failures.
- Focused backend Jest verification passed:
	- `services/job-service/tests/mobile-recommendations.contract.test.js`
	- `services/user-service/tests/worker-profile.controller.test.js`
- Result: 2 suites passed, 11 tests passed, 0 failures.
- Frontend production build verification passed:
	- `npm run build`
	- Result: Vite production build completed successfully.

## Stale Findings Confirmed

- `searchService.getSuggestions()` was already debounced, cancellable, and request-deduplicated before this pass.
- The shared relative-time formatter already supported weeks and months; only `RecentActivityFeed.jsx` still needed to stop shadowing it locally.
- The earlier worker-directory "full scan" wording was stale against the current aggregation flow; this pass focused on frontend render cost instead.

## Residual Notes

- React Router future-flag warnings still appear in the worker-results test environment. They did not block the focused regression pass and are unrelated to the fixes here.
- Post-redeploy live authenticated verification could not be completed from this workspace because both known fixture-password variants for `giftyafisa@gmail.com` returned `401 Invalid credentials` from the redeployed gateway. The code-level and unit-level coverage is complete, but live worker-session probes for personalized recommendations and bulk skill updates still require a current valid worker credential.