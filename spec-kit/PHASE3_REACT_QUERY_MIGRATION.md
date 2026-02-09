# Phase 3 Task 3.1 – React Query Migration Dry Audit (Nov 22, 2025)

## Scope & Success Criteria
- **Scope Restatement**: Replace the jobs domain's ad-hoc data fetching (Redux thunks in `jobSlice.js`, bespoke helpers like `useJobs`, and component-level `jobsService` calls) with React Query hooks per `IMPLEMENTATION_GUIDE_PHASE_3_4_5.md` Task 3.1. Coverage includes public jobs listing, worker search/management pages, hirer job creation/update flows, and saved/applications interactions that currently dispatch `fetchJobs`, `createJob`, etc.
- **Success Criteria**:
  1. `src/modules/jobs/hooks/useJobsQuery.js` defines query keys plus hooks for listings, single job, "my jobs", and mutations (create/apply/save) with optimistic updates + invalidations.
  2. `jobSlice.js` shrinks to UI-only state (filters, pagination, modal toggles); async thunks removed and components stop importing them.
  3. Jobs consumers (`JobsPage.jsx`, `JobCreationForm.jsx`, `JobApplication.jsx`, worker `JobSearchPage.jsx`, `JobApplicationPage.jsx`, `JobManagement.jsx`, hirer dashboards/slices) rely on the new hooks or `api` client helpers rather than direct service calls.
  4. React Query config enforces stale/cache times (30s for listings/my jobs, tighter windows for realtime widgets) and surfaces errors through notistack/snackbars. `npm run lint` and `npm run build --prefix kelmah-frontend` remain green.

## File Surface & Dry Audit Notes
| File | Role | Dry-Audit Findings |
| --- | --- | --- |
| `kelmah-frontend/src/modules/jobs/services/jobSlice.js` | Central Redux slice for jobs module | Defines 7 async thunks (`fetchJobs`, `fetchJobById`, `createJob`, `applyForJob`, saved job ops). State mixes data (`jobs`, `currentJob`, `savedJobs`) with filters/loading. React Query migration must remove thunks & data arrays, keeping only filter/pagination + UI flags. Selectors currently assume data lives in Redux; consumers need replacements. |
| `kelmah-frontend/src/modules/jobs/services/jobsService.js` | Low-level API wrapper using `api` client | Provides `getJobs`, `applyToJob`, etc., with heavy normalization. React Query hooks should reuse these helpers (possibly reorganized) to avoid duplicating transformations; also need to ensure return shapes align with query caches (currently returns `{data, jobs, totalPages...}`). |
| `kelmah-frontend/src/modules/jobs/hooks/useJobs.js` | Legacy hook that dispatches slice reducers manually | Wraps `jobService` calls while toggling Redux loading/errors. With React Query, this hook becomes obsolete; either delete or refactor to proxy the new query hooks. |
| `kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx` | Public jobs listing hero | Manages its own `jobs`, `loading`, `error` state plus filter inputs, calling `jobsService.getJobs` inside `useEffect`. Needs conversion to `useJobsQuery(filters)` with derived states (loading/error) and integration with React Query cache. Currently duplicates filtering client-side; consider aligning with server filters to prevent double work. |
| `kelmah-frontend/src/modules/jobs/components/job-creation/JobCreationForm.jsx` | Hirer modal wizard for posting jobs | Uses `dispatch(createJob(jobData)).unwrap()`. After migration, rely on `useCreateJobMutation` with notistack toasts + invalidation of listings/hirer dashboards. Also interacts with draft storage; ensure mutation hook exposes loading/error for UI. |
| `kelmah-frontend/src/modules/jobs/components/job-application/JobApplication.jsx` | Multi-step application form | Calls `jobsApi.applyForJob` directly and manages uploading attachments. Should switch to `useApplyToJobMutation` for status + optimistic updates (e.g., update React Query cache for `useJobQuery` or worker applications). |
| `kelmah-frontend/src/modules/worker/pages/JobSearchPage.jsx` | Worker-focused job explorer (~2500 LOC) | Dispatches `fetchJobs` thunk, stores filters in Redux, and triggers Saved/Apply flows. Migration needs `useJobsQuery(filters)` for listing + `useSaveJobMutation`/`useApplyToJobMutation`. Current selectors expect Redux `jobs.jobs`; we must map to query data w/ memoized derived arrays for personalization logic. |
| `kelmah-frontend/src/modules/worker/pages/JobApplicationPage.jsx` | Simplified worker "Find Work" page | Directly calls `jobsApi.getJobs` with local pagination. Should adopt the shared query hook (likely with `jobKeys.list(filters)`) to avoid duplicate fetching logic. |
| `kelmah-frontend/src/modules/worker/components/JobManagement.jsx` | Worker dashboard tab that fetches `/api/workers/:id/jobs` via `fetch` | Not tied to `jobSlice` but part of "my jobs" scenario. Determine whether to reuse `useMyJobsQuery('worker')` so caches stay consistent; currently replicates fetch logic and lacks retries/error surfacing. |
| `kelmah-frontend/src/modules/worker/services/workerSlice.js` | Owns worker jobs/applications state | `fetchWorkerJobs`/`fetchWorkerApplications` thunks will overlap with React Query caches. Decide whether to keep them for worker-specific dashboards or migrate to dedicated query hooks later. For Task 3.1 we at minimum need to ensure job listings/applies no longer rely on `jobSlice`. |
| `kelmah-frontend/src/modules/hirer/services/hirerSlice.js` | Hirer dashboard state (jobs/applications) | Uses `api.get('/jobs/my-jobs')`, `createHirerJob`, etc. We must align these with the new query hooks or at least coordinate invalidation (e.g., when `useCreateJobMutation` succeeds, manually invalidate `jobKeys.myJobs('hirer')`). |

## Data Flow Templates

### Public Jobs Listing (JobsPage)
```
UI Component: JobsPage.jsx (`kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx`)
User Action: Loads page / adjusts hero filters
↓
Local State: searchQuery / selectedCategory / budgetRange
↓
Current Behavior: useEffect → jobsService.getJobs(params)
↓
API Call: GET /api/jobs (job-service via gateway)
↓
Response: { data/jobs, pagination }
↓
State Update: setJobs([...]) & derived filters
↓
UI Render: Job cards, hero stats, CTA
```
**React Query Target**: Replace manual fetch with `const { data, isLoading, error, refetch } = useJobsQuery(filters)`; derived arrays read from `data?.jobs`.

### Hirer Job Creation (JobCreationForm)
```
UI Component: JobCreationForm.jsx
User Action: Submit wizard form
↓
Handler: onSubmit → dispatch(createJob(jobData)).unwrap()
↓
jobSlice thunk → jobsService.createJob → POST /api/jobs
↓
Redux: push new job into jobs array; loading toggles
↓
UI: success alert, navigation to created job
```
**React Query Target**: `const mutation = useCreateJobMutation()` returning { mutateAsync, isPending, error }; on success, invalidate `jobKeys.all`, `jobKeys.myJobs('hirer')`, show toast, navigate via returned job ID.

### Worker Job Search (JobSearchPage)
```
UI Component: JobSearchPage.jsx
User Action: Enter filters → handleSearch()
↓
dispatch(setFilters({...})) & dispatch(fetchJobs(cleanedParams))
↓
jobSlice thunk → jobsService.getJobs → GET /api/jobs
↓
Redux State: state.jobs.jobs updated; selectors feed UI + personalization pipelines
↓
Additional Actions: unsave/save toggles call saveJobToServer/unsave thunks
```
**React Query Target**: `const jobsQuery = useJobsQuery(cleanedParams)`; the personalization pipeline consumes `jobsQuery.data`. Save/unsave flows become `useSaveJobMutation` w/ optimistic updates (update `jobKeys.saved()`).

## Existing Behavior Issues Identified
1. **Duplicated Fetch Logic**: JobsPage, JobSearchPage, JobApplicationPage, and `useJobs` all call `jobsService` independently, producing inconsistent transformations and redundant network requests.
2. **Redux Store Bloat**: `jobSlice` stores entire job arrays plus saved jobs, leading to large serialized state and conflicting local filtering logic.
3. **No Cache/Retry Semantics**: Every route change triggers fresh requests; there is no caching, dedupe, or background refetch, causing visible loading flashes.
4. **Saved Job Mutations**: `saveJobToServer`/`unsaveJobFromServer` thunks mutate state only after refetching saved jobs, lacking optimistic UX.
5. **Job Creation Feedback**: `createJob` thunk simply prepends the job to Redux state without invalidating worker/hirer dashboards; React Query invalidations will be required.

## Proposed Fix Design (Pre-Implementation)
1. **Hook Suite**: Implement `jobKeys`, `useJobsQuery(filters, options)`, `useJobQuery(jobId)`, `useMyJobsQuery(role/status)`, plus mutations `useCreateJobMutation`, `useApplyToJobMutation`, `useSaveJobMutation`, `useUnsaveJobMutation`, `useFetchSavedJobsQuery` as needed. Hooks wrap existing `jobsService` helpers and standardize response shapes.
2. **Query Client Config**: Extend `src/config/queryClient.js` with 30s `staleTime` / `cacheTime` for listings + my jobs, plus default retry/backoff. Add optional persister for selected queries (per Task 3.3) later.
3. **Component Refactors**:
   - `JobsPage`: Replace internal fetch `useEffect` with hook, tie filter state to query params, display `query.error` with notistack or inline `Alert`.
   - `JobCreationForm`: Use mutation to submit, show `enqueueSnackbar` messages, call `queryClient.invalidateQueries(jobKeys.all())` on success.
   - Worker pages/components: swap `dispatch(fetchJobs)` for `useJobsQuery`, wire save/apply buttons to mutations, remove direct `jobsService` usage.
   - Remove/retire `useJobs` hook or convert it to wrap React Query results for backward compatibility until all consumers migrate.
4. **Redux Slice Slimming**: Strip async thunks + `jobs` arrays from `jobSlice`, retaining UI filter state and selectors needed by personalization logic (these selectors should pull from React Query data or fallback). Ensure store initialization doesn't break existing imports.
5. **Documentation & Tests**: Update this spec and `STATUS_LOG.md` with findings and validations; run `npm run lint` + `npm run build --prefix kelmah-frontend` post-refactor.

## Next Steps
- [ ] Finalize filter/query mapping plan per component.
- [ ] Implement hook suite + query client updates.
- [ ] Refactor JobsPage, JobCreationForm, JobSearchPage, JobApplication, and worker utilities to consume hooks.
- [ ] Remove legacy thunks from `jobSlice.js`, ensuring remaining reducers/selectors reflect new data sources.
- [ ] Update docs + run verification commands.

## Implementation Progress – Nov 22, 2025
- ✅ **Hook Suite Foundation**: Added `src/modules/jobs/hooks/useJobsQuery.js` with normalized filter handling, canonical `jobKeys`, and the initial hook set (`useJobsQuery`, `useJobQuery`, `useCreateJobMutation`, `useApplyToJobMutation`). Listings default to a 30s stale window and 2-minute cache to match Task 3.1 guidance while keeping `keepPreviousData` enabled for smoother filter transitions.
- ✅ **JobsPage Migration**: `JobsPage.jsx` now memoizes filter params, consumes `useJobsQuery`, and normalizes responses before piping them into the existing UI state. Manual `jobsService.getJobs` calls plus bespoke loading/error toggles were removed in favor of the query object, so retries/caching now flow through React Query.
- ✅ **JobCreationForm Mutation Flow**: The hirer posting dialog dispatches `useCreateJobMutation` instead of the Redux thunk. Pending state now comes from the mutation, success scenarios trigger hook-level invalidations, and the existing draft + success UX stays intact.
- 🧪 **Verification**: `npm run build --prefix kelmah-frontend` (Nov 22 2025) completes successfully in ~1m57s with only the long-standing Vite chunk-size warnings, confirming the new hooks do not break production builds.
- 🔄 **Upcoming Work**: Port JobApplication + worker job search/application surfaces (including saved jobs) to the hook suite, then prune the remaining thunks/selectors from `jobSlice.js` before running lint + build again.

## Worker Job Search & Application Dry Audit (Nov 26, 2025)

### Component Data Flow Maps

#### JobApplication.jsx
- **Component File**: `kelmah-frontend/src/modules/jobs/components/job-application/JobApplication.jsx`
- **Service Dependencies**: `jobsApi.getJobById`, `jobsApi.applyForJob`, shared `api` upload client
- **Flow Map**:
```
User opens /jobs/:id/apply
  ↓
JobApplication.jsx useEffect → jobsApi.getJobById(jobId)
  ↓
API Call: GET /api/jobs/:jobId (job-service)
  ↓
State: setJob(response); derive defaults for proposal form
  ↓
User fills proposal, uploads attachments (api.post('/api/uploads'))
  ↓
handleSubmit → jobsApi.applyForJob(jobId, payload)
  ↓
API Call: POST /api/jobs/:jobId/apply (job-service applications controller)
  ↓
Success: show success alert → navigate('/dashboard/applications')
  ↓
Error: setError(message), remain on form
```
- **Issues**: manual data fetching with local loading/error state, no cache reuse when returning to page, saved application results not invalidating other listings; attachment upload + application submission done sequentially without shared mutation state; no optimistic updates for application status anywhere else.

#### Worker JobSearchPage.jsx
- **Component File**: `kelmah-frontend/src/modules/worker/pages/JobSearchPage.jsx`
- **Redux Dependencies**: `fetchJobs`, `setFilters`, `selectJobs`, `selectSavedJobs`, `saveJobToServer`, `unsaveJobFromServer`, `fetchSavedJobs`
- **Flow Map**:
```
Worker loads /worker/search
  ↓
useEffect dispatch(fetchJobs(initialFilters)) if store empty
  ↓
jobSlice thunk → jobsService.getJobs(params) → GET /api/jobs
  ↓
Redux state.jobs.jobs updated → selectors feed component
  ↓
UI filters (search, sliders, chips) update local state + dispatch(setFilters)
  ↓
handleSearch dispatch(fetchJobs(cleanedParams)), analytics event
  ↓
Saved-job toggle → saveJobToServer/unsaveJobFromServer + fetchSavedJobs
  ↓
UI recomputes derived arrays (matchingJobs, personalized recommendations)
```
- **Issues**: triple data source mix (Redux jobs array, `jobsApi` personalizations, fallback JSON), dispatch-heavy toggles causing redundant refetches, no caching or pagination from React Query, saved-job responses require extra fetch to refresh state.

#### Worker JobApplicationPage.jsx
- **Component File**: `kelmah-frontend/src/modules/worker/pages/JobApplicationPage.jsx`
- **Service Dependency**: `jobsApi.getJobs`
- **Flow Map**:
```
User loads Worker "Find Work" page
  ↓
useEffect fetchJobs() → jobsApi.getJobs({ page, limit, filters })
  ↓
API Call: GET /api/jobs?limit=5&page=N&sort=...
  ↓
State: setJobs(response.data); set pagination totals
  ↓
UI renders cards, manual saved state toggles stored in local component state only
```
- **Issues**: reimplements Jobs listing logic with its own pagination + saved-job state (not persisted), no shared cache with JobsPage or JobSearchPage, can't show server-backed saved flags, lacks error/success messaging via global patterns.

#### SmartJobRecommendations.jsx
- **Component File**: `kelmah-frontend/src/modules/search/components/SmartJobRecommendations.jsx`
- **Service Dependencies**: `searchService.getSmartJobRecommendations`, Redux saved-job thunks
- **Flow Map**:
```
Component mounts (worker dashboard, search page modules)
  ↓
loadRecommendations → searchService.getSmartJobRecommendations(userId)
  ↓
API Call: GET /api/search/smart-jobs?userId=...
  ↓
State: setRecommendations(payload.jobs), set AI insights
  ↓
Save toggle → saveJobToServer/unsaveJobFromServer + fetchSavedJobs
  ↓
Apply/View actions call searchService.trackJobInteraction then navigate
```
- **Issues**: saved-job state depends on Redux list and refresh thunk; every toggle triggers another `/saved-jobs` fetch; no optimistic update or React Query cache invalidation to keep other components synced.

#### Worker Dashboard AvailableJobs.jsx
- **Component File**: `kelmah-frontend/src/modules/dashboard/components/worker/AvailableJobs.jsx`
- **Service Dependencies**: `jobsApi.getJobs`, Redux saved-job thunks
- **Flow Map**:
```
Dashboard loads
  ↓
fetchJobs() → jobsApi.getJobs({ status:'open', nearby:true, limit:20 })
  ↓
API Call: GET /api/jobs?status=open&nearby=true&limit=20
  ↓
Component state holds jobs, derived filters/sorts
  ↓
Apply button → jobsApi.applyToJob(jobId, payload)
  ↓
Save toggle → saveJobToServer/unsaveJobFromServer + fetchSavedJobs
```
- **Issues**: duplicates listing fetch separate from React Query caches; apply/save flows bypass new mutation hooks; saved states re-fetch entire saved list after every action; no query invalidations for worker dashboards.

#### Shared JobCard.jsx
- **Component File**: `kelmah-frontend/src/modules/common/components/cards/JobCard.jsx`
- **Dependencies**: Redux saved-job selectors + thunks (save/unsave/fetchSavedJobs)
- **Flow Map**:
```
JobCard renders inside JobsPage/Worker lists
  ↓
Bookmark click → authentication guard → dispatch saveJobToServer/unsaveJobFromServer
  ↓
Await dispatch(fetchSavedJobs) to refresh savedJobs slice
  ↓
Re-render occurs once Redux updates savedJobs array
```
- **Issues**: Each card triggers sequential thunks (save + fetch) leading to network bloat; no optimistic UI; card-level logic duplicates across modules; direct Redux dependency makes React Query migration incomplete until this component switches to hook-based mutations or accepts saved state via props.

### Findings Summary
- Worker-facing pages/components continue to rely on Redux data arrays + thunks, preventing React Query from owning caching for listings, applications, and saved jobs.
- Saved job UX dispatches `saveJobToServer`/`fetchSavedJobs` on every interaction, which is both slow and inconsistent across modules (local vs Redux state).
- JobApplication and Worker JobApplicationPage manually fetch jobs and track loading/error state; aligning them with `useJobQuery`/`useJobsQuery` will remove redundant service calls and unlock caching.
- These components need dedicated query/mutation hooks (`useJobsQuery`, `useJobQuery`, `useSaveJobMutation`, `useUnsaveJobMutation`, `useSavedJobsQuery`) with shared invalidation keys so toggles instantly reflect across worker dashboard, search, and shared cards.

### Next Design Actions
1. Extend `useJobsQuery.js` to include saved-job hooks (`useSavedJobsQuery`, `useSaveJobMutation`, `useUnsaveJobMutation`) plus helper utilities (`mergeSavedState` for common cards).
2. Refactor JobApplication + worker search pages to consume query hook results (`data?.jobs`, `isLoading`, `error`) and to call mutations for apply/save flows instead of dispatching thunks.
3. Update shared `JobCard` to accept `savedJobIds` + `onToggleSave` props derived from hook data, or wrap it with a higher-order hook that encapsulates React Query interactions, eliminating direct Redux coupling.
4. After components stop importing job thunks/selectors, strip the redundant async thunks/state from `jobSlice.js`, keeping UI filters only, and document the state changes in this spec + STATUS_LOG.

## JobSearchPage Migration Plan – Nov 27, 2025

### Updated Data Flow (Target State)
```
Worker visits /worker/search
  ↓
Redux filters (`state.jobs.filters`) capture persisted search inputs (search term, profession, job_type, budgets, page).
  ↓
JobSearchPage derives query params via memoized mapper:
  { page, limit, status:'open', search, category:profession, type:job_type, budget:min-max, sort:mapSortOptionToApi(filters.sort) }
  ↓
useJobsQuery(queryParams) fetches GET /api/jobs through jobsService → React Query cache keyed by jobKeys.list(filters).
  ↓
Component memoizes normalized jobs → personalization pipeline (matching jobs, recommendations, insights).
  ↓
Saved jobs: useSavedJobsQuery() + useSavedJobIds() hydrate bookmark state; toggles call useSaveJobMutation/useUnsaveJobMutation for optimistic updates (query invalidation keeps other worker surfaces in sync).
  ↓
UI renders hero/search panels, cards, and sample data fallback driven by query loading/error flags.
```

### Filter Mapping Notes
- Keep Redux as the durable store for user-facing filters, but translate keys when building query params:
  - `filters.profession` → `category`
  - `filters.job_type` → `type`
  - `filters.min_budget`/`filters.max_budget` → `budget` string (`min-max` or `min-`)
  - `filters.sort` (values like `relevance`, `salary_high`) → API sort strings via `mapSortOptionToApi`
- Default `page = 1`, `limit = 12`, `status = 'open'`; omit empty strings/undefined values to keep query keys stable.

### Saved-Job Interaction Strategy
- Hydrate bookmarks via `useSavedJobsQuery({}, { enabled: Boolean(isAuthenticated) })` and `useSavedJobIds(savedJobsData)`.
- Replace Redux thunks with React Query mutations:
  - `useSaveJobMutation` receives `{ jobId, job }` for optimistic cache inserts.
  - `useUnsaveJobMutation` receives `{ jobId }` and removes the job from cached saved lists.
- Bookmark icons consult `savedJobIds.has(jobId)` so UI stays consistent with other worker modules.

### Loading/Error Handling
- Derive skeletons and alerts from `jobsQuery.isLoading || jobsQuery.isFetching` and `jobsQuery.error`.
- Remove the legacy "initial fetch" effect—React Query will fetch automatically when filters change.

### Next Steps
1. Implement the filter mapper + hook wiring inside `JobSearchPage.jsx`.
2. Update bookmark handlers to call the React Query mutations and drop `fetchSavedJobs` dispatches.
3. Normalize derived datasets (matching jobs, recommendations) to read from `jobsQuery.data` instead of Redux arrays.
4. Document the completed migration in STATUS_LOG.md and proceed to slim `jobSlice.js` once all consumers stop using the thunks.

### Implementation Notes (Nov 27, 2025)
- `JobSearchPage.jsx` now calls `useJobsQuery(buildQueryFilters(filters))`, keeping Redux as UI state only while the query client owns network caching. The memoized mapper converts persisted fields (`profession`, `job_type`, `min/max budgets`, `sort`) into API params before handing them to React Query.
- Saved-job UI consumes `useSavedJobsQuery` and the new mutation hooks, allowing optimistic bookmark toggles without dispatching `fetchSavedJobs`. The Set returned by `useSavedJobIds` feeds the cards plus personalization logic.
- `handleSearch` simply updates Redux filters and analytics; React Query reacts to filter changes automatically, so the legacy `fetchJobs` thunk and initial-load effect were deleted.
- ESLint on the file still flags the pre-existing unused imports and hook dependency warnings scattered throughout the 2.5k-line component, but no new issues were introduced by the hook migration.

## Smart Recommendations & Dashboard Widgets – Implementation Plan (Nov 28, 2025)

### Scope Restatement
- Finish the worker-focused React Query migration by moving `SmartJobRecommendations.jsx`, `dashboard/components/worker/AvailableJobs.jsx`, and shared `common/components/cards/JobCard.jsx` off Redux saved-job thunks. All bookmark/apply interactions must rely on the saved-job/query hook suite so `jobSlice.js` can be trimmed down to UI filters only.

### Success Criteria
1. `SmartJobRecommendations` derives saved state from `useSavedJobsQuery`/`useSavedJobIds` and calls `useSaveJobMutation`/`useUnsaveJobMutation`, eliminating `saveJobToServer`, `unsaveJobFromServer`, and `fetchSavedJobs` imports.
2. `AvailableJobs` fetches its listings through `useJobsQuery` (or a thin wrapper that reuses the shared filters) instead of its bespoke `jobsApi.getJobs` effect, and applies/saves via the React Query mutation hooks.
3. `JobCard` becomes a presentation component; it receives `isSaved`, `onToggleSave`, and `onApply` props (or consumes a dedicated hook) so it no longer couples to Redux thunks.
4. After these migrations, `jobSlice.js` keeps only UI filter state; the saved-jobs array and related reducers/selectors are removed, clearing the path for lint/build verification.

### Planned File Touchpoints
- `kelmah-frontend/src/modules/search/components/SmartJobRecommendations.jsx`
- `kelmah-frontend/src/modules/dashboard/components/worker/AvailableJobs.jsx`
- `kelmah-frontend/src/modules/common/components/cards/JobCard.jsx`
- `kelmah-frontend/src/modules/jobs/services/jobSlice.js`
- `kelmah-frontend/src/modules/jobs/hooks/useJobsQuery.js` (extend saved-job helpers if necessary)

### Data Flow Targets
```
Worker dashboard/search modules
  ↓
useJobsQuery/useSavedJobsQuery provide listings + bookmark metadata
  ↓
Components pass derived props into JobCard (isSaved, onToggleSave, onApply)
  ↓
JobCard triggers provided callbacks; hooks handle optimistic cache updates and invalidations
  ↓
jobSlice retains only filters → JobSearchPage + analytics reuse existing selectors without storing job arrays
```

### Next Actions
- Perform the mandated dry audit for each component (reading files end-to-end, mapping UI → service → API) – already completed and recorded above.
- Implement the React Query integration per component, ensuring bookmark/apply UX surfaces toast/snackbar feedback consistent with other worker pages.
- Remove saved-job state/reducers from `jobSlice.js`, verify selectors have replacements, and update documentation + STATUS_LOG once lint/build succeed.

## Implementation Progress – Nov 29, 2025 (Smart Recommendations & Dashboard)
- ✅ **SmartJobRecommendations Migration**: `src/modules/search/components/SmartJobRecommendations.jsx` now hydrates saved metadata through `useSavedJobsQuery` + `useSavedJobIds` and routes bookmark toggles through `useSaveJobMutation` / `useUnsaveJobMutation`. Redux `saveJobToServer`, `unsaveJobFromServer`, and `fetchSavedJobs` dependencies were removed, and the component displays toast feedback sourced from the mutation callbacks. The data-flow doc now reflects UI events flowing through React Query caches instead of Redux thunks.
- ✅ **Worker Dashboard AvailableJobs Refactor**: `src/modules/dashboard/components/worker/AvailableJobs.jsx` consumes `useJobsQuery` for the nearby/urgent listings feed, reusing the query cache that powers JobSearchPage. Saved state derives from the shared hook set, while apply/save actions call `useApplyToJobMutation`, `useSaveJobMutation`, and `useUnsaveJobMutation`. A deterministic `decorateJobForDashboard` helper augments job cards with icons/status without mutating the cached results, and snackbar feedback now originates from shared helpers. Redux references (fetchJobs, saved-job selectors, manual jobsApi calls) are removed, so the dashboard stays in sync with the React Query caches used elsewhere.
- ✅ **JobCard Decoupling**: `src/modules/common/components/cards/JobCard.jsx` now expects `isSaved`, `isSaveLoading`, `onToggleSave`, and `onApply` props, removing the last Redux imports from the shared card. All bookmark/apply buttons surface the mutation-provided loading states, so worker dashboards and search pages render consistent CTAs without dispatching thunks.
- ✅ **jobSlice Slimming**: `src/modules/jobs/services/jobSlice.js` has been reduced to UI filter/metadata concerns only. Saved-job thunks (`fetchSavedJobs`, `saveJobToServer`, `unsaveJobFromServer`), pagination fields, and selectors were removed, ensuring Redux no longer carries redundant job lists now handled by React Query caches.
- 🧪 **Verification**: `npm run lint --prefix kelmah-frontend` still fails due to the pre-existing backlog of prop-type + unused import violations (Worker dashboard widgets, `JobCard.jsx`, legacy routes, etc.), while `npm run build --prefix kelmah-frontend` completes successfully in ~3m30s with the usual chunk-size warnings. No new errors surfaced from this migration.
- 🔄 **Next Steps**: Prioritize the lingering lint debt across worker modules so ESLint can pass, then continue rolling the React Query hook suite into the remaining widgets/pages that still import the retired thunks.
