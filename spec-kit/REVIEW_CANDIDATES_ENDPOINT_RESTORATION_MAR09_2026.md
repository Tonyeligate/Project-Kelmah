# Review Candidates Endpoint Restoration - March 9 2026

## Scope

Add the missing backend endpoint that powers the hirer review screen, using review-service as the canonical owner of completed-job review eligibility and review state.

## Mapped Execution Surface

- `kelmah-backend/services/review-service/controllers/review.controller.js`
- `kelmah-backend/services/review-service/server.js`
- `kelmah-backend/services/review-service/routes/review.routes.js`
- `kelmah-backend/services/review-service/tests/review.controller.contract.test.js`
- `kelmah-frontend/src/modules/hirer/services/hirerService.js`
- `kelmah-frontend/src/modules/hirer/components/WorkerReview.jsx`

## Dry Audit Findings

1. The frontend review screen was requesting `/users/workers/completed-jobs`, but no corresponding user-service or gateway route exists.
2. Review-service already enforces the core business rule that reviews require completed jobs and valid job participants, so the new listing endpoint belongs there.
3. The live WorkerReview UI expects a grouped payload shaped as workers with `completedJobs` arrays containing job metadata and any existing review state.
4. API Gateway already forwards authenticated `/api/reviews/*` requests, so the backend gap is limited to review-service plus the frontend route target.

## Implementation Completed

- Added `getHirerReviewCandidates()` to `kelmah-backend/services/review-service/controllers/review.controller.js`.
- The new controller loads completed jobs for the authenticated hirer, resolves workers from either `job.worker` or accepted applications, fetches worker details and rating summaries, attaches any existing review for each job, and returns workers grouped with `completedJobs` arrays for the frontend.
- Exposed the route at `/api/reviews/hirer/review-candidates` in `kelmah-backend/services/review-service/server.js` and `kelmah-backend/services/review-service/routes/review.routes.js`.
- Updated `kelmah-frontend/src/modules/hirer/services/hirerService.js` so the WorkerReview flow now targets the canonical review-service route.
- Added a focused contract test covering grouped workers, existing review hydration, and accepted-application fallback in `kelmah-backend/services/review-service/tests/review.controller.contract.test.js`.

## Validation

- Static diagnostics reported no errors in the touched backend and frontend files.
- Focused Jest verification passed:
	- `services/review-service/tests/review.controller.contract.test.js`
- The frontend build passed after repointing the hirer service to `/reviews/hirer/review-candidates`.

## Findings Summary

- The hirer review screen now has a real backend data source instead of a dead user-service path.
- Review-service remains the canonical owner of completed-job review eligibility and review status.
- The response shape now matches the WorkerReview component's existing grouped worker and completed-jobs contract.