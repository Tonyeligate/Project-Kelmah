# Kelmah Platform — Full Audit Report

**Date**: February 13, 2026  
**Auditor**: AI Agent (Comprehensive Multi-Prompt Audit)  
**Scope**: Bugs, UI errors, security, performance, architecture, every page

---

## Executive Summary

### Console Errors From Production (Vercel → Render)

| Error | Root Cause | Severity | Status |
|-------|-----------|----------|--------|
| CORS blocked `x-retry-limit` header on `/api/notifications` | `X-Retry-Count` and `X-Priority` headers not in gateway CORS `allowedHeaders` | **CRITICAL** | ✅ FIXED |
| 404 on `GET /api/users/profile/credentials` | Frontend tries non-existent path before the correct `/users/me/credentials` | **HIGH** | ✅ FIXED |
| 404 on `GET /api/workers/search` | Duplicate `/api/workers` mount in gateway — first mount's pathRewrite was fragile | **HIGH** | ✅ FIXED |
| `FILE_ERROR_NO_SPACE` IndexedDB | Client's browser storage full — not a code issue | **LOW** | N/A (client-side) |
| Service Worker `TypeError: Failed to fetch` | CORS rejection cascades into SW fetch handler | **MEDIUM** | ✅ FIXED (root cause: CORS) |

### Fixes Applied This Session

1. **CORS Headers** — Added `x-retry-count` and `x-priority` to gateway `allowedHeaders`; removed custom headers from `useEnhancedApi.js`
2. **Profile Endpoint** — Eliminated 5-path waterfall in `hirerSlice.js`, `hirerService.js`, `workerService.js`; now calls canonical `/users/me/credentials` directly
3. **Duplicate Workers Route** — Removed first `/api/workers` mount (fragile pathRewrite) from API gateway; consolidated to the validated mount with proper `pathRewrite` patterns
4. **JWT Algorithm Pinning** — Added `algorithms: ['HS256']` to `verifyAccessToken` and `verifyRefreshToken` in `shared/utils/jwt.js`
5. **Service Worker** — Fixed unhandled promise rejection in stale-while-revalidate; fixed wrong `/api/jobs/apply` → `/api/jobs/:jobId/apply`

---

## Section 1: Bug & Error Analysis

### 1.1 CORS Notification Failure
- **Symptom**: `Request header field x-retry-limit is not allowed by Access-Control-Allow-Headers`
- **Root Cause**: `useEnhancedApi.js` sends `X-Priority` and `X-Retry-Count` headers; gateway CORS only allowed `x-retry-limit`
- **Fix**: Added both to gateway CORS; removed non-essential custom headers from frontend hook

### 1.2 Credentials 404
- **Symptom**: `GET /api/users/profile/credentials 404 (Not Found)`
- **Root Cause**: Backend only has `/me/credentials` route. Frontend's waterfall loop tried `/profile/credentials` first (doesn't exist), generating noise
- **Fix**: Direct call to `/users/me/credentials` with single fallback to `/users/profile`

### 1.3 Worker Search 404
- **Symptom**: `GET /api/workers/search 404 (Not Found)`  
- **Root Cause**: Three `/api/workers` mounts in API gateway. First mount's `pathRewrite` used `path.replace(/^\//, '/api/users/workers/')` which produced trailing slashes and shadowed the properly-configured mount
- **Fix**: Removed duplicate first mount; consolidated to single mount with proper regex rewrites

### 1.4 Service Worker Background Sync
- **Symptom**: Background sync for job applications would always fail with 404
- **Root Cause**: SW used hardcoded `/api/jobs/apply` but actual endpoint is `POST /api/jobs/:jobId/apply`
- **Fix**: Extract `jobId` from application data and build dynamic URL

---

## Section 2: Security Audit (18 Findings)

### CRITICAL (3)

| # | Finding | Location | OWASP |
|---|---------|----------|-------|
| S1 | **Hardcoded MongoDB credentials** (`TonyGate:0553366244Aj`) in 12+ script files | `kelmah-backend/services/*/scripts/*.js` | A07:2021 |
| S2 | **OAuth tokens in URL query params** — tokens in browser history, logs, Referer | `auth.controller.js` L903, L931, L959 | A07:2021 |
| S3 | **Hardcoded admin password** `Admin@123` in seeder | `seeders/20250708080700-seed-admin-user.js` L7 | A07:2021 |

**Immediate actions required**:
- Rotate MongoDB Atlas password for `TonyGate` user
- Replace hardcoded URIs with `process.env.MONGODB_URI`
- Change admin password; source from env variable

### HIGH (5)

| # | Finding | Location | Fix |
|---|---------|----------|-----|
| S4 | Test password `TestUser123!` shipped in production bundle | `src/data/realTestUsers.js` L553 | Gate behind `import.meta.env.DEV` |
| S5 | CORS allows null origin with credentials | `server.js` L196 | Reject null origin in production |
| S6 | Legacy header trust allows user impersonation | `serviceTrust.js` L37-48 | Remove legacy path or require `x-internal-key` first |
| S7 | JWT algorithms not pinned in shared verifier | `shared/utils/jwt.js` L47 | ✅ FIXED — Added `algorithms: ['HS256']` |
| S8 | `tokenVersion` not checked at gateway | `api-gateway/middlewares/auth.js` L101 | Compare `decoded.version` with `user.tokenVersion` |

### MEDIUM (6)

| # | Finding | Location |
|---|---------|----------|
| S9 | Rate limiter fails-open on error | `rateLimiter.js` L91 |
| S10 | In-memory rate limiting (no distributed state) | `rateLimiter.js` |
| S11 | Regex-based XSS sanitization is bypassable | `request-validator.js` L210 |
| S12 | Client-side "encryption" uses deterministic key from localStorage | `secureStorage.js` L89 |
| S13 | Rate limit skip for `/api/jobs/my-jobs` | `server.js` L283 |
| S14 | Error messages leak internal details | `auth.controller.js` L106, L244, L507 |

### LOW (4)

| # | Finding | Location |
|---|---------|----------|
| S15 | Account lockout timing disclosure | `auth.controller.js` L175 |
| S16 | Refresh tokens in JSON body, not HttpOnly cookies | Frontend `apiClient.js` |
| S17 | `trust proxy` set to 1 without validation | `server.js` L91 |
| S18 | CSP allows `unsafe-inline` for scripts | `securityConfig.js` L73 |

---

## Section 3: Performance Audit (13 Findings)

### CRITICAL (5)

| # | Finding | Impact | Fix |
|---|---------|--------|-----|
| P1 | `fetchHirerProfile` tried 5 serial HTTP requests | 1-5s delay on every dashboard load | ✅ FIXED — Direct call |
| P2 | `JobManagementPage` fires 5 parallel API calls on mount | 5 concurrent requests per page visit | Add bulk endpoint or single `fetchAll` |
| P3 | `HirerDashboardPage` 60s auto-refresh with no visibility check | Wasted bandwidth when tab backgrounded | Gate behind `document.visibilityState` |
| P4 | `WorkerDashboardPage` auto-retry creates potential infinite loop | `handleRefresh` recreation triggers retry useEffect | Decouple retry from useCallback |
| P5 | `ApplicationManagementPage` N+1 fetch (20 jobs = 20 API calls) | O(n) API calls per tab change | Add bulk applications endpoint |

### HIGH (5)

| # | Finding | Impact |
|---|---------|--------|
| P6 | `proxyCache` in gateway grows unboundedly (memory leak) | Memory exhaustion over time |
| P7 | 20+ `console.log` calls in gateway production code | I/O overhead on every request |
| P8 | Inline `createProxyMiddleware` on every request for 6+ routes | New proxy instance per request |
| P9 | `framer-motion` (120KB) not in manual vendor chunks — duplicated across pages | Bundle bloat |
| P10 | No outer `<Suspense>` boundary in App.jsx | Chunk load failures unhandled |

### MEDIUM (3)

| # | Finding |
|---|---------|
| P11 | `recharts` (400KB+) not in vendor chunks |
| P12 | `react-countup` + `react-intersection-observer` add weight to JobsPage |
| P13 | 100ms artificial `setTimeout` delay before dashboard API calls |

---

## Section 4: Frontend Page-Level Audit

### Pages With Active Bugs

| Page | Issue | Severity |
|------|-------|----------|
| `MyApplicationsPage.jsx` | Error catch silently sets empty array — no error UI shown to user (L72) | **HIGH** |
| `PortfolioPage.jsx` | No loading spinner — user sees blank page during fetch | **HIGH** |
| `JobDetailsPage.jsx` | Debug `console.log` in production (L130-134); save state not persisted; `alert()` fallback for share | **MEDIUM** |
| `DashboardPage.jsx` | Double data fetching (dashboard slice + hirer/worker slice both fire API calls) | **MEDIUM** |
| `HirerToolsPage.jsx` | `console.log('Submit job', data)` dead code; empty workers array `[]` passed to comparison table | **LOW** |
| `ForgotPasswordPage.jsx` | No loading spinner during submit | **LOW** |
| `VerifyEmailPage.jsx` | No loading spinner — just text "Verifying..." | **LOW** |

### Pages With Oversized Components

| Page | Lines | Concern |
|------|-------|---------|
| `JobsPage.jsx` | 2,433 | 80+ MUI imports; duplicate lazy/eager icon imports |
| `SkillsAssessmentPage.jsx` | 1,443 | Synchronous `recharts` + `framer-motion` imports |
| `WorkerProfileEditPage.jsx` | 1,318 | Two unbatched API calls on mount |
| `JobPostingPage.jsx` | 1,102 | Heavy computation in memoized `previewSnapshot` |
| `MyApplicationsPage.jsx` | 819 | Silent error swallowing |

### Pages That Are Clean ✅

| Page | Notes |
|------|-------|
| `LoginPage.jsx` | Thin wrapper, delegates correctly |
| `RegisterPage.jsx` | Clean delegation |
| `RoleSelectionPage.jsx` | No API calls, clean UI |
| `JobAlertsPage.jsx` | Proper loading/error states |
| `ResetPasswordPage.jsx` | Single-line re-export |

---

## Section 5: Build & Configuration

| # | Finding | Severity |
|---|---------|----------|
| B1 | `chunkSizeWarningLimit: 1000` suppresses warnings instead of fixing them | HIGH |
| B2 | `optimizeDeps.force: true` slows dev startup | LOW |
| B3 | `framer-motion`, `recharts`, `react-countup` missing from `manualChunks` | HIGH |
| B4 | Duplicate `/api/workers` route mount in gateway (now fixed) | ✅ FIXED |
| B5 | Sourcemaps correctly disabled in production | ✅ OK |
| B6 | `assetsInclude: ['**/*.js']` treats JS files as static assets | MEDIUM |

---

## Section 6: Architecture Assessment

### What's Working Well
- **Code-splitting**: 40+ lazy-loaded routes via `React.lazy()` ✅
- **Service boundaries**: Clean microservice separation ✅
- **Shared models**: Centralized in `shared/models/` ✅
- **API Gateway pattern**: Single entry point with auth ✅
- **WebSocket integration**: Socket.IO through gateway proxy ✅

### What Needs Attention
1. **API Gateway complexity** — 1,307 lines with 20+ route mounts, some duplicated
2. **Frontend service layer inconsistency** — Some modules use Redux, others use Context, others call API directly
3. **Error handling** — Inconsistent across pages (some have full error UI, others silently swallow)
4. **Loading states** — Missing on several pages
5. **Bundle size** — Large libraries not chunked properly

### Recommended Priority Order

**Immediate** (security risk):
1. Rotate MongoDB credentials
2. Remove test passwords from production bundle
3. Fix OAuth token-in-URL pattern

**This Sprint** (user-impacting bugs):
4. Add error UI to `MyApplicationsPage`
5. Add loading spinner to `PortfolioPage`
6. Add visibility check to dashboard auto-refresh
7. Fix double data fetching in `DashboardPage`

**Next Sprint** (performance + architecture):
8. Add `framer-motion` / `recharts` to vendor chunks
9. Break up 1000+ line page components
10. Replace regex XSS sanitization with `DOMPurify`
11. Implement Redis-backed rate limiting

---

## Files Modified This Session

| File | Change |
|------|--------|
| `kelmah-frontend/src/modules/hirer/services/hirerSlice.js` | Replaced 5-path waterfall with direct canonical call |
| `kelmah-frontend/src/modules/hirer/services/hirerService.js` | Same — direct canonical call |
| `kelmah-frontend/src/modules/worker/services/workerService.js` | Same — direct canonical call |
| `kelmah-frontend/src/hooks/useEnhancedApi.js` | Removed non-standard `X-Priority` / `X-Retry-Count` headers |
| `kelmah-backend/api-gateway/server.js` | Removed duplicate `/api/workers` mount; added CORS headers |
| `kelmah-backend/shared/utils/jwt.js` | Pinned JWT algorithms to `HS256` |
| `kelmah-frontend/public/sw.js` | Fixed wrong apply endpoint; fixed unhandled promise rejection |

**Build Status**: ✅ Compiles successfully (1m 13s)
