# Matching Discovery Remediation March 11 2026

## Scope

- Fix the confirmed matching and discovery regressions from the March 11 audit.
- Keep the change set focused on live contract defects in worker suggestions, job recommendations, and worker-search drift.
- Extend automated coverage for the fixed contracts.

## Acceptance Criteria

- Worker discovery suggestions no longer depend on a missing or protected backend endpoint.
- Smart job recommendations use the personalized worker endpoint.
- The recommendations CTA navigates to a real route.
- Frontend recommendation helpers parse the live backend payload shape.
- Worker directory frontend calls use one canonical search contract.
- Relevant frontend and backend tests pass.

## Mapped Execution Surface

- kelmah-frontend/src/modules/search/components/WorkerDirectoryExperience.jsx
- kelmah-frontend/src/modules/search/components/SmartJobRecommendations.jsx
- kelmah-frontend/src/modules/search/services/smartSearchService.js
- kelmah-frontend/src/modules/jobs/services/jobsService.js
- kelmah-frontend/src/modules/worker/services/workerService.js
- kelmah-frontend/src/routes/config.jsx
- kelmah-frontend/src/modules/search/services/searchService.test.js
- kelmah-backend/services/user-service/controllers/worker.controller.js
- kelmah-backend/services/user-service/tests/worker-directory.controller.test.js
- spec-kit/STATUS_LOG.md

## Planned Fix Shape

- Replace frontend worker typeahead calls to `/users/workers/suggest` with suggestion derivation from the public worker directory query path.
- Move smart recommendations to the personalized endpoint and normalize the returned payload.
- Redirect the recommendations CTA to the real `/jobs` route.
- Normalize `workerService.queryWorkerDirectory()` onto the canonical worker search request vocabulary.
- Preserve backend compatibility while extending worker search handling for canonical filters.

## Implementation Completed

- Replaced the broken frontend `/users/workers/suggest` dependency with suggestion derivation from the existing public worker directory search flow.
- Added `workerService.getWorkerSearchSuggestions()` so the UI now receives typed suggestion objects from canonical worker search results instead of a missing endpoint.
- Moved `smartSearchService.js` onto `/jobs/recommendations/personalized` and stopped forwarding the redundant `userId` query parameter.
- Fixed `SmartJobRecommendations.jsx` so the CTA now routes to `/jobs` instead of the dead `/search/jobs` path.
- Fixed `jobsService.getPersonalizedJobRecommendations()` to parse `data.jobs` before legacy fallback shapes.
- Normalized `workerService.queryWorkerDirectory()` onto `/users/workers/search` with canonical query keys.
- Extended backend `searchWorkers()` alias handling for trade, work type, verified, and rating filters so the canonical frontend contract remains compatible.

## Validation

- Backend Jest passed:
	- `services/user-service/tests/worker-directory.controller.test.js`
	- `services/job-service/tests/job-ranking.contract.test.js`
	- `services/user-service/tests/user-profile-activity.controller.test.js`
	- `services/user-service/tests/worker-profile.controller.test.js`
- Frontend Jest passed:
	- `src/modules/worker/services/workerService.test.js`
	- `src/modules/search/services/smartSearchService.test.js`
	- `src/modules/jobs/services/jobsService.test.js`
	- `src/modules/search/components/SmartJobRecommendations.test.jsx`
- Frontend production build passed with `npm run build` from `kelmah-frontend`.
- Backend teardown note: a combined Jest run emitted the generic async-operations warning once, but the same suite passed cleanly under `--detectOpenHandles`, so no remediation-specific leak was confirmed.
- Remaining precision note: `worker-profile.controller.test.js` confirms the current worker profile update path is not reintroducing the audited discovery contract bugs. The live worker-profile mismatch issue remains a historical data-cleanup problem.