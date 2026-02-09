# Kelmah Platform – Sector Audit Index

**Generated:** October 1, 2025  
**Purpose:** Provide a master index of audit sectors, associated directories, and priority order for the end-to-end dry audit cycle.

---

## Backend Sectors
| Sector | Directories / Key Files | Audit Notes |
| --- | --- | --- |
| API Gateway | `kelmah-backend/api-gateway/` (routes/, proxy/, middlewares/, utils/, server.js) | Verify proxy rewrites, auth middleware, health monitor, and deployment configs. Inventory dynamic route loaders and shared middleware usage. |
| Shared Library | `kelmah-backend/shared/` (models/, middlewares/, utils/) | Confirm shared resources remain the single source of truth; flag duplicate implementations inside services. |
| Auth Service | `kelmah-backend/services/auth-service/` | Audit controllers, routes, services, background jobs, and ensure JWT utilities align with shared module. |
| User Service | `kelmah-backend/services/user-service/` | Focus on worker/hirer endpoints, readiness guard, profile/settings flows, and Mongo-only queries. |
| Job Service | `kelmah-backend/services/job-service/` | Examine job distribution logic, application flows, bids, performance analytics, and shared model usage. |
| Messaging Service | `kelmah-backend/services/messaging-service/` | Review socket handlers, message persistence, notification triggers, and duplication with shared utils. |
| Payment Service | `kelmah-backend/services/payment-service/` | Inspect transaction flows, escrow handling, Stripe integration, and consolidated models. |
| Review Service | `kelmah-backend/services/review-service/` | Validate MVC rewrite, moderation pipelines, and worker rating aggregation. |
| DevOps & Scripts | `kelmah-backend/config/`, `start-*.js`, `deploy-*.sh`, `docs/`, root scripts | Ensure scripts reflect consolidated architecture and remove obsolete automation. |

## Frontend Sectors
| Sector | Directories / Key Files | Audit Notes |
| --- | --- | --- |
| Core Config & Services | `kelmah-frontend/src/config/`, `src/modules/common/services/axios.js`, `src/utils/` | Validate environment detection, axios interceptors, service health utilities, and shared hooks. |
| Auth Module | `kelmah-frontend/src/modules/auth/` | Examine login/register flows, token handling, MFA UI, and route guards. |
| Jobs Module | `kelmah-frontend/src/modules/jobs/` | Review job discovery pages, job cards, filtering, and integration with gateway updates. |
| Messaging Module | `kelmah-frontend/src/modules/messaging/` | Audit chat UI, websocket connectivity, notifications, and attachment handling. |
| Dashboard & Marketplace | `kelmah-frontend/src/modules/dashboard/`, `marketplace/`, `analytics/` | Confirm widgets consume latest APIs and reflect consolidated data models. |
| Worker Experience | `kelmah-frontend/src/modules/worker/`, `profile/`, `settings/`, `calendar/`, `scheduling/` | Check profile completeness flows, calendar integrations, and worker-side job management. |
| Hirer Experience | `kelmah-frontend/src/modules/hirer/`, `contracts/`, `payment/`, `reviews/` | Review contract management, payment flows, review submission, and premium features. |
| Shared UI Library | `kelmah-frontend/src/modules/common/`, `layout/`, `home/`, `search/`, `notifications/` | Ensure design system consistency, eliminate duplicate components, and validate shared hooks. |

## Cross-Cutting Assets
- **Database & Migration Artifacts:** `kelmah-backend/migrations/`, `migrations-mongodb/`
- **Testing Utilities:** `tests/`, `kelmah-backend/test-*.js`, frontend test suites
- **Infrastructure & Deployment:** root `render.yaml`, `deploy-*.sh`, `vercel.json`, `/spec-kit/` documentation

---

## Audit Process Checklist
1. **Select Sector:** Start with highest-risk domains (Messaging, Jobs) per user directive.
2. **Enumerate Files:** Use this index as the seed list; expand with connected files discovered during each primary audit.
3. **Apply Template:** For every file, log findings in a sector-specific markdown using `templates/sector-audit-template.md`.
4. **Capture Dependencies:** When a primary file references another module, add the secondary file to the audit queue for its own primary review.
5. **Document Remediation:** Record code additions/removals, deprecations, and follow-up tasks in `spec-kit/STATUS_LOG.md` with cross-links to sector reports.
6. **Update Index:** Mark sectors and files as audits progress to maintain visibility.

---

*This index will evolve as new relationships are uncovered. Update the file after each audit session to keep the roadmap current.*
