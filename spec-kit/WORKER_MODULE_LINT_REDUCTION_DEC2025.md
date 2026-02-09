# Worker Module Lint Reduction – December 2025

## 1. Scope & Objectives
- **Goal**: Clear the blocking ESLint backlog across worker-facing UI (JobCard, Smart Recommendations, Worker Dashboard listings, Job Search/Application pages, and route configs) so `npm run lint --prefix kelmah-frontend` can complete without inherited `prop-types`, `no-unused-vars`, or `import/no-unused-modules` failures.
- **Drivers**: Recent React Query migrations turned Redux-powered widgets into declarative components, but lint debt (missing PropTypes, unused imports/state, CRLF-prettier drift in `src/routes`) still halts CI/CD quality gates.
- **Key Outcomes**:
  1. Every audited component exposes accurate PropTypes / default props reflecting the new hook-based data contract.
  2. Worker route files re-order literals before parameterized routes and drop unused React Router imports as required by the routing checklist.
  3. Targeted ESLint commands pass locally, proving we can chip away at the backlog incrementally while React Query adoption continues.

## 2. Success Criteria
1. `JobCard.jsx`, `SmartJobRecommendations.jsx`, `dashboard/components/worker/AvailableJobs.jsx`, `worker/pages/JobSearchPage.jsx`, `worker/pages/JobApplicationPage.jsx`, and `src/routes/workerRoutes.jsx` lint cleanly (no `prop-types`, `no-unused-vars`, or `import/no-unused-modules`).
2. `src/routes/config.jsx` regains consistent Prettier formatting (LF line endings, 2-space indent, literals before catch-all), removing the persistent formatting warning.
3. Targeted lint command: `cd kelmah-frontend && npx eslint src/modules/common/components/cards/JobCard.jsx src/modules/search/components/SmartJobRecommendations.jsx src/modules/dashboard/components/worker/AvailableJobs.jsx src/modules/worker/pages/JobSearchPage.jsx src/modules/worker/pages/JobApplicationPage.jsx src/routes/workerRoutes.jsx src/routes/config.jsx` exits 0.
4. Data-flow documentation below captures the UI → React Query hook → API gateway/microservice path for each worker surface so future regressions can be diagnosed quickly.

## 3. File Surface Map (Dry Audit Targets)
| File | Role | Key Concerns |
| --- | --- | --- |
| `kelmah-frontend/src/modules/common/components/cards/JobCard.jsx` | Shared presentation for worker/hirer job listings | Missing PropTypes/default props, unused icons from legacy variants |
| `kelmah-frontend/src/modules/search/components/SmartJobRecommendations.jsx` | Worker-facing recommendations widget | Still imports removed Redux thunks; needs hook prop typing + unused helpers trimmed |
| `kelmah-frontend/src/modules/dashboard/components/worker/AvailableJobs.jsx` | Worker dashboard job feed | Multiple unused imports/states after React Query migration |
| `kelmah-frontend/src/modules/worker/pages/JobSearchPage.jsx` | Worker job discovery page | 2.5k-line component with obsolete imports/state + missing prop validations for shared components |
| `kelmah-frontend/src/modules/worker/pages/JobApplicationPage.jsx` | Worker job application details page | Unused imports (Alert, gtag), needs prop typing for route params |
| `kelmah-frontend/src/routes/workerRoutes.jsx` | Worker route wrapper | Ensure Suspense/ErrorBoundary wiring matches lint expectations, remove noisy console statements after findings |
| `kelmah-frontend/src/routes/config.jsx` | Global route declarations | CRLF + unused imports flagged by ESLint/Prettier |

## 4. Data-Flow Traces (Dry Audit Complete)

### 4.1 JobCard.jsx (Shared)
- **Component**: `kelmah-frontend/src/modules/common/components/cards/JobCard.jsx`
- **Parent Services**: React Query hooks in `jobs/hooks/useJobsQuery.js` (save/unsave/apply) plus routing via `react-router-dom`
- **Backend Endpoints**: `POST /api/jobs/:jobId/save`, `DELETE /api/jobs/:jobId/save`, `POST /api/jobs/:jobId/apply`, `GET /api/jobs/:id`

```
User taps bookmark icon
  ↓
JobCard.handleSaveToggle stops propagation → calls parent-provided onToggleSave(job, { isSaved })
  ↓
Parent widgets (SmartJobRecommendations, AvailableJobs, JobSearchPage, JobApplicationPage) pass React Query mutations:
  useSaveJobMutation → jobsApi.saveJob(jobId) → POST /api/jobs/:jobId/save
  useUnsaveJobMutation → jobsApi.unsaveJob(jobId) → DELETE /api/jobs/:jobId/save
  ↓
API Gateway `/api/jobs` proxy → Job service routes (`services/job/routes/job.routes.js`)
  ↓
React Query invalidates `jobKeys.saved()`; JobCard receives updated `isSaved` prop → icon toggles immediately

User clicks card or “View Details” CTA
  ↓
JobCard.handleCardClick chooses either `onViewDetails(id)` (parent-supplied) or `navigate('/jobs/:id')`
  ↓
Router loads `JobDetailsPage` (lazy) which triggers `useJobQuery(id)` → `jobsApi.getJobById(id)` → `GET /api/jobs/:id`
  ↓
Controller returns normalized job payload; JobDetails renders full info
```

### 4.2 SmartJobRecommendations.jsx
- **Component**: `kelmah-frontend/src/modules/search/components/SmartJobRecommendations.jsx`
- **Supporting Services**: `smartSearchService.getSmartJobRecommendations`, React Query saved job hooks, `searchService.trackJobInteraction`
- **Backend Endpoints**: `GET /jobs/recommendations?userId=`, `POST /api/jobs/:jobId/save`, `DELETE /api/jobs/:jobId/save`, `POST /api/jobs/:jobId/apply`, `POST /search/track-interaction`

```
Component mounts → loadRecommendations()
  ↓
smartSearchService.getSmartJobRecommendations(user.id, filters)
  ↓
API Gateway `/jobs/recommendations` → Search/AI service → returns { jobs, insights }
  ↓
State updated: recommendations[], aiInsights, infoMessage

User taps bookmark
  ↓
handleToggleSave(job)
  ↓
savedJobIds (Set derived from useSavedJobsQuery) decides mutation path
  useSaveJobMutation → jobsApi.saveJob → POST /api/jobs/:jobId/save
  useUnsaveJobMutation → jobsApi.unsaveJob → DELETE /api/jobs/:jobId/save
  ↓
React Query cache updated optimistically; snackbar fired via notistack

User taps “Apply Now” / “View Details”
  ↓
searchService.trackJobInteraction(jobId, action)
  ↓
Window navigates to `/jobs/:jobId[/apply]` triggering JobDetails/JobApplication components which call `useJobQuery`/`useApplyToJobMutation`
```

### 4.3 Worker Dashboard – AvailableJobs.jsx
- **Component**: `kelmah-frontend/src/modules/dashboard/components/worker/AvailableJobs.jsx`
- **Hooks**: `useJobsQuery(queryFilters)`, `useSavedJobsQuery`, `useSaveJobMutation`, `useUnsaveJobMutation`, `useApplyToJobMutation`
- **Backend Endpoints**: `GET /api/jobs?status=open&nearby=true`, `POST /api/jobs/:jobId/save`, `DELETE /api/jobs/:jobId/save`, `POST /api/jobs/:jobId/apply`

```
Dashboard loads → useJobsQuery({ status:'open', nearby:true, limit:20, userSkills })
  ↓
jobsApi.getJobs(params) → GET /api/jobs → job service returns paginated listings
  ↓
decorateJobForDashboard adds deterministic UI data; JobCard child renders each entry

Bookmark click → handleSaveJob(job)
  ↓
Auth guard ensures worker logged in
  ↓
Switch between useSaveJobMutation/useUnsaveJobMutation (mutations defined in hooks file)
  ↓
Saved jobs query invalidated → savedJobIds recomputed so dashboard + JobCard show new state

Apply CTA → handleApply(job)
  ↓
useApplyToJobMutation.mutateAsync({ jobId, applicationData })
  ↓
jobsApi.applyToJob(jobId, payload) → POST /api/jobs/:jobId/apply
  ↓
Query invalidates worker “my jobs” cache; local `jobStatuses` map flips to `applied`
```

### 4.4 Worker JobSearchPage.jsx
- **Component**: `kelmah-frontend/src/modules/worker/pages/JobSearchPage.jsx`
- **State/Store**: Redux `jobSlice` holds filter state (`selectJobFilters`, `setFilters`)
- **Hooks/Services**: `useJobsQuery(buildQueryFilters(filters))`, `useSavedJobsQuery`, `useSaveJobMutation`, `useUnsaveJobMutation`, `jobsApi.getPersonalizedJobRecommendations()` for bidding cards
- **Backend Endpoints**: `GET /api/jobs` (with query params), `POST /api/jobs/:jobId/save`, `DELETE /api/jobs/:jobId/save`, `jobs/recommendations/personalized`, `POST /api/jobs/:jobId/apply` (via JobCard CTA)

```
User adjusts filters/search
  ↓
handleSearch builds params (search, category, job_type, budget, coords)
  ↓
Redux dispatch setFilters(...) → selectors feed buildQueryFilters → useJobsQuery re-fetches `/api/jobs`
  ↓
jobsApi.getJobs returns normalized listings; fallback creativeJobOpportunities used if empty

Bookmark click within JobOpportunityCard → toggleSaveJob(job)
  ↓
Auth guard; savedJobIds Set from useSavedJobIds controls mutation path
  ↓
useSaveJobMutation/useUnsaveJobMutation → `/api/jobs/:jobId/save`

Apply CTA → navigate(`/jobs/:id/apply`) after auth check
  ↓
JobApplication component uses React Router to mount worker application flow, which will call `useApplyToJobMutation`

Personalized dataset refresh (authenticated only)
  ↓
jobsApi.getPersonalizedJobRecommendations() → `/jobs/recommendations/personalized`
  ↓
Normalized jobs stored in `biddingJobs` for future widgets
```

### 4.5 Worker JobApplicationPage.jsx
- **Component**: `kelmah-frontend/src/modules/worker/pages/JobApplicationPage.jsx`
- **Hooks**: `useJobsQuery` for paginated listings, `useSavedJobsQuery`, `useSaveJobMutation`, `useUnsaveJobMutation`
- **Backend Endpoints**: `GET /api/jobs?page=&limit=&search=...`, `POST /api/jobs/:jobId/save`, `DELETE /api/jobs/:jobId/save`

```
Page loads → useJobsQuery({ page, limit:5, search, location, category, type, sort })
  ↓
jobsApi.getJobs → job service → returns { jobs, totalPages, totalJobs }
  ↓
MUI pagination drives setPage → hook refetches next slice (keepPreviousData=true keeps prior results while fetching)

Bookmark icon per card → handleSaveJob(job)
  ↓
Auth guard ensures worker logged in; otherwise navigate('/login') with return path
  ↓
useSaveJobMutation/useUnsaveJobMutation as above
  ↓
React Query invalidates saved list caches; UI re-renders with Bookmark icon filled/outlined
```

### 4.6 Worker Routes & Global Routes
- **Files**: `src/routes/workerRoutes.jsx`, `src/routes/config.jsx`
- **Purpose**: Provide Suspense + ErrorBoundary wrappers for worker module pages (`workerRoutesConfig`) and global layout routes.
- **Key Behaviors**:
  - `WorkerRoutes` uses `ProtectedRoute` with memoized `isWorkerAllowed` derived from Redux auth state; ensures worker role gating before rendering lazy pages that themselves consume React Query hooks above.
  - `routes/config.jsx` defines the SPA layout (Landing, Login, Register, Dashboard, Jobs, Worker Profile, Messaging, NotFound). ESLint issues stem from unused `Navigate` import and non-standard indentation/CRLF; fixing them keeps router flow consistent for JobCard navigation.

These traces satisfy the UI→state→service→API documentation requirement and ground the upcoming lint fixes in verified behavior.

## 5. Verification Plan
1. Run targeted ESLint command listed above once fixes land.
2. Capture CLI output in this document + STATUS_LOG.
3. If warnings persist, note offending files and create follow-up tasks.

## 6. Implementation Log

### 2025-11-22 – Pass 1 (Prop validations + worker lint cleanup)
- **Focus**: Kick off the implementation phase by cleaning `JobCard.jsx` prop validation + hook ordering, trimming unused imports/state across `SmartJobRecommendations.jsx` and Worker job pages, and realigning `src/routes/config.jsx` with Prettier so the scoped ESLint command can start passing file-by-file.
- **Plan**:
  1. Normalize `JobCard` hooks (hooks before guards) and add shape-accurate `PropTypes`/`defaultProps` to match the React Query-powered parents; remove dead destructured fields like `deadline`.
  2. Prune unused icons/helpers in `SmartJobRecommendations.jsx`, `JobApplicationPage.jsx`, and `JobSearchPage.jsx`, introducing any missing imports (`Alert`) surfaced by the lint run and wiring existing navigation helpers (`useNavigate`) instead of `window.location` fallbacks.
  3. Reformat `src/routes/config.jsx` (LF endings, 2-space indent) and drop the unused `Navigate` import per routing standards so Prettier/ESLint stop flagging the file on every run.
- **Verification**: Re-run `cd kelmah-frontend && npx eslint src/modules/common/components/cards/JobCard.jsx src/modules/search/components/SmartJobRecommendations.jsx src/modules/worker/pages/JobApplicationPage.jsx src/routes/config.jsx` after each batch to ensure incremental cleanliness before tackling the remaining mega-files (`AvailableJobs.jsx`, `JobSearchPage.jsx`). Document outputs back here + STATUS_LOG.

#### Progress Update (2025-11-22 EOD)
- Implemented the plan above: `JobCard.jsx` now exports PropTypes/defaults with hooks safely ahead of guard returns, `SmartJobRecommendations.jsx` uses `useNavigate`, logs mutation errors, and exposes PropTypes, `JobApplicationPage.jsx` dropped unused imports/state, and `routes/config.jsx` is reformatted with its route table kept internal to eliminate the Fast Refresh warning.
- Targeted lint command: `cd kelmah-frontend && npx eslint src/modules/common/components/cards/JobCard.jsx src/modules/search/components/SmartJobRecommendations.jsx src/modules/worker/pages/JobApplicationPage.jsx src/routes/config.jsx` → **passes cleanly** (0 errors) as of Nov 22, confirming the first set of files is compliant.
- Next focus area: worker dashboard (`AvailableJobs.jsx`), worker search mega-page, and `workerRoutes.jsx` to continue reducing the ESLint backlog until the full command listed in Success Criteria exits zero.

### 2025-11-23 – Lint Scope Planning (AvailableJobs + JobSearch + workerRoutes)
- **Command**: `cd kelmah-frontend && npx eslint src/modules/dashboard/components/worker/AvailableJobs.jsx src/modules/worker/pages/JobSearchPage.jsx src/routes/workerRoutes.jsx`
- **Result**: 134 errors / 7 warnings remain across the large worker surfaces (prop-types omissions for the inline `job` render helpers, dozens of unused MUI imports/icons, `useMemo`/`useCallback` dependency noise, Prettier indentation drift around the recommendation cards, and `workerRoutes.jsx` issues still pending audit).
- **Action Items**:
  1. Strip unused imports/state from `AvailableJobs.jsx` while adding PropTypes for the `renderJobCard` helpers and cleaning the switch/case declarations so `no-case-declarations` and Prettier stop firing.
  2. Repeat the pruning in `JobSearchPage.jsx`, co-locating the animated variants + filter builders so React Hooks dependency arrays can be memoized properly and the `gtag` global is guarded.
  3. Audit `workerRoutes.jsx` for unused React Router imports / Suspense wrappers before re-running the full lint command listed in Success Criteria.
- **Next Step**: Implement the cleanups above, then rerun ESLint for the three files before expanding the target set.

_Last updated: Nov 23, 2025._

### 2025-11-30 – AvailableJobs + JobSearch Remediation
- **AvailableJobs.jsx**: Replaced the inline `JobCard` prop typing with a shared `jobPropType` near the imports, assigned PropTypes inside the component scope to avoid scope warnings, and formatted the gradient/button style branches via Prettier so the dashboard card no longer triggers `react/prop-types` or indentation errors.
- **JobSearchPage.jsx**: Fixed the broken icon import block, memoized fallback filters (`rawFilters` → `useMemo`) plus `jobsFromQuery` to stabilize React Hook dependencies, and updated the geolocation/preferences effects to depend on `authState.isAuthenticated` (the value they read) so `react-hooks/exhaustive-deps` is satisfied.
- **Verification**: `cd kelmah-frontend && npx eslint src/modules/dashboard/components/worker/AvailableJobs.jsx src/modules/worker/pages/JobSearchPage.jsx src/routes/workerRoutes.jsx` → **passes (0 errors / 0 warnings)** on Nov 30 following a Prettier run over AvailableJobs. Command output recorded in STATUS_LOG.
- **Next Step**: Audit `workerRoutes.jsx` per the earlier plan (console noise + unused imports) before expanding the lint command to the remainder of the worker module target list defined in Success Criteria.

_Last updated: Nov 30, 2025._

### 2025-12-02 – Smart Recommendations Batch Planning
- 🧪 Re-ran the scoped ESLint command `cd kelmah-frontend && npx eslint src/modules/search/components/SmartJobRecommendations.jsx src/modules/worker/pages/JobApplicationPage.jsx src/modules/common/components/cards/JobCard.jsx src/routes/config.jsx` to measure the remaining lint issues on the next worker batch. Output: `JobCard.jsx` failed with Prettier indentation on the hover style block (lines 157‑159) and `routes/config.jsx` reported 40+ formatting violations due to inconsistent indentation/spacing; the other two files passed.
- 🔍 Completed a fresh dry-audit pass on `SmartJobRecommendations.jsx`, `JobApplicationPage.jsx`, `JobCard.jsx`, and `routes/config.jsx` to reconfirm their UI→React Query→API flows (see Sections 4.1–4.5) and pinpoint the exact formatting/prop-type adjustments required.
- 🛠️ Plan: 1) Reformat `JobCard.jsx` around the hover-state style object so the two-space Prettier indentation is restored without touching logic, 2) run Prettier/ESLint formatting over `src/routes/config.jsx` to align with project standards, 3) rerun the scoped lint command to ensure both files exit 0, and 4) document the verification output here plus in `STATUS_LOG.md`.
- 🔜 Follow-up: After this batch is green, widen the ESLint surface back to the full Success Criteria command so we can close out the worker module lint initiative.

### 2025-12-02 – JobCard & Routes Formatting Fixes
- ✅ Applied Prettier formatting to `JobCard.jsx` (hover-state style block) and `src/routes/config.jsx` so both files now follow the project-standard two-space indentation; no logic changes were required.
- 🧪 Verification: `cd kelmah-frontend && npx eslint src/modules/search/components/SmartJobRecommendations.jsx src/modules/worker/pages/JobApplicationPage.jsx src/modules/common/components/cards/JobCard.jsx src/routes/config.jsx` now exits 0 (Dec 2). Output recorded in STATUS_LOG.
- 📓 Documentation: Captured the update in `STATUS_LOG.md` and retained the command/result details here for traceability.

### 2025-12-02 – JobSearchPage Regression Audit
- 🧪 Expanded ESLint command (`cd kelmah-frontend && npx eslint src/modules/common/components/cards/JobCard.jsx src/modules/search/components/SmartJobRecommendations.jsx src/modules/dashboard/components/worker/AvailableJobs.jsx src/modules/worker/pages/JobSearchPage.jsx src/modules/worker/pages/JobApplicationPage.jsx src/routes/workerRoutes.jsx src/routes/config.jsx`) now fails exclusively on `JobSearchPage.jsx`, reporting 51 errors (missing Material UI icon imports, unused animation variants/state, undefined globals like `gtag`, and Prettier multi-line formatting drift).
- 🔍 Per dry-audit policy, re-read the first 400 lines plus the statistics/CTA sections of `JobSearchPage.jsx` to confirm: most icons (ElectricalIcon, PlumbingIcon, etc.) and components (Collapse, Avatar, Alert) are referenced in JSX but no longer imported after the recent refactor; animation helpers such as `slideInFromLeft`/`slideInFromRight`, `isTablet`, `availableJobsForPersonalization`, etc., are defined but unused, matching the lint findings.
- 🛠️ Plan: 1) Restore/import the required Material UI icons/components, 2) remove or repurpose the unused hooks/state/constants, 3) run Prettier across the file to clear multi-line import formatting, and 4) rerun the full worker lint command to verify the batch passes before updating STATUS_LOG.

### 2025-12-02 – JobSearchPage Cleanup & Verification
- ✅ Added the missing MUI components (`Avatar`, `IconButton`, `LinearProgress`, `Collapse`, `Alert`) plus the icon set (Electrical→Diamond, WorkspacePremium, Map, ExpandLess/More, Clear, Verified, Bookmark, LocationOn, Schedule, AccessTime, Visibility, Handshake, Share, NotificationsActive, Dashboard) so every JSX reference resolves.
- 🔧 Removed unused artifacts flagged by ESLint (AnimatePresence import, `formatDistanceToNow`, `slideInFromLeft/Right` keyframes, `isTablet`, `isXs`, `availableJobsForPersonalization`, `skillOptions`, `animateCards`, `filterDialog`, `jobsError` alias) and wrapped the analytics call with `window.gtag` guarding to eliminate the `no-undef` warning.
- 🧼 Ran `npx prettier --write src/modules/worker/pages/JobSearchPage.jsx` to normalize the multi-line import declarations and memo blocks, then re-tested the file via `npx eslint src/modules/worker/pages/JobSearchPage.jsx`.
- 🧪 Full command `cd kelmah-frontend && npx eslint src/modules/common/components/cards/JobCard.jsx src/modules/search/components/SmartJobRecommendations.jsx src/modules/dashboard/components/worker/AvailableJobs.jsx src/modules/worker/pages/JobSearchPage.jsx src/modules/worker/pages/JobApplicationPage.jsx src/routes/workerRoutes.jsx src/routes/config.jsx` exits 0 post-cleanup (Dec 2).
- 📓 STATUS_LOG updated with the regression resolution and verification details to keep the investigation trail complete.

### 2025-11-22 – WorkerRoutes Guard Cleanup
- **WorkerRoutes.jsx**: Removed the temporary debugging `console.log` statements from the memoized guard and simplified the logic to return early for loading, unauthenticated, or missing user states while still deferring to `hasRole('worker')` when user data is available. This eliminates the `no-console` lint spam and keeps the guard behavior identical.
- **Verification**: `cd kelmah-frontend && npx eslint src/modules/dashboard/components/worker/AvailableJobs.jsx src/modules/worker/pages/JobSearchPage.jsx src/routes/workerRoutes.jsx` → exits 0 (Nov 22) confirming the route cleanup kept the scoped lint command green.
- **Next Step**: Expand the lint surface (Smart Recommendations, JobApplicationPage, shared JobCard) once the remaining worker modules are similarly cleaned.

_Last updated: Nov 22, 2025._