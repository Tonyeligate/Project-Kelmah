# Kelmah Native Endpoint Centralization — March 7, 2026

**Status**: Completed for current scaffold phase  
**Scope**: Centralize Android and iOS networking so every native API and realtime route is derived from one configurable gateway origin per platform.

## Success Criteria
- Android resolves API and realtime URLs from one gateway origin only.
- iOS resolves API and realtime URLs from one gateway origin only.
- No native runtime screen hardcodes a separate API Gateway URL outside the central config path.
- The current live gateway can be swapped by changing one config value per platform.
- Workspace diagnostics remain clean for all touched mobile config files.

## Dry Audit File Surface
### Android
- `kelmah-mobile-android/app/build.gradle.kts`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/core/network/NetworkConfig.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/core/network/NetworkModule.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/home/presentation/HomeScreen.kt`
- `kelmah-mobile-android/README.md`

### iOS
- `kelmah-mobile-ios/Config/Debug.xcconfig`
- `kelmah-mobile-ios/Config/Release.xcconfig`
- `kelmah-mobile-ios/Kelmah/Info.plist`
- `kelmah-mobile-ios/Kelmah/Core/Config/APIEnvironment.swift`
- `kelmah-mobile-ios/Kelmah/Core/Network/APIClient.swift`
- `kelmah-mobile-ios/Kelmah/Features/Home/Presentation/HomeView.swift`
- `kelmah-mobile-ios/README.md`

## Findings Before Change
- Android already routed requests through `NetworkConfig`, but Gradle still stored separate hardcoded API and socket URLs.
- iOS already routed requests through `APIEnvironment`, but the bundle contract still exposed separate API/socket keys and the runtime fallback still hardcoded literal production URLs.
- Home screens and READMEs still displayed literal gateway URLs, which weakened the single-origin rule and made future gateway swaps harder.

## Implementation Summary
### Android
- Added a single `GATEWAY_ORIGIN` build config source, resolved from `KELMAH_GATEWAY_ORIGIN` or the current live gateway fallback.
- Updated `NetworkConfig.kt` to derive:
  - API base: `<gateway-origin>/api/`
  - Realtime base: `<gateway-origin>/socket.io/`
- Removed runtime UI copy that hardcoded an older API URL and replaced it with the active derived gateway origin.

### iOS
- Replaced separate `API_BASE_URL` and `SOCKET_BASE_URL` config values with one `GATEWAY_ORIGIN` value.
- Updated `Info.plist` to expose only `KelmahGatewayOrigin`.
- Updated `APIEnvironment.swift` to normalize the configured origin once and derive:
  - API base: `<gateway-origin>/api`
  - Realtime base: `<gateway-origin>/socket.io`
- Removed runtime UI copy that hardcoded an older API URL and replaced it with the active derived gateway origin.

## Current Config Contract
### Android
- Config key: `KELMAH_GATEWAY_ORIGIN`
- Default fallback: `https://kelmah-api-gateway-qmd7.onrender.com`

### iOS
- Config key: `GATEWAY_ORIGIN`
- Default fallback: `https://kelmah-api-gateway-qmd7.onrender.com`

## Verification
- `get_errors` returned clean results for the touched Android config files.
- `get_errors` returned clean results for the touched iOS config files.
- Workspace search confirmed no remaining runtime references to legacy `API_BASE_URL`, `SOCKET_BASE_URL`, `KelmahAPIBaseURL`, or `KelmahSocketBaseURL` inside the native apps.