# File Audit: `kelmah-frontend/src/modules/worker/services/portfolioService.js`
**Audit Date:** October 3, 2025  
**Auditor:** AI Development Agent  
**Primary Status:** 🔄 In Progress (blocking upload + response drift issues outstanding)

---

## Primary Analysis
- **Purpose:** Dedicated helper for worker portfolio CRUD, sharing, and statistics used by dashboard components.
- **Core Responsibilities:**
  - Call the user-service portfolio routes via the gateway (`/api/profile/...`) for read/write operations.
  - Return data in a shape consumable by `PortfolioManager.jsx` and related UI.
  - Expose upload utilities for images ahead of S3 presigned PUTs.
- **Key Dependencies:**
  - `userServiceClient` from the shared axios module for authenticated requests.
  - Backend `profile.routes.js` portfolio endpoints (CRUD, share, stats, upload).
  - UI consumer `PortfolioManager.jsx`, which expects stable property names (`portfolioItems`, `items`).
- **Data Contracts:**
  - Comments promise `{ data }` style responses, but the implementation returns raw envelopes or objects as-is.
  - Upload helper should surface `{ putUrl, getUrl }` so callers can complete the PUT and capture the resulting URL.

---

## Secondary Files Reviewed
| File | Relationship | Status | Notes |
| --- | --- | --- | --- |
| `src/modules/worker/components/PortfolioManager.jsx` | Primary consumer of read/write helpers. | ⚠️ Issues Found | Still dereferences `payload.portfolioItems`/`payload.items`, but service now returns bare arrays (or nested `data`) inconsistently. |
| `src/modules/common/services/fileUploadService.js` | Alternative upload path used by PortfolioManager. | ✅ Reviewed | Provides presign + PUT + fallback logic that portfolioService duplicates only partially. |
| `kelmah-backend/services/user-service/routes/profile.routes.js` | Source of portfolio endpoints. | ✅ Reviewed | Confirms canonical paths are `/api/profile/portfolio[...]` with optional workerId prefix only on reads/stats. |
| `workerService.js` | Still contains deprecated portfolio helpers pointing to wrong routes. | ⚠️ Issues Found | Needs cleanup once this module becomes single source of truth. |

---

## Issues Identified
- **Response Shape Drift (Primary):**
  1. `getWorkerPortfolio` returns `response.data?.data || response.data`, causing callers to receive either `{ data: [...] }`, `{ portfolioItems: [...] }`, or a bare array depending on backend behavior. `PortfolioManager` expects named fields and falls back to `[]`, so real data can disappear silently.
  2. `createPortfolioItem`, `updatePortfolioItem`, etc., propagate the backend envelope unchanged. Without consistent normalization (`item`, `success`), consumers must guess structures.

- **Upload Contract Mismatch (Primary):**
  1. `uploadPortfolioImage` returns whatever the presign endpoint sends (either `{ data: { putUrl, getUrl } }` or an error message), but the caller never performs the PUT. `PortfolioManager` uses `fileUploadService.uploadFile` instead, leaving this helper effectively broken and unused.

- **Duplication & Inconsistency (Secondary):**
  1. Upload flow overlaps with `fileUploadService.uploadFile` yet lacks fallback logic when presign is disabled, increasing the chance of regressions.
  2. Both `toggleFeatured` and `sharePortfolioItem` return raw axios responses, leading to inconsistent handling compared to other helpers.
  3. `API_URL` constant (`/api/workers`) is unused and misleading after the route consolidation; keeping it invites incorrect reuse.

- **Safety & Validation (Secondary):**
  1. `createPortfolioItem` assumes `portfolioData` already contains `workerId` but doesn’t enforce it, risking POSTs to `/api/profile/portfolio` without a worker context.
  2. No guard or error messaging exists when `userServiceClient` returns non-200 responses (e.g., 403, 404), forcing UI layers to handle thrown axios errors without context.

---

## Actions & Recommendations
- **Immediate Fixes:**
  - Normalize responses so each helper returns a predictable shape (e.g., `{ items: [] }`, `{ item: {...} }`, `{ success: boolean }`). Update `PortfolioManager` to rely on these normalized contracts.
  - Remove or refactor `uploadPortfolioImage`; delegate upload responsibilities to `fileUploadService` to avoid duplicate logic and ensure PUT requests actually execute.
  - Drop the unused `API_URL` constant to prevent future misuse.

- **Refactors / Consolidation:**
  - Migrate the deprecated portfolio helpers out of `workerService.js` so this module remains the single source of truth.
  - Add optional logging/telemetry for failed calls to surface backend issues more clearly during QA.
  - Document the expected DTOs and upload flow in spec-kit to keep UI and service layers aligned.

- **Follow-up Tickets:**
  - Audit portfolio UI components (manager, card renderers, analytics) once normalization lands to ensure they no longer rely on `payload.items` heuristics.
  - Add tests covering both the presign-enabled and presign-disabled upload paths (ensuring fallback routes remain functional).
  - After consolidation, coordinate with backend to provide a typed response contract (e.g., via OpenAPI) for portfolio operations.

---

**Next Primary Audit Candidate:** `src/modules/worker/services/earningsService.js` to verify earnings endpoints follow the corrected `/api/users/workers/...` namespace and maintain consistent return envelopes.
