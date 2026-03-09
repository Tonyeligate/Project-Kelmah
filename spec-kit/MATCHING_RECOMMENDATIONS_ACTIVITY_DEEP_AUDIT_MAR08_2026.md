# Matching, Recommendations, Activity, And Page Quality Deep Audit

## Status
- State: IN PROGRESS
- Date: March 8, 2026

## March 9, 2026 Delta (Completed Hardening Pass)

### Implemented in this pass
- Preserved query forwarding on gateway recommendation proxy and added worker-role guard:
	- `kelmah-backend/api-gateway/routes/job.routes.js`
- Enforced allowlisted roles for signed gateway-user headers:
	- `kelmah-backend/shared/middlewares/serviceTrust.js`
- Added bounded worker-search pagination (`1 <= limit <= 50`, normalized page math):
	- `kelmah-backend/services/user-service/controllers/worker.controller.js`
- Fixed availability schema/query mismatch and `daySlots` response mapping:
	- `kelmah-backend/services/user-service/controllers/user.controller.js`
- Corrected authored-review retrieval to query `reviewer` (not `reviewee`):
	- `kelmah-backend/services/review-service/controllers/review.controller.js`
- Fixed hirer jobs selector/reducer drift (`active` alias + `id/_id` normalization):
	- `kelmah-frontend/src/modules/hirer/services/hirerSlice.js`
- Fixed recent-activity application derivation for bucketized app state:
	- `kelmah-frontend/src/modules/hirer/components/RecentActivityFeed.jsx`
- Fixed jobs-page runtime and interaction regressions (undefined refresh callback, action bubbling, keyboard activation):
	- `kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx`
- Improved worker-search stability (deterministic fallback IDs, split bookmark hydration, stale-response guard):
	- `kelmah-frontend/src/modules/hirer/components/WorkerSearch.jsx`

### Validation evidence
- `get_errors`: no diagnostics on edited files.
- `node --check`: passed on edited backend controllers/routes/middleware.
- `npm run build` in `kelmah-frontend`: passed.
- Live Render probing: `/api/users/workers/search?limit=500` currently returns `500`; `/api/users/workers/search?limit=50` observed high latency (~33s), confirming search-load risk.


## Scope
- Job match scoring and worker match ranking
- Worker profile matching and recommended workers flows
- Search ranking, search suggestions, worker and job discovery filters
- Recent activity logic that feeds dashboards, recommendations, and engagement widgets
- Database-to-backend flow integrity for the above areas
- Frontend page-level bug, UX, security, performance, and maintainability review focused on the pages that affect conversion and productivity

## Acceptance Criteria
- Trace each audited feature from UI page or component to frontend service or state layer to gateway route to backend controller/service/model.
- Identify concrete defects with severity, exact file references, why they matter, and how to fix them.
- Highlight the 80/20 remediation set that gives the biggest product-quality and performance gain.
- Avoid service restarts and redeploy recommendations unless changes would be large enough to justify them.

## Dry-Audit File Surface

### Frontend pages and state/service surface
- `kelmah-frontend/src/routes/config.jsx`
- `kelmah-frontend/src/pages/HomeLanding.jsx`
- `kelmah-frontend/src/modules/home/pages/HomePage.jsx`
- `kelmah-frontend/src/modules/search/pages/SearchPage.jsx`
- `kelmah-frontend/src/modules/search/contexts/SearchContext.jsx`
- `kelmah-frontend/src/modules/search/components/SmartJobRecommendations.jsx`
- `kelmah-frontend/src/modules/search/components/results/SearchResults.jsx`
- `kelmah-frontend/src/modules/search/components/results/WorkerSearchResults.jsx`
- `kelmah-frontend/src/modules/search/components/suggestions/SearchSuggestions.jsx`
- `kelmah-frontend/src/modules/search/components/common/SearchSuggestions.jsx`
- `kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx`
- `kelmah-frontend/src/modules/jobs/pages/JobDetailsPage.jsx`
- `kelmah-frontend/src/modules/jobs/components/JobResultsSection.jsx`
- `kelmah-frontend/src/modules/jobs/components/HeroFiltersSection.jsx`
- `kelmah-frontend/src/modules/jobs/services/jobsService.js`
- `kelmah-frontend/src/modules/jobs/services/jobSlice.js`
- `kelmah-frontend/src/modules/jobs/hooks/useJobs.js`
- `kelmah-frontend/src/modules/jobs/hooks/useJobsQuery.js`
- `kelmah-frontend/src/modules/worker/pages/WorkerDashboardPage.jsx`
- `kelmah-frontend/src/modules/worker/pages/WorkerProfilePage.jsx`
- `kelmah-frontend/src/modules/worker/pages/WorkerProfileEditPage.jsx`
- `kelmah-frontend/src/modules/worker/services/workerService.js`
- `kelmah-frontend/src/modules/worker/services/workerSlice.js`
- `kelmah-frontend/src/modules/hirer/pages/WorkerSearchPage.jsx`
- `kelmah-frontend/src/modules/hirer/components/RecentActivityFeed.jsx`

### Gateway and backend surface
- `kelmah-backend/api-gateway/server.js`
- `kelmah-backend/api-gateway/routes/job.routes.js`
- `kelmah-backend/api-gateway/routes/user.routes.js`
- `kelmah-backend/services/job-service/routes/job.routes.js`
- `kelmah-backend/services/job-service/controllers/job.controller.js`
- `kelmah-backend/services/job-service/models/index.js`
- `kelmah-backend/services/user-service/server.js`
- `kelmah-backend/services/user-service/controllers/worker.controller.js`
- `kelmah-backend/services/user-service/services/recommendation.service.js`
- `kelmah-backend/services/user-service/utils/helpers.js`
- `kelmah-backend/shared/models/Job.js`
- `kelmah-backend/shared/models/User.js`

### Reference audits consulted
- `spec-kit/SMART_JOB_RECOMMENDATIONS_DATA_FLOW_NOV2025.md`
- `spec-kit/JOB_SYSTEM_COMPREHENSIVE_AUDIT.md`
- `spec-kit/FRONTEND_PAGE_AUDIT_MAR08_2026.md`

## Data Flow Areas To Verify

### Job recommendations
`SmartJobRecommendations.jsx` and worker dashboard widgets -> frontend jobs/search services -> `/api/jobs/recommendations*` via gateway -> job-service controller scoring -> `Job` plus worker context.

### Worker search and recommended workers
Search and hirer worker discovery pages -> `workerService.searchWorkers()` / `getRecommendedWorkers()` -> gateway `/api/users/workers*` or `/api/search*` proxy -> user-service controller/helper/recommendation service -> `User` documents.

### Search suggestions and filters
Search pages/forms -> search services/contexts -> gateway search routes -> job-service or user-service suggestion logic -> indexed MongoDB fields.

### Recent activity and dashboard productivity widgets
Dashboard and hirer activity components -> worker/hirer services -> analytics/activity endpoints or derived payloads -> backend activity aggregation -> persisted or computed activity signals.

## Initial Risk Hypotheses
- Ranking logic is duplicated or heuristically inconsistent across services and UI consumers.
- Search and recommendation endpoints may over-fetch or miss critical indexes, hurting perceived relevance and latency.
- Recent activity widgets may rely on weak fallbacks or derived state that does not reflect real engagement.
- Shared pages may still leak wrong-role actions, reducing conversion and increasing dead-end flows.

## Verification Plan
- Complete the dry audit of mapped files before live tests.
- Validate deployed page behavior using the Vercel frontend and gateway endpoints that do not require service restarts.
- Record prioritized findings with severity, fix guidance, and expected impact.

## Consolidated Findings

### Critical
- Advanced job search in `job.controller.js` filters and ranks on non-canonical fields (`type`, `experienceLevel`, `remote`, `urgency`, `featured`, `location.coordinates`) instead of the current shared `Job` schema fields. Result: silent filter failure, false relevance, and dead geo search.
- Recommendation and worker-match scoring rely on the wrong data model (`applications.applicant`, `workerProfile.availabilityStatus`, `worker.completedJobs`) instead of the actual `Application`, `User`, and `WorkerProfileMongo` persistence layout. Result: repeated jobs, inaccurate worker matches, and unreliable match scores.
- `PUT /users/workers/:id` updates any worker profile by ID after gateway auth without an owner-or-admin authorization check. Result: horizontal privilege escalation and profile defacement risk.
- Public worker detail payloads expose contact and account-state data (`email`, `phone`, verification state, last login, business and insurance metadata, availability snapshot) on unauthenticated routes.

### High
- Public job list/detail payloads expose hirer email addresses. Live jobs list confirms `hirer.email` is in public `/api/jobs` responses.
- Public job detail flow does not enforce visibility boundaries strongly enough for unauthenticated callers in the audited code path even though the model supports `private` and `invite_only` jobs.
- Gateway user-route allow-list treats nearly every `GET /api/users/workers/*` path as public except a small regex block, leaving availability and other worker subresources exposed.
- The live production gateway returns `404` for `/api/jobs/recommendations/personalized` even though the audited service code defines the route. This is deployed contract drift.
- Worker discovery has inconsistent response envelopes across endpoints and derives fields like distance and skills from mixed shapes, increasing frontend brittleness.
- The `recent jobs` worker endpoint is implemented as a recommendation proxy, not a true chronological or activity-driven feed.
- Frontend job alert creation on `JobsPage.jsx` is a fake success flow with no persistence.
- Desktop and mobile CTAs on `JobDetailsPage.jsx` diverge: desktop reroutes hirers away from applying; mobile still drops them into the worker flow.
- Public worker discovery and authenticated hirer talent discovery are mostly separated only at the route layer; the data path remains largely shared.
- Recent activity widgets in the hirer and dashboard surfaces are synthetic or placeholder-derived rather than backed by a real event stream.

### Medium
- Worker search issues duplicate requests on sort change because URL updates and direct search execution both fire.
- Worker search suggestions are not cancellation-safe and can display stale suggestions under fast typing.
- Dashboard services and worker dashboard polling create avoidable background load through repeated multi-request refresh loops.
- `SearchContext.jsx` appears stale or orphaned relative to the current jobs response shape and is a regression trap.
- `SmartJobRecommendations.jsx` contains unsupported or dead affordances, including a non-existent “View All Recommendations” route.

## Live Verification

### Frontend deployment contract
- `GET https://kelmah-frontend-cyan.vercel.app/api/jobs?limit=1` returned `404 NOT_FOUND` during audit.
- Checked-in deployment config in `kelmah-frontend/vercel.json` only rewrites non-API paths to `/index.html`; no `/api/*` rewrite exists in repo.

### Active gateway host verification
- `GET https://kelmah-api-gateway-gf3g.onrender.com/api/health` -> `200`
- `GET https://kelmah-api-gateway-gf3g.onrender.com/api/health/aggregate` -> `200`

### Public payload evidence
- `GET https://kelmah-api-gateway-gf3g.onrender.com/api/jobs?limit=1` -> `200`
	- Response contained public `hirer.email` inside job listing payload.
- `GET https://kelmah-api-gateway-gf3g.onrender.com/api/users/workers?limit=1` -> `200`
	- Public worker list uses a different top-level contract (`workers`, `pagination`) from jobs (`data.items`, `meta.pagination`).
- `GET https://kelmah-api-gateway-gf3g.onrender.com/api/users/workers/69ab8a0201438540e0e56b98` -> `200`
	- Response contained public `contact.email`, `contact.phone`, nested `user.email`, `user.phone`, `user.isEmailVerified`, `user.lastLogin`, and availability metadata.
- `GET https://kelmah-api-gateway-gf3g.onrender.com/api/users/workers/69ab8a0201438540e0e56b98/availability` -> `200`
	- Availability subresource is publicly reachable.

### Protected route behavior
- `GET https://kelmah-api-gateway-gf3g.onrender.com/api/jobs/recommendations` without token -> `401`
- `GET https://kelmah-api-gateway-gf3g.onrender.com/api/users/profile/activity` without token -> `401`
- `GET https://kelmah-api-gateway-gf3g.onrender.com/api/jobs/recommendations/personalized` without token -> `404`
- `GET https://kelmah-api-gateway-gf3g.onrender.com/api/jobs/recommendations/worker` without token -> `404`

## Highest-Leverage Remediation Set
1. Rebuild search and recommendation logic against the actual `Job`, `User`, `WorkerProfileMongo`, and `Application` schemas, then add endpoint-level regression tests.
2. Lock down public worker payloads to a minimal DTO and remove contact, account-state, business, insurance, and scheduling data from unauthenticated responses.
3. Add owner-or-admin authorization to `PUT /users/workers/:id` immediately.
4. Remove public hirer email from all public job payloads and enforce public-only visibility checks on unauthenticated job detail reads.
5. Unify the recommendation contract and fix deployed gateway routing so documented recommendation endpoints exist consistently in production.
6. Replace fake or synthetic frontend productivity surfaces with truthful placeholders or real persisted/event-driven data.

## Residual Risks
- Historical data drift around status casing and legacy location fields will continue to poison relevance until records are normalized.
- Dual worker data sources (`User` plus `WorkerProfileMongo`) will keep causing ranking regressions unless scoring is centralized.
- The checked-in frontend deployment config and the live gateway contract are still divergent enough that production behavior can differ materially from what repo readers expect.

## Remediation Progress - March 8, 2026
- Completed the first backend hardening pass against the highest-severity issues from this audit.
- Worker profile updates now enforce owner-or-admin authorization in `worker.controller.js`.
- Public worker detail and availability responses were split into public-safe vs owner/admin views; direct contact and account-state leakage was removed from default unauthenticated reads.
- The gateway worker allow-list was tightened from a broad `GET /workers/*` bypass to explicit public-read patterns.
- Public job transformer and detail-path email leakage from hirer payloads was removed.
- Recommendation and worker-match inputs were moved onto actual `Application` and top-level `User` fields, and advanced search filters were aligned to canonical `Job` schema fields.
- Shared `User` model duplicate index declarations were removed after runtime verification exposed warning noise during module load.

## Remaining High-Value Follow-up
- Normalize response envelopes between public worker search/list/detail endpoints and job endpoints so frontend ranking/discovery code stops branching on incompatible shapes.
- Replace synthetic recent-activity surfaces with real persisted activity/event data.
- Finish the second recommendation pass by centralizing scoring logic and reducing remaining drift between `User` and `WorkerProfileMongo` data sources.
- Re-verify the public/live contracts after the next restart or deployment to confirm the patched DTO boundaries are what production actually serves.