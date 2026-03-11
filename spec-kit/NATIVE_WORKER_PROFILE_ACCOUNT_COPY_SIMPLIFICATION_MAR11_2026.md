# Native Worker Profile Account Copy Simplification March 11 2026

## Status
- COMPLETED ✅

## Scope
- Continue the low-literacy native worker UX pass across profile and account settings surfaces on iOS and Android.
- Simplify section titles, helper text, action labels, sign-out dialogs, profile detail labels, and repository-backed warning messages.
- Record the runtime-validation limits for this Windows workspace.

## Files In Scope
- `kelmah-mobile-ios/Kelmah/Features/Profile/Presentation/ProfileView.swift`
- `kelmah-mobile-ios/Kelmah/Features/Profile/Data/ProfileRepository.swift`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/profile/presentation/ProfileScreen.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/profile/presentation/ProfileViewModel.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/profile/data/ProfileRepository.kt`

## Dry Audit Findings
- The active worker profile screens still used enterprise-style labels such as `Recommendation signals`, `Retry profile sync`, `Visible skills`, `Availability and completeness`, and `Portfolio proof`.
- Account controls still used longer security wording and more formal sign-out language than the earlier worker-facing surfaces.
- Repository partial-warning text still described recommendation-system internals rather than simple worker-facing outcomes.

## Implementation
- Simplified the main worker profile section to `Your work details` with shorter helper and retry copy on both native apps.
- Simplified the password/account section wording, including the helper text, primary action label, and sign-out-everywhere wording.
- Simplified worker profile details and empty/fallback labels such as job title, work area, rate, experience, visible skills, availability/profile progress, and past work.
- Simplified password-change validation from `Complete all password fields` to `Fill in all password boxes` and removed the awkward `New ...` password-policy prefix in both native view-models.
- Simplified repository fallback warnings so they describe missing certificates, work time, profile checks, and past work in worker-facing language.

## Validation
- VS Code diagnostics reported no errors in all touched iOS and Android profile files.
- Workspace grep confirmed the targeted technical wording was removed from the active native profile files in scope.
- Runtime QA handoff execution could not be completed from this workspace because `adb devices` returned no connected devices, the Android `emulator` binary is not available on PATH, and Apple simulator tooling is unavailable on this Windows machine.
- No simulator, device, or runtime execution was performed in this session.

## Outcome
- Worker profile and account settings surfaces now match the simpler language already applied to jobs, home, messaging, and alerts.
- The remaining validation gap is runtime execution on a connected Android device/emulator and on macOS for iOS.