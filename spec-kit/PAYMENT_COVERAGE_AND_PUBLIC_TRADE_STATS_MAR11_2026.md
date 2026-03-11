# Payment Coverage And Public Trade Stats March 11 2026

**Status**: IN PROGRESS  
**Date**: March 11, 2026

## Scope

Add focused regression coverage for the recent payment-integrity hardening and expose real landing-page trade counts through a public backend endpoint.

## Acceptance Criteria

- Escrow refund and milestone-release transaction behavior is covered by focused Jest tests.
- Wallet create-or-update upsert behavior is covered by focused Jest tests.
- User-service exposes public trade-card worker counts using real worker data.
- Landing page uses the public endpoint instead of placeholders for trade-card counts.

## File Surface

- `kelmah-backend/services/payment-service/controllers/escrow.controller.js`
- `kelmah-backend/services/payment-service/controllers/wallet.controller.js`
- `kelmah-backend/services/payment-service/tests/setup.js`
- `kelmah-backend/services/payment-service/tests/payment.test.js`
- `kelmah-backend/services/payment-service/tests/escrow.controller.test.js`
- `kelmah-backend/services/payment-service/tests/wallet.controller.test.js`
- `kelmah-backend/services/user-service/routes/user.routes.js`
- `kelmah-backend/services/user-service/controllers/worker.controller.js`
- `kelmah-backend/services/user-service/tests/worker-directory.controller.test.js`
- `kelmah-frontend/src/pages/HomeLanding.jsx`

## Dry Audit Summary

1. Payment-service test coverage is currently too shallow to lock in the recent transaction fixes.
2. The per-trade landing cards now avoid fake numbers, but they still need a backend-backed count source.
3. Worker trade synonym logic already exists in `worker.controller.js`, so that controller can produce category counts without inventing a second mapping layer.

## Implementation Log

- Pending.

## Validation

- Pending.