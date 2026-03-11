# Mobile Native Audit March 11 2026

**Date**: March 11, 2026  
**Scope**: Audit only the native mobile apps in `kelmah-mobile-android` and `kelmah-mobile-ios` against Kelmah's vocational worker-hirer product goal, with emphasis on workflow completeness, low-literacy usability, security, and production readiness.

## Success Criteria
- Read the mobile code paths that define the current native user experience before making conclusions.
- Distinguish true defects from product gaps and undeveloped native work.
- Validate Android locally where possible and record Windows-specific iOS validation limits.
- Produce severity-ranked findings with concrete fix plans.

## Mapped Surface
- Android shell, navigation, session, storage, auth, jobs, messaging, notifications, profile, manifest, and tests.
- iOS shell, tab routing, session, storage, auth, jobs, messaging, notifications, profile, realtime, and tests.
- Product-purpose docs in `spec-kit/Kelmaholddocs/old-docs/Kelma.txt` and `spec-kit/Kelmaholddocs/old-docs/Kelma docs.txt`.
- Existing mobile audit context in `spec-kit/STATUS_LOG.md`, `spec-kit/MOBILE_UI_AUDIT_MAR02_2026.md`, and `spec-kit/PLATFORM_MOBILE_BACKEND_AUDIT_FEB15_2026.md`.

## Validation
- Android unit tests passed locally on Windows through system Gradle 8.7 with `testDebugUnitTest`.
- Android lint passed locally on Windows through system Gradle 8.7 with `lintDebug`.
- Android lint still reported 29 warnings, mostly dependency freshness plus a smaller set of manifest/resource issues.
- iOS runtime and XCTest execution were not possible locally on Windows, so iOS conclusions are source-audit based.

## Key Flows Audited

### Auth bootstrap and recovery
- Android: stored session -> `SessionCoordinator.bootstrapSession()` -> `AuthRepository.fetchCurrentUser()` -> refresh attempt -> cache recovery or logout.
- iOS: stored keychain tokens + cached user -> `SessionCoordinator.bootstrapSession()` -> `AuthRepository.fetchCurrentUser()` -> refresh attempt -> recoverable failure or logout.

### Shell navigation
- Android shell exposes Home, Jobs, Messages, Alerts, and Profile only.
- iOS shell exposes Home, Jobs, Messages, Alerts, and Profile only.

### Messaging workflow
- Android supports load conversations, load messages, send message, and has a create-conversation API contract in the data layer.
- iOS supports load conversations, load messages, and send message only in the repository layer.
- Neither shell exposes a user-facing start-conversation route from jobs, worker identity, or hirer identity.

## Findings

### Critical

#### 1. Cached session recovery is treated as a usable authenticated state
- Android evidence:
  - `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/core/session/SessionCoordinator.kt` recovers into `SessionState.Authenticated(..., recoveredFromCache = true)`.
  - `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/core/session/SessionState.kt` models the recovered state as authenticated.
- iOS evidence:
  - `kelmah-mobile-ios/Kelmah/Core/Session/SessionCoordinator.swift` marks a recoverable failure instead of clearing state.
  - `kelmah-mobile-ios/Kelmah/Core/Storage/SessionStore.swift` treats the session as usable when a token exists and `currentUser != nil`.
  - `kelmah-mobile-ios/Kelmah/App/RootTabView.swift` opens the full tab shell whenever `isSessionUsable` is true.
- Risk:
  - A stale or unverifiable identity can still unlock private UI and cached personal data.
  - Users can think they are fully signed in when the backend session is already broken.
  - This is especially risky on shared or intermittently connected devices.
- Fix plan:
  - Split authenticated from cached read-only recovery.
  - Permit only a limited offline shell in recovery mode, with mutating actions disabled.
  - Require a successful current-user or refresh validation before opening messages, notifications, or profile actions that imply an active trusted session.
  - Purge cached user state immediately on 401 or 403 and only keep minimal non-sensitive identity if an offline banner is required.

### High

#### 2. Core communication promise is incomplete because users cannot start a conversation from the native UI
- Android evidence:
  - `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/messaging/data/MessagingApiService.kt` exposes `POST messages/conversations`.
  - `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/app/navigation/KelmahNavHost.kt` only routes into the existing Messages tab and existing thread IDs.
  - `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/home/presentation/HomeScreen.kt` tells hirers that messages created from job and hiring flows will appear, but there is no native create-message entry point.
- iOS evidence:
  - `kelmah-mobile-ios/Kelmah/Features/Messaging/Data/MessagesRepository.swift` only loads conversations, loads messages, and sends messages.
  - `kelmah-mobile-ios/Kelmah/App/RootTabView.swift` only opens existing conversations via `pendingConversationId`.
  - `kelmah-mobile-ios/Kelmah/Features/Home/Presentation/HomeView.swift` makes the same messages-created promise.
- Risk:
  - Kelmah’s worker-hirer communication loop is broken at the native product level.
  - Existing message screens mainly serve follow-up, not conversation initiation.
- Fix plan:
  - Add a start-chat CTA from job detail, worker summary, and hirer-facing candidate cards.
  - Create or fetch the conversation before routing into the thread screen.
  - Include role-aware prefilled context like job title, worker profession, or application reference.

#### 3. Hirer mobile experience is still market review, not real hiring operations
- Android evidence:
  - `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/jobs/presentation/JobsScreen.kt` tells hirers to review pay, demand, and saved listings.
  - `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/jobs/presentation/JobDetailScreen.kt` explicitly says hirer mode is for market review.
  - `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/jobs/presentation/JobsViewModel.kt` and `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/jobs/data/JobsRepository.kt` load only `getMyJobs(limit = 6)` for hirers.
- iOS evidence:
  - `kelmah-mobile-ios/Kelmah/Features/Jobs/Presentation/JobsView.swift` carries the same market-review copy.
  - `kelmah-mobile-ios/Kelmah/Features/Jobs/Presentation/JobDetailView.swift` carries the same market-review limitation.
  - `kelmah-mobile-ios/Kelmah/Features/Jobs/Presentation/JobsViewModel.swift` loads hirer jobs with `getMyJobs(limit: 6)`.
- Risk:
  - The native hirer app does not yet support the main business outcome: discovering workers, managing applicants, and progressing hiring.
  - The copy overstates manage hiring relative to what the UI actually allows.
- Fix plan:
  - Add a real hirer flow with applicant review, worker discovery, shortlisting, and message initiation.
  - Remove or rewrite manage-hiring language until the workflow exists.
  - Replace the hard cap of six hirer jobs with paginated management views.

### Medium

#### 4. README-promised native capabilities remain partially or fully unbuilt
- Android evidence:
  - `kelmah-mobile-android/README.md` still lists messaging service completion, device token registration, offline caching, deeper profile workflows, and biometrics as next work.
  - `kelmah-mobile-android/app/build.gradle.kts` includes Room and WorkManager, but the audited source does not contain a Room database, DAO, or worker implementation.
  - `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/app/navigation/KelmahDeepLinkResolver.kt` only resolves jobs and messages.
- iOS evidence:
  - `kelmah-mobile-ios/README.md` still lists push registration, offline caching, deep links, and biometric unlock as next work.
  - `kelmah-mobile-ios/README.md` still names SwiftData or Core Data in the stack, but the current audited code is not using either for real offline persistence.
- Risk:
  - The native apps look more complete on paper than they are in runtime behavior.
  - Dead or premature dependencies increase maintenance cost and platform drift.
- Fix plan:
  - Either implement offline, background, and push capabilities now or remove unused dependency and README claims until scheduled.
  - For Android, remove Room and WorkManager if the next milestone will not use them soon.
  - For both apps, define a real deep-link matrix beyond just jobs and messages.

#### 5. Notification and deep-link surfaces are only partially production-ready
- Android evidence:
  - `kelmah-mobile-android/app/src/main/AndroidManifest.xml` declares `POST_NOTIFICATIONS` but the audited source does not request runtime notification permission.
  - The same manifest only deep-links jobs and messages and lint flags the combined data tags plus missing application icon.
  - Android lint reported 29 warnings, including manifest and resource hygiene issues.
- iOS evidence:
  - The audited iOS source contains realtime notification handling but no APNs registration or system notification authorization flow.
- Risk:
  - Notification features will be inconsistent or silent on real devices.
  - Deep linking is too narrow for a marketplace app that should jump straight into hiring, job, and alert contexts.
- Fix plan:
  - Implement explicit platform notification permission and device registration flows.
  - Expand deep links to worker profiles, hiring actions, and application states.
  - Fix Android manifest hygiene and add a production app icon before release.

#### 6. Low-literacy usability is improved from generic enterprise copy, but the app still depends too heavily on reading dense text blocks
- Android evidence:
  - `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/jobs/presentation/JobsScreen.kt` uses text-first filter instructions and button labels.
  - `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/profile/presentation/ProfileScreen.kt` renders a long fact-heavy worker profile summary.
- iOS evidence:
  - `kelmah-mobile-ios/Kelmah/Features/Jobs/Presentation/JobsView.swift` uses the same text-first interaction model.
  - `kelmah-mobile-ios/Kelmah/Features/Profile/Presentation/ProfileView.swift` uses the same dense summary layout.
  - `kelmah-mobile-ios/Kelmah/Features/Messaging/Presentation/MessagesView.swift` still relies on a small Tap-to-open instructional label.
- Risk:
  - The current UX still assumes confident reading ability, especially in search, profile completeness, and message discovery flows.
- Fix plan:
  - Shift key tasks toward icon-first, card-first actions with fewer paragraphs.
  - Add larger single-purpose buttons for role-critical actions such as Find Work, Hire Worker, Message, Save, and Apply.
  - Use progressive disclosure so advanced details appear after the user opens a card instead of all at once.

### Low

#### 7. Android lint cleanup remains before production polish is credible
- Evidence:
  - `kelmah-mobile-android/app/build/reports/lint-results-debug.txt` reports 29 warnings.
  - Notable warnings include missing app icon, intent-filter clarity, obsolete SDK annotation, and unused color resources.
  - `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/core/storage/TokenManager.kt` intentionally uses synchronous `commit()`, which lint flags even though the choice is defensible.
- Fix plan:
  - Keep `commit()` if crash-safe token persistence is intentional, but suppress or document that lint finding.
  - Clean the remaining manifest/resource warnings and add the missing icon.

## Priority Fix Sequence
1. Rework cached-session recovery so stale identity never unlocks the full trusted shell.
2. Add conversation-start UX from job and hiring contexts.
3. Build a real hirer workflow instead of market-review-only behavior.
4. Implement or remove deferred native capabilities: push, device registration, offline persistence, biometrics, broader deep links.
5. Simplify task flows for low-literacy users with more action-first UI.
6. Clear Android lint hygiene and unused dependency debt.

## Verification Limits
- Android build-quality confidence is stronger because unit tests and lint both passed locally.
- iOS behavior still needs remote or macOS validation for runtime correctness, layout verification, and XCTest execution.