# Security, Financial Integrity, Frontend, And Matching Hardening March 11 2026

**Status**: COMPLETED  
**Date**: March 11, 2026

## Scope

Fix the concrete security issues S4-S8, financial-integrity issues F1-F4, frontend defects B1-B3, and update the matching audit with code-backed conclusions while implementing the highest-value matching hardening that fits the active controller flow.

## Acceptance Criteria

- JWT auth token generation crashes loudly if secure randomness is unavailable.
- Reset-password routes are brute-force protected.
- Worker profile mutation routes reject non-owners before controller execution.
- Login redirects reject protocol-relative and untrusted cross-origin targets.
- Social login does not trust poisonable runtime/local-storage API base values.
- Escrow refund and milestone release are transactional.
- Wallet uniqueness/upsert behavior is concurrency-safe.
- Token refresh replays failed requests through a queue instead of racing each `401` handler independently.
- Messaging provider does not bootstrap authenticated messaging work until auth is actually present.
- Landing page does not display fabricated per-trade worker counts.
- Matching notes clearly separate already-fixed proximity support from still-open recommendation gaps.

## File Surface

- `kelmah-backend/shared/utils/jwt.js`
- `kelmah-backend/services/auth-service/routes/auth.routes.js`
- `kelmah-backend/services/auth-service/middlewares/rateLimiter.js`
- `kelmah-backend/services/user-service/routes/user.routes.js`
- `kelmah-backend/services/user-service/controllers/worker.controller.js`
- `kelmah-backend/services/user-service/models/Availability.js`
- `kelmah-backend/services/payment-service/controllers/escrow.controller.js`
- `kelmah-backend/services/payment-service/controllers/wallet.controller.js`
- `kelmah-backend/services/payment-service/models/Wallet.js`
- `kelmah-backend/services/job-service/controllers/job.controller.js`
- `kelmah-backend/services/job-service/routes/job.routes.js`
- `kelmah-backend/services/job-service/models/UserPerformance.js`
- `kelmah-backend/shared/models/User.js`
- `kelmah-backend/shared/models/Job.js`
- `kelmah-frontend/src/services/apiClient.js`
- `kelmah-frontend/src/modules/auth/components/login/Login.jsx`
- `kelmah-frontend/src/config/environment.js`
- `kelmah-frontend/src/modules/auth/components/common/ProtectedRoute.jsx`
- `kelmah-frontend/src/modules/auth/hooks/useAuth.js`
- `kelmah-frontend/src/modules/auth/services/authSlice.js`
- `kelmah-frontend/src/modules/auth/services/authService.js`
- `kelmah-frontend/src/modules/messaging/contexts/MessageContext.jsx`
- `kelmah-frontend/src/modules/messaging/pages/MessagingPage.jsx`
- `kelmah-frontend/src/routes/config.jsx`
- `kelmah-frontend/src/pages/HomeLanding.jsx`
- `kelmah-frontend/src/main.jsx`

## End-to-End Notes

### Login / OAuth redirect flow

`Login.jsx` -> `loginAction` or `handleSocialLogin()` -> `authService` / `window.location.assign()` -> `getApiBaseUrl()` in `environment.js` -> gateway `/api/auth/*`.

Risk today: protocol-relative redirects and poisonable API-base inputs.

### Password reset flow

Reset password page -> `/api/auth/reset-password/:token` or `/api/auth/reset-password` -> auth-service router -> validation -> controller.

Risk today: no limiter on reset submission endpoints.

### Worker profile update flow

Worker edit UI -> frontend worker service -> gateway `/api/users/workers/:id` -> `user.routes.js` -> `WorkerController.updateWorkerProfile()` -> `User` / worker profile write.

Risk today: route-level ownership middleware exists but is not mounted.

### Escrow refund / milestone release flow

Gateway payment route -> `escrow.controller.js` -> `Escrow`, `Transaction`, `Wallet` documents.

Risk today: refund and milestone release can partially commit because they do not use MongoDB sessions.

### Frontend token refresh flow

Any API call -> `apiClient` response interceptor -> token refresh -> retry original request.

Risk today: concurrent `401` responses share a refresh promise, but retries are still unmanaged per request and refresh failure can fan out multiple redirect side effects.

### Messaging auth gate flow

`main.jsx` mounts global `MessageProvider` -> `MessageContext.jsx` consumes auth state -> loads conversations / socket if token exists.

Risk today: page-level `/messages` route guard does not prevent provider bootstrap because the provider is above the router content tree.

### Landing page stats flow

`HomeLanding.jsx` currently renders hardcoded trade counts. Public backend stats are available at `/api/jobs/stats`, but those expose overall platform metrics, not category-level worker counts.

## Dry Audit Summary

1. The JWT helper still has an insecure fallback randomness path.
2. Auth reset-password routes need the same defensive rate limiting posture as forgot-password.
3. Route-level ownership is the correct fix for worker profile mutation because the controller already contains a deeper authorization check.
4. Social login target construction must not trust local storage or protocol-relative redirect fragments.
5. Payment integrity issues are real and rooted in missing session usage plus wallet upsert patterns.
6. Messaging auth work must be blocked in the global provider, not only in the route/page shell.
7. The fake landing-page trade counts should be removed unless category-backed API counts are introduced.
8. Matching status is mixed: geo proximity is partially implemented already, but availability/performance/budget-aware ranking remains underused.

## Implementation Log

- Removed the insecure fallback path from `kelmah-backend/shared/utils/jwt.js`, so auth token IDs now come only from secure randomness.
- Added reset-password rate limiting in `kelmah-backend/services/auth-service/routes/auth.routes.js` by applying the existing forgot-password limiter to both reset entry points.
- Mounted route-level ownership enforcement on `kelmah-backend/services/user-service/routes/user.routes.js` for worker profile updates.
- Converted `kelmah-backend/services/payment-service/controllers/escrow.controller.js` refund and milestone-release flows to transaction-backed session logic, including atomic wallet credit plus escrow state updates.
- Converted `kelmah-backend/services/payment-service/controllers/wallet.controller.js#createOrUpdateWallet` to a single upsert path and made `kelmah-backend/services/payment-service/models/Wallet.js` enforce a unique `{ user: 1 }` index.
- Added trusted API-base helpers to `kelmah-frontend/src/config/environment.js` and switched `Login.jsx` social login to the trusted resolver.
- Tightened `Login.jsx` redirect validation to reject protocol-relative `//...` targets.
- Reworked `kelmah-frontend/src/services/apiClient.js` so concurrent `401` responses queue behind one refresh and replay cleanly after refresh success.
- Fixed the actual messaging auth-race root cause in `kelmah-frontend/src/modules/messaging/contexts/MessageContext.jsx` by blocking bootstrap until auth is settled and authenticated.
- Removed fabricated category counts from `kelmah-frontend/src/pages/HomeLanding.jsx`.
- Hardened recommendation scoring in `kelmah-backend/services/job-service/controllers/job.controller.js` to include availability, experience-level fit, historical performance, and active-contract capacity.

## Validation

- VS Code diagnostics reported no errors in all touched backend, frontend, and spec-kit files.
- Backend Jest passed from `kelmah-backend/`:
	- `services/auth-service/tests/shared-jwt.test.js`
	- `services/auth-service/tests/auth.routes.validation.test.js`
	- `services/auth-service/tests/auth.controller.security.test.js`
	- `services/job-service/tests/mobile-recommendations.contract.test.js`
	- Result: 4 suites passed, 28 tests passed, 0 failures.
- Frontend Jest passed from `kelmah-frontend/`:
	- `src/tests/components/auth/Login.test.jsx`
	- Result: 1 suite passed, 2 tests passed, 0 failures.
- Payment and global messaging bootstrap paths do not currently have focused repo tests, so those changes were validated through source audit plus diagnostics.