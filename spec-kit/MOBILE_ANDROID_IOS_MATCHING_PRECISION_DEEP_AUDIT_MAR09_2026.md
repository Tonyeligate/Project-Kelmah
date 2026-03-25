# Android And iOS Matching Precision Deep Audit - March 9 2026

## Scope

This audit covered the two native mobile apps only:
- Android native app in `kelmah-mobile-android`
- iOS native app in `kelmah-mobile-ios`

The objective was to inspect job matching precision, worker profile signal fidelity, recommendation truthfulness, recent-activity logic, session resilience, realtime behavior, and mobile-facing backend contract drift without restarting services.

## Mobile Data Flow Summary

### Worker recommendation flow

Android:
- Home UI -> `HomeScreen.kt`
- State -> `JobsViewModel.refreshHome(role)`
- Service -> `JobsRepository.getRecommendedJobs(limit = 6)`
- API -> `GET /api/jobs/recommendations/personalized`

iOS:
- Home UI -> `HomeView.swift`
- State -> `JobsViewModel.refreshHome(for:)`
- Service -> `JobsRepository.getRecommendedJobs(limit: 6)`
- API -> `GET /api/jobs/recommendations/personalized`

### Worker profile signal flow

Android:
- Profile UI -> `ProfileScreen.kt`
- State -> `ProfileViewModel`
- Service -> `ProfileRepository.getWorkerProfileSnapshot(workerId)`
- API -> `GET /api/users/me/profile-signals` with legacy fallback fan-out

iOS:
- Profile UI -> `ProfileView.swift`
- State -> `ProfileViewModel`
- Service -> `ProfileRepository.getWorkerProfileSnapshot(workerId:)`
- API -> `GET /api/users/me/profile-signals` with legacy fallback fan-out

### Recent activity composition

Android and iOS home surfaces both stitch together:
- recommendation jobs
- recent conversations
- recent notifications

There is no dedicated typed mobile activity stream. The home screen is therefore a composite summary, not an authoritative recent-activity feed.

## Live Contract Findings

### 1. Personalized recommendation success is currently misleading

Worker probe against the live gateway returned:
- `GET /api/jobs/recommendations` -> `200` with two jobs and non-zero `matchScore`
- `GET /api/jobs/recommendations/personalized` -> `200` with `jobs: []`, `isNewUser: true`, `recommendationSource: profile-incomplete`

Both native apps currently interpret any successful `200` personalized response as a healthy personalized state, even when the payload is explicitly telling the client it is degraded and empty.

### 2. Worker profile truth is inconsistent across endpoints

The same worker returned:
- `GET /api/auth/me` -> carpenter-oriented identity and skills
- `GET /api/users/me/profile-signals` -> electrical-work-oriented recommendation signals, different hourly rate, different years-of-experience values

This is a backend/data consistency issue, but it directly damages the mobile matching experience because:
- shell identity uses one source,
- recommendation guidance uses another,
- personalized recommendations appear to derive from a third interpretation of profile completeness.

## Ranked Findings

### Critical

1. Personalized recommendation success is treated as trustworthy even when the payload says the user is effectively incomplete.

Evidence:
- Android marks any successful fetch as personalized in `JobsViewModel.kt`.
- iOS does the same in `JobsViewModel.swift`.

Impact:
- workers see an empty "recommended matches" state instead of a truthful "profile incomplete / matching degraded" state;
- mobile cannot distinguish true zero matches from a backend degradation contract.

Relevant files:
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/jobs/presentation/JobsViewModel.kt`
- `kelmah-mobile-ios/Kelmah/Features/Jobs/Presentation/JobsViewModel.swift`

Recommended fix:
- parse recommendation metadata (`isNewUser`, `recommendationSource`, `totalRecommendations`) and treat `profile-incomplete` as a separate degraded state;
- show a specific CTA to complete the profile rather than a generic empty-results message.

2. Mobile surfaces are driven by conflicting worker-signal sources.

Evidence:
- shell identity is sourced through `auth/me` and cached into the session stores;
- recommendation signals come from `users/me/profile-signals`;
- live data for the same worker disagrees materially across those endpoints.

Impact:
- profile page, home page, and recommendation logic can all tell different stories about the same worker;
- recommendation precision cannot be trusted if the worker skill source is inconsistent.

Relevant files:
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/auth/data/AuthRepository.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/profile/data/ProfileRepository.kt`
- `kelmah-mobile-ios/Kelmah/Features/Auth/Data/AuthRepository.swift`
- `kelmah-mobile-ios/Kelmah/Features/Profile/Data/ProfileRepository.swift`

Recommended fix:
- unify mobile-facing worker summary and recommendation-signal contracts on the backend;
- until then, add explicit discrepancy warnings when the profile-signals snapshot materially disagrees with the cached session user.

### High

3. iOS still has a dead default gateway fallback.

Evidence:
- `APIEnvironment.swift` still hardcodes `https://kelmah-api-gateway-qmd7.onrender.com` as the fallback origin.

Impact:
- misconfigured builds can silently talk to a dead host and fail in ways that look like networking bugs.

Relevant file:
- `kelmah-mobile-ios/Kelmah/Core/Config/APIEnvironment.swift`

Recommended fix:
- replace the dead host with the current canonical gateway fallback or fail fast when configuration is missing.

4. Android still lacks OS deep-link routing.

Evidence:
- `AndroidManifest.xml` only declares the launcher intent filter.

Impact:
- notification taps and external links cannot reliably land inside the app via OS routing;
- mobile alert flows remain dependent on in-app navigation only.

Relevant file:
- `kelmah-mobile-android/app/src/main/AndroidManifest.xml`

Recommended fix:
- add verified app-link intent filters for the supported job and message URL shapes.

5. Session recovery is still too destructive on both platforms.

Evidence:
- Android clears the entire stored session on refresh failure in `SessionCoordinator.kt`.
- iOS clears the session on missing refresh token and refresh failure in `SessionCoordinator.swift`.

Impact:
- transient network failures become forced sign-outs;
- workers can lose shell continuity even when cached user data is still usable.

Relevant files:
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/core/session/SessionCoordinator.kt`
- `kelmah-mobile-ios/Kelmah/Core/Session/SessionCoordinator.swift`

Recommended fix:
- distinguish transport failure from token invalidation;
- keep the recoverable cached-user state until the app can prove the refresh token is actually invalid.

### Medium

6. Both clients lack generalized transient retry/backoff for non-auth requests.

Evidence:
- Android global networking in `NetworkModule.kt` has interceptors and timeouts but no retry policy.
- iOS `APIClient.swift` retries only through the 401 auth recovery path.

Impact:
- weak mobile connectivity causes visible failures across jobs, profile, and notifications instead of controlled recovery.

Relevant files:
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/core/network/NetworkModule.kt`
- `kelmah-mobile-ios/Kelmah/Core/Network/APIClient.swift`

Recommended fix:
- add bounded retry/backoff for idempotent GET requests and explicit handling for timeout/offline classes.

7. Android message ordering still relies on raw string timestamps.

Evidence:
- `MessagingRepository.kt` sorts conversations and messages via `lastMessageAt ?: ""` and `createdAt ?: ""`.

Impact:
- any non-normalized timestamp string or mixed precision format can misorder threads and unread recency.

Relevant file:
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/messaging/data/MessagingRepository.kt`

Recommended fix:
- normalize timestamps to parsed instants before sorting, matching the stronger iOS presentation-side approach.

8. iOS still uses lexicographic ordering in the repository layer before the view-model re-sorts later.

Evidence:
- `MessagesRepository.swift` sorts `lastMessageAt` and `createdAt` strings directly.

Impact:
- repository consumers outside the current view model can still receive incorrectly ordered data;
- the data layer and presentation layer disagree about who owns chronology.

Relevant file:
- `kelmah-mobile-ios/Kelmah/Features/Messaging/Data/MessagesRepository.swift`

Recommended fix:
- move all message/conversation ordering to parsed-date helpers in the repository layer and keep it consistent everywhere.

9. "Recent activity" is an approximation, not a typed activity system.

Evidence:
- Android home combines `recommendedJobs`, conversation unread totals, and notification unread totals.
- iOS home does the same.

Impact:
- the product language implies a unified activity feed, but the implementation is just a stitched dashboard snapshot;
- recommendation recency, message recency, and alert recency are not causally ranked against one another.

Relevant files:
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/home/presentation/HomeScreen.kt`
- `kelmah-mobile-ios/Kelmah/Features/Home/Presentation/HomeView.swift`

Recommended fix:
- either rename the section language to reflect a dashboard summary, or introduce a dedicated mobile activity endpoint/model.

10. Test coverage is far below the risk profile of the native logic.

Evidence:
- Android test surface currently contains only `TokenManagerTest.kt` and `NotificationsRepositoryTest.kt`.
- iOS test surface currently contains only `NotificationOrderingTests.swift`, a default test shell, and a default UI test shell.

Impact:
- recommendation-state regressions, session-recovery regressions, and realtime refresh bugs can easily reappear without detection.

Recommended fix:
- add focused native tests for recommendation state mapping, session recovery, deep-link routing, and message ordering.

## Notes

- No mobile code changes were made during this audit pass.
- No service restart or redeploy was triggered.
- Backend was used only for read-only contract verification because the user asked to avoid restart/redeploy churn unless major implementation work was justified.