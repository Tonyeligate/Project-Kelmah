# Media Trust Surface Audit

**Date**: March 8, 2026  
**Status**: Completed

## Goal

Identify where Kelmah should use images and videos to increase trust, improve hiring confidence, and make the vocational marketplace more productive, while standardizing storage on Cloudinary.

## Marketplace Logic

Kelmah is a vocational hiring platform. Trust is created when hirers can quickly verify:

- who the worker is,
- what the worker has actually built,
- whether the worker has proof of training or certification,
- what the actual job site or requested work looks like,
- and whether both sides can exchange visual proof during execution.

For this product, media is not decoration. Media is operational trust data.

---

## Highest-Value Media Surfaces

### Tier 1 — Must-have trust media

#### 1. Worker profile photo
- **Why it matters**: This is the first trust signal in search, cards, messaging, and profile pages.
- **Current surface**:
  - `User.profilePicture`
  - worker card avatar rendering
  - worker profile hero avatar
- **Frontend evidence**:
  - `WorkerCard` already consumes a worker avatar shape.
  - `WorkerProfile` already renders the main worker avatar.
- **Backend evidence**:
  - `User` already has `profilePicture`.
- **Cloudinary plan**:
  - Store original asset plus transformed thumbnail, card, and full-profile variants.

#### 2. Worker portfolio gallery
- **Why it matters**: Vocational hiring depends heavily on seeing previous work.
- **Current surface**:
  - portfolio manager upload flow
  - public worker portfolio gallery
  - portfolio model with image/video/document support
- **Frontend evidence**:
  - portfolio upload already exists in the worker editor.
  - public profile already renders portfolio cards and modal detail.
- **Backend evidence**:
  - `Portfolio` already has `mainImage`, `images`, `videos`, and `documents`.
- **Cloudinary plan**:
  - Move portfolio images/videos to Cloudinary.
  - Keep one canonical media array shape with `publicId`, `resourceType`, `secureUrl`, `thumbnailUrl`, `width`, `height`, and optional `duration`.

#### 3. Certificate / license proof
- **Why it matters**: Formal proof is a major differentiator for skilled workers.
- **Current surface**:
  - certificate uploader UI
  - certificate service presign upload flow
  - public profile certificate list
- **Frontend evidence**:
  - certificate upload UI already accepts images and documents.
  - worker profile already renders certificate summaries.
- **Backend evidence**:
  - `Certificate.url` already stores an uploaded proof reference.
- **Cloudinary plan**:
  - Use Cloudinary for image certificates and optionally PDFs/raw docs.
  - Add preview thumbnail support for certificate images.

#### 4. Job cover image / job-site photo
- **Why it matters**: Workers respond better when they can see the site, scale, or condition of the work.
- **Current surface**:
  - job posting already has optional cover image upload.
- **Frontend evidence**:
  - hirer job posting screen already prompts for a cover image.
- **Backend evidence**:
  - `Job` already has `coverImage` and `attachments`.
- **Cloudinary plan**:
  - Support multiple job-site images over time, not just one cover image.
  - Keep a primary image for cards and detail pages.

---

### Tier 2 — Strong productivity media

#### 5. Messaging image/video attachments
- **Why it matters**: Workers and hirers need to exchange site photos, progress photos, damaged-area images, measurements, and short videos.
- **Current surface**:
  - messaging composer supports attachments and image previews.
  - message model already supports attachment metadata.
- **Frontend evidence**:
  - messaging page supports selected files, image previews, and attachment rendering.
- **Backend evidence**:
  - `Message.messageType` supports `image` and `file`.
  - `Message.attachments` already persists attachment metadata.
- **Cloudinary plan**:
  - Add Cloudinary image/video upload for chat attachments.
  - Keep virus-scan/document checks for non-image raw files.
  - Use transformed previews for inline thread rendering.

#### 6. Application evidence attachments
- **Why it matters**: A worker should be able to attach sample work, estimate diagrams, or proof relevant to a bid.
- **Current surface**:
  - `Application.attachments` already exists in the shared model.
- **Gap**:
  - the surfaced audit did not show a strong frontend media-first application flow yet.
- **Cloudinary plan**:
  - add image/document attachments to job applications with preview support.

#### 7. Job lifecycle proof uploads
- **Why it matters**: Before/after proof, milestone proof, and completion evidence reduce disputes.
- **Current surface**:
  - model support is fragmented across jobs, applications, and messages.
- **Gap**:
  - there is no dedicated structured proof gallery tied to a job or contract lifecycle.
- **Cloudinary plan**:
  - introduce per-job or per-contract media collections for progress updates.

---

### Tier 3 — Next-phase trust multipliers

#### 8. Review photo proof
- **Why it matters**: Reviews become much more credible when tied to a completed job photo.
- **Current surface**:
  - review components currently render author avatars and text only.
- **Gap**:
  - no review-photo or review-proof model surfaced in the audit.
- **Cloudinary plan**:
  - allow 1–3 review images for completed jobs.

#### 9. Hirer/company brand media
- **Why it matters**: Workers also need to trust the hirer.
- **Current surface**:
  - no dedicated company logo/business gallery field was surfaced in the shared model audit.
- **Gap**:
  - hirer identity is visually weaker than worker identity.
- **Cloudinary plan**:
  - add business logo, company banner, or project-board image support for hirer accounts.

#### 10. Video intros and short work reels
- **Why it matters**: For artisans, a short clip can prove workmanship faster than text.
- **Current surface**:
  - `Portfolio.videos` exists already.
- **Cloudinary plan**:
  - enable short compressed video clips with thumbnails and duration limits.

---

## File Surface Mapped

### Frontend
- `kelmah-frontend/src/modules/common/services/fileUploadService.js`
- `kelmah-frontend/src/modules/worker/components/PortfolioManager.jsx`
- `kelmah-frontend/src/modules/worker/pages/WorkerProfileEditPage.jsx`
- `kelmah-frontend/src/modules/worker/components/WorkerCard.jsx`
- `kelmah-frontend/src/modules/worker/components/WorkerProfile.jsx`
- `kelmah-frontend/src/modules/worker/components/CertificateUploader.jsx`
- `kelmah-frontend/src/modules/worker/services/workerService.js`
- `kelmah-frontend/src/modules/worker/services/certificateService.js`
- `kelmah-frontend/src/modules/hirer/pages/JobPostingPage.jsx`
- `kelmah-frontend/src/modules/messaging/pages/MessagingPage.jsx`
- `kelmah-frontend/src/modules/reviews/components/common/ReviewCard.jsx`
- `kelmah-frontend/src/modules/reviews/components/common/ReviewList.jsx`

### Backend
- `kelmah-backend/services/user-service/routes/profile.routes.js`
- `kelmah-backend/services/user-service/models/Portfolio.js`
- `kelmah-backend/services/user-service/models/Certificate.js`
- `kelmah-backend/shared/models/User.js`
- `kelmah-backend/shared/models/Job.js`
- `kelmah-backend/shared/models/Application.js`
- `kelmah-backend/services/messaging-service/models/Message.js`
- `kelmah-backend/services/messaging-service/controllers/message.controller.js`

---

## Existing Data Flow Summary

### Worker portfolio upload flow today
UI: `PortfolioManager.jsx`
→ frontend upload service: `fileUploadService.js`
→ user-service route: `/profile/uploads/presign`
→ S3 presign response
→ browser uploads file directly
→ returned URL stored in portfolio item

### Certificate upload flow today
UI: `CertificateUploader.jsx`
→ frontend service: `certificateService.uploadCertificateFile()`
→ user-service route: `/profile/uploads/presign`
→ S3 presign response
→ browser uploads file directly
→ returned URL stored in certificate record

### Messaging attachment flow today
UI: `MessagingPage.jsx`
→ composed attachments array
→ messaging controller persists attachment metadata
→ `Message.attachments`
→ realtime emission with attachment payload

---

## Core Architecture Recommendation

## 1. Standardize all image/video storage on Cloudinary

Use Cloudinary for:
- worker avatars
- portfolio images
- portfolio videos
- job cover images
- job progress images
- review photos
- messaging images/videos
- hirer/company logos

Keep document files in one of two ways:
- either also use Cloudinary `raw` uploads for PDFs/docs,
- or keep documents on a separate document-safe path while images/videos use Cloudinary.

Because the user request explicitly says Cloudinary should store anything related to images and videos, that should be the mandatory default for visual media.

## 2. Introduce a shared media object shape

Recommended stored shape:

- `publicId`
- `resourceType`
- `secureUrl`
- `thumbnailUrl`
- `originalFilename`
- `bytes`
- `width`
- `height`
- `duration`
- `format`
- `uploadedAt`

This can coexist with existing simple URL fields during migration.

## 3. Replace S3-presign-first frontend assumptions

Primary migration points:
- `fileUploadService.js`
- `certificateService.js`
- any worker/job/media uploader using direct `FormData` or presign responses

These should move to one shared media upload contract, ideally:
- frontend asks backend for upload authorization or posts file to a backend upload endpoint,
- backend uploads to Cloudinary or signs a direct Cloudinary upload,
- backend returns normalized media metadata.

## 4. Add a shared backend media utility

Recommended shared backend additions:
- `kelmah-backend/shared/utils/cloudinary.js`
- `kelmah-backend/shared/services/media.service.js`
- optional `kelmah-backend/shared/middlewares/mediaValidation.js`

This keeps service boundaries clean while avoiding copy-pasted upload logic.

---

## Suggested Rollout Order

### Phase 1
- worker profile photo
- portfolio images
- certificate proof images
- job cover image

### Phase 2
- messaging image/video attachments
- application evidence attachments
- richer job gallery support

### Phase 3
- review photo proof
- hirer/company logos
- contract milestone progress galleries
- worker intro videos

---

## Key Gaps Found

1. Upload architecture is still centered on S3 presign routes.
2. Media metadata is inconsistent across models.
3. Reviews do not yet support proof media.
4. Hirer/company visual identity is underrepresented.
5. Job execution proof media is not yet modeled as a first-class workflow.

---

## Recommendation Summary

If Kelmah wants the fastest trust gain, implement these first:

1. worker profile photos,
2. portfolio galleries,
3. certificate proof uploads,
4. job-site cover images,
5. messaging image/video attachments.

That set will deliver the biggest credibility improvement with the least product ambiguity because most of the UI and model surfaces already exist.