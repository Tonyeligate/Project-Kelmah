# Kelmah Native Auth + Session Flow — March 6, 2026

## Objective
Lock both native apps to one public backend entry point and standardize auth/session recovery against the Kelmah API Gateway.

## Single Endpoint Rule
All native mobile traffic must target one configured gateway origin only.

The native apps now derive their runtime URLs from that single origin:
- API base: `<gateway-origin>/api`
- Realtime base: `<gateway-origin>/socket.io`

Current default gateway origin for active testing:
- `https://kelmah-api-gateway-qmd7.onrender.com`

No native mobile feature should call service-specific hosts directly.

---

## Auth Route Contract
All auth traffic goes through the API Gateway:
- `POST /auth/login`
- `POST /auth/refresh-token`
- `POST /auth/logout`
- `GET /auth/me`

Because the native apps derive `/api` from the configured gateway origin, the full external paths are:
- `POST <gateway-origin>/api/auth/login`
- `POST <gateway-origin>/api/auth/refresh-token`
- `POST <gateway-origin>/api/auth/logout`
- `GET <gateway-origin>/api/auth/me`

---

## Android Data Flow
```text
LoginScreen
  ↓
AuthViewModel.login()
  ↓
AuthRepository.login()
  ↓
POST /auth/login
  ↓
API Gateway
  ↓
Auth Service
  ↓
TokenManager.saveSession()
  ↓
SessionCoordinator.bootstrapSession()
  ↓
GET /auth/me
  ↓
Authenticated app shell
```

### Recovery flow
```text
Protected request fails
  ↓
SessionCoordinator.refreshSession()
  ↓
POST /auth/refresh-token
  ↓
TokenManager updates rotated tokens
  ↓
GET /auth/me retry
  ↓
Session restored or cleared
```

---

## iOS Data Flow
```text
LoginView
  ↓
AuthRepository.login()
  ↓
POST /auth/login
  ↓
API Gateway
  ↓
Auth Service
  ↓
SessionStore.save()
  ↓
SessionCoordinator.bootstrapSession()
  ↓
GET /auth/me
  ↓
Authenticated tab shell
```

### Recovery flow
```text
APIClient receives 401
  ↓
authRecoveryHandler
  ↓
SessionCoordinator.handleUnauthorized()
  ↓
POST /auth/refresh-token
  ↓
SessionStore updates rotated tokens
  ↓
Original request retried once
```

---

## Hardening Measures Added
- One API Gateway endpoint for both apps
- request ID header on mobile API requests
- secure token storage on both platforms
- current-user bootstrap on app launch
- refresh-token rotation handling
- centralized logout and session cleanup
- cached-user recovery path for degraded startup conditions

---

## Next Mandatory Follow-up
1. add auth/register and forgot-password native flows
2. add device registration endpoint integration
3. add jobs repositories using the same auth/session execution pattern
4. add Socket.IO auth handshake using the same session stores
