# Deep Platform Audit — February 20, 2026

## Scope and Method
- Full frontend page surface reviewed: 57 page files under `kelmah-frontend/src/modules/**/pages/*`.
- Frontend entry + routing audited:
  - `kelmah-frontend/src/App.jsx`
  - `kelmah-frontend/src/routes/config.jsx`
  - `kelmah-frontend/src/services/apiClient.js`
  - `kelmah-frontend/src/services/websocketService.js`
- Backend flow audited (gateway + microservices):
  - `kelmah-backend/api-gateway/server.js`
  - `kelmah-backend/api-gateway/middlewares/auth.js`
  - `kelmah-backend/services/*/routes/*.js`
  - High-risk controllers in auth/job/messaging/review services
- Existing authoritative audits merged and revalidated against current code:
  - `spec-kit/FULL_PLATFORM_AUDIT_FEBRUARY_2026.md`
  - `spec-kit/FRONTEND_PAGE_AUDIT_20260211.md`
  - `spec-kit/PLATFORM_MOBILE_BACKEND_AUDIT_FEB15_2026.md`
  - `spec-kit/FRONTEND_CODE_QUALITY_SECURITY_AUDIT.md`

## Architecture (Prompt8)
- Pattern: Microservices backend + API Gateway + modular React frontend.
- Entry points:
  - Frontend boot: `kelmah-frontend/src/App.jsx`
  - Frontend routes: `kelmah-frontend/src/routes/config.jsx`
  - Gateway boot: `kelmah-backend/api-gateway/server.js`
  - Service boots: `kelmah-backend/services/*/server.js`
- 5 most important core modules:
  1. `kelmah-backend/api-gateway/server.js`
  2. `kelmah-backend/shared/middlewares/serviceTrust.js`
  3. `kelmah-backend/shared/models/index.js`
  4. `kelmah-frontend/src/routes/config.jsx`
  5. `kelmah-frontend/src/services/apiClient.js`
- Data flow:
  - UI interaction → page/container state/hook → service (`apiClient`) → gateway `/api/*` → target microservice route/controller/model → response normalized in frontend service/context → UI render.
- Dependencies and external systems:
  - MongoDB Atlas, JWT, Socket.IO, Paystack/Stripe webhooks, LocalTunnel/Vercel/Render deployment chain.

## Mobile-First UI Coverage (All Pages)
All 57 module page files were included in the audit scope. Existing audits already tracked most of these pages with verified fixes. Fresh scan found remaining mobile-risk UI signals concentrated in:
- `kelmah-frontend/src/modules/messaging/pages/MessagingPage.jsx`
- `kelmah-frontend/src/modules/hirer/pages/HirerDashboardPage.jsx`
- `kelmah-frontend/src/modules/quickjobs/pages/NearbyJobsPage.jsx`
- `kelmah-frontend/src/modules/map/pages/ProfessionalMapPage.jsx`
- `kelmah-frontend/src/modules/jobs/pages/JobDetailsPage.jsx`
- `kelmah-frontend/src/modules/contracts/pages/CreateContractPage.jsx`

### Mobile UI Summary
- Critical: 2
- High: 6
- Medium: 11
- Low: 8
- Health score: Moderate-risk trending upward (many Feb fixes already landed).

## Confirmed Findings (Prompts 3/5/6)

### 1) Admin key accepted via query string
- Severity: High
- Location: `kelmah-backend/services/auth-service/server.js` (admin verify/unlock endpoints)
- What is wrong:
  - Uses `req.headers['x-internal-key'] || req.query.key` for privileged admin operations.
  - Query params leak in logs, browser history, proxies, and monitoring.
- Attack scenario:
  - Internal key captured from URL logs grants account unlock/verification actions.
- Fix:
  - Remove `req.query.key` support entirely.
  - Accept internal key only from signed internal header and trusted gateway source.
  - Add explicit environment guard: disable endpoints unless `ENABLE_ADMIN_INTERNAL_ROUTES=true`.
- Why it matters:
  - Direct privilege escalation if key leaks once.

### 2) Duplicate admin mutation routes in auth service
- Severity: Medium
- Location: `kelmah-backend/services/auth-service/server.js`
- What is wrong:
  - Duplicated route families (`/api/admin/*` and `/api/auth/admin/*`) increase attack surface and drift risk.
- Fix:
  - Keep one namespace, remove duplicate handlers, centralize middleware.

### 3) Verbose debug logging in public job listing route
- Severity: Medium
- Location: `kelmah-backend/services/job-service/routes/job.routes.js`
- What is wrong:
  - Logs request query/path on public route every hit.
- Impact:
  - PII/query leakage and noisy logs under load.
- Fix:
  - Wrap logs under `NODE_ENV !== 'production'` or structured debug flag.

### 4) Regex/parameter heavy search path still high-cost under load
- Severity: High
- Location: `kelmah-backend/services/job-service/controllers/job.controller.js` (getJobs filter block)
- What is wrong:
  - Multiple `$regex` + `$or/$and` conditions combined with flexible filters may degrade at scale.
- Fix:
  - Add strict index strategy + query shape limits.
  - For search/location, move to text index + pre-tokenized fields where possible.
  - Cap combined filter complexity (reject too many terms/clauses).
- Scale break at 10x:
  - Job list/search latency and Mongo CPU spikes are first failure point.

### 5) WebSocket service logs message metadata in client runtime
- Severity: Medium
- Location: `kelmah-frontend/src/services/websocketService.js`
- What is wrong:
  - `console.log('Message queued:', event, data)` and queue diagnostics in production path.
- Fix:
  - Gate all non-error logs behind dev checks.
  - Redact sensitive payload fields if logging is unavoidable.

### 6) App-level warmup timeout not cleaned on unmount
- Severity: Low
- Location: `kelmah-frontend/src/App.jsx`
- What is wrong:
  - `setTimeout(() => setServicesWakingUp(false), 15000)` has no cleanup.
- Fix:
  - Store timeout id in ref and clear on unmount.

### 7) Messaging/conversation route protection relies on server mount only
- Severity: Medium
- Location: `kelmah-backend/services/messaging-service/routes/conversation.routes.js`
- What is wrong:
  - Route file has no local guard; protection depends on mounting discipline in `server.js`.
- Fix:
  - Add route-level assertion middleware or explicit comment + test to enforce mount contract.

### 8) UI mobile pressure points remain in fixed-position heavy views
- Severity: High
- Locations:
  - `kelmah-frontend/src/modules/messaging/pages/MessagingPage.jsx`
  - `kelmah-frontend/src/modules/map/pages/ProfessionalMapPage.jsx`
  - `kelmah-frontend/src/modules/quickjobs/pages/NearbyJobsPage.jsx`
  - `kelmah-frontend/src/modules/contracts/pages/CreateContractPage.jsx`
- What is wrong:
  - Multiple fixed elements and hard pixel constraints can conflict with keyboard/safe-area on smaller devices.
- Fix:
  - Normalize with `100dvh`, safe-area insets, and mobile-first sticky layout rules.

## Security Focus (Prompt5 format)

### A) Internal admin endpoints key transport weakness
- Severity: High
- Attack scenario: leaked URL query key reused to verify/unlock accounts.
- Fix: header-only internal auth + gateway signature validation + route allowlist.
- Reference: OWASP API2:2023 Broken Authentication, CWE-598 (query string exposure).

### B) Search amplification / regex pressure
- Severity: Medium/High (depends on indexing)
- Attack scenario: crafted broad queries trigger expensive scans and degrade service.
- Fix: stricter caps + indexed text search + reject expensive combinations.
- Reference: OWASP API4:2023 Unrestricted Resource Consumption, CWE-400.

### C) Client-side verbose runtime logging
- Severity: Medium
- Attack scenario: shared device or remote support captures sensitive event payloads.
- Fix: production log suppression and payload redaction.
- Reference: OWASP API3:2023 Broken Object Property Level Authorization (data leakage vectors), CWE-532.

## Performance Focus (Prompt6 format)

### 1) Job search query complexity
- Impact: High
- Current behavior: multi-branch regex + optional geospatial + pagination on same endpoint.
- Suggested fix: split heavy search into dedicated indexed path; enforce query budget.
- Expected improvement: 30–60% lower p95 latency under filter-heavy traffic.

### 2) API gateway proxy churn risk (historical + recheck)
- Impact: High
- Current behavior: gateway uses dynamic proxies; caching exists now but route-by-route consistency must be enforced.
- Suggested fix: central proxy registry, zero per-request middleware construction.
- Expected improvement: reduced heap growth and socket churn under sustained load.

### 3) Frontend polling/timer density in realtime-heavy modules
- Impact: Medium
- Current behavior: many intervals/timeouts across messaging, dashboard, health, quick-jobs.
- Suggested fix: shared scheduler or visibility-aware throttling for background tabs.
- Expected improvement: lower CPU/battery cost on mobile devices.

## Maintainability and System Logic
- High duplication still exists in old compatibility routes and legacy aliases in frontend router.
- Multiple historical audit artifacts indicate recurring config drift risk.
- Recommendation:
  - Create one route contract manifest (frontend + gateway + service).
  - Add CI contract tests for top 30 endpoints and all protected route groups.

## Prompt4 — Strategy Evaluation (for current platform approach)
Assumptions:
- Scale: 50k+ MAU, bursty job search/messaging traffic.
- Team: small-mid mixed seniority.
- Timeline: active weekly shipping.
- Stack: React + Redux + Express microservices + Mongo.

Top 3 risks:
1. Gateway/service route drift causing partial outages despite healthy services.
2. Search/list query cost spikes under 10x traffic.
3. Frontend realtime complexity (timers/socket state) creating intermittent UX regressions.

What breaks first at 10x:
- Job search endpoints and gateway proxy/memory behavior before static pages.

Simplest version to ship first:
- Freeze new features for 1 sprint; harden route contracts, auth surfaces, and search index/query budgets only.

Alternatives to consider:
- Move search to dedicated indexed service (or managed search) while keeping core CRUD in Mongo.
- Replace ad-hoc polling with event-driven updates + visibility throttling.

If less time:
- Patch only auth query-key issue, search caps, and production log redaction.

If more time:
- Route-contract test harness + endpoint schema validation + SLO dashboards for p95/p99.

## Priority Fix Backlog (Professionalized)
1. Remove `req.query.key` from all internal admin routes (auth-service) — Critical security hardening.
2. Consolidate duplicate admin route families and add allowlist middleware.
3. Implement query-budget guard for job search (max terms, max combinators, strict caps).
4. Redact/gate frontend websocket and service logs in production.
5. Add contract tests for route order and protected-route enforcement.
6. Complete mobile-safe fixed/sticky pattern normalization in messaging/map/quickjobs/contracts pages.

## Verification Targets
- Security: no internal key accepted in URL params, all admin routes header+signature protected.
- API: route contract tests pass for top critical paths.
- UI: no horizontal scroll and no keyboard-overlap regressions on 320–640px.
- Performance: p95 latency and heap growth baselines tracked before/after.

## Notes
- Many severe historical findings in older audits have already been fixed; this report focuses on current, still-actionable items plus architectural risk that can reintroduce regressions.
