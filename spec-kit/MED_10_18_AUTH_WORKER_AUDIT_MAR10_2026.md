# MED-10 To MED-18 Auth Worker Search Audit

**Date**: March 10, 2026  
**Status**: COMPLETED

## Scope

Audit and fix the reported medium-severity issues covering verification-token brute-force exposure, revoked-token enforcement, worker search loading-state races, misleading social-login affordances, silent availability filtering, weak worker text relevance, email-template XSS exposure, refresh-token cleanup drift, and worker-skill response normalization.

## Acceptance Criteria

- Verification-token endpoints are rate-limited at both gateway and auth-service layers.
- Revoked access tokens are rejected by the same shared verification path used by gateway/service auth.
- User-controlled names are HTML-escaped before being inserted into transactional email HTML.
- Refresh-token cleanup logic no longer relies on nonexistent raw token fields.
- Worker directory `relevance` sorting includes explicit text-match quality, not just worker quality signals.
- Worker discovery endpoints do not silently force availability filters.
- Worker response shaping preserves pre-existing skill objects.
- Search sort controls are stable during loading.
- Social-login buttons are only shown when a provider is genuinely available.

## File Surface

- Backend gateway
  - `kelmah-backend/api-gateway/routes/auth.routes.js`
  - `kelmah-backend/api-gateway/middlewares/rate-limiter.js`
  - `kelmah-backend/api-gateway/routes/auth.routes.test.js`
- Backend auth-service
  - `kelmah-backend/services/auth-service/routes/auth.routes.js`
  - `kelmah-backend/services/auth-service/middlewares/rateLimiter.js`
  - `kelmah-backend/services/auth-service/controllers/auth.controller.js`
  - `kelmah-backend/services/auth-service/services/email.service.js`
  - `kelmah-backend/services/auth-service/utils/jwt.js`
  - `kelmah-backend/services/auth-service/utils/jwt-secure.js`
  - `kelmah-backend/services/auth-service/models/index.js`
  - `kelmah-backend/services/auth-service/models/RefreshToken.js`
  - `kelmah-backend/services/auth-service/models/RevokedToken.js`
- Shared backend utility
  - `kelmah-backend/shared/utils/jwt.js`
- Backend user-service
  - `kelmah-backend/services/user-service/routes/user.routes.js`
  - `kelmah-backend/services/user-service/controllers/worker.controller.js`
  - `kelmah-backend/services/user-service/tests/worker-directory.controller.test.js`
- Frontend
  - `kelmah-frontend/src/modules/worker/services/workerService.js`
  - `kelmah-frontend/src/modules/search/components/WorkerDirectoryExperience.jsx`
  - `kelmah-frontend/src/modules/search/components/results/WorkerSearchResults.jsx`
  - `kelmah-frontend/src/modules/auth/components/login/Login.jsx`
  - `kelmah-frontend/src/modules/auth/components/register/Register.jsx`
  - `kelmah-frontend/src/modules/auth/services/authService.js`
  - `kelmah-frontend/src/config/environment.js`

## Data Flow

### Verification Email Flow

Frontend verification page → `authService.verifyEmail()` → gateway `/api/auth/verify-email/:token` → auth-service `/api/auth/verify-email/:token` → `authController.verifyEmail()` → `User.findByVerificationToken()` → token issuance via shared JWT utils + refresh-token persistence.

### Access Token Verification Flow

Gateway/service auth middleware → shared JWT verification helpers → decoded user claims → protected route access. The revocation gap exists because the shared helper currently verifies signature, issuer, audience, and expiry but does not consult the auth-service `RevokedToken` store.

### Worker Directory Flow

`WorkerDirectoryExperience.jsx` local state + URL sync → `workerService.buildWorkerSearchQueryParams()` / `queryWorkerDirectory()` → `GET /api/users/workers` → `WorkerController.getAllWorkers()` → `executeWorkerDirectoryQuery()` aggregation → formatted worker payload → frontend normalization and optional client-side sorting → `WorkerSearchResults.jsx` render.

## Confirmed Findings

1. MED-10 is real.
   - Gateway uses `rateLimiters.general` for verification-token GETs.
   - Auth-service route has no limiter at all.

2. MED-11 is real at the shared verifier layer.
   - Local auth-service `utils/jwt.js` checks `RevokedToken`.
   - Shared `shared/utils/jwt.js` does not.
   - `auth.controller.js` signs/verifies refresh-token JWTs through the shared helper.

3. MED-12 is real.
   - `WorkerSearchResults.jsx` allows sort selection while `loading` is true.

4. MED-13 is real.
   - `Register.jsx` uses nonexistent `FEATURES.socialGoogle` and `FEATURES.socialLinkedIn` fields.
   - `Login.jsx` shows hardcoded disabled social buttons labeled as coming soon.

5. MED-14 is real.
   - `searchWorkers()` defaults `availability = 'available'` even when the request omitted it.

6. MED-15 is real.
   - Worker directory text search is only a filter.
   - Relevance sort still prioritizes worker-quality fields without text-match scoring.

7. MED-16 is real.
   - Multiple email templates interpolate `name` directly into HTML fragments.

8. MED-17 appears stale in the specific example, but adjacent token lifecycle cleanup still needs tests.
   - Current `auth.controller.js` parses `tokenId` from composite refresh tokens and deletes by `tokenId`, not `token`.

9. MED-18 is real.
   - `getAllWorkers()` re-wraps `worker.skills` indiscriminately and can create nested `name` objects.

## Implemented Fixes

1. Added `verificationToken` rate-limit presets to both `api-gateway/middlewares/rate-limiter.js` and `services/auth-service/middlewares/rateLimiter.js`, then applied them to `GET /verify-email/:token` in both routing layers.
2. Extended `shared/utils/jwt.js` so shared access-token verification checks the `revoked_tokens` collection by JTI and expiry, and updated live async callsites in gateway, auth-service, messaging-service, and user-service to await the verifier.
3. Escaped user-controlled HTML and attribute values in `services/auth-service/services/email.service.js` before inserting names, button text, and links into transactional email templates.
4. Removed the silent `availability='available'` default in `searchWorkers()`, preserved object-shaped `skills` entries in `getAllWorkers()`, and added canonical text relevance scoring to worker-directory sort logic.
5. Updated the frontend worker directory flow so query-aware relevance sorting is preserved client-side, outgoing sort params use `sortBy`, and sort/map controls are disabled while worker results are loading.
6. Replaced misleading auth social-login affordances with provider-aware rendering in login and register surfaces, backed by explicit social-provider feature/config detection in `src/config/environment.js`.

## Verification

- VS Code diagnostics returned no errors in the touched backend/frontend files.
- Focused backend Jest suites passed:
   - `npx jest --runInBand api-gateway/routes/auth.routes.test.js services/user-service/tests/worker-directory.controller.test.js`
- Focused frontend Jest suites passed:
   - `npx jest --config jest.config.cjs --runInBand src/tests/components/auth/Login.test.jsx src/modules/search/components/results/WorkerSearchResults.test.jsx`
- Live-source audit confirmed MED-17 is stale in current code: refresh-token cleanup already deletes by `tokenId`, so no code change was required for that specific report.

## Final Finding Status

1. MED-10 fixed.
2. MED-11 fixed.
3. MED-12 fixed.
4. MED-13 fixed.
5. MED-14 fixed.
6. MED-15 fixed.
7. MED-16 fixed.
8. MED-17 stale in current source; verified, no duplicate fix applied.
9. MED-18 fixed.