# Native Worker Home Copy Simplification March 11 2026

## Status
- COMPLETED ✅

## Scope
- Simplify worker-facing copy on native home and recommendation surfaces.
- Make recommendation cards more explicit about their open-job affordance.
- Add a focused manual smoke checklist for the current worker browse → detail → apply flow.

## Acceptance Criteria
- Worker home copy is shorter and more direct across headlines, helper text, recommendation sections, and empty states.
- Recommendation fallback and failure messages are simpler in the native view-model and home layers.
- A manual smoke checklist exists for iOS and Android worker browse → detail → apply flows.
- Touched files are diagnostics-clean and the validation boundary is documented.

## File Surface
- `kelmah-mobile-ios/Kelmah/Features/Home/Presentation/HomeView.swift`
- `kelmah-mobile-ios/Kelmah/Features/Jobs/Presentation/JobsViewModel.swift`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/home/presentation/HomeScreen.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/jobs/presentation/JobsViewModel.kt`
- `spec-kit/MOBILE_NATIVE_WORKER_JOB_SMOKE_CHECKLIST_MAR11_2026.md`

## Worker Home Before
- Worker home used copy such as `Worker command view`, `Review your strongest job matches`, `Recommended matches`, and `Loading the latest work intelligence...`.
- Recommendation fallback and failure messages used technical language about personalized matching recovering or being unavailable.
- Worker recommendation cards were tappable but did not explicitly tell the user they opened a job.

## Worker Home After
- Worker home now uses simpler copy such as `Your work today`, `Find Work`, `Jobs for you`, and `Loading jobs for you...`.
- Recommendation states now use plain guidance such as `Showing urgent jobs for now.` and `Job matches are not ready now. Tap Find Work.`
- Worker recommendation cards now include `Tap to open job` to reinforce the affordance.
- Worker messages and alerts empty states now use shorter copy.

## Implementation Notes
- The copy pass stayed within native presentation files and jobs view-model feedback messages.
- No navigation contracts, API calls, or backend behavior changed.
- The manual smoke checklist lives in `spec-kit/MOBILE_NATIVE_WORKER_JOB_SMOKE_CHECKLIST_MAR11_2026.md`.

## Verification
- `get_errors` reported no issues in all touched iOS and Android source files.
- Grep verification confirmed the new worker home wording is present in both native apps.
- Grep verification confirmed the previous worker home wording targeted in this pass is no longer present in the active files in scope.

## Validation Boundary
- This pass was validated with source audit and editor diagnostics only.
- The manual smoke checklist was prepared but not executed in this session.
