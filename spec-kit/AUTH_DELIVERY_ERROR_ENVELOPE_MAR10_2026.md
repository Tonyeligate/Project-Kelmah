# Auth Delivery Error Envelope And Redeploy Verification

Date: March 10, 2026
Status: COMPLETED
Owner: GitHub Copilot

## Scope
Verify the redeployed backend for the previously blocked gateway/auth parity paths and fix the auth-service error-envelope bug that still hid mail-delivery outages behind a generic 503 response body.

## Acceptance Criteria
- Redeployed gateway/auth probes confirm whether OAuth exchange, MFA setup, and change-password now reach auth-service.
- Auth-service preserves safe operational delivery-failure messages for registration and resend flows.
- Focused auth-service tests verify the error-envelope behavior and the existing mail-delivery safeguards together.

## Mapped Execution Surface
- `kelmah-backend/services/auth-service/controllers/auth.controller.js`
- `kelmah-backend/services/auth-service/server.js`
- `kelmah-backend/services/auth-service/utils/errorResponse.js`
- `kelmah-backend/services/auth-service/tests/error-response.test.js`
- `kelmah-backend/services/auth-service/tests/server.error-envelope.test.js`
- `kelmah-backend/services/auth-service/tests/email.service.test.js`
- `kelmah-backend/services/auth-service/tests/auth.controller.security.test.js`
- `spec-kit/STATUS_LOG.md`

## Data Flow Trace
1. `POST /api/auth/register` enters `auth.controller.register()`, which preflights email delivery, creates an unverified user, generates a verification token, attempts email delivery, and then passes any failure to the service error handler.
2. `POST /api/auth/resend-verification-email` follows the same delivery-guard pattern through `auth.controller.resendVerificationEmail()`.
3. `server.js` error middleware is the last response-shaping boundary before the API gateway returns the auth-service error payload to clients.

## Dry-Audit Findings
- After redeploy, the gateway no longer returns the old route-gap failures for OAuth exchange, MFA setup, or change-password.
- Registration still fails remotely, but the live generic 503 body is caused by auth-service response masking rather than by the controller contract.
- The controller already emits a safe, explicit `EMAIL_DELIVERY_UNAVAILABLE` AppError for registration/resend delivery outages.
- The global auth-service error handler was overriding that safe message because it masked all `>=500` responses indiscriminately.

## Implementation Completed
- Added `utils/errorResponse.js` with `buildServiceErrorResponse()` so auth-service error serialization is explicit and testable.
- Updated `server.js` to use the shared error response helper.
- Marked the trusted delivery-unavailable AppErrors and invalid-credential AppErrors as exposable via `expose` / `exposeMessage`.
- Added `tests/error-response.test.js` and aligned `tests/server.error-envelope.test.js` with the shared helper contract.

## Validation
- Live redeploy probe results:
  - `POST /api/auth/login` (`kwame.asante1@kelmah.test / TestUser123!`) -> `200`
  - `GET /api/auth/me` with the worker token -> `200`, `role=worker`
  - `GET /api/jobs/recommendations/personalized?limit=3&page=1` with the worker token -> `200`, `contract=mobile-recommendations-v1`, `recommendationSource=worker-profile`
  - `GET /api/auth/google` -> `501`
  - `POST /api/auth/oauth/exchange` with invalid code -> `400`
  - `POST /api/auth/mfa/setup` -> `200`
  - `POST /api/auth/change-password` -> `200`
  - `POST /api/auth/register` with fresh email -> `503` generic body before this fix is redeployed
- Focused auth-service regression tests passed:
  - `tests/error-response.test.js`
  - `tests/server.error-envelope.test.js`
  - `tests/email.service.test.js`
  - `tests/auth.controller.security.test.js`
  - Result: 4 suites passed, 19 tests passed.

## Outcome
- The gateway redeploy resolved the old auth-forwarding breakage.
- The remaining live registration failure is still the transactional mail dependency, but the code now preserves the correct user-facing failure contract once redeployed.