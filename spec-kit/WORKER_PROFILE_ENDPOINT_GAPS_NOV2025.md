# Worker Profile Endpoint Gaps (Nov 14, 2025)

## Context
QA reported that viewing a specific worker on Vercel triggers a cascade of 404/500 errors for nested resources such as skills, portfolio, certificates, work history, earnings, and ratings. The frontend (`kelmah-frontend/src/modules/worker/services/workerService.js`) now calls a consolidated `/api/users/workers/:workerId/<resource>` API family. The API Gateway proxies `/api/users/*` directly to the user-service, so these requests reach the backend unchanged.

## Findings
1. **Missing worker sub-resource routes**
   - `kelmah-backend/services/user-service/routes/user.routes.js` only exposes `/workers`, `/workers/:id`, `/workers/:id/availability`, `/workers/:id/completeness`, `/workers/:id/bookmark`, and `/workers/:workerId/earnings`.
   - No routes exist for `/workers/:id/skills`, `/portfolio`, `/certificates`, `/work-history`, or `/analytics/ratings` under `/api/users/*`, which is why the gateway returns 404 immediately.

2. **Portfolio + certificate controllers mounted under `/api/profile`**
   - `server.js` mounts `profile.routes.js` at `/api/profile`, so the existing portfolio/certificate controllers are available at `/api/profile/workers/:id/portfolio` and `/api/profile/:workerId/certificates`.
   - The worker service hits `/api/profile/...` for portfolios but still receives 404 because the controller still depends on legacy Sequelize models (see `portfolio.controller.js` using `WorkerProfile.findOne({ where: ... })`). With the Mongo-only stack, that lookup fails and the controller responds with `Worker not found` → HTTP 404.

3. **Earnings endpoint throwing 500**
   - `/api/users/workers/:workerId/earnings` is wired to `getEarnings` in `user.controller.js` (line ~120). It queries `WorkerProfile.findOne({ userId })`. When the worker profile document is missing (common for legacy accounts created only in auth service), the controller returns a 404. But QA logs show 500 because downstream axios calls to the payment service throw and bubble—`gateway` resolves to the Vercel frontend URL in production, so the internal `/api/payments/...` call fails with ENOTFOUND and the catch block only covers the per-request fetch, not the outer function.

4. **Ratings endpoint missing in review service**
   - Frontend calls `/api/reviews/ratings/worker/:id`, but no matching route exists in `kelmah-backend/services/review-service/routes`. This always returns 404 from the gateway.

## Impacted UI Flow
```
WorkerProfilePage.jsx
  ↓
workerService.getWorkerSkills(id) → GET /api/users/workers/:id/skills → 404 (route missing)
workerService.getWorkerPortfolio(id) → GET /api/profile/workers/:id/portfolio → 404 (controller still SQL)
workerService.getWorkerCertificates(id) → GET /api/users/workers/:id/certificates → 404 (route missing)
workerService.getWorkHistory(id) → GET /api/users/workers/:id/work-history → 404 (route missing)
workerService.getWorkerEarnings(id) → GET /api/users/workers/:id/earnings → 500 (axios payment proxy failure)
reviewService.getWorkerRating(id) → GET /api/reviews/ratings/worker/:id → 404 (route missing)
```

## Next Steps
1. **Add worker sub-resource router**: create `worker-detail.routes.js` under user-service that mounts `/workers/:workerId/(skills|portfolio|certificates|work-history|analytics)` and wire to new controller methods backed by Mongo `WorkerProfile`, `Portfolio`, and `Certificate` collections.
2. **Refactor portfolio & certificate controllers**: remove Sequelize usage and query the Mongo models defined in `models/index.js`. Ensure public GETs bypass auth per API gateway logic.
3. **Harden earnings controller** ✅ (Nov 14) – Guarded payment-service axios calls with deterministic fallbacks, short-circuit when the payment host is missing, and return predictable data even when downstream services are unavailable. Controller now returns 404 only when the worker profile is missing.
4. **Review-service rating proxy alignment** ✅ (Nov 14) – Gateway already exposes `/api/reviews/ratings/worker/:workerId`; frontend `reviewService` updated to hit the correct path so worker profiles can fetch ratings without 404s.

Document owner: Copilot agent (Nov 14, 2025).

## Progress Log (Nov 14, 2025)
- ✅ Implemented Mongo-backed worker detail controllers and routes for skills + work history, returning `{ success, data }` payloads and enforcing ownership via `verifyGatewayRequest` on mutations.
- ✅ Added authenticated CRUD coverage for portfolio and certificate resources under `/api/users/workers/:workerId/(portfolio|certificates)`, keeping GET endpoints public (optional gateway verification) while protecting write operations with service trust middleware + rate limiter.
- ✅ Normalized payloads using the new WorkerProfile schema fields (`skillEntries`, `workHistory`) and shared model formatters so WorkerProfilePage now receives consistent structures across all nested resources.
- ✅ Completed: earnings fallback guard + review-service rating proxy alignment (Nov 14, 2025).
