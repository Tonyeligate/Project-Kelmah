# MED Follow-Up Messaging And Frontend Regression Audit

Date: March 10, 2026
Status: COMPLETED
Owner: GitHub Copilot

## Scope
Continue the earlier MED audit by fixing the adjacent messaging trust-header secret drift and by adding focused frontend regression coverage around the recommendation/activity normalization fixes that were source-audited but not yet test-locked.

## Acceptance Criteria
- Messaging gateway trust-header signing uses `SERVICE_TRUST_HMAC_SECRET` or legacy `INTERNAL_API_KEY`, never `JWT_SECRET`.
- Messaging direct axios handlers fail closed when the service-trust secret is missing instead of silently forwarding unsigned trust payloads.
- `RecentActivityFeed` has regression coverage for flat application arrays and keyed application maps.
- `searchService` has regression coverage for array normalization on unexpected payload shapes.

## Mapped Execution Surface
- `kelmah-backend/api-gateway/routes/messaging.routes.js`
- `kelmah-backend/api-gateway/middlewares/auth.js`
- `kelmah-frontend/src/modules/hirer/components/RecentActivityFeed.jsx`
- `kelmah-frontend/src/modules/hirer/components/RecentActivityFeed.test.jsx`
- `kelmah-frontend/src/modules/search/services/searchService.js`
- `kelmah-frontend/src/modules/search/services/searchService.test.js`
- `spec-kit/STATUS_LOG.md`

## Data Flow Trace
1. Messaging REST fallbacks enter the gateway at `/api/messages/*`, where `authenticate` populates `req.user` and direct axios handlers build signed trust headers for the messaging service.
2. Those trust headers are consumed by messaging-service `verifyGatewayRequest`, so signature generation must match the same service-trust secret contract used elsewhere in the gateway.
3. Hirer recent activity derives UI events from jobs plus application payloads inside `RecentActivityFeed.jsx`.
4. Generic search normalization happens inside `searchService.js`, which feeds search UI result lists and suggestion/autocomplete consumers.

## Dry-Audit Findings
1. `messaging.routes.js` still uses `process.env.INTERNAL_API_KEY || process.env.JWT_SECRET` for trust-header HMAC signing.
2. The direct messaging handlers do not explicitly stop when the trust secret is unavailable, even though downstream service-trust verification now treats that as a server misconfiguration.
3. The recent-activity flat-array fix exists in source but has no dedicated regression test.
4. The search-service array-normalization guarantee exists in source but has no dedicated regression test for malformed payload shapes.

## Implementation Completed
- Hardened `kelmah-backend/api-gateway/routes/messaging.routes.js` so direct messaging trust-header signing now uses `SERVICE_TRUST_HMAC_SECRET` or legacy `INTERNAL_API_KEY`, never `JWT_SECRET`.
- Made the direct messaging axios handlers fail closed with an explicit 500 misconfiguration response when the service-trust secret is missing instead of silently forwarding unsigned trust payloads.
- Added `kelmah-backend/api-gateway/routes/messaging.routes.test.js` to lock both the dedicated-secret signing path and the fail-closed misconfiguration path.
- Added focused frontend regression coverage in `kelmah-frontend/src/modules/hirer/components/RecentActivityFeed.test.jsx` for both flat application arrays and keyed application records.
- Extended `kelmah-frontend/src/modules/search/services/searchService.test.js` to lock the array-normalization guarantees for malformed search and popular-terms payloads.
- Removed verification-noise from the new tests by opting the RecentActivityFeed test into the React Router v7 future flags and suppressing route-level console logging in the messaging route test.

## Validation
- `get_errors` returned no diagnostics for the touched backend route, new backend/frontend tests, and follow-up spec-kit records.
- Focused backend Jest verification passed from `kelmah-backend/`:
	- `api-gateway/routes/messaging.routes.test.js`
	- Result: 1 suite passed, 2 tests passed, 0 failures.
- Focused frontend Jest verification passed from `kelmah-frontend/`:
	- `src/modules/hirer/components/RecentActivityFeed.test.jsx`
	- `src/modules/search/services/searchService.test.js`
	- Result: 2 suites passed, 6 tests passed, 0 failures.

## Residual Note
- The isolated backend Jest process still reports the existing workspace-level `Jest did not exit one second after the test run has completed` message. The messaging suite itself passed cleanly, but the broader backend Jest environment still has an unresolved open-handle condition outside this specific fix.

## Outcome
- The adjacent messaging trust-header drift is fixed at the root cause and now matches the stricter service-trust contract used elsewhere in the gateway.
- The earlier MED frontend fixes are no longer source-audited only; they now have focused regression coverage for flat application arrays and search array normalization.