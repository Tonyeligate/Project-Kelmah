# Kelmah Gateway Public Auth Timeout Fix — March 7, 2026

**Status**: Completed (live revalidation passed on active production gateway, March 24, 2026)  
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
- Live revalidation delta (March 23, 2026 UTC):
  - Executed POST probes for `/api/auth/login`, `/api/auth/forgot-password`, `/api/auth/resend-verification-email`, and `/api/auth/register` against known gateway origins (`gf3g`, `qmd7`, `tvqj`, canonical `kelmah-api-gateway`, plus historical `nhxc`, `qlyk`).
  - Executed additional host-resolution probes against current Render env-restore service origins (`auth-service-dw1u`, `user-service-tb8s`, `job-service-1k2m`, `messaging-service-kbis`, `payment-service-fnqn`, `review-service-u7rs`) for `/`, `/health`, and `/api/health` (and `/api/auth/login` on auth).
  - Executed health probes (`/health`, `/api/health`) on gateway/auth host candidates.
  - All tested host/path combinations returned `404 Not Found` in this environment.
  - Conclusion: completion is currently blocked on active Render host resolution/redeploy propagation rather than route-level timeout behavior.

- Live closure revalidation (March 24, 2026 UTC) using confirmed active origin:
  - Gateway: `https://kelmah-api-gateway-pmr9.onrender.com`
  - Auth (from aggregate health): `https://kelmah-auth-service-6ll7.onrender.com`
  - Gateway results:
    - `GET /health` -> `200`
    - `GET /api/health` -> `200`
    - `GET /api/health/aggregate` -> `200`
    - `POST /api/auth/login` -> `401` (non-timeout functional response)
    - `POST /api/auth/forgot-password` -> `200`
    - `POST /api/auth/resend-verification-email` -> `200`
    - `POST /api/auth/register` (no phone) -> `503 EMAIL_DELIVERY_UNAVAILABLE`
  - Direct auth results mirror gateway behavior for the same routes (`401/200/200/503`).
  - Closure interpretation:
    - Timeout objective is met: no `504` timeout responses reproduced on gateway public-auth routes.
    - Remaining `503 EMAIL_DELIVERY_UNAVAILABLE` is upstream email availability, not gateway timeout/proxy behavior.