# Native Worker Messaging Alerts Copy Simplification March 11 2026

## Status
- COMPLETED ✅

## Scope
- Continue the low-literacy native worker UX pass across messaging and alerts surfaces on iOS and Android.
- Simplify search labels, loading states, empty states, composer hints, action labels, and success feedback.
- Add a shorter QA handoff sheet for the worker browse → detail → apply flow.

## Files In Scope
- `kelmah-mobile-ios/Kelmah/Features/Messaging/Presentation/MessagesView.swift`
- `kelmah-mobile-ios/Kelmah/Features/Messaging/Presentation/MessagesViewModel.swift`
- `kelmah-mobile-ios/Kelmah/Features/Notifications/Presentation/NotificationsView.swift`
- `kelmah-mobile-ios/Kelmah/Features/Notifications/Presentation/NotificationsViewModel.swift`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/messaging/presentation/MessagesScreen.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/messaging/presentation/MessagesViewModel.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/notifications/presentation/NotificationsScreen.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/notifications/presentation/NotificationsViewModel.kt`
- `spec-kit/MOBILE_NATIVE_WORKER_JOB_QA_HANDOFF_MAR11_2026.md`

## Dry Audit Findings
- Worker messaging still used abstract labels such as `Search conversations`, `Conversations`, and `Loading messages...`.
- Alerts still used more formal labels such as `Notifications`, `Unread`, and `Notification marked as read`.
- Thread and alert rows did not consistently reinforce that tapping would open the item.

## Implementation
- Simplified worker messaging copy on both native apps to use `Chats`, `Search chats`, `Loading chats...`, `No messages yet`, and `Write the first message.`
- Replaced icon-heavy message send affordances with explicit `Send` and `Sending` labels.
- Simplified worker alerts copy on both native apps to use `Alerts`, `New alerts`, `No new alerts`, `Loading alerts...`, `Marked as read`, `Marked all as read`, and `Alert removed`.
- Added `Tap to open` affordance text on conversation and actionable alert rows.
- Normalized remaining worker-facing alert status labels from `Unread` to `New`, including the alert filter in both native apps plus the iOS and Android home notification cards.
- Added `spec-kit/MOBILE_NATIVE_WORKER_JOB_QA_HANDOFF_MAR11_2026.md` as the short tester handoff artifact.

## Validation
- VS Code diagnostics reported no errors in all touched iOS and Android messaging/alerts files.
- Workspace grep confirmed the intended replacement wording is present in the active presentation files in scope.
- No simulator, device, or runtime execution was performed in this session.
- Local executable iOS validation remains unavailable on this Windows workstation.

## Outcome
- Worker messaging and alerts surfaces now use shorter, clearer language and more explicit tap/send affordances.
- QA now has a shorter pass/fail sheet for the worker jobs path in addition to the full smoke checklist.