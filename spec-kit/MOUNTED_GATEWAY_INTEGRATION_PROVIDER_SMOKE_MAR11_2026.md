# Mounted Gateway Integration And Provider Smoke Helper March 11 2026

**Status**: COMPLETED  
**Date**: March 11, 2026

## Scope

Add server-level gateway integration coverage for the mounted jobs and payments paths and extend the provider verification helper to support env-aware sandbox health and smoke execution.

## Acceptance Criteria

- `server.js` can be imported in Jest without starting the gateway listener or Mongo bootstrap when test bootstrap is explicitly disabled.
- Integration tests hit the mounted `/api/jobs/search` and `/api/payments/transactions` paths through the actual gateway app instance.
- Provider verification output distinguishes `supportsRefund`, `configured`, `health`, and `smoke` states.
- Smoke checks only run when explicit sandbox input env vars and a safety confirmation flag are present.

## File Surface

- `kelmah-backend/api-gateway/server.js`
- `kelmah-backend/api-gateway/server.integration.test.js`
- `kelmah-backend/services/payment-service/scripts/verify-refund-providers.js`
- `spec-kit/STATUS_LOG.md`

## Data Flow Notes

### Mounted job search integration

HTTP request -> gateway `server.js` mount `/api/jobs` -> mounted `job.routes.js` -> direct axios forwarding to job service.

### Mounted payment transaction integration

HTTP request -> gateway `server.js` mount `/api/payments` -> gateway auth/tier middleware -> mounted `payment.routes.js` -> payment proxy.

### Provider helper smoke flow

Local operator script -> env gating -> provider health call or explicit smoke refund/verification call -> structured capability/health/smoke summary.

## Dry Audit Findings

- `server.js` currently performs `connectDB()` and `startServer()` during module import, which prevents safe mounted-app testing.
- Mounted `/api/payments` behavior adds gateway-level middleware beyond the route module, so module-only tests under-cover the live request chain.
- Provider-specific smoke inputs differ materially by provider: Paystack and Vodafone require existing transaction references, while MTN MoMo and AirtelTigo require explicit return-transfer phone/amount inputs.

## Implementation Completed

- Added a gateway bootstrap guard in `server.js` so Jest can import the mounted Express app when `SKIP_GATEWAY_BOOTSTRAP=true` or `NODE_ENV=test`, without opening the Mongo bootstrap or listener side effects.
- Added `api-gateway/server.integration.test.js` to exercise the mounted gateway app directly for public `GET /api/jobs/search` and authenticated `POST /api/payments/transactions` requests.
- Kept the mounted-server tests on the real `job.routes.js` and `payment.routes.js` request flow while mocking only gateway bootstrap dependencies such as auth, DB bootstrap, proxy construction, and tier-limit middleware.
- Extended `verify-refund-providers.js` to report `configured`, `missingRequiredEnv`, `health`, and `smoke` states per provider.
- Added explicit `--smoke` support gated by `ENABLE_REFUND_SMOKE_CHECKS=true`, with provider-specific sandbox env requirements for Paystack, Vodafone Cash, MTN MoMo, and AirtelTigo.

## Validation

- Gateway and payment Jest validation passed from `kelmah-backend`:
	- `api-gateway/server.integration.test.js`
	- `api-gateway/routes/job.routes.test.js`
	- `api-gateway/routes/payment.routes.test.js`
	- `services/payment-service/tests/transaction.controller.test.js`
	- `services/payment-service/tests/payment.test.js`
	- `services/payment-service/tests/health.test.js`
	- `services/payment-service/tests/escrow.controller.test.js`
	- `services/payment-service/tests/wallet.controller.test.js`
- Result: `8` suites passed, `15` tests passed, `0` failures.
- Provider helper validation passed locally with:
	- `node services/payment-service/scripts/verify-refund-providers.js`
	- `node services/payment-service/scripts/verify-refund-providers.js --health --smoke`
- Local helper output now cleanly distinguishes missing env (`skipped_missing_env`) from missing smoke confirmation (`skipped_confirmation_required`).
- Live sandbox health and smoke calls remain pending provider credentials and explicit smoke inputs.