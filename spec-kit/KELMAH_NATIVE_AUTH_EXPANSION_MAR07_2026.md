# Kelmah Native Auth Expansion — March 7, 2026

**Status**: Completed for current scaffold phase
**Scope**: Expand both native mobile apps beyond sign-in so the auth surface includes registration, password recovery, reset-password, and email verification resend flows against the single API Gateway endpoint.

## Success Criteria
- Android supports sign in, register, forgot password, reset password, and resend verification email.
- iOS supports sign in, register, forgot password, reset password, and resend verification email.
- All flows use one configured API Gateway origin only, with `/api` derived internally.
- Auth screens provide clear success and error state handling suitable for production-facing onboarding.
- Workspace diagnostics remain clean after implementation.

## Dry Audit File Surface
### Backend
- `kelmah-backend/api-gateway/routes/auth.routes.js`
- `kelmah-backend/services/auth-service/routes/auth.routes.js`
- `kelmah-backend/services/auth-service/controllers/auth.controller.js`

### Frontend references
- `kelmah-frontend/src/modules/auth/services/authService.js`

### Android
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/auth/data/AuthApiService.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/auth/data/AuthModels.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/auth/data/AuthRepository.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/auth/presentation/AuthViewModel.kt`
- `kelmah-mobile-android/app/src/main/java/com/kelmah/mobile/features/auth/presentation/LoginScreen.kt`

### iOS
- `kelmah-mobile-ios/Kelmah/Features/Auth/Data/AuthModels.swift`
- `kelmah-mobile-ios/Kelmah/Features/Auth/Data/AuthRepository.swift`
- `kelmah-mobile-ios/Kelmah/Features/Auth/Presentation/LoginViewModel.swift`
- `kelmah-mobile-ios/Kelmah/Features/Auth/Presentation/LoginView.swift`

## Current Backend Contract Findings
- `POST /api/auth/register`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/resend-verification-email`
- `GET /api/auth/verify-email/:token`
- Login and refresh are already implemented in both native apps.
- Registration currently returns a success message and does not automatically authenticate the user.
- Reset-password supports both route-token and body-token variants; the mobile apps can safely use the body-token route for simplicity.

## Live Validation Findings
- Live API gateway validation on March 7, 2026 showed `POST /api/auth/register`, `POST /api/auth/resend-verification-email`, and `POST /api/auth/forgot-password` returning `504 Gateway Timeout` while `POST /api/auth/login` still succeeded.
- This indicates the email-backed auth actions are likely blocking too long in the auth service despite the core auth service being reachable.
- The next fix is to harden email delivery so registration and recovery endpoints never hang the mobile onboarding flow.

## Implementation Summary
### Native mobile
- Android auth now supports sign in, register, forgot password, reset password, resend verification email, email verification token handling, and profile password change.
- iOS auth now supports sign in, register, forgot password, reset password, resend verification email, email verification token handling, and profile password change.
- Both apps now expose real profile security surfaces instead of pure placeholders.

### Backend hardening
- Auth email service now uses guarded SMTP sending with a bounded timeout.
- Missing SMTP credentials no longer leave email-backed auth requests hanging indefinitely.
- Resend-verification, forgot-password, reset-password confirmation, and password-change confirmation flows now log email failures without failing the primary auth action.

## Verification
- `get_errors` returned clean results for `kelmah-mobile-android/`.
- `get_errors` returned clean results for `kelmah-mobile-ios/`.
- `get_errors` returned clean results for:
	- `kelmah-backend/services/auth-service/services/email.service.js`
	- `kelmah-backend/services/auth-service/controllers/auth.controller.js`
- Live gateway validation before the backend hardening reproduced the timeout issue.
- Live post-deployment validation is still pending because the updated backend code has not been deployed from this session.
