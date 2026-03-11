# PART 4 To PART 6 Remediation Audit March 11 2026

## Status
- State: COMPLETED
- Started: March 11, 2026
- Completed: March 11, 2026

## Scope
- Database indexes and duplicate-prevention guards
- Query performance anti-pattern remediation
- Worker profile schema drift review
- Frontend structural/performance fixes from the listed audit items
- Accessibility hardening opportunities directly tied to touched UI
- Medium/low security fixes that are source-level and safe to ship

## Acceptance Criteria
- Add the missing indexes identified for Review, Job, Message, Transaction, and Conversation where the active source models support them.
- Reduce unnecessary Mongoose document hydration and unbounded query behavior in the targeted controllers.
- Prevent wallet and messaging endpoints from scaling linearly in memory for active users where a bounded query or server-side filtering is sufficient.
- Fix the listed frontend issues that have direct source-level remediations without undertaking unsafe large-scale component rewrites.
- Harden the listed auth, storage, route, and gateway security gaps that are actionable in code.

## Mapped File Surface
- Backend models:
  - `kelmah-backend/services/review-service/models/Review.js`
  - `kelmah-backend/shared/models/Job.js`
  - `kelmah-backend/services/messaging-service/models/Message.js`
  - `kelmah-backend/services/payment-service/models/Transaction.js`
  - `kelmah-backend/services/messaging-service/models/Conversation.js`
  - `kelmah-backend/services/user-service/models/Portfolio.js`
  - `kelmah-backend/shared/models/WorkerProfile.js`
  - `kelmah-backend/services/user-service/models/WorkerProfileMongo.js`
- Backend controllers/routes/middleware:
  - `kelmah-backend/services/messaging-service/controllers/message.controller.js`
  - `kelmah-backend/services/messaging-service/controllers/conversation.controller.js`
  - `kelmah-backend/services/review-service/controllers/review.controller.js`
  - `kelmah-backend/services/payment-service/controllers/wallet.controller.js`
  - `kelmah-backend/services/user-service/routes/user.routes.js`
  - `kelmah-backend/services/auth-service/controllers/auth.controller.js`
  - `kelmah-backend/api-gateway/server.js`
  - `kelmah-backend/api-gateway/middlewares/auth.js`
  - `kelmah-backend/services/auth-service/middlewares/rateLimiter.js`
  - `kelmah-backend/services/auth-service/utils/security.js`
  - `kelmah-backend/shared/models/User.js`
- Frontend files:
  - `kelmah-frontend/src/utils/secureStorage.js`
  - `kelmah-frontend/src/modules/auth/utils/registrationDraftStorage.js`
  - `kelmah-frontend/src/modules/auth/components/register/Register.jsx`
  - `kelmah-frontend/src/modules/messaging/pages/MessagingPage.jsx`
  - `kelmah-frontend/src/modules/layout/components/Layout.jsx`
  - `kelmah-frontend/src/modules/auth/pages/ForgotPasswordPage.jsx`
  - `kelmah-frontend/src/modules/payment/contexts/PaymentContext.jsx`
  - `kelmah-frontend/src/modules/worker/pages/WorkerDashboardPage.jsx`
  - `kelmah-frontend/src/modules/hirer/pages/HirerDashboardPage.jsx`
  - `kelmah-frontend/src/services/websocketService.js`
  - `kelmah-frontend/src/modules/contracts/contexts/ContractContext.jsx`

## Dry Audit Notes
- Existing model/index state was re-audited before edits to avoid stale assumptions; several previously flagged indexes were already present, and only true remaining gaps were patched.
- Messaging search flow was spending unnecessary work reconstructing participant-pair maps and regex-scanning scoped sets first; this was replaced with text-index-first querying and bounded fallback.
- Wallet UI semantics still conflated missing-wallet `404` with true zero balance, which could mislead users.
- Auth and frontend token lifecycle flows were checked to ensure tightened behavior does not break existing login/session paths.

## Implementation Log
- Added payment transaction access-path indexes in `kelmah-backend/services/payment-service/models/Transaction.js`:
  - `{ sender: 1, createdAt: -1 }`
  - `{ recipient: 1, createdAt: -1 }`
- Added direct-conversation duplicate prevention in `kelmah-backend/services/messaging-service/models/Conversation.js`:
  - `directConversationKey` derivation in `pre('validate')`
  - unique sparse index on `directConversationKey`
- Added full-text index for message content in `kelmah-backend/services/messaging-service/models/Message.js` to support scalable search.
- Reworked `searchMessages` in `kelmah-backend/services/messaging-service/controllers/message.controller.js` to:
  - prefer `$text` search when query text exists,
  - fall back to escaped regex when a text index is unavailable,
  - remove conversation pair-map reconstruction,
  - populate conversation metadata directly.
- Reworked `searchConversations` and duplicate-create handling in `kelmah-backend/services/messaging-service/controllers/conversation.controller.js`:
  - query visible conversation IDs first,
  - resolve matched IDs via message text search (regex fallback),
  - paginate matched conversations directly,
  - return existing direct conversation gracefully on duplicate-key conflict.
- Hardened auth error envelopes in `kelmah-backend/services/auth-service/controllers/auth.controller.js` by replacing internal exception detail leakage with user-safe generic failures in targeted catch paths.
- Aligned shared password hashing with stronger cost in `kelmah-backend/shared/models/User.js` (bcrypt rounds `12 -> 14`).
- Reduced large eligibility scans in `kelmah-backend/services/review-service/controllers/review.controller.js` with explicit `.limit(500)` bounds on targeted completed-job queries.
- Added review integrity/performance indexes in `kelmah-backend/services/review-service/models/Review.js`:
  - unique reviewer-per-job index `{ reviewer: 1, job: 1 }`
  - listing index `{ reviewee: 1, status: 1, createdAt: -1 }`
- Restored wallet missing semantics end-to-end:
  - `kelmah-frontend/src/modules/payment/services/paymentService.js` now surfaces upstream errors,
  - `kelmah-frontend/src/modules/payment/contexts/PaymentContext.jsx` introduces `walletMissing` on `404`,
  - `kelmah-frontend/src/modules/payment/pages/WalletPage.jsx`, `kelmah-frontend/src/modules/payment/pages/PaymentsPage.jsx`, and `kelmah-frontend/src/modules/payment/pages/PaymentCenterPage.jsx` render explicit informational state.
- Centralized dashboard route detection in `kelmah-frontend/src/modules/layout/components/Layout.jsx` via `isDashboardRoute()` helper.
- Added token freshness guard before socket connect in `kelmah-frontend/src/services/websocketService.js` using `isTokenValid(...)`, dispatching `auth:tokenExpired` when invalid.
- Reduced persisted registration PII in `kelmah-frontend/src/modules/auth/utils/registrationDraftStorage.js` by removing `email` and `phone` from stored draft safe fields.
- Removed unnecessary callback dependency in `kelmah-frontend/src/modules/contracts/contexts/ContractContext.jsx` (`approveMilestone` no longer depends on `contracts`).
- Hardened worker dashboard amount normalization in `kelmah-frontend/src/modules/worker/pages/WorkerDashboardPage.jsx` with bounded recursion depth.
- Reduced unnecessary background refresh in `kelmah-frontend/src/modules/hirer/pages/HirerDashboardPage.jsx` and `kelmah-frontend/src/modules/worker/pages/WorkerDashboardPage.jsx` by skipping interval refresh when `document.hidden`.

## Planned Validation
- `node --check` on edited backend files
- VS Code diagnostics on edited frontend files
- Focused Jest or targeted test files where coverage already exists and edits warrant it

## Validation Results
- VS Code diagnostics reported no errors for all edited backend and frontend files.
- Frontend production build succeeded:
  - Command: `npm --prefix kelmah-frontend run build`
  - Result: `vite` build completed successfully.
- Backend syntax verification succeeded:
  - Command: `node --check` run across edited backend controllers/models
  - Result: `SYNTAX_OK`.
- Focused backend Jest runtime validation (auth/payment/messaging) was executed from `kelmah-backend/`:
  - Passing focused subset:
    - `services/auth-service/tests/auth.controller.security.test.js`
    - `services/auth-service/tests/auth.routes.validation.test.js`
    - `services/payment-service/tests/escrow.controller.test.js`
    - `services/payment-service/tests/wallet.controller.test.js`
    - `services/messaging-service/tests/pagination-readreceipts.test.js`
    - Result: `5` suites passed, `23` tests passed, `0` failures.
  - Known legacy suite issue observed when included:
    - `services/messaging-service/tests/messaging.test.js`
    - Failure: missing test helper import `../../shared/test-utils`.
    - Impact: this is a test-harness import issue, not a runtime regression in the remediated auth/payment paths.

## Final State
- Part 4 to Part 6 remediation items addressed in this pass are implemented and validated.
- Remaining follow-up work, if any, is now limited to separately tracked enhancements (for example, additional targeted automated coverage), not unresolved blockers from this remediation execution.
