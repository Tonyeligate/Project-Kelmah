# Matching Discovery Activity Audit March 11 2026

## Scope

- Audit the current job matching, worker-profile matching, search recommendations, worker discovery, and profile activity logic.
- Validate the live frontend and API gateway behavior without restarting services or triggering redeploys.
- Distinguish current defects from already-remediated March 2026 findings.

## Acceptance Criteria

- Read the active frontend, gateway, backend, and model files in the matching and discovery flow before concluding.
- Verify live production contracts through the deployed frontend and gateway where practical.
- Provide severity-ranked findings with root cause, impact, and fix direction.

## Mapped Execution Surface

- kelmah-frontend/src/routes/config.jsx
- kelmah-frontend/src/modules/jobs/services/jobsService.js
- kelmah-frontend/src/modules/search/services/smartSearchService.js
- kelmah-frontend/src/modules/search/components/SmartJobRecommendations.jsx
- kelmah-frontend/src/modules/search/components/WorkerDirectoryExperience.jsx
- kelmah-frontend/src/modules/worker/services/workerService.js
- kelmah-frontend/src/modules/worker/pages/WorkerDashboardPage.jsx
- kelmah-frontend/src/modules/jobs/pages/JobDetailsPage.jsx
- kelmah-backend/api-gateway/server.js
- kelmah-backend/services/job-service/controllers/job.controller.js
- kelmah-backend/services/job-service/routes/job.routes.js
- kelmah-backend/services/user-service/controllers/worker.controller.js
- kelmah-backend/services/user-service/controllers/user.controller.js
- kelmah-backend/services/user-service/routes/user.routes.js
- kelmah-backend/services/user-service/models/ActivityEvent.js
- kelmah-backend/shared/models/Job.js
- kelmah-backend/shared/models/User.js
- create-gifty-user.js
- spec-kit/STATUS_LOG.md

## End-To-End Flow Notes

### Smart job recommendations

Worker UI action
-> kelmah-frontend/src/modules/search/components/SmartJobRecommendations.jsx
-> kelmah-frontend/src/modules/search/services/smartSearchService.js
-> GET /api/jobs/recommendations via gateway
-> kelmah-backend/services/job-service/controllers/job.controller.js getJobRecommendations

The active widget is not using the newer personalized endpoint. The backend personalized contract is live, but this widget is still wired to the older generic route.

### Personalized recommendations service helper

Potential consumer
-> kelmah-frontend/src/modules/jobs/services/jobsService.js
-> GET /api/jobs/recommendations/personalized via gateway
-> kelmah-backend/services/job-service/controllers/job.controller.js getPersonalizedJobRecommendations

The backend returns data.jobs. The helper currently parses recommendations or items, so any future consumer would receive an empty array unless it bypasses this helper.

### Worker discovery

Public or hirer UI action
-> kelmah-frontend/src/modules/search/components/WorkerDirectoryExperience.jsx
-> kelmah-frontend/src/modules/worker/services/workerService.js queryWorkerDirectory
-> GET /api/users/workers via gateway
-> kelmah-backend/services/user-service/controllers/worker.controller.js getAllWorkers

There is also a parallel search path:

Frontend or gateway alias
-> GET /api/search/workers
-> gateway rewrite to /api/users/workers/search
-> kelmah-backend/services/user-service/controllers/worker.controller.js searchWorkers

The platform currently supports two worker search dialects and two routes for effectively the same discovery job.

### Profile activity

Authenticated UI action
-> frontend dashboard/profile consumers
-> GET /api/users/profile/activity
-> kelmah-backend/services/user-service/controllers/user.controller.js getProfileActivity
-> syncProfileActivitySource
-> collectAuthoritativeActivityEvents
-> ActivityEvent persistence

This area is materially healthier than older audits indicated. The activity path now uses persisted authoritative events rather than only heuristic legacy fields.

## Live Verification Summary

- Frontend https://kelmah-frontend-cyan.vercel.app returned 200.
- Gateway https://kelmah-api-gateway-gf3g.onrender.com/health returned 200.
- Gateway /api/health and /api/health/aggregate returned 200.
- Worker login succeeded with kwame.asante1@kelmah.test / TestUser123!.
- Hirer login succeeded with giftyafisa@gmail.com / Vx7!Rk2#Lm9@Qa4.
- GET /api/jobs/recommendations/personalized?limit=3 returned 200 with contract mobile-recommendations-v1 and data.jobs.
- GET /api/jobs/recommendations?limit=3 returned 200 with data.jobs and insights.
- GET /api/users/profile/activity?limit=3 returned 200 with live activity records.
- GET /api/users/workers/suggest?query=elec returned 401 without auth.
- GET /api/users/workers/search and GET /api/users/workers both returned 200 for similar worker lookups.
- Relevant local tests passed directly with Jest:
  - services/job-service/tests/job-ranking.contract.test.js
  - services/user-service/tests/worker-directory.controller.test.js
  - services/user-service/tests/user-profile-activity.controller.test.js

## Findings

### 1. Critical: public worker suggestions are wired in the UI but are not publicly reachable and appear to have no backend route

Evidence
- kelmah-frontend/src/modules/search/components/WorkerDirectoryExperience.jsx calls GET /users/workers/suggest at line 239.
- kelmah-backend/api-gateway/server.js public worker patterns allow /workers, /workers/search, worker detail, availability, completeness, and subresources, but not /workers/suggest in the block around lines 680-696.
- Live probe to /api/users/workers/suggest?query=elec returned 401 AUTH_REQUIRED.
- No active user-service route/controller match for workers/suggest was found in the current backend code search.

Impact
- Public and hirer-facing worker discovery typeahead is broken or silently degraded.
- Users see an input that implies live suggestions, but the backend contract does not support the call path the frontend is using.

Fix direction
- Choose one contract and make it real:
  - Either implement GET /api/users/workers/suggest in user-service and add it to the gateway public allow-list.
  - Or remove the frontend call and reuse an existing public search endpoint with debounced query narrowing.
- Add an integration test covering anonymous access to the chosen suggestion endpoint.

### 2. High: the smart recommendations widget is still wired to the generic recommendations endpoint while presenting itself as personalized

Evidence
- kelmah-frontend/src/modules/search/components/SmartJobRecommendations.jsx imports smartSearchService at line 6 and calls getSmartJobRecommendations at line 171.
- kelmah-frontend/src/modules/search/services/smartSearchService.js sets JOB_RECOMMENDATIONS_ENDPOINT to /jobs/recommendations at line 4 and calls it at line 45.
- The backend personalized endpoint exists and enforces worker-only access in kelmah-backend/services/job-service/controllers/job.controller.js at line 4041.

Impact
- The product copy promises personalized recommendations, but the active widget is still consuming the older generic recommendation flow.
- Precision work landed in the personalized controller is not the code path the widget actually uses.

Fix direction
- Move SmartJobRecommendations onto /jobs/recommendations/personalized.
- Keep one frontend recommendation contract: data.jobs, totalRecommendations, averageMatchScore, meta.recommendationSource.
- Add a component/service contract test so the widget cannot regress back to the generic endpoint silently.

### 3. High: the recommendations CTA points to a route that does not exist in the current route tree

Evidence
- kelmah-frontend/src/modules/search/components/SmartJobRecommendations.jsx navigates to /search/jobs?recommended=true at line 833.
- kelmah-frontend/src/routes/config.jsx defines top-level jobs at line 349, find-talents at line 376, and search at line 381.
- No active route definition for /search/jobs was found in the route config.

Impact
- Users can hit a broken or misleading navigation path from a primary recommendations CTA.
- This directly lowers trust in the recommendations surface and creates unnecessary drop-off.

Fix direction
- Route the CTA to an existing page, most likely /jobs with a supported recommended filter, or add the missing nested route intentionally.
- Add a route-level smoke test for all primary recommendation CTAs.

### 4. Medium: the frontend personalized recommendations helper parses the wrong response shape

Evidence
- kelmah-frontend/src/modules/jobs/services/jobsService.js getPersonalizedJobRecommendations starts at line 602.
- It accepts payload.recommendations at line 609 and payload.items at line 614.
- The live backend personalized endpoint currently returns data.jobs.

Impact
- Any future consumer of jobsService.getPersonalizedJobRecommendations will receive empty results even when the backend returns matches.
- This is a dormant contract defect waiting to surface in the next consumer.

Fix direction
- Parse payload.jobs first.
- Add a frontend service test with the real backend payload shape.

### 5. Medium: worker discovery still carries two competing query dialects and route families

Evidence
- kelmah-frontend/src/modules/worker/services/workerService.js still maps query terms to keywords, city, primaryTrade, and rating in the block around lines 139-186.
- The same service calls queryWorkerDirectory through GET /workers at line 236.
- kelmah-backend/services/user-service/controllers/worker.controller.js exposes getAllWorkers at line 1850 and searchWorkers at line 1937, both backed by executeWorkerDirectoryQuery at line 512.
- Gateway also exposes /api/workers and /api/search/workers rewrites in kelmah-backend/api-gateway/server.js around lines 885-929.

Impact
- Discovery behavior is harder to reason about, easier to regress, and more likely to drift across clients.
- Teams must maintain compatibility for old and new query names even though both hit the same core query engine.

Fix direction
- Collapse onto one canonical public worker search route and one query vocabulary.
- Keep one temporary compatibility adapter at the gateway or service boundary, not across every frontend consumer.
- Document the canonical worker-search contract in tests.

### 6. High: live worker-profile data quality drift is already hurting search precision

Evidence
- Live search for electrician in Accra returned a worker with profession Licensed Electrician but gardening-focused bio and gardening skills.
- kelmah-backend/services/user-service/controllers/worker.controller.js correctly uses WorkerProfile as the aggregation root, so the remaining precision problem is no longer only controller shape; it is data quality crossing User and WorkerProfile fields.
- Matching and recommendation logic consume these fields downstream, including collectWorkerSkills and match scoring in kelmah-backend/services/job-service/controllers/job.controller.js.

Impact
- Even correct ranking logic cannot be precise when canonical worker skills and profession fields disagree.
- This directly weakens worker search, worker recommendations, and job-match trust.

Fix direction
- Run a data audit for User plus WorkerProfile alignment on profession, specializations, skills, and bio.
- Add a repair migration and a write-path invariant so profession and skills cannot diverge silently.
- Add moderation or repair tooling for imported/backfilled worker profiles.

### 7. Low: the shared test-user script now provisions Gifty as a hirer, which invalidates older recommendation smoke assumptions

Evidence
- create-gifty-user.js sets BASELINE_GIFTY_USER role to hirer at line 25.
- Live use of the Gifty account against worker-only recommendation routes returned 403, which is correct for current role state.

Impact
- Engineers can misdiagnose worker recommendation failures when using stale fixture assumptions.

Fix direction
- Update docs and smoke scripts to use a known worker fixture for worker-only flows.

## What Is Currently Healthy

- Profile activity is no longer relying on the previously broken legacy-only path. user.controller.js now routes through collectAuthoritativeActivityEvents, syncProfileActivitySource, and ActivityEvent.
- The focused matching/activity/worker-directory Jest suites passed locally when run directly with Jest, which indicates the prior open-handle warning came from the watch-mode npm test wrapper rather than these suites themselves.
- Job ranking tests confirm the normalized scoring still preserves separation between strong and elite workers.

## Highest-Leverage Fix Order

1. Repair worker suggestion behavior by either implementing or removing /users/workers/suggest.
2. Move the visible recommendations widget onto the personalized endpoint and fix its CTA route.
3. Normalize one worker discovery query contract and retire the duplicate dialect.
4. Run a data repair pass on worker profession and skill alignment so ranking precision can improve materially.
5. Patch dormant frontend contract drift in jobsService before another consumer ships on top of it.

## Validation Notes

- No services were restarted.
- No redeploys were triggered.
- No code changes were made as part of this audit.