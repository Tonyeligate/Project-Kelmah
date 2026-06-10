# Kelmah Mobile — Production Readiness Assessment

Read date: 2026-06-01
Apps: Android (Kotlin/Compose), iOS (SwiftUI)
Canonical gateway: https://kelmah-api-gateway-gf3g.onrender.com

## Verified state

- Android debug build/tests/lint: PASS
- Android release build: PASS (assembleRelease succeeds; APK at kelmah-mobile-android/app/build/outputs/apk/release/app-release-unsigned.apk)
- Android messaging UI already contains attachment picker + upload state + send flow wires into MessagesViewModel
- Android socket + session bootstrap wired
- iOS app shell and tab router present
- iOS Socket.IO client listens for new_message/receive_message/messages_read/message_read/notification
- iOS xcconfig aligns on gf3g gateway origin

## Top blockers (why not production ready)

1. Unsigned release artifact
- Android release keystore still placeholder; storeFile/passwords are dummy values
- iOS signing/capabilities/provisioning not verified
- Impact: cannot ship to Play Store / TestFlight

2. Biometric unlock missing
- Android: biometric:1.1.0 dependency present but no unlock gating
- iOS: no LocalAuthentication / Face ID wiring
- Impact: accounts stay accessible if device is unlocked by someone else

3. Attachment flow incomplete end-to-end
- Android: UI exists, but upload endpoint/contract must match backend
- iOS: no attachment picker, no upload state, no send-with-attachment path
- Impact: workers cannot share job photos/documents; chat value drops

4. iOS build not verified
- Requires macOS/Xcode; no CI/built artifact on record
- Impact: unknown compile/runtime issues remain

5. Release hardening incomplete
- Android R8 minification disabled; no shrinker rules validated
- iOS no release hardening checks (bitcode/stripping/entitlements)
- Impact: larger binaries, possible runtime regressions

6. Profile/session cache can lag
- Android ProfileScreen has snapshot fetch but no robust refetch after mutations
- iOS ProfileView bootstrap exists; wallet/payment interactions not seen
- Impact: stale data after password change or profile updates

7. Offline/retry UX incomplete
- Generic banners/snackbars exist, but no per-feature empty/retry states everywhere
- No visible backoff/back-off guidance for user
- Impact: confused users under poor network

8. Backend contract drift risk
- Messaging docs show service-local paths; gateway proxy rules must remain canonical
- Mobile clients must not embed alternate service origins

## Risk-ranked tasks for the next agent run

P0 — must fix next
- Android: replace signingConfig placeholders with real keystore values; produce signed APK/AAB; verify with jarsigner/apksigner
- iOS: on macOS, build archive and confirm no compile/runtime issues; document exact Xcode/release commands
- Android + iOS: confirm messaging send path uses the canonical gateway conversation endpoint; reject any alternate service origin
- Android + iOS: implement biometric prompt on app resume after background (not just on login)

P1 — fix before first real users
- iOS: add photo/file attachment picker + upload state + progress + retry + send-with-attachment
- Android + iOS: refetch profile snapshot after password change/edit, on tab appear, after apply-confirm
- Add retry UI to jobs/conversations/profile when backend returns 5xx/timeout
- Add explicit contact/support empty and timeout cards

P2 — harden for store submission
- Android: re-enable R8 and supply proguard-rules rules for room, retrofit, socket.io, hilt, coil
- iOS: add missing release entitlements (com.apple.developer.networking.networkextension if needed)
- Add test coverage for messaging retry and attachment upload paths

P3 — polish/metadata
- Apply icon/splash and store metadata
- Add crash reporting + analytics opt-in
- Add privacy policy / terms links

## Exact files to edit

- Android signing/hardening: kelmah-mobile-android/app/build.gradle.kts
- Android release checks: BUILD.md
- Android messaging: features/messaging/presentation/MessagesScreen.kt
- Android biometrics: core/security/BiometricUnlock.kt
- Android profile refresh: features/profile/presentation/ProfileScreen.kt
- Android session gating: app/KelmahApp.kt, core/session/SessionCoordinator.kt

- iOS signing/build: kelmah-mobile-ios/Kelmah/*.xcconfig
- iOS messaging: Features/Messaging/Presentation/MessagesView.swift, MessagesViewModel.swift
- iOS biometrics: Core/Security/LocalAuthenticationHelper.swift
- iOS socket: Core/Realtime/RealtimeSocketManager.swift

- Shared backend contract: backend/api-gateway/routes/messaging.routes.js, backend/docs/messaging-service-api.md

## Notes for frontend agents

- Do not override gateway origin unless the operator changes it; keep it single-sourced from iOS xcconfig / Android buildConfig
- Socket.IO remains source-of-truth for messaging/notifications; REST is for history/bootstrap
- Android release build currently succeeds with minify disabled; do not enable minify until Proguard rules are updated
- Biometric must be optional degradation; never block login if hardware/auth is unavailable
