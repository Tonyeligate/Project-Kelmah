# File Audit: `kelmah-frontend/src/modules/worker/services/workerService.js`
**Audit Date:** October 3, 2025  
**Auditor:** AI Development Agent  
**Primary Status:** 🔄 In Progress (blocking route mismatches outstanding)

---

## Primary Analysis
- **Purpose:** Central hub for worker-oriented API calls powering dashboards, profile management, bookmarking, availability, and job interactions.
- **Core Responsibilities:**
  - Wrap the shared axios service clients (`userServiceClient`, `jobServiceClient`) with worker-specific endpoints.
  - Normalize responses for UI consumers (worker profile, dashboard, skills assessment).
  - Provide graceful fallbacks (e.g., legacy `/api/availability/:id` route) while services converge on consolidated namespaces.
- **Key Dependencies:**
  - `src/modules/common/services/axios.js` for auth tokens, retry behavior, and service discovery.
  - `user-service` and `job-service` API gateway routes mounted under `/api/users/*` and `/api/jobs/*`.
  - Frontend consumers such as `WorkerProfile.jsx`, `EnhancedWorkerDashboard.jsx`, `SkillsAssessmentPage.jsx`, and Redux slices for saved jobs/applications.
- **Data Contracts:**
  - Most helpers are expected to return either the raw axios response or an extracted `{ data }` payload; consumers frequently perform their own `res?.data?.data` checks.
  - Availability helpers must guarantee boolean `isAvailable` and tolerate legacy payloads.
  - Bookmark/job helpers rely on gateway auth to enforce user context (no explicit userId argument).

---

## Secondary Files Reviewed
| File | Relationship | Status | Notes |
| --- | --- | --- | --- |
| `src/modules/worker/services/portfolioService.js` | Provides dedicated portfolio CRUD helpers with the correct `/api/profile` routes. | ⚠️ Issues Found | `workerService` duplicates similar methods but targets different (and mostly invalid) endpoints. |
| `src/modules/worker/services/certificateService.js` | Handles certificate CRUD via `/api/profile` prefixes. | ⚠️ Issues Found | Confirms canonical certificate endpoints differ from those hard-coded in `workerService`. |
| `src/modules/common/services/axios.js` | Supplies service clients and `normalizeUrlForGateway`. | ⚠️ Issues Found | Cached base URLs and legacy headers noted in prior audit propagate into this service. |
| `kelmah-backend/api-gateway/routes/user.routes.js` & user-service route files | Define the actual paths proxied for worker operations. | ✅ Reviewed | Reference for detecting mismatched URLs in `workerService`. |

---

## Issues Identified
- **Routing Accuracy:**
  1. **Portfolio Mutations Miss Gateway Routes (Primary):** `addPortfolioItem`, `updatePortfolioItem`, and `deletePortfolioItem` call `${API_URL}/${workerId}/portfolio[...]`, yet the backend exposes `/api/profile/portfolio` (no workerId segment). Calls return 404 while the dedicated `portfolioService` already targets the correct endpoints.
  2. **Certificate Paths Diverge from Backend (Primary):** Certificate helpers use `${API_URL}/${workerId}/certificates` and `/certificates/:id`, but user-service routes reside under `/api/profile/:workerId/certificates` and `/api/profile/certificates/:id`. Current implementation cannot manage certificates successfully.
  3. **Profile Image Upload Endpoint Missing (Primary):** `uploadProfileImage` posts to `${API_URL}/${workerId}/image`, yet neither API Gateway nor user-service define this path. Consumers likely rely on the newer `/api/profile/uploads/presign` flow handled elsewhere, leaving this helper broken.
  4. **Mixed Absolute vs Relative Paths (Secondary):** Some helpers reuse `API_URL`, others hard-code `/api/...` prefixes. Inconsistent usage complicates future consolidation and increases chances of accidental double `/api` segments despite the axios normalizer.

- **Responsibility & Duplication:**
  1. **Overlap with Specialized Services (Primary):** Portfolio and certificate operations duplicate logic provided by `portfolioService` and `certificateService` but point to different endpoints. This duplication obscures the canonical API surface and risks regressions when only one copy is updated.
  2. **Saved Jobs & Applications Return Raw Responses (Secondary):** Helpers such as `getSavedJobs` and `getApplications` return `response.data` without harmonizing success envelopes, forcing UI callers to handle multiple response shapes alongside the normalized helpers earlier in the file.
  3. **Bookmark Toggle Depends on Dual POST/DELETE (Secondary):** Server currently exposes a POST-only `toggleBookmark` controller. Our DELETE call works courtesy of the controller's guard, but the contract is undocumented and may break once the backend enforces verbs strictly.

- **Observability & Error Handling:**
  1. **Availability Fallback Lacks Logging (Secondary):** When the primary `/users/:id/availability` route 404s, the silent fallback hides remediation opportunities; spec-kit already tracks this detour but the service provides no visibility.

---

## Actions & Recommendations
- **Immediate Fixes:**
  - Replace the broken portfolio/certificate methods with thin wrappers around `portfolioService` and `certificateService`, or align their URLs with `/api/profile/...` routes so they succeed through the gateway.
  - Remove or deprecate `uploadProfileImage` in favor of the presign workflow (`portfolioService.uploadPortfolioImage`) to prevent consumers from relying on a nonexistent endpoint.
  - Standardize response normalization (e.g., `const payload = res?.data?.data ?? res?.data ?? null`) across helpers to reduce consumer branching.

- **Refactors / Consolidation:**
  - Extract a shared worker API mapper (e.g., `src/modules/worker/services/index.js`) that composes the specialized services instead of duplicating endpoint strings in `workerService`.
  - Document the availability fallback behavior and migrate once the legacy `/api/availability/:id` endpoint is retired.
  - Coordinate with the axios/tunnel reset work so long-lived service clients pick up tunnel rotations automatically.

- **Follow-up Tickets:**
  - Audit remaining worker service files (`applicationsApi.js`, `earningsService.js`, `portfolioService.js`) for consistency once the consolidation plan is in place.
  - Add integration tests covering portfolio/certificate CRUD flows to catch broken URLs before deployment.
  - Update spec-kit runtime documentation to specify the canonical upload flow (presign vs direct multipart) for worker assets.

---

**Next Primary Audit Candidate:** Worker portfolio and certificate service modules to confirm they remain the single source of truth once duplication is resolved.
