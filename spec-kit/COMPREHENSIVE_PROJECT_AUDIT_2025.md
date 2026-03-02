# Kelmah Platform — Comprehensive Deep Audit Report

**Date**: 2025  
**Scope**: Full-stack audit — Backend (API Gateway + 6 Microservices) + Frontend (React SPA)  
**Methodology**: End-to-end source code review of every server, route, controller, model, middleware, component, service, and slice  

---

## Executive Summary

| Area | Critical | High | Medium | Low | Total |
|------|----------|------|--------|-----|-------|
| **Backend Microservices** | 7 | 14 | 18 | 11 | 50 |
| **API Gateway Routes** | 4 | 5 | 7 | 5 | 21 |
| **Frontend** | 5 | 5 | 9 | 11 | 30 |
| **TOTAL** | **16** | **24** | **34** | **27** | **101** |

---

## PART 1: CRITICAL FINDINGS (Must Fix Immediately)

### CRIT-01: Payment — Wallet Credited Before Provider Confirms Payment
- **File**: `kelmah-backend/services/payment-service/controllers/transaction.controller.js` ~L185-200
- **Impact**: Financial loss — users receive funds before payment clears
- **Fix**: Only credit wallets in webhook handler after payment provider confirms success

### CRIT-02: Payment — Withdrawal Sends Money Before Deducting Balance
- **File**: `kelmah-backend/services/payment-service/controllers/transaction.controller.js` ~L240-280
- **Impact**: Double-spend — if `deductFunds()` fails after provider transfer, user keeps both
- **Fix**: Deduct balance first (hold pattern), then transfer to provider, rollback on failure

### CRIT-03: Payment — Escrow Transaction IDs Use `Date.now()` (Collision-Prone)
- **File**: `kelmah-backend/services/payment-service/controllers/escrow.controller.js` ~L55
- **Impact**: Concurrent requests can generate identical transaction IDs
- **Fix**: Use `crypto.randomUUID()` or the existing `generateTransactionId()` utility

### CRIT-04: Auth — OAuth Tokens Exposed in URL Query Parameters
- **File**: `kelmah-backend/services/auth-service/controllers/auth.controller.js` ~L920-980
- **Impact**: Tokens leak to browser history, referrer headers, server logs, proxies
- **Fix**: Use short-lived authorization code or Set-Cookie with httpOnly

### CRIT-05: Auth — OAuth Refresh Tokens Stored Unhashed in DB
- **File**: `kelmah-backend/services/auth-service/controllers/auth.controller.js` ~L920-980
- **Impact**: DB compromise exposes raw refresh tokens (login flow hashes them correctly)
- **Fix**: Unify OAuth token generation to use same hashing pipeline as login

### CRIT-06: Job — Milestone Status Accepts Arbitrary Values
- **File**: `kelmah-backend/services/job-service/controllers/job.controller.js` ~L610-635
- **Impact**: Worker can set milestone to "paid" or "approved" without proper flow
- **Fix**: Add status transition validator + role-based restrictions

### CRIT-07: User — Fake 4.5 Rating Written to Database for New Workers
- **File**: `kelmah-backend/services/user-service/controllers/worker.controller.js` ~L200-250
- **Impact**: Inflated platform ratings mislead hirers
- **Fix**: Default to `null`/`0`, display "New worker — no reviews yet" in UI

### CRIT-08: Frontend — Dual WebSocket Connections (Resource Leak + State Conflicts)
- **Files**: `kelmah-frontend/src/services/websocketService.js`, `kelmah-frontend/src/modules/messaging/contexts/MessageContext.jsx`
- **Impact**: Duplicate notifications, race conditions on message state, double bandwidth
- **Fix**: Consolidate to single `websocketService` singleton; remove socket from MessageContext

### CRIT-09: Frontend — `secureStorage.clear()` Breaks Multi-Tab Sessions
- **File**: `kelmah-frontend/src/utils/secureStorage.js` ~L307-319
- **Impact**: Logging out in one tab corrupts encrypted storage in other tabs
- **Fix**: Only delete data blob on clear, keep encryption key; use BroadcastChannel for key rotation

### CRIT-10: Frontend — Auth State Divergence Between Redux and useAuth Hook
- **Files**: `kelmah-frontend/src/modules/messaging/contexts/MessageContext.jsx`, `kelmah-frontend/src/modules/payment/contexts/PaymentContext.jsx`
- **Impact**: After token refresh, stale token from secureStorage used instead of updated Redux token
- **Fix**: Standardize on `useSelector(state => state.auth)` everywhere; remove secureStorage fallback from useAuth

### CRIT-11: Gateway — Three Dead Route Files (user.routes.js, search.routes.js, review.routes.js)
- **File**: `kelmah-backend/api-gateway/routes/`
- **Impact**: Maintenance trap — edits to these files have zero effect on running system
- **Fix**: Delete dead files or wire them into server.js to replace inline proxy code

### CRIT-12: Gateway — Predictable Internal API Key in Non-Production
- **File**: `kelmah-backend/api-gateway/proxy/serviceProxy.js` ~L121-122
- **Impact**: Default `'internal-request'` string allows anyone to forge internal service requests
- **Fix**: Require `INTERNAL_API_KEY` in all environments; generate random key for development

---

## PART 2: HIGH FINDINGS (Fix This Sprint)

### HIGH-01: Payment — Unauthenticated Reconcile Endpoint
- **File**: `kelmah-backend/services/payment-service/controllers/transaction.controller.js`
- **Impact**: Anyone can trigger reconciliation and mark webhook events as processed

### HIGH-02: Payment — Non-Atomic Wallet Balance Check (Double-Spend)
- **File**: `kelmah-backend/services/payment-service/controllers/payment.controller.js` ~L380-480
- **Fix**: Use `findOneAndUpdate` with `$inc: { balance: -amount }` and `balance >= amount` filter

### HIGH-03: Payment — Wallet Deposit Trusts Client-Provided Reference
- **File**: `kelmah-backend/services/payment-service/controllers/wallet.controller.js`
- **Fix**: Verify reference against payment provider before crediting wallet

### HIGH-04: Payment — Refunds Only Support Stripe/PayPal (Not Ghanaian Providers)
- **File**: `kelmah-backend/services/payment-service/controllers/transaction.controller.js`
- **Fix**: Implement refund flows for Paystack, MTN MoMo, Vodafone Cash, AirtelTigo

### HIGH-05: Job — Production Debug Logging (All Requests Logged Unconditionally)
- **File**: `kelmah-backend/services/job-service/server.js`
- **Fix**: Gate behind `NODE_ENV === 'development'` or remove

### HIGH-06: Job — Multiple Controllers Bypass Mongoose for Native Driver
- **Files**: `kelmah-backend/services/job-service/controllers/job.controller.js`, auth-service, user-service
- **Fix**: Resolve underlying Mongoose/BSON issues; use models consistently

### HIGH-07: Job — Hardcoded Mock Data in Production Endpoints
- **File**: `kelmah-backend/services/job-service/controllers/job.controller.js` ~L1640-1680
- **Fix**: Return empty arrays with `{ source: 'unavailable' }` flag instead of fake jobs

### HIGH-08: Messaging — Rate Limiting Commented Out on HTTP Routes
- **File**: `kelmah-backend/services/messaging-service/routes/message.routes.js`
- **Fix**: Uncomment or add dedicated rate limiting

### HIGH-09: Messaging — Messages Fetched by Participant IDs, Not Conversation ID
- **File**: `kelmah-backend/services/messaging-service/socket/messageSocket.js` ~L560-590
- **Fix**: Add `conversation` field to Message model; filter by it

### HIGH-10: Messaging — Socket Rate Limiter Never Cleans Up (Permanent Lockout)
- **File**: `kelmah-backend/services/messaging-service/socket/messageSocket.js` ~L215-230
- **Fix**: Implement sliding window — filter timestamps older than 60s before checking count

### HIGH-11: Review — `submitReview` Doesn't Enforce Job Completion
- **File**: `kelmah-backend/services/review-service/controllers/review.controller.js`
- **Fix**: Call eligibility check as guard inside submitReview

### HIGH-12: User — `createUser` Accepts Raw `req.body` (Privilege Escalation)
- **File**: `kelmah-backend/services/user-service/controllers/user.controller.js` ~L530
- **Fix**: Whitelist allowed fields; never pass raw body to Model.create()

### HIGH-13: Auth — `reactivateAccount` Reveals Email Existence
- **File**: `kelmah-backend/services/auth-service/controllers/auth.controller.js`
- **Fix**: Return generic message regardless of whether account exists

### HIGH-14: Gateway — Double Authentication on Payment & Messaging Routes
- **Files**: `kelmah-backend/api-gateway/server.js` + `routes/payment.routes.js`, `routes/messaging.routes.js`
- **Fix**: Remove `router.use(authenticate)` from route files since server.js already applies it

### HIGH-15: Gateway — Dashboard Routes Send Wrong Header Format
- **File**: `kelmah-backend/api-gateway/routes/dashboard.routes.js`
- **Fix**: Use `x-authenticated-user` JSON format instead of separate X-User-ID/X-User-Role headers

### HIGH-16: Gateway — Error Responses Expose Internal Error Messages
- **Files**: `kelmah-backend/api-gateway/routes/job.routes.js`, `routes/bid.routes.js`
- **Fix**: Sanitize `error.message` before sending to client

### HIGH-17: Frontend — Notification Array Grows Unbounded
- **File**: `kelmah-frontend/src/modules/notifications/services/notificationSlice.js`
- **Fix**: Cap at 100 entries in `addNotification` reducer

### HIGH-18: Frontend — CSP Allows `'unsafe-inline'` for Scripts
- **File**: `kelmah-frontend/src/config/securityConfig.js`
- **Fix**: Remove `'unsafe-inline'` from `script-src`; use nonces if needed

### HIGH-19: Frontend — `serializableCheck: false` in Redux Store
- **File**: `kelmah-frontend/src/store/index.js`
- **Fix**: Store ISO strings instead of Date objects; re-enable the check

### HIGH-20: Frontend — Dashboard Cache Doesn't Invalidate on Error
- **File**: `kelmah-frontend/src/modules/dashboard/services/dashboardSlice.js`
- **Fix**: Skip cache when previous result has `_serviceUnavailable: true`

### HIGH-21: Gateway — `validatePayment` Applied to Non-Payment POST Routes
- **File**: `kelmah-backend/api-gateway/server.js` ~L809
- **Fix**: Move payment validation inside route handlers that need it, not as global middleware

### HIGH-22: Gateway — Bid Cleanup Route Missing Admin Role Check
- **File**: `kelmah-backend/api-gateway/routes/bid.routes.js` ~L100
- **Fix**: Add `authorizeRoles('admin')` middleware

### HIGH-23: Review — `reportReview` Has No Auth and No Rate Limiting
- **File**: `kelmah-backend/services/review-service/controllers/review.controller.js`
- **Fix**: Require auth; use `$addToSet` for reporters; only flag after threshold

### HIGH-24: Review — `voteHelpful` Accepts Spoofable x-user-id Header
- **File**: `kelmah-backend/services/review-service/controllers/review.controller.js`
- **Fix**: Only use `req.user?.id` from authenticated middleware

---

## PART 3: MEDIUM FINDINGS (Fix Next Sprint)

### Backend Medium

| ID | Issue | File | Fix |
|----|-------|------|-----|
| MED-01 | Inconsistent error response formats across all services | Cross-cutting | Standardize to `{ success, error: { message, code } }` |
| MED-02 | `advancedJobSearch` uses `$text` without guaranteed text index | job.controller.js | Ensure index exists or remove `$text` clause |
| MED-03 | `getSearchSuggestions` runs 14+ unindexed regex queries | job.controller.js | Add compound indexes or use Atlas Search |
| MED-04 | `countDocuments` pagination uses fallback estimation | job.controller.js | Use `estimatedDocumentCount` or cache totals |
| MED-05 | `createConversation` doesn't validate participant exists | conversation.controller.js | Verify participant IDs against User collection |
| MED-06 | Typing timeout creates new setTimeout without clearing previous | messageSocket.js | Store timeout ref on socket; clear before setting new |
| MED-07 | `broadcastUserStatus` runs DB query per status change | messageSocket.js | Cache user-to-conversation mappings in memory |
| MED-08 | Payment Wallet/Transaction schema field name inconsistency | payment controllers | Audit Wallet model; use consistent `user` vs `userId` |
| MED-09 | `createTransactionRecord` silently swallows errors | payment.controller.js | Make it a critical failure with compensation pattern |
| MED-10 | Payment health checks run on every `getPaymentMethods` call | payment.controller.js | Cache health check results (60-second TTL) |
| MED-11 | `getAllUsers` returns all users without pagination | user.controller.js | Add `limit`, `skip`, and max page size |
| MED-12 | Worker controller is 3,297 lines (SRP violation) | worker.controller.js | Extract into focused modules |
| MED-13 | `getDashboardMetrics` returns partial data without indication | user.controller.js | Add `partial: true` flag and list failed metrics |
| MED-14 | Routes mounted before DB connection in job-service | job-service/server.js | Ensure all routes use `dbReady` middleware |
| MED-15 | Job contracts routes are public (sensitive data exposure) | job.routes.js | Add authentication to contract endpoints |
| MED-16 | No request ID propagation across services | Cross-cutting | Generate `x-request-id` at gateway, forward to all services |
| MED-17 | Health check endpoints inconsistent across services | Cross-cutting | Standardize paths and response formats |
| MED-18 | Proxy cache never expires | api-gateway/server.js | Clear on re-discovery or use LRU cache |

### Frontend Medium

| ID | Issue | File | Fix |
|----|-------|------|-----|
| MED-19 | Third WebSocket in DashboardService | dashboardService.js | Remove; use shared websocketService |
| MED-20 | JWT decode in DashboardService is unsafe | dashboardService.js | Extract to shared utility with validation |
| MED-21 | Stale closure in MessageContext.selectConversation | MessageContext.jsx | Add REST fallback in timeout callback |
| MED-22 | `getUpcomingTasks` returns fabricated data | dashboardService.js | Connect to real API or label as placeholder |
| MED-23 | `hirerService.getApplications` always returns empty array | hirerService.js | Implement actual API call or remove method |
| MED-24 | Legacy ResetPasswordPage.jsx exists alongside replacement | modules/auth/pages/ | Delete the legacy file |
| MED-25 | JobsPage.jsx is 2500+ lines with 50+ MUI imports | JobsPage.jsx | Break into sub-components; remove unused imports |
| MED-26 | `setInterval` in SecureStorage constructor — never cleared | secureStorage.js | Add `dispose()` method; use requestIdleCallback |
| MED-27 | `ReactQueryDevtools` included in production bundle | main.jsx | Wrap in `import.meta.env.DEV` conditional |

---

## PART 4: LOW FINDINGS (Backlog)

### Backend Low

| ID | Issue | File |
|----|-------|------|
| LOW-01 | Duplicate password reset routes in auth-service | auth.routes.js |
| LOW-02 | `viewCount` fire-and-forget with no error logging | job.controller.js |
| LOW-03 | `saveJob` returns 200 for duplicate (should be 409) | job.controller.js |
| LOW-04 | `handleDisconnection` reads after delete in messaging | messageSocket.js |
| LOW-05 | Console.log used alongside Winston across all services | Cross-cutting |
| LOW-06 | Hardcoded fallback data pattern throughout | job/user services |
| LOW-07 | Auth settings endpoints return hardcoded static data | auth-service/server.js |
| LOW-08 | `getAuthStats` exposes token count metrics | auth.controller.js |
| LOW-09 | Duplicate comment in job.routes.js | job.routes.js |
| LOW-10 | `serviceProxy.js` body rewrite only handles JSON | serviceProxy.js |
| LOW-11 | `getBookmarks` returns only IDs, not populated details | user.controller.js |

### Frontend Low

| ID | Issue | File |
|----|-------|------|
| LOW-12 | `normalizeUser` called without memoization on every render | WorkerDashboardPage.jsx |
| LOW-13 | `ErrorFallback` has no retry/reset button | main.jsx |
| LOW-14 | Hardcoded 4.5 rating fallback in job transform | jobsService.js |
| LOW-15 | `urgent` auto-marked based on proposal count | jobsService.js |
| LOW-16 | `v7_relativeSplatPath` future flag without full v7 migration | main.jsx |
| LOW-17 | Console.warn inconsistency — suppressed in production | main.jsx |
| LOW-18 | `window.location.href` navigation instead of Router | apiClient.js, websocketService.js |
| LOW-19 | `checkStorageQuota()` called at module top level | main.jsx |
| LOW-20 | Missing form labels (accessibility) in auth pages | ForgotPasswordPage.jsx |
| LOW-21 | Unused imports across multiple components | JobsPage.jsx, others |
| LOW-22 | `useApiHealth` eslint-disable for dependency array | useApiHealth.js |

---

## PART 5: ARCHITECTURAL RECOMMENDATIONS

### 1. Consolidate WebSocket Architecture
**Current**: 3 independent Socket.IO connections (websocketService, MessageContext, DashboardService)  
**Target**: Single `websocketService` singleton consumed by all features via hooks/events  
**Effort**: Medium | **Impact**: High (resource savings, consistency)

### 2. Fix Mongoose/BSON Version Conflict
**Current**: Multiple services bypass Mongoose with native MongoDB driver as "workaround"  
**Target**: Resolve dependency conflict; use Mongoose models exclusively  
**Effort**: Medium | **Impact**: High (data integrity, schema enforcement)

### 3. Standardize Error Response Format
**Current**: 6+ different error response shapes across services  
**Target**: Universal `{ success: boolean, data?, error?: { message, code, details? }, meta? }`  
**Effort**: Low | **Impact**: Medium (developer experience, frontend simplification)

### 4. Implement Proper Payment Flow
**Current**: Credit-before-confirm pattern with race condition risks  
**Target**: Webhook-driven confirmation → atomic balance updates → compensation on failure  
**Effort**: High | **Impact**: Critical (financial integrity)

### 5. Clean Up Dead Gateway Route Files
**Current**: 3 route files never imported by server.js  
**Target**: Either delete them or refactor server.js to use them  
**Effort**: Low | **Impact**: Medium (prevents maintenance confusion)

### 6. Add Error Boundaries Per Module
**Current**: Single top-level ErrorBoundary in main.jsx with no retry  
**Target**: Per-module ErrorBoundary components with retry buttons  
**Effort**: Low | **Impact**: Medium (user recovery, resilience)

### 7. Implement Circuit Breaker Pattern for Cross-Service Calls
**Current**: User-service makes direct HTTP to payment-service with 8s timeout  
**Target**: Circuit breaker (already implemented in worker.controller.js) for all cross-service calls  
**Effort**: Medium | **Impact**: Medium (cascading failure prevention)

### 8. Mobile-First Accessibility Pass
**Current**: Form inputs use placeholder instead of labels; some components lack aria attributes  
**Target**: Full WCAG 2.1 AA compliance  
**Effort**: Medium | **Impact**: High (target audience includes users with limited formal education)

---

## PRIORITY ACTION MATRIX

### Immediate (Security + Financial) — This Week
1. CRIT-01: Payment crediting before confirmation
2. CRIT-02: Withdrawal order of operations
3. CRIT-03: Transaction ID collisions
4. CRIT-04: OAuth tokens in URLs
5. CRIT-05: Unhashed OAuth refresh tokens
6. HIGH-02: Non-atomic wallet balance check
7. HIGH-03: Unverified payment references
8. CRIT-12: Predictable internal API key

### Short-term (Data Integrity) — This Sprint
9. CRIT-06: Milestone status validation
10. CRIT-07: Fake 4.5 default ratings
11. CRIT-08: Dual WebSocket connections
12. HIGH-09: Message-conversation scoping
13. HIGH-10: Socket rate limiter cleanup
14. HIGH-11: Review eligibility enforcement
15. HIGH-12: createUser input validation

### Medium-term (Reliability + UX) — Next Sprint
16. CRIT-09: SecureStorage multi-tab
17. CRIT-10: Auth state divergence
18. HIGH-06: Mongoose native driver workarounds
19. HIGH-07: Mock data in production
20. HIGH-17: Unbounded notification array
21. HIGH-18: CSP unsafe-inline
22. MED-01: Error response standardization

---

*Full source code audit completed. Detailed per-file findings available in `BACKEND_MICROSERVICES_AUDIT_2025.md`.*
