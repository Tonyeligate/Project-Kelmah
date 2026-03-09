# Matching, Recommendations, Productivity Audit - March 9, 2026

## Status
- State: Completed
- Mode: Read-only audit plus live production verification
- Service restarts: None
- Redeploys triggered: None

## Scope
- Job matching and personalized recommendations
- Worker profile matching and worker search ranking
- Recent activity logic and dashboard productivity surfaces
- Frontend page and service behavior that affects discovery, trust, and conversion
- Database-to-backend contract drift across `User`, `WorkerProfile`, `Job`, `Application`, and `UserPerformance`

## Audit Method
1. Dry-audited the current source in frontend, gateway, backend, and shared models before any live probe.
2. Cross-checked current source with existing spec-kit audits to avoid stale findings.
3. Ran read-only production probes against the Vercel frontend URL and the Render API gateway.
4. Confirmed which historical issues are still live and which appear already hardened in production.

## Mapped File Surface

### Frontend
- `kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx`
- `kelmah-frontend/src/modules/jobs/pages/JobDetailsPage.jsx`
- `kelmah-frontend/src/modules/jobs/services/jobsService.js`
- `kelmah-frontend/src/modules/dashboard/services/dashboardService.js`
- `kelmah-frontend/src/modules/dashboard/hooks/useDashboard.js`
- `kelmah-frontend/src/modules/worker/pages/WorkerDashboardPage.jsx`
- `kelmah-frontend/src/modules/worker/services/workerService.js`
- `kelmah-frontend/src/modules/hirer/components/WorkerSearch.jsx`
- `kelmah-frontend/src/modules/hirer/pages/WorkerSearchPage.jsx`
- `kelmah-frontend/src/modules/hirer/components/RecentActivityFeed.jsx`
- `kelmah-frontend/src/modules/search/components/WorkerDirectoryExperience.jsx`
- `kelmah-frontend/src/modules/search/contexts/SearchContext.jsx`

### Gateway
- `kelmah-backend/api-gateway/server.js`
- `kelmah-backend/api-gateway/routes/job.routes.js`

### Backend
- `kelmah-backend/services/job-service/routes/job.routes.js`
- `kelmah-backend/services/job-service/controllers/job.controller.js`
- `kelmah-backend/services/user-service/routes/user.routes.js`
- `kelmah-backend/services/user-service/controllers/user.controller.js`
- `kelmah-backend/services/user-service/controllers/worker.controller.js`

### Shared Models
- `kelmah-backend/shared/models/User.js`
- `kelmah-backend/shared/models/Job.js`

## End-to-End Flow Notes

### Job recommendations
- Frontend worker surfaces call `jobsService.getPersonalizedJobRecommendations()` or dashboard recommendation helpers.
- Gateway should expose `/api/jobs/recommendations/personalized` and `/api/jobs/recommendations`.
- Job service computes scores directly in `job.controller.js`, but there are multiple scoring paths with different filters and different source documents.

### Worker search and matching
- Frontend has two active implementations: `WorkerDirectoryExperience.jsx` and `WorkerSearch.jsx`.
- Both hit different request dialects and normalize responses differently.
- Backend worker search still roots discovery on `User` while profile signals and other worker-domain data prefer `WorkerProfileMongo`.

### Recent activity
- Frontend dashboard uses `dashboardService.getRecentActivity()`.
- Backend activity is assembled ad hoc in `buildProfileActivity()` from jobs, applications, and legacy `activity.*` fields.
- The current live route is failing with a server error.

## Verified Findings

### Critical

1. Personalized recommendations are still missing in production.
- Severity: Critical
- Code surface: `kelmah-backend/api-gateway/routes/job.routes.js`, `kelmah-backend/services/job-service/routes/job.routes.js`
- Live proof: authenticated `GET /api/jobs/recommendations/personalized?limit=2` returned `404 Endpoint not found`.
- What is wrong: the repo now contains the gateway route, but the deployed gateway is not serving it.
- Why it matters: mobile and any worker-facing personalized recommendation surface are contract-broken in production.
- Fix: deploy the current gateway route set and add a production contract test that fails if `/api/jobs/recommendations/personalized` is absent.

2. Platform dashboard metrics are exposed to any authenticated user.
- Severity: Critical
- Code surface: `kelmah-backend/services/user-service/routes/user.routes.js`
- Live proof: authenticated non-admin hirer call to `GET /api/users/dashboard/metrics` returned `200` with platform-wide metrics.
- What is wrong: `verifyGatewayRequest` is applied, but `authorizeRoles('admin')` is missing from dashboard metrics and analytics routes.
- Why it matters: a regular account can read platform growth and worker/job metrics that should be admin-only.
- Fix: add explicit admin authorization to `/dashboard/metrics` and `/dashboard/analytics`, or split public-safe summary DTOs from admin analytics.

### High

3. Profile activity is broken live and the code path is internally inconsistent.
- Severity: High
- Code surface: `kelmah-backend/services/user-service/controllers/user.controller.js`
- Live proof: authenticated `GET /api/users/profile/activity?limit=3` returned `500`.
- What is wrong: `fetchProfileDocuments()` projects only profile fields, but `buildProfileActivity()` later reads `userDoc.activity.logins` and `workerDoc.activity.recentJobs` even though those paths are not projected and are not defined in the shared `User` model.
- Why it matters: dashboard recent-activity surfaces cannot be trusted, and productivity widgets are currently failing instead of degrading safely.
- Fix: move activity onto a dedicated event stream or materialized activity collection; stop reading undefined legacy activity fields from profile documents.

4. The worker `recent jobs` endpoint is not recent; it proxies recommendation output.
- Severity: High
- Code surface: `kelmah-backend/services/user-service/controllers/worker.controller.js`
- What is wrong: `getRecentJobs()` calls the job-service recommendations endpoint and returns recommendation metadata.
- Why it matters: consumers asking for recency receive scored matches instead of chronological jobs, which corrupts product meaning and user trust.
- Fix: either create a true `recent jobs` endpoint sorted by `createdAt` or rename this endpoint and its consumers to recommendations.

5. Public portfolio and certificate feeds trust caller-supplied `status` filters.
- Severity: High
- Code surface: `kelmah-backend/services/user-service/controllers/worker.controller.js`
- Live proof: anonymous calls to portfolio and certificate endpoints with `status=draft` and `status=pending` both returned `200` with `ownerView: false`.
- What is wrong: public callers can override the default public-only status filter in code.
- Why it matters: even when current sample users returned zero items, the authorization boundary is still wrong and can expose unpublished records as soon as such data exists.
- Fix: ignore arbitrary `status` for public requests and force `published` or `verified` unless the requester is owner/admin.

6. Personalized recommendation code lacks the public-visibility guard used by the standard recommendation path.
- Severity: High
- Code surface: `kelmah-backend/services/job-service/controllers/job.controller.js`
- What is wrong: `getPersonalizedJobRecommendations()` filters on open status and bidding state but does not apply the public visibility predicate used by `getJobRecommendations()`.
- Why it matters: private or invite-only jobs can leak into personalized feeds.
- Fix: apply the same visibility filter in the personalized path, then add regression tests around public, private, and invite-only jobs.

7. Worker discovery is built on the wrong source of truth.
- Severity: High
- Code surface: `kelmah-backend/services/user-service/controllers/worker.controller.js`, `kelmah-backend/services/user-service/models/WorkerProfileMongo.js`, `kelmah-backend/services/user-service/controllers/user.controller.js`
- What is wrong: search ranks on `User`, while profile signals and richer worker fields are derived from `WorkerProfileMongo`.
- Why it matters: matching, recommendations, and worker ranking drift as soon as one document is fresher than the other.
- Fix: centralize search on a single denormalized document or move discovery onto `WorkerProfileMongo` plus a lookup for identity fields.

8. Worker dashboard can declare success when all underlying requests failed.
- Severity: High
- Code surface: `kelmah-frontend/src/modules/worker/pages/WorkerDashboardPage.jsx`
- What is wrong: the page uses `Promise.allSettled()` over Redux thunk dispatches without `unwrap()`, then treats the settled batch as success.
- Why it matters: workers can see a success state, empty widgets, and a false "new worker" banner after backend failures.
- Fix: use `dispatch(thunk()).unwrap()` or inspect returned actions for rejected status before showing success UI.

### Medium

9. Worker search exists in two different frontend implementations with different request contracts.
- Severity: Medium
- Code surface: `kelmah-frontend/src/modules/hirer/pages/WorkerSearchPage.jsx`, `kelmah-frontend/src/modules/search/components/WorkerDirectoryExperience.jsx`, `kelmah-frontend/src/modules/hirer/components/WorkerSearch.jsx`
- What is wrong: one flow sends `keywords`, `city`, `primaryTrade`, `rating`, `maxRate`; the other sends `query`, `location`, `skills`, `sortBy`, `minRating`.
- Why it matters: fixes and ranking improvements will keep landing in only one surface, producing inconsistent discovery behavior.
- Fix: keep one canonical worker-search implementation and delete or retire the other.

10. The public frontend deployment still does not expose backend APIs under `/api/*`.
- Severity: Medium
- Live proof: `GET https://kelmah-frontend-cyan.vercel.app/api/jobs?limit=1` returned `404`.
- What is wrong: the frontend host is not a valid API surface for direct `/api/*` probing.
- Why it matters: operators and testers can misdiagnose platform health by checking the frontend URL for API behavior.
- Fix: either add an explicit frontend rewrite if that behavior is intended, or document the gateway host as the only supported API target.

11. Job details apply redirect bypasses role checks.
- Severity: Medium
- Code surface: `kelmah-frontend/src/modules/jobs/pages/JobDetailsPage.jsx`
- What is wrong: `?apply=true` redirects authenticated users straight to the apply route before the hirer/non-worker safeguards in the primary action handler run.
- Why it matters: entry-point differences create policy drift and confusing UI paths.
- Fix: apply the same role guard before any automatic apply redirect.

12. Worker availability summary on the legacy hirer search surface is logically wrong.
- Severity: Medium
- Code surface: `kelmah-frontend/src/modules/hirer/components/WorkerSearch.jsx`
- What is wrong: the helper checks whether the availability string includes `available`, so `unavailable` is counted as available.
- Why it matters: hirers see false inventory counts and may message the wrong workers first.
- Fix: compare explicit normalized enum values instead of substring matching.

13. WorkerDirectoryExperience duplicates search requests on sort changes.
- Severity: Medium
- Code surface: `kelmah-frontend/src/modules/search/components/WorkerDirectoryExperience.jsx`
- What is wrong: sort changes both update the URL and fire an immediate request, then the location effect fires a second request.
- Why it matters: double requests increase latency, flicker, and backend load.
- Fix: choose a single fetch trigger: URL state or direct action, not both.

14. Search context and search service are stale relative to the current jobs flow.
- Severity: Medium
- Code surface: `kelmah-frontend/src/modules/search/contexts/SearchContext.jsx`, `kelmah-frontend/src/modules/search/services/searchService.js`
- What is wrong: the context expects a paginated shape that the service no longer normalizes consistently.
- Why it matters: any consumer still using this abstraction is a latent regression.
- Fix: remove it if unused or restore a canonical normalized contract at the service boundary.

## Production Behaviors That Look Improved
- Sampled public job list payload no longer exposed `hirer.email`.
- Sampled public worker detail payload no longer exposed `contact.email`, `phone`, or nested `user.email`.
- Public worker availability is still exposed, but detail DTO hardening appears partly deployed.

## Highest-Leverage Fix Set
1. Redeploy the current gateway so `/api/jobs/recommendations/personalized` exists live, then add a contract test against production-like routing.
2. Lock down dashboard analytics routes to admins only.
3. Replace `buildProfileActivity()` with a real activity source instead of profile-document heuristics.
4. Fix public portfolio/certificate status-filter authorization.
5. Unify matching and worker discovery on one source of truth and one scoring pipeline.
6. Collapse the duplicate frontend worker-search implementations into one canonical page and service contract.
7. Fix worker dashboard success-state masking so failed data loads are visible to users.

## Product Strategy Notes
- The biggest productivity gains are not from more heuristics in the UI. They come from making recommendation semantics truthful, ranking data consistent, and activity surfaces reliable.
- Recommendation quality will not stabilize until `User`, `WorkerProfileMongo`, and `UserPerformance` stop competing as parallel ranking sources.
- A platform that claims strong matching but serves fake recency, broken personalized routes, and failing activity feeds loses trust faster than a simpler platform with fewer but reliable signals.

## Verification Commands Used
- Read-only live probes against `https://kelmah-api-gateway-gf3g.onrender.com`
- Read-only live probe against `https://kelmah-frontend-cyan.vercel.app`
- No service restarts, no redeploy triggers, no data mutations
