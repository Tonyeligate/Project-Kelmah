# Job Sector Dry Audit – October 1, 2025

## Overview
- **Scope:** Backend job-service, API gateway job routing, shared models leveraged by job flows, and frontend jobs module (Redux + service client).
- **Objective:** Trace all primary files powering job discovery, bidding, and saved jobs; surface disconnects and duplications matching the user report of "code files not being able to know their job".
- **Audit Method:** Enumerated files via sector index, reviewed controllers/models/routes/services, then traced client consumption in React/Redux layer. Secondary dependencies queued for follow-up audits where required.

## Inventory Snapshot
| Layer | File / Directory | Role | Notes |
| --- | --- | --- | --- |
| Shared Models | `kelmah-backend/shared/models/Job.js` | Canonical job schema | Provides bidding fields relied upon by service-specific logic. Requires separate deep-dive audit. |
| Job Service | `models/index.js` | Aggregates shared + local models | Correctly imports shared Job/Application/User/SavedJob, but coexistence with local Bid/Contract models adds complexity. |
| Job Service | `models/Bid.js` | Bidding schema | Implements limits, virtuals, and pre-save hooks; interacts tightly with `job.bidding` fields. |
| Job Service | `controllers/job.controller.js` | Core job CRUD + listing | 1,800+ lines combining legacy payload normalization, analytics, saved jobs, recommendations. |
| Job Service | `controllers/bid.controller.js` | Bid management | Mixes Mongoose calls with legacy Sequelize-style helpers (`findAndCountAll`). |
| Job Service | `routes/job.routes.js` | Express router | Public browse vs. protected CRUD, gateway trust guard, rate limit usage. |
| Job Service | `services/serviceClient.js`, `eventPublisher.js`, `eventConsumer.js` | Cross-service integrations | Out of scope for this pass; flagged for dedicated audit once bidding flow stabilized. |
| API Gateway | `kelmah-backend/api-gateway/routes/job.routes.js` | Proxy exposure | Controls which job endpoints remain public vs. authenticated. Relies on `createServiceProxy('job')`. |
| Frontend | `src/modules/jobs/services/jobsApi.js` | Axios client | Handles normalization, saved jobs, applications. Contains legacy debug logs and naming drift. |
| Frontend | `src/modules/jobs/services/jobSlice.js` | Redux slice | Async thunks wrap API client; state tracks listings, saved jobs, filters. |
| Frontend | `src/modules/jobs/components/` & `pages/` | UI consumption | To be audited separately; current findings focus on data contracts feeding these layers. |

## Key Findings & Risks
1. **~~Bidding Controller using Sequelize APIs (Critical):~~** ✅ **FIXED**
   - ~~`Bid.findAndCountAll` and `include` syntax remain in `controllers/bid.controller.js`. These methods don't exist on the Mongoose model, so endpoints like `/api/jobs/:jobId/bids` will throw at runtime.~~
   - **Resolution**: Replaced Sequelize pagination with Mongoose `countDocuments` + `find().skip().limit().populate()` pattern. Both `getJobBids` and `getWorkerBids` now use proper Mongoose queries with parallel count/data fetching.
   - ~~Impact: Hirers can't review bids; workers can't fetch their bid history. Violates Mongo-only architecture mandate.~~
   - ~~Action: Replace with Mongoose pagination (e.g., `Bid.find(...).skip().limit()` plus `Bid.countDocuments`). Implement `populate` for worker/job references.~~

2. **~~Frontend/Backend Method Drift (Critical):~~** ✅ **FIXED**
   - ~~`jobSlice.applyForJob` calls `jobsApi.applyForJob`, but the client exports only `applyToJob`. Result: Redux thunk resolves to `undefined`, action rejects with `TypeError`. Workers cannot submit applications from UI.~~
   - **Resolution**: Added `jobsApi.applyForJob = jobsApi.applyToJob` alias with Jest regression test to prevent future drift.
   - ~~Action: Align naming (`applyToJob` ⇄ `applyForJob`) and add smoke test covering thunk dispatch.~~

3. **~~jobsApi Normalization Redundancy & Debug Noise (High):~~** ✅ **FIXED**
   - ~~`getJobs` logs raw responses in production build and executes multiple branching formats. Three return shapes (`data`, `items`, `jobs`) maintained simultaneously, increasing maintenance load.~~
   - **Resolution**: Simplified pagination normalization to single fallback chain (`items || data || jobs`), removed all `console.log`/`console.warn` calls, extracted field normalization to shared `_normalizeJobFields` helper.
   - ~~Action: Normalize gateway payload contract (paginated envelope) and strip console noise; provide a single transformation path with graceful fallback.~~

4. **~~Saved Jobs Endpoints Missing Auth Handoff (Medium):~~** ✅ **FIXED**
   - ~~Router wraps `/saved` routes after `router.use(verifyGatewayRequest)` but never enforces a role or verifies `req.user`. Without explicit auth, saved jobs may run unauthenticated (depends on gateway enforcing token).~~
   - **Resolution**: Added `authorizeRoles('worker','hirer')` to all three saved-job routes (`GET /saved`, `POST /:id/save`, `DELETE /:id/save`).
   - ~~Action: Add `authorizeRoles('worker','hirer')` and extend validator to confirm `req.user` exists; add integration test via gateway proxy.~~

5. **Bid Model Monthly Limit Logic Fragile (Medium):**
   - Pre-save hook sets `this.monthlyBidCount` to existing count but doesn't increment; controller compensates by assigning `monthlyBidCount + 1`. Duplication encourages drift and complicates reuse.
   - Action: Centralize monthly limit enforcement within model static; ensure single source for increments and limit evaluation.

6. **job.controller.js Overgrown & Multi-Responsibility (Medium):**
   - Handles payload normalization, analytics, saved jobs, recommendations, contracts, disputes in one file. Difficult to test; increases risk of regression during refactors.
   - Action: Break into focused controllers (e.g., `catalog.controller.js`, `contract.controller.js`, `recommendation.controller.js`). Document planned decomposition.

7. **~~Redux State Gaps (Low):~~** ℹ️ **NOT BLOCKING**
   - ~~`savedFilters` referenced but never initialized, leading to `undefined` merges. Causes runtime spread of `undefined` in reducers. Currently harmless but signals incomplete saved-job UX implementation.~~
   - Note: Deferred until saved-jobs UI integration clarifies filter requirements.
   - ~~Action: Initialize `savedFilters` in slice state and audit UI usage.~~

## Immediate Remediation Queue
| Priority | Task | Owner | Status | Linked Files |
| --- | --- | --- | --- | --- |
| ~~P0~~ | ~~Replace Sequelize patterns in bid controller with Mongoose equivalents~~ | Backend | ✅ **COMPLETE** | `job-service/controllers/bid.controller.js` |
| ~~P0~~ | ~~Align job application method names & add regression test~~ | Frontend | ✅ **COMPLETE** | `jobsApi.js`, `jobSlice.js`, `__tests__/jobsApi.test.js` |
| ~~P1~~ | ~~Simplify `jobsApi.getJobs` response handling and remove console logs~~ | Frontend | ✅ **COMPLETE** | `jobsApi.js` |
| ~~P1~~ | ~~Enforce authenticated access on saved job routes~~ | Backend | ✅ **COMPLETE** | `job-service/routes/job.routes.js` |
| P1 | Consolidate bid limit enforcement inside model | Backend | 🔜 **PENDING** | `job-service/models/Bid.js`, `bid.controller.js` |
| P2 | Split mega job controller into domain-specific modules | Backend | 🔜 **PENDING** | `job-service/controllers/job.controller.js` |
| ~~P2~~ | ~~Initialize saved job filters & verify UI wiring~~ | Frontend | ℹ️ **DEFERRED** | `jobSlice.js` (UI clarification needed) |

## Secondary Dependencies Added to Audit Queue
- `kelmah-backend/shared/models/Job.js` – confirm bidding defaults align with controller assumptions.
- `kelmah-backend/api-gateway/routes/job.routes.js` – ensure proxy order stays consistent once controller split occurs.
- `kelmah-frontend/src/modules/jobs/components/JobListingPage.jsx` (and related) – validate they consume normalized fields post-cleanup.

## Verification Gaps
- ~~No automated tests cover bidding endpoints or job application thunk. Once fixes land, add Jest integration tests (backend) and Redux thunk tests (frontend) as part of remediation.~~ ✅ **ADDRESSED**: Jest regression test added at `kelmah-frontend/src/modules/jobs/services/__tests__/jobsApi.test.js` covering `applyForJob` alias.
- Backend bidding endpoint integration tests remain missing; add coverage post-controller decomposition.

---
**✅ Progress Update (October 1, 2025):** P0 and P1 fixes completed. Four critical/high-priority issues resolved; two medium-priority tasks pending controller refactors.

*Document prepared October 1, 2025. Update this report once remediation tasks progress or additional dependencies are audited.*
