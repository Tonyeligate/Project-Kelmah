# Native Worker Job Flow Copy Simplification March 11 2026

## Status
- COMPLETED ✅

## Scope
- Simplify worker-facing copy in native job browse, detail, save, and apply flows.
- Replace ambiguous or icon-only affordances with clearer action language.
- Keep the pass local to mobile presentation and view-model feedback layers.

## Acceptance Criteria
- Worker-facing browse, detail, and apply surfaces use shorter, more concrete wording.
- Save and apply actions are clearer than the previous icon-only or abstract labels.
- Touched native files are diagnostics-clean, and the verification boundary is documented.

## File Surface
- `kelmah-mobile-ios/Kelmah/Features/Jobs/Presentation/JobsView.swift`
- `kelmah-mobile-ios/Kelmah/Features/Jobs/Presentation/JobDetailView.swift`
- `kelmah-mobile-ios/Kelmah/Features/Jobs/Presentation/JobApplicationView.swift`
- `kelmah-mobile-ios/Kelmah/Features/Jobs/Presentation/JobsViewModel.swift`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/jobs/presentation/JobsScreen.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/jobs/presentation/JobDetailScreen.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/jobs/presentation/JobApplicationScreen.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/jobs/presentation/JobsViewModel.kt`

## Worker Flow Before
- Worker browse flows used abstract labels such as `Discover`, `Apply Filters`, and `Load More Jobs`.
- Apply screens used enterprise-style text such as `Submit a strong, professional application through the Kelmah API Gateway.`
- Save affordances in job cards were icon-only on both native apps.
- Validation messages used formal language such as `Cover letter is required` and `Enter a valid proposed rate`.

## Worker Flow After
- Browse screens now use clearer worker labels such as `Find Work`, `Find`, `Quick Search`, `Show Jobs`, and `Show More Jobs`.
- Worker cards and detail screens now use explicit save/apply text such as `Save`, `Save Job`, `Open Job`, and `Apply Now`.
- Apply screens now guide the worker with plain instructions: price, time, and a short message.
- Validation and feedback messages now use simpler wording such as `Enter your price`, `Write a short message to the hirer`, and `Saved for later`.

## Implementation Notes
- Added a short worker guidance banner to browse screens in both native apps.
- Replaced icon-only save controls in job cards with text-plus-icon buttons.
- Simplified detail metadata copy, including requirements, applications, views, and deadline labels.
- Updated submit-button loading states to show both spinner and action text on application screens.

## Verification
- `get_errors` returned no issues in all touched iOS and Android job-flow files.
- Grep verification confirmed the old worker-specific wording was removed from the active browse, detail, and apply flow paths that were in scope.

## Validation Boundary
- This pass was validated through source audit and editor diagnostics only.
- No simulator or device execution was run in this session.
- No backend contract or navigation behavior changed; the work was limited to copy and UI affordance clarity.
