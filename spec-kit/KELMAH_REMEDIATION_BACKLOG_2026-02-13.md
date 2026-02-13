# Kelmah Remediation Backlog (Execution-Ready)

**Date**: February 13, 2026  
**Derived from**:
- `spec-kit/KELMAH_SUPER_DOCUMENTATION_FINAL_DECISIONS_REFINED_2026-02-13.md`
- `spec-kit/FULL_PLATFORM_AUDIT_FEBRUARY_2026.md`
- `spec-kit/STATUS_LOG.md`

## Prioritization Model

- **P0 (48h)**: security compromise, auth bypass, data corruption, service crash
- **P1 (7 days)**: major reliability/performance blockers, critical API contract drift
- **P2 (14 days)**: maintainability and UX quality issues with measurable impact
- **P3 (30 days)**: cleanup and debt reduction

---

## P0 — Immediate Actions (Start Now)

| ID | Area | Finding | Severity | Owner | SLA | Primary Files |
|---|---|---|---|---|---|---|
| P0-01 | Security | Secrets exposure in tracked env/scripts; rotate and purge | Critical | Backend Lead + DevOps | 48h | `kelmah-backend/**/.env`, `kelmah-backend/services/user-service/scripts/populate-worker-fields.js` |
| P0-02 | Security/AuthZ | Ensure all protected routes enforce gateway trust + role checks | Critical | Backend Lead | 48h | `kelmah-backend/services/**/routes/*.js`, `kelmah-backend/api-gateway/server.js` |
| P0-03 | Review Service | Verify all review moderation/write endpoints are protected | Critical | Review Service Owner | 48h | `kelmah-backend/services/review-service/routes/review.routes.js`, `admin.routes.js` |
| P0-04 | Payment Integrity | Remove remaining Sequelize-pattern runtime in payment flow | Critical | Payment Service Owner | 48h | `kelmah-backend/services/payment-service/controllers/payment.controller.js` |
| P0-05 | Frontend Secret Leakage | Confirm no env overexposure through Vite define pipeline | Critical | Frontend Lead | 48h | `kelmah-frontend/vite.config.js`, `kelmah-frontend/src/config/*` |

### P0 Verification Gate

1. No plaintext secrets in tracked files (`git grep` validation).
2. Protected endpoints return `401/403` without valid gateway user context.
3. Payment and review critical flows pass smoke tests without runtime exceptions.
4. Frontend production build contains no sensitive runtime env leakage.

---

## P1 — Reliability & Performance (Week 1)

| ID | Area | Finding | Severity | Owner | SLA | Primary Files |
|---|---|---|---|---|---|---|
| P1-01 | Gateway Perf | Standardize proxy creation/reuse; eliminate per-request proxy overhead patterns | High | API Gateway Owner | 7d | `kelmah-backend/api-gateway/server.js` |
| P1-02 | Route Contracts | Freeze canonical gateway routes and remove drift aliases causing 404/401 regressions | High | Backend Lead | 7d | `kelmah-backend/api-gateway/routes/*.js`, frontend service modules |
| P1-03 | Retry Storms | Restrict retry to idempotent requests only | High | Frontend Platform Owner | 7d | `kelmah-frontend/src/services/apiClient.js` |
| P1-04 | Health Surface | Reduce sensitive details in health/debug responses | High | API Gateway Owner | 7d | `kelmah-backend/api-gateway/server.js` |
| P1-05 | Regex Hardening | Harden user-controlled regex/search paths | High | Messaging Service Owner | 7d | `kelmah-backend/services/messaging-service/controllers/message.controller.js` |

### P1 Verification Gate

1. Gateway p95 latency improves and memory growth stabilizes under synthetic load.
2. Authenticated and public endpoint matrices are documented and pass.
3. No duplicate mutation side-effects under transient failures.

---

## P2 — Product Stability & Maintainability (Week 2)

| ID | Area | Finding | Severity | Owner | SLA | Primary Files |
|---|---|---|---|---|---|---|
| P2-01 | Large Components | Split oversized pages/components into bounded modules | Medium | Frontend Lead | 14d | `kelmah-frontend/src/modules/**/pages/*.jsx` |
| P2-02 | Config Sprawl | Consolidate endpoint/config sources to single authoritative config | Medium | Frontend Platform Owner | 14d | `kelmah-frontend/src/config/*` |
| P2-03 | Response Contracts | Normalize response envelopes and error shape across services | Medium | Backend Lead | 14d | `kelmah-backend/services/**/controllers/*.js` |
| P2-04 | Logging Hygiene | Remove sensitive or noisy production logs and unify logger usage | Medium | Service Owners | 14d | `kelmah-backend/**/server.js`, controllers |
| P2-05 | Route Specificity | Enforce literal-before-param route ordering checks | Medium | Backend QA + Service Owners | 14d | `kelmah-backend/services/**/routes/*.js` |

---

## P3 — Cleanup & Governance (Month 1)

| ID | Area | Finding | Severity | Owner | SLA | Primary Files |
|---|---|---|---|---|---|---|
| P3-01 | Legacy Artifacts | Decommission stale duplicate docs/configs after usage proof | Low | Tech Lead + Docs Owner | 30d | `backup/**`, duplicate config files |
| P3-02 | Spec Governance | Enforce required data-flow template and dry-audit entries per change | Low | Engineering Manager | 30d | `spec-kit/STATUS_LOG.md`, `spec-kit/templates/*` |
| P3-03 | Audit Automation | Add scheduled checks for route protection, secrets, and response shape drift | Low | DevOps + QA | 30d | CI workflows + scripts |

---

## Ownership Matrix

- **Backend Lead**: authz enforcement, service boundary integrity, response consistency
- **API Gateway Owner**: gateway performance, route proxying contract, health surface security
- **Service Owners**: domain fixes (payment, messaging, review, user, job)
- **Frontend Lead**: high-risk UI/runtime contract compliance, modularization
- **Frontend Platform Owner**: API client, retries, config consolidation
- **DevOps**: secret management, CI policy gates, rollout safety
- **QA Lead**: endpoint matrix verification, regression suites, release sign-off

---

## Release Blocking Criteria

Release is blocked until all are true:

1. All P0 items marked done with verification evidence.
2. No known auth bypass path in gateway or services.
3. No plaintext secrets in tracked repository files.
4. Gateway and frontend production smoke tests pass (auth, jobs, worker profile, settings, messaging, payments, reviews).
5. STATUS_LOG updated with evidence links per completed item.

---

## Execution Sequence (Recommended)

1. **Security lockdown first** (P0-01..P0-05)
2. **Route and gateway stabilization** (P1-01..P1-05)
3. **Frontend/contract hardening** (P2 group)
4. **Debt and automation** (P3 group)

This backlog is strict by design: fix root causes, verify each change, and log evidence after each completed item.
