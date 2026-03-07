# Kelmah Native Jobs Domain — March 6, 2026

**Status**: Completed for current scaffold phase
**Scope**: Implement the first real jobs domain for both native apps on top of the hardened single-endpoint auth/session system.

## Acceptance Criteria
- Android jobs flow supports list, filter, category selection, detail, save/unsave, and apply.
- iOS jobs flow supports list, filter, category selection, detail, save/unsave, and apply.
- Both apps route all jobs requests through one configured gateway origin, with `/api` derived internally.
- Jobs routing is linked from the home surface and inside the jobs flow itself.
- Workspace diagnostics remain clean after the change.

## Dry Audit File Surface
### Backend
- `kelmah-backend/api-gateway/routes/job.routes.js`
- `kelmah-backend/services/job-service/routes/job.routes.js`
- `kelmah-backend/services/job-service/controllers/job.controller.js`

### Frontend references
- `kelmah-frontend/src/modules/jobs/services/jobsService.js`
- `kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx`
- `kelmah-frontend/src/modules/jobs/pages/JobDetailsPage.jsx`

### Android native
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/app/KelmahApp.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/app/navigation/KelmahDestination.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/app/navigation/KelmahNavHost.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/core/network/NetworkModule.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/core/session/SessionCoordinator.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/home/presentation/HomeScreen.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/jobs/**/*`

### iOS native
- `kelmah-mobile-ios/Kelmah/App/AppEnvironment.swift`
- `kelmah-mobile-ios/Kelmah/App/RootTabView.swift`
- `kelmah-mobile-ios/Kelmah/Core/Network/APIClient.swift`
- `kelmah-mobile-ios/Kelmah/Features/Home/Presentation/HomeView.swift`
- `kelmah-mobile-ios/Kelmah/Features/Jobs/**/*`

## End-to-End Data Flow

### Android
Home CTA
→ `HomeScreen`
→ `KelmahNavHost`
→ `JobsScreen`
→ `JobsViewModel`
→ `JobsRepository`
→ `JobsApiService`
→ `GET /api/jobs`, `GET /api/jobs/categories`, `GET /api/jobs/:id`, `POST /api/jobs/:id/save`, `DELETE /api/jobs/:id/save`, `POST /api/jobs/:id/apply`
→ API Gateway
→ Job service
→ normalized native models
→ Compose list/detail/apply UI

### iOS
Home CTA
→ `HomeView`
→ `RootTabView`
→ `JobsView`
→ `JobsViewModel`
→ `JobsRepository`
→ `APIClient`
→ `GET /api/jobs`, `GET /api/jobs/categories`, `GET /api/jobs/:id`, `POST /api/jobs/:id/save`, `DELETE /api/jobs/:id/save`, `POST /api/jobs/:id/apply`
→ API Gateway
→ Job service
→ normalized native models
→ SwiftUI list/detail/apply UI

## Implementation Summary
### Android
- Added normalized jobs models, API service, and repository with defensive JSON parsing.
- Added `JobsViewModel` for discover/saved feeds, pagination, detail loading, save toggles, and application submission.
- Replaced placeholder jobs screen with real Compose jobs list/filter UI.
- Added job detail and job application screens.
- Wired home-to-jobs and jobs detail/apply navigation.
- Strengthened session failure handling so failed refresh clears the local session cleanly.

### iOS
- Added normalized jobs models, raw JSON envelope parsing, and jobs repository.
- Added `JobsViewModel` for discover/saved feeds, pagination, detail loading, save toggles, and application submission.
- Replaced placeholder jobs tab with a real SwiftUI navigation flow.
- Added job detail and job application views.
- Wired home-to-jobs tab switching and in-flow jobs navigation.
- Upgraded `APIClient` with query item support for filtered jobs requests.

## Verification
- `get_errors` returned clean results for `kelmah-mobile-android/`.
- `get_errors` returned clean results for `kelmah-mobile-ios/`.
- Full native device builds were not executed in this Windows workspace session.

## Current Next Priority
1. register and password recovery flows
2. messaging conversations and Socket.IO session handshake
3. notifications and device token registration
4. local persistence and offline sync for jobs/messages
