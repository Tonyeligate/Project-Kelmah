# File Audit: `kelmah-frontend/src/modules/worker/services/portfolioApi.js`
**Audit Date:** October 3, 2025  
**Auditor:** AI Development Agent  
**Primary Status:** ⚠️ Minor issues (Sequelize controller + multipart upload config drift)

---

## Primary Analysis
- **Purpose:** Lightweight wrapper exposing portfolio CRUD helpers for worker UI components (portfolio page, work sample uploader).
- **Core Responsibilities (as written):**
  - Fetch worker portfolio listings (`getWorkerPortfolio`) and single items (`getPortfolioItem`) from user-service profile routes.
  - Search portfolio catalog via `/api/profile/portfolio/search` endpoint.
  - Upload work samples and certificates using multipart form data to legacy direct-upload endpoints.
- **Key Dependencies:**
  - Shared axios client from `modules/common/services/axios` (gateway-aware).
  - Profile routes exposed through user-service (`/api/profile/*`).
- **Declared Data Contracts:**
  - Each helper unwraps the axios envelope (`data?.data || data`), but consumers rely on backend response shape without further normalization.

---

## Secondary Files Reviewed
| File | Relationship | Status | Notes |
| --- | --- | --- | --- |
| `kelmah-frontend/src/modules/worker/components/WorkSampleUploader.jsx` | Consumer for `portfolioApi.uploadWorkSamples`. | ⚠️ Issues | Calls multipart upload endpoint, which the backend disables in production via `ENABLE_S3_UPLOADS !== 'true'` check. |
| `kelmah-frontend/src/modules/worker/pages/PortfolioPage.jsx` | Consumer for listing and search helpers. | ⚠️ Issues | Relies on `getMyPortfolio`, which is stable but does not handle Sequelize-style pagination from the backend. |
| `kelmah-frontend/src/modules/worker/components/CertificateManager.jsx` | Consumer for `portfolioApi.uploadCertificates`. | ⚠️ Issues | Hits the same multipart route and will fail in production unless env toggles are aligned with frontend. |
| `kelmah-backend/services/user-service/routes/profile.routes.js` | Backend route definitions. | ✅ Reviewed | Confirms GET routes exist for `/portfolio/search`, `/workers/:workerId/portfolio`, `/portfolio/:id`; multipart uploads conditionally disabled. |
| `kelmah-backend/services/user-service/controllers/portfolio.controller.js` | Route handlers. | ⚠️ Issues | Still uses Sequelize ORM (`findAndCountAll`, `Op.or`) even though platform is 100% MongoDB/Mongoose—requires immediate conversion or will fail in production runtime. |

---

## Issues Identified
- **Primary Issue 1 – Backend Sequelize Drift:**
  - `portfolio.controller.js` references `findAndCountAll`, `Op.iLike`, and Sequelize associations (`include`, `as`), but the user-service is consolidated on Mongoose. Every portfolio query will throw `TypeError` or return undefined until the controller is rewritten for MongoDB.
  - Routes are registered, so frontend helpers will 404 or 500 instead of returning portfolio data.

- **Secondary Issue 2 – Multipart Upload Config Mismatch:**
  - The `uploadWorkSamples` and `uploadCertificates` helpers still target `/api/profile/portfolio/upload` and `/api/profile/certificates/upload`, but the backend stubs these routes in production (`ENABLE_S3_UPLOADS !== 'true'`) and returns HTTP 400 "Direct uploads disabled."
  - Frontend has no fallback to presigned URLs, so uploads break entirely in production environments.

- **Secondary Issue 3 – DTO Envelope Drift:**
  - The `portfolioApi` unwraps responses with `data?.data || data`, but backend sends Sequelize pagination envelopes (`{ count, rows }`) while Mongoose handlers would send `{ total, items }` or similar—this inconsistency creates confusion when the controller is eventually fixed.
  
- **Secondary Issue 4 – Missing Error Context:**
  - Helpers silently rethrow axios errors without adding contextual messages, making debugging harder when backend returns 500 or validation failures.

---

## Actions & Recommendations
- **Immediate (Blocker):**
  - Convert `portfolio.controller.js` to Mongoose patterns (`Portfolio.find()`, `Portfolio.countDocuments()`, populate via `.populate()`) to restore portfolio functionality before production.
  - Document Sequelize → Mongoose migration guidance in spec-kit for future controller audits.

- **Multipart Upload Fix:**
  - Refactor `WorkSampleUploader` and `CertificateManager` to call the presigned URL endpoint (`/api/profile/uploads/presign`) and execute the PUT directly to S3, bypassing the legacy multipart routes.
  - If direct uploads remain enabled in dev, add env-aware logic in frontend to gracefully fallback between presign and direct upload modes.

- **DTO Normalization:**
  - Align backend pagination responses to a consistent Mongoose shape (`{ items: [...], total: N }`), then update `portfolioApi` to wrap that format consistently for UI consumers.
  - Add unit tests verifying the response shape to prevent regressions when controllers change.

- **Error Handling:**
  - Wrap each helper with custom error messages (e.g., "Failed to fetch portfolio items") and log relevant context before rethrowing, improving observability.

---

**Next Primary Audit Candidate:** Review `src/modules/notifications/services/notificationService.js` to ensure messaging/notification integration aligns with the consolidated messaging-service endpoints.
