# Kelmah Native Notifications Domain — March 7, 2026

**Status**: In progress
**Scope**: Replace the Android and iOS notification placeholders with real gateway-backed notification inbox flows while preserving the single-origin networking model and keeping the live auth registration blocker tracked in parallel.

## Acceptance Criteria
- Android supports notification list loading, unread filtering, manual refresh, mark-as-read, mark-all-read, and delete.
- iOS supports notification list loading, unread filtering, manual refresh, mark-as-read, mark-all-read, and delete.
- Both platforms normalize notification payloads against the existing gateway + messaging-service contracts.
- Both platforms keep all notification traffic under the single configured gateway origin.
- The work documents the exact UI → state → service → gateway → messaging-service data flow.

## Dry Audit File Surface

### Gateway / Backend
- `kelmah-backend/api-gateway/routes/messaging.routes.js`
- `kelmah-backend/services/messaging-service/server.js`
- `kelmah-backend/services/messaging-service/routes/notification.routes.js`
- `kelmah-backend/services/messaging-service/controllers/notification.controller.js`
- `kelmah-backend/services/messaging-service/models/Notification.js`
- `kelmah-backend/services/messaging-service/models/NotificationPreference.js`

### Web contract references
- `kelmah-frontend/src/modules/notifications/services/notificationService.js`

### Android native
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/app/navigation/KelmahNavHost.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/core/network/NetworkModule.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/notifications/presentation/NotificationsScreen.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/messaging/data/MessagingRepository.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/messaging/presentation/MessagesViewModel.kt`

### iOS native
- `kelmah-mobile-ios/Kelmah/App/AppEnvironment.swift`
- `kelmah-mobile-ios/Kelmah/App/RootTabView.swift`
- `kelmah-mobile-ios/Kelmah/Core/Network/APIClient.swift`
- `kelmah-mobile-ios/Kelmah/Features/Notifications/Presentation/NotificationsView.swift`
- `kelmah-mobile-ios/Kelmah/Features/Messaging/Data/MessagesRepository.swift`
- `kelmah-mobile-ios/Kelmah/Features/Messaging/Presentation/MessagesViewModel.swift`

## Current Findings
- Both native apps still expose notification placeholders even though the backend notification inbox contract is already available.
- The gateway exposes `/api/notifications` by reusing the messaging gateway router, and the messaging service already supports list, unread count, preferences, mark-read, mark-all-read, clear-all, delete, and internal system notification creation.
- The web notification service confirms the expected response variability: lists may come back in `data`, `data.notifications`, or `notifications`, and unread counts can be top-level or nested.
- The backend route order for notifications is already safe, with literal endpoints declared before `/:notificationId`.

## Planned Implementation
- Add normalized notification models, API service, repository, and view model layers on Android.
- Replace the Android placeholder notifications screen with a real inbox experience.
- Add normalized notification models, repository, and view model layers on iOS.
- Extend the shared iOS app environment with notification dependencies.
- Replace the iOS placeholder notifications view with a real inbox experience.
- Validate touched files with editor diagnostics and note remaining live auth deployment validation separately.

## Implementation Summary

### Android
- Added `NotificationsModels.kt` for normalized notification records and display tags.
- Added `NotificationsApiService.kt` for list, unread count, mark-read, mark-all-read, and delete endpoints.
- Added `NotificationsRepository.kt` with defensive JSON parsing and auth-refresh retry behavior.
- Added `NotificationsViewModel.kt` for unread filtering, refresh, optimistic mark-read, bulk mark-read, and delete flows.
- Replaced the placeholder `NotificationsScreen.kt` with a real Compose inbox experience.
- Extended `NetworkModule.kt` with `NotificationsApiService` provisioning.

### iOS
- Added `NotificationsModels.swift` for normalized notification items and envelope decoding.
- Added `NotificationsRepository.swift` for gateway-backed inbox list, unread count, mark-read, bulk mark-read, and delete calls.
- Added `NotificationsViewModel.swift` for unread filtering, refresh, mutation state, and optimistic UI updates.
- Extended `AppEnvironment.swift` with `NotificationsRepository` and `NotificationsViewModel`.
- Updated `RootTabView.swift` so the Alerts tab uses shared notification state.
- Replaced the placeholder `NotificationsView.swift` with a real SwiftUI inbox experience.

## Verification Results
- `get_errors` returned clean results for all touched Android notification files plus `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/core/network/NetworkModule.kt`.
- `get_errors` returned clean results for all touched iOS notification files plus `kelmah-mobile-ios/Kelmah/App/AppEnvironment.swift` and `kelmah-mobile-ios/Kelmah/App/RootTabView.swift`.
- Live contract validation through the deployed gateway confirmed:
	- `POST /api/auth/login` → `200`
	- `GET /api/notifications?limit=5` → `200`
	- `GET /api/notifications/unread/count` → `200`
- The live notifications payload shape matches the normalization assumptions used in both native implementations: notification arrays are returned under `data`, unread counts are top-level, and records still use `_id` plus nested `readStatus`.
