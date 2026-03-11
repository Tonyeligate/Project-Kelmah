# Mobile Native Fix Pass March 11 2026

**Date**: March 11, 2026  
**Status**: Completed  
**Scope**: Implement the highest-value fixes from the mobile native audit across `kelmah-mobile-android` and `kelmah-mobile-ios`, with focus on session trust hardening, conversation-start workflow support, hirer jobs flow correction, and Android lint hygiene.

## Acceptance Criteria
- Cached or recoverable session states do not unlock the full trusted app shell.
- Worker users can start a conversation from native job detail using the existing messaging contract.
- Hirer jobs tabs stop behaving like public market review and instead prioritize the hirer's own jobs with pagination-friendly behavior.
- Android lint warnings addressed in this pass are revalidated locally.
- Android test and lint validation are rerun after implementation.

## Mapped Execution Surface
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/core/session/SessionState.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/core/session/SessionCoordinator.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/app/KelmahApp.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/jobs/data/JobsRepository.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/jobs/presentation/JobsViewModel.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/jobs/presentation/JobsScreen.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/jobs/presentation/JobDetailScreen.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/messaging/data/MessagingRepository.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/messaging/presentation/MessagesViewModel.kt`
- `kelmah-mobile-android/app/src/main/res/values/themes.xml`
- `kelmah-mobile-android/app/src/main/res/values/colors.xml`
- `kelmah-mobile-android/app/src/main/AndroidManifest.xml`
- `kelmah-mobile-ios/Kelmah/Core/Session/SessionModels.swift`
- `kelmah-mobile-ios/Kelmah/Core/Session/SessionCoordinator.swift`
- `kelmah-mobile-ios/Kelmah/Core/Storage/SessionStore.swift`
- `kelmah-mobile-ios/Kelmah/App/AppEnvironment.swift`
- `kelmah-mobile-ios/Kelmah/App/RootTabView.swift`
- `kelmah-mobile-ios/Kelmah/Features/Jobs/Data/JobsRepository.swift`
- `kelmah-mobile-ios/Kelmah/Features/Jobs/Presentation/JobsViewModel.swift`
- `kelmah-mobile-ios/Kelmah/Features/Jobs/Presentation/JobsView.swift`
- `kelmah-mobile-ios/Kelmah/Features/Jobs/Presentation/JobDetailView.swift`
- `kelmah-mobile-ios/Kelmah/Features/Messaging/Data/MessagesModels.swift`
- `kelmah-mobile-ios/Kelmah/Features/Messaging/Data/MessagesRepository.swift`
- `kelmah-mobile-ios/Kelmah/Features/Messaging/Presentation/MessagesViewModel.swift`

## Dry-Audit Fix Targets
- Android `SessionCoordinator` currently collapses cache recovery into `Authenticated`, which keeps the full shell available.
- iOS `SessionStore.isSessionUsable` currently treats recoverable cached identity as enough to show the full tab shell.
- Android already exposes `POST /messages/conversations`, but no native UI path creates a conversation.
- iOS messaging repository still lacks native conversation creation even though the backend contract exists.
- Both jobs tabs still present hirer discover flow as market review rather than the hirer's own jobs.
- Android lint still has actionable resource and manifest warnings, including no explicit app icon and redundant theme/resource definitions.

## Implementation Completed
- Hardened Android session recovery by introducing a dedicated `RecoveryRequired` shell state instead of treating cached identity as fully authenticated, and reset jobs, messages, and notifications state whenever trust is lost.
- Hardened iOS shell gating by requiring an authenticated phase plus a verified current user before the tab shell opens, and added a dedicated recovery screen with retry or sign-in actions.
- Added native direct-conversation creation on both platforms through the existing `POST /messages/conversations` contract and wired worker-facing "Message Hirer" CTAs into the job-detail flow.
- Corrected the hirer jobs experience on both platforms so the default jobs feed prioritizes the hirer's own jobs, uses paged `my-jobs` loading, and removes the misleading market-review copy.
- Added Android state reset hooks for messages and notifications bootstrapping, requested Android 13+ notification permission at app start, and cleaned lint issues by adding an explicit app icon, simplifying deep-link intent filters, and removing obsolete resource/theme definitions.

## Validation
- Android Gradle validation passed after implementation:
	- `testDebugUnitTest`
	- `lintDebug`
- Android compile validation passed as part of the same Gradle run.
- iOS source changes were completed and dry-audited, but runtime or XCTest validation remains blocked on a macOS/Xcode environment.