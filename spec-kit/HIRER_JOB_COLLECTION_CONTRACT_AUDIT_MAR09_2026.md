# Hirer Job Collection Contract Audit - March 9 2026

## Scope

Audit and fix hirer job collection consumers so they consistently receive arrays from `GET /api/jobs/my-jobs`, and correct adjacent logic flaws uncovered while tracing the end-to-end job payload flow.

## Acceptance Criteria

- `getJobs()` and `getRecentJobs()` always return arrays.
- Frontend parsing matches the backend paginated contract `{ success, data: { items, pagination } }`.
- Hirer dashboard job requests use backend-supported status values.
- Adjacent logic reusing the same job collection payload is corrected where necessary.
- Touched files validate cleanly.

## Mapped Execution Surface

- `kelmah-frontend/src/modules/hirer/services/hirerService.js`
- `kelmah-frontend/src/modules/dashboard/services/hirerDashboardSlice.js`
- `kelmah-backend/services/job-service/routes/job.routes.js`
- `kelmah-backend/services/job-service/controllers/job.controller.js`
- `kelmah-backend/services/job-service/utils/response.js`

## Data Flow Trace

UI/State path:
- Hirer dashboard thunk `fetchActiveJobs` in `kelmah-frontend/src/modules/dashboard/services/hirerDashboardSlice.js`
- Calls `hirerService.getRecentJobs()` in `kelmah-frontend/src/modules/hirer/services/hirerService.js`
- Uses shared frontend `api` client to request `GET /api/jobs/my-jobs`

Gateway/backend path:
- API Gateway forwards `/api/jobs/my-jobs`
- `kelmah-backend/services/job-service/routes/job.routes.js` maps it to `jobController.getMyJobs()`
- `kelmah-backend/services/job-service/controllers/job.controller.js` queries jobs and returns them through `paginatedResponse()`
- `kelmah-backend/services/job-service/utils/response.js` shapes the payload as `{ success, data: { items, pagination }, message, meta }`

## Dry Audit Findings

1. `getJobs()` and `getRecentJobs()` returned `response.data` on success and `[]` on failure, creating an unstable array-vs-object contract.
2. The actual backend payload is paginated under `data.items`, so the user-reported `response.data?.data || []` fix would still be incomplete for the real live contract.
3. Hirer service requests were sending `status: 'active'`, but `jobController.getMyJobs()` only honors canonical values such as `open`, `completed`, and `draft`. The invalid value is ignored, which widens results unexpectedly.
4. `getApplications()` reused the same endpoint but treated `response.data?.data` as an array, so the paginated object caused the application flattening loop to skip all jobs.
5. `fetchActiveJobs` stored the service result directly into dashboard state, so any non-array payload could propagate into array-driven UI rendering.

## Fix Implemented

### Frontend service normalization

- Added `JOB_STATUS_MAP` and `getCanonicalJobStatus()` in `kelmah-frontend/src/modules/hirer/services/hirerService.js`.
- Added `extractCollectionItems()` to normalize arrays from raw arrays, paginated `items`, legacy `jobs`, and sibling collection shapes.
- Added `buildMyJobsParams()` so all hirer job requests share one canonical parameter builder.

### Corrected methods

- `getJobs()` now returns normalized items arrays.
- `getRecentJobs()` now returns normalized items arrays.
- `getDashboardData()` now requests `open` jobs through the shared param builder and unwraps the same collection shape.
- `getApplications()` now reads the paginated jobs payload correctly before flattening nested applications.

### Defensive state hardening

- `kelmah-frontend/src/modules/dashboard/services/hirerDashboardSlice.js` now guards `activeJobs` and `recentApplications` assignments with `Array.isArray(...)`.

## Validation

- Static diagnostics: no errors in the touched frontend files.
- Frontend build: `npm run build` succeeded from `kelmah-frontend/`.
- Residual warning: pre-existing dynamic/static import warning for `src/services/apiClient.js`, unrelated to this audit.

## Findings Summary

- Root bug fixed: dashboard-facing hirer job collection methods no longer leak raw Axios success wrappers.
- Deeper logic bug fixed: hirer job collection requests now use backend-recognized status values.
- Adjacent data-loss bug fixed: hirer application flattening no longer drops paginated job payloads.
- Defensive state boundary added: dashboard reducers now reject non-array collection payloads.