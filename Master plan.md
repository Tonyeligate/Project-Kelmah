# 🚀 Kelmah Master Plan — GOD MODE

## 🎯 Project North Star
Build a production‑grade vocational marketplace for Ghana that connects workers (plumbers, electricians, carpenters, masons, etc.) and hirers with: secure auth, rich worker profiles, job posting/applications, escrow payments (MoMo-first), real‑time messaging, notifications, analytics, and mobile‑friendly UX.

---

## 🔍 Executive Findings (Deep Codebase Scan)
- **Architecture**: Microservices exist (auth, user, job, messaging, payment, review) + API Gateway. Several services still contain temp mocks and mixed persistence (Mongo/SQL).
- **Deployments**: Render misrouted Job Service (serving user-service). Messaging Mongo connection historically missing/unstable. Health endpoints inconsistent.
- **Frontend**: Solid module structure. Some components still use mock fallbacks (e.g., scheduling, reviews analytics). Dev mock auth path lives in `src/App.jsx` for development.
- **Auth**: Strong security posture (rate limits, lockouts, verification). Requires email verification, causing 401/403 for fresh accounts until verified.
- **Payments**: Ghana flows planned; code scaffolding present; needs provider wiring and escrow finalization.
- **Messaging**: Socket server, routes, and health present; conversation routes partly parked; needs DB stability + full CRUD.
- **API Gateway**: Good proxy pattern and error handling; still contains legacy/monolith fallback route.
- **Testing**: Many “placeholder” tests; low end-to-end coverage; no orchestrated CI smoke tests across services.
- **Config**: Mixed env/config paths, hardcoded values in places; inconsistent service URLs across environments.

---

## ⚠️ Critical Gaps To Close
1. Render misconfiguration (job-service points to user-service).
2. Messaging service MongoDB SSL/connection stability for Atlas.
3. Residual frontend mock fallbacks (scheduling, reviews analytics, smart search).
4. API Gateway still proxies legacy/monolith catch-all; risks masking broken routes.
5. Payments: escrow flow + MoMo integration not wired E2E.
6. Test coverage and dev/prod parity (env consistency) inadequate.

---

## 🛠️ Phase 0 — Immediate Stabilization (1–2 days)
- Fix Render mappings per `RENDER-DEPLOYMENT-FIX-INSTRUCTIONS.md`.
- Messaging service: enforce robust `mongoose.connect` with Atlas SRV, TLS defaults; add readiness logs and fail-fast in prod.
- Frontend: remove development mock auth block in `src/App.jsx` when `NODE_ENV=production` and add feature-flag guard.
- Disable remaining mock fallbacks in:
  - `src/modules/scheduling/services/schedulingService.js` (mockAppointments)
  - `src/modules/reviews/pages/ReviewsPage.jsx` (mockReviews/mockStats)
  - `src/modules/search/services/smartSearchService.js` (mock recommendations)
- Gateway: remove `legacy *` catch-all or restrict behind feature flag and log warnings with metrics.
- Add uniform `/health`, `/health/ready`, `/health/live` in all services.

Deliverables:
- Healthy service routing; no frontend mock data in production builds; consistent health checks.

---

## 🔐 Phase 1 — Authentication & Accounts (2–4 days)
- Create admin-only verification endpoint (auth-service) to bulk verify emails safely (internal key required):
  - `POST /api/auth/admin/verify-users` { emails[] } — guarded by `INTERNAL_API_KEY`.
- Add endpoint to unlock accounts & reset failed logins for support ops.
- Implement refresh-token rotation and token-version invalidation across services via gateway headers.
- Harden rate-limiting (Redis) replacing in-memory TODOs.

Deliverables:
- Operational bulk verification flow (no Atlas manual edits), robust refresh/security, support tooling.

---

## 💼 Phase 2 — Job & Contract Domain (4–6 days)
- Job service: finalize models (Job, Application, Contract, Milestone) with consistent persistence (choose Mongo or Postgres; prefer Mongo for fast iteration, or Postgres for strict relations—pick one and migrate).
- Implement endpoints:
  - Jobs: CRUD, search/filter/pagination.
  - Applications: apply/withdraw/list mine; hirer review applications.
  - Contracts: create, accept, milestones CRUD, status transitions.
- Remove temporary contract mocks from user-service; ensure gateway routes jobs → job-service only.

Deliverables:
- Fully functional job lifecycle: post → apply → contract.

---

## 💬 Phase 3 — Messaging & Notifications (4–6 days)
- Messaging service: complete conversations/messages CRUD, pagination, unread counters; Socket namespaces per conversation.
- File uploads via pre-signed S3 URLs.
- Notifications service or integrate within messaging service initially:
  - Types: message, application status, contract events, payment events.
  - Delivery: in-app via WebSocket + email hooks (queued).

Frontend:
- Wire `MessagesPage` with real endpoints; replace temp endpoints with actual.
- Context providers unified error handling & reconnection strategies.

Deliverables:
- Production-grade chat with unread counts, file sharing, and basic notifications.

---

## 💰 Phase 4 — Payments & Escrow (6–9 days)
- Pick Ghana-first provider (Hubtel, Paystack MoMo) and one card provider fallback.
- Implement payment-intents for escrow funding, milestone release, refunds; webhooks for state validation.
- Wallet: deposits, withdrawals, transaction history; KYC hooks if provider needs.
- Disputes: open/resolve; admin dashboard stubs.

Frontend:
- PaymentContext with only real API calls; Wallet/Transactions pages wired; contract milestone pay/release UX.

Deliverables:
- End-to-end escrow flow: create → fund → release/refund.

---

## 📈 Phase 5 — Worker & Hirer Experience (5–7 days)
Workers:
- Portfolio CRUD (images, descriptions, tools/skills), Certification uploader/verification, Earnings analytics.
- Skills assessment page upgrades (replace mock tests with server-driven tests).

Hirers:
- Job posting wizard, proposal review, shortlisting, hire action, rating prompts.

Search:
- Replace smartSearchService mocks with real job/worker search endpoints; add caching layer.

Deliverables:
- Rich profiles, analytics, and complete job management UX for both roles.

---

## 📦 Phase 6 — Ops, Testing, and Quality (ongoing; 5–7 days initial)
- CI: GitHub Actions running service lint/tests + smoke tests hitting Render URLs.
- Contract tests across gateway → services (auth, job, messaging, payment).
- Load tests for messaging & gateway (k6/Artillery).
- Centralized logging (Winston → LogDNA/Elastic), request IDs propagated via gateway.
- Error budgets & SLOs; alerting on health and latency.

Deliverables:
- Confident deploy pipeline, observability, and quality gates.

---

## ⚙️ Phase 7 — Configuration & Security Hardening (2–4 days)
- One config system: `.env` per service with schema validation (zod/joi). No hardcoded connection strings.
- Secret rotation for JWT/refresh; internal keys for admin endpoints.
- CORS per environment; CSP via helmet; strict cookies where used.
- Service discovery via env or lightweight registry; remove hardcoded URLs in client via `environment.js`.

Deliverables:
- Secure, consistent configuration across environments.

---

## 📱 Phase 8 — Mobile UX & Performance (3–5 days)
- Audit mobile layouts; fix overflow/spacing in critical flows.
- Code-splitting for large routes; memoization of heavy lists.
- Image optimization (responsive, lazy load) for portfolio/gallery.

Deliverables:
- Fast, smooth mobile experience.

---

## 🧪 Phase 9 — Data, Analytics & Admin (3–5 days)
- Admin dashboard for disputes, KYC flags, user verification, payments.
- Audit trails (who did what when) via shared logger.
- Product analytics events (searches, applications, hires, payments).

Deliverables:
- Operability and insights for continuous improvement.

---

## 📋 Concrete Worklist (High Signal)
- Remove remaining mocks:
  - `schedulingService.js` mockAppointments
  - `ReviewsPage.jsx` mockReviews/mockStats
  - `smartSearchService.js` mock generators
- Fix `App.jsx` dev-mode mock auth guard.
- Gateway: delete/feature-flag legacy `router.use('*', monolithProxy)`.
- Render: correct job-service mapping + redeploy; verify `/health` returns `service: job-service`.
- Messaging: enforce stable Atlas connection + finish `/api/conversations` real route.
- Auth: admin bulk-verify endpoint + account unlock.
- Payments: wire provider + webhook verification + escrow endpoints.
- Tests: add e2e smoke hitting Render for auth/login, jobs list, messaging health, payments health.

---

## ✅ Definition of Done (Project)
- No mock fallbacks in production.
- All health endpoints green; gateway status summarizes services OK.
- Users can: register → verify → login → create job → apply → message → contract → fund escrow → release → review.
- CI passing; basic load tests acceptable.
- Documentation updated: API, deployment, runbooks.

---

## 📅 Suggested Timeline (Aggressive)
- Week 1: Phases 0–1
- Week 2: Phase 2
- Week 3: Phase 3
- Week 4: Phase 4
- Week 5: Phase 5 + 6 kickoff
- Week 6: Phase 6–9 polish & launch prep

---

## 📎 Notes Aligned to Kelma.txt / Kelma docs.txt
- Focus on Ghana context (MoMo, local phone validation already present).
- Real-time messaging + notifications are core to worker–hirer collaboration (prioritize).
- Beautiful black/gold/white UI is maintained; invest in animated, responsive pages once core flows are stable.

---

## 🏁 Launch Checklist
- [ ] All services ✅ /health
- [ ] Frontend using production service URLs
- [ ] Admin can verify users programmatically
- [ ] Payments test mode flows pass end-to-end
- [ ] Real-time messaging send/receive + attachments
- [ ] Zero mocks in prod build
- [ ] Incident runbook & on-call basics

— End of Master Plan —

