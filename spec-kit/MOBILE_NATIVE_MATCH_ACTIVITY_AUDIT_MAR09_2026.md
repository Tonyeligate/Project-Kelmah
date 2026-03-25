# Native Mobile Match, Activity, And Reliability Audit

**Date**: March 9, 2026  
**Scope**: Android and iOS native apps only (`kelmah-mobile-android`, `kelmah-mobile-ios`)  
**Audit Goal**: Review job matching precision, worker-profile relevance logic, recommendation freshness, recent-activity truthfulness, session/auth resilience, realtime synchronization, security posture, and test coverage.

## Dry-audit file surface

### Android
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/jobs/presentation/JobsViewModel.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/jobs/data/JobsRepository.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/jobs/presentation/JobsScreen.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/home/presentation/HomeScreen.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/profile/data/ProfileRepository.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/messaging/data/MessagingRepository.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/messaging/presentation/MessagesViewModel.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/notifications/data/NotificationsRepository.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/notifications/presentation/NotificationsViewModel.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/core/realtime/RealtimeSocketManager.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/core/storage/TokenManager.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/core/session/SessionCoordinator.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/core/security/PasswordPolicy.kt`
- `kelmah-mobile-android/app/src/test/java/com/kelmah/mobile/TokenManagerTest.kt`

### iOS
- `kelmah-mobile-ios/Kelmah/Features/Jobs/Presentation/JobsViewModel.swift`
- `kelmah-mobile-ios/Kelmah/Features/Jobs/Data/JobsRepository.swift`
- `kelmah-mobile-ios/Kelmah/Features/Jobs/Presentation/JobsView.swift`
- `kelmah-mobile-ios/Kelmah/Features/Home/Presentation/HomeView.swift`
- `kelmah-mobile-ios/Kelmah/Features/Profile/Data/ProfileRepository.swift`
- `kelmah-mobile-ios/Kelmah/Features/Messaging/Data/MessagesRepository.swift`
- `kelmah-mobile-ios/Kelmah/Features/Messaging/Presentation/MessagesViewModel.swift`
- `kelmah-mobile-ios/Kelmah/Features/Notifications/Data/NotificationsRepository.swift`
- `kelmah-mobile-ios/Kelmah/Features/Notifications/Presentation/NotificationsViewModel.swift`
- `kelmah-mobile-ios/Kelmah/Core/Realtime/RealtimeSocketManager.swift`
- `kelmah-mobile-ios/Kelmah/Core/Network/APIClient.swift`
- `kelmah-mobile-ios/Kelmah/Core/Storage/KeychainStore.swift`
- `kelmah-mobile-ios/Kelmah/Core/Storage/SessionStore.swift`
- `kelmah-mobile-ios/Kelmah/Core/Session/SessionCoordinator.swift`
- `kelmah-mobile-ios/Kelmah/Core/Security/PasswordPolicy.swift`
- `kelmah-mobile-ios/KelmahTests/KelmahTests.swift`
- `kelmah-mobile-ios/KelmahUITests/KelmahUITests.swift`

## End-to-end flow notes

### Worker recommendation flow
Native home/jobs shell → jobs view model → jobs repository → gateway `/api/jobs/recommendations/personalized` or fallback jobs feed → parsed mobile `JobSummary` → home/job cards show raw `matchScore` and first `aiReasoning` string.

### Recent activity flow
Native home shell → messages/notifications state → repositories parse API payload order largely as-is → home surfaces show `.take(3)` / `.prefix(3)` previews for conversations and notifications.

### Worker profile relevance flow
Native profile → profile repository → `/api/users/profile`, `/api/users/me/credentials`, `/api/users/workers/:id/availability`, `/api/users/workers/:id/completeness`, `/api/users/workers/:id/portfolio` → profile signal sections rendered directly.

### Realtime freshness flow
App shell + feature bootstraps → socket manager connects once with current access token → incoming message/read/notification events trigger full list refreshes in messaging and notifications view models.

## Findings

### Critical

1. **Recommendation failure is hidden behind urgent-job fallback on both platforms**
   - Android: `JobsViewModel.refreshHome()` falls back from `getRecommendedJobs()` to `getJobs(sort = URGENT)` when the recommendations endpoint errors.
   - iOS: `JobsViewModel.refreshHome(for:)` does the same with `.urgent` filters.
   - Impact: workers cannot distinguish "recommendation engine failed" from "these are your best matches", so match trust degrades silently.
   - Fix: preserve recommendation failure state explicitly, show degraded-feed messaging, and track fallback usage separately.

2. **Job matching precision depends on fragile permissive parsing instead of a strict contract**
   - Android and iOS `parseJobSummary` accept multiple field aliases and default core fields like budget/title/employer/category.
   - Impact: malformed backend payloads still render as valid jobs with `0` budget, placeholder employer, and generic labels, which poisons recommendation quality and ranking confidence.
   - Fix: move to strict decoding for core recommendation fields, reject invalid matches early, and log payload contract drift.

3. **Worker profile snapshot mixes current-user credentials with worker-specific endpoints**
   - Android and iOS profile repositories call `users/me/credentials` while also fetching `workers/:workerId/...` resources.
   - Impact: the method name implies arbitrary worker snapshots, but it actually produces hybrid data if `workerId` is not the signed-in user.
   - Fix: either restrict the API and naming to "current worker snapshot" or fetch all sections by the same worker identity.

4. **Realtime connections do not re-authenticate after token changes or expiry**
   - Android and iOS socket managers connect once with the current access token and keep reconnect enabled without token rotation.
   - Impact: messaging and notifications silently degrade after token expiry or refresh, especially during long-lived sessions.
   - Fix: listen for token changes, reconnect with the fresh token, and add explicit auth-failure handling.

### High

5. **Realtime events trigger full refresh storms instead of targeted state updates**
   - Android and iOS messaging view models refresh the full conversation list and selected thread on every `message` and `messagesRead` signal.
   - Android and iOS notifications view models refresh the full notifications feed on each notification signal, with no in-flight coalescing.
   - Impact: mobile bandwidth waste, duplicated loading races, battery drain, and stale-state flicker under active chat traffic.
   - Fix: coalesce signals, gate parallel refreshes, and apply targeted in-memory updates by conversation/message/notification ID.

6. **Recent activity surfaces are only as truthful as backend ordering because notifications are not locally sorted**
   - Android and iOS home screens display the first three notifications directly from repository state.
   - Android and iOS notifications repositories parse payload order as-is and do not sort by `createdAt`.
   - Impact: "Recent alerts" can be wrong whenever the backend returns unsorted or mixed-priority data.
   - Fix: normalize to descending parsed timestamps before storing or rendering preview lists.

7. **Filter UX and refresh semantics are inconsistent, which makes search precision look broken**
   - Android category and sort changes auto-refresh, but location waits for an explicit apply action.
   - iOS category and sort refresh immediately, but text search and location remain pending until "Apply Filters".
   - Impact: users change filters and see stale lists, which reads as bad search quality rather than deferred execution.
   - Fix: unify filter behavior across controls and platforms with either explicit apply for all filters or debounced auto-apply for all.

8. **iOS keychain persistence ignores Security framework status codes**
   - `KeychainStore` does not validate `SecItemAdd`, `SecItemCopyMatching`, or `SecItemDelete` results.
   - Impact: token persistence can fail silently, causing unpredictable session loss and broken auth recovery.
   - Fix: inspect statuses, throw/log on failure, and handle non-success cases explicitly.

### Medium

9. **Weak password policy is normalized in both runtime code and tests**
   - Android and iOS password policies only require 8 characters, one uppercase character, and one digit.
   - Both test suites explicitly accept `Kelmah2026` as strong.
   - Impact: marketplace accounts are easier to brute-force or guess than they should be.
   - Fix: raise minimum length, require mixed case and stronger entropy, and stop encoding weak examples as accepted test fixtures.

10. **Session persistence and recovery semantics are brittle across both apps**
   - Android `TokenManager` maintains encrypted prefs and `_sessionFlow` without a single transactional path for `saveSession`, `updateUser`, and `clearSession`.
   - iOS `SessionCoordinator` short-circuits with `didBootstrap`, making long-lived validation behavior stateful in a way that is hard to reason about.
   - Impact: session state can drift or become harder to recover predictably after token refresh, logout, or background/foreground churn.
   - Fix: collapse each platform to a single authoritative session transition path and make refresh/bootstrap idempotent.

11. **Automated test coverage barely touches the risky mobile logic**
   - Android test coverage is effectively limited to password policy and role-resolution checks.
   - iOS unit tests and UI tests only cover password policy, role/display-name helpers, and auth mode switching shell behavior.
   - Impact: matching, filtering, realtime state handling, job parsing, profile aggregation, and auth recovery can regress without detection.
   - Fix: add focused tests for recommendation fallback behavior, parsing contract validation, pagination/reset logic, realtime coalescing, and session recovery.

## Highest-value remediation order

1. Remove silent recommendation fallback masking and expose degraded-feed states clearly.
2. Replace permissive job payload parsing with strict decoding for ranking-critical fields.
3. Fix profile snapshot identity consistency so worker-profile signals always belong to one worker.
4. Add token-aware socket re-auth and refresh coalescing on both platforms.
5. Normalize recent activity ordering and filter semantics so "recent" and "best match" actually mean something.
6. Expand native automated coverage around matching, realtime, and session recovery before additional feature work.

## Validation performed

- Read-only audit across the native Android and iOS source surfaces listed above.
- Verified recent implementation context against active native jobs/profile/messaging/notifications/session/realtime files.
- Confirmed the current automated coverage footprint is minimal and does not cover the dominant mobile-risk paths.
