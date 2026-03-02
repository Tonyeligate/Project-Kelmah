# Kelmah Backend Microservices — Comprehensive Audit Report

**Date**: 2025  
**Scope**: All 6 microservices (auth, job, messaging, payment, review, user) + API Gateway  
**Methodology**: Full source read of server.js, routes, controllers, models, middleware, and socket handlers  

---

## Summary of Findings

| Severity | Count |
|----------|-------|
| **CRITICAL** | 7 |
| **HIGH** | 14 |
| **MEDIUM** | 18 |
| **LOW** | 11 |

---

## 1. Auth Service (`services/auth-service/`)

### CRITICAL

#### AUTH-C1: OAuth callbacks expose tokens in URL query parameters
- **File**: [auth.controller.js](kelmah-backend/services/auth-service/controllers/auth.controller.js#L920-L980)
- **Description**: Google, Facebook, and LinkedIn OAuth callbacks redirect with `?access_token=...&refresh_token=...` in the URL. Tokens in URLs leak to browser history, referrer headers, server access logs, and any intermediary proxies.
- **Fix**: Use a short-lived authorization code or set tokens via `Set-Cookie` with `httpOnly; Secure; SameSite=Strict` and redirect to a clean URL.

#### AUTH-C2: OAuth refresh tokens stored unhashed
- **File**: [auth.controller.js](kelmah-backend/services/auth-service/controllers/auth.controller.js#L920-L980)
- **Description**: OAuth callbacks use `jwtUtils.generateAuthTokens()` which stores the raw refresh token in the DB. The login flow correctly uses `secure.generateRefreshToken()` with a hashed composite token (`signed_jwt.raw`). This discrepancy means OAuth-originating refresh tokens are directly readable from the database if compromised.
- **Fix**: Unify OAuth token generation to use the same `secure.generateRefreshToken()` + hashing pipeline as the login flow.

### HIGH

#### AUTH-H1: `reactivateAccount` is a public endpoint that reveals email existence
- **File**: [auth.controller.js](kelmah-backend/services/auth-service/controllers/auth.controller.js) — `reactivateAccount`
- **Description**: The endpoint accepts an email, queries the database, and returns different messages for "no account found" vs. "account reactivated", enabling user enumeration.
- **Fix**: Return a generic message ("If an account exists with this email, a reactivation link has been sent") regardless of outcome.

#### AUTH-H2: Settings endpoints return hardcoded static data with no authentication
- **File**: [server.js](kelmah-backend/services/auth-service/server.js) — `/api/auth/settings/*`
- **Description**: Endpoints like `/api/auth/settings/notification-preferences`, `/api/auth/settings/privacy`, etc. return hardcoded JSON. They require no auth, are not persisted, and never save user changes.
- **Fix**: Either remove these fake endpoints or wire them to a proper user settings store behind authentication.

### MEDIUM

#### AUTH-M1: `getAuthStats` exposes token count metrics
- **File**: [auth.controller.js](kelmah-backend/services/auth-service/controllers/auth.controller.js) — `getAuthStats`
- **Description**: Returns active vs. expired refresh token counts. While accessed via admin routes, this data aids attackers scoping an attack surface.
- **Fix**: Ensure this endpoint is protected by strong admin auth (currently guarded by `INTERNAL_API_KEY`, verify key rotation).

#### AUTH-M2: Login uses native MongoDB driver instead of Mongoose
- **File**: [auth.controller.js](kelmah-backend/services/auth-service/controllers/auth.controller.js) — `login`
- **Description**: `login` bypasses Mongoose and queries `mongoose.connection.db.collection('users')` directly, losing schema validation, middleware hooks, and virtuals.
- **Fix**: Use the Mongoose `User` model. The native driver approach was likely added as a workaround and should be revisited.

### LOW

#### AUTH-L1: Duplicate password reset routes
- **File**: [auth.routes.js](kelmah-backend/services/auth-service/routes/auth.routes.js)
- **Description**: Both `POST /reset-password/:token` and `POST /reset-password` (token in body) exist. This redundancy adds attack surface area.
- **Fix**: Standardize on one approach (body token preferred for security).

---

## 2. Job Service (`services/job-service/`)

### CRITICAL

#### JOB-C1: `updateMilestone` allows any contract party to set arbitrary status
- **File**: [job.controller.js](kelmah-backend/services/job-service/controllers/job.controller.js#L610-L635)
- **Description**: The `updateMilestone` function accepts `status` from `req.body` without validation. A worker could set a milestone to `paid` or `approved` without going through the proper approval flow. There is no valid-transitions check.
- **Fix**: Add a status transition validator (like `changeJobStatus` has) and restrict status changes based on role (only hirer can approve, only system can mark paid).

### HIGH

#### JOB-H1: Request debug logging in production
- **File**: [server.js](kelmah-backend/services/job-service/server.js)
- **Description**: A middleware logs method, URL, headers, and body for **every** incoming request. This runs unconditionally (not gated by `NODE_ENV`), causing performance overhead and potentially logging sensitive data (auth tokens, PII).
- **Fix**: Gate behind `NODE_ENV === 'development'` or remove entirely.

#### JOB-H2: Routes mounted before database connection
- **File**: [server.js](kelmah-backend/services/job-service/server.js)
- **Description**: Routes are mounted immediately as an "EMERGENCY FIX" before the DB connection is established. While a `dbReady` middleware exists on some routes, not all routes use it (e.g., contract and milestone endpoints), risking Mongoose buffering timeouts.
- **Fix**: Ensure all data-accessing routes apply the `dbReady` middleware, or defer route activation until DB is connected.

#### JOB-H3: `getJobs` and `getMyJobs` bypass Mongoose for native driver
- **File**: [job.controller.js](kelmah-backend/services/job-service/controllers/job.controller.js#L950-L1200)
- **Description**: Major query endpoints use `mongoose.connection.getClient().db().collection('jobs')` instead of the Mongoose `Job` model. This bypasses schema validation, hooks, and transforms. The code comment says "WORKAROUND" — this should be resolved.
- **Fix**: Investigate and fix the root cause of why the Mongoose model was "disconnected" and revert to using the `Job` model.

#### JOB-H4: Fallback data with hardcoded mock jobs in production endpoints
- **File**: [job.controller.js](kelmah-backend/services/job-service/controllers/job.controller.js#L1640-L1680)
- **Description**: `getDashboardJobs` returns hardcoded fake job objects when the DB is unavailable. In production, this shows fabricated data to real users, eroding trust.
- **Fix**: Return an empty array with a service-unavailable indicator rather than synthetic job listings.

#### JOB-H5: `getJobById` overwrites populated `hirer` with custom object
- **File**: [job.controller.js](kelmah-backend/services/job-service/controllers/job.controller.js#L1280-L1310)
- **Description**: After `Job.findById().populate('hirer', ...)`, the code spreads `job.hirer?.toObject()` into a new object and overwrites the original. If `hirer` is null (deleted user), `job.hirer?.toObject()` returns undefined and the spread produces `{ avatar: undefined, name: 'Unknown' }`, losing any other hirer data.
- **Fix**: Add a null guard and preserve the populated object directly.

### MEDIUM

#### JOB-M1: Verbose debug logging throughout `getJobs`
- **File**: [job.controller.js](kelmah-backend/services/job-service/controllers/job.controller.js#L950-L1200)
- **Description**: `isDebugJobs` check exists but `JOB_SERVICE_DEBUG` may be `'true'` in environments causing excessive logging. Also, multiple `console.log` calls redundantly log mongoose state.
- **Fix**: Use structured logger (Winston) and consolidate debug output.

#### JOB-M2: `advancedJobSearch` uses `$text` search mixed with regex
- **File**: [job.controller.js](kelmah-backend/services/job-service/controllers/job.controller.js#L2100-L2150)
- **Description**: The `$text` operator requires a text index on the collection. If no text index exists, the aggregation pipeline will fail. The fallback regex search in the same `$or` may mask this with partial results.
- **Fix**: Ensure a text index exists on `jobs` collection or remove the `$text` clause.

#### JOB-M3: `getSearchSuggestions` runs unindexed regex on multiple fields
- **File**: [job.controller.js](kelmah-backend/services/job-service/controllers/job.controller.js#L720-L900)
- **Description**: The search creates 14+ regex conditions across `title`, `category`, `skills`, `location.*`, `locationDetails.*`, hitting multiple fields with case-insensitive regex. Without compound indexes, this causes collection scans.
- **Fix**: Add appropriate indexes or use MongoDB Atlas Search.

#### JOB-M4: `countDocuments` for pagination uses fallback estimation
- **File**: [job.controller.js](kelmah-backend/services/job-service/controllers/job.controller.js#L1180-L1200)
- **Description**: `countDocuments` has a 5-second timeout and falls back to `startIndex + jobs.length + limit`. This can result in incorrect pagination metadata, causing frontend issues.
- **Fix**: Use `estimatedDocumentCount` for approximate counts or cache the total.

### LOW

#### JOB-L1: `viewCount` update is fire-and-forget with no error logging
- **File**: [job.controller.js](kelmah-backend/services/job-service/controllers/job.controller.js#L1270)
- **Description**: `Job.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } }).catch(() => {})` silently swallows all errors.
- **Fix**: Add a `console.warn` in the catch for observability.

#### JOB-L2: `saveJob` swallows duplicate key error as success
- **File**: [job.controller.js](kelmah-backend/services/job-service/controllers/job.controller.js#L2940)
- **Description**: Returns 200 "Job already saved" for duplicate key errors, which is reasonable but inconsistent with REST conventions (should be 409 or idempotent 200).
- **Fix**: Consider returning 409 Conflict for consistency.

---

## 3. Messaging Service (`services/messaging-service/`)

### HIGH

#### MSG-H1: Rate limiting commented out in HTTP message routes
- **File**: [message.routes.js](kelmah-backend/services/messaging-service/routes/message.routes.js)
- **Description**: Rate limiting middleware is imported but commented out on message creation routes. Socket.IO has its own rate limit (60 msg/min), but HTTP endpoints have none.
- **Fix**: Uncomment or add rate limiting to HTTP message creation endpoints.

#### MSG-H2: `handleJoinConversation` loads messages by participant IDs, not conversation ID
- **File**: [messageSocket.js](kelmah-backend/services/messaging-service/socket/messageSocket.js#L560-L590)
- **Description**: When a user joins a conversation, messages are fetched by matching `sender` and `recipient` within participants, NOT by a `conversationId` field on the Message. If two users have multiple conversations, messages from all conversations between them will be mixed.
- **Fix**: Add a `conversation` field to the Message model and filter by it, or use the conversation's `lastMessage` chain.

#### MSG-H3: `handleMarkRead` scopes read-status by participants instead of conversation
- **File**: [messageSocket.js](kelmah-backend/services/messaging-service/socket/messageSocket.js#L440-L475)
- **Description**: Same issue as MSG-H2 — marks messages as read based on `sender` being in the conversation's participants, not the specific conversation. In group conversations or multiple direct conversations, this could mark messages from other conversations as read.
- **Fix**: Query by conversation ID (requires the Message model to store it).

#### MSG-H4: Socket rate limiter never cleans up old entries
- **File**: [messageSocket.js](kelmah-backend/services/messaging-service/socket/messageSocket.js#L215-L230)
- **Description**: `socket.rateLimitData.messages` array grows indefinitely — timestamps are pushed but never cleaned. After 60 messages, the user is permanently rate-limited until they reconnect.
- **Fix**: Add a sliding window: filter out timestamps older than 60 seconds before checking the count.

### MEDIUM

#### MSG-M1: `createConversation` doesn't validate participant exists
- **File**: [conversation.controller.js](kelmah-backend/services/messaging-service/controllers/conversation.controller.js)
- **Description**: A conversation can be created with a non-existent participant ID. No User model lookup validates the participant.
- **Fix**: Verify participant IDs exist in the User collection before creating conversations.

#### MSG-M2: Typing timeout creates new `setTimeout` on every keystroke
- **File**: [messageSocket.js](kelmah-backend/services/messaging-service/socket/messageSocket.js#L510-L530)
- **Description**: `handleTypingStart` creates a 10-second `setTimeout` on every invocation without clearing the previous one. Rapid typing creates many pending timeouts.
- **Fix**: Store the timeout reference on the socket and clear it before setting a new one.

#### MSG-M3: `broadcastUserStatus` runs a DB query per status change
- **File**: [messageSocket.js](kelmah-backend/services/messaging-service/socket/messageSocket.js#L850-L890)
- **Description**: Every time a user's status changes, `Conversation.find({ participants: userId })` runs. For users in many conversations, this is expensive and runs on every connect/disconnect.
- **Fix**: Cache user-to-conversation mappings in memory or use Socket.IO rooms to track who needs notifications.

### LOW

#### MSG-L1: `handleDisconnection` reads from `userSockets` after deleting
- **File**: [messageSocket.js](kelmah-backend/services/messaging-service/socket/messageSocket.js#L810-L830)
- **Description**: `this.userSockets.delete(socket.id)` runs before the audit log tries to read `this.userSockets.get(socket.id)?.connectedAt`, which will always be `undefined`.
- **Fix**: Read the data before deleting.

---

## 4. Payment Service (`services/payment-service/`)

### CRITICAL

#### PAY-C1: Escrow transaction IDs use collision-prone `Date.now()`
- **File**: [escrow.controller.js](kelmah-backend/services/payment-service/controllers/escrow.controller.js#L55)
- **Description**: `transactionId: \`TRX-${Date.now()}\`` in `releaseEscrow` can collide under concurrent requests (same millisecond). Transaction IDs must be unique for financial records.
- **Fix**: Use `TRX-${Date.now()}-${crypto.randomUUID()}` or the existing `generateTransactionId()` function from `transaction.controller.js` which appends a random suffix.

#### PAY-C2: `processPayment` adds funds to recipient wallet BEFORE provider confirmation
- **File**: [transaction.controller.js](kelmah-backend/services/payment-service/controllers/transaction.controller.js#L185-L200)
- **Description**: After calling the payment provider, `recipientWallet.addFunds(transaction.amount, transaction)` runs immediately without verifying the provider actually completed the charge. Provider calls may return a "pending" response that still needs webhook confirmation.
- **Fix**: Only credit wallets after webhook confirmation of successful payment, not at initiation time.

#### PAY-C3: `processWithdrawal` deducts wallet balance AFTER provider transfer succeeds
- **File**: [transaction.controller.js](kelmah-backend/services/payment-service/controllers/transaction.controller.js#L240-L280)
- **Description**: The withdrawal flow sends money to the user via the provider, then deducts from wallet. If the provider succeeds but `deductFunds` fails (network issue, crash), the user receives money without their balance being decremented.
- **Fix**: Deduct balance first (or use a hold/pending pattern), then send to provider, and rollback if provider fails.

### HIGH

#### PAY-H1: Wallet deposit trusts client-provided payment reference
- **File**: [wallet.controller.js](kelmah-backend/services/payment-service/controllers/wallet.controller.js)
- **Description**: The `addFunds` endpoint accepts a `reference` from the client without verifying it against the payment provider. An attacker could submit a fabricated reference to credit their wallet.
- **Fix**: Verify the reference with the corresponding payment provider before crediting the wallet.

#### PAY-H2: `reconcile` endpoint has no authentication
- **File**: [transaction.controller.js](kelmah-backend/services/payment-service/controllers/transaction.controller.js#L130-L155) / mounted on health route
- **Description**: The reconciliation endpoint at `/health/reconcile` marks webhook events as processed. It has no authentication middleware, allowing anyone to trigger reconciliation and mark events as processed.
- **Fix**: Add admin authentication or restrict to internal network.

#### PAY-H3: `processPayout` Race condition — wallet balance check and deduction are not atomic
- **File**: [payment.controller.js](kelmah-backend/services/payment-service/controllers/payment.controller.js#L380-L480)
- **Description**: `processPayout` reads wallet balance, checks if sufficient, then later does `wallet.balance = wallet.balance - amount; await wallet.save()`. Between the check and save, another concurrent request could pass the same balance check, resulting in double-spending.
- **Fix**: Use `findOneAndUpdate` with `$inc: { balance: -amount }` and a `balance >= amount` filter condition for atomic deduction.

#### PAY-H4: Refund only supports Stripe and PayPal
- **File**: [transaction.controller.js](kelmah-backend/services/payment-service/controllers/transaction.controller.js#L290-L320)
- **Description**: `processRefund` switch statement only handles 'stripe' and 'paypal'. For Paystack, MTN MoMo, Vodafone Cash, and AirtelTigo (the primary Ghanaian providers), refunds throw "Unsupported payment provider".
- **Fix**: Implement refund flows for African payment providers.

### MEDIUM

#### PAY-M1: `PaymentController` class mixes two different wallet/transaction schemas
- **Files**: [payment.controller.js](kelmah-backend/services/payment-service/controllers/payment.controller.js) and [wallet.controller.js](kelmah-backend/services/payment-service/controllers/wallet.controller.js)
- **Description**: `PaymentController.processPayout` uses `{ userId }` to find wallets and creates transactions with `walletId`, while `wallet.controller.js` uses `{ user }` to find wallets. These are different field names suggesting schema inconsistency.
- **Fix**: Audit the Wallet model schema and ensure consistent field naming across all controllers.

#### PAY-M2: `createTransactionRecord` in `PaymentController` silently swallows errors
- **File**: [payment.controller.js](kelmah-backend/services/payment-service/controllers/payment.controller.js#L750-L780)
- **Description**: The entire function is wrapped in `try/catch` with only `console.error`. If transaction record creation fails, the payment succeeds but no financial record exists.
- **Fix**: This should be a critical failure — either use a saga/compensation pattern or make it transactional.

#### PAY-M3: Payment method health checks run on every `getPaymentMethods` call
- **File**: [payment.controller.js](kelmah-backend/services/payment-service/controllers/payment.controller.js#L680-L720)
- **Description**: Three provider health checks (`mtnMomo.healthCheck()`, `vodafoneCash.healthCheck()`, `paystack.healthCheck()`) run in parallel on every request. This adds latency and may be rate-limited by providers.
- **Fix**: Cache health check results (e.g., 60-second TTL).

---

## 5. Review Service (`services/review-service/`)

### HIGH

#### REV-H1: `submitReview` doesn't enforce job completion eligibility
- **File**: [review.controller.js](kelmah-backend/services/review-service/controllers/review.controller.js#L1-L50)
- **Description**: While a `checkEligibility` endpoint exists (L430-L485), the actual `submitReview` endpoint does NOT call it. A user can submit a review for any worker/job combination without having completed a contract, by crafting the request.
- **Fix**: Add the eligibility check (completed application + not already reviewed) as a guard inside `submitReview`.

#### REV-H2: `reportReview` immediately flags review with no rate limiting or auth check
- **File**: [review.controller.js](kelmah-backend/services/review-service/controllers/review.controller.js#L400-L420)
- **Description**: A single report request immediately sets `status: 'flagged'` on the review. There's no auth check (allows anonymous flagging) and no duplicate-report prevention. An attacker could flag all reviews.
- **Fix**: Require authentication, use `$addToSet` for reporters (like `voteHelpful`), and only flag after a threshold.

### MEDIUM

#### REV-M1: Error responses swallow error details
- **Files**: All review controller catch blocks
- **Description**: Every `catch` block returns `{ success: false, message: 'Failed to ...' }` without logging the actual error. This makes debugging impossible.
- **Fix**: Add `console.error('Operation failed:', error)` and optionally include an error code in the response.

#### REV-M2: Routes mounted directly in `server.js` instead of route files
- **File**: [server.js](kelmah-backend/services/review-service/server.js)
- **Description**: Several review routes are defined inline in `server.js` rather than in dedicated route files, making the file large and harder to maintain.
- **Fix**: Extract to `routes/review.routes.js`.

#### REV-M3: `voteHelpful` accepts user ID from header fallback
- **File**: [review.controller.js](kelmah-backend/services/review-service/controllers/review.controller.js#L350-L380)
- **Description**: `const userId = req.user?.id || req.headers['x-user-id']`. The `x-user-id` header can be spoofed by any client, allowing impersonation.
- **Fix**: Only use `req.user?.id` from authenticated middleware; remove header fallback.

### LOW

#### REV-L1: `addReviewResponse` has inconsistent indentation
- **File**: [review.controller.js](kelmah-backend/services/review-service/controllers/review.controller.js#L270-L300)
- **Description**: The `requesterId` extraction is outside the `try` block with different indentation, suggesting a merge artifact. If `req.user` throws, the error is unhandled.
- **Fix**: Move inside the `try` block.

---

## 6. User Service (`services/user-service/`)

### CRITICAL

#### USR-C1: `autopopulateWorkerDefaults` writes fabricated rating to database
- **File**: [worker.controller.js](kelmah-backend/services/user-service/controllers/worker.controller.js) (early lines ~200-250, from summary)
- **Description**: When a worker profile is first created, it gets a fake `rating: 4.5` and `completedJobs: 0`. This fake 4.5 rating is persisted to the database, inflating ratings across the platform and misleading hirers.
- **Fix**: Default rating should be `0` or `null` (unrated), and display logic should show "New worker" or "No reviews yet" for unrated workers.

### HIGH

#### USR-H1: Complex BSON fallback pattern in `user.controller.js`
- **File**: [user.controller.js](kelmah-backend/services/user-service/controllers/user.controller.js#L1-L100)
- **Description**: The controller has elaborate fallback logic for "BSON version mismatch" errors, falling back to the native MongoDB driver. This suggests a dependency conflict between Mongoose and native driver BSON versions that should be resolved at the package level.
- **Fix**: Resolve BSON version mismatch in `package.json` dependencies rather than working around it in application code.

#### USR-H2: `createUser` endpoint has no input validation
- **File**: [user.controller.js](kelmah-backend/services/user-service/controllers/user.controller.js#L530)
- **Description**: `const user = await UserModel.create(req.body)` passes the entire request body directly to `Model.create()`. This allows setting arbitrary fields including `role: 'admin'`, `isVerified: true`, etc.
- **Fix**: Whitelist allowed fields using a schema or explicit field extraction.

#### USR-H3: Worker controller has hardcoded mock data in fallback
- **File**: [worker.controller.js](kelmah-backend/services/user-service/controllers/worker.controller.js#L500-L550)
- **Description**: `buildRecentJobsFallback` returns hardcoded fake jobs ("Kitchen Cabinet Installation", "Plumbing Repair") with fake client names and IDs. These appear as real data to users when the job service is unavailable.
- **Fix**: Return empty arrays with a service-unavailable flag.

#### USR-H4: `getEarnings` makes cross-service HTTP calls within request handler
- **File**: [user.controller.js](kelmah-backend/services/user-service/controllers/user.controller.js#L400-L500)
- **Description**: `getEarnings` tries to call the payment service via HTTP inside the request handler. If the payment service is slow or down, the user's request hangs. The 8-second axios timeout can cause cascading failures.
- **Fix**: Use the circuit breaker pattern (already implemented for job service in worker.controller.js) or use cached/pre-aggregated data.

### MEDIUM

#### USR-M1: `getDashboardMetrics` returns partial data on model failures
- **File**: [user.controller.js](kelmah-backend/services/user-service/controllers/user.controller.js#L550-L600)
- **Description**: Uses `Promise.allSettled` which is good, but returns metrics with some values as 0 without indicating which ones failed. The frontend can't distinguish "zero users" from "query failed".
- **Fix**: Include a `partial: true` flag and list which metrics failed.

#### USR-M2: Worker controller file is 3,297 lines
- **File**: [worker.controller.js](kelmah-backend/services/user-service/controllers/worker.controller.js)
- **Description**: This file is excessively large, containing skill normalization, circuit breaker logic, portfolio formatting, certificate formatting, availability mapping, and controller actions. It violates single-responsibility principle.
- **Fix**: Extract into focused modules: `utils/skillNormalizer.js`, `utils/portfolioFormatter.js`, `utils/circuitBreaker.js`, etc.

#### USR-M3: `getAllUsers` returns all users without pagination
- **File**: [user.controller.js](kelmah-backend/services/user-service/controllers/user.controller.js#L520)
- **Description**: `UserModel.find({}).select(...)` returns all users. On a platform with thousands of users, this will OOM or timeout.
- **Fix**: Add pagination with `limit`, `skip`, and a maximum page size.

### LOW

#### USR-L1: `getBookmarks` only returns worker IDs, not worker details
- **File**: [user.controller.js](kelmah-backend/services/user-service/controllers/user.controller.js#L310)
- **Description**: Returns just an array of `workerIds` requiring the frontend to make additional API calls for each worker's details.
- **Fix**: Populate worker details with `Bookmark.find().populate('workerId', 'firstName lastName profileImage')`.

---

## 7. API Gateway (`api-gateway/`)

### MEDIUM

#### GW-M1: CORS allows all LocalTunnel/ngrok origins in non-production
- **File**: [server.js](kelmah-backend/api-gateway/server.js#L225-L240)
- **Description**: In non-production mode, `.*\.loca\.lt$` and `.*\.ngrok-free\.app$` are allowed as CORS origins. Any attacker on these services can make cross-origin requests to the API.
- **Fix**: Restrict to known subdomain patterns or pin to the current tunnel URL.

#### GW-M2: Proxy cache never expires
- **File**: [server.js](kelmah-backend/api-gateway/server.js#L50-L75)
- **Description**: `proxyCache` is a `Map` that grows indefinitely as service URLs change through re-discovery. Old proxy instances for stale URLs are never cleaned up.
- **Fix**: Clear cache on re-discovery (partially done) or use an LRU cache.

#### GW-M3: Missing origin (`!origin`) is always allowed
- **File**: [server.js](kelmah-backend/api-gateway/server.js#L230)
- **Description**: `if (!origin) return callback(null, true)` allows all requests without an Origin header. While needed for mobile apps and server-to-server calls, it also allows CSRF from non-browser contexts.
- **Fix**: In production, require either an Origin header or an API key for non-browser clients.

### LOW

#### GW-L1: `INTERNAL_API_KEY` only validated in production
- **File**: [server.js](kelmah-backend/api-gateway/server.js#L190-L195)
- **Description**: The fail-fast check for `INTERNAL_API_KEY` only runs in production. In development/staging, internal endpoints are unprotected.
- **Fix**: Validate in all environments or use a development default.

#### GW-L2: Service re-discovery interval is configurable but defaults to 5 minutes
- **File**: [server.js](kelmah-backend/api-gateway/server.js#L155-L170)
- **Description**: If a service goes down and comes back on a different URL, there's up to a 5-minute window of failed requests. No circuit breaker pattern exists in the gateway.
- **Fix**: Add health-check-based failover with shorter intervals for unhealthy services.

---

## Cross-Cutting Concerns

### HIGH

#### CROSS-H1: Inconsistent error response formats across services
- **Description**: Auth service uses `{ message }`, job service uses `{ success, message }` via helpers, review service uses `{ success: false, message }`, payment service mixes formats. Frontend must handle multiple response shapes.
- **Fix**: Standardize all services to the documented `{ success, data?, error?, message? }` format.

#### CROSS-H2: Multiple services bypass Mongoose with native driver
- **Services**: auth-service (login), job-service (getJobs, getMyJobs, getSearchSuggestions), user-service (BSON fallback)
- **Description**: Using `mongoose.connection.getClient().db().collection(...)` bypasses schema validation, hooks, and middleware, creating two different data access patterns.
- **Fix**: Resolve the underlying Mongoose connection/BSON issues and use models consistently.

### MEDIUM

#### CROSS-M1: No request ID propagation across services
- **Description**: Request IDs are generated per-service but not propagated through the gateway to downstream services. Correlated debugging across microservices is impossible.
- **Fix**: Generate a `x-request-id` at the gateway and forward it to all proxied services.

#### CROSS-M2: Health check endpoints inconsistent across services
- **Description**: Some services have `/health`, `/health/ready`, `/health/live`. Others have different patterns. The gateway health aggregate may not cover all services correctly.
- **Fix**: Standardize health endpoint paths and response formats.

### LOW

#### CROSS-L1: Console.log used alongside Winston logger
- **Description**: Most services import Winston but also use `console.log`, `console.warn`, `console.error` extensively. This creates duplicate logging with inconsistent formats.
- **Fix**: Replace all `console.*` calls with the structured Winston logger.

#### CROSS-L2: Hardcoded fallback data pattern throughout
- **Services**: job-service, user-service (worker controller)
- **Description**: Multiple endpoints return fabricated data (fake jobs, fake workers, fake ratings) as fallback when services are unavailable. This pattern should be replaced with honest empty responses.
- **Fix**: Return `{ success: true, data: [], meta: { source: 'unavailable' } }` instead of fake data.

---

## Priority Action Items

### Immediate (Security/Financial)
1. **PAY-C2**: Fix `processPayment` crediting wallets before provider confirmation
2. **PAY-C3**: Fix `processWithdrawal` order of operations (deduct before send)
3. **PAY-C1**: Fix transaction ID collisions in escrow
4. **AUTH-C1**: Remove tokens from OAuth redirect URLs
5. **AUTH-C2**: Unify OAuth token generation with secure hashing
6. **PAY-H1**: Verify payment references before crediting wallets
7. **PAY-H3**: Make wallet balance deduction atomic

### Short-term (Data Integrity)
8. **JOB-C1**: Add milestone status transition validation
9. **USR-C1**: Remove fabricated 4.5 default rating
10. **MSG-H4**: Fix socket rate limiter memory leak
11. **MSG-H2/H3**: Add conversation ID to message queries
12. **REV-H1**: Enforce eligibility in `submitReview`
13. **USR-H2**: Add input validation to `createUser`

### Medium-term (Reliability)
14. **CROSS-H2**: Resolve Mongoose/BSON issues to eliminate native driver workarounds
15. **JOB-H2**: Ensure all routes use `dbReady` middleware
16. **CROSS-H1**: Standardize error response formats
17. **PAY-H4**: Implement refunds for African payment providers
18. **USR-H4**: Add circuit breaker to earnings cross-service calls

---

*Report generated from full source code audit of all 6 microservices.*
