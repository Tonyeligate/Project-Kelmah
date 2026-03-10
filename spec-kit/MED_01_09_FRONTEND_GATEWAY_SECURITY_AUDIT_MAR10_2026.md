# MED-01 To MED-09 Frontend Gateway Security Audit March 10 2026

**Date**: March 10, 2026  
**Status**: COMPLETED

## Scope

Deep-audit and fix the reported medium-severity issues across smart recommendations, search normalization, hirer dashboard activity handling, service-trust security, auth route exposure, WorkerProfile metrics, CSRF token validation, and API gateway auth-cache invalidation.

## Acceptance Criteria

- `SmartJobRecommendations` cancels or safely ignores in-flight recommendation requests on unmount and request replacement.
- `searchService.search()` always returns an array for unexpected payload shapes.
- Hirer domain payload normalization preserves nullish-vs-empty semantics and does not rely on broad `||` fallback chains for API payloads.
- `RecentActivityFeed` accepts both keyed application records and flat application arrays.
- Gateway/service HMAC signing uses a dedicated service-trust secret path and never falls back to `JWT_SECRET`.
- Auth service no longer mounts duplicate `/auth` aliases alongside `/api/auth`.
- Worker profile response-rate helpers no longer compute from nonexistent schema fields.
- CSRF validation handles different-length inputs safely without throwing.
- Gateway auth cache is explicitly invalidated after password changes and account deactivation.

## Mapped Execution Surface

- `kelmah-frontend/src/modules/search/components/SmartJobRecommendations.jsx`
- `kelmah-frontend/src/modules/search/services/smartSearchService.js`
- `kelmah-frontend/src/modules/search/services/searchService.js`
- `kelmah-frontend/src/modules/hirer/services/hirerService.js`
- `kelmah-frontend/src/modules/hirer/services/hirerSlice.js`
- `kelmah-frontend/src/modules/hirer/components/RecentActivityFeed.jsx`
- `kelmah-frontend/src/modules/hirer/pages/HirerDashboardPage.jsx`
- `kelmah-backend/shared/middlewares/serviceTrust.js`
- `kelmah-backend/api-gateway/middlewares/auth.js`
- `kelmah-backend/api-gateway/routes/auth.routes.js`
- `kelmah-backend/api-gateway/routes/auth.routes.test.js`
- `kelmah-backend/services/auth-service/server.js`
- `kelmah-backend/services/auth-service/controllers/auth.controller.js`
- `kelmah-backend/services/auth-service/utils/security.js`
- `kelmah-backend/shared/models/WorkerProfile.js`
- `kelmah-backend/services/user-service/models/WorkerProfileMongo.js`
- `spec-kit/MED_01_09_FRONTEND_GATEWAY_SECURITY_AUDIT_MAR10_2026.md`
- `spec-kit/STATUS_LOG.md`

## Data Flow Trace

### Smart recommendations
Worker dashboard/search page -> `SmartJobRecommendations.jsx` -> `smartSearchService.getSmartJobRecommendations()` -> shared frontend API client -> `GET /api/jobs/recommendations` -> gateway -> job service -> response -> component state.

### Generic search
Search UI -> `searchService.search()` -> shared frontend API client -> `GET /api/search` -> gateway -> search/job/user domain surface -> payload normalization -> UI rendering.

### Hirer activity feed
Hirer dashboard -> Redux selectors in `hirerSlice.js` + backend activity fetch in `HirerDashboardPage.jsx` -> `RecentActivityFeed.jsx` derives events from jobs plus application records -> dashboard list rendering.

### Service trust and protected auth mutations
Client protected auth request -> gateway `authenticate` middleware -> signed gateway headers -> gateway auth route direct forward -> auth service `verifyGatewayRequest` -> controller mutation -> response -> gateway response helper.

## Dry-Audit Findings

1. `SmartJobRecommendations.jsx` starts async recommendation fetches without any abort or active-request guard, so resolved promises still call React state setters after unmount or request replacement.
2. `smartSearchService.getSmartJobRecommendations()` does not accept an abort signal yet, so the component cannot actually cancel the underlying request.
3. `searchService.search()` returns `payload?.results || payload || []`, which can leak a plain object when `results` is null or absent.
4. The specific claim that empty arrays are falsy in JavaScript is incorrect, but the audited hirer service/slice surface still uses broad `||` payload fallbacks in a few places; replacing those with nullish semantics is the safer contract and prevents future drift for other explicit falsey values.
5. `RecentActivityFeed.jsx` only derives application events from keyed record objects; a flat application array currently produces no events.
6. `shared/middlewares/serviceTrust.js` and `api-gateway/middlewares/auth.js` both fall back to `JWT_SECRET` for HMAC signing/verification, violating key separation.
7. `services/auth-service/server.js` mounts the same auth router at both `/api/auth` and `/auth`, creating a duplicate surface outside the canonical rate-limited path.
8. Both worker profile schemas implement `getResponseRate()` using `totalMessagesReceived` and `totalMessagesResponded`, but neither field exists in the schema; stored `responseRate` is the valid source of truth.
9. `SecurityUtils.validateCSRFToken()` calls `crypto.timingSafeEqual()` on raw buffers without checking length first, which throws on different-length input.
10. Gateway auth cache state lives in `api-gateway/middlewares/auth.js`, but no mutation route invalidates it after successful password changes or account deactivation.

## Implementation Completed

1. Hardened `SmartJobRecommendations.jsx` with request-scoped `AbortController` handling plus mounted/request guards so stale or unmounted recommendation fetches cannot update component state.
2. Extended `smartSearchService.getSmartJobRecommendations()` to accept an abort signal and forward it to the shared API client.
3. Replaced the broad `payload?.results || payload || []` style search normalization in `searchService.js` with explicit array normalization helpers for generic search, suggestions, and popular terms.
4. Tightened hirer payload handling to use nullish semantics where relevant and to normalize job-application arrays explicitly instead of relying on broad truthy/falsy fallbacks.
5. Updated `RecentActivityFeed.jsx` so it can derive application events from either keyed application-record objects or flat application arrays.
6. Removed `JWT_SECRET` fallback from service-trust HMAC handling and gateway signing. Canonical service-trust secrets now come from `SERVICE_TRUST_HMAC_SECRET` first, with `INTERNAL_API_KEY` as the legacy compatibility path.
7. Removed the duplicate `/auth` mount from auth-service so only the canonical `/api/auth` surface remains.
8. Corrected both WorkerProfile model helpers to use the stored `responseRate` field as the canonical source, with safe fallback logic for legacy counters.
9. Hardened `validateCSRFToken()` to return `false` instead of throwing when token lengths differ.
10. Added explicit gateway cache invalidation after successful password-change and account-deactivation responses, and made gateway auth consult cached canonical user state on authenticated requests so token-version and active-status changes take effect.

## Validation

- `get_errors` returned no diagnostics for all touched frontend files, backend files, tests, and spec-kit records.
- Focused backend regression suite passed from `kelmah-backend/`:
	- `npx jest api-gateway/routes/auth.routes.test.js services/auth-service/tests/security.utils.test.js shared/models/WorkerProfile.test.js --runInBand --watchAll=false`
	- Result: 3 suites passed, 10 tests passed, 0 failures.
- Verified by source audit that auth-service no longer mounts `/auth` in `server.js` and that gateway/service-trust signing no longer falls back to `JWT_SECRET`.

## Current State

- MED-01, MED-02, MED-04, MED-05, MED-06, MED-07, MED-08, and MED-09 were valid and are fixed at the root cause.
- MED-03 was partially overstated in the original wording because JavaScript empty arrays are truthy, but the underlying contract-hardening goal was still valid; the hirer payload surface now uses narrower normalization semantics and explicit array checks.
- Frontend verification in this pass is editor-diagnostics based; no dedicated frontend automated test suite was run for the recommendation/activity fixes in this audit.
