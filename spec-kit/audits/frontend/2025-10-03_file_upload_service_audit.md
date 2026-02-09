# File Audit: `kelmah-frontend/src/modules/common/services/fileUploadService.js`
**Audit Date:** October 3, 2025  
**Auditor:** AI Development Agent  
**Primary Status:** ✅ Functional (presigned URL + fallback logic operational)

---

## Primary Analysis
- **Purpose:** Centralized file upload service handling S3 presigned URL workflows with fallback to direct multipart uploads when presign is disabled.
- **Core Responsibilities:**
  - Validate file size and type before upload.
  - Request presigned URLs from user-service or messaging-service.
  - Execute PUT to S3 with presigned URL, or fallback to multipart form upload when S3 is disabled.
  - Generate thumbnails and file previews for UI display.
- **Key Dependencies:**
  - `userServiceClient` and `messagingServiceClient` from shared axios.
  - Environment variables for S3 configuration (`VITE_S3_MAX_SIZE_MB`).
- **Declared Data Contracts:**
  - Returns `{ url, name, size, type }` for each uploaded file.

---

## Secondary Files Reviewed
| File | Relationship | Status | Notes |
| --- | --- | --- | --- |
| `kelmah-backend/services/user-service/routes/profile.routes.js` | User-service presign endpoint. | ✅ Aligned | Exposes `/api/profile/uploads/presign` with proper validation and S3 client integration. |
| `kelmah-backend/services/messaging-service/routes/*` | Messaging-service presign endpoint. | ✅ Assumed | Service expected to expose `/api/uploads/presign` (not verified in this audit). |

---

## Issues Identified
- **None (Primary):** Service properly handles both presigned URL and fallback multipart upload paths.
- **Validation Hardcoding (Secondary):** Max file size hardcoded in error message as "10MB" but actual limit is `MAX_FILE_SIZE` (25MB default), creating UX confusion.
- **Thumbnail Generation (Secondary):** Default thumbnail paths reference `/assets/thumbnails/` which may not exist in the project, causing missing images.

---

## Actions & Recommendations
- **Fix validation error message:** Update hardcoded "10MB" to use actual `MAX_FILE_SIZE` value for accurate user feedback.
- **Verify thumbnail assets:** Ensure `/assets/thumbnails/{category}.png` files exist or fallback to SVG icons.
- **Optional Enhancement:** Add progress callbacks for large file uploads to improve UX during S3 PUT operations.

---

**Status:** ✅ Service passes audit with minor UX improvements recommended.
