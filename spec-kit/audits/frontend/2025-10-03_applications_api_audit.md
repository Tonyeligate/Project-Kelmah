# File Audit: `kelmah-frontend/src/modules/worker/services/applicationsApi.js`
**Audit Date:** October 3, 2025  
**Auditor:** AI Development Agent  
**Primary Status:** ❌ Blocked (route mismatches + missing backend coverage)

---

## Primary Analysis
- **Purpose:** Thin wrapper intended to manage worker job applications (list, detail, submit, withdraw, update, stats) against the consolidated job-service backend.
- **Core Responsibilities (as written):**
  - Fetch the current worker's applications (`getMyApplications`).
  - Retrieve a single application (`getApplicationById`).
  - Submit/withdraw/update applications via job-service endpoints.
  - Provide aggregate application statistics for dashboards.
- **Key Dependencies:**
  - `jobServiceClient` from `modules/common/services/axios` (shared gateway-aware axios instance).
  - Job-service controllers routed through the API Gateway.
- **Declared Data Contracts:**
  - Each helper returns `response.data.data || response.data`, attempting to unwrap the Axios envelope but without enforcing a consistent DTO.

---

## Secondary Files Reviewed
| File | Relationship | Status | Notes |
| --- | --- | --- | --- |
| `kelmah-frontend/src/modules/worker/services/workerService.js` | Exposes live helpers for applications (`getApplications`, `applyToJob`, `withdrawApplication`). | ⚠️ Issues Found | Uses correct `/api/jobs/applications/me` route, but still duplicates logic and diverges from backend contracts. Demonstrates that `applicationsApi` is redundant and stale. |
| `kelmah-backend/services/job-service/routes/job.routes.js` | Defines real job & application endpoints. | ✅ Reviewed | Worker routes live under `/api/jobs/...`; only `/api/jobs/applications/me` exists for worker listings—no `/api/applications/*` routes provided. |
| `kelmah-backend/services/job-service/controllers/job.controller.js` | Implements application CRUD. | ✅ Reviewed | Requires both `jobId` and `applicationId` for mutations; no handler for `/api/applications/:id` or `/stats`. Confirms frontend path drift. |

---

## Issues Identified
- **Routing Mismatch (Primary):**
  1. `getMyApplications` targets `/api/applications/my-applications`, but the consolidated backend exposes `GET /api/jobs/applications/me`. Current call returns 404 via the gateway.
  2. `getApplicationById`, `updateApplication`, and `withdrawApplication` all hit `/api/applications/:applicationId`; the job service requires `/api/jobs/:jobId/applications/:applicationId`, and no standalone GET endpoint exists. These helpers are unusable as written.
  3. `getApplicationStats` references `/api/applications/stats`, which does not exist anywhere in the backend. Every invocation will throw.
- **Parameter Contract Gaps (Primary):**
  1. Mutation helpers omit the required `jobId` path segment, so even if routes existed, the backend could not authorize or locate the records.
- **Redundancy / Divergence (Secondary):**
  1. Worker dashboard already relies on `workerService.getApplications`, which uses the correct `/api/jobs/applications/me` route. Maintaining a second, broken service increases cognitive load and regression risk.
  2. Error handling merely rethrows axios errors without contextual messaging or graceful fallbacks, making observability poor when the stale endpoints 404.

---

## Actions & Recommendations
- **Immediate:**
  - Deprecate or remove `applicationsApi` until rebuilt against the consolidated job-service contracts. Prevent imports to avoid accidental usage.
  - If temporary retention is required, replace each helper with `throw new Error('applicationsApi deprecated: use workerService.getApplications / jobService routes instead');` so consumers immediately surface the mismatch.
- **Refactor Path (post-remediation):**
  - Re-implement helpers to mirror live routes: e.g., `getMyApplications` → `GET /api/jobs/applications/me`; `updateApplication`/`withdrawApplication` should accept both `jobId` and `applicationId` and hit `/api/jobs/:jobId/applications/:applicationId` with role-aware guards.
  - Document DTO expectations (list vs single object) to keep UI components consistent and add unit tests around the normalized responses.
  - Consider consolidating all worker-facing application helpers inside a single module (either this file or `workerService`) to avoid divergent implementations.

---

**Next Primary Audit Candidate:** Review `src/modules/worker/services/availabilityService.js` (or next worker-domain helper) to ensure remaining dashboard services align with consolidated job/user routes.
