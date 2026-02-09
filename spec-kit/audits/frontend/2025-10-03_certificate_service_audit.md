# File Audit: `kelmah-frontend/src/modules/worker/services/certificateService.js`
**Audit Date:** October 3, 2025  
**Auditor:** AI Development Agent  
**Primary Status:** 🔄 In Progress (response contract regressions blocking UI)

---

## Primary Analysis
- **Purpose:** Dedicated helper for certificate CRUD, verification, search, and upload flows used by worker dashboard components.
- **Core Responsibilities:**
  - Wrap the consolidated user-service `/api/profile/.../certificates` endpoints exposed through the API Gateway.
  - Normalize axios responses so UI layers can operate on plain arrays/objects.
  - Orchestrate presigned uploads for certificate documents ahead of S3 PUT requests.
- **Key Dependencies:**
  - `userServiceClient` from the shared axios module for authenticated requests.
  - User-service `profile.routes.js` endpoints (`/:workerId/certificates`, `/certificates/:id`, `/uploads/presign`, etc.).
  - UI consumers such as `CertificateUploader.jsx` and `WorkerProfile.jsx`.
- **Data Contracts:**
  - Comments advertise “normalized returns” (arrays/objects) rather than raw axios responses.
  - Upload helper is expected to yield `{ url, fileName, fileSize }` once the S3 PUT succeeds.

---

## Secondary Files Reviewed
| File | Relationship | Status | Notes |
| --- | --- | --- | --- |
| `src/modules/worker/components/CertificateUploader.jsx` | Primary consumer of certificateService helpers. | ⚠️ Issues Found | Component still expects axios-like responses (`response.data`, `uploadResult.data.url`), creating runtime `undefined` usage. |
| `src/modules/worker/services/workerService.js` | Duplicates certificate helpers with stale routes. | ⚠️ Issues Found | Conflicting implementations exacerbate confusion over the canonical response shape. |
| `kelmah-backend/services/user-service/routes/profile.routes.js` | Source of certificate endpoints. | ✅ Reviewed | Confirms `/api/profile/:workerId/certificates` naming used here is correct. |
| `src/modules/common/services/axios.js` | Provides service client and retry stack. | ⚠️ Issues Found | Stale tunnel caching affects certificateService via shared client (covered by prior audit). |

---

## Issues Identified
- **Response Contract Drift (Primary):**
  1. `getWorkerCertificates` now returns an array, but `CertificateUploader` continues to access `response.data`, producing `undefined` certificates in state. Similar `.data` accesses exist for the optional `onCertificatesChange` callback.
  2. `uploadCertificateFile` returns `{ url, fileName, fileSize }`, while the uploader references `uploadResult.data.url`, `uploadResult.data.fileName`, etc., yielding empty values and broken previews.

- **Error Handling & Safety (Secondary):**
  1. S3 PUT via `fetch` never checks `response.ok`; failures silently proceed as success, masking upload problems and causing downstream 404s when the presigned link is invalid.
  2. `createCertificate` trusts `certificateData.workerId`. Missing or mismatched IDs fall through to `/api/profile/undefined/certificates` without a guard or descriptive error.
  3. `unwrap` falls back to the raw axios response object; consumers expecting primitives may receive an axios instance when the backend omits envelopes, reintroducing the contract issues the helper set out to solve.

- **Duplication & Consistency (Secondary):**
  1. Functionality overlaps with the broken certificate helpers inside `workerService.js`, resulting in two diverging code paths and increasing maintenance risk. Consolidation into this module should be enforced once routes are fixed.

---

## Actions & Recommendations
- **Immediate Fixes:**
  - Align `CertificateUploader` (and other consumers) with the normalized return values, or adjust `certificateService` to re-wrap responses in `{ data }` until UI refactors land. Resolve before shipping to avoid empty certificate lists.
  - Validate the S3 upload `fetch` response and throw user-friendly errors when the PUT fails.
  - Guard `createCertificate` / `getWorkerCertificates` with explicit `workerId` checks to prevent malformed URLs.

- **Refactors / Consolidation:**
  - Retire the redundant certificate methods in `workerService.js` once this module becomes the single source of truth.
  - Consider exposing lightweight DTO transformers (e.g., always returning `{ certificates: [] }`) so downstream components can rely on stable shapes while migration work proceeds.
  - Document the expected certificate response schema in spec-kit and update integration tests to cover loader + uploader flows.

- **Follow-up Tickets:**
  - Audit the rest of the certificate UI (profile tabs, analytics dashboards) to ensure they no longer expect axios responses.
  - Add integration coverage for the upload flow, including failure simulation when S3 returns an error.
  - Coordinate with the axios tunnel reset feature so long-lived certificate operations survive tunnel rotations.

---

**Next Primary Audit Candidate:** `src/modules/worker/services/portfolioService.js` to verify portfolio CRUD uses the same canonical `/api/profile` routes and keeps its return contracts aligned with UI components.
