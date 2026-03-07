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
- placeholder test targets
- shared asset catalog skeleton
- production API gateway alignment

## Auth and session hardening
- single API Gateway endpoint for all API calls
- centralized session coordinator
- login, bootstrap, refresh-token recovery, and logout flows
- request ID and client metadata headers
- cached user recovery with secure token storage
- register, forgot-password, reset-password, resend-verification, and verify-email flows added
- profile password-change flow added

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
1. generate the Xcode project from `project.yml`
2. implement Socket.IO messaging client
3. wire push notifications and device registration
4. add local persistence and offline caching
5. add deep links and biometric unlock
