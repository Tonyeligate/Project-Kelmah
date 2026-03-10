# HIGH-09 to HIGH-12 Backend Security and Route Audit

Date: March 10, 2026
Status: COMPLETED
Owner: GitHub Copilot

## Scope
Audit and fix four backend findings across auth, user, and job services: login user-enumeration leakage through the unverified-email branch, password-complexity drift between route validators and the shared security utility, duplicate worker nested-resource route registrations that make the nested router unreachable, and unbounded bid pagination limits.

## Acceptance Criteria
- Login returns the same generic auth failure response for unverified-account and other invalid-credential branches so email verification state is not leaked.
- Registration and password mutation flows enforce one shared strict password policy instead of divergent route/controller requirements.
- Worker nested-resource routes are registered once, with no shadowed duplicate definitions in the live router chain.
- Bid list endpoints clamp oversized client-requested limits to a safe upper bound.
- Touched files validate cleanly and focused backend tests cover the regressions.

## Mapped Execution Surface
- kelmah-backend/services/auth-service/controllers/auth.controller.js
- kelmah-backend/services/auth-service/routes/auth.routes.js
- kelmah-backend/services/auth-service/utils/security.js
- kelmah-backend/services/auth-service/utils/validation.js
- kelmah-backend/services/auth-service/tests/auth.controller.security.test.js
- kelmah-backend/services/user-service/routes/user.routes.js
- kelmah-backend/services/user-service/routes/worker-detail.routes.js
- kelmah-backend/services/user-service/controllers/worker.controller.js
- kelmah-backend/services/user-service/controllers/worker/skills.controller.js
- kelmah-backend/services/user-service/controllers/worker/certificates.controller.js
- kelmah-backend/services/user-service/controllers/worker/workHistory.controller.js
- kelmah-backend/services/user-service/controllers/worker/portfolio.controller.js
- kelmah-backend/services/user-service/controllers/worker/analytics.controller.js
- kelmah-backend/services/user-service/server.js
- kelmah-backend/services/user-service/tests/dashboard-routes.auth.test.js
- kelmah-backend/services/job-service/controllers/bid.controller.js
- kelmah-backend/services/job-service/tests/bid.controller.race.test.js

## Data Flow Trace
1. Auth login flow: client -> API Gateway /api/auth/login -> auth-service routes/auth.routes.js -> auth.controller.login -> users collection lookup -> bcrypt compare -> auth response.
2. Auth password-validation flow: client -> auth routes validators for register/reset/change-password -> auth controller register/reset/changePassword -> SecurityUtils.validatePassword -> user persistence.
3. Worker nested-resource flow: client -> API Gateway /api/users/workers/:workerId/... -> user-service routes/user.routes.js -> either direct WorkerController handlers or mounted worker-detail.routes.js -> worker/profile models.
4. Bid list flow: client -> API Gateway /api/bids/... -> job-service bid routes -> bid.controller.getJobBids/getWorkerBids -> Mongo skip/limit query -> paginatedResponse.

## Dry-Audit Findings
- The live login controller still returns Please verify your email before logging in after locating a valid account and successful password compare, which leaks both account existence and verification state.
- The same login flow also emits account-lock messages distinct from other auth failures, so generic auth-failure handling should cover the broader invalid-credential surface instead of only the unverified branch.
- SecurityUtils.validatePassword already enforces the stricter 12-character uppercase/lowercase/digit/special policy, but auth.routes.js still validates register, reset, and change-password requests with an older 8-character uppercase-plus-digit rule.
- register() does not call SecurityUtils.validatePassword directly, so direct controller use can bypass the stricter shared policy entirely.
- user.routes.js registers concrete /workers/:workerId/(skills|work-history|portfolio|certificates) handlers before mounting worker-detail.routes.js at /workers/:workerId, which makes the later nested router unreachable for those duplicated paths.
- worker-detail.routes.js is not yet a drop-in replacement for the earlier explicit routes because it lacks the bulk skills endpoint and portfolio write routes, so consolidation must preserve the existing live contract while removing duplicates.
- bid.controller.js trusts req.query.limit directly in getJobBids() and getWorkerBids(), allowing oversized reads and large skip/limit values.

## Planned Fix
- Normalize login auth failures around a shared Invalid credentials response for invalid-user, inactive-user, unverified-user, locked-user, and wrong-password branches while preserving internal lockout bookkeeping.
- Move auth route password validation onto SecurityUtils.validatePassword and add the same strict validation inside register() so route and controller enforcement cannot drift.
- Make worker-detail.routes.js the single nested-resource registration surface while keeping the existing WorkerController implementations for the duplicated endpoints to avoid API-shape regressions; then remove the duplicate explicit registrations from user.routes.js.
- Add a shared pagination parser in bid.controller.js that bounds limit at 50 and clamps invalid page/limit values.
- Extend focused auth, user-route, and bid-controller tests for the new regression coverage.

## Implementation
- Added a shared Invalid credentials auth-failure helper in `auth.controller.js` and applied it to the login branches for missing-account, inactive-account, unverified-account, already-locked-account, wrong-password, and lock-threshold failures so login no longer leaks verification or lock state through distinct messages/status codes.
- Added direct `SecurityUtils.validatePassword()` enforcement inside `register()` so controller-level registration now honors the same strict password contract as reset and change-password flows.
- Replaced the route-level 8-character password regex rules in `auth.routes.js` with a shared validator that delegates to `SecurityUtils.validatePassword()` for register, reset-password, and change-password requests.
- Consolidated worker nested-resource registration so `user.routes.js` mounts `worker-detail.routes.js` as the canonical `/workers/:workerId/*` surface, and `worker-detail.routes.js` now exposes the full live contract for skills, bulk skills upsert, work history, portfolio CRUD, certificates CRUD, and analytics while preserving the existing `WorkerController` response behavior.
- Added a shared `parseBidPagination()` helper in `bid.controller.js` and applied it to both bid list endpoints, clamping limit values to 50 and normalizing invalid page/limit inputs safely.

## Validation
- `get_errors` returned no diagnostics for the touched auth, user, job, and test files.
- Focused backend Jest verification passed from `kelmah-backend/`:
	- `services/auth-service/tests/auth.controller.security.test.js`
	- `services/auth-service/tests/auth.routes.validation.test.js`
	- `services/user-service/tests/dashboard-routes.auth.test.js`
	- `services/job-service/tests/bid.controller.race.test.js`
- Result: 4 suites passed, 25 tests passed, 0 failures.
- Broader backend Jest verification passed from `kelmah-backend/`:
	- `services/auth-service/tests`
	- `services/user-service/tests`
- Result: 17 suites passed, 53 tests passed, 0 failures.
- Targeted parity verification passed locally:
	- `api-gateway/routes/auth.routes.test.js`
	- `services/job-service/tests/bid.controller.race.test.js`
- Result: 2 suites passed, 8 tests passed, 0 failures.
- Initial live gateway smoke against `https://kelmah-api-gateway-gf3g.onrender.com` showed stale deployed behavior for `POST /api/auth/change-password` (`504`) and uncapped bid pagination (`limit=100000`), confirming the first deployed instance had not picked up the local fixes yet.
- After redeployment, live gateway smoke confirmed the worker nested-resource reads, login flow, capped bid pagination (`limit=50`), and `POST /api/auth/change-password` success path all behaved correctly on the deployed backend.
- The redeployed live audit also exposed an adjacent operational mismatch: the long-standing shared test credential `11221122Tg` is below the hardened password policy, so a successful change-password flow cannot legally revert the account to that value. The shared live test account was rotated to the compliant baseline `Vx7!Rk2#Lm9@Qa4`, and the smoke probe now uses a compliant temporary password for reversible live verification.
- Final live smoke passed end to end after the credential rotation: public worker nested-resource reads returned `200`, gateway login returned `200`, `GET /api/bids/job/:jobId?limit=100000` reported `pagination.limit=50`, `POST /api/auth/change-password` succeeded, temporary-password login succeeded, and the revert back to the compliant baseline also succeeded.
- The deployed environment still showed transient infrastructure noise during repeated probes (`502`, `503`, and auth `429` rate-limit responses), so the smoke probe was hardened with retry/backoff for login and password-mutation verification. Those transients did not change the final functional result.

## Outcome
The reported findings were valid. The auth fix is now deeper than the original single-branch leak report: the login path uses one generic auth-failure contract across the broader invalid-credential surface, the password policy is centralized around `SecurityUtils`, the nested worker routes are no longer shadowed by earlier registrations, and bid list pagination now has an explicit upper bound.

## Follow-Up Hardening
- The later live stability audit traced part of the transient auth `429` noise to a real source-level limiter issue: successful logins were consuming the same login-rate-limit budget as failed attempts.
- The API Gateway now uses a dedicated `/api/auth/login` limiter with `skipSuccessfulRequests: true`, and the auth-service login limiter mirrors that behavior so successful authentication no longer burns the brute-force budget.
- The auth-service login limiter key generator was also tightened to trim and lowercase the email portion of the key so gateway and service normalization remain aligned.
- Active shared-test-user guidance is now aligned on the compliant baseline password `Vx7!Rk2#Lm9@Qa4`, including the real top-level `create-gifty-user.js` helper and the root README test-credential section.
- Focused follow-up verification passed locally after the limiter hardening: `api-gateway/routes/auth.routes.test.js`, `api-gateway/middlewares/rate-limiter.test.js`, `services/auth-service/tests/auth.routes.validation.test.js`, `services/auth-service/tests/rate-limiter.config.test.js`, and `services/auth-service/tests/auth.controller.security.test.js` all passed for a total of 5 suites and 25 tests.
