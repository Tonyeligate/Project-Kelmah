# Hirer Service Contract Follow-Up - March 9 2026

## Scope

Extend the hirer contract audit beyond job collection methods to the remaining hirer services, analytics service, Redux thunks, and direct hirer UI transport access.

## Mapped Execution Surface

- `kelmah-frontend/src/modules/hirer/services/hirerService.js`
- `kelmah-frontend/src/modules/hirer/services/hirerAnalyticsService.js`
- `kelmah-frontend/src/modules/hirer/services/hirerSlice.js`
- `kelmah-frontend/src/modules/hirer/components/WorkerReview.jsx`

## Dry Audit Findings

1. `hirerAnalyticsService` returns raw Axios success wrappers on success but plain domain objects on failure, creating unstable contracts even before the service gains live consumers.
2. `hirerSlice` reducers still compensate for wrapped thunk payloads in multiple places, which means the service boundary remains inconsistent and harder to reason about.
3. `WorkerReview.jsx` bypasses the hirer service and reads `response.data || []` directly into local state, even though no matching `/users/workers/completed-jobs` backend route was found during the repo scan.
4. Several hirer mutation helpers still return raw `response.data` even when their callers only need the unwrapped data payload, making the success path depend on transport envelope details.

## Implementation Completed

- Added payload unwrapping, worker-list extraction, collection extraction, and pagination normalization helpers to `kelmah-frontend/src/modules/hirer/services/hirerService.js`.
- Normalized the remaining hirer service methods that previously leaked transport envelopes on success, including profile updates, analytics summary reads, worker search, bookmark actions, application updates, milestone payment release, and worker review submission.
- Added `getCompletedWorkersForReview()` to `hirerService` and switched `kelmah-frontend/src/modules/hirer/components/WorkerReview.jsx` to use it instead of talking to the API client directly.
- Normalized all non-blob success paths in `kelmah-frontend/src/modules/hirer/services/hirerAnalyticsService.js` to match the shape of their existing fallback objects.
- Added local payload and list helpers in `kelmah-frontend/src/modules/hirer/services/hirerSlice.js` so thunks now hand reducers normalized arrays and objects instead of wrapped Axios payloads.
- Fixed `hirerSlice` job-status state transitions to accept backend responses that return the updated job document rather than a synthetic `{ jobId, status }` payload.
- Updated `kelmah-frontend/src/modules/hirer/components/ProposalReview.jsx` to use `hirerService.updateApplicationStatus()` so application-status mutations stay on the shared hirer service path.

## Validation

- Static diagnostics reported no errors in the touched hirer service, Redux, and component files.
- `npm run build` succeeded for `kelmah-frontend/` after the follow-up contract fixes.
- Residual build output only included the pre-existing `src/services/apiClient.js` dynamic/static import warning.

## Findings Summary

- The hirer service layer now consistently returns domain data for non-blob operations instead of transport envelopes.
- The analytics service now has stable success and fallback shapes even before backend analytics endpoints are fully wired.
- WorkerReview no longer risks storing a wrapped payload object into array-driven component state.
- Proposal and application status mutations now flow through one normalized service boundary.
- `hirerSlice` status updates now correctly move jobs between buckets when the backend returns the updated job document.