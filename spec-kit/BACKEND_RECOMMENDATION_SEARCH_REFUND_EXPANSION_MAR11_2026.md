# Backend Recommendation Search And Refund Expansion March 11 2026

**Status**: COMPLETED  
**Date**: March 11, 2026

## Scope

Implement the deferred March 11 backend follow-up work for recommendation normalization, advanced search text-score ranking, and provider refund expansion.

## Acceptance Criteria

- Recommendation scores use a normalized 100-point scale with clearer differentiation across high-fit jobs and workers.
- Advanced search uses Mongo `$text` matching and text-score ordering for relevance queries, while preserving category, location, budget, urgency, and date filters.
- Refund transactions validate and persist `relatedTransaction`, retain provider metadata on the transaction document, and support Paystack, Vodafone Cash, MTN MoMo, and AirtelTigo.
- Focused Jest coverage validates score normalization, text-score query construction, and refund routing.

## File Surface

- `kelmah-backend/services/job-service/controllers/job.controller.js`
- `kelmah-backend/services/job-service/tests/job-ranking.contract.test.js`
- `kelmah-backend/services/payment-service/models/Transaction.js`
- `kelmah-backend/services/payment-service/controllers/transaction.controller.js`
- `kelmah-backend/services/payment-service/integrations/paystack.js`
- `kelmah-backend/services/payment-service/integrations/mtn-momo.js`
- `kelmah-backend/services/payment-service/integrations/airteltigo.js`
- `kelmah-backend/services/payment-service/utils/validation.js`
- `kelmah-backend/services/payment-service/tests/transaction.controller.test.js`
- `spec-kit/STATUS_LOG.md`

## Data Flow Notes

### Recommendation scoring

Worker profile -> recommendation endpoints -> `calculateJobMatchScore()` / `calculateWorkerMatchScore()` -> normalized weighted score -> paginated recommendation response.

### Advanced search

Search UI -> gateway `/api/jobs/search` -> `advancedJobSearch()` -> Mongo `$match` with `$text` -> text-score aware sort -> transformed jobs response.

### Refunds

Gateway `/api/transactions` refund request -> `createTransaction()` with `relatedTransaction` -> `processRefund()` -> provider-specific refund or return-transfer call -> wallet reversal updates -> completed refund response.

## Dry Audit Findings

- Recommendation weights currently exceed 100 once availability, performance, and hirer-side trust bonuses are added, so clamping erases meaningful ranking separation at the top of the list.
- The live advanced search path still uses regex-based query expansion even though `Job` already defines a text index suitable for relevance ranking.
- The payment transaction schema does not declare `relatedTransaction` or `gatewayData`, but the controller relies on both during refund handling.
- Refund validation still requires `paymentMethod` for every transaction type and does not require `relatedTransaction` for refunds.
- Paystack has no refund helper in the integration module, and MTN MoMo / AirtelTigo need an explicit return-transfer fallback instead of being permanently unsupported.

## Reviewed Rollout Plan

1. Persist provider metadata deterministically on every initiated payment and withdrawal so refund resolution does not depend on undeclared document fields.
2. Switch advanced search relevance to Mongo text-score ordering only when a search query is present; keep existing structured filters untouched.
3. Normalize recommendation scoring with explicit component weights that total 100 before penalties so ranking remains interpretable.
4. Add focused controller tests for refund routing and search/scoring contracts before broadening any additional recommendation heuristics.

## Implementation Completed

- Reworked `calculateJobMatchScore()` onto an explicit normalized weight map that totals 100 before capacity penalties, preserving differentiation between strong and elite candidates without top-end clamp compression.
- Rebalanced `calculateWorkerMatchScore()` so hirer trust signals are blended into a capped 100-point score instead of being stacked on top of the raw worker-match total.
- Switched `advancedJobSearch()` to use Mongo `$text` matching and text-score ordering for relevance queries, while preserving structured filters and adding stable `_id` tie-breakers across sort modes.
- Exposed job-scoring internals via controller test exports and added `job-ranking.contract.test.js` to cover normalized scoring and text-score query construction.
- Corrected the payment transaction contract by declaring `relatedTransaction`, `gatewayData`, and a referenced `paymentMethod` on `Transaction`, while making refund validation require `relatedTransaction` and no longer require a redundant payment-method input.
- Persisted payment-provider metadata deterministically during payment initiation and withdrawals so later refund resolution can use stored provider names and references instead of undeclared document fields.
- Added Paystack refund support via the provider refund endpoint and added explicit MTN MoMo and AirtelTigo return-transfer refund helpers for providers without a dedicated refund API in this codebase.
- Expanded `processRefund()` to support Paystack, Vodafone Cash, MTN MoMo, and AirtelTigo, including compatibility with legacy stored gateway keys such as `momo` and `airteltigo`.
- Added `transaction.controller.test.js` to validate refund request acceptance, Paystack refund routing, and legacy MTN reference fallback behavior.

## Validation

- Focused backend Jest validation passed from `kelmah-backend`:
	- `services/job-service/tests/job-ranking.contract.test.js`
	- `services/job-service/tests/mobile-recommendations.contract.test.js`
	- `services/payment-service/tests/transaction.controller.test.js`
	- `services/payment-service/tests/wallet.controller.test.js`
	- `services/payment-service/tests/escrow.controller.test.js`
- Adjacent lightweight validation also passed:
	- `services/payment-service/tests/payment.test.js`
	- `services/payment-service/tests/health.test.js`
	- `services/job-service/tests/health.test.js`
- Result: 8 suites passed, 15 tests passed, 0 failures.