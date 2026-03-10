# TEST-01 Frontend Regression Coverage

Date: March 10, 2026
Status: COMPLETED
Owner: GitHub Copilot

## Scope
Add small but durable frontend regression tests for the recently fixed JobSearchForm prop resync, Login multi-error rendering, and useSavedJobsQuery param normalization behaviors.

## Acceptance Criteria
- `JobSearchForm` test coverage proves skill chips resync when parent props truly change and stay stable across fresh equal-array rerenders.
- Login test coverage proves multiple active error messages render together and stale Redux auth errors are cleared on submit.
- Hook-level coverage proves `useSavedJobsQuery` normalizes empty params and does not refetch when rerendered with fresh equal empty objects.

## Mapped Execution Surface
- `kelmah-frontend/src/modules/search/components/common/JobSearchForm.jsx`
- `kelmah-frontend/src/modules/search/components/common/JobSearchForm.test.jsx`
- `kelmah-frontend/src/modules/auth/components/login/Login.jsx`
- `kelmah-frontend/src/tests/components/auth/Login.test.jsx`
- `kelmah-frontend/src/modules/jobs/hooks/useJobsQuery.js`
- `kelmah-frontend/src/modules/jobs/hooks/useJobsQuery.test.jsx`
- `kelmah-frontend/src/tests/setup.js`

## Dry-Audit Findings
- The existing Login component test file is stale against the current UI labels, button copy, and validation messages.
- The new saved-jobs regression should exercise the hook through React Query rather than through page-level component tests so the normalization boundary is locked directly.
- The current Jest setup already supports `renderHook`, fake timers, and jsdom, so no harness expansion should be necessary unless a focused run exposes a small mock issue.

## Planned Fix
- Add a focused `JobSearchForm.test.jsx` file covering both real prop resync and fresh-equal-array stability.
- Modernize `src/tests/components/auth/Login.test.jsx` around the current Login contract and add explicit multi-error rendering plus `clearError()` coverage.
- Add `useJobsQuery.test.jsx` with a `QueryClientProvider` wrapper and a mocked `jobsService.getSavedJobs()` call-count assertion.

## Implementation
- Added `kelmah-frontend/src/modules/search/components/common/JobSearchForm.test.jsx` with coverage for true skill-prop resync and for repeated rerenders with fresh equal skill arrays.
- Replaced the stale assertions in `kelmah-frontend/src/tests/components/auth/Login.test.jsx` with focused coverage for multi-error rendering and stale Redux auth-error clearing, while mocking the auth slice and unused `MobileLogin` child to keep the test on the desktop Login behavior.
- Added `kelmah-frontend/src/modules/jobs/hooks/useJobsQuery.test.jsx` using a real `QueryClientProvider` wrapper and a mocked `jobsService.getSavedJobs()` to lock the saved-jobs param-normalization boundary directly.
- Fixed two shared test harness problems uncovered during the audit:
	- removed the broken global MUI theme mock from `kelmah-frontend/src/tests/setup.js`
	- corrected `kelmah-frontend/jest.config.cjs` to use the existing `src/tests/mocks/styleMock.js` and `src/tests/mocks/fileMock.js` files

## Validation
- `get_errors` reported no diagnostics for the touched test files or Jest config.
- Focused frontend Jest verification passed for:
	- `src/modules/search/components/common/JobSearchForm.test.jsx`
	- `src/tests/components/auth/Login.test.jsx`
	- `src/modules/jobs/hooks/useJobsQuery.test.jsx`
	- `src/modules/auth/pages/RegisterPage.test.jsx`
	- `src/modules/search/services/searchService.test.js`
- Result: 5 suites passed, 10 tests passed, 0 failures.
- Follow-up clean-shell verification on the later redeploy-validation batch also passed for:
	- `src/modules/search/components/results/WorkerSearchResults.test.jsx`
	- `src/modules/auth/pages/RegisterPage.test.jsx`
	- `src/modules/search/services/searchService.test.js`
	- `src/tests/components/auth/Login.test.jsx`
- Follow-up result: 4 suites passed, 10 tests passed, 0 failures, and the JSON report recorded `openHandles: []`.

## Lifecycle Follow-Up
- Hardened `kelmah-frontend/src/utils/secureStorage.js` so the singleton cleanup interval does not start under `NODE_ENV === 'test'`, removing a real background-timer risk from Jest imports of the auth/storage stack.
- Hardened `kelmah-frontend/src/modules/jobs/hooks/useJobsQuery.test.jsx` with a dedicated test `QueryClient`, `gcTime: Infinity`, and explicit `unmount()` plus `queryClient.clear()` cleanup so the hook regression suite does not leave React Query cache-GC timers behind.
- Re-ran the focused regression batch and the auth/storage-focused batch without `--forceExit`; both exited normally with `--detectOpenHandles`.

## Residual Risk
- The earlier `--forceExit` warning is no longer reproducible. After the lifecycle hardening above, there is no currently reproduced frontend Jest open-handle defect on this path.

## Outcome
The requested regression coverage is now in place at the right boundaries: component-level for `JobSearchForm`, UI-level for Login error surfacing, and hook-level for `useSavedJobsQuery`. The audit also surfaced and fixed two shared frontend test-harness defects that would have kept asset-importing and theme-dependent tests brittle even after the new regressions were added.