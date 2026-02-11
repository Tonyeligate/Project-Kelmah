# Kelmah Platform — Full Code Audit Report

**Date**: February 11, 2026  
**Scope**: Every page, service, config, and module across frontend + backend  
**Total Findings**: **146 issues** (21 Critical, 39 High, 55 Medium, 31 Low)

---

## Executive Summary

| Severity | Count | Key Risk |
|----------|-------|----------|
| **CRITICAL** | 21 | Authentication bypass, fake financial data, broken services, secret exposure |
| **HIGH** | 39 | Memory leaks, missing auth on endpoints, broken imports, mock data in production |
| **MEDIUM** | 55 | Inconsistent patterns, dead code, missing validation, double-logging |
| **LOW** | 31 | Stale artifacts, naming issues, minor dead code |

### Top 10 Most Urgent Fixes

| # | Severity | Area | Issue | Impact |
|---|----------|------|-------|--------|
| 1 | CRITICAL | Backend `.env` | All secrets in plaintext in repo — JWT secret is `Deladem_Tony` | Full platform compromise |
| 2 | CRITICAL | Frontend `vite.config.js` | `'process.env': process.env` leaks ALL Node env vars to browser bundle | Secret exposure in production |
| 3 | CRITICAL | Review Service | ALL authentication middleware commented out | Anyone can create/delete reviews |
| 4 | CRITICAL | Payment Service | Controller uses Sequelize syntax on Mongoose — every operation crashes | Payments completely broken |
| 5 | CRITICAL | Frontend `App.jsx` | `AUTH_CONFIG.TOKEN_KEY` is undefined (should be `tokenKey`) | Auth silently broken on every load |
| 6 | CRITICAL | Payment frontend | `paymentService.getWallet()` returns fake GHS 2,540.50 on error | Users see fabricated balances |
| 7 | CRITICAL | Quick Jobs frontend | API path is `/api/api/quick-jobs` (doubled prefix) | All quick-job features 404 |
| 8 | CRITICAL | API Gateway | `createDynamicProxy` creates new proxy instance per request | Memory leak → OOM crash |
| 9 | HIGH | User Service | `GET /` (getAllUsers) and `POST /database/cleanup` have no auth | Anyone can dump/delete users |
| 10 | HIGH | Messaging Service | `new RegExp(userInput)` in MongoDB query — ReDoS/injection | DB hang via crafted input |

---

## PART 1: BACKEND — API GATEWAY

### Critical (7)

| ID | File | Issue | Fix |
|----|------|-------|-----|
| GW-C1 | [api-gateway/.env](kelmah-backend/api-gateway/.env) | All production secrets committed: JWT secrets, MongoDB URIs with passwords, SMTP credentials, internal API key. `JWT_SECRET=Deladem_Tony` is trivially guessable (~13 chars). | Rotate ALL secrets immediately. Remove `.env` from git. Use `openssl rand -base64 64` for secrets. Use Render/Doppler env vars. |
| GW-C2 | [api-gateway/.env](kelmah-backend/api-gateway/.env#L17) | `INTERNAL_API_KEY=kelmah-internal-key-2024` — predictable static string used for all service-to-service auth. | Generate random 256-bit key. Rotate periodically. Validate via HMAC not raw comparison. |
| GW-C3 | [server.js](kelmah-backend/api-gateway/server.js#L40-L64) | `createDynamicProxy()` creates a new `createProxyMiddleware()` instance on **every request**. Each allocates HTTP agent + socket pool + event listeners that never clean up. | Pre-create proxy instances at startup keyed by service name. Reuse them. |
| GW-C4 | [server.js](kelmah-backend/api-gateway/server.js) ~L774-990 | 10+ route handlers create inline `createProxyMiddleware({...})` per request — multiplied version of GW-C3. | Same fix: pre-create and cache all proxies at startup. |
| GW-C5 | [server.js](kelmah-backend/api-gateway/server.js#L262) | `/health` and `/api/health` return `serviceUrls: services` exposing every internal microservice URL (localhost ports + Render hostnames). | Remove `serviceUrls` from health response. Return only aggregate status. |
| GW-C6 | [server.js](kelmah-backend/api-gateway/server.js#L748) | `authenticate` middleware applied BOTH at server mount AND inside payment/messaging routers — double auth per request. Doubled latency + possible `req.user` overwrite. | Apply `authenticate` in exactly one place per route chain. |
| GW-C7 | [.env](kelmah-backend/api-gateway/.env#L1) | `JWT_SECRET=Deladem_Tony` — brute-forceable in seconds. Enables complete token forgery for any user. | Use ≥256-bit cryptographically random secret. |

### High (12)

| ID | File | Issue | Fix |
|----|------|-------|-----|
| GW-H1 | [routes/index.js](kelmah-backend/api-gateway/routes/index.js) | Entire file (~120 lines) is dead code — never imported or mounted. | Delete the file. |
| GW-H2 | [routes/monolith.routes.js](kelmah-backend/api-gateway/routes/monolith.routes.js#L13) | References `MONOLITH_SERVICE` which doesn't exist in the service registry. Any request crashes. | Delete the file or map to correct services. |
| GW-H3 | [proxy/*.js](kelmah-backend/api-gateway/proxy/) | 4 empty proxy files (`auth.proxy.js`, `messaging.proxy.js`, `payment.proxy.js`, `user.proxy.js`). Never used. | Delete all four files. |
| GW-H4 | [server.js](kelmah-backend/api-gateway/server.js#L853) | Notification proxy hardcodes `process.env.MESSAGING_SERVICE_CLOUD_URL` instead of using `services.messaging` from the dynamic service registry. | Use `services.messaging` consistent with all other routes. |
| GW-H5 | [routes/auth.routes.js](kelmah-backend/api-gateway/routes/auth.routes.js#L80) | Register endpoint forwards ALL upstream response headers (`res.set(r.headers)`) — leaks `X-Powered-By`, `Server`, internal proxy headers. | Only forward `Content-Type` and safe headers. |
| GW-H6 | [.env](kelmah-backend/api-gateway/.env#L15) | `NODE_ENV=production` in .env means local dev runs in production mode, hiding stack traces and changing CORS behavior. | Remove `NODE_ENV` from `.env`. Set per environment. |
| GW-H7 | [server.js](kelmah-backend/api-gateway/server.js#L172) | CORS allows null origin: `if (!origin) return callback(null, true)`. Any non-browser client bypasses CORS. | Limit null-origin acceptance to health checks in production. |
| GW-H8 | [middlewares/auth.js](kelmah-backend/api-gateway/middlewares/auth.js#L14) | `userCache = new Map()` — entries added but never evicted. TTL only checked on read. Users who don't return leave entries forever. | Use `lru-cache` package with max size + TTL eviction. |
| GW-H9 | [server.js](kelmah-backend/api-gateway/server.js#L216) | Rate limiter completely skipped for `/api/jobs/my-jobs`. | Apply a separate higher-limit rate limiter instead of skipping entirely. |
| GW-H10 | [middlewares/request-validator.js](kelmah-backend/api-gateway/middlewares/request-validator.js#L154) | `sanitizeRequest` middleware is defined but **never applied** to any route. No XSS sanitization at gateway level. | Apply globally via `app.use(requestValidator.sanitizeRequest)`. |
| GW-H11 | [config/serviceConfig.js](kelmah-backend/api-gateway/config/serviceConfig.js) | Empty file. Dead code. | Delete. |
| GW-H12 | [proxy/job.proxy.js](kelmah-backend/api-gateway/proxy/job.proxy.js) | ~130 lines of dead code. `createJobProxy`, `createEnhancedJobProxy`, `checkJobServiceHealth` — none imported anywhere. | Delete. |

### Medium (14)

| ID | File | Issue | Fix |
|----|------|-------|-----|
| GW-M1 | Multiple files | Three incompatible proxy patterns coexist: `createDynamicProxy()`, direct `axios`, and `createServiceProxy()`. Different error handling/timeout/header behavior. | Standardize on one pattern across all routes. |
| GW-M2 | [middlewares/logging.js](kelmah-backend/api-gateway/middlewares/logging.js#L27) | Overrides both `res.send` and `res.json` plus `res.on('finish')`. JSON responses triple-logged. | Use only `res.on('finish')` for post-response logging. |
| GW-M3 | [server.js](kelmah-backend/api-gateway/server.js) | 40+ `console.log`/`console.error` calls despite Winston logger being configured. Bypasses log levels and file transport. | Replace all with `logger.info/error/warn`. |
| GW-M4 | Routes files | No `httpAgent` with `keepAlive: true` on axios calls. New TCP connection per request. | Create shared axios instance with `keepAlive` agent. |
| GW-M5 | Throughout | 4+ different error response shapes returned. Frontend must handle all variants. | Standardize to `{ success, error: { message, code } }`. |
| GW-M6 | [request-validator.js](kelmah-backend/api-gateway/middlewares/request-validator.js#L214) | Duplicate CORS implementation (unused) alongside the one in server.js. | Remove from request-validator.js. |
| GW-M7 | [middlewares/rate-limiter.js](kelmah-backend/api-gateway/middlewares/rate-limiter.js#L7) | `require('rate-limit-redis')` and `require('redis')` at module scope — if packages missing, entire rate limiter module fails to load. | Dynamic require inside try/catch in init function. |
| GW-M8 | [server.js](kelmah-backend/api-gateway/server.js#L774) | `/api/messaging/health` mounted AFTER `/api/messaging` router — shadowed by the messaging router catch-all. | Mount health route BEFORE the messaging router. |
| GW-M9 | [middlewares/auth.js](kelmah-backend/api-gateway/middlewares/auth.js#L131) | `optionalAuth` error handling gap — `authenticate` sends response directly on error + calls callback, potentially double-responding. | Refactor authenticate to support optional mode without sending response. |
| GW-M10 | [server.js](kelmah-backend/api-gateway/server.js#L748) | `validatePayment` applied to ALL methods including GET/DELETE which don't have payment body. | Apply only to POST/PUT payment routes. |
| GW-M11 | [server.js](kelmah-backend/api-gateway/server.js#L71) | `trust proxy` set to 1 but no proxy validation. Clients can spoof `X-Forwarded-For` to bypass rate limiting. | Validate proxy chain in production. |
| GW-M12 | [routes/dashboard.routes.js](kelmah-backend/api-gateway/routes/dashboard.routes.js#L26) | `pathRewrite` regex doesn't match because Express already strips the mount path. Paths forwarded incorrectly. | Fix pathRewrite to prepend correct prefix. |
| GW-M13 | [request-validator.js](kelmah-backend/api-gateway/middlewares/request-validator.js#L68) | Webhook signature validation skipped in development. | Always validate signatures. Use test keys in dev. |
| GW-M14 | [server.js](kelmah-backend/api-gateway/server.js#L1008) | `require('path')` and `require('fs')` inside route handlers instead of at top of file. | Move to top-level imports. |

### Low (9)

| ID | File | Issue | Fix |
|----|------|-------|-----|
| GW-L1 | [server.js](kelmah-backend/api-gateway/server.js#L196) | Stale `ngrok-skip-browser-warning` header on every response. Platform migrated to LocalTunnel. | Remove. |
| GW-L2 | [.env](kelmah-backend/api-gateway/.env#L3) | `SQL_URL=postgresql://...` — dead SQL connection string in a 100% MongoDB project. | Remove. |
| GW-L3 | [server.js](kelmah-backend/api-gateway/server.js#L1012) | Hardcoded `shaggy-snake-43.loca.lt` in docs endpoint. Changes on every restart. | Read from config or omit. |
| GW-L4 | [request-validator.js](kelmah-backend/api-gateway/middlewares/request-validator.js#L119) | `validateApiVersion` exported but never used. Dead code. | Remove. |
| GW-L5 | [request-validator.js](kelmah-backend/api-gateway/middlewares/request-validator.js#L138) | `validateUserTier` exported but never used. Dead code. | Remove. |
| GW-L6 | [request-validator.js](kelmah-backend/api-gateway/middlewares/request-validator.js#L100) | `validateFileUpload` exported but never applied to upload routes. | Apply to `/api/uploads` routes or remove. |
| GW-L7 | [server.js](kelmah-backend/api-gateway/server.js#L237) | Root `/` endpoint exposes service names and counts. | Remove from public response. |
| GW-L8 | [server.js + db.js](kelmah-backend/api-gateway/server.js) | No graceful HTTP shutdown. In-flight requests dropped on deploy. | Add `server.close()` with drain timeout in signal handlers. |
| GW-L9 | [server.js](kelmah-backend/api-gateway/server.js#L270) | Duplicate `/health` route registrations at two locations. Second is dead code. | Remove duplicate. |

---

## PART 2: BACKEND — MICROSERVICES

### Auth Service

| ID | Sev | File | Issue | Fix |
|----|-----|------|-------|-----|
| AUTH-1 | HIGH | [auth.controller.js](kelmah-backend/services/auth-service/controllers/auth.controller.js#L193) | Account lock check runs AFTER `bcrypt.compare()`. Locked accounts still consume bcrypt CPU + create timing leak. | Move lock check BEFORE password verification. |
| AUTH-2 | HIGH | [auth.controller.js](kelmah-backend/services/auth-service/controllers/auth.controller.js#L170) | Wrong-password on locked account still increments `failedLoginAttempts` past 5 because lock check only exists in "password valid" path. | Unified lock check before password verification prevents this. |
| AUTH-3 | HIGH | [auth.controller.js](kelmah-backend/services/auth-service/controllers/auth.controller.js) | `changePassword` deletes refresh tokens by `{token: ...}` but schema uses `tokenId`/`tokenHash`. Deletion matches nothing — old tokens remain valid after password change. | Query by `{userId: user._id}` to revoke all user tokens. |
| AUTH-4 | MED | [auth.controller.js](kelmah-backend/services/auth-service/controllers/auth.controller.js) | OAuth callbacks call `jwtUtils.generateAuthTokens()` which doesn't exist. All OAuth logins crash at runtime. | Use same token generation as login function. |
| AUTH-5 | MED | [auth.controller.js](kelmah-backend/services/auth-service/controllers/auth.controller.js#L130) | Login uses raw MongoDB driver (`mongoose.connection.getClient().db()`) bypassing schema validation, virtuals, middleware hooks, and `toJSON` transform. | Use shared User model. |
| AUTH-6 | LOW | [auth-service/server.js](kelmah-backend/services/auth-service/server.js) | Hardcoded `/settings` endpoints belong in user-service. Service boundary confusion. | Move to user-service. |

### User Service

| ID | Sev | File | Issue | Fix |
|----|-----|------|-------|-----|
| USER-1 | HIGH | [user.routes.js](kelmah-backend/services/user-service/routes/user.routes.js#L32) | `GET /` (getAllUsers) has **no authentication**. Anyone can enumerate all users. | Add `verifyGatewayRequest` + admin role check. |
| USER-2 | HIGH | [user.routes.js](kelmah-backend/services/user-service/routes/user.routes.js#L40) | `POST /database/cleanup` has **no authentication**. Anyone can trigger DB cleanup. | Add `verifyGatewayRequest` + admin authorization. |
| USER-3 | HIGH | [settings.routes.js](kelmah-backend/services/user-service/routes/settings.routes.js#L8) | All user settings stored in **in-memory `Map`**. Wiped on every server restart. | Persist to MongoDB. |
| USER-4 | MED | [user.routes.js](kelmah-backend/services/user-service/routes/user.routes.js#L94) | `GET /workers/debug/models` shadowed by `GET /workers/:id` — `debug` captured as `:id`. | Move before `/:id` or remove from production. |
| USER-5 | MED | [user-service/server.js](kelmah-backend/services/user-service/server.js) | Debug middleware logs every request body/headers in production — leaks tokens and PII. | Gate behind `NODE_ENV === 'development'`. |
| USER-6 | LOW | [user-service/server.js](kelmah-backend/services/user-service/server.js) | Mock `/api/appointments` returning static fake data in production. | Remove or gate behind dev mode. |
| USER-7 | LOW | [user.routes.js](kelmah-backend/services/user-service/routes/user.routes.js) | `createLimiter` is a no-op `(req, res, next) => next()`. Rate limiting disabled. | Wire shared rate limiter. |

### Job Service

| ID | Sev | File | Issue | Fix |
|----|-----|------|-------|-----|
| JOB-1 | MED | [job-service/server.js](kelmah-backend/services/job-service/server.js#L300) | Routes mounted TWICE — once via `mountApiRoutes()` "EMERGENCY FIX" and again in `startServerWithDbRetry()`. | Remove the deferred mount. |
| JOB-2 | MED | [job-service/server.js](kelmah-backend/services/job-service/server.js#L340) | Verbose `console.log` for every request field in production. | Gate behind dev mode. |
| JOB-3 | LOW | [job.controller.js](kelmah-backend/services/job-service/controllers/job.controller.js) | Read-only queries don't use `.lean()`. Full Mongoose documents created needlessly. | Add `.lean()` to read-only queries. |

### Payment Service

| ID | Sev | File | Issue | Fix |
|----|-----|------|-------|-----|
| PAY-1 | **CRIT** | [payment.controller.js](kelmah-backend/services/payment-service/controllers/payment.controller.js#L220) | `Payment.findOne({ where: { id: paymentId } })` — **Sequelize syntax on Mongoose**. `where` wrapper matches nothing. Every status check returns 404. | Change to `Payment.findOne({ _id: paymentId, userId })`. |
| PAY-2 | **CRIT** | [payment.controller.js](kelmah-backend/services/payment-service/controllers/payment.controller.js#L267) | `payment.update({...})` — Mongoose documents don't have `.update()` method (removed in Mongoose 6+). Throws `TypeError` at runtime. | Use `payment.set({...}); await payment.save();`. |
| PAY-3 | **CRIT** | [payment.controller.js](kelmah-backend/services/payment-service/controllers/payment.controller.js) | Controller uses `Payment` model but **`Payment` is not exported from models/index.js**. Exports are: Transaction, Wallet, PaymentMethod, Escrow, Bill, etc. Crashes with `TypeError: Cannot read properties of undefined`. | Add Payment model or update controller to use correct model (Transaction). |
| PAY-4 | HIGH | [payment.controller.js](kelmah-backend/services/payment-service/controllers/payment.controller.js#L355) | `Wallet.findOne({ where: { userId } })` — same Sequelize syntax bug. | Change to `Wallet.findOne({ userId })`. |
| PAY-5 | MED | [payments.routes.js](kelmah-backend/services/payment-service/routes/payments.routes.js#L112) | `module.exports = router` placed before additional route definitions. `router.use(verifyGatewayRequest)` called twice. | Move export to end of file. Remove duplicate middleware. |
| PAY-6 | MED | [payments.routes.js](kelmah-backend/services/payment-service/routes/payments.routes.js) | Admin payout endpoints have gateway trust auth but NO admin role check. Any authenticated user could process payouts. | Add `requireRole('admin')`. |
| PAY-7 | MED | [payment-service/server.js](kelmah-backend/services/payment-service/server.js) | Loads `.env` from `../../.env` (project root) while other services use local `.env`. | Use service-local `.env`. |

### Messaging Service

| ID | Sev | File | Issue | Fix |
|----|-----|------|-------|-----|
| MSG-1 | HIGH | [message.controller.js](kelmah-backend/services/messaging-service/controllers/message.controller.js) | `new RegExp(searchTerm)` with unsanitized user input in `$regex` query. **ReDoS + NoSQL injection vector**. Malicious regex like `.*.*.*.*` hangs the DB. | Escape regex chars: `searchTerm.replace(/[.*+?^${}()\|[\]\\]/g, '\\$&')`. |
| MSG-2 | MED | [message.controller.js](kelmah-backend/services/messaging-service/controllers/message.controller.js) | Uses deprecated `message.remove()`. Throws in Mongoose 7+. | Use `await message.deleteOne()`. |
| MSG-3 | MED | [notification.controller.js](kelmah-backend/services/messaging-service/controllers/notification.controller.js#L110) | `await notification.remove()` — same deprecated method. | Use `await notification.deleteOne()`. |
| MSG-4 | MED | [Conversation.js](kelmah-backend/services/messaging-service/models/Conversation.js) | `incrementUnreadCount`/`resetUnreadCount` call `this.save()` internally. Callers also call `.save()`. Double save = race condition. | Remove `this.save()` from methods or document that callers shouldn't save. |
| MSG-5 | MED | [auth.middleware.js](kelmah-backend/services/messaging-service/middlewares/auth.middleware.js) | `console.log('Decoded token:', decoded)` prints full JWT payload in all environments. | Gate behind dev mode. |
| MSG-6 | MED | [notification.controller.js](kelmah-backend/services/messaging-service/controllers/notification.controller.js) | Inconsistent response formats: `{data, pagination}`, `{message}`, `{success, data}`. | Standardize to `{success, data, [meta]}`. |

### Review Service

| ID | Sev | File | Issue | Fix |
|----|-----|------|-------|-----|
| REV-1 | **CRIT** | [review.routes.js](kelmah-backend/services/review-service/routes/review.routes.js) | **ALL authentication middleware commented out**. Every endpoint unprotected. Anyone can create/modify/delete reviews without auth. | Uncomment `verifyGatewayRequest` on protected routes. |
| REV-2 | **CRIT** | [admin.routes.js](kelmah-backend/services/review-service/routes/admin.routes.js) | Admin moderation endpoints have NO auth and NO role check. Anyone can moderate/approve/reject reviews. | Add `verifyGatewayRequest` + admin role authorization. |
| REV-3 | HIGH | [review.controller.js](kelmah-backend/services/review-service/controllers/review.controller.js) | Controller creates `{jobId, workerId, ratings: {overall, quality, ...}}` but schema only has `{job, reviewer, reviewee, rating}`. With `strict: true` all extra fields silently stripped — ratings breakdown lost. | Align schema with controller or vice versa. |
| REV-4 | MED | [review.controller.js](kelmah-backend/services/review-service/controllers/review.controller.js#L340) | `voteHelpful` uses `$inc: { helpfulVotes: 1 }` but schema has no `helpfulVotes` field. No deduplication — same user can vote unlimited times. | Add field to schema. Track voter IDs to prevent duplicates. |
| REV-5 | MED | [review.controller.js](kelmah-backend/services/review-service/controllers/review.controller.js#L375) | `reportReview` accepts `{reason}` from body but **never stores it**. Only increments count. Moderators have no insight. | Add `reports: [{userId, reason, createdAt}]` array to schema. |

### Shared Resources

| ID | Sev | File | Issue | Fix |
|----|-----|------|-------|-----|
| SH-1 | MED | [shared/models/Job.js](kelmah-backend/shared/models/Job.js#L147) | `locationDetails.region` enum only has 10 of Ghana's 16 regions. Missing: Oti, Bono East, North East, Savannah, Western North, Ahafo. | Add all 16 regions. |
| SH-2 | MED | [shared/middlewares/serviceTrust.js](kelmah-backend/shared/middlewares/serviceTrust.js#L30) | `JSON.parse()` on `x-authenticated-user` header without try/catch. Malformed JSON crashes the request. | Wrap in try/catch, return 401 on failure. |
| SH-3 | LOW | [shared/models/QuickJob.js](kelmah-backend/shared/models/QuickJob.js) | 524-line schema embedding escrow, disputes, GPS tracking, quotes. Hard to maintain. | Consider splitting sub-schemas. |

---

## PART 3: FRONTEND — CONFIGURATION & ENTRY POINTS

### Critical (4)

| ID | File | Issue | Fix |
|----|------|-------|-----|
| FE-C1 | [vite.config.js](kelmah-frontend/vite.config.js#L24) | `define: { 'process.env': process.env }` injects **EVERY** Node env var (secrets, DB URIs, tokens) into client bundle. Visible in browser. | Remove. Only define `'process.env.NODE_ENV': JSON.stringify(...)`. Use `import.meta.env` for Vite vars. |
| FE-C2 | [src/config/env.js](kelmah-frontend/src/config/env.js#L85) | References undefined variables `USE_MOCK_DATA`, `API_BASE_URL`, `WS_URL`. Causes `ReferenceError` at runtime. Also duplicate import of `getApiBaseUrl` (line 8 + 29). | Define variables properly. Remove duplicate import. |
| FE-C3 | [src/config/index.js](kelmah-frontend/src/config/index.js#L15) | Imports from `'./config'` which doesn't exist. Build-time module-not-found error. | Redirect to correct source (`./constants` or `./environment`). |
| FE-C4 | [src/App.jsx](kelmah-frontend/src/App.jsx#L61) | `AUTH_CONFIG.TOKEN_KEY` is `undefined` (config uses `tokenKey` camelCase). `secureStorage.getItem(undefined)` returns null — **auth verification silently fails on every app mount**. | Use `AUTH_CONFIG.tokenKey`. |

### High (5)

| ID | File | Issue | Fix |
|----|------|-------|-----|
| FE-H1 | [src/services/websocketService.js](kelmah-frontend/src/services/websocketService.js#L2) | Imports from `'../store/store'` — file doesn't exist (actual: `store/index.js` with default export). | Change to `import store from '../store'`. |
| FE-H2 | [src/store/slices/notificationSlice.js](kelmah-frontend/src/store/slices/notificationSlice.js#L25) | `onlineUsers: new Set()` in Redux state. Non-serializable. Breaks DevTools and persistence. | Use `onlineUsers: []` or `onlineUsers: {}`. |
| FE-H3 | [src/routes/config.jsx](kelmah-frontend/src/routes/config.jsx#L196) | No role-based route protection. `RoleProtectedRoute` is defined but never used. Any authenticated user can access any dashboard (worker → hirer, etc.). | Apply `RoleProtectedRoute` with `allowedRoles` to hirer/worker routes. |
| FE-H4 | [src/config/services.js](kelmah-frontend/src/config/services.js#L104) | `getServicePath('AUTH_SERVICE', '/auth/register')` produces `/auth/auth/register` (double prefix). All AUTH endpoints in `services.js` have wrong paths. | Fix: either remove prefix from switch case OR from path argument. |
| FE-H5 | Multiple config files | 3+ independent `API_ENDPOINTS` definitions (`environment.js`, `services.js`, `constants.js`) with conflicting paths. No single source of truth. | Consolidate to one file. Delete redundant definitions. |

### Medium (9)

| ID | File | Issue | Fix |
|----|------|-------|-----|
| FE-M1 | [src/config/securityConfig.js](kelmah-frontend/src/config/securityConfig.js#L75) | CSP allows `'unsafe-inline'` for scripts, effectively defeating XSS protection. | Use nonce-based or hash-based CSP. |
| FE-M2 | [src/main.jsx](kelmah-frontend/src/main.jsx#L105) | Error fallback shows `error.message` and `error.stack` to all users including production. | Show generic message in production; technical details only in dev. |
| FE-M3 | [src/config/securityConfig.js](kelmah-frontend/src/config/securityConfig.js#L80) | `'connect-src': getAllowedConnectSrc` assigns function reference, not resolved value. CSP never actually applied. | Resolve async function at init and store result. |
| FE-M4 | [src/config/securityConfig.js](kelmah-frontend/src/config/securityConfig.js#L105) | Uses `process.env.NODE_ENV` throughout instead of `import.meta.env.MODE`. Relies on dangerous vite define. | Use `import.meta.env.MODE` / `import.meta.env.PROD`. |
| FE-M5 | [src/config/environment.js](kelmah-frontend/src/config/environment.js) ↔ [dynamicConfig.js](kelmah-frontend/src/config/dynamicConfig.js) | Circular dependency — each imports from the other. May cause undefined on first access depending on init order. | Extract shared primitives into a third file. |
| FE-M6 | [vercel.json (root)](vercel.json) + [kelmah-frontend/vercel.json](kelmah-frontend/vercel.json) | Duplicate Vercel configs. Changes must be made in two places. | Determine active project root and delete the other. |
| FE-M7 | [src/config/queryClient.js](kelmah-frontend/src/config/queryClient.js#L7) | `cacheTime` renamed to `gcTime` in React Query v5. Silently ignored if using v5+. | Rename to `gcTime`. |
| FE-M8 | [src/config/navLinks.js](kelmah-frontend/src/config/navLinks.js#L6) | Links to `/map` and `/premium` routes that don't exist in route config — users hit 404. | Add routes or remove nav links. |
| FE-M9 | [src/services/apiClient.js](kelmah-frontend/src/services/apiClient.js#L138) | Retry logic wraps all HTTP methods including POST/PUT/DELETE. Retrying mutations can cause duplicates (double payments, etc.). | Only auto-retry GET requests. |

### Low (5)

| ID | File | Issue | Fix |
|----|------|-------|-----|
| FE-L1 | [src/config/dynamicConfig.js](kelmah-frontend/src/config/dynamicConfig.js) | Still references ngrok terminology (`getCurrentNgrokUrl`, `kelmah_ngrok_url`) despite LocalTunnel migration. | Rename to tunnel-agnostic names. |
| FE-L2 | [src/routes/ChunkErrorBoundary.jsx](kelmah-frontend/src/routes/ChunkErrorBoundary.jsx) | Purpose-built for chunk load failures but never imported or used. | Wire into lazy-loaded Suspense boundaries. |
| FE-L3 | [src/routes/RouteSkeleton.jsx](kelmah-frontend/src/routes/RouteSkeleton.jsx) | Dead code — never imported. | Use as Suspense fallback or delete. |
| FE-L4 | [src/config/apiEndpoints.js](kelmah-frontend/src/config/apiEndpoints.js) | Empty file. | Delete. |
| FE-L5 | [src/main.jsx](kelmah-frontend/src/main.jsx#L17) | `console.log('🔧 Main.jsx v1.0.4 ...')` runs in all environments. | Wrap in `if (import.meta.env.DEV)`. |

---

## PART 4: FRONTEND — MODULES

### Auth Module

| ID | Sev | File | Issue | Fix |
|----|-----|------|-------|-----|
| MOD-A1 | **CRIT** | [AuthForm.jsx](kelmah-frontend/src/modules/auth/components/AuthForm.jsx#L17) | `useDispatch` used but never imported. Import path resolves to non-existent file. `handleSubmit` calls `login()`/`register()` but variables are `loginUser`/`registerUser`. **Component crashes on render.** | Fix imports and function names. |
| MOD-A2 | **CRIT** | [MfaSetupPage.jsx](kelmah-frontend/src/modules/auth/pages/MfaSetupPage.jsx#L42) | `return` followed by `const mfaContent = (...)` — dead code. Component renders nothing. | Restructure return statement. |
| MOD-A3 | HIGH | [registrationDraftStorage.js](kelmah-frontend/src/modules/auth/utils/registrationDraftStorage.js#L1) | Default vs named import mismatch on `secureStorage`. Import silently becomes `undefined`. | Change to `import { secureStorage } from '...'`. |
| MOD-A4 | HIGH | [Login.jsx](kelmah-frontend/src/modules/auth/components/login/Login.jsx) | 798 lines in a single component. Contains API health check, mobile detection, many console.logs. | Extract into hooks and sub-components. |
| MOD-A5 | HIGH | [Register.jsx](kelmah-frontend/src/modules/auth/components/register/Register.jsx#L110) | ~10 individual `watch()` calls each causing re-render on every keystroke in a 1233-line component. | Use `watch([...fields])` or `useWatch`. Split into sub-components. |
| MOD-A6 | MED | [tokenUtils.js](kelmah-frontend/src/modules/auth/utils/tokenUtils.js) | `atob()` for JWT decoding — crashes on base64url tokens (with `_` or `-`). Same pattern in `authService.js` and `dashboardService.js`. | Use base64url-safe decoder or `jwt-decode` library. |
| MOD-A7 | MED | [authSlice.js](kelmah-frontend/src/modules/auth/services/authSlice.js) | `logoutUser` catch block does `localStorage.removeItem(tokenKey)` but try block does `secureStorage.clear()`. Inconsistent clearing on failure. | Unify both paths. |

### Common Module

| ID | Sev | File | Issue | Fix |
|----|-----|------|-------|-----|
| MOD-C1 | HIGH | [appSlice.js](kelmah-frontend/src/modules/common/services/appSlice.js) | `updateUserProfile` thunk defined but no `extraReducers` handlers. Dispatching updates nothing. `error.response.data` throws on network errors. | Add fulfilled/rejected handlers. Use optional chaining. |
| MOD-C2 | HIGH | [appSlice.js](kelmah-frontend/src/modules/common/services/appSlice.js) | Duplicate `user` state overlapping with `authSlice.user`. Two slices managing same user data = sync issues. | Remove user from appSlice. Single source in authSlice. |
| MOD-C3 | MED | [UserCard.jsx](kelmah-frontend/src/modules/common/components/cards/UserCard.jsx#L210) | "Message" and "View Profile" buttons have no `onClick` handlers — non-functional decoration. | Wire up navigation handlers. |
| MOD-C4 | MED | [SearchForm.jsx](kelmah-frontend/src/modules/common/components/forms/SearchForm.jsx) | No debouncing on search input. Every keystroke fires callback. | Add ~300ms debounce. |
| MOD-C5 | MED | [fileUploadService.js](kelmah-frontend/src/modules/common/services/fileUploadService.js#L65) | Error says "10MB" but `MAX_FILE_SIZE` is 25MB. | Use dynamic value in message. |

### Home Module

| ID | Sev | File | Issue | Fix |
|----|-----|------|-------|-----|
| MOD-HM1 | MED | [HomePage.jsx](kelmah-frontend/src/modules/home/pages/HomePage.jsx) | 627-line file with all sub-components inline. | Extract sections into separate files. |
| MOD-HM2 | MED | [HomePage.jsx](kelmah-frontend/src/modules/home/pages/HomePage.jsx) | Search navigates to `/search` which may not exist. Should be `/jobs?search=...`. | Verify route or change path. |
| MOD-HM3 | MED | [HomePage.jsx](kelmah-frontend/src/modules/home/pages/HomePage.jsx) | Hardcoded metrics "5,000+ verified workers" — misleading if real numbers differ. | Fetch from API or add disclaimer. |

### Jobs Module

| ID | Sev | File | Issue | Fix |
|----|-----|------|-------|-----|
| MOD-J1 | **CRIT** | [JobsPage.jsx](kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx) | **2,430 lines** — contains styled-components, keyframes, static data, sub-components, entire page in one file. Unmaintainable. | Split into 5+ files. |
| MOD-J2 | HIGH | [JobDetailsPage.jsx](kelmah-frontend/src/modules/jobs/pages/JobDetailsPage.jsx#L155) | "Sign in to apply" navigates to `/auth/login` but login route is `/login`. Users hit 404. | Change to `/login`. |
| MOD-J3 | HIGH | [JobDetailsPage.jsx](kelmah-frontend/src/modules/jobs/pages/JobDetailsPage.jsx) | "Save job" only toggles local state `setSaved(!saved)` — never calls API. Lost on refresh. | Call `jobsService.saveJob()`/`unsaveJob()`. |
| MOD-J4 | HIGH | [jobsService.js](kelmah-frontend/src/modules/jobs/services/jobsService.js) | `getJobs` silently returns `{ jobs: [], total: 0 }` on error. Caller never knows request failed. | Re-throw error. |
| MOD-J5 | MED | [useJobs.js](kelmah-frontend/src/modules/jobs/hooks/useJobs.js#L66) | `dispatch(setJobs((prev) => [...prev, newJob]))` passes callback to Redux action — actions expect plain objects. | Read state, merge, dispatch array. |
| MOD-J6 | MED | [JobsPage.jsx](kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx) | Custom `ErrorBoundary` is a functional component — error boundaries MUST be class components. Won't catch render errors. | Use class-based ErrorBoundary. |
| MOD-J7 | MED | [JobCreationForm.jsx](kelmah-frontend/src/modules/jobs/components/job-creation/JobCreationForm.jsx#L190) | Client sets `createdAt`/`updatedAt` on payload. Malicious client could backdate. | Let server set timestamps. |
| MOD-J8 | MED | [JobCreationForm.jsx](kelmah-frontend/src/modules/jobs/components/job-creation/JobCreationForm.jsx) | Only 10 of 16 Ghana regions listed (missing Bono East, Ahafo, etc.). | Add all 16 regions. |

### Dashboard Module

| ID | Sev | File | Issue | Fix |
|----|-----|------|-------|-----|
| MOD-D1 | HIGH | [useDashboard.js](kelmah-frontend/src/modules/dashboard/hooks/useDashboard.js#L8) | Imports from `'../../../store/slices/dashboardSlice'` which doesn't exist. Also imports non-existent action names. **Crashes at import time.** | Fix path to `../services/dashboardSlice` and match actual exports. |
| MOD-D2 | HIGH | [dashboardSlice.js](kelmah-frontend/src/modules/dashboard/services/dashboardSlice.js) | Failed API calls show random `Math.random()` mock data. Users see fake randomized metrics with no indication. | Show error state. Never randomize fallback data. |
| MOD-D3 | MED | [dashboardService.js](kelmah-frontend/src/modules/dashboard/services/dashboardService.js) | `getQuickActions()`, `getNotificationsSummary()`, `getRealTimeStats()` all internally call `getOverview()`. Loading all dashboard data fires ~36+ redundant HTTP requests. | Cache `getOverview()` result or call once. |
| MOD-D4 | MED | [hirerService.js](kelmah-frontend/src/modules/dashboard/services/hirerService.js) | Every method silently falls back to mock data on any error. Users never see error states. | Return `{ mock: true }` flag or show error state. |

### Layout Module

| ID | Sev | File | Issue | Fix |
|----|-----|------|-------|-----|
| MOD-L1 | HIGH | [Header.jsx](kelmah-frontend/src/modules/layout/components/Header.jsx) | **1,625 lines** — 12+ styled components, 3 menus, complex scroll handling, worker status, theme management. | Extract 5+ sub-components and hooks. |
| MOD-L2 | HIGH | [Header.jsx](kelmah-frontend/src/modules/layout/components/Header.jsx#L704) | Messages badge shows notification count instead of unread messages count. Wired to wrong data source. | Import messaging context and use `messagesUnreadCount`. |
| MOD-L3 | MED | [Header.jsx](kelmah-frontend/src/modules/layout/components/Header.jsx) | Debug logging uses `process.env.NODE_ENV` but Vite uses `import.meta.env.MODE`. May log in production. | Change to `import.meta.env.DEV`. |
| MOD-L4 | MED | [MobileNav.jsx](kelmah-frontend/src/modules/layout/components/MobileNav.jsx) | Same bug as MOD-L2 — notification badge for Messages shows notification count. | Wire to message-specific unread count. |
| MOD-L5 | LOW | [Footer.jsx](kelmah-frontend/src/modules/layout/components/Footer.jsx) | All social links point to `#`. Several footer links to non-existent routes. | Replace with real URLs or remove. |

### Worker Module

| ID | Sev | File | Issue | Fix |
|----|-----|------|-------|-----|
| MOD-W1 | HIGH | [EarningsTracker.jsx](kelmah-frontend/src/modules/worker/components/EarningsTracker.jsx) | Uses hardcoded `mockEarningsData` ($45.25/hr, $15,250.75 total) instead of API. | Fetch real data via `earningsService`. |
| MOD-W2 | HIGH | [SkillsAssessment.jsx](kelmah-frontend/src/modules/worker/components/SkillsAssessment.jsx) | Stub component — only text "Skills assessment will be implemented here." Referenced in navigation. | Implement or remove nav item. |
| MOD-W3 | HIGH | [EnhancedJobCard.jsx](kelmah-frontend/src/modules/worker/components/EnhancedJobCard.jsx) | Bid buttons render but submission logic is commented out/returns early. Non-functional UI. | Implement or hide bid UI. |
| MOD-W4 | MED | [ProposalBuilder.jsx](kelmah-frontend/src/modules/worker/components/ProposalBuilder.jsx) | No input validation on submit. Empty title, negative rates allowed. | Add validation + inline errors. |
| MOD-W5 | MED | [CertificateManager.jsx](kelmah-frontend/src/modules/worker/components/CertificateManager.jsx#L54) | Upload handler has no try/catch, no file type/size validation. Silent failure. | Add validation, try/catch, user feedback. |

### Hirer Module

| ID | Sev | File | Issue | Fix |
|----|-----|------|-------|-----|
| MOD-HR1 | HIGH | [ApplicationManagementPage.jsx](kelmah-frontend/src/modules/hirer/pages/ApplicationManagementPage.jsx#L105) | `Promise.all()` over ALL active jobs — 50+ concurrent API calls. Risk of rate limiting/overload. | Paginate. Load applications for selected job only. |
| MOD-HR2 | HIGH | [hirerService.js](kelmah-frontend/src/modules/hirer/services/hirerService.js#L161) | `getApplications()` is a no-op — logs warning and returns `[]`. Never makes API call. | Implement endpoint or remove. |
| MOD-HR3 | MED | [JobCreationWizard.jsx](kelmah-frontend/src/modules/hirer/components/JobCreationWizard.jsx) | No form validation. All fields can be empty. Start date after end date allowed. | Add per-step validation. |

### Messaging Module

| ID | Sev | File | Issue | Fix |
|----|-----|------|-------|-----|
| MOD-MSG1 | **CRIT** | [chatService.js](kelmah-frontend/src/modules/messaging/services/chatService.js), [messagingService.js](kelmah-frontend/src/modules/messaging/services/messagingService.js), [messageService.js](kelmah-frontend/src/modules/messaging/services/messageService.js) | **Three overlapping service files** with conflicting implementations. `messageService.js` exports `{}`. | Consolidate to single `messagingService.js`. Delete other two. |
| MOD-MSG2 | HIGH | [chatService.js](kelmah-frontend/src/modules/messaging/services/chatService.js#L38) | Path `/messaging/messages/conversations/${id}/messages` has double `messages` segment. Backend route doesn't match. | Fix to `/messaging/conversations/${id}/messages`. |
| MOD-MSG3 | MED | [MessageInput.jsx](kelmah-frontend/src/modules/messaging/components/common/MessageInput.jsx#L33) | Imports file constants but hardcodes own 10MB limit inline. | Use imported constants consistently. |

### Payment Module

| ID | Sev | File | Issue | Fix |
|----|-----|------|-------|-----|
| MOD-P1 | **CRIT** | [paymentService.js](kelmah-frontend/src/modules/payment/services/paymentService.js#L14) | `getWallet()` returns **hardcoded fake wallet with GHS 2,540.50 balance** on API error. Users see fabricated financial data. | Throw error. Show error state. Never return fake financial data. |
| MOD-P2 | HIGH | [EscrowManager.jsx](kelmah-frontend/src/modules/payment/components/EscrowManager.jsx#L51) | Client generates escrow reference IDs with `ESC_${Date.now()}_${Math.random()}`. Collision risk, no server validation. | Let backend generate references. |
| MOD-P3 | HIGH | [EscrowManager.jsx](kelmah-frontend/src/modules/payment/components/EscrowManager.jsx#L97) | Paystack init uses `email: form.email || 'test@example.com'`. Production receipts could go to test email. | Make email required. Default to authenticated user's email. |
| MOD-P4 | MED | [usePayments.js](kelmah-frontend/src/modules/payment/hooks/usePayments.js#L109) | `dispatch(setPayments((prev) => [...prev, payment]))` — passes function to Redux action. Won't behave as expected. | Dispatch plain array payload. |

### Notifications Module

| ID | Sev | File | Issue | Fix |
|----|-----|------|-------|-----|
| MOD-N1 | HIGH | [notificationService.js](kelmah-frontend/src/modules/notifications/services/notificationService.js#L17) | `connect()` doesn't clean up previous socket. `this.isConnected` not initialized in constructor. Duplicate connections possible. | Init `this.isConnected = false` in constructor. Disconnect before reconnecting. |
| MOD-N2 | MED | [NotificationsPage.jsx](kelmah-frontend/src/modules/notifications/pages/NotificationsPage.jsx#L155) | Double-filtering: API returns filtered data, then same filters applied client-side. | Remove redundant client-side filter. |

### Contracts Module

| ID | Sev | File | Issue | Fix |
|----|-----|------|-------|-----|
| MOD-CT1 | **CRIT** | [ContractsPage.jsx](kelmah-frontend/src/modules/contracts/pages/ContractsPage.jsx) | Uses `MOCK_CONTRACTS` hardcoded array instead of `contractSlice.fetchContracts()`. Users see fake contracts. | Replace with Redux selectors and dispatched thunk. |
| MOD-CT2 | MED | [ContractDetailsPage.jsx](kelmah-frontend/src/modules/contracts/pages/ContractDetailsPage.jsx#L104) | No loading skeleton/spinner while data loads. Appears broken. | Add loading indicator. |

### Quick Jobs Module

| ID | Sev | File | Issue | Fix |
|----|-----|------|-------|-----|
| MOD-Q1 | **CRIT** | [quickJobService.js](kelmah-frontend/src/modules/quickjobs/services/quickJobService.js#L7) | `API_BASE = '/api/quick-jobs'` but `api` client already prefixes `/api`. All calls go to `/api/api/quick-jobs` → 404. | Change to `/quick-jobs`. |
| MOD-Q2 | MED | [quickJobService.js](kelmah-frontend/src/modules/quickjobs/services/quickJobService.js#L6) | Uses default import `import api from '...'` while convention is named `import { api } from '...'`. May get wrong object. | Use named import. |

### Other Modules

| ID | Sev | Module | Issue | Fix |
|----|-----|--------|-------|-----|
| MOD-PR1 | HIGH | Premium | [PremiumPage.jsx](kelmah-frontend/src/modules/premium/pages/PremiumPage.jsx) shows USD ($9.99) instead of GH₵ for Ghana platform. | Change to GH₵ currency. |
| MOD-MAP1 | HIGH | Map | [ProfessionalMapPage.jsx](kelmah-frontend/src/modules/map/pages/ProfessionalMapPage.jsx) uses entirely mock data with hardcoded Accra coordinates. No real API calls. | Integrate `mapService.js`. |
| MOD-R1 | HIGH | Reviews | [ReviewsPage.jsx](kelmah-frontend/src/modules/reviews/pages/ReviewsPage.jsx#L77) has duplicate `loading`/`isLoading` state variables updated together. | Use single loading state. |
| MOD-S1 | MED | Search | [SearchContext.jsx](kelmah-frontend/src/modules/search/contexts/SearchContext.jsx#L52) stale closure over filters in `performSearch` useCallback. May cause infinite loops. | Use `useRef` for current filters. |
| MOD-S2 | MED | Settings | [settingsService.js](kelmah-frontend/src/modules/settings/services/settingsService.js#L31) hardcodes `theme: 'light'`, `language: 'en'` ignoring backend/localStorage. | Fetch actual user preferences. |
| MOD-SCH1 | MED | Scheduling | [TempSchedulingPage.jsx](kelmah-frontend/src/modules/scheduling/pages/TempSchedulingPage.jsx) pointless wrapper. All service methods silently return empty on error. | Remove wrapper. Re-throw errors. |
| MOD-AD1 | HIGH | Admin | [PayoutQueuePage.jsx](kelmah-frontend/src/modules/admin/pages/PayoutQueuePage.jsx) uses raw `<table>` HTML with inline styles. Doesn't match MUI design system. | Refactor to MUI Table components. |
| MOD-AD2 | MED | Admin | [UserManagement.jsx](kelmah-frontend/src/modules/admin/components/common/UserManagement.jsx#L119) filters client-side after server fetch. Pagination total doesn't match. | Pass filters to API for server-side filtering. |
| MOD-CAL1 | LOW | Calendar | [calendarSlice.js](kelmah-frontend/src/modules/calendar/services/calendarSlice.js#L16) logs all events to console in production. | Gate behind dev check. |

---

## PART 5: CROSS-CUTTING ISSUES

### Architecture

| ID | Sev | Issue | Impact | Fix |
|----|-----|-------|--------|-----|
| XC-1 | **CRIT** | Auth state managed via 3 patterns: `useAuth()` hook (AuthContext), `useSelector(state.auth)` (Redux), `useAuthCheck()`. Different modules use different patterns. | Auth data stale/out-of-sync across pages. | Standardize to single `useAuth()` that reads from Redux internally. |
| XC-2 | HIGH | Two server-state patterns: Redux Toolkit slices AND React Query (`@tanstack/react-query`) for same data (Jobs module uses both `jobSlice` + `useJobsQuery`). | Cache inconsistencies, doubled fetches. | Use React Query for server state, Redux for client state only. |
| XC-3 | HIGH | `process.env.NODE_ENV` used in Vite project across 10+ files. Vite uses `import.meta.env`. Currently works only because of dangerous `'process.env': process.env` define. | If S-1 fixed (must be), all these files break. | Replace all with `import.meta.env.DEV`/`import.meta.env.PROD`. |
| XC-4 | HIGH | 30+ service/component files have `console.log`/`warn`/`error` in production paths. | PII leak, performance overhead, noisy browser console. | Centralized logger utility with production silencing. |
| XC-5 | MED | Inconsistent error handling: some services throw, others return `null`, others return empty arrays, others return mock data. No contract. | Callers can't distinguish "no data" from "error". | Standardize: always throw on error. Let calling layer handle. |
| XC-6 | MED | Module cross-imports: Layout ← notifications/messaging, Dashboard ← worker/hirer, Jobs ← notifications/search. No dependency graph enforcement. | Removing/restructuring any module cascades breakage. | Document dependency directions. Extract shared to `common`. |
| XC-7 | MED | 3 duplicate JWT decode implementations using `atob()` — all vulnerable to base64url tokens. | Token decode crashes on valid JWT tokens. | Create single `decodeJwtPayload()` in `common/utils`. |

### Dead Code

| ID | Sev | File | Reason |
|----|-----|------|--------|
| DC-1 | LOW | [routes/index.js](kelmah-backend/api-gateway/routes/index.js) | Never imported |
| DC-2 | LOW | [proxy/auth.proxy.js](kelmah-backend/api-gateway/proxy/auth.proxy.js) + 3 others | Empty files |
| DC-3 | LOW | [config/serviceConfig.js](kelmah-backend/api-gateway/config/serviceConfig.js) | Empty file |
| DC-4 | LOW | [proxy/job.proxy.js](kelmah-backend/api-gateway/proxy/job.proxy.js) | Never imported |
| DC-5 | LOW | [apiEndpoints.js](kelmah-frontend/src/config/apiEndpoints.js) | Empty file |
| DC-6 | LOW | [RouteSkeleton.jsx](kelmah-frontend/src/routes/RouteSkeleton.jsx) | Never imported |
| DC-7 | LOW | [ChunkErrorBoundary.jsx](kelmah-frontend/src/routes/ChunkErrorBoundary.jsx) | Never imported |
| DC-8 | LOW | [ServiceNavigation.jsx](kelmah-frontend/src/modules/common/components/common/ServiceNavigation.jsx) | Stub — renders text only |
| DC-9 | LOW | [WorkAnimation.jsx](kelmah-frontend/src/modules/common/components/animations/WorkAnimation.jsx) | Invisible Box |
| DC-10 | LOW | [animations/index.js](kelmah-frontend/src/modules/common/components/animations/index.js) | Empty TODO |
| DC-11 | LOW | [controls/index.js](kelmah-frontend/src/modules/common/components/controls/index.js) | Empty TODO |
| DC-12 | LOW | [messageService.js](kelmah-frontend/src/modules/messaging/services/messageService.js) | Exports `{}` |
| DC-13 | LOW | [PaymentContext.jsx.new](kelmah-frontend/src/modules/payment/contexts/PaymentContext.jsx.new) | Empty file |
| DC-14 | LOW | [TempSchedulingPage.jsx](kelmah-frontend/src/modules/scheduling/pages/TempSchedulingPage.jsx) | Pointless wrapper |

---

## PART 6: SECURITY SUMMARY (OWASP Alignment)

| OWASP Category | Findings | Severity | Key Issue |
|----------------|----------|----------|-----------|
| **A01:2021 Broken Access Control** | 6 | CRITICAL-HIGH | Review service fully unprotected (REV-1/2), User service getAllUsers/cleanup no auth (USER-1/2), No role-based frontend routing (FE-H3), Payment admin no role check (PAY-6) |
| **A02:2021 Cryptographic Failures** | 3 | CRITICAL | JWT secret `Deladem_Tony` (GW-C7), Internal API key guessable (GW-C2), Token in localStorage vulnerable to XSS |
| **A03:2021 Injection** | 2 | HIGH | Unsanitized regex in MongoDB query (MSG-1), No gateway-level input sanitization applied (GW-H10) |
| **A04:2021 Insecure Design** | 4 | HIGH | Mock financial data on error (MOD-P1), Client-generated payment references (MOD-P2), Account lock after bcrypt (AUTH-1) |
| **A05:2021 Security Misconfiguration** | 5 | CRITICAL-HIGH | All secrets in repo (GW-C1), CSP `unsafe-inline` (FE-M1), `process.env` exposed to client (FE-C1), Health endpoint leaks URLs (GW-C5) |
| **A06:2021 Vulnerable Components** | 1 | MED | Deprecated Mongoose methods `.remove()` (MSG-2/3) |
| **A07:2021 Auth Failures** | 3 | CRITICAL-HIGH | Token key mismatch breaks auth (FE-C4), Old refresh tokens survive password change (AUTH-3), Double auth (GW-C6) |
| **A08:2021 Data Integrity** | 2 | MED | Client sets timestamps (MOD-J7), Random mock data displayed as real (MOD-D2) |
| **A09:2021 Logging Failures** | 3 | MED | Console.log instead of logger (GW-M3), JWT payload logged (MSG-5), Debug body logging in production (USER-5) |
| **A10:2021 SSRF** | 1 | MED | Notification proxy bypasses service discovery (GW-H4) |

---

## PART 7: PERFORMANCE SUMMARY

| Area | Issue | Impact | Fix Effort |
|------|-------|--------|------------|
| API Gateway proxy leak | New proxy per request × 10+ routes | OOM crash under load | **Medium** — pre-create proxies at startup |
| User cache unbounded | `Map` grows without eviction | Slow memory leak | **Low** — swap to `lru-cache` |
| Dashboard 36× API calls | Every dashboard load fires 36+ HTTP requests via redundant `getOverview()` calls | Extreme server load, slow page load | **Medium** — cache `getOverview()` result |
| No `.lean()` on reads | Full Mongoose document hydration for read-only queries | 2-3× memory per query | **Low** — add `.lean()` |
| No axios keepAlive | New TCP connection per gateway→service request | Connection overhead, port exhaustion | **Low** — shared agent |
| Register.jsx 10× watch | Re-renders on every keystroke in 1233-line component | UI jank on registration form | **Medium** — batched watch |
| ApplicationManagement | `Promise.all()` across all jobs | 50+ concurrent requests | **Medium** — paginate |
| No debounce on search | Every keystroke fires callback | Excessive API calls | **Low** — add 300ms debounce |

---

## PART 8: RECOMMENDED FIX PRIORITY

### Phase 1: Security Emergency (Do This Week)
1. Remove `.env` from git, rotate ALL secrets, add to `.gitignore`
2. Fix `vite.config.js` — remove `'process.env': process.env`
3. Uncomment review service authentication middleware
4. Fix payment service Sequelize→Mongoose syntax
5. Add auth to user service `getAllUsers` and `database/cleanup`
6. Fix `AUTH_CONFIG.TOKEN_KEY` → `AUTH_CONFIG.tokenKey`
7. Escape regex in messaging search query

### Phase 2: Broken Features (This Sprint)
1. Fix quick jobs doubled API path `/api/api/quick-jobs`
2. Fix broken frontend imports (websocketService, useDashboard, AuthForm, MfaSetupPage)
3. Remove fake financial data fallback in paymentService
4. Replace mock data in ContractsPage with real API
5. Fix job details login redirect `/auth/login` → `/login`
6. Fix messaging service file consolidation (3 → 1)
7. Add role-based route protection

### Phase 3: Stability (Next Sprint)
1. Fix API Gateway proxy-per-request memory leak
2. Add LRU cache for user auth cache
3. Dashboard: eliminate 36× redundant API calls
4. Standardize error response format (backend + frontend)
5. Replace all `process.env.NODE_ENV` with `import.meta.env` in frontend
6. Fix double authentication on payment/messaging routes
7. Apply `sanitizeRequest` middleware globally

### Phase 4: Quality (Ongoing)
1. Split oversized components (Header 1625L, JobsPage 2430L, Register 1233L)
2. Remove all 14 dead code files
3. Consolidate 3 API endpoint definitions to 1
4. Standardize auth access pattern across all modules
5. Replace `console.log` with logger utility across codebase
6. Add missing loading/error/empty states to all pages
7. Add all 16 Ghana regions to location enums

---

## Appendix: File Heat Map

Files ranked by issue density (most problematic first):

| File | Issues | Highest Severity |
|------|--------|-----------------|
| `api-gateway/server.js` | 18 | CRITICAL |
| `api-gateway/.env` | 7 | CRITICAL |
| `payment.controller.js` (backend) | 4 | CRITICAL |
| `review.routes.js` (backend) | 2 | CRITICAL |
| `JobsPage.jsx` (frontend) | 6 | CRITICAL |
| `Header.jsx` (frontend) | 4 | HIGH |
| `auth.controller.js` (backend) | 6 | HIGH |
| `vite.config.js` (frontend) | 1 | CRITICAL |
| `App.jsx` (frontend) | 1 | CRITICAL |
| `paymentService.js` (frontend) | 1 | CRITICAL |
| `quickJobService.js` (frontend) | 2 | CRITICAL |
| `env.js` (frontend config) | 3 | CRITICAL |
| `useDashboard.js` (frontend) | 2 | HIGH |
| `dashboardSlice.js` (frontend) | 2 | HIGH |
| `request-validator.js` (gateway) | 6 | HIGH |
| `user.routes.js` (backend) | 4 | HIGH |

---

*End of audit. 146 findings total across the full Kelmah platform.*
