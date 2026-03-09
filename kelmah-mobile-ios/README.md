# Kelmah Mobile iOS

Native iOS app root.

## Stack
- Swift
- SwiftUI
- URLSession or Alamofire
- SwiftData or Core Data

## Scaffold status
- XcodeGen project specification added
- SwiftUI app shell and tab navigation scaffolded
- API environment and URLSession client foundation added
- Keychain-backed session store added
- Starter auth, home, jobs, messaging, notifications, and profile modules added

## Professional foundations included
- feature-first source structure
- environment config files
- secure token storage
- unit coverage for password policy and role/session security rules
- smoke UI coverage for the unauthenticated auth shell
- shared asset catalog skeleton
- production API gateway alignment

## Automated validation
- GitHub Actions workflow `.github/workflows/mobile-native-validation.yml` now generates the Xcode project with XcodeGen on a macOS runner.
- Remote validation runs `KelmahTests` plus the auth-shell smoke UI test so iOS can be build/test checked even when local development happens on Windows.
- The workflow also pairs this with Android build, unit-test, and lint validation for one native mobile gate.
- Android validation now uploads APK, unit-test, and lint artifacts so failures can be diagnosed from CI output instead of relying on console logs alone.
- iOS validation now uses a build-for-testing lane and uploads `.xcresult` bundles for both unit and UI test runs so remote native verification remains actionable from Windows-based development.

## Auth and session hardening
- single API Gateway endpoint for all API calls
- centralized session coordinator
- login, bootstrap, refresh-token recovery, and logout flows
- request ID and client metadata headers
- cached user recovery with secure token storage
- register, forgot-password, reset-password, resend-verification, and verify-email flows added
- profile password-change flow added
- sign-out-all-devices control added

## Jobs domain status
- discover and saved jobs feeds are wired
- server-backed search, category, and location filters added
- job detail and apply-to-job flows added
- save/unsave actions routed through the API Gateway
- home screen now links into jobs

## Backend target
- Gateway origin is configured once through `GATEWAY_ORIGIN`
- Default gateway origin: `https://kelmah-api-gateway-qmd7.onrender.com`
- API base is derived internally as `<gateway-origin>/api`
- Realtime base is derived internally as `<gateway-origin>/socket.io`

## Next build order
1. implement Socket.IO messaging client
2. wire push notifications and device registration
3. add local persistence and offline caching
4. add deep links and biometric unlock
5. expand authenticated end-to-end UI coverage beyond the auth-shell smoke flow
