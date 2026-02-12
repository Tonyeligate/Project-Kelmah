# Kelmah Platform — Super Documentation (Finalized Decisions)

**Purpose**: Single authoritative record of the key product + engineering decisions made during Kelmah’s early build and later consolidation, with references back to the original documents where each decision was proposed/confirmed.

**Evidence & audit trail**
- Evidence extract (high-signal sections across archives): [DataAnalysisExpert/kelmah_decisions_extracted_2026-02-11.md](../DataAnalysisExpert/kelmah_decisions_extracted_2026-02-11.md)
- Full manifest (all files read during evidence build): [DataAnalysisExpert/kelmah_docs_manifest_2026-02-11.txt](../DataAnalysisExpert/kelmah_docs_manifest_2026-02-11.txt)
- Extraction outcome (from evidence footer): 2,139 files read OK, 80 unreadable/binary, 1,368 extracted blocks

**Authority order (when sources conflict)**
1. Explicitly “consolidated/complete/verified” spec-kit decisions
2. Current operational instructions and protocols (spec-kit)
3. Audits (problem statements + recommendations)
4. Kelmaholddocs/old-docs diagrams and early plans (historical intent)

> This document states the *final* decision. If an older document disagrees, it is marked **Superseded** and kept only as historical context.

---

## 1) Product Vision & Operating Principles

### 1.1 Mission (Final)
Kelmah connects vocational workers (carpenters, masons, plumbers, electricians, etc.) with hirers through a trustworthy marketplace, emphasizing speed-to-hire, transparency, and Ghana-context UX.

**Primary sources**
- [backup/root_cleanup_20260201/Kelmaholddocs/old-docs/Kelma.txt](../backup/root_cleanup_20260201/Kelmaholddocs/old-docs/Kelma.txt)
- [backup/root_cleanup_20260201/Kelmaholddocs/backup-files/BACKUP-DOCUMENTATION.md](../backup/root_cleanup_20260201/Kelmaholddocs/backup-files/BACKUP-DOCUMENTATION.md)

### 1.2 UX principles (Final)
- Simple, low-friction workflows (users may have limited formal education).
- Mobile-first behavior and resilience (slow networks, intermittent connectivity).

**Primary sources**
- [spec-kit/.github/copilot-instructions.md](.github/copilot-instructions.md)

---

## 2) Platform Architecture (Backend)

### 2.1 Architecture pattern (Final)
**API Gateway + microservices**: Frontend calls only the gateway; gateway proxies to service-specific microservices.

**Primary sources**
- [spec-kit/.github/copilot-instructions.md](.github/copilot-instructions.md)
- [spec-kit/kelmah-backend/docs/API-DOCUMENTATION.md](kelmah-backend/docs/API-DOCUMENTATION.md)

**Superseded / historical**
- Older diagrams show early port assignments (3001–3006) and extra infra (RabbitMQ/Redis) as defaults.
- Final consolidated dev ports are 5000–5006, and extra infra is optional future scaling.

**Primary sources (historical)**
- [backup/root_cleanup_20260201/Kelmaholddocs/old-docs/diagrams/04-microservices-architecture.md](../backup/root_cleanup_20260201/Kelmaholddocs/old-docs/diagrams/04-microservices-architecture.md)

### 2.2 Service boundaries (Final)
- Clean service separation: avoid direct code imports across services.
- Shared resources live under `kelmah-backend/shared/`.

**Primary sources**
- [spec-kit/.github/copilot-instructions.md](.github/copilot-instructions.md)

### 2.3 Service-to-service communication (Final)
**Final**: Do not introduce a tightly-coupled synchronous “service mesh” as a default requirement. Prefer gateway-owned validation and/or asynchronous patterns when cross-service coordination is needed.

**Superseded / historical**
- Older audit notes proposed a “service mesh” style inter-service communication as “required”.

**Primary sources**
- [backup/root_cleanup_20260201/audit-reports/CRITICAL_BACKEND_ISSUES_COMPREHENSIVE.md](../backup/root_cleanup_20260201/audit-reports/CRITICAL_BACKEND_ISSUES_COMPREHENSIVE.md)
- [spec-kit/.github/copilot-instructions.md](.github/copilot-instructions.md)

### 2.4 Database standard (Final)
- MongoDB/Mongoose across services.
- No SQL/Sequelize remnants in active services.

**Primary sources**
- [spec-kit/.github/copilot-instructions.md](.github/copilot-instructions.md)
- [backup/root_cleanup_20260201/Kelmaholddocs/reports/MONGODB-MIGRATION-COMPLETE.md](../backup/root_cleanup_20260201/Kelmaholddocs/reports/MONGODB-MIGRATION-COMPLETE.md)

### 2.5 Shared models standard (Final)
- Shared Mongoose schemas centralized in `kelmah-backend/shared/models/`.
- Services import models via their service `models/index.js` (which re-exports shared models).

**Primary sources**
- [spec-kit/.github/copilot-instructions.md](.github/copilot-instructions.md)

### 2.6 Local dev ports & run workflow (Final)
- Gateway runs on localhost:5000.
- Services run locally on 5001–5006.
- Standard start scripts are used (gateway + individual services), and LocalTunnel provides external access when needed.

**Primary sources**
- [spec-kit/.github/copilot-instructions.md](.github/copilot-instructions.md)

### 2.7 Shared utilities & middleware placement (Final)
- Cross-cutting middleware/utilities must live under `kelmah-backend/shared/`.
- Services consume shared resources via relative imports pointing to shared (no cross-service imports).

**Primary sources**
- [spec-kit/.github/copilot-instructions.md](.github/copilot-instructions.md)

---

## 2A) Backend Service Contract (How Backend Components Are Supposed to Work)

This section defines backend “ownership boundaries” and the required behavior of gateway + services.

### 2A.1 Gateway is the only public entry (Final)
- Frontend must call the API Gateway via `/api/*`.
- Gateway proxies to microservices, handles CORS, rate limiting, and standardized error responses.

**Gateway-authenticated user context (Final)**
- When the gateway authenticates a request, it forwards user context to downstream services via:
	- `x-authenticated-user`: JSON string of the user object
	- `x-auth-source`: `api-gateway`
- Downstream services that expect `req.user` MUST use `verifyGatewayRequest` (service trust middleware) rather than re-validating JWTs locally.

**Primary sources**
- [spec-kit/.github/copilot-instructions.md](.github/copilot-instructions.md)
- [spec-kit/kelmah-backend/docs/API-DOCUMENTATION.md](kelmah-backend/docs/API-DOCUMENTATION.md)
- [kelmah-backend/shared/middlewares/serviceTrust.js](../kelmah-backend/shared/middlewares/serviceTrust.js)
- [kelmah-backend/api-gateway/routes/job.routes.js](../kelmah-backend/api-gateway/routes/job.routes.js)
- [kelmah-backend/services/job-service/routes/job.routes.js](../kelmah-backend/services/job-service/routes/job.routes.js)

### 2A.2 Service ownership boundaries (Final)
Each service owns its domain data + domain rules:

- **Auth service**: registration/login, tokens, refresh/rotation, MFA/OAuth (if enabled)
- **User service**: profiles, worker/hirer attributes, portfolio, availability, public profile reads
- **Job service**: job CRUD, applications, contracts lifecycle hooks (job side)
- **Messaging service**: conversations/messages, socket events, attachments
- **Payment service**: wallets, transactions, escrow, Ghana MoMo + Paystack/Stripe integrations
- **Review service**: reviews/ratings, moderation, analytics (review domain)

**Primary sources**
- [spec-kit/.github/copilot-instructions.md](.github/copilot-instructions.md)
- [backup/root_cleanup_20260201/Kelmaholddocs/old-docs/KELMAH SYSTEM ARCHITECTURE.txt](../backup/root_cleanup_20260201/Kelmaholddocs/old-docs/KELMAH%20SYSTEM%20ARCHITECTURE.txt)

### 2A.3 Common controller/service behavior (Final)
All controllers must:
- Validate input and return consistent response envelopes
- Enforce auth/role middleware appropriately
- Avoid cross-service imports; use shared utilities only

**Primary sources**
- [spec-kit/.github/copilot-instructions.md](.github/copilot-instructions.md)
- [spec-kit/kelmah-backend/docs/API-DOCUMENTATION.md](kelmah-backend/docs/API-DOCUMENTATION.md)

### 2A.4 Health + readiness behavior (Final)
Each service must expose:
- `/health`
- `/health/ready`
- `/health/live`

Gateway should aggregate health into a single view for diagnostics.

**Primary sources**
- [spec-kit/.github/copilot-instructions.md](.github/copilot-instructions.md)

### 2A.5 Scheduling backend placement (Final)
Scheduling is cross-cutting (jobs + contracts + messaging), but the simplest stable ownership is:
- Store appointment records under **user-service** (availability/profile-adjacent)
- Reference job/contract IDs as foreign keys (ObjectIds) without cross-service DB joins
- Validate references at gateway or via safe, optional lookup calls

**Primary sources**
- [kelmah-backend/services/user-service/server.js](../kelmah-backend/services/user-service/server.js)
- [kelmah-frontend/src/modules/scheduling/services/schedulingService.js](../kelmah-frontend/src/modules/scheduling/services/schedulingService.js)

### 2A.6 Premium/subscriptions backend placement (Final)
Subscriptions are payment-coupled, so ownership should be:
- **payment-service** stores subscription state + billing events
- Gateway exposes a single read endpoint for “current entitlements”
- Frontend gates features based on entitlements

**Primary sources**
- [kelmah-frontend/src/modules/premium/pages/PremiumPage.jsx](../kelmah-frontend/src/modules/premium/pages/PremiumPage.jsx)
- [backup/root_cleanup_20260201/Kelmaholddocs/old-docs/Chat history.txt](../backup/root_cleanup_20260201/Kelmaholddocs/old-docs/Chat%20history.txt)

---

## 3) API Design Standards

### 3.1 REST design (Final)
- Plural resource naming; no verbs in routes.
- Specific routes before parameterized routes.
- Consistent status codes.

**Primary sources**
- [spec-kit/.github/copilot-instructions.md](.github/copilot-instructions.md)
- [spec-kit/kelmah-backend/docs/API-DOCUMENTATION.md](kelmah-backend/docs/API-DOCUMENTATION.md)

### 3.2 Response shape (Final)
- Consistent `{ success, data, message?, meta? }` on success.
- Consistent `{ success: false, error: { message, code, details? } }` on error.

**Primary sources**
- [spec-kit/kelmah-backend/docs/API-DOCUMENTATION.md](kelmah-backend/docs/API-DOCUMENTATION.md)

### 3.3 Route specificity order (Final)
Routes are ordered from most specific to least specific (literal paths before `/:id`) to prevent accidental shadowing.

**Primary sources**
- [spec-kit/.github/copilot-instructions.md](.github/copilot-instructions.md)

### 3.4 Canonical Public API Surface (Gateway) — verified from code (Final)

This is the *effective* public API surface exposed by the API Gateway today. Frontend calls MUST target these `/api/*` routes (never services directly).

**Gateway mounts (top-level)**
- `/api/auth/*`
- `/api/users/*`
- `/api/workers/*` (alias into user-service workers)
- `/api/jobs/*`
- `/api/search/*` (job-service search proxy)
- `/api/quick-jobs/*` (quick-hire system; proxies into job-service)
- `/api/payments/*`
- `/api/messages/*` and `/api/messaging/*` (both mounted for compatibility)
- `/api/notifications/*` (manual proxy to messaging-service)
- `/api/conversations/*` (direct proxy to messaging-service)
- `/api/webhooks/*` (gateway webhook proxy; forwards to payment-service)
- `/socket.io/*` (WebSocket proxy)

**Auth (selected endpoints)**
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/verify-email/:token`
- `POST /api/auth/refresh-token` *(canonical refresh)*
- `POST /api/auth/refresh` *(alias)*
- `GET /api/auth/verify` *(protected)*
- `POST /api/auth/logout` *(protected)*
- `GET /api/auth/me` *(protected)*

**Users / Workers / Profile / Settings (selected endpoints)**
- Workers (public read, protected write depending on endpoint):
	- `GET /api/workers` *(public list)*
	- `GET /api/workers/search` *(public search; supports `query`, `location`, `skills`, `minRating`, `maxRate`, `latitude`, `longitude`, `radius`, `page`, `limit`, `sortBy`)*
	- `GET /api/workers/:id` *(public detail)*
	- `PUT /api/workers/:id` *(protected — gateway trust)*
	- `GET /api/workers/:id/availability` *(public read via optional gateway verification)*
	- `GET /api/users/workers/:workerId/portfolio` *(public read)*
	- `GET /api/profile/workers/:workerId/portfolio` *(public read; profile router)*
	- `POST /api/profile/portfolio` *(protected create; profile router)*
	- `GET /api/users/workers/:workerId/certificates` *(public read via optional gateway verification)*
- User profile (protected):
	- `GET /api/users/profile`
	- `PUT /api/users/profile`
	- `GET /api/users/profile/statistics`
	- `GET /api/users/profile/activity`
- Settings (protected write, public-safe read):
	- `GET /api/settings`
	- `PUT /api/settings`
	- `GET /api/settings/notifications`
	- `PUT /api/settings/notifications`
	- `GET /api/settings/privacy`
	- `PUT /api/settings/privacy`
	- `PUT /api/settings/language`
	- `PUT /api/settings/theme`

**Jobs (selected endpoints)**
- `GET /api/jobs` *(list + filters via query params)*
- `GET /api/jobs/search` *(search + filters via query params)*
- `GET /api/jobs/categories`
- `GET /api/jobs/suggestions`
- `GET /api/jobs/stats`
- `GET /api/jobs/location` *(geo-search)*
- `GET /api/jobs/contracts`
- `GET /api/jobs/contracts/:id`
- `POST /api/jobs/contracts/:id/disputes` *(protected)*
- `GET /api/jobs/:id` *(details)*
- `POST /api/jobs` *(protected)*
- `PUT /api/jobs/:id` *(protected)*
- `DELETE /api/jobs/:id` *(protected)*
- `POST /api/jobs/:id/apply` *(protected)*
- `PUT /api/jobs/:id/status` *(protected — see mismatch note below)*

**Messaging (selected endpoints)**
- `GET /api/messages/conversations`
- `POST /api/messages/conversations`
- `GET /api/messages/conversations/:conversationId/messages`
- `POST /api/messages/conversations/:conversationId/messages`
- `POST /api/messages` *(send message)*
- `GET /api/messages/search`
- `PUT /api/messages/:messageId/read`
- `PUT /api/messages/conversations/:conversationId/read`
- `GET /api/notifications` *(notifications API hosted by messaging-service)*
- `GET /api/notifications/unread/count`
- `PATCH /api/notifications/:notificationId/read`
- `PATCH /api/notifications/read/all`
- `DELETE /api/notifications/:notificationId`
- `DELETE /api/notifications/clear-all`
- `GET /api/notifications/preferences`
- `PUT /api/notifications/preferences`

**Payments (selected endpoints)**
- `GET /api/payments/wallet`
- `GET /api/payments/wallet/balance`
- `POST /api/payments/wallet/deposit`
- `POST /api/payments/wallet/withdraw`
- `GET /api/payments/methods`
- `POST /api/payments/methods`
- `PUT /api/payments/methods/:methodId` *(see mismatch note below; service uses PATCH)*
- `DELETE /api/payments/methods/:methodId`
- `GET /api/payments/transactions`
- `GET /api/payments/transactions/history` *(alias)*
- `GET /api/payments/escrows` *(alias for compatibility)*
- `GET /api/payments/escrow` *(canonical singular)*
- `POST /api/payments/jobs/:jobId/escrow`
- `POST /api/payments/jobs/:jobId/release`
- `POST /api/payments/jobs/:jobId/refund`
- `GET /api/payments/subscriptions`
- `GET /api/payments/bills`
- `POST /api/payments/bills/:billId/pay`
- `POST /api/webhooks/stripe` *(public; signature-verified by payment-service)*
- `POST /api/webhooks/paystack` *(public; signature-verified by payment-service)*

**Reviews & ratings (selected endpoints)**
- `POST /api/reviews` *(protected)*
- `GET /api/reviews/worker/:workerId` *(public)*
- `GET /api/reviews/job/:jobId` *(public)*
- `GET /api/reviews/user/:userId` *(public)*
- `GET /api/reviews/:reviewId` *(public)*
- `PUT /api/reviews/:reviewId/response` *(protected)*
- `POST /api/reviews/:reviewId/helpful` *(protected)*
- `POST /api/reviews/:reviewId/report` *(protected)*
- `GET /api/reviews/analytics` *(public through gateway allow-list today)*
- `PUT /api/reviews/:reviewId/moderate` *(protected; review-service also exposes this)*
- `GET /api/ratings/worker/:workerId` *(public)*
- `GET /api/ratings/worker/:workerId/signals` *(public)*
- `GET /api/admin/reviews/queue` *(admin-only; review-service admin router)*
- `POST /api/admin/reviews/:id/moderate` *(admin-only; review-service admin router)*

**Primary sources**
- [kelmah-backend/api-gateway/server.js](../kelmah-backend/api-gateway/server.js)
- [kelmah-backend/api-gateway/routes/auth.routes.js](../kelmah-backend/api-gateway/routes/auth.routes.js)
- [kelmah-backend/api-gateway/routes/job.routes.js](../kelmah-backend/api-gateway/routes/job.routes.js)
- [kelmah-backend/api-gateway/routes/messaging.routes.js](../kelmah-backend/api-gateway/routes/messaging.routes.js)
- [kelmah-backend/api-gateway/routes/payment.routes.js](../kelmah-backend/api-gateway/routes/payment.routes.js)
- [kelmah-backend/services/user-service/routes/user.routes.js](../kelmah-backend/services/user-service/routes/user.routes.js)
- [kelmah-backend/services/user-service/controllers/worker.controller.js](../kelmah-backend/services/user-service/controllers/worker.controller.js)
- [kelmah-backend/services/user-service/routes/profile.routes.js](../kelmah-backend/services/user-service/routes/profile.routes.js)
- [kelmah-backend/services/user-service/routes/settings.routes.js](../kelmah-backend/services/user-service/routes/settings.routes.js)

### 3.5 API Alignment Matrix (Current vs Required) (Final)

These are the highest-impact “contract mismatches” that cause 404s/405s or silent failures. Fixing them is mandatory before restructuring.

**Mismatch 1 — Job status update method**
- **Gateway currently exposes**: `PUT /api/jobs/:id/status`
- **Job service currently implements**: `PATCH /api/jobs/:id/status`
- **Required final**: Either
	- change gateway to accept `PATCH` (and forward `PATCH` upstream), **or**
	- add a `PUT` alias in job-service that delegates to the same controller.

**Mismatch 2 — Messaging route families (compatibility)**
- Gateway mounts the same router at both `/api/messages/*` and `/api/messaging/*`.
- **Required final**: frontend standardizes on *one* family (recommended: `/api/messages/*`) and keep the other as a compatibility alias until fully migrated.

**Mismatch 3 — Worker geo-search route**
- **Frontend map module currently calls**: `GET /api/workers/search/location?latitude=...&longitude=...&radius=...`
- **User service currently implements**: `GET /api/users/workers/search` *(supports `latitude`, `longitude`, `radius` as query params)*
- **Required final**: either
	- change frontend to call `GET /api/workers/search` (no `/location` suffix), **or**
	- add a backend alias route `GET /api/users/workers/search/location` that delegates to the same handler.

**Primary sources**
- [kelmah-backend/api-gateway/routes/job.routes.js](../kelmah-backend/api-gateway/routes/job.routes.js)
- [kelmah-backend/services/job-service/routes/job.routes.js](../kelmah-backend/services/job-service/routes/job.routes.js)
- [kelmah-backend/api-gateway/server.js](../kelmah-backend/api-gateway/server.js)
- [kelmah-backend/api-gateway/routes/messaging.routes.js](../kelmah-backend/api-gateway/routes/messaging.routes.js)
- [kelmah-frontend/src/modules/map/services/mapService.js](../kelmah-frontend/src/modules/map/services/mapService.js)
- [kelmah-backend/services/user-service/routes/user.routes.js](../kelmah-backend/services/user-service/routes/user.routes.js)
- [kelmah-backend/services/user-service/controllers/worker.controller.js](../kelmah-backend/services/user-service/controllers/worker.controller.js)

**Mismatch 4 — Contracts: update/sign/milestone endpoints**
- **Frontend contracts module calls** endpoints like:
	- `PUT /api/jobs/contracts/:id` *(update contract)*
	- `PUT /api/jobs/contracts/:contractId/milestones/:milestoneId/approve` *(approve milestone)*
- **Job service currently exposes** only:
	- `GET /api/jobs/contracts` *(currently returns mock data)*
	- `GET /api/jobs/contracts/:id`
	- `POST /api/jobs/contracts/:id/disputes`
- **Required final**: either implement the missing contract mutation endpoints in job-service (recommended), or refactor the frontend contracts module to only use the implemented surface until backend completion.

**Mismatch 5 — Milestones standalone API**
- **Frontend milestoneService calls**: `/api/milestones/*`.
- **Gateway currently exposes**: no `/api/milestones` router.
- **Required final**: either
	- move milestone operations under contracts (`/api/jobs/contracts/:id/milestones/*`), **or**
	- expose a gateway `/api/milestones/*` router and implement corresponding service endpoints.

**Mismatch 6 — Payments: wallet endpoints exposed by gateway do not exist in payment-service** ✅ FIXED 2026-02-12
- **Root cause**: Gateway payment routes exposed balance/deposit/withdraw but payment-service wallet controller only had getWallet/createOrUpdateWallet.
- **Fix applied**: Added `getBalance`, `deposit`, and `withdraw` controller methods in wallet.controller.js using the Wallet model's existing `addFunds`/`deductFunds` helpers. Added corresponding routes (`GET /balance`, `POST /deposit`, `POST /withdraw`) in wallet.routes.js.
- **Files changed**: `kelmah-backend/services/payment-service/controllers/wallet.controller.js`, `kelmah-backend/services/payment-service/routes/wallet.routes.js`

**Mismatch 7 — Payments: payment method update uses PUT at gateway but PATCH in payment-service** ✅ FIXED 2026-02-12
- **Root cause**: Gateway sends PUT but payment-service only had a PATCH route.
- **Fix applied**: Added `router.put("/:paymentMethodId", paymentMethodController.updatePaymentMethod)` as a PUT alias alongside the existing PATCH route.
- **Files changed**: `kelmah-backend/services/payment-service/routes/paymentMethod.routes.js`

**Mismatch 8 — Webhooks: gateway validation headers + body parsing break provider signature verification** ✅ FIXED 2026-02-12
- **Root cause**: express.json() at the gateway consumed the raw body before proxying, and validateWebhook checked wrong headers (x-webhook-signature instead of stripe-signature/x-paystack-signature) and faked req.rawBody = JSON.stringify(req.body).
- **Fix applied**: Mounted POST /api/webhooks/stripe, POST /api/webhooks/paystack BEFORE the body parser in api-gateway/server.js so raw bytes stream to payment-service. Updated validateWebhook in request-validator.js to check correct provider headers and removed the fake rawBody.
- **Files changed**: kelmah-backend/api-gateway/server.js, kelmah-backend/api-gateway/middlewares/request-validator.js

**Mismatch 9 — QuickJobs: job-service exposes a public Paystack webhook but gateway requires auth for all /api/quick-jobs** ✅ FIXED 2026-02-12
- **Root cause**: Gateway mounts `/api/quick-jobs` with blanket `authenticate` middleware, blocking Paystack's unauthenticated callback to `POST /api/quick-jobs/payment/webhook`.
- **Fix applied**: Mounted `POST /api/quick-jobs/payment/webhook` BEFORE the body parser (and BEFORE the authenticated `/api/quick-jobs` catch-all) in `api-gateway/server.js`, with no auth middleware, proxying raw bytes to job-service.
- **Files changed**: `kelmah-backend/api-gateway/server.js`

**Mismatch 10 — Review eligibility endpoint** ✅ FIXED 2026-02-12
- **Root cause**: The `checkEligibility` controller existed in review.controller.js and was mounted in server.js (line 281), but was missing from review.routes.js.
- **Fix applied**: Added `router.get('/worker/:workerId/eligibility', verifyGatewayRequest, reviewController.checkEligibility)` to review.routes.js BEFORE the generic `/worker/:workerId` route (correct specificity order).
- **Files changed**: `kelmah-backend/services/review-service/routes/review.routes.js`

**Mismatch 11 — Premium/subscriptions: gateway exposes endpoints but payment-service has no subscription routes** ✅ FIXED 2026-02-12
- **Root cause**: Gateway proxied `/api/payments/subscriptions/*` to payment-service which had no matching routes (404).
- **Fix applied**: Created `subscription.routes.js` with stub handlers (GET list returns empty + available tiers; POST/PUT/DELETE return 501 with clear "coming soon" messages). Mounted in payment-service server.js at `/api/payments/subscriptions`.
- **Files changed**: `kelmah-backend/services/payment-service/routes/subscription.routes.js` (new), `kelmah-backend/services/payment-service/server.js`

---

## 4) Authentication & Authorization

### 4.1 Central auth at gateway (Final)
- Authentication is centralized at the API gateway.
- Services trust gateway-authenticated requests (gateway trust middleware).

**Primary sources**
- [spec-kit/.github/copilot-instructions.md](.github/copilot-instructions.md)

### 4.2 Token handling & client behavior (Final)
- JWT tokens are stored via the `secureStorage` utility.
- Axios interceptors attach tokens and handle refresh behavior.
- Socket authentication passes token via connection auth.

**Primary sources**
- [spec-kit/.github/copilot-instructions.md](.github/copilot-instructions.md)

---

## 5) Frontend Architecture

## 5A) Frontend Runtime (How the App Boots)

### 5A.1 Entry points & providers (Final)
Kelmah’s frontend starts in `main.jsx` and wraps the app with providers in this order:
- Redux store provider
- React Query client provider
- React Router `BrowserRouter`
- `SnackbarProvider` (toasts)
- Error boundary (crash isolation)
- Helmet provider (meta tags)
- Notifications + Messaging context providers

**Primary sources**
- [kelmah-frontend/src/main.jsx](../kelmah-frontend/src/main.jsx)

### 5A.2 Theme bootstrapping (Final)
Theme is pre-applied in `index.html` before React mounts to avoid “flash of wrong theme”. This must preserve the black/gold/white brand.

**Primary sources**
- [kelmah-frontend/index.html](../kelmah-frontend/index.html)
- [kelmah-frontend/src/App.jsx](../kelmah-frontend/src/App.jsx)

### 5A.3 Error handling policy (Final)
- A global error boundary exists; pages should fail gracefully (show UI fallback) rather than blank screens.
- When backend is unreachable or waking from sleep, UI must show a friendly warning and remain navigable.

**Primary sources**
- [kelmah-frontend/src/main.jsx](../kelmah-frontend/src/main.jsx)
- [kelmah-frontend/src/App.jsx](../kelmah-frontend/src/App.jsx)
- [spec-kit/.github/copilot-instructions.md](.github/copilot-instructions.md)

---

## 5B) Frontend Module Contract (How Components Are Supposed to Work)

This section is the “rules of the road” for frontend components so the app stays maintainable during restructuring.

### 5B.1 Directory contract (Final)
Kelmah uses domain-driven modules under `kelmah-frontend/src/modules/`.

Each domain module should contain:
- `pages/`: route-level components (compose UI, trigger data fetching)
- `components/`: presentational and domain widgets
- `services/`: API calls + Redux slices/thunks (where applicable)
- `contexts/`: contextual state only when Redux is not appropriate
- `hooks/`: reusable domain hooks
- `utils/`: pure helpers/transforms

**Primary sources**
- [spec-kit/.github/copilot-instructions.md](.github/copilot-instructions.md)
- [backup/root_cleanup_20260201/Kelmaholddocs/planning-docs/DOMAIN-DRIVEN-DESIGN.md](../backup/root_cleanup_20260201/Kelmaholddocs/planning-docs/DOMAIN-DRIVEN-DESIGN.md)

### 5B.2 Data flow contract (Final)
All interactive features follow the same flow:

1) UI event (click/submit/change)
2) Handler in page/component
3) State update (Redux thunk OR local state OR context)
4) Service call (API client)
5) Backend endpoint through API Gateway
6) Response normalized into `{ success, data, message?, meta? }`
7) UI renders success/loading/error states

**Primary sources**
- [spec-kit/.github/copilot-instructions.md](.github/copilot-instructions.md)

### 5B.3 API client contract (Final)
- Frontend must call backend through a centralized HTTP client.
- Calls should use the gateway base URL (`/api` in production rewrites).
- Interceptors attach auth and handle refresh.

**Primary sources**
- [kelmah-frontend/src/services/apiClient.js](../kelmah-frontend/src/services/apiClient.js)
- [spec-kit/.github/copilot-instructions.md](.github/copilot-instructions.md)

### 5B.4 Loading / error UX contract (Final)
Every page that hits the network must include:
- A loading state (skeleton/spinner)
- A useful error state (message + retry option when feasible)
- Disabled buttons during mutations (avoid double submit)

**Primary sources**
- [backup/root_cleanup_20260201/audit-reports/FRONTEND_MODULES_AUDIT_COMPREHENSIVE.md](../backup/root_cleanup_20260201/audit-reports/FRONTEND_MODULES_AUDIT_COMPREHENSIVE.md)

---

### 5.1 Modular, domain-driven modules (Final)
- Frontend is organized under `kelmah-frontend/src/modules/` by domain.
- Each module has `components/`, `pages/`, `services/`, `hooks/`, `utils/`.

**Primary sources**
- [spec-kit/.github/copilot-instructions.md](.github/copilot-instructions.md)
- [backup/root_cleanup_20260201/Kelmaholddocs/planning-docs/DOMAIN-DRIVEN-DESIGN.md](../backup/root_cleanup_20260201/Kelmaholddocs/planning-docs/DOMAIN-DRIVEN-DESIGN.md)
- [backup/root_cleanup_20260201/Kelmaholddocs/old-docs/diagrams/02-frontend-architecture.md](../backup/root_cleanup_20260201/Kelmaholddocs/old-docs/diagrams/02-frontend-architecture.md)

### 5.2 Service layer standardization (Final)
- Use a consistent service/client pattern for API access.
- Centralize error handling and avoid mixed patterns.

**Primary sources**
- [backup/root_cleanup_20260201/audit-reports/FRONTEND_MODULES_AUDIT_COMPREHENSIVE.md](../backup/root_cleanup_20260201/audit-reports/FRONTEND_MODULES_AUDIT_COMPREHENSIVE.md)
- [spec-kit/audits/frontend/2025-10-03_dynamic_config_audit.md](audits/frontend/2025-10-03_dynamic_config_audit.md)

### 5.3 State management pattern (Final)
- Redux is the default for domain state (module slices + global store composition).
- Use Redux Toolkit async thunks (`createAsyncThunk`) for API-backed flows.
- Context is allowed for localized tree state and cross-cutting concerns.

**Primary sources**
- [spec-kit/.github/copilot-instructions.md](.github/copilot-instructions.md)
- [backup/root_cleanup_20260201/Kelmaholddocs/old-docs/diagrams/02-frontend-architecture.md](../backup/root_cleanup_20260201/Kelmaholddocs/old-docs/diagrams/02-frontend-architecture.md)

---

## 5C) Frontend Feature Definitions (Concrete Behavior)

This section defines “what must happen in the UI” for the main platform areas.

### 5C.1 Authentication (Final behavior)
**User story**: A user can register/login, stay logged in securely, and access role-protected pages.

**UI chain (expected)**
- Login/Register pages collect credentials → dispatch auth thunk
- On success: store tokens via `secureStorage`, update Redux auth slice, redirect to correct dashboard
- Protected pages: gate via `ProtectedRoute`, show a loader while verification is running

**Backend contract (via gateway)**
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/refresh-token` (token refresh; body: `{ "refreshToken": "..." }`)
- `POST /api/auth/refresh` (alias)
- `GET /api/auth/verify` (session verification) *(if implemented; otherwise `verifyAuth` must degrade gracefully)*

**Primary sources**
- [kelmah-frontend/src/routes/config.jsx](../kelmah-frontend/src/routes/config.jsx)
- [kelmah-frontend/src/services/apiClient.js](../kelmah-frontend/src/services/apiClient.js)
- [spec-kit/.github/copilot-instructions.md](.github/copilot-instructions.md)
- [backup/root_cleanup_20260201/Kelmaholddocs/old-docs/Auth structure.txt](../backup/root_cleanup_20260201/Kelmaholddocs/old-docs/Auth%20structure.txt)
- [backup/root_cleanup_20260201/Kelmaholddocs/old-docs/Auth structure2.txt](../backup/root_cleanup_20260201/Kelmaholddocs/old-docs/Auth%20structure2.txt)
- [kelmah-backend/api-gateway/routes/auth.routes.js](../kelmah-backend/api-gateway/routes/auth.routes.js)
- [kelmah-backend/services/auth-service/routes/auth.routes.js](../kelmah-backend/services/auth-service/routes/auth.routes.js)

### 5C.2 Jobs (Final behavior)
**User story**: Hirers can post/manage jobs; workers can browse/apply; both can view details.

**UI expectations**
- Jobs list supports search/filter/pagination (where available)
- Job details renders full job info and actions (apply/save/withdraw) depending on role/state
- All job mutations show progress + clear error messages

**Canonical job statuses (Final)**
- Allowed: `draft`, `open`, `in-progress`, `completed`, `cancelled`
- UI should treat these as the only source-of-truth values (no title-cased variants like `Open`).

**Job status update endpoint (Final)**
- Backend canonical implementation is `PATCH /api/jobs/:id/status`.
- Gateway currently exposes `PUT /api/jobs/:id/status` for compatibility; this must be aligned (see API Alignment Matrix).

**Primary sources**
- [kelmah-frontend/src/routes/config.jsx](../kelmah-frontend/src/routes/config.jsx)
- [spec-kit/kelmah-backend/docs/API-DOCUMENTATION.md](kelmah-backend/docs/API-DOCUMENTATION.md)
- [kelmah-backend/shared/models/Job.js](../kelmah-backend/shared/models/Job.js)
- [kelmah-backend/services/job-service/validations/job.validation.js](../kelmah-backend/services/job-service/validations/job.validation.js)
- [kelmah-backend/services/job-service/routes/job.routes.js](../kelmah-backend/services/job-service/routes/job.routes.js)

### 5C.3 Messaging (Final behavior)
**User story**: Workers and hirers can chat in real time, with read receipts and REST fallback.

**UI expectations**
- Conversations list + message thread view
- Send message instantly (optimistic UI), reconcile with server ack
- Typing indicator + unread counts + read receipts (where supported)

**Primary sources**
- [backup/root_cleanup_20260201/Kelmaholddocs/old-docs/Messaging flow.txt](../backup/root_cleanup_20260201/Kelmaholddocs/old-docs/Messaging%20flow.txt)
- [backup/root_cleanup_20260201/Kelmaholddocs/old-docs/Masterplan.txt](../backup/root_cleanup_20260201/Kelmaholddocs/old-docs/Masterplan.txt)

### 5C.4 Payments & escrow (Final behavior)
**User story**: Hirers fund escrow; workers receive payouts after milestones; history is transparent.

**UI expectations**
- Wallet balance + transaction history
- Escrow create/fund/release/refund
- Clear states for “pending/processing/failed/success”

**Backend contract (implemented today — payment-service, via gateway)**
- Payment methods (saved instruments):
	- `GET /api/payments/methods`
	- `POST /api/payments/methods`
	- `PATCH /api/payments/methods/:paymentMethodId`
	- `DELETE /api/payments/methods/:paymentMethodId`
	- `PUT /api/payments/methods/:paymentMethodId/default` *(also supports `PATCH` alias)*
	- Supported `type` values include `credit_card`, `bank_account`, `paypal`, `mobile_money`.
- Wallet (current implemented surface):
	- `GET /api/payments/wallet`
	- `POST /api/payments/wallet`
	- `GET /api/payments/wallet/transactions`
	- Payment method ops also exist under the wallet router (`/api/payments/wallet/payment-methods/*`).
- Transactions (naming compatibility):
	- `POST /api/payments/transactions`
	- `GET /api/payments/transactions/history`
	- `POST /api/payments/transactions/reconcile`
- Escrow + milestones:
	- `GET /api/payments/escrows`
	- `POST /api/payments/escrows` *(creates a pending escrow record)*
	- `POST /api/payments/escrows/:escrowId/release`
	- `POST /api/payments/escrows/:escrowId/refund`
	- `POST /api/payments/escrows/:escrowId/milestones`
	- `POST /api/payments/escrows/:escrowId/milestones/:milestoneId/complete`
	- `POST /api/payments/escrows/:escrowId/milestones/:milestoneId/release`
- Ghana provider-specific endpoints (thin integration controllers):
	- `POST /api/payments/mtn-momo/request-to-pay`, `GET /api/payments/mtn-momo/status/:referenceId`, `POST /api/payments/mtn-momo/validate`
	- `POST /api/payments/vodafone-cash/request-to-pay`, `GET /api/payments/vodafone-cash/status/:referenceId`
	- `POST /api/payments/airteltigo/request-to-pay`, `GET /api/payments/airteltigo/status/:referenceId`
	- `POST /api/payments/paystack/initialize`, `GET /api/payments/paystack/verify/:reference`
- Payment intent creation (Stripe/PayPal abstraction):
	- `POST /api/payments/create-payment-intent` requires `idempotencyKey` and persists idempotency state (Mongo, optional Redis fast-path).
- Bills:
	- `GET /api/payments/bills`
	- `POST /api/payments/bills/:billId/pay`

**Webhook contract (implemented today — via gateway proxy)**
- `POST /api/webhooks/stripe` and `POST /api/webhooks/paystack` are mounted at the payment-service *before* JSON parsing to preserve raw payload for signature verification.
- Gateway currently performs webhook validation that does not match Stripe/Paystack header conventions and does not preserve raw bytes (see API Alignment Matrix).

**Subscriptions / Premium billing (current reality)**
- Gateway lists `/api/payments/subscriptions`, but payment-service does not expose subscription routes yet; PremiumPage is currently UI-only.

**Primary sources**
- [backup/root_cleanup_20260201/Kelmaholddocs/old-docs/paymentflow.txt](../backup/root_cleanup_20260201/Kelmaholddocs/old-docs/paymentflow.txt)
- [kelmah-backend/api-gateway/routes/payment.routes.js](../kelmah-backend/api-gateway/routes/payment.routes.js)
- [kelmah-backend/api-gateway/middlewares/request-validator.js](../kelmah-backend/api-gateway/middlewares/request-validator.js)
- [kelmah-backend/api-gateway/server.js](../kelmah-backend/api-gateway/server.js)
- [kelmah-backend/services/payment-service/server.js](../kelmah-backend/services/payment-service/server.js)
- [kelmah-backend/services/payment-service/routes/payments.routes.js](../kelmah-backend/services/payment-service/routes/payments.routes.js)
- [kelmah-backend/services/payment-service/routes/wallet.routes.js](../kelmah-backend/services/payment-service/routes/wallet.routes.js)
- [kelmah-backend/services/payment-service/routes/paymentMethod.routes.js](../kelmah-backend/services/payment-service/routes/paymentMethod.routes.js)
- [kelmah-backend/services/payment-service/routes/transactions.routes.js](../kelmah-backend/services/payment-service/routes/transactions.routes.js)
- [kelmah-backend/services/payment-service/routes/webhooks.routes.js](../kelmah-backend/services/payment-service/routes/webhooks.routes.js)
- [kelmah-backend/services/payment-service/controllers/paymentMethod.controller.js](../kelmah-backend/services/payment-service/controllers/paymentMethod.controller.js)
- [kelmah-backend/services/payment-service/controllers/escrow.controller.js](../kelmah-backend/services/payment-service/controllers/escrow.controller.js)
- [kelmah-backend/services/payment-service/controllers/transaction.controller.js](../kelmah-backend/services/payment-service/controllers/transaction.controller.js)
- [kelmah-backend/services/payment-service/controllers/ghana.controller.js](../kelmah-backend/services/payment-service/controllers/ghana.controller.js)

### 5C.9 QuickJobs (Protected Quick-Hire) (Final behavior)
**User story**: A client can request a small urgent job, nearby workers can quote quickly, the client accepts one quote, funds escrow, then the worker tracks arrival/completion, client approves, and the payout releases; disputes can be raised/resolved.

**Frontend UI chain (implemented today)**
- QuickJobs module calls the gateway via `apiClient` with `API_BASE = '/quick-jobs'`.
- Pages:
	- Quick job request flow (3-step): describe → confirm location → urgency → submit.
	- Nearby jobs (worker view): fetch by geolocation + filters; submit quotes.
	- Tracking page (worker view): poll job; mark on-way/arrived/start/complete; cancel.

**Current frontend routing mismatches (high impact)**
- Router mounts QuickJobs under `/quick-hire/*` (protected), but the request page navigates to `/quick-job/:id` after creation.
- Tracking page cancels → navigates to `/worker/quick-jobs`, which is not a configured route.
- Backend Paystack callback URL for QuickJobs points at `/quick-job/:id/payment-callback`, while the router defines `/quick-hire/payment/:jobId`.
- Role gating mismatch: QuickHire routes are currently restricted to `worker/admin` even though the QuickJob model/controller uses `client` semantics.

These must be aligned (either adjust router aliases to match existing navigation, or refactor the module navigation to match the router).

**Backend contract (implemented today — via gateway)**
- Public webhook (provider callback):
	- `POST /api/quick-jobs/payment/webhook` *(job-service expects this to be public; gateway currently blocks it — see mismatch note)*
- Authenticated quick-job operations:
	- `GET /api/quick-jobs/nearby` *(requires `lng` + `lat` query params)*
	- `GET /api/quick-jobs/my-jobs`
	- `GET /api/quick-jobs/my-quotes`
	- `POST /api/quick-jobs` *(create)*
	- `GET /api/quick-jobs/:id` *(detail; non-owner workers only see their own quotes)*
	- Quotes:
		- `POST /api/quick-jobs/:id/quote`
		- `POST /api/quick-jobs/:id/accept-quote`
	- Payment (Paystack escrow wrapper):
		- `POST /api/quick-jobs/:id/pay`
		- `GET /api/quick-jobs/payment/verify/:reference`
		- `GET /api/quick-jobs/:id/payment-status`
		- `POST /api/quick-jobs/:id/release-payment`
		- `POST /api/quick-jobs/:id/refund`
	- Tracking/status actions:
		- `POST /api/quick-jobs/:id/on-way`, `/arrived`, `/start`, `/complete`
		- `POST /api/quick-jobs/:id/approve`
	- Disputes:
		- `POST /api/quick-jobs/:id/dispute`
		- `GET /api/quick-jobs/:id/dispute`
		- `POST /api/quick-jobs/:id/dispute/evidence`
		- `POST /api/quick-jobs/:id/dispute/resolve` *(admin-only)*
		- `GET /api/quick-jobs/disputes` *(admin-only)*
		- `GET /api/quick-jobs/disputes/stats` *(admin-only)*
	- Cancellation:
		- `POST /api/quick-jobs/:id/cancel`

**Status model (Final — source-of-truth enum)**
- QuickJob statuses include: `pending`, `quoted`, `accepted`, `funded`, `worker_on_way`, `worker_arrived`, `in_progress`, `completed`, `approved`, `disputed`, `cancelled`, `expired`.

**Implementation notes (verified)**
- QuickJobs include a geospatial `location` and support “nearby” search via coordinates.
- The create flow requires `category`, `description`, and `location` (with `coordinates`, `address`, `city`, `region`).
- Notifications to nearby workers are explicitly marked TODO in the controller (not yet wired to notifications delivery).

**Primary sources**
- [kelmah-backend/api-gateway/server.js](../kelmah-backend/api-gateway/server.js)
- [kelmah-backend/services/job-service/routes/quickJobRoutes.js](../kelmah-backend/services/job-service/routes/quickJobRoutes.js)
- [kelmah-backend/services/job-service/controllers/quickJobController.js](../kelmah-backend/services/job-service/controllers/quickJobController.js)
- [kelmah-backend/services/job-service/controllers/quickJobPaymentController.js](../kelmah-backend/services/job-service/controllers/quickJobPaymentController.js)
- [kelmah-backend/services/job-service/controllers/disputeController.js](../kelmah-backend/services/job-service/controllers/disputeController.js)
- [kelmah-backend/shared/models/QuickJob.js](../kelmah-backend/shared/models/QuickJob.js)
- [kelmah-frontend/src/modules/quickjobs/services/quickJobService.js](../kelmah-frontend/src/modules/quickjobs/services/quickJobService.js)
- [kelmah-frontend/src/modules/quickjobs/pages/QuickJobRequestPage.jsx](../kelmah-frontend/src/modules/quickjobs/pages/QuickJobRequestPage.jsx)
- [kelmah-frontend/src/modules/quickjobs/pages/NearbyJobsPage.jsx](../kelmah-frontend/src/modules/quickjobs/pages/NearbyJobsPage.jsx)
- [kelmah-frontend/src/modules/quickjobs/pages/QuickJobTrackingPage.jsx](../kelmah-frontend/src/modules/quickjobs/pages/QuickJobTrackingPage.jsx)
- [kelmah-frontend/src/routes/config.jsx](../kelmah-frontend/src/routes/config.jsx)
- [kelmah-frontend/src/modules/premium/pages/PremiumPage.jsx](../kelmah-frontend/src/modules/premium/pages/PremiumPage.jsx)

### 5C.5 Notifications (Final behavior)
**User story**: Users receive in-app notifications (and optionally email/SMS later) for key events (messages, job/application changes, contract updates, and payments).

**UI expectations (implemented today)**
- Global provider (`NotificationProvider`) is mounted at app boot.
- The provider fetches notifications on login and maintains an unread count.
- Real-time notifications arrive via Socket.IO event `notification` and are appended to the local list.
- Notifications can be marked read, marked all read, deleted, and cleared.
- Preferences can be viewed/updated via API.

**Backend contract (implemented today)**
- Notifications are hosted by **messaging-service** under `/api/notifications`.
- Gateway exposes `/api/notifications/*` and forwards authenticated user context to messaging-service.

**API calls (frontend, via apiClient)**
- `GET /api/notifications`
- `GET /api/notifications/unread/count`
- `PATCH /api/notifications/:notificationId/read`
- `PATCH /api/notifications/read/all`
- `DELETE /api/notifications/:notificationId`
- `DELETE /api/notifications/clear-all`
- `GET /api/notifications/preferences`
- `PUT /api/notifications/preferences`

**Superseded / historical**
- Older designs describe a standalone `notification-service` microservice with email/SMS templates.
- Final consolidated implementation currently centralizes notifications in messaging-service (with gateway proxy), and treats multi-channel delivery as an optional future expansion.

**Primary sources**
- [kelmah-frontend/src/main.jsx](../kelmah-frontend/src/main.jsx)
- [kelmah-frontend/src/modules/notifications/contexts/NotificationContext.jsx](../kelmah-frontend/src/modules/notifications/contexts/NotificationContext.jsx)
- [kelmah-frontend/src/modules/notifications/services/notificationService.js](../kelmah-frontend/src/modules/notifications/services/notificationService.js)
- [kelmah-backend/api-gateway/server.js](../kelmah-backend/api-gateway/server.js)
- [kelmah-backend/services/messaging-service/routes/notification.routes.js](../kelmah-backend/services/messaging-service/routes/notification.routes.js)
- [kelmah-backend/services/messaging-service/controllers/notification.controller.js](../kelmah-backend/services/messaging-service/controllers/notification.controller.js)
- [kelmah-backend/services/messaging-service/models/Notification.js](../kelmah-backend/services/messaging-service/models/Notification.js)
- [backup/root_cleanup_20260201/Kelmaholddocs/old-docs/NOTIFICATION SYSTEM .txt](../backup/root_cleanup_20260201/Kelmaholddocs/old-docs/NOTIFICATION%20SYSTEM%20.txt)

### 5C.6 Mapping / Geolocation / Tracking (Final behavior)
**User story**: Users can browse jobs (and optionally workers) on a map, search by proximity, and use Ghana-friendly location UX.

**UI expectations (implemented today)**
- Map components use Leaflet + OpenStreetMap tiles.
- Location lookup uses OpenStreetMap Nominatim endpoints for forward/reverse geocoding.
- Search page can render a `JobMapView` for map-based browsing.

**Backend contract (current + required)**
- Jobs proximity search routes exist at the gateway layer (aliases included):
	- `GET /api/jobs/search/location` *(alias)*
	- `GET /api/jobs/location` *(alias/canonical public route)*
- Worker proximity search should be performed via `GET /api/workers/search` with query params (`latitude`, `longitude`, `radius`) — not via a separate `/search/location` suffix (see mismatch note in API Alignment Matrix).

**Primary sources**
- [kelmah-frontend/src/modules/map/services/mapService.js](../kelmah-frontend/src/modules/map/services/mapService.js)
- [kelmah-frontend/src/modules/search/pages/SearchPage.jsx](../kelmah-frontend/src/modules/search/pages/SearchPage.jsx)
- [kelmah-frontend/src/modules/search/components/map/JobMapView.jsx](../kelmah-frontend/src/modules/search/components/map/JobMapView.jsx)
- [kelmah-frontend/src/config/services.js](../kelmah-frontend/src/config/services.js)
- [kelmah-backend/api-gateway/routes/job.routes.js](../kelmah-backend/api-gateway/routes/job.routes.js)
- [kelmah-backend/services/user-service/routes/user.routes.js](../kelmah-backend/services/user-service/routes/user.routes.js)
- [kelmah-backend/services/user-service/controllers/worker.controller.js](../kelmah-backend/services/user-service/controllers/worker.controller.js)
- [kelmah-frontend/src/modules/contracts/services/contractService.js](../kelmah-frontend/src/modules/contracts/services/contractService.js)
- [kelmah-frontend/src/modules/contracts/services/milestoneService.js](../kelmah-frontend/src/modules/contracts/services/milestoneService.js)
- [kelmah-backend/services/job-service/routes/job.routes.js](../kelmah-backend/services/job-service/routes/job.routes.js)
- [kelmah-backend/services/job-service/controllers/job.controller.js](../kelmah-backend/services/job-service/controllers/job.controller.js)
- [kelmah-frontend/src/modules/reviews/services/reviewService.js](../kelmah-frontend/src/modules/reviews/services/reviewService.js)
- [kelmah-backend/services/review-service/server.js](../kelmah-backend/services/review-service/server.js)
- [kelmah-backend/services/review-service/routes/review.routes.js](../kelmah-backend/services/review-service/routes/review.routes.js)
- [backup/root_cleanup_20260201/Kelmaholddocs/old-docs/MAPPING AND TRACKING SYSTEM.txt](../backup/root_cleanup_20260201/Kelmaholddocs/old-docs/MAPPING%20AND%20TRACKING%20SYSTEM.txt)

### 5C.7 Worker Discovery & Profiles (Final behavior)
**User story**: Hirers can search/browse workers, open a worker profile, and contact/hire them; workers can maintain a profile (skills, portfolio, certificates, availability).

**UI expectations**
- Worker search supports text query, trade/skills filtering, rating/price sorting, and (where enabled) geo-radius search.
- Worker profile page shows identity + skill tags, portfolio items, certificates, ratings, and an availability/status indicator.
- “Contact” / “Message” entry points create or open a conversation (messaging module) and should work without cross-module duplication.

**API calls (frontend services today)**
- Worker reads mostly call user-service through `/api/users/workers/*` (because apiClient baseURL includes `/api`):
	- `GET /api/users/workers` *(list)*
	- `GET /api/users/workers/:id` *(detail)*
	- `GET /api/users/workers/:id/skills`
	- `GET /api/users/workers/:id/portfolio`
	- `GET /api/users/workers/:id/certificates`
	- `GET /api/users/workers/:id/work-history`
	- `GET /api/users/workers/:id/availability`
- User profile reads/writes call:
	- `GET /api/users/profile`
	- `PUT /api/users/profile`
	- `GET /api/users/profile/statistics`
	- `GET /api/users/profile/activity`

**Backend contract (user-service)**
- User-service owns worker discovery and worker subresources under `/api/users/workers/*`.
- Gateway exposes worker-friendly aliases (e.g., `/api/workers/*`) but the canonical internal routes remain under `/api/users/*` in user-service.

**Primary sources**
- [kelmah-frontend/src/modules/worker/services/workerService.js](../kelmah-frontend/src/modules/worker/services/workerService.js)
- [kelmah-frontend/src/modules/profile/services/profileService.js](../kelmah-frontend/src/modules/profile/services/profileService.js)
- [kelmah-backend/services/user-service/routes/user.routes.js](../kelmah-backend/services/user-service/routes/user.routes.js)
- [kelmah-backend/services/user-service/controllers/worker.controller.js](../kelmah-backend/services/user-service/controllers/worker.controller.js)
- [backup/root_cleanup_20260201/Kelmaholddocs/old-docs/WORKER & HIRER SYSTEM WORKFLOW.txt](../backup/root_cleanup_20260201/Kelmaholddocs/old-docs/WORKER%20&%20HIRER%20SYSTEM%20WORKFLOW.txt)

### 5C.8 Settings (Final behavior)
**User story**: Users can configure preferences (notifications, privacy, language, theme) and see those preferences reflected consistently across pages.

**Current implementation note (important)**
- `user-service` settings are currently stored in an **in-memory Map** and are lost on service restart.
- Frontend `settingsService` therefore treats settings reads as “best-effort” and falls back to safe defaults.

**API calls**
- `GET /api/settings`
- `PUT /api/settings`
- `GET /api/settings/notifications`
- `PUT /api/settings/notifications`
- `GET /api/settings/privacy`
- `PUT /api/settings/privacy`
- `PUT /api/settings/language`
- `PUT /api/settings/theme`

**Primary sources**
- [kelmah-frontend/src/modules/settings/services/settingsService.js](../kelmah-frontend/src/modules/settings/services/settingsService.js)
- [kelmah-backend/services/user-service/routes/settings.routes.js](../kelmah-backend/services/user-service/routes/settings.routes.js)
- [backup/root_cleanup_20260201/Kelmaholddocs/planning-docs/PROJECT-STRUCTURE.md](../backup/root_cleanup_20260201/Kelmaholddocs/planning-docs/PROJECT-STRUCTURE.md)

### 5C.9 Contracts, Milestones, and Disputes (Final behavior)
**User story**: After a worker is selected, both parties can manage a contract, track milestones, handle approvals, and raise disputes.

**UI expectations**
- Contracts list shows active/pending/completed contracts.
- Contract details show milestones with statuses and allow a hirer to approve completed milestones.
- Disputes can be opened by either contract party with a reason and description.

**Current backend reality (important)**
- `GET /api/jobs/contracts` currently returns **mock contract data** (explicitly marked `source: 'mock-data'`).
- `GET /api/jobs/contracts/:id` returns a real Contract document (Mongo) when present.
- Disputes are implemented as `POST /api/jobs/contracts/:id/disputes` and stored as `ContractDispute`.

**Primary sources**
- [kelmah-frontend/src/modules/contracts/contexts/ContractContext.jsx](../kelmah-frontend/src/modules/contracts/contexts/ContractContext.jsx)
- [kelmah-frontend/src/modules/contracts/services/contractService.js](../kelmah-frontend/src/modules/contracts/services/contractService.js)
- [kelmah-backend/services/job-service/routes/job.routes.js](../kelmah-backend/services/job-service/routes/job.routes.js)
- [kelmah-backend/services/job-service/controllers/job.controller.js](../kelmah-backend/services/job-service/controllers/job.controller.js)
- [backup/root_cleanup_20260201/Kelmaholddocs/old-docs/WORKER & HIRER SYSTEM WORKFLOW.txt](../backup/root_cleanup_20260201/Kelmaholddocs/old-docs/WORKER%20&%20HIRER%20SYSTEM%20WORKFLOW.txt)
- [backup/root_cleanup_20260201/Kelmaholddocs/old-docs/paymentflow.txt](../backup/root_cleanup_20260201/Kelmaholddocs/old-docs/paymentflow.txt)

### 5C.10 Reviews & Ratings (Final behavior)
**User story**: After work is completed, hirers/workers can leave reviews and ratings; the platform can compute rating summaries used in discovery.

**UI expectations**
- Worker profile displays rating summary + reviews list.
- Users can submit a review, mark reviews as helpful, and report abuse.
- Workers can respond to reviews.

**Backend contract (implemented today)**
- Reviews are owned by review-service and proxied by gateway under `/api/reviews/*`.
- Rating summaries are exposed under `/api/ratings/*`.
- Moderation queue exists under `/api/admin/reviews/*` (admin-only) and review-service also supports moderation updates.

**Known mismatch**
- Frontend includes an eligibility check call (`/reviews/worker/:id/eligibility`) that is not implemented in review-service.

**Primary sources**
- [kelmah-frontend/src/modules/reviews/services/reviewService.js](../kelmah-frontend/src/modules/reviews/services/reviewService.js)
- [kelmah-backend/services/review-service/server.js](../kelmah-backend/services/review-service/server.js)
- [kelmah-backend/services/review-service/routes/review.routes.js](../kelmah-backend/services/review-service/routes/review.routes.js)
- [kelmah-backend/api-gateway/server.js](../kelmah-backend/api-gateway/server.js)

---

## 5D) Scheduling System (Defined + Mapped to Current Code)

Scheduling is an extension of messaging + contracts to formalize interview/meeting times.

### 5D.1 Key features (Final definition)
- Full-page calendar view for scheduled events
- Create, view, modify, cancel appointments
- Appointments can link to a Job and/or Contract
- Notification reminders for upcoming appointments

**Primary sources**
- [backup/root_cleanup_20260201/Kelmaholddocs/old-docs/Chat history.txt](../backup/root_cleanup_20260201/Kelmaholddocs/old-docs/Chat%20history.txt)
- [backup/root_cleanup_20260201/Kelmaholddocs/old-docs/Kelma.txt](../backup/root_cleanup_20260201/Kelmaholddocs/old-docs/Kelma.txt)

### 5D.2 Current frontend implementation (exists today)
- Page: `SchedulingPage` is already routed and implemented
- Components: calendar and appointment form components exist
- Service: `schedulingService` calls appointment endpoints

**Primary sources**
- [kelmah-frontend/src/routes/config.jsx](../kelmah-frontend/src/routes/config.jsx)
- [kelmah-frontend/src/modules/scheduling/pages/SchedulingPage.jsx](../kelmah-frontend/src/modules/scheduling/pages/SchedulingPage.jsx)
- [kelmah-frontend/src/modules/scheduling/services/schedulingService.js](../kelmah-frontend/src/modules/scheduling/services/schedulingService.js)

### 5D.3 Backend API contract (required)
The frontend currently calls these endpoints (through the centralized API client):
- `GET /api/appointments`
- `POST /api/appointments`
- `GET /api/appointments/:id`
- `PUT /api/appointments/:id`
- `DELETE /api/appointments/:id`
- `PATCH /api/appointments/:id/status`
- `GET /api/appointments/job/:jobId`
- `GET /api/appointments/user/:userId?role=...`
- `GET /api/appointments/availability/:workerId?date=...&duration=...`

**Current backend state**
- A dev-only mock endpoint exists in user-service (`GET /api/appointments`) and must be replaced by a real model + CRUD.

**Primary sources**
- [kelmah-backend/services/user-service/server.js](../kelmah-backend/services/user-service/server.js)

---

## 5E) Premium Features & Subscriptions (Defined + Mapped to Current Code)

Premium features are offered via subscription tiers to provide extra value for power users.

### 5E.1 Key feature sets (Final definition)
**Workers (examples)**
- Profile Boost (priority in search results)
- Advanced Analytics (profile views/search rank)
- Read receipts (timestamps and per-conversation read state)

**Hirers (examples)**
- Featured job postings
- “Top talent” access (Kelmah Verified pool)
- Advanced search filters

**Primary sources**
- [backup/root_cleanup_20260201/Kelmaholddocs/old-docs/Chat history.txt](../backup/root_cleanup_20260201/Kelmaholddocs/old-docs/Chat%20history.txt)

### 5E.2 Current frontend implementation (exists today)
- Premium page UI exists (pricing tiers and upgrade CTA)

**Primary sources**
- [kelmah-frontend/src/modules/premium/pages/PremiumPage.jsx](../kelmah-frontend/src/modules/premium/pages/PremiumPage.jsx)

### 5E.3 Gating contract (Final)
- Premium features should be visible but disabled for free users, with an upgrade prompt.
- Gating must be centralized (single source of truth), not ad-hoc per component.

**Implementation requirement**
- Create a `SubscriptionContext` or Redux slice that exposes entitlements like:
	- `canBoostProfile`
	- `canUseAdvancedFilters`
	- `hasReadReceipts`

**Primary sources**
- [backup/root_cleanup_20260201/Kelmaholddocs/old-docs/Chat history.txt](../backup/root_cleanup_20260201/Kelmaholddocs/old-docs/Chat%20history.txt)
- [spec-kit/.github/copilot-instructions.md](.github/copilot-instructions.md)

---

## 6) Dev/Deployment Connectivity (Tunneling & Rewrites)

### 6.1 Unified LocalTunnel protocol (Final)
- Single LocalTunnel URL used for both HTTP and WebSocket traffic.
- URL changes are automatically propagated into runtime config + Vercel rewrites + CSP connect-src.

**Primary sources**
- [spec-kit/.github/copilot-instructions.md](.github/copilot-instructions.md)
- [spec-kit/audits/frontend/2025-10-03_dynamic_config_audit.md](audits/frontend/2025-10-03_dynamic_config_audit.md)

### 6.2 Auto-updated files on tunnel change (Final)
LocalTunnel URL changes are propagated automatically; manual edits are explicitly discouraged.

**Files updated by protocol**
- `kelmah-frontend/public/runtime-config.json`
- `vercel.json` and `kelmah-frontend/vercel.json`
- `ngrok-config.json` (kept for compatibility)
- `kelmah-frontend/src/config/securityConfig.js`

**Primary sources**
- [spec-kit/.github/copilot-instructions.md](.github/copilot-instructions.md)

### 6.3 Frontend API Base URL Resolution (What Actually Happens Today) (Final)

Frontend networking is “single base URL” + “relative paths”, via the centralized axios client.

**Resolution order (highest priority first)**
1. `window.RUNTIME_CONFIG.apiUrl` (populated by `public/runtime-config.json`)
2. `runtimeConfig.API_URL` or `runtimeConfig.ngrokUrl` (if already loaded)
3. `import.meta.env.VITE_API_URL` *(ignored if it contains the known-bad `5loa` host)*
4. `localStorage['kelmah:lastHealthyApiBase']` *(also ignored if it contains `5loa`)*
5. Hardcoded production fallback: `https://kelmah-api-gateway-6yoy.onrender.com/api`

**Important contract**
- `API_BASE_URL` includes the `/api` prefix.
- All frontend calls should use paths like `/jobs`, `/auth/login`, `/messages/conversations` (no extra `/api` in the path).

**Primary sources**
- [kelmah-frontend/src/config/environment.js](../kelmah-frontend/src/config/environment.js)
- [kelmah-frontend/src/services/apiClient.js](../kelmah-frontend/src/services/apiClient.js)
- [kelmah-frontend/src/config/services.js](../kelmah-frontend/src/config/services.js)
- [kelmah-frontend/public/runtime-config.json](../kelmah-frontend/public/runtime-config.json)

### 6.4 Superseded Connectivity Model (Historical)

Older plans describe:
- Development routing via Vite proxy directly to Render microservices.
- Production routing from Vercel directly to individual microservices.

**Final decision**: Frontend routes through the API Gateway, and the active external access mechanism is the unified LocalTunnel URL auto-propagated into runtime config + rewrites + CSP.

**Primary sources (historical)**
- [backup/root_cleanup_20260201/Kelmaholddocs/planning-docs/AUTHENTICATION_FLOW_GUIDE.md](../backup/root_cleanup_20260201/Kelmaholddocs/planning-docs/AUTHENTICATION_FLOW_GUIDE.md)
- [backup/root_cleanup_20260201/Kelmaholddocs/planning-docs/SERVICE_CONNECTIONS_GUIDE.md](../backup/root_cleanup_20260201/Kelmaholddocs/planning-docs/SERVICE_CONNECTIONS_GUIDE.md)
- [backup/root_cleanup_20260201/Kelmaholddocs/old-docs/diagrams/03-data-flow-sequence.md](../backup/root_cleanup_20260201/Kelmaholddocs/old-docs/diagrams/03-data-flow-sequence.md)

**Superseded / historical**
- Earlier fixes hard-coded production base URLs via `.env` for Vercel-hosted backend. The LocalTunnel unified approach is now the current primary system.

**Primary sources (historical)**
- [spec-kit/API-ROUTING-FIX-COMPLETE.md](API-ROUTING-FIX-COMPLETE.md)

---

## 7) Logging, Health Checks, and Diagnostics

### 7.1 Health endpoints (Final)
Services expose `/health`, `/health/ready`, `/health/live` to support automated monitoring.

**Primary sources**
- [spec-kit/.github/copilot-instructions.md](.github/copilot-instructions.md)

### 7.2 Consistent logging (Final)
Use consistent structured logging patterns; avoid dead imports.

**Primary sources**
- [backup/root_cleanup_20260201/audit-reports/CRITICAL_BACKEND_ISSUES_COMPREHENSIVE.md](../backup/root_cleanup_20260201/audit-reports/CRITICAL_BACKEND_ISSUES_COMPREHENSIVE.md)

### 7.3 Investigation-first workflow (Final)
All fixes follow an investigation-first protocol: scope → file surface → end-to-end data flow → reproduce/diagnose → implement → verify → document in spec-kit.

**Primary sources**
- [spec-kit/.github/copilot-instructions.md](.github/copilot-instructions.md)

---

## 9) Restructure Move-Map (What to Move Where)

This section answers: “what should be moved, and where”, without deleting anything blindly.

### 9.1 Frontend: keep `src/` import-clean (Final)
Rule: only code that is part of the live app should remain under `kelmah-frontend/src/`. Backups, audits, and unused route configs should move OUT of `src/` so they are not accidentally bundled or referenced.

**Recommended moves (safe to move, not delete)**
- Move `kelmah-frontend/src/services_backup_audit_20251013_015855/` → `backup/` (repo root) or `kelmah-frontend/backup/`
	- Reason: it contains unused backups that still include route imports for modules like scheduling/premium; keeping it under `src/` increases risk of accidental imports.

**Primary sources**
- [kelmah-frontend/src/routes/config.jsx](../kelmah-frontend/src/routes/config.jsx)

### 9.2 Docs: keep decisions in spec-kit (Final)
Rule: authoritative decisions live in `spec-kit/`. Historical and backup docs remain under `backup/`.

**Recommended moves (safe)**
- Keep `backup/root_cleanup_20260201/` as archive-only
- Keep `spec-kit/` as current authoritative docs

### 9.3 Deletion policy (Final)
- Do not delete until:
	1) a workspace-wide reference search confirms “no imports / no runtime references”, and
	2) the app builds and runs after the move.

**Primary sources**
- [spec-kit/.github/copilot-instructions.md](.github/copilot-instructions.md)

---

## 8) Decision Index (Quick List)

- Marketplace scope: vocational workers ↔ hirers, Ghana-context UX ([backup/root_cleanup_20260201/Kelmaholddocs/old-docs/Kelma.txt](../backup/root_cleanup_20260201/Kelmaholddocs/old-docs/Kelma.txt))
- Backend shape: API Gateway + microservices ([spec-kit/.github/copilot-instructions.md](.github/copilot-instructions.md))
- Database: MongoDB/Mongoose only ([spec-kit/.github/copilot-instructions.md](.github/copilot-instructions.md), [backup/root_cleanup_20260201/Kelmaholddocs/reports/MONGODB-MIGRATION-COMPLETE.md](../backup/root_cleanup_20260201/Kelmaholddocs/reports/MONGODB-MIGRATION-COMPLETE.md))
- Shared models: `kelmah-backend/shared/models/` + service model index import rules ([spec-kit/.github/copilot-instructions.md](.github/copilot-instructions.md))
- Auth: gateway-centralized auth + service trust ([spec-kit/.github/copilot-instructions.md](.github/copilot-instructions.md))
- Frontend: domain-driven modules under `src/modules` ([spec-kit/.github/copilot-instructions.md](.github/copilot-instructions.md), [backup/root_cleanup_20260201/Kelmaholddocs/planning-docs/DOMAIN-DRIVEN-DESIGN.md](../backup/root_cleanup_20260201/Kelmaholddocs/planning-docs/DOMAIN-DRIVEN-DESIGN.md))
- API: consistent success/error envelope ([spec-kit/kelmah-backend/docs/API-DOCUMENTATION.md](kelmah-backend/docs/API-DOCUMENTATION.md))
- Tunneling: LocalTunnel unified mode with auto-propagation to runtime config + rewrites + CSP ([spec-kit/.github/copilot-instructions.md](.github/copilot-instructions.md))
- Diagnostics: investigation-first workflow + spec-kit logging required ([spec-kit/.github/copilot-instructions.md](.github/copilot-instructions.md))
- Routing safety: route specificity order (literals before `/:id`) ([spec-kit/.github/copilot-instructions.md](.github/copilot-instructions.md))
- Frontend organization: DDD modules + clear boundaries ([backup/root_cleanup_20260201/Kelmaholddocs/planning-docs/DOMAIN-DRIVEN-DESIGN.md](../backup/root_cleanup_20260201/Kelmaholddocs/planning-docs/DOMAIN-DRIVEN-DESIGN.md))

---

## Appendix A — Evidence Pack

- Evidence extract: [DataAnalysisExpert/kelmah_decisions_extracted_2026-02-11.md](../DataAnalysisExpert/kelmah_decisions_extracted_2026-02-11.md)
- Full manifest (files read): [DataAnalysisExpert/kelmah_docs_manifest_2026-02-11.txt](../DataAnalysisExpert/kelmah_docs_manifest_2026-02-11.txt)
