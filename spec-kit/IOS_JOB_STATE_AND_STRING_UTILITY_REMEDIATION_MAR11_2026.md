# iOS Job State And String Utility Remediation March 11 2026

## Status
- COMPLETED ✅

## Scope
- Isolate iOS jobs navigation detail state away from the shared `selectedJob` singleton.
- Replace duplicated `nilIfEmpty` extensions with one shared utility.
- Keep the change local to the native iOS source layer without altering API contracts.

## Acceptance Criteria
- Job detail and application screens resolve state by `jobId`, not by whichever request last wrote a shared detail slot.
- Only one `nilIfEmpty` extension remains in the iOS source tree.
- Touched files are diagnostics-clean on the current Windows workstation.

## File Surface
- `kelmah-mobile-ios/Kelmah/Features/Jobs/Presentation/JobsViewModel.swift`
- `kelmah-mobile-ios/Kelmah/Features/Jobs/Presentation/JobDetailView.swift`
- `kelmah-mobile-ios/Kelmah/Features/Jobs/Presentation/JobApplicationView.swift`
- `kelmah-mobile-ios/Kelmah/Core/Utils/StringExtensions.swift`
- `kelmah-mobile-ios/Kelmah/Features/Jobs/Data/JobsRepository.swift`
- `kelmah-mobile-ios/Kelmah/Features/Messaging/Data/MessagesRepository.swift`
- `kelmah-mobile-ios/Kelmah/Features/Messaging/Data/MessagesModels.swift`
- `kelmah-mobile-ios/Kelmah/Features/Profile/Data/ProfileRepository.swift`
- `kelmah-mobile-ios/Kelmah/Features/Profile/Data/ProfileModels.swift`
- `kelmah-mobile-ios/Kelmah/Features/Profile/Presentation/ProfileView.swift`

## Data Flow Before
- `JobsView` pushed routes by `jobId`.
- `JobsViewModel.loadJobDetail(jobId:)` stored the result in one published `selectedJob` property.
- `JobDetailView` and `JobApplicationView` read from that shared property.
- Rapid navigation between two jobs could cause one request to overwrite the state expected by another destination.

## Data Flow After
- `JobsView` still pushes routes by `jobId`.
- `JobsViewModel` now stores detail state in `jobDetailsById` and per-job loading state in `loadingDetailJobIds`.
- `JobDetailView` reads `viewModel.jobDetail(for: jobId)`.
- `JobApplicationView` reads `viewModel.jobTitle(for: jobId)` and submits against the requested `jobId`.
- Save-state updates also refresh any cached detail record for the same `jobId`.

## Implementation Notes
- Added `Kelmah/Core/Utils/StringExtensions.swift` as the shared home for `String.nilIfEmpty`.
- Removed the duplicated local extensions from jobs, messaging, profile data, and profile presentation files.
- `toggleSaved(jobId:shouldSave:)` now keeps `recommendedJobs` aligned as well as cached detail state.

## Verification
- `get_errors` on all touched iOS source files returned no errors.
- Workspace grep for `var nilIfEmpty` in `kelmah-mobile-ios/Kelmah/**/*.swift` returned only `Kelmah/Core/Utils/StringExtensions.swift`.
- Workspace grep for `selectedJob` in `kelmah-mobile-ios/Kelmah/**/*.swift` returned no remaining stateful usage; only a closure parameter name remains in `JobsView.swift`.

## Validation Boundary
- Executable iOS simulator/XCTest validation was not run in this session because the current machine is Windows-based and does not have the Apple toolchain.
- This pass is validated by source audit plus editor diagnostics only.
