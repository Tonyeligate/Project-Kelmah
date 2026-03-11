# Mobile Native Medium Backlog Remediation March 11 2026

**Date**: March 11, 2026
**Status**: Completed

## Scope
- Fix the iOS medium backlog item around dark-mode-breaking hardcoded white surfaces in the active native app.
- Deduplicate the repeated Android `executeAuthorized` helper used by multiple repositories.
- Re-run the native validation that is executable on this Windows machine.
- Document the macOS validation path and the exact blocker for running it against these local changes.

## Acceptance Criteria
- Active iOS SwiftUI surfaces no longer hardcode `.background(.white)` or `Color.white` for the targeted screen cards and inputs.
- Android repositories no longer duplicate the same session-refresh-on-401 wrapper.
- Android validation is rerun successfully after the refactor.
- The macOS XCTest/simulator path is documented precisely, including why it was not executed from this workspace state.

## Mapped Execution Surface
- `kelmah-mobile-ios/Kelmah/Core/Design/KelmahTheme.swift`
- `kelmah-mobile-ios/Kelmah/Features/Auth/Presentation/LoginView.swift`
- `kelmah-mobile-ios/Kelmah/Features/Home/Presentation/HomeView.swift`
- `kelmah-mobile-ios/Kelmah/Features/Jobs/Presentation/JobDetailView.swift`
- `kelmah-mobile-ios/Kelmah/Features/Jobs/Presentation/JobsView.swift`
- `kelmah-mobile-ios/Kelmah/Features/Messaging/Presentation/MessagesView.swift`
- `kelmah-mobile-ios/Kelmah/Features/Notifications/Presentation/NotificationsView.swift`
- `kelmah-mobile-ios/Kelmah/Features/Profile/Presentation/ProfileView.swift`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/core/network/AuthorizedApiRequest.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/jobs/data/JobsRepository.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/messaging/data/MessagingRepository.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/notifications/data/NotificationsRepository.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/profile/data/ProfileRepository.kt`
- `kelmah-mobile-android/app/src/test/java/com/kelmah/mobile/TokenManagerTest.kt`
- `.github/workflows/mobile-native-validation.yml`
- `kelmah-mobile-ios/project.yml`
- `spec-kit/STATUS_LOG.md`
- `spec-kit/MOBILE_NATIVE_MEDIUM_BACKLOG_REMEDIATION_MAR11_2026.md`

## Data Flow Trace

### iOS presentation surface flow
`LoginView`, `HomeView`, `JobsView`, `JobDetailView`, `MessagesView`, `NotificationsView`, and `ProfileView` render user-facing cards and inputs using `KelmahTheme`. These views are now routed through adaptive theme tokens (`KelmahTheme.background`, `KelmahTheme.card`) so the same view tree respects system light/dark appearance instead of pinning card surfaces to white.

### Android authorized repository flow
ViewModel action -> repository method -> `executeAuthorizedApiCall(sessionCoordinator) { ... }` -> Retrofit API call -> if `401`, refresh via `SessionCoordinator.refreshSession()` -> retry once -> return `ApiResult.Success` or `ApiResult.Error` to the caller. This preserves the previous repository behavior while removing duplicated implementations.

### macOS XCTest/simulator path
Remote CI path already exists: `.github/workflows/mobile-native-validation.yml` -> `xcodegen generate` -> resolve iPhone simulator -> `xcodebuild build-for-testing` -> `xcodebuild test-without-building` for `KelmahTests` and the authentication smoke UI test.

## Dry-Audit Findings
- The iOS theme still used fixed light tokens before this pass, and multiple active SwiftUI screens also hardcoded `.background(.white)` or `Color.white`, so dark mode remained visibly broken even where container backgrounds were already themed.
- Android `JobsRepository`, `MessagingRepository`, `NotificationsRepository`, and `ProfileRepository` each contained the same `executeAuthorized` helper with identical `401` refresh/retry behavior.
- A real macOS validation workflow exists and GitHub CLI is authenticated with workflow scope in this workspace, but that workflow runs against remote refs only. Because these fixes are local uncommitted changes and no commit/push was requested, the macOS validation path could not be executed against the updated code.

## Implementation Completed
- Replaced the fixed light iOS theme tokens with adaptive system-aware tokens:
  - `KelmahTheme.background` -> `Color(uiColor: .systemGroupedBackground)`
  - `KelmahTheme.card` -> `Color(uiColor: .systemBackground)`
- Removed hardcoded white card/input surfaces in the targeted iOS screens by routing them through `KelmahTheme.card`.
- Removed the remaining `Color.white` card surfaces in iOS messaging and notifications presentation.
- Added shared Android helper `executeAuthorizedApiCall(...)` in `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/core/network/AuthorizedApiRequest.kt`.
- Swapped the four Android repositories to that shared helper and removed the duplicated private `executeAuthorized` methods.
- Preserved the previously strengthened Android password-policy test coverage in `TokenManagerTest.kt` so the native validation suite still reflects production rules.

## Validation
- iOS source scan confirmed no remaining `.background(.white)` or `Color.white` usages under `kelmah-mobile-ios/Kelmah/**/*.swift`.
- VS Code diagnostics reported no errors in all touched iOS and Android files.
- Android targeted Gradle validation passed:
  - `gradle --no-daemon testDebugUnitTest --tests "com.kelmah.mobile.TokenManagerTest" --tests "com.kelmah.mobile.app.navigation.KelmahDeepLinkResolverTest"`
  - Result: `BUILD SUCCESSFUL in 45s`
- macOS iOS validation was not executed against these changes:
  - local Windows machine cannot run Xcode/simulator
  - remote macOS workflow exists and GitHub CLI auth is available
  - but the workflow runs remote refs, so validating these exact edits would require a commit and push or other remote source publication step

## Remaining Boundary
- This pass addressed only the requested starting medium items.
- Open medium/low native backlog still includes items such as iOS `selectedJob` shared-state race risk, Android locale-stable numeric formatting, shared `nilIfEmpty` extraction, realtime debounce, delete confirmation, certificate pinning, and broader accessibility/localization work.

## Current State
- The targeted iOS dark-mode surface cleanup is implemented in active source.
- The Android `executeAuthorized` duplication has been removed without changing runtime semantics.
- Android validation is green.
- The iOS macOS workflow is ready but was not run on these local changes because they are not on a remote ref.