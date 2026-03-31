# Backend Test Implementation Plan - March 31, 2026

## Current baseline
- Auth service test script now executes real Jest suites.
- User service test script now executes real Jest suites.
- Top-level backend `test:services` now runs auth + user service tests end-to-end.

## Goal
Expand backend test reliability from partial service coverage to all core microservices with enforceable CI quality gates.

## Scope for next wave
- job-service
- payment-service
- messaging-service
- review-service
- api-gateway contract and proxy behavior

## Phase 1: Script and baseline activation (1 day)
1. Replace placeholder test scripts in remaining services with executable Jest commands.
2. Ensure each service has a local `jest.config.js` with stable `testEnvironment: node` and service `setup.js`.
3. Add/verify root scripts:
   - `test:services:all`
   - `test:contracts`
   - `test:critical`

## Phase 2: Contract and envelope coverage (2 days)
1. Add route contract tests for each service:
   - success envelope shape: `{ success: true, data, message? }`
   - error envelope shape: `{ success: false, error: { message, code? } }`
2. Validate route ordering for each service (`literal` routes before `/:id`).
3. Add auth trust tests for protected routes using `verifyGatewayRequest` behavior.

## Phase 3: Critical-path integration tests (2-3 days)
1. Job lifecycle path:
   - create job, list/search job, view job details, apply.
2. Payment path:
   - payment intent/transaction list and payout status surfaces.
3. Messaging path:
   - conversation fetch, send message, unread/read-state transitions.
4. Review path:
   - create review and aggregate rating propagation checks.

## Phase 4: Failure-mode and resilience tests (1-2 days)
1. Database unavailable response tests (`503` where applicable).
2. Downstream dependency failure tests (gateway to service timeout behavior).
3. Validation hardening tests for malformed payloads.
4. Role/permission denial paths (`401` and `403`).

## Phase 5: CI hardening and quality gates (1 day)
1. Introduce staged CI gates:
   - PR required: auth + user + route contracts.
   - nightly: full service suite.
2. Add flaky-test retry policy only for network-sensitive suites.
3. Publish machine-readable reports for coverage and test duration trend.

## Immediate task backlog
1. job-service test script activation and baseline test pass.
2. payment-service test script activation and baseline test pass.
3. messaging-service API contract test expansion.
4. review-service route auth and envelope tests.
5. api-gateway proxy contract suite for `/api/*` mappings.

## Exit criteria
- Every backend service has an executable test script (no placeholder scripts).
- Core endpoint contracts covered by tests and validated in CI.
- `npm run test:backend` and `npm run test:critical` pass in CI and locally.
- No critical service path lacks at least one positive and one negative test.
