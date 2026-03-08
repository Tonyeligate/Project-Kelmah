# Kelmah Mobile Android

Native Android app root.

## Stack
- Kotlin
- Jetpack Compose
- Retrofit
- Hilt
- Room

## Scaffold status
- Gradle Android application project created
- Compose app shell and bottom navigation scaffolded
- Hilt DI foundation added
- Secure token storage and auth interceptor added
- Starter auth, home, jobs, messaging, notifications, and profile modules added

## Professional foundations included
- feature-first package structure
- production/release build config fields
- encrypted local session storage
- network security config
- release shrink/minify rules
- unit coverage for password policy and role/session security rules

## Automated validation
- GitHub Actions workflow `.github/workflows/mobile-native-validation.yml` now validates the Android app with `testDebugUnitTest`, `assembleDebug`, and `lintDebug`.
- The workflow uses Java 17, Gradle 8.7, and Android SDK platform 35 so the CI path matches the lightweight local validation setup already proven on Windows.
- Android validation is paired with remote macOS iOS validation so both native apps share one production-readiness gate.

## Auth and session hardening
- single API Gateway endpoint for all API calls
- centralized session coordinator
- login, current-user bootstrap, refresh-token recovery, and logout flows
- request ID and client metadata headers
- cached session snapshot with secure token storage
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
- Gateway origin is configured once through `KELMAH_GATEWAY_ORIGIN`
- Default gateway origin: `https://kelmah-api-gateway-qmd7.onrender.com`
- API base is derived internally as `<gateway-origin>/api`
- Realtime base is derived internally as `<gateway-origin>/socket.io`

## Next build order
1. implement Socket.IO messaging service
2. add notifications and device token registration
3. add local persistence and offline caching
4. extend worker/hirer profile workflows
5. add deep links and biometric unlock
