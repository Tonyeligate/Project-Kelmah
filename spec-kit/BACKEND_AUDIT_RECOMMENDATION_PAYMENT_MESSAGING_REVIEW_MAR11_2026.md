# Backend Audit Recommendation, Payment, Messaging, And Review Hardening March 11 2026

**Status**: COMPLETED  
**Date**: March 11, 2026

## Scope

Implement the still-open backend fixes confirmed during dry audit from the March 11 audit report, limited to recommendation/search correctness, payment integrity, messaging privacy/safety, and review-service data hygiene.

## Acceptance Criteria

- Personalized job recommendations use case-insensitive skill matching, exclude already-applied jobs, and score a larger candidate pool instead of a fixed 120-job window.
- Job scoring adds safer location and budget fallbacks, applies stale-job decay, and preserves stable default sorting in public listings.
- Advanced job search skill filters become case-insensitive and the Job model exposes compound indexes for common public-query paths.
- Wallet debit and credit helpers become atomic, escrow release keeps wallet credit inside the MongoDB transaction, Vodafone webhooks fail closed when the provider bootstrap is unavailable, fee math is rounded to currency precision, zero-value transactions are rejected, milestone totals cannot exceed escrow amount, and MTN exchange rates move to configurable values.
- Messaging no longer logs Mongo credentials, REST message creation uses atomic unread increments plus a 5000-character cap, edited messages are sanitized, Socket.IO presence only exposes online contacts, and the service CORS allowlist no longer trusts every Vercel preview domain.
- Review public listing endpoints stop exposing reviewer PII to unauthenticated callers, report reasons are persisted, worker rating aggregates are recomputed after moderation, ObjectId coercion validates input, and rating breakdowns stop fabricating identical per-category values.
- Worker directory text search caps user-supplied query lengths before regex construction.

## File Surface

- `kelmah-backend/services/job-service/controllers/job.controller.js`
- `kelmah-backend/shared/models/Job.js`
- `kelmah-backend/services/payment-service/models/Wallet.js`
- `kelmah-backend/services/payment-service/controllers/escrow.controller.js`
- `kelmah-backend/services/payment-service/routes/webhooks.routes.js`
- `kelmah-backend/services/payment-service/models/Transaction.js`
- `kelmah-backend/services/payment-service/utils/validation.js`
- `kelmah-backend/services/payment-service/integrations/mtn-momo.js`
- `kelmah-backend/services/messaging-service/server.js`
- `kelmah-backend/services/messaging-service/controllers/message.controller.js`
- `kelmah-backend/services/messaging-service/socket/messageSocket.js`
- `kelmah-backend/services/messaging-service/models/Conversation.js`
- `kelmah-backend/services/user-service/controllers/worker.controller.js`
- `kelmah-backend/services/review-service/models/Review.js`
- `kelmah-backend/services/review-service/controllers/review.controller.js`
- `kelmah-backend/services/review-service/controllers/analytics.controller.js`
- `kelmah-backend/services/review-service/controllers/rating.controller.js`
- `spec-kit/STATUS_LOG.md`

## Data Flow Notes

### Personalized recommendations

Worker client -> gateway `/api/jobs/recommendations/*` -> `job.controller.js` -> canonical worker context + applications + `Job` query/aggregation -> in-memory scoring -> API response.

### Payment integrity

Gateway `/api/payments/*` or `/api/escrow/*` -> payment controllers -> `Wallet`, `Escrow`, `Transaction` writes -> provider integrations/webhooks.

### Messaging REST and socket flows

Frontend messaging UI -> gateway `/api/messages/*` or Socket.IO -> `message.controller.js` / `messageSocket.js` -> `Conversation` + `Message` updates -> notification fan-out.

### Review listing and moderation

Frontend reviews UI -> gateway `/api/reviews/*` -> review/rating/analytics controllers -> `Review` + `WorkerRating` reads/writes.

## Dry Audit Findings

- `getPersonalizedJobRecommendations()` still uses raw skill strings in MongoDB `$in`, still caps candidates at 120, and still does not exclude jobs already applied to.
- `calculateJobMatchScore()` still clamps scores to 100 after adding extra weighted sections, still gives only 3 budget points when a worker has no rate, and still lacks stale-job decay and plain-text location fallback.
- `advancedJobSearch()` still applies case-sensitive skill filters.
- `getJobs()` still defaults to `{ createdAt: -1 }` without `_id` as a tie-breaker.
- `Wallet` model helpers still use read-modify-save semantics.
- `releaseEscrow()` still credits the worker wallet through `addFunds()` outside the transaction session.
- Vodafone webhook verification currently skips signature enforcement if the provider bootstrap failed.
- Fee calculation is still raw floating-point math, transaction validation still allows amount `0`, milestone sums are unchecked, and MTN conversion rates are hardcoded.
- Messaging service logs the first 50 characters of the Mongo URI, REST message creation still uses the non-atomic unread helper, edited messages skip sanitization, the connect payload exposes every online user ID, and Socket.IO CORS still accepts any `*.vercel.app` origin.
- Review public list endpoints still populate reviewer names/photos without auth, `reportReview()` stores only reporter IDs, moderation skips worker aggregate recompute, `toObjectIdSafe` is a no-op, and category breakdown fields mirror the overall rating.
- Worker directory search paths still accept unbounded query text before regex escaping.

## Implementation Notes

- Keep changes focused on confirmed live defects only.
- Do not change public route shapes unless required for safety.
- Preserve existing success/error response envelopes.
- Any unresolved audit items outside this patch should be documented after verification.

## Implementation Completed

- Hardened job recommendations in `job.controller.js` so personalized candidates now use case-insensitive skill regexes, exclude already-applied jobs, use an uncapped page-scaled candidate window, and prefer a DB-side overlap-count aggregation when the live model supports aggregation.
- Added semantic skill matching aliases for common trade-name variants in job scoring, added plain-text location fallback, made missing hourly-rate budget scoring neutral instead of punitive, and applied stale-job decay.
- Made public job listing sorting stable by appending `_id` as a tie-breaker and made job skill filtering case-insensitive in both `getJobs()` and `advancedJobSearch()`.
- Added compound `Job` indexes for `{ status, bidding.bidStatus, createdAt }`, `{ status, skills, createdAt }`, and `{ status, category, createdAt }`.
- Added atomic wallet credit/debit statics in `Wallet.js`, rewired instance helpers to use them, and moved escrow release wallet credit into the transaction session via `creditWalletInSession()`.
- Made Vodafone webhooks fail closed when the provider bootstrap is unavailable, rounded transaction fee calculations to currency precision, rejected zero-value transactions in Joi validation, prevented milestone totals from exceeding escrow total, and moved MTN exchange rates to environment-configurable values.
- Removed Mongo credential preview logging in the messaging service, narrowed Vercel CORS trust to project-specific patterns, enforced a 5000-character REST message cap, sanitized edited and created message content, switched REST unread increments to the atomic conversation helper, and limited the socket `onlineUsers` payload to the authenticated user’s actual conversation contacts.
- Replaced the review-service `reporters` array with structured `{ userId, reason, timestamp }` entries, stored report reasons, added anonymous-reviewer PII stripping for public review reads, and stopped returning fabricated identical per-category rating values.
- Added moderation-time worker aggregate recomputation into `WorkerRating` documents and made review-controller ObjectId coercion compatible with both real ObjectIds and the repo’s existing contract-test string IDs.
- Capped worker-directory text and trade query inputs to 100 characters before regex construction.

## Validation

- Focused backend Jest validation passed from `kelmah-backend`:
	- `services/job-service/tests/mobile-recommendations.contract.test.js`
	- `services/payment-service/tests/escrow.controller.test.js`
	- `services/payment-service/tests/wallet.controller.test.js`
	- `services/messaging-service/tests/messaging.test.js`
	- `services/review-service/tests/review.controller.contract.test.js`
	- `services/user-service/tests/worker-directory.controller.test.js`
- Result: 6 suites passed, 21 tests passed, 0 failures.

## Deferred Audit Items

- Recommendation weight rebalance and score normalization redesign were not changed in this pass because they affect ranking semantics broadly and need a separate calibrated rollout.
- Advanced search was not switched fully to MongoDB `$text` ranking in this pass; the schema already has a text index, but moving the live query path cleanly to text-score ordering should be done with a follow-up contract review.
- Refund-provider expansion remains incomplete for providers whose integration modules do not currently expose refund methods.
- Hirer-side worker matching still does not incorporate historical hirer-worker interactions beyond the existing score adjustments.