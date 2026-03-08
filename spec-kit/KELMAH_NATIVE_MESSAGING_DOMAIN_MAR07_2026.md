# Kelmah Native Messaging Domain — March 7, 2026

**Status**: In progress
**Scope**: Replace the Android and iOS messaging placeholders with real gateway-backed conversation and thread flows while preserving the single-origin networking model and tracking the live auth registration blocker in parallel.

## Acceptance Criteria
- Android supports conversation discovery, thread loading, refresh, and send.
- iOS supports conversation discovery, thread loading, refresh, and send.
- Both platforms normalize conversation/message payloads against the existing gateway contracts.
- Both platforms keep all messaging traffic under the single configured gateway origin.
- The work documents the exact UI → state → service → gateway → messaging-service data flow.

## Dry Audit File Surface

### Gateway / Backend
- `kelmah-backend/api-gateway/routes/messaging.routes.js`
- `kelmah-backend/services/messaging-service/server.js`
- `kelmah-backend/services/messaging-service/routes/conversation.routes.js`
- `kelmah-backend/services/messaging-service/routes/message.routes.js`
- `kelmah-backend/services/messaging-service/controllers/conversation.controller.js`
- `kelmah-backend/services/messaging-service/controllers/message.controller.js`
- `kelmah-backend/services/messaging-service/models/Conversation.js`
- `kelmah-backend/services/messaging-service/models/Message.js`
- `kelmah-backend/services/messaging-service/socket/messageSocket.js`

### Web contract references
- `kelmah-frontend/src/modules/messaging/services/messagingService.js`
- `kelmah-frontend/src/modules/messaging/contexts/MessageContext.jsx`
- `kelmah-frontend/src/modules/messaging/pages/MessagingPage.jsx`

### Android native
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/core/network/NetworkConfig.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/core/network/NetworkModule.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/core/storage/StoredSession.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/core/storage/TokenManager.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/jobs/data/JobsApiService.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/jobs/data/JobsRepository.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/jobs/presentation/JobsViewModel.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/messaging/presentation/MessagesScreen.kt`

### iOS native
- `kelmah-mobile-ios/project.yml`
- `kelmah-mobile-ios/Kelmah/App/AppEnvironment.swift`
- `kelmah-mobile-ios/Kelmah/Core/Config/APIEnvironment.swift`
- `kelmah-mobile-ios/Kelmah/Core/Network/APIClient.swift`
- `kelmah-mobile-ios/Kelmah/Core/Session/SessionModels.swift`
- `kelmah-mobile-ios/Kelmah/Core/Storage/SessionStore.swift`
- `kelmah-mobile-ios/Kelmah/Features/Jobs/Data/JobsModels.swift`
- `kelmah-mobile-ios/Kelmah/Features/Jobs/Data/JobsRepository.swift`
- `kelmah-mobile-ios/Kelmah/Features/Jobs/Presentation/JobsViewModel.swift`
- `kelmah-mobile-ios/Kelmah/Features/Messaging/Presentation/MessagesView.swift`

## End-to-End Data Flow

### Conversation List
Messages tab
→ native messages screen/view model
→ native messaging repository
→ `GET /api/messages/conversations`
→ API gateway `messaging.routes.js`
→ messaging-service `conversation.routes.js`
→ `ConversationController.getUserConversations()`
→ `Conversation` + `Message` models
→ normalized conversation summaries
→ native conversation list UI

### Thread Load
Conversation tap
→ native selection state
→ native messaging repository
→ `GET /api/messages/conversations/:conversationId/messages`
→ API gateway message path rewrite
→ messaging-service `message.routes.js`
→ `messageController.getConversationMessages()`
→ `Message` model + conversation unread reset
→ normalized thread payload
→ native thread view

### Send Message
Message composer submit
→ native view model optimistic sending state
→ native messaging repository
→ `POST /api/messages/conversations/:conversationId/messages`
→ API gateway direct axios forwarder
→ messaging-service `messageController.createMessage()`
→ `Message` persistence + conversation last-message/unread update
→ REST response and optional websocket room emit
→ native thread refresh / local append

## Current Findings
- The gateway already contains the direct POST handlers needed to avoid body-stream hangs for conversation creation and message send.
- The messaging-service REST layer is sufficient for native production messaging even before native websocket parity is added.
- The current native codebases have no messaging data layer yet, so the cleanest path is to follow the established jobs-domain architecture on both platforms.
- Android already includes a Socket.IO dependency, but iOS currently has no socket client package configured in `project.yml`; therefore the first production-safe cross-platform step is robust REST messaging with refreshable state and room for socket enhancement later.

## Planned Implementation
- Add normalized messaging models and API service/repository layers on Android.
- Add Android `MessagesViewModel` and replace the placeholder with a conversation/thread UI.
- Add normalized messaging models and repository layer on iOS.
- Extend `AppEnvironment` with the messaging repository/view model.
- Replace the iOS placeholder with a conversation/thread UI.
- Re-run live auth registration checks during verification.

## Implementation Summary

### Android
- Added `MessagingModels.kt` for normalized participants, conversations, and thread messages.
- Added `MessagingApiService.kt` for conversation list, thread load, thread send, and future conversation creation.
- Added `MessagingRepository.kt` with defensive JSON parsing and session-refresh retry behavior.
- Added `MessagesViewModel.kt` for conversation selection, thread loading, send state, search state, and unread resets.
- Replaced `MessagesScreen.kt` placeholder UI with a real Compose conversation/thread flow.
- Wired the new API service in `NetworkModule.kt`.

### iOS
- Added `MessagesModels.swift` for normalized participants, conversations, messages, and routes.
- Added `MessagesRepository.swift` for gateway-backed conversation load, thread load, and send.
- Added `MessagesViewModel.swift` for refresh, selection, draft state, and send state.
- Extended `AppEnvironment.swift` with `MessagesRepository` and `MessagesViewModel`.
- Updated `RootTabView.swift` so the Messages tab uses the shared messaging view model.
- Replaced `MessagesView.swift` placeholder UI with a real SwiftUI conversation/thread flow.

## Verification Plan
- Run editor diagnostics for new native messaging files.
- Re-test live auth registration, resend verification, and forgot-password against the deployed gateway.
- Validate that both native code paths still derive URLs from the single configured gateway origin.

## Verification Results
- `get_errors` returned clean results for:
	- Android messaging files and `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/core/network/NetworkModule.kt`
	- iOS messaging files, `kelmah-mobile-ios/Kelmah/App/AppEnvironment.swift`, and `kelmah-mobile-ios/Kelmah/App/RootTabView.swift`
- Live gateway auth revalidation after the messaging implementation confirmed:
	- `POST /api/auth/register` still returns `400 phone already exists`
	- `POST /api/auth/forgot-password` returns `200`
	- `POST /api/auth/resend-verification-email` returns `200`
- This keeps the production blocker isolated to deployed auth registration behavior rather than the newly added native messaging code.