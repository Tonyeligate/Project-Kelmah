# Native Mobile Precision, Match, And Activity Audit

Date: March 9, 2026
Scope: Android and iOS native apps only, with limited live contract checks against the production API gateway for mobile-consumed endpoints.

## Acceptance Criteria
- Dry-audit the Android and iOS native source surfaces end-to-end.
- Review bugs, security, performance, maintainability, and edge cases affecting match precision and productivity.
- Validate live mobile contract assumptions without restarting or redeploying services.
- Produce a prioritized mobile-only follow-up list.

## Audited Native Surface
- Android: jobs, home, profile, notifications, messaging, auth, session, realtime, network, navigation, tests
- iOS: jobs, home, profile, notifications, messaging, auth, session, realtime, network, app shell, tests

## Live Contract Checks
- Login against `https://kelmah-api-gateway-gf3g.onrender.com` succeeded with worker account `kwame.asante1@kelmah.test`.
- `GET /api/users/me/profile-signals` returned a stable `mobile-profile-signals-v1` envelope.
- `GET /api/notifications?limit=3` returned valid notification payloads, but the live `actionUrl` values mix `/messages?conversation=...` and `/messages/{conversationId}` forms.
- `GET /api/notifications/unread/count` returned a separate unread count source (`1` in the sampled response).
- `GET /api/jobs/recommendations/personalized?limit=3&page=1` returned `404 Endpoint not found`, confirming that native recommendation fallback logic is not just theoretical in production.

## Highest-Risk Findings

### 1. Personalized recommendation route is live-missing while both native apps still present fallback jobs as a recommendation experience
- Severity: Critical
- Android: `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/jobs/presentation/JobsViewModel.kt`
- iOS: `kelmah-mobile-ios/Kelmah/Features/Jobs/Presentation/JobsViewModel.swift`
- Evidence:
  - Android fallback flow around `getRecommendedJobs(limit = 6)` and `recommendationContextMessage`
  - iOS fallback flow around `getRecommendedJobs(limit = 6)` and `recommendationContextMessage`
  - Live route check returned `404 Endpoint not found`
- Impact: Mobile users are routinely pushed into degraded matching behavior. Precision and trust are reduced exactly in the area the product is trying to differentiate on.
- Fix direction: Make the recommendation state explicit (`personalized`, `fallback`, `failed`) and do not let the UI present urgent jobs as equivalent to personalized ranking.

### 2. Both native apps truncate fractional match scores to integers
- Severity: High
- Android: `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/jobs/data/JobsRepository.kt`
- iOS: `kelmah-mobile-ios/Kelmah/Features/Jobs/Data/JobsRepository.swift`
- Evidence:
  - Android parses `job.double("matchScore")?.toInt()`
  - iOS parses `object.double("matchScore").map(Int.init)`
- Impact: Rank ties become artificial, recommendation ordering loses precision, and the UI cannot explain near-match differences meaningfully.
- Fix direction: Keep match score as `Double` end-to-end and only round for display.

### 3. Both native apps silently fabricate incomplete job data instead of rejecting bad recommendation payloads
- Severity: High
- Android: `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/jobs/data/JobsRepository.kt`
- iOS: `kelmah-mobile-ios/Kelmah/Features/Jobs/Data/JobsRepository.swift`
- Evidence:
  - Default employer fallback: `Employer Name Pending`
  - Default title fallback: `Untitled Job`
- Impact: Broken backend payloads still render as plausible jobs, polluting match feeds and making data-quality issues invisible.
- Fix direction: Treat title, employer identity, and description as minimum required fields for recommended jobs; drop or flag invalid items instead of masking them.

### 4. Notification deep-link parsing is wrong for one of the live message URL shapes on both platforms
- Severity: Critical
- Android: `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/notifications/data/NotificationsModels.kt`
- iOS: `kelmah-mobile-ios/Kelmah/Features/Notifications/Data/NotificationsModels.swift`
- Live evidence:
  - One live notification used `/messages?conversation=69aa0b13e0a41572beebe499`
  - Another used `/messages/69aa0b13e0a41572beebe499`
- Code evidence:
  - Android only parses `getQueryParameter("conversation")`, `/jobs/...`, then falls back to `relatedEntityId` for `message`
  - iOS only parses query item `conversation`, `/jobs/...`, then falls back to `relatedEntityId` for `message`
- Impact: Notifications can open the wrong conversation ID or fail to navigate entirely. Recent activity loses operational value because tapping an alert does not reliably land the user in the active thread.
- Fix direction: Add `/messages/{conversationId}` path parsing and stop treating `relatedEntity.id` from message notifications as guaranteed conversation IDs.

### 5. iOS app shell can bootstrap session and shell data twice on token changes
- Severity: High
- File: `kelmah-mobile-ios/Kelmah/App/RootTabView.swift`
- Evidence: separate `.task` and `.task(id: environment.sessionStore.accessToken)` both call `bootstrapSession()` and `bootstrapShellDataIfNeeded()`
- Impact: Duplicate API work, shell flicker, redundant notification/message/job refreshes, and harder-to-reason-about startup state.
- Fix direction: Collapse shell bootstrap into one serialized bootstrap coordinator or a single guarded task.

### 6. Both native notifications flows maintain two unread-count sources and can drift from server truth
- Severity: High
- Android: `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/notifications/presentation/NotificationsViewModel.kt`
- iOS: `kelmah-mobile-ios/Kelmah/Features/Notifications/Presentation/NotificationsViewModel.swift`
- Evidence:
  - Android fetches `getNotifications()` and `getUnreadCount()` separately, then mutation paths recompute `updated.count { !isRead }`
  - iOS does `async let` for both endpoints and later mutates `unreadCount` from local list state
- Impact: Badge counts drift across devices and sessions, especially when realtime and manual mutations race.
- Fix direction: Pick one authoritative unread-count source after mutations, preferably a post-mutation refetch or a server-sourced count included with the list response.

### 7. Android session recovery can keep the user in stale cached-auth limbo after refresh failure
- Severity: High
- File: `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/core/session/SessionCoordinator.kt`
- Evidence: `recoverOrClear()` writes `SessionState.Error(cachedUser = cachedUser)` instead of forcing logout when cached user exists
- Impact: The UI can remain usable with expired credentials, producing repeated 401s during job apply, save, or messaging actions.
- Fix direction: Bound recoverable cached-auth mode tightly and force transition to unauthenticated if refresh and current-user fetch both fail.

### 8. Profile fallback parsing on both platforms suppresses section-level failures into empty data
- Severity: Medium
- Android: `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/profile/data/ProfileRepository.kt`
- iOS: `kelmah-mobile-ios/Kelmah/Features/Profile/Data/ProfileRepository.swift`
- Evidence:
  - Android `fetchOptional()` returns null and the final snapshot quietly substitutes empty credentials/availability/portfolio
  - iOS `optionalFetch()` uses `try?` with the same effect
- Impact: Recommendation-signal quality degrades silently. Workers see incomplete profile signals but get no indication that the app failed to load a section.
- Fix direction: Return per-section fetch errors and surface retry affordances for failed profile-signal subsections.

### 9. Notification recency ordering is improved but still unstable for invalid timestamps on both platforms
- Severity: Medium
- Android: `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/notifications/data/NotificationsRepository.kt`
- iOS: `kelmah-mobile-ios/Kelmah/Features/Notifications/Data/NotificationsRepository.swift`
- Evidence:
  - Android sorts null timestamps using `Long.MIN_VALUE` and original index
  - iOS sorts nil dates by original offset
- Impact: If backend emits malformed timestamps, recent activity order falls back to transport order rather than a meaningful secondary time source.
- Fix direction: Use a secondary server-derived key such as Mongo ObjectId time or `updatedAt` when `createdAt` is invalid.

### 10. Message ordering on iOS still relies on raw timestamp strings
- Severity: Medium
- File: `kelmah-mobile-ios/Kelmah/Features/Messaging/Presentation/MessagesViewModel.swift`
- Evidence:
  - message list sorted by `($0.createdAt ?? "") < ($1.createdAt ?? "")`
  - conversation list sorted by `($0.lastMessageAt ?? "") > ($1.lastMessageAt ?? "")`
- Impact: Ordering becomes fragile if the backend mixes ISO8601 formats or omits fractional seconds inconsistently.
- Fix direction: Parse to `Date` once in repository/model space and sort using typed dates.

## Productive 80/20 Follow-Up
1. Fix notification deep-link parsing on both platforms and add tests using the two live URL shapes.
2. Convert match score handling to `Double` on both platforms and expose precision in UI copy.
3. Replace split recommendation flags with a single recommendation state machine and banner logic.
4. Enforce minimum required job fields for recommendation cards.
5. Unify unread-count truth after notification mutations.
6. Remove duplicate iOS shell bootstrap paths.
7. Surface partial profile-signal failures instead of silently empty sections.

## Areas That Look Healthy
- Both native apps now use a consolidated `profile-signals` contract first and fall back only when needed.
- Realtime token observers exist on both platforms, which is the correct direction for socket freshness.
- Basic notification ordering tests were added on both platforms in the previous pass.
- The native codebases are reasonably modular by feature, which makes these issues fixable without broad architectural churn.