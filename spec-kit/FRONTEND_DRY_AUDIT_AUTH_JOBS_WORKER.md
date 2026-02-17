# Frontend Dry Audit — `auth`, `jobs`, `worker` Modules

**Date**: 2026-07-15  
**Scope**: `kelmah-frontend/src/modules/auth/`, `jobs/`, `worker/`  
**Method**: Every file read end-to-end; findings numbered sequentially per module.  
**Severity key**: 🔴 CRITICAL · 🟠 HIGH · 🟡 MEDIUM · 🟢 LOW

---

## Module 1 — `auth`

### 1 🟠 HIGH — Double token storage on login
**File**: [authService.js](kelmah-frontend/src/modules/auth/services/authService.js#L80-L120), [authSlice.js](kelmah-frontend/src/modules/auth/services/authSlice.js#L75-L95)  
`authService.login()` stores tokens in `secureStorage`, then the Redux thunk in `authSlice` stores them again. If either path diverges, the app can read stale tokens.  
**Fix**: Remove duplicate storage; let only `authService.login()` persist tokens.

### 2 🟠 HIGH — Social-login feature-flag inconsistency
**File**: [Login.jsx](kelmah-frontend/src/modules/auth/components/login/Login.jsx#L615-L640) vs [Register.jsx](kelmah-frontend/src/modules/auth/components/register/Register.jsx#L950-L975)  
`Login.jsx` gates social login behind `FEATURES.analytics` (wrong flag). `Register.jsx` checks `FEATURES?.socialGoogle` / `FEATURES?.socialLinkedIn`. Users see social buttons on one page but not the other depending on config.  
**Fix**: Use a single canonical flag (`FEATURES.socialLogin`) everywhere.

### 3 🟠 HIGH — `&apos;` renders as literal text
**File**: [Register.jsx](kelmah-frontend/src/modules/auth/components/register/Register.jsx#L460-L480)  
`renderRoleCard` uses HTML entities (`&apos;`) inside JSX strings. React doesn't interpret HTML entities in JSX text — users see `&apos;` on screen.  
**Fix**: Use JavaScript escape `'` or Unicode `\u0027`.

### 4 🟡 MEDIUM — `COMMON_TRADES` duplicated in 3 places
**Files**: [commonTrades.js](kelmah-frontend/src/modules/auth/constants/commonTrades.js), [Register.jsx](kelmah-frontend/src/modules/auth/components/register/Register.jsx#L38-L62), [MobileRegister.jsx](kelmah-frontend/src/modules/auth/components/mobile/MobileRegister.jsx#L70-L95)  
The centralized constant includes "Security Guard" but the inline copies in Register and MobileRegister omit it. Adding/removing trades requires editing 3 files.  
**Fix**: Import from `commonTrades.js` in both components; delete inline lists.

### 5 🟡 MEDIUM — `react-hook-form` `watch()` causes full re-renders
**File**: [Register.jsx](kelmah-frontend/src/modules/auth/components/register/Register.jsx#L170-L185)  
Multiple `watch()` calls without `useWatch` cause the entire 1 234-line form to re-render on every keystroke.  
**Fix**: Switch to `useWatch({ name: 'password' })` for targeted subscriptions.

### 6 🟡 MEDIUM — Hardcoded theme colors throughout auth components
**Files**: [Login.jsx](kelmah-frontend/src/modules/auth/components/login/Login.jsx) (multiple), [MobileRegister.jsx](kelmah-frontend/src/modules/auth/components/mobile/MobileRegister.jsx#L550-L580)  
`#FFD700`, `rgba(255,255,255,0.4)`, `#D4AF37` hard-coded instead of theme tokens. MobileRegister step 3 is worst offender.  
**Fix**: Use `theme.palette.primary.main`, `alpha(theme.palette.common.white, 0.4)`.

### 7 🟡 MEDIUM — `console.log` / `console.error` in production paths
**Files**: [authService.js](kelmah-frontend/src/modules/auth/services/authService.js) (5 occurrences), [authSlice.js](kelmah-frontend/src/modules/auth/services/authSlice.js) (4 occurrences), [Login.jsx](kelmah-frontend/src/modules/auth/components/login/Login.jsx#L420)  
Credentials, tokens, and user objects logged to console.  
**Fix**: Remove or gate behind `import.meta.env.DEV`.

### 8 🟡 MEDIUM — `verifyAuth` infinite fallback chain
**File**: [authSlice.js](kelmah-frontend/src/modules/auth/services/authSlice.js#L120-L175)  
`verifyAuth` thunk tries token verification, then falls back to hydrating from storage, then creates a synthetic user. If the API is unreachable, users appear "logged in" with stale data indefinitely.  
**Fix**: Set a `lastVerifiedAt` timestamp and treat hydrated state as tentative until successfully re-verified.

### 9 🟢 LOW — `AuthForm.jsx` imports `useAuth` but uses Redux directly
**File**: [AuthForm.jsx](kelmah-frontend/src/modules/auth/components/AuthForm.jsx#L5)  
`useAuth` is imported but never called; the component dispatches directly to Redux.  
**Fix**: Remove unused import.

### 10 🟢 LOW — Empty `contexts/` directory
**File**: [auth/contexts/](kelmah-frontend/src/modules/auth/contexts/)  
Folder exists but is empty — contexts were migrated to Redux. Confusing for new developers.  
**Fix**: Delete the directory.

### 11 🟢 LOW — `ResetPasswordPage.jsx` is a 1-line re-export
**File**: [ResetPasswordPage.jsx](kelmah-frontend/src/modules/auth/pages/ResetPasswordPage.jsx)  
`export { default } from '../../../pages/ResetPassword'` — breaks module encapsulation.  
**Fix**: Move the ResetPassword component into the auth module or route directly.

---

## Module 2 — `jobs`

### 12 🔴 CRITICAL — `useJobs.setJobs` callback bug
**File**: [useJobs.js](kelmah-frontend/src/modules/jobs/hooks/useJobs.js#L25-L45)  
`createJob` dispatches `setJobs((prev) => [...prev, newJob])` — but `setJobs` is a plain Redux reducer (`state.jobs = action.payload`). Passing a *function* as payload replaces the array with the function object. Same bug in `updateJob` and `deleteJob`.  
**Fix**: Use a dedicated `addJob` / `removeJob` reducer, or read current state with `getState()` before dispatching.

### 13 🔴 CRITICAL — `searchJobs` call signature mismatch
**File**: [useJobs.js](kelmah-frontend/src/modules/jobs/hooks/useJobs.js#L55-L65)  
`useJobs.searchJobs(query, filters)` calls `jobService.searchJobs(query, filters)`, but `jobsService.searchJobs` only accepts one parameter (`params`).  
**Fix**: Merge query and filters into one object before calling the service.

### 14 🟠 HIGH — Deprecated React Query options
**File**: [useJobsQuery.js](kelmah-frontend/src/modules/jobs/hooks/useJobsQuery.js#L30-L45)  
Uses `cacheTime` (renamed to `gcTime` in TanStack Query v5) and `keepPreviousData` (replaced by `placeholderData: keepPreviousData` import). Will break on upgrade.  
**Fix**: Replace with v5-compatible option names.

### 15 🟠 HIGH — `createJob.fulfilled` inserts raw data
**File**: [jobSlice.js](kelmah-frontend/src/modules/jobs/services/jobSlice.js#L95-L100)  
`state.jobs.unshift(action.payload)` inserts the raw API response. `transformJobListItem()` in `jobsService.js` normalizes data for the list, but this path bypasses it.  
**Fix**: Run `transformJobListItem()` on the payload before unshifting.

### 16 🟠 HIGH — `JobResultsSection` bookmark is a no-op
**File**: [JobResultsSection.jsx](kelmah-frontend/src/modules/jobs/components/JobResultsSection.jsx#L195-L205)  
`handleBookmark` logs `"Bookmark functionality to be implemented"` to console instead of calling the save API.  
**Fix**: Wire to `jobsService.saveJob(job.id)`.

### 17 🟠 HIGH — "Load More" button is a `console.log`
**File**: [JobResultsSection.jsx](kelmah-frontend/src/modules/jobs/components/JobResultsSection.jsx#L885-L895)  
`onClick={() => console.log('Load more functionality - to be implemented')}`. Button visible to users but non-functional.  
**Fix**: Implement pagination or remove the button.

### 18 🟠 HIGH — Hardcoded "Showing X of 12 total opportunities"
**File**: [JobResultsSection.jsx](kelmah-frontend/src/modules/jobs/components/JobResultsSection.jsx#L880)  
Always says "12" regardless of actual total count.  
**Fix**: Use the real total from the API response.

### 19 🟡 MEDIUM — `HeroFiltersSection` quick-filter chips are non-functional
**File**: [HeroFiltersSection.jsx](kelmah-frontend/src/modules/jobs/components/HeroFiltersSection.jsx#L350-L400)  
Quick filter chips (Urgent, Remote, Full-Time, etc.) render but have no `onClick` handlers.  
**Fix**: Wire each chip to the appropriate filter state setter.

### 20 🟡 MEDIUM — `JobsPage.jsx` is 2 472 lines
**File**: [JobsPage.jsx](kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx)  
Contains stat cards, styled components, keyframe animations, filter system, results grid, error boundary — all in one file.  
**Fix**: Extract `AnimatedStatCard`, `ErrorBoundary`, filter section, and skeleton loaders into separate files.

### 21 🟡 MEDIUM — Duplicate components with overlapping purpose
**Files**: `common/Jobs.jsx`, `common/JobSearch.jsx`, `common/JobList.jsx`, `common/JobListing.jsx`, `common/SearchFilters.jsx`, `common/JobFilters.jsx`  
Six near-identical job list/search components exist alongside the main `JobsPage.jsx` + `JobResultsSection.jsx`. Several use `$` currency symbol instead of GHS.  
**Fix**: Deprecate unused `common/` components; standardize on GHS.

### 22 🟡 MEDIUM — `JobSearch.jsx` fires API on every filter keystroke
**File**: [JobSearch.jsx](kelmah-frontend/src/modules/jobs/components/common/JobSearch.jsx#L65-L70)  
`useEffect(() => { fetchJobs(); }, [filters])` triggers a request on every character typed. No debounce.  
**Fix**: Debounce the search term (300–500 ms).

### 23 🟡 MEDIUM — `SavedJobs.jsx` uses `<Button href>` instead of React Router Link
**File**: [SavedJobs.jsx](kelmah-frontend/src/modules/jobs/components/common/SavedJobs.jsx#L65)  
`<Button href={/jobs/${job.id}}>` causes full page reload instead of SPA navigation.  
**Fix**: Use `<Button component={RouterLink} to={...}>`.

### 24 🟡 MEDIUM — `JobListing.jsx` imports from wrong module depth
**File**: [JobListing.jsx](kelmah-frontend/src/modules/jobs/components/common/JobListing.jsx#L18-L19)  
`import { api } from '../../../../../services/apiClient'` — 5-level relative path is fragile. Also imports `useAuth` from auth module but never uses the `token` it destructures.  
**Fix**: Use `@/services/apiClient` alias; remove unused `token` destructure.

### 25 🟡 MEDIUM — `CreateJobDialog.jsx` PROFESSIONS list is tech-oriented
**File**: [CreateJobDialog.jsx](kelmah-frontend/src/modules/jobs/components/common/CreateJobDialog.jsx#L32-L40)  
Lists "Web Development", "UI/UX Design", "Data Science" — wrong domain for a vocational trades platform.  
**Fix**: Replace with trades categories (Plumbing, Electrical, Carpentry, etc.).

### 26 🟡 MEDIUM — `JobDetails.jsx` uses `created_at` (snake_case)
**File**: [JobDetails.jsx](kelmah-frontend/src/modules/jobs/components/common/JobDetails.jsx#L175)  
Uses `job.created_at` for date formatting, but the API/transform returns `createdAt` (camelCase). Will show "Unknown" for all dates.  
**Fix**: Use `job.createdAt || job.created_at` with fallback.

### 27 🟡 MEDIUM — `JobApplication.jsx` uploads to non-existent `/uploads` endpoint
**File**: [JobApplication.jsx](kelmah-frontend/src/modules/jobs/components/job-application/JobApplication.jsx#L310-L330)  
Posts to `api.post('/uploads', formData)`. No `/uploads` route exists in the API gateway or job service.  
**Fix**: Use the portfolio/certificate upload endpoints or create a dedicated upload route.

### 28 🟡 MEDIUM — Massive `console.log` usage across jobs module
**Files**: [jobsService.js](kelmah-frontend/src/modules/jobs/services/jobsService.js) (10+), [JobsPage.jsx](kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx#L660) (`console.log('✅ Jobs loaded...')`), [JobResultsSection.jsx](kelmah-frontend/src/modules/jobs/components/JobResultsSection.jsx#L196)  
Debug prefixed logs (`✅`, `❌`, `🔍`) ship to production.  
**Fix**: Remove or guard with `import.meta.env.DEV`.

### 29 🟢 LOW — `onKeyPress` is deprecated
**Files**: [JobsCompactSearchBar.jsx](kelmah-frontend/src/modules/jobs/components/JobsCompactSearchBar.jsx#L22), [JobsPage.jsx](kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx#L850)  
`onKeyPress` is deprecated in React 17+. Use `onKeyDown` instead.  
**Fix**: Replace `onKeyPress` with `onKeyDown`.

### 30 🟢 LOW — `SearchFilters.jsx` PROFESSIONS list duplicates wrong domain
**File**: [SearchFilters.jsx](kelmah-frontend/src/modules/jobs/components/common/SearchFilters.jsx#L25-L34)  
Same tech-oriented list as `CreateJobDialog`. Should match trade categories.

### 31 🟢 LOW — `JobFilters.jsx` uses `$` symbol instead of GHS
**File**: [JobFilters.jsx](kelmah-frontend/src/modules/jobs/components/common/JobFilters.jsx#L105-L115)  
Budget fields show `$` prefix; platform uses Ghanaian Cedis.  
**Fix**: Use `GH₵` or `GHS`.

---

## Module 3 — `worker`

### 32 🟠 HIGH — `workerService.getWorkerAvailability` retry hits same endpoint
**File**: [workerService.js](kelmah-frontend/src/modules/worker/services/workerService.js#L280-L310)  
Catch block "fixes" by calling `/users/workers/${workerId}/availability` — but the try block already calls `workerPath(workerId, '/availability')` which resolves to the same path. Retry always fails the same way.  
**Fix**: Remove the redundant catch retry or fix the fallback path.

### 33 🟠 HIGH — `updateWorkerAvailability` thunk uses wrong endpoint
**File**: [workerSlice.js](kelmah-frontend/src/modules/worker/services/workerSlice.js#L245-L275)  
Calls `api.put('/availability/${workerId}', payload)` (no `/users/workers/` prefix). This hits a non-existent route through the gateway.  
**Fix**: Use `/users/workers/${workerId}/availability`.

### 34 🟠 HIGH — `certificateService` routes through `/profile/` prefix
**File**: [certificateService.js](kelmah-frontend/src/modules/worker/services/certificateService.js#L16-L30)  
Uses `/profile/${workerId}/certificates` but the gateway proxies `/users/*` to the user service, not `/profile/*`. Endpoints will 404 unless there's a separate profile-service proxy.  
**Fix**: Verify gateway routing for `/profile/` or switch to `/users/workers/${workerId}/certificates`.

### 35 🟠 HIGH — Duplicate `portfolioApi.js` and `portfolioService.js`
**Files**: [portfolioApi.js](kelmah-frontend/src/modules/worker/services/portfolioApi.js), [portfolioService.js](kelmah-frontend/src/modules/worker/services/portfolioService.js)  
Two files with overlapping functionality. `portfolioApi.js` is 35 lines; `portfolioService.js` is 170+ lines with more methods. Both export `portfolioApi` for backward compat.  
**Fix**: Delete `portfolioApi.js`; update all imports to use `portfolioService.js`.

### 36 🟠 HIGH — `WorkerProfile.jsx` debug logging in production
**File**: [WorkerProfile.jsx](kelmah-frontend/src/modules/worker/components/WorkerProfile.jsx#L195-L200)  
`console.log('[WorkerProfile] Render:', { workerIdProp, ... })` on every render.  
**Fix**: Remove or guard with dev-only check.

### 37 🟠 HIGH — `WorkerCard.jsx` excessive debug logging
**File**: [WorkerCard.jsx](kelmah-frontend/src/modules/worker/components/WorkerCard.jsx#L260-L270)  
`console.log('🟡 WorkerCard CLICKED!...')` — five consecutive `console.log` calls on every card click.  
**Fix**: Remove all debug logs.

### 38 🟡 MEDIUM — `WorkerProfileEditPage.jsx` is 1 320 lines
**File**: [WorkerProfileEditPage.jsx](kelmah-frontend/src/modules/worker/pages/WorkerProfileEditPage.jsx)  
Monolithic file with profile form, skill management, education, availability calendar, and image upload.  
**Fix**: Split into sub-components per section (PersonalInfoForm, SkillsEditor, AvailabilityEditor).

### 39 🟡 MEDIUM — `PortfolioPage.jsx` fetches twice on mount
**File**: [PortfolioPage.jsx](kelmah-frontend/src/modules/worker/pages/PortfolioPage.jsx#L30-L55)  
`fetchPortfolio` is defined as a standalone function, and then `useEffect` makes the same call independently. If `fetchPortfolio` is also triggered via a retry button, the same request fires three times.  
**Fix**: Use the `useEffect` as the single fetch source; have the retry button simply re-trigger it.

### 40 🟡 MEDIUM — `WorkerDashboardPage` auto-retry can loop
**File**: [WorkerDashboardPage.jsx](kelmah-frontend/src/modules/worker/pages/WorkerDashboardPage.jsx#L230-L245)  
Exponential backoff retries (`3s × (retryCount + 1)`) but the `useEffect` depends on `handleRefresh` which changes `retryCount`, potentially creating a render loop if `dispatch` keeps failing.  
**Fix**: Move retry logic out of `useEffect` dependency chain; use a ref for retry count.

### 41 🟡 MEDIUM — `WorkerFilter.jsx` uses `$` for hourly rate  
**File**: [WorkerFilter.jsx](kelmah-frontend/src/modules/worker/components/WorkerFilter.jsx#L165)  
Shows `$10 - $100` for hourly rate; platform uses GHS.  
**Fix**: Use `GH₵`.

### 42 🟡 MEDIUM — `earningsService.js` returns raw `response.data`
**File**: [earningsService.js](kelmah-frontend/src/modules/worker/services/earningsService.js#L14-L18)  
Returns `response.data` instead of unwrapping `response.data.data`, inconsistent with other services that normalize.  
**Fix**: Use `unwrapPayload()` pattern for consistency.

### 43 🟡 MEDIUM — `MyApplicationsPage` filter button is non-functional (desktop)
**File**: [MyApplicationsPage.jsx](kelmah-frontend/src/modules/worker/pages/MyApplicationsPage.jsx#L210)  
Mobile header shows a `<FilterListIcon>` IconButton with no `onClick` handler.  
**Fix**: Wire to a filter drawer or remove the button.

### 44 🟡 MEDIUM — `SkillsAssessmentPage.jsx` is 1 457 lines
**File**: [SkillsAssessmentPage.jsx](kelmah-frontend/src/modules/worker/pages/SkillsAssessmentPage.jsx)  
Contains test engine, timer, question rendering, results dialog, analytics chart — all in one file.  
**Fix**: Extract quiz engine, timer, and analytics into separate components.

### 45 🟡 MEDIUM — `SkillsAssessmentPage` commented-out AuthContext import
**File**: [SkillsAssessmentPage.jsx](kelmah-frontend/src/modules/worker/pages/SkillsAssessmentPage.jsx#L80)  
`// import { useAuth } from '../../auth/hooks/useAuth';"` — trailing quote makes it look like an incomplete edit.  
**Fix**: Remove the commented import entirely.

### 46 🟡 MEDIUM — `JobSearchPage.jsx` is 1 093 lines
**File**: [JobSearchPage.jsx](kelmah-frontend/src/modules/worker/pages/JobSearchPage.jsx)  
Contains `SearchHeader`, `CategoryChips`, `FilterPanel`, job card, and main page — all inline.  
**Fix**: Extract sub-components to their own files.

### 47 🟢 LOW — `MyBidsPage` imports `bidService` from jobs module
**File**: [MyBidsPage.jsx](kelmah-frontend/src/modules/worker/pages/MyBidsPage.jsx#L60)  
`import bidApi from '../../jobs/services/bidService'` — cross-module import. Acceptable for shared services but should be documented.

### 48 🟢 LOW — `WorkerProfile.jsx` uses `resolvedWorkerId` from 3 sources
**File**: [WorkerProfile.jsx](kelmah-frontend/src/modules/worker/components/WorkerProfile.jsx#L190-L195)  
Falls back through prop → route params → auth user. The triple fallback makes debugging hard when wrong profile loads.  
**Fix**: Document precedence clearly; add warning if more than one source provides an ID.

### 49 🟢 LOW — `applicationsService.js` silently returns `[]` on server errors
**File**: [applicationsService.js](kelmah-frontend/src/modules/worker/services/applicationsService.js#L15-L20)  
`getMyApplications` catches 5xx errors and returns `[]`. User never sees an error if the service is down.  
**Fix**: At minimum, log the error or set a flag so the UI can show "service temporarily unavailable".

### 50 🟢 LOW — `WorkerCard` over-engineered role normalization
**File**: [WorkerCard.jsx](kelmah-frontend/src/modules/worker/components/WorkerCard.jsx#L38-L70)  
40+ lines to normalize user roles when the app only has two roles (worker/hirer).  
**Fix**: Simplify to `user?.role === 'hirer'`.

---

## Severity Summary

| Severity | Count | Finding IDs |
|----------|-------|-------------|
| 🔴 CRITICAL | 2 | 12, 13 |
| 🟠 HIGH | 12 | 1, 2, 3, 14, 15, 16, 17, 18, 32, 33, 34, 35, 36, 37 |
| 🟡 MEDIUM | 22 | 4, 5, 6, 7, 8, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 38, 39, 40, 41, 42, 43, 44, 45, 46 |
| 🟢 LOW | 9 | 9, 10, 11, 29, 30, 31, 47, 48, 49, 50 |
| **Total** | **50** | |

### Top-Priority Fixes (address first)
1. **#12 + #13** — `useJobs` hook has two broken dispatch calls that silently corrupt Redux state.
2. **#33 + #32** — Availability endpoints use wrong paths; workers cannot update schedule.
3. **#16 + #17 + #18** — Three user-facing features that appear functional but do nothing.
4. **#34** — Certificate service routes may 404 through gateway.
5. **#2 + #3** — Auth UI bugs visible to users (social login mismatch, literal `&apos;`).
