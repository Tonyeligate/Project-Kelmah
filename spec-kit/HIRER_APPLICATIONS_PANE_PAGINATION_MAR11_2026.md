# Hirer Applications Pane Pagination - March 11 2026

## Scope
- Replace full in-memory grouped application hydration in hirer application management with server-backed pagination.
- Preserve job sidebar counts, all-jobs mode, status tabs, and application review actions.

## Acceptance Criteria
- Backend returns lightweight per-job and overall application counts plus one paged application window.
- Frontend stores only the active application page and pagination metadata.
- Changing job, tab, or page refreshes the current slice without reintroducing N+1 requests.

## Mapped File Surface
- `kelmah-backend/services/job-service/routes/job.routes.js`
- `kelmah-backend/services/job-service/controllers/job.controller.js`
- `kelmah-backend/services/job-service/models/index.js`
- `kelmah-backend/shared/models/Application.js`
- `kelmah-backend/services/job-service/utils/response.js`
- `kelmah-frontend/src/modules/hirer/services/hirerService.js`
- `kelmah-frontend/src/modules/hirer/pages/ApplicationManagementPage.jsx`
- `spec-kit/STATUS_LOG.md`

## Data Flow Audit
UI Component: `kelmah-frontend/src/modules/hirer/pages/ApplicationManagementPage.jsx`

User Action: open page, select job, change status tab, change pagination page, review application
↓
State Management: local React state for `selectedJobId`, `activeTab`, `currentPage`, `selectedApplication`
↓
API Service: `kelmah-frontend/src/modules/hirer/services/hirerService.js`
↓
API Call: `GET /api/jobs/applications/received-summary?jobId=&status=&page=&limit=`
↓
Backend Route: `kelmah-backend/services/job-service/routes/job.routes.js`
↓
Controller: `kelmah-backend/services/job-service/controllers/job.controller.js#getHirerApplicationsSummary`
↓
Models: `Job`, `Application`
↓
Response: `{ success, data: { jobs, summary, applications, pagination } }`
↓
UI Update: job badges/tab counts remain accurate while only the current page of applications is rendered and retained

## Dry-Audit Findings
- The existing summary endpoint still performs a full application read and groups every result into `applicationsByJob`.
- The page currently uses `applicationsByJob` as its source of truth for counts and lists, which forces full retention of the result set.
- Job/service response helpers already support pagination metadata, so the new shape can stay consistent with existing API conventions.

## Planned Fix
- Rework `getHirerApplicationsSummary` to aggregate per-job counts separately from the paginated item query.
- Add `jobId`, `page`, and `limit` support to the frontend service call.
- Refactor the page to derive counts from `jobs`/`summary`, render only `applications`, and show pagination controls for the applications pane.

## Implementation
- `getHirerApplicationsSummary` now performs a count aggregation across the hirer's non-bidding jobs to build `applicationCounts` per job and `summary.countsByStatus` for the whole screen.
- The endpoint now accepts `jobId`, `status`, `page`, and `limit`, and returns `{ jobs, summary, applications, pagination, filters }` instead of the full `applicationsByJob` map.
- `hirerService.getApplicationsSummary()` forwards those filters and normalizes `applications` plus `pagination` for the page.
- `ApplicationManagementPage.jsx` now stores `applications`, `summary`, and `pagination` state only, derives tab/sidebar counts from the server response, and renders MUI pagination controls for the applications pane.

## Verification
- Backend module-load validation: `node -e "require('./kelmah-backend/services/job-service/routes/job.routes'); require('./kelmah-backend/services/job-service/controllers/job.controller'); console.log('job-service pagination module load ok'); process.exit(0)"`
- Frontend build validation: `npm run build` in `kelmah-frontend`
- Result: Vite production build succeeded and emitted `ApplicationManagementPage-8leIwQjL.js` in the final bundle.

## Follow-Up Scope: Sort And Page Size Controls
- Add server-side sort options for newest, highest rated applicant, and proposed rate.
- Add page-size controls to the applications pane so hirers can change the current slice density without returning to a full in-memory list.

## Follow-Up Data Flow
User Action: change sort or page size in `ApplicationManagementPage.jsx`
↓
Local State: `sortBy`, `pageSize`, `currentPage`
↓
API Service: `hirerService.getApplicationsSummary({ jobId, status, page, limit, sort })`
↓
Backend: `getHirerApplicationsSummary` validates `sort` and applies the selected order in MongoDB
↓
Response: paged applications plus pagination/filter metadata for the selected sort/page size

## Follow-Up Implementation
- `getHirerApplicationsSummary` now normalizes sort aliases and uses an aggregation pipeline with worker lookup so `highest-rated` can sort on worker rating without client-side reshuffling.
- The response now echoes `filters.sort` alongside the paginated items so the page can stay aligned with the applied backend sort.
- `ApplicationManagementPage.jsx` now exposes MUI select controls for sort and page size in the applications pane footer and resets the active page when those values change.

## Follow-Up Verification
- Backend module-load validation: `node -e "require('./kelmah-backend/services/job-service/routes/job.routes'); require('./kelmah-backend/services/job-service/controllers/job.controller'); console.log('job-service sort pagination module load ok'); process.exit(0)"`
- Frontend build validation: `npm run build` in `kelmah-frontend`
- Result: Vite production build succeeded and emitted `ApplicationManagementPage-B0UQWWAJ.js` in the final bundle.

## Follow-Up Scope: URL State And Sort Alias Test
- Persist sort and page-size controls in the applications pane URL so reloads and deep links restore the same view.
- Add a lightweight controller contract test that proves sort aliases normalize to the intended backend sort modes.

## Follow-Up Data Flow
User Action: load a deep link or change sort/page size in `ApplicationManagementPage.jsx`
↓
URL Query: `jobId`, `tab`, `page`, `limit`, `sort`
↓
Local State: `selectedJobId`, `activeTab`, `currentPage`, `pageSize`, `sortBy`
↓
API Service: `hirerService.getApplicationsSummary({ jobId, status, page, limit, sort })`
↓
Backend Controller: `getHirerApplicationsSummary`
↓
Contract Test: validates alias normalization and applied sort metadata

## Follow-Up Implementation: URL State And Sort Alias Test
- `ApplicationManagementPage.jsx` now normalizes `tab`, `page`, `limit`, and `sort` from the URL on mount and on browser navigation changes.
- The page now writes canonical query params back with `replace: true`, so reloads and copied links preserve the current applications pane view.
- Added `kelmah-backend/services/job-service/tests/hirer-applications-summary.contract.test.js` with controller contract coverage for the `latest`, `rating`, and `rate` aliases.

## Follow-Up Verification: URL State And Sort Alias Test
- Backend contract validation: `npx jest --runTestsByPath services/job-service/tests/hirer-applications-summary.contract.test.js --runInBand`
- Frontend build validation: `npm run build` in `kelmah-frontend`
- Result: Jest passed `3/3` sort-alias tests and the Vite production build succeeded after the URL-state changes.