# File Audit: `kelmah-frontend/src/modules/worker/services/earningsService.js`
**Audit Date:** October 3, 2025  
**Auditor:** AI Development Agent  
**Primary Status:** 🔄 In Progress (blocking route + fallback gaps)

---

## Primary Analysis
- **Purpose:** Intended to provide worker-facing earnings analytics, payment history, tax data, and CSV exports.
- **Core Responsibilities (as written):**
  - Call `GET /api/workers/:id/earnings/*` endpoints for analytics, breakdown, projections, and exports.
  - Return axios `response.data` for consumers to render charts and downloadable assets.
- **Key Dependencies:**
  - `userServiceClient` from the shared axios module.
  - User-service API routes proxied through the gateway.
- **Declared Data Contracts:**
  - Each helper wraps a GET request and returns whatever `.data` the backend provided, without normalization.

---

## Secondary Files Reviewed
| File | Relationship | Status | Notes |
| --- | --- | --- | --- |
| `src/modules/worker/services/workerService.js` | Exposes `getWorkerEarnings(workerId, filters)` that aligns to `/api/users/workers/:id/earnings`. | ⚠️ Issues Found | Active UI consumers rely on this helper instead; `earningsService` is unused. |
| `src/modules/worker/components/EarningsTracker.jsx` | Historical consumer for mock/real combo. | ⚠️ Issues Found | Live fetch blocked (commented out) due to missing endpoints, confirming earningsService drift. |
| `kelmah-backend/services/user-service/routes/user.routes.js` | Defines real earnings route. | ✅ Reviewed | Only `/api/users/workers/:workerId/earnings` exists; none of the `/earnings/*` subroutes from earningsService are implemented. |

---

## Issues Identified
- **Routing Mismatch (Primary):**
  1. Every endpoint this module calls (`/earnings/analytics`, `/payments/history`, `/earnings/export`, etc.) is **non-existent** in the user-service gateway. Only `/api/users/workers/:id/earnings` is implemented today. All methods will 404.
  2. Since consumers shifted to `workerService.getWorkerEarnings`, this module silently diverged and is effectively dead code. Any future developer who reuses it will hit broken routes.

- **Fallback Strategy Regression (Secondary):**
  1. Earlier versions included mock generators to keep the dashboard alive while backend work was pending. These were removed (“All methods now use real API or throw on failure”), so calling the service now produces unhandled rejections.

- **Response Handling & Observability (Secondary):**
  1. Methods simply `return response.data` or re-throw the axios error. No consistent shape (e.g., `{ totals, breakdown }`) is provided even if endpoints later materialize.
  2. No logging or contextual messaging is added, making debugging harder when 404s occur.

- **Duplication / Maintenance Debt (Secondary):**
  1. `workerService.js` already provides a working `getWorkerEarnings`. Leaving a second, broken module increases cognitive load and risk of future regressions.

---

## Actions & Recommendations
- **Immediate Fixes:**
  - Mark this module as deprecated or delete it entirely until real earnings feature parity exists. Point consumers to `workerService.getWorkerEarnings` (which matches the live backend contract).
  - If retained temporarily, stub each method with an explicit error (`throw new Error('Earnings service endpoints not yet implemented');`) so new callers discover the limitation quickly.
- **Refactors / Follow-ups:**
  - Coordinate with backend to design the expected `/earnings/*` endpoints before reintroducing the service. Document required payloads in spec-kit to avoid future mismatch.
  - When services are ready, reintroduce with normalized return types (e.g., totals, breakdown arrays, CSV metadata) and add unit tests or contract tests.
  - Restore mock/fallback behavior behind a feature flag if the dashboard must continue functioning while backend work proceeds.

---

**Next Primary Audit Candidate:** `src/modules/worker/services/applicationsApi.js` to ensure job application workflows point to the consolidated job-service routes and handle retry/authorization correctly.
