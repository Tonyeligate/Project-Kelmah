# Kelmah Platform – Full Codebase Dry Audit Plan

**Prepared:** October 1, 2025  
**Author:** GitHub Copilot automation agent

---

## 🎯 Objectives
- Execute a systematic, sector-by-sector dry audit across backend services, API gateway, shared libraries, frontend modules, and DevOps assets.
- Capture architectural drift, reliability risks, and production log regressions before they surface in user flows.
- Feed actionable findings back into the spec-kit status log with prioritized remediation tasks.

## 🧭 Guiding Principles
1. **Trace the Flow:** For every reported symptom (logs, support tickets, analytics spikes), follow the complete request/response path across gateway, microservice, shared utilities, and frontend consumption.
2. **Verify Consolidation Contracts:** Ensure shared models, middleware, and utilities remain the single source of truth; flag any new direct imports or duplicated code paths.
3. **Production Parity:** Cross-check service configurations (env, rate limiters, security headers) with Render/Vercel deployments to identify mismatches.
4. **Documentation First:** Update related spec-kit documents in lockstep with discoveries to maintain real-time project knowledge.

## 🗂 Scope & Sequencing
| Phase | Focus Area | Key Questions | Deliverables |
| --- | --- | --- | --- |
| 1 | **API Gateway & Proxy Layer** | Are rewrites, auth guards, and health monitors aligned with current service capabilities? | Gateway audit notes, proxy route matrix, health-check verification report |
| 2 | **Job & User Services (High-Traffic)** | Do controllers respect shared-model contracts? Are readiness guards, caching, and pagination behaving under load? | Service-specific audit logs, cold-start mitigation checklist |
| 3 | **Messaging, Payment, Review Services** | Any regressions in consolidated MVC patterns or websocket/security posture? | Updated service audit reports, websocket handshake validation |
| 4 | **Frontend Modules & Shared Utils** | Are axios clients, environment detection, and UI modules honoring new backend contracts? | Component/service alignment report, UX risk list |
| 5 | **DevOps & Tooling** | Are lint/test scripts, deployment hooks, and monitoring dashboards catching the right signals? | CI/CD checklist, logging & alert coverage map |

## ✅ Immediate Fixes Logged (Oct 1 Snapshot)
- Gateway jobs browsing proxy made public-friendly while preserving secured CRUD routes.
- Frontend health monitor normalized to remove `/api/api` duplications and enrich diagnostics.
- User service trusts proxy headers and defers traffic until Mongo initializes to eliminate rate-limit warnings.

These fixes serve as the starting point for regression verification during Phase 1 and 2.

## 📋 Methodology Per Phase
1. **Inventory & Baseline** – Enumerate routes/components, confirm owners, gather latest logs.
2. **Static Review** – Inspect relevant files end-to-end (controllers, middleware, hooks, configs).
3. **Behavioral Verification** – Run targeted smoke tests (curl, Postman, automated scripts) where applicable.
4. **Documentation & Ticketing** – Update spec-kit logs, flag follow-up tasks, and prepare remediation diffs if required.

## 🛠 Tooling & Resources
- Local health scripts (`test-health-endpoints.js`, `test-localtunnel-*.js`).
- Spec-kit templates (`templates/audit-report.md`) for consistent write-ups.
- Render/Vercel dashboards for deployment parity checks.
- Shared utilities (`shared/middlewares/rateLimiter`, `shared/utils/jwt`) as canonical references.

## ⏭ Next Steps
1. Finalize log collection from production to validate the completed fixes.
2. Kick off Phase 1 gateway audit, starting with auth middleware, proxy rewrites, and health aggregation routes.
3. Schedule follow-up checkpoints after each phase to update `STATUS_LOG.md` and raise any new issues.

---

**Distribution:** Project Kelmah engineering team via spec-kit repository.  
**Revision Control:** Update this plan as phases complete or scope evolves.
