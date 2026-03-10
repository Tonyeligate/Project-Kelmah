# HIGH-01 To HIGH-04 Frontend Render And Auth Audit

Date: March 10, 2026
Status: COMPLETED
Owner: GitHub Copilot

## Scope
Deep-audit and fix the reported frontend render-loop, query-stability, access-token TTL, and login error-surfacing defects in the Kelmah frontend.

## Acceptance Criteria
- `JobSearchForm` treats unchanged incoming `skills` arrays as stable values rather than as a perpetual state-reset trigger.
- Saved-jobs queries normalize params centrally so the hook remains stable even when callers pass inline empty objects.
- Shared API authentication reads the same effective access-token lifetime as route protection and auth bootstrap.
- Login attempts clear stale auth and transport errors before validation and render all active error messages without hiding later ones.

## Mapped Execution Surface
- `kelmah-frontend/src/modules/search/components/common/JobSearchForm.jsx`
- `kelmah-frontend/src/modules/search/components/SmartJobRecommendations.jsx`
- `kelmah-frontend/src/modules/jobs/hooks/useJobsQuery.js`
- `kelmah-frontend/src/modules/jobs/services/jobsService.js`
- `kelmah-frontend/src/modules/worker/pages/JobSearchPage.jsx`
- `kelmah-frontend/src/services/apiClient.js`
- `kelmah-frontend/src/utils/secureStorage.js`
- `kelmah-frontend/src/modules/auth/components/login/Login.jsx`
- `kelmah-frontend/src/modules/auth/services/authSlice.js`
- `spec-kit/STATUS_LOG.md`

## Data Flow Trace
1. Parent search pages pass initial filter props into `JobSearchForm`, which hydrates local React state and emits the current snapshot back through `onSearch` or `onSubmit`.
2. `SmartJobRecommendations` and `JobSearchPage` call `useSavedJobsQuery`, which builds a React Query key, delegates to `jobsService.getSavedJobs(params)`, and reaches `GET /api/jobs/saved` through `src/services/apiClient.js`.
3. Login dispatches `authSlice.login`, which calls `authService.login`, persists access and refresh tokens into `secureStorage`, then relies on the shared API client to attach the access token to future `/api/*` requests.
4. Auth bootstrap, route guards, WebSocket setup, and other frontend consumers already rely on `secureStorage.getAuthToken()`, so the interceptor must honor the same token-expiry contract.

## Dry-Audit Findings
- `JobSearchForm.jsx` currently keys its `setSkills()` effect on the raw `initialSkills` array reference. A parent that recreates equal array contents can trigger redundant state writes on every render.
- `useSavedJobsQuery` lacks the param-normalization boundary already present in `useJobsQuery`, leaving stability dependent on every caller. Two audited callers currently pass inline empty objects.
- `secureStorage.js` defaults `setItem()` to 24 hours, while `getAuthToken()` enforces a 2-hour access-token read limit. `apiClient.js` bypasses the tighter auth guard by reading the raw key directly.
- `Login.jsx` separately stores API health, local submit, and Redux auth errors but renders only the first truthy string. That hides concurrent failures and stale Redux errors from the user.

## Planned Fix
- Normalize incoming skills in `JobSearchForm` with a stable memoized value and guard the state sync against no-op array updates.
- Normalize saved-job query params inside `useSavedJobsQuery` and stop passing fresh empty objects from audited callers.
- Align access-token storage and retrieval TTLs in `secureStorage`, and make `apiClient` use `getAuthToken()`.
- Clear Redux and local login errors at submit start, then render a deduplicated list of all active login errors.

## Implementation
- Added memoized-by-value skill normalization in `JobSearchForm.jsx` and guarded the skills state sync with an equality check so equal arrays do not retrigger local writes.
- Added a shared param sanitizer plus stable serialized param key in `useJobsQuery.js`, and applied it to `useSavedJobsQuery` so saved-job queries are resilient to fresh-but-equal caller objects.
- Updated `SmartJobRecommendations.jsx` and `JobSearchPage.jsx` to pass stable empty-param constants instead of inline empty objects.
- Introduced explicit access-token and refresh-token TTL constants in `secureStorage.js`, stored access tokens with the same 2-hour window enforced by reads, and switched the request interceptor in `apiClient.js` to `secureStorage.getAuthToken()`.
- Updated `Login.jsx` to clear `apiError`, local `loginError`, and Redux `authError` at submit start, then render a deduplicated list of normalized error messages.

## Validation
- `get_errors` returned no diagnostics for all touched frontend files.
- A tree scan confirmed the audited anti-patterns were removed from the live source:
	- no remaining raw `getItem('auth_token')` reads in frontend code
	- no remaining audited `useSavedJobsQuery({})` call sites
	- no remaining single-expression `apiError || loginError || authError` login rendering
- `npm run build` from `kelmah-frontend/` completed successfully after the fixes.

## Outcome
The two real contract drifts in this audit were the unstable `skills` sync in `JobSearchForm` and the mismatched auth-token lifetime between the request interceptor and the rest of frontend auth state. The saved-jobs report pointed at a valid stability smell, but the deeper fix was to harden the query hook boundary centrally rather than trusting each caller. Login error handling now reflects the current attempt accurately and no longer hides useful failure detail behind stale state.