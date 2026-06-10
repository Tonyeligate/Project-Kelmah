# One-Time Mobile Stitch Fix/Build Improvement Plan

## Goal
Execute a single, build-safe improvement pass across `kelmah-mobile-android` and `kelmah-mobile-ios` that moves both native apps toward the Stitch source-of-truth design without attempting a full 70-screen rebuild. Prioritize changes that are low-risk, broadly visible, and compile-friendly.

## Constraints
- Preserve existing API, session, WebSocket, and view model behavior.
- Do not replace functional screens wholesale unless necessary.
- Keep backward-compatible token names so existing components continue compiling.
- Avoid adding font assets unless bundled font files already exist; use platform sans-serif/custom-name fallbacks for this pass.
- Validate with native build/test commands where feasible.

## Implementation Scope

### 1. Android Design Foundation
Files:
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/core/design/theme/Color.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/core/design/theme/Theme.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/core/design/theme/Type.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/core/design/theme/Shape.kt`

Actions:
- Add Stitch color tokens: primary `#705D00`, gold `#FFD700`, light surface/background `#F9F9F9`, surface container values, outline values, success/info/error, dark primary/background/surface/on-surface.
- Remap existing `Kelmah*` token aliases to Stitch-compatible values where safe, so existing UI updates visually without mass rewrites.
- Change `LightColors` and `DarkColors` to Stitch Material3 color schemes.
- Change `KelmahTheme` default from always-dark to `isSystemInDarkTheme()` so the app can show Stitch light mode by default on light devices.
- Adjust typography toward Stitch sizes/weights using existing `FontFamily.SansSerif` fallback: Montserrat-like display weights and Inter-like body weights.
- Ensure shapes keep 8/12/16dp rounded values compatible with Stitch.

### 2. Android Shared Components/Shell
Files:
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/core/design/components/KelmahBottomNav.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/core/design/components/KelmahPremiumUi.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/app/navigation/KelmahDestination.kt` if present
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/app/navigation/KelmahNavHost.kt`

Actions:
- Inspect current bottom nav component before editing.
- Align bottom nav styling to Stitch: 5 tabs when available, gold active pill/background, muted inactive labels, badge support if already wired.
- Keep existing route names and screen callbacks.
- If a Scaffold shell already owns bottom navigation, update only its visual implementation.
- If bottom navigation is not integrated, add the smallest shell-level integration around existing `NavHost` without breaking deep links.
- Update shared panel/button/chip colors to consume `MaterialTheme.colorScheme` and Stitch aliases instead of hardcoded old navy/gold values.

### 3. Android High-Impact Screen Polish
Files:
- `HomeScreen.kt`
- `JobsScreen.kt`
- `JobDetailScreen.kt`
- `MessagesScreen.kt`
- `NotificationsScreen.kt` if needed

Actions:
- Do not rewrite data flows.
- Replace old dark command-deck visual emphasis with Stitch light card hierarchy where straightforward.
- Use Stitch spacing: 16dp screen gutters, 8/12/16dp component spacing, 48dp minimum touch targets.
- Align visible chips/buttons/cards to primary-container gold actions and surface cards.
- Preserve loading, empty, error, refresh, and navigation behavior.

### 4. iOS Design Foundation
Files:
- `kelmah-mobile-ios/Kelmah/Core/Design/KelmahTheme.swift`
- `kelmah-mobile-ios/Kelmah/Core/Design/KelmahPremiumComponents.swift`

Actions:
- Add `Color(hex:)` support if not already present.
- Add Stitch tokens to `KelmahTheme`: `stitchPrimary`, `stitchGold`, `stitchSurface`, `stitchBg`, `stitchSurfaceVar`, `stitchOutline`, `stitchOutlineVar`, `stitchError`, `stitchSuccess`, `stitchInfo`, dark variants.
- Remap existing `primary`, `sun`, `cyan`, `success`, `danger`, `background`, `card`, `textPrimary`, `textMuted`, and border aliases to Stitch-compatible values while preserving names.
- Add typography helper constants or view modifiers where minimal and safe; avoid asset-dependent custom fonts unless project already includes font files.
- Update `KelmahPremiumBackground`, `KelmahPanel`, `KelmahSignalChip`, section headers, metric tiles, and common button styling to Stitch surface/card/gold colors.

### 5. iOS Shell/Navigation and High-Impact Screens
Files:
- `HomeView.swift`
- `JobsView.swift`
- `JobDetailView.swift`
- `MessagesView.swift`
- app/root tab container files found during implementation

Actions:
- Inspect current app entry/root navigation before editing.
- If a `TabView` or custom root shell exists, align it to the 5-tab Stitch bottom nav visually.
- If no safe root shell exists, avoid architectural churn and only align screen-level top/action areas.
- Update Home, Jobs, Job Detail, and Messages visible cards/chips/buttons to consume updated theme aliases.
- Preserve async tasks, refreshable behavior, callbacks, and view model wiring.

### 6. Build Fixes and Verification
Actions:
- Run Android compile check from `kelmah-mobile-android`, preferably `./gradlew :app:assembleDebug` or the project’s existing debug build task.
- Run Android tests if the build is healthy and tasks are discoverable.
- Run iOS build/test discovery from `kelmah-mobile-ios`; use `xcodebuild -list` first, then build the main scheme for a simulator if available.
- Fix compile errors introduced by this pass.
- Do not chase unrelated pre-existing failures beyond documenting them.

## Execution Order
1. Inspect remaining component/root files for shell ownership.
2. Patch Android theme tokens and typography first.
3. Patch iOS theme tokens and shared premium components second.
4. Patch Android bottom nav/shell and shared component visuals.
5. Patch iOS root/tab or screen-level shell visuals.
6. Polish Home/Jobs/Job Detail/Messages only as needed after token changes.
7. Run Android build and fix introduced failures.
8. Run iOS build discovery/build and fix introduced failures if feasible on this machine.
9. Provide final summary with changed files and validation results.

## Non-Goals For This One-Time Pass
- Full implementation of all 70+ Stitch screens.
- Adding payment SDKs, maps SDKs, camera upload, or push notification infrastructure.
- Replacing WebSocket/chat state management.
- Rotating exposed Stitch/API keys.
- Creating a spreadsheet or long documentation artifact beyond this plan.
- Committing or pushing changes unless explicitly requested.

## Expected Outcome
Both native apps should retain their existing functionality but visually move closer to the Stitch design system through shared tokens, lighter surface/card hierarchy, gold primary actions, standardized typography/spacing, and improved bottom navigation where safely available.