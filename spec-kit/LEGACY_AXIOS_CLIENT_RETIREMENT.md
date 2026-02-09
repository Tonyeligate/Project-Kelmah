# Legacy Axios Client Retirement – Dry Audit (Nov 25, 2025)

## Scope Snapshot
- Consolidate every lingering frontend service that still imports the removed `modules/common/services/axios.js` helper or its exported `userServiceClient`, `jobServiceClient`, and `messagingServiceClient` variants.
- Restore a successful `npm run build --prefix kelmah-frontend` by pointing all affected consumers to the centralized `services/apiClient` exports.
- Capture end-to-end data flow notes for the UI experiences that rely on these services so future regressions can be traced quickly.

## File Surface & Findings
| File | Role in Flow | Dry-Audit Notes |
| --- | --- | --- |
| `kelmah-frontend/src/modules/common/services/fileUploadService.js` | Shared upload helper used by messaging + profile flows | Still imports `{ userServiceClient, messagingServiceClient }` from the deleted `./axios`. Runtime now throws during bundling, and the helper cannot pick the correct gateway client. Needs to use `api` + dynamic base paths per service. |
| `kelmah-frontend/src/modules/common/utils/apiUtils.js` | Legacy gateway health/utility wrapper consumed by diagnostics | Imports `../services/axios` (removed). Functions fall back to `gatewayClient` symbol that no longer exists, so any import of `apiUtils` explodes immediately. Update to consume `api` or retire if unused. |
| `kelmah-frontend/src/modules/hirer/services/hirerService.js` | Hirer dashboard/profile service used by `hirerDashboardSlice` and UI dashboards | Top of file already uses `api`, but later methods (`getStats`, worker search/bookmarks/save) still call `userServiceClient`/`jobServiceClient` from the removed helper. Replace with appropriate `api` routes and sturdy response normalization. |
| `kelmah-frontend/src/modules/dashboard/services/dashboardSlice.js` | Cross-role dashboard slice powering `/dashboard` | `updateJobStatus` thunk still references `jobServiceClient.patch(...)` even though the helper is gone. Bundle now fails because `jobServiceClient` is undefined. Swap to `api.patch('/jobs/:id/status')` to keep parity with hirer slice. |
| `kelmah-frontend/src/modules/hirer/components/HirerJobManagement.jsx` | UI surface that dispatches `updateJobStatus`, `deleteHirerJob`, etc. | Component relies on `hirerSlice` thunks, so any regression in those services immediately impacts the job management UI. Confirmed the dispatch chain so we can document the flow below. |
| `kelmah-frontend/src/modules/dashboard/components/hirer/EnhancedHirerDashboard.jsx` | Primary hirer dashboard UI that calls `fetchHirerDashboardData`, `fetchActiveJobs`, etc. | Reads from `hirerDashboardSlice`, which in turn calls `hirerService`. Any changes to `hirerService` endpoints must maintain this data shape. |

## Data Flow Analyses

### Hirer Dashboard Metrics
```
UI Component: EnhancedHirerDashboard.jsx
Location: kelmah-frontend/src/modules/dashboard/components/hirer/EnhancedHirerDashboard.jsx

User Action: Hirer loads /hirer/dashboard
↓
Effect Hook: useEffect dispatches fetchHirerDashboardData() once user + metrics absent
↓
Redux Slice: hirerDashboardSlice.js thunk fetchHirerDashboardData
↓
Service Call: hirerService.getDashboardData() -> api.get('/users/dashboard/metrics', '/users/dashboard/workers', '/jobs/my-jobs', etc.) via Promise.allSettled
↓
API Gateway: Proxies /api/users/dashboard/* and /api/jobs/my-jobs to user-service + job-service with gateway auth headers
↓
Microservices: user-service returns metrics/workers JSON; job-service returns hirer jobs list
↓
Redux Update: hirerDashboardSlice extraReducers hydrate state.data.{metrics,activeJobs,recentApplications}
↓
UI Update: EnhancedHirerDashboard selectors refresh statistics cards, quick actions, and list components
```
**Notes**: Response normalization currently tolerates `{ data: { metrics } }`, `{ metrics }`, or arrays. Any refactor of `hirerService` must keep those fallbacks intact.

### Hirer Job Status Management
```
UI Component: HirerJobManagement.jsx
Location: kelmah-frontend/src/modules/hirer/components/HirerJobManagement.jsx

User Action: Hirer selects "Publish Job" in the action menu
↓
Event Handler: handlePublishJob() dispatches updateJobStatus({ jobId, status: 'active' })
↓
Redux Slice: hirerSlice.js thunk updateJobStatus uses api.patch(`/jobs/${jobId}/status`, { status })
↓
API Gateway: /api/jobs/:id/status proxy routes to job-service with hirer auth context
↓
Job Service: Controller validates hirer ownership, updates job status, returns updated job payload
↓
Redux Update: hirerSlice extraReducer moves the job between status buckets and updates dashboards
↓
UI Update: HirerJobManagement table re-renders with the job now in the Active tab, dialog closes, and snackbar/toast logic (when enabled) confirms success
```
**Notes**: Dashboard slice tries to mirror this capability but still references `jobServiceClient`; we must align it with the same `api` pattern so both pages rely on the centralized client.

### Messaging Attachments Upload (Service Impact)
```
UI Hook: useAttachments.js (consumed by messaging composer components)
Location: kelmah-frontend/src/modules/messaging/hooks/useAttachments.js

User Action: Worker/hirer selects files in the messaging composer
↓
Event Handler: handleFileSelection filters oversized/unsupported files
↓
Hook Action: uploadFile() calls fileUploadService.uploadFile(file, `attachments/${conversationId}`, 'messaging')
↓
Service Helper: fileUploadService.js currently attempts to choose userServiceClient vs messagingServiceClient from ./axios (missing)
↓
API Gateway: Should call /api/uploads/presign (messaging) or /api/profile/uploads/presign (user) using central api client with auth headers
↓
Messaging/User Service: Returns presigned URLs or local upload fallback endpoints
↓
Hook Update: uploadFile returns { url, filename, contentType } for message payload
↓
UI Update: Messaging composer attaches uploaded asset and sends payload via messagingService
```
**Notes**: Without fixing fileUploadService to use `api`, attachment uploads fail before hitting the gateway, blocking messaging.

## Next Steps
1. Replace every `userServiceClient`/`messagingServiceClient`/`jobServiceClient` reference noted above with the centralized `api` helper from `services/apiClient` plus explicit base paths.
2. Update `apiUtils` (or retire it) so no module references the deleted `../services/axios` file.
3. Re-run `npm run build --prefix kelmah-frontend` and document the verification plus any lingering warnings in `STATUS_LOG.md`.

## Planned Fix (Pre-Implementation)
| Target File | Planned Change |
| --- | --- |
| `modules/common/services/fileUploadService.js` | Import `{ api }` and derive service-specific base paths (`/users`, `/messaging`). Replace the legacy client switch statement with a simple helper that maps `service` → endpoint prefixes, reuse `api.post` for presign/local uploads, and keep the fetch-based S3 PUT logic intact. Ensure multipart fallbacks set `Content-Type: multipart/form-data` explicitly. |
| `modules/common/utils/apiUtils.js` | Swap the missing `../services/axios` import for `{ api as gatewayClient }` so health checks and helper methods reuse the consolidated client. Preserve the optional headers (`ngrok-skip-browser-warning`, `skipAuthRefresh`) by forwarding them through `api.get/post/...`. |
| `modules/hirer/services/hirerService.js` | Remove the unused client imports and call `api` directly for stats, worker search, bookmarks, save/unsave, etc. Normalize each response to tolerate `{ data }` vs. `{ workers }` shapes just like the existing methods at the top of the file. |
| `modules/dashboard/services/dashboardSlice.js` | Update `updateJobStatus` thunk to call `api.patch(`/jobs/${jobId}/status`, { status })` and adjust the return payload so the reducer receives `{ jobId, status }` consistently. |
| `modules/common/services/__mocks__/axios.js` | If tests still reference this mock, either update it to mock the new `api` surface or remove it if unused once the migration completes. |
| Documentation | After coding, append a verification note to `STATUS_LOG.md` referencing the successful build and summarize the data-flow impact in this spec note. |

## Implementation Kickoff (Nov 25, 2025)
- Recorded the execution phase in `STATUS_LOG.md` and reconfirmed the dry-audit ordering so the refactor lands in this sequence: shared upload helper → diagnostics utilities → hirer service → dashboard slice.
- Every edit will reuse `{ api }` from `services/apiClient` plus `API_ENDPOINTS` from `config/environment.js`, preserving existing response normalization for dashboards and messaging attachments while removing the missing `./axios` imports.
- Verification plan: rerun `npm run build --prefix kelmah-frontend`, capture the output, and fold the results plus any residual risks back into this note and STATUS_LOG.

## Implementation Outcomes (Nov 26, 2025)
- `fileUploadService.js` now selects upload targets through a `SERVICE_TARGETS` map and performs every presign/local upload request with the centralized `api` client, which unblocks messaging attachments and upcoming profile media flows.
- `apiUtils.js`, `hirerService.js`, `dashboardSlice.js`, and the affected hirer/job components all route through `api` + `API_ENDPOINTS`, eliminating the final references to the removed `modules/common/services/axios.js` helper.
- Route config and shared pages received import corrections plus a dedicated `NotFoundPage`, removing the bundler errors that surfaced once the legacy helper was deleted.
- `authService.js` regained the closing utilities (profile update, password reset, MFA helpers, refresh scheduling) that were accidentally truncated during earlier merges, ensuring session refresh resumes working during long-lived tabs.
- Confirmed no test harness references to the legacy Jest mock at `modules/common/services/__mocks__/axios.js` and removed the unused file to keep the codebase aligned with the single `api` client.

## Verification & Remaining Risks
- Command: `npm run build --prefix kelmah-frontend`
	- Result: ✅ Build succeeded; Vite reported large chunk warnings only (expected while charts/tables share vendors) and no missing module errors.
- STATUS_LOG now records the retirement and the successful build output for traceability.
- Residual risks: none outstanding for the retired axios helper; future test utilities should rely on the centralized `api` client factories if mocking becomes necessary.
