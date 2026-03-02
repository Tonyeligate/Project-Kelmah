# Deep Audit: Frontend-to-Backend Data Flow

**Date**: June 2025  
**Scope**: Complete frontend service layer → API Gateway → microservice controller response shapes  
**Status**: COMPLETED ✅ — All P0/P1/P2 fixes implemented

---

## Executive Summary

Comprehensive line-by-line audit of all frontend service files, Redux slices, React Query hooks, and their backend counterparts. Found **1 P0 critical bug**, **4 P1 high bugs**, **2 P2 medium issues**, and **3 P3 low-severity items**. All P0/P1/P2 fixes have been applied.

---

## Findings & Fixes

### P0-1: SecureStorage encryption key in sessionStorage breaks multi-tab ✅ FIXED

- **File**: `kelmah-frontend/src/utils/secureStorage.js` (line 130-145)
- **Root Cause**: `getOrCreatePersistentSecret()` stored encryption key in **sessionStorage** (per-tab), but encrypted auth data lives in **localStorage** (shared across tabs). Opening a new tab creates a new encryption key that can't decrypt existing data → force logout.
- **Impact**: Users logged out on every new tab open.
- **Fix**: Moved encryption secret to localStorage. Added migration path from sessionStorage for existing sessions. Security trade-off noted in comments (real token security is server-side, not client-side encryption).

### P1-1: Login flow double-stores tokens ✅ FIXED

- **Files**: `authService.js` (line 85-87) + `authSlice.js` (line 84-91)
- **Root Cause**: Both `authService.login()` and the `login` thunk in `authSlice.js` independently stored tokens via `secureStorage.setAuthToken/setRefreshToken/setUserData`.
- **Impact**: Double AES encryption + localStorage writes on every login. Confusing ownership of storage responsibility.
- **Fix**: Removed all storage calls from the authSlice login thunk. `authService.login()` is now the single owner of storage.

### P1-2: Email verification doesn't store access token ✅ FIXED

- **File**: `kelmah-frontend/src/modules/auth/services/authService.js` (verifyEmail method)
- **Root Cause**: Backend `GET /api/auth/verify-email/:token` returns `data.accessToken` (not `data.token`), but frontend's `verifyEmail()` never looked for `accessToken` and never stored it.
- **Impact**: After email verification, user had no stored token → couldn't access protected routes → forced to login again despite backend providing them a token.
- **Fix**: Now extracts `payload.accessToken || payload.token`, stores via `secureStorage.setAuthToken()`, and sets up automatic token refresh.

### P1-3: searchJobs parses response object as array ✅ FIXED

- **File**: `kelmah-frontend/src/modules/jobs/services/jobsService.js` (searchJobs method)
- **Root Cause**: `response.data.data || response.data.jobs || []` — backend returns `{ data: { items: [...], pagination: {...} } }`. `response.data.data` resolves to the object `{ items, pagination }`, not an array. Then `.map()` was called on this object.
- **Impact**: Search feature likely broken (TypeError or empty results).
- **Fix**: Replaced with the same multi-format response parser used by `getJobs()`, correctly extracting `data.data.items`.

### P1-4: fetchHirerProfile silently swallows all errors ✅ FIXED

- **File**: `kelmah-frontend/src/modules/hirer/services/hirerSlice.js` (fetchHirerProfile thunk)
- **Root Cause**: Catches all errors and `return {}` — never calls `rejectWithValue()`. The `.rejected` extraReducer case never fires.
- **Impact**: Hirer profile failures show no error to user. Loading clears, profile shows empty. No retry option.
- **Fix**: Final catch now uses `rejectWithValue()` with error message, allowing the `.rejected` case to fire and display errors.

### P2-1: useApiHealth fallback endpoint doesn't exist ✅ FIXED

- **File**: `kelmah-frontend/src/hooks/useApiHealth.js` (line 23-24)
- **Root Cause**: Second health endpoint `${API_BASE_URL}/health` resolves to `/api/health`, but gateway only mounts `/health` at root (not under `/api`). This endpoint always 404s.
- **Fix**: Removed the non-existent fallback. Only `/api/health/aggregate` is used now.

### P2-2: Backend response shapes wildly inconsistent (DOCUMENTED - backend fix needed)

Multiple response shape patterns across the backend:

| Pattern | Endpoints |
|---|---|
| `{ success: true, data: {...} }` | login, refresh, logout, getUserProfile |
| `{ status: "success", data: {...} }` | verifyEmail, getMe, changePassword |
| `{ success: true, message: "..." }` (no data) | register |
| Flat JSON (no wrapper) | dashboard/metrics, dashboard/workers, dashboard/analytics, availability |
| `{ success, data: { items, pagination }, meta }` | job listing (paginatedResponse) |

**Recommendation**: Standardize all backend responses to `{ success, data, message, meta }` pattern. The job service's `response.js` utility should be shared across all services.

### P3-1: getJobById dead code removed ✅ FIXED

- **File**: `kelmah-frontend/src/modules/jobs/services/jobsService.js` (getJobById)
- Removed `response.data.items` array check that was unreachable (single-job endpoint never returns items array).

### P3-2: Hardcoded URL exclusions removed ✅ FIXED

- **File**: `kelmah-frontend/src/config/environment.js`
- Removed hardcoded checks for old URLs (`5loa`, `6yoy`, `50z3`). These were leftovers from previous URL migrations.

### P3-3: normalizeUser stores _raw reference (DOCUMENTED)

- **File**: `kelmah-frontend/src/utils/userUtils.js` (line 133)
- Every normalized user stores `_raw: rawUser`, doubling memory. Low priority but should be removed once all consumers are updated to use normalized fields.

---

## Backend Response Shape Audit (Reference)

### Auth Service (`auth-service/controllers/auth.controller.js`)

| Endpoint | Wrapper | Key Fields |
|---|---|---|
| POST /api/auth/login | `{ success, data }` | `data.token`, `data.refreshToken`, `data.user` |
| POST /api/auth/register | `{ success, message }` | No `data` field |
| GET /api/auth/verify-email/:token | `{ status, data }` | `data.accessToken` (NOT `token`), `data.refreshToken`, `data.user` |
| GET /api/auth/verify (me) | `{ status, data }` | `data.user` |
| POST /api/auth/refresh-token | `{ success, data }` | `data.token`, `data.refreshToken` |

### Job Service (`job-service/controllers/job.controller.js`)

Uses standardized `successResponse`/`paginatedResponse`/`errorResponse` utilities.

| Endpoint | Response Shape | Transform |
|---|---|---|
| GET /api/jobs | paginatedResponse: `{ success, data: { items, pagination }, meta }` | `transformJobsForFrontend()` |
| GET /api/jobs/:id | successResponse: `{ success, data: {...job} }` | Inline transform (differs from list) |
| GET /api/jobs/my-jobs | paginatedResponse | Inline normalization (minimal, raw Mongo fields) |
| POST /api/jobs | successResponse | Raw Mongoose document |

### User Service (`user-service/controllers/user.controller.js`)

| Endpoint | Wrapper | Notes |
|---|---|---|
| GET /api/users/me/profile | `{ success, data, meta }` | Full profile with meta.source |
| GET /api/users/me/credentials | `{ success, data, meta }` | skills, licenses, certifications |
| GET /api/users/dashboard/metrics | **FLAT** (no wrapper) | Direct `res.json(metrics)` |
| GET /api/users/dashboard/workers | **FLAT** | Direct `res.json({ workers })` |

---

## Files Modified

1. `kelmah-frontend/src/utils/secureStorage.js` — P0-1 encryption key fix
2. `kelmah-frontend/src/modules/auth/services/authSlice.js` — P1-1 double-store removal
3. `kelmah-frontend/src/modules/auth/services/authService.js` — P1-2 email verification token storage
4. `kelmah-frontend/src/modules/jobs/services/jobsService.js` — P1-3 searchJobs fix + P3-1 dead code removal
5. `kelmah-frontend/src/modules/hirer/services/hirerSlice.js` — P1-4 error propagation fix
6. `kelmah-frontend/src/hooks/useApiHealth.js` — P2-1 invalid health endpoint removal
7. `kelmah-frontend/src/config/environment.js` — P3-2 hardcoded URL exclusion removal
