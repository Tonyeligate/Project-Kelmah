# Kelmah Gateway Public Auth Timeout Fix — March 7, 2026

**Status**: Implemented, live redeploy validation pending  
**Scope**: Eliminate gateway-side 504s on public auth routes after auth-service email delivery was already hardened.

## Success Criteria
- `POST /api/auth/register` no longer times out at the API gateway.
- `POST /api/auth/forgot-password` no longer times out at the API gateway.
- `POST /api/auth/resend-verification-email` no longer times out at the API gateway.
- Public auth routes forward through the gateway without relying on the generic proxy body stream path.

## Dry Audit File Surface
- `kelmah-backend/api-gateway/routes/auth.routes.js`
- `kelmah-backend/api-gateway/proxy/serviceProxy.js`
- `kelmah-backend/services/auth-service/controllers/auth.controller.js`
- `kelmah-backend/services/auth-service/services/email.service.js`
- `spec-kit/KELMAH_NATIVE_AUTH_EXPANSION_MAR07_2026.md`

## Findings
- Direct requests to the auth service responded promptly for:
  - `POST /api/auth/register`
  - `POST /api/auth/forgot-password`
  - `POST /api/auth/resend-verification-email`
- The live gateway still returned `504` for those same routes even while:
  - gateway health was healthy,
  - aggregate auth-service health was healthy,
  - login continued to work.
- This isolated the remaining production blocker to the gateway forwarding layer rather than the auth service itself.
- After gateway recovery routes were fixed, register still returned `phone already exists` even when the request omitted phone.
- That exposed a legacy database-index issue: older deployed auth databases can still carry a unique phone index, and registration previously wrote `phone: null`, which collides under that legacy index.

## Implementation Summary
- Reworked public auth forwarding in [kelmah-backend/api-gateway/routes/auth.routes.js](kelmah-backend/api-gateway/routes/auth.routes.js) so public auth mutations use direct axios forwarding instead of the generic proxy path.
- Added a shared upstream response helper that safely forwards JSON/string bodies and safe headers.
- Expanded direct forwarding to:
  - `/login`
  - `/register`
  - `/forgot-password`
  - `/reset-password`
  - `/verify-email/:token`
  - `/resend-verification-email`
- Kept protected auth routes on the trusted proxy flow.
- Updated auth registration to omit blank phone values instead of persisting `null`.
- Added auth-service startup index reconciliation in [kelmah-backend/services/auth-service/config/db.js](kelmah-backend/services/auth-service/config/db.js) to drop legacy unique phone indexes and recreate the intended sparse non-unique phone index.

## Verification So Far
- Editor diagnostics are clean for [kelmah-backend/api-gateway/routes/auth.routes.js](kelmah-backend/api-gateway/routes/auth.routes.js).
- Direct auth-service calls proved the service-level fix was effective.
- Live gateway revalidation must be repeated after the API gateway redeploy finishes.