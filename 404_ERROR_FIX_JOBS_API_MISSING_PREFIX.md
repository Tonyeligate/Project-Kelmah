# 404 Error Fix - Jobs API Missing /api Prefix

**Date**: October 11, 2025  
**Status**: ✅ FIXED (Commit 5f1e97fc)  
**Investigation Protocol**: 5-Step Protocol Followed ✅

---

## Executive Summary

Jobs API was returning 404 errors because endpoints were missing the `/api` prefix. API Gateway only routes requests to `/api/jobs/*`, but the frontend was requesting `/jobs/*`.

**Root Cause**: Path inconsistency in jobsApi.js - some endpoints had `/api` prefix, others didn't.

**Solution**: Added `/api` prefix to ALL 6 job service endpoints to match the workers API pattern and API Gateway routing.

---

## 5-Step Investigation Protocol ✅

### STEP 1: List All Files Involved ✅

**Error Report Analysis:**
```
Frontend Error:
GET https://kelmah-api-gateway-qlyk.onrender.com/jobs?status=open... 404 (Not Found)

Backend API Gateway Log:
info: Incoming request {"url":"/jobs?status=open&min_budget=500...",...}
info: JSON response sent {"statusCode":404,...}
```

**Files Identified:**
1. `kelmah-frontend/src/modules/jobs/services/jobsApi.js` - Job API service layer
2. `kelmah-frontend/src/modules/common/services/axios.js` - Axios service client
3. `kelmah-frontend/public/runtime-config.json` - Runtime configuration
4. `kelmah-backend/api-gateway/server.js` - API Gateway routing
5. `kelmah-frontend/src/config/environment.js` - Environment configuration
6. `kelmah-frontend/src/modules/search/pages/SearchPage.jsx` - Workers API (working example)

---

### STEP 2: Read All Listed Files & Find Error Location ✅

**jobsApi.js - ERROR LOCATIONS FOUND:**
- Line 45: `jobServiceClient.get('/jobs')` ❌ Missing /api
- Line 110: `jobServiceClient.post('/jobs')` ❌ Missing /api
- Line 118: `jobServiceClient.get('/jobs/saved')` ❌ Missing /api
- Line 128: `jobServiceClient.post('/api/jobs/${jobId}/save')` ✅ Has /api
- Line 132: `jobServiceClient.delete('/api/jobs/${jobId}/save')` ✅ Has /api
- Line 141: `jobServiceClient.get('/jobs/contracts')` ❌ Missing /api
- Line 161: `jobServiceClient.get('/api/jobs/${jobId}')` ✅ Has /api
- Line 237: `jobServiceClient.get('/jobs')` ❌ Missing /api
- Line 282: `jobServiceClient.get('/jobs/categories')` ❌ Missing /api

**Pattern Found**: INCONSISTENT path usage - some with `/api`, most without.

**axios.js - normalizeUrlForGateway (line 81-98):**
```javascript
const normalizeUrlForGateway = (config) => {
  const base = typeof config.baseURL === 'string' ? config.baseURL : '';
  const url = typeof config.url === 'string' ? config.url : '';
  
  const baseHasApi = base.includes('/api');  // ← KEY LINE
  const urlStartsWithApi = url === '/api' || url.startsWith('/api/');

  if (baseHasApi && urlStartsWithApi) {
    // Remove /api from url to avoid duplication
    config.url = url.replace(/^\/api\/?/, '/');
  }
  return config;
};
```

**Issue**: When `baseURL = 'https://kelmah-api-gateway-qlyk.onrender.com'`, 
- `base.includes('/api')` returns **FALSE** (domain doesn't contain '/api')
- No normalization happens
- Path remains `/jobs` instead of becoming `/api/jobs`

**runtime-config.json:**
```json
{
  "ngrokUrl": "https://kelmah-api-gateway-qlyk.onrender.com",
  "API_URL": "https://kelmah-api-gateway-qlyk.onrender.com"
}
```

**API Gateway server.js (line 554-579):**
```javascript
// Job routes - ONLY has /api/jobs, NOT /jobs
app.use('/api/jobs', (req, res, next) => {
  // Rate limiting logic
});

app.use('/api/jobs', (req, res, next) => {
  if (jobProxyMiddleware) {
    return jobProxyMiddleware(req, res, next);
  }
  // ...
});
```

**Confirmation**: API Gateway has **NO ROUTE** for `/jobs`, only `/api/jobs`.

**SearchPage.jsx (WORKING EXAMPLE - line 174):**
```javascript
const apiEndpoint = '/api/workers';  // ✅ Full path with /api prefix
const response = await axios.get(apiEndpoint, { params: apiParams });
```

**Pattern Confirmed**: Workers API uses FULL PATH with `/api` prefix → works correctly.

---

### STEP 3: Scan Related Files to Confirm Root Cause ✅

**Comparison Analysis:**

| API | Endpoint Path | BaseURL | Final URL | Result |
|-----|---------------|---------|-----------|--------|
| Workers | `/api/workers` | `https://render.com` | `https://render.com/api/workers` | ✅ 200 |
| Jobs (before) | `/jobs` | `https://render.com` | `https://render.com/jobs` | ❌ 404 |
| Jobs (after) | `/api/jobs` | `https://render.com` | `https://render.com/api/jobs` | ✅ Expected |

**normalizeUrlForGateway Behavior:**

| baseURL | url | baseHasApi | Normalized? | Final Path |
|---------|-----|------------|-------------|------------|
| `/api` | `/jobs` | TRUE | YES → `/jobs` | `/api/jobs` ✅ |
| `https://render.com` | `/jobs` | FALSE | NO | `/jobs` ❌ |
| `https://render.com` | `/api/jobs` | FALSE | NO | `/api/jobs` ✅ |

**Root Cause Confirmed:**
1. `normalizeUrlForGateway` was designed for **relative baseURL** (`/api`), not absolute URLs
2. With absolute Render URL, `base.includes('/api')` is false
3. No normalization happens, path stays as-is
4. Jobs API used `/jobs` → 404
5. Workers API used `/api/jobs` → works
6. **Solution**: Use full paths with `/api` prefix like workers do

---

### STEP 4: Confirm Complete Flow and Logic ✅

**COMPLETE REQUEST FLOW (Before Fix):**

```
1. User opens Jobs page
   ↓
2. JobsPage.jsx calls jobsApi.getJobs()
   ↓
3. jobsApi.js line 45: jobServiceClient.get('/jobs', { params })
   ↓
4. axios.js service client interceptor (line 536-565):
   - Calls getApiBaseUrl()
   - Returns: 'https://kelmah-api-gateway-qlyk.onrender.com' (from runtime-config.json)
   - Updates: config.baseURL = 'https://kelmah-api-gateway-qlyk.onrender.com'
   - Calls normalizeUrlForGateway(config)
   ↓
5. normalizeUrlForGateway (line 81-98):
   - base = 'https://kelmah-api-gateway-qlyk.onrender.com'
   - url = '/jobs'
   - baseHasApi = base.includes('/api') → FALSE ❌
   - urlStartsWithApi = false
   - Condition fails: if (baseHasApi && urlStartsWithApi) → FALSE
   - NO NORMALIZATION - returns config unchanged
   ↓
6. Axios constructs final URL:
   - baseURL + url
   - 'https://kelmah-api-gateway-qlyk.onrender.com' + '/jobs'
   - Final: 'https://kelmah-api-gateway-qlyk.onrender.com/jobs'
   ↓
7. Request sent: GET https://kelmah-api-gateway-qlyk.onrender.com/jobs
   ↓
8. API Gateway receives: GET /jobs
   ↓
9. API Gateway routing check:
   - app.use('/api/jobs', ...) → NO MATCH ❌
   - No other routes match '/jobs'
   - Falls through to 404 handler
   ↓
10. Response: 404 Not Found ❌
```

**COMPLETE REQUEST FLOW (After Fix):**

```
1. User opens Jobs page
   ↓
2. JobsPage.jsx calls jobsApi.getJobs()
   ↓
3. jobsApi.js line 45: jobServiceClient.get('/api/jobs', { params })  ← CHANGED
   ↓
4. axios.js service client interceptor:
   - Updates: config.baseURL = 'https://kelmah-api-gateway-qlyk.onrender.com'
   - Calls normalizeUrlForGateway(config)
   ↓
5. normalizeUrlForGateway:
   - base = 'https://kelmah-api-gateway-qlyk.onrender.com'
   - url = '/api/jobs'  ← CHANGED
   - baseHasApi = base.includes('/api') → FALSE
   - urlStartsWithApi = url.startsWith('/api/') → TRUE ✅
   - Condition: (FALSE && TRUE) → FALSE (no normalization needed)
   - Returns config unchanged (which is correct - path already has /api)
   ↓
6. Axios constructs final URL:
   - 'https://kelmah-api-gateway-qlyk.onrender.com' + '/api/jobs'
   - Final: 'https://kelmah-api-gateway-qlyk.onrender.com/api/jobs' ✅
   ↓
7. Request sent: GET https://kelmah-api-gateway-qlyk.onrender.com/api/jobs
   ↓
8. API Gateway receives: GET /api/jobs ✅
   ↓
9. API Gateway routing check:
   - app.use('/api/jobs', ...) → MATCH ✅
   - Routes to Job Service
   ↓
10. Response: 200 OK with jobs data ✅
```

**Logic Confirmation:**
- ✅ API Gateway routes `/api/jobs` to Job Service
- ✅ Workers use `/api/workers` → works
- ✅ Jobs now use `/api/jobs` → will work
- ✅ No code changes needed in axios.js or API Gateway
- ✅ Simple path prefix fix in jobsApi.js

---

### STEP 5: Verify Fix by Scanning All Files ✅

**Changes Applied to jobsApi.js:**

| Line | Method | Before | After | Status |
|------|--------|--------|-------|--------|
| 45 | getJobs | `get('/jobs')` | `get('/api/jobs')` | ✅ Fixed |
| 110 | createJob | `post('/jobs')` | `post('/api/jobs')` | ✅ Fixed |
| 118 | getSavedJobs | `get('/jobs/saved')` | `get('/api/jobs/saved')` | ✅ Fixed |
| 128 | saveJob | `post('/api/jobs/...')` | No change | ✅ Already correct |
| 132 | unsaveJob | `delete('/api/jobs/...')` | No change | ✅ Already correct |
| 141 | getContracts | `get('/jobs/contracts')` | `get('/api/jobs/contracts')` | ✅ Fixed |
| 161 | getJobById | `get('/api/jobs/...')` | No change | ✅ Already correct |
| 237 | searchJobs | `get('/jobs')` | `get('/api/jobs')` | ✅ Fixed |
| 263 | applyToJob | `post('/api/jobs/...')` | No change | ✅ Already correct |
| 282 | getJobCategories | `get('/jobs/categories')` | `get('/api/jobs/categories')` | ✅ Fixed |
| 298 | getPersonalized... | `get('/api/jobs/...')` | No change | ✅ Already correct |

**Total Changes: 6 endpoints fixed, 5 already correct**

**Verification Against API Gateway Routes:**

```javascript
// API Gateway server.js - ALL these routes now match:
app.use('/api/jobs', ...)           → getJobs() ✅
app.use('/api/jobs', ...)           → createJob() ✅
// GET /api/jobs/saved              → getSavedJobs() ✅
// POST /api/jobs/:id/save          → saveJob() ✅ (already correct)
// DELETE /api/jobs/:id/save        → unsaveJob() ✅ (already correct)
// GET /api/jobs/contracts          → getContracts() ✅
// GET /api/jobs/:id                → getJobById() ✅ (already correct)
// GET /api/jobs with params        → searchJobs() ✅
// POST /api/jobs/:id/apply         → applyToJob() ✅ (already correct)
// GET /api/jobs/categories         → getJobCategories() ✅
// GET /api/jobs/recommendations... → getPersonalized... ✅ (already correct)
```

**Pattern Consistency Verified:**
- ✅ ALL job endpoints now use `/api/jobs/*` prefix
- ✅ Matches workers pattern: `/api/workers`
- ✅ Matches auth pattern: `/api/auth/*`
- ✅ Matches messaging pattern: `/api/messaging/*`
- ✅ Consistent with API Gateway routing convention

**No Side Effects:**
- ✅ No changes to axios.js - works with both relative and absolute baseURL
- ✅ No changes to API Gateway - already has correct routes
- ✅ No changes to other services - workers, auth, etc. unaffected
- ✅ normalizeUrlForGateway still works for relative baseURL case

---

## Fix Summary

### What Was Changed
**File**: `kelmah-frontend/src/modules/jobs/services/jobsApi.js`

**6 Endpoints Updated:**
1. `getJobs()` - Line 45: `/jobs` → `/api/jobs`
2. `createJob()` - Line 110: `/jobs` → `/api/jobs`
3. `getSavedJobs()` - Line 118: `/jobs/saved` → `/api/jobs/saved`
4. `getContracts()` - Line 141: `/jobs/contracts` → `/api/jobs/contracts`
5. `searchJobs()` - Line 237: `/jobs` → `/api/jobs`
6. `getJobCategories()` - Line 282: `/jobs/categories` → `/api/jobs/categories`

### Why This Works

**Before Fix:**
```javascript
// Request construction
baseURL: 'https://kelmah-api-gateway-qlyk.onrender.com'
path: '/jobs'
// Final URL: https://kelmah-api-gateway-qlyk.onrender.com/jobs
// API Gateway receives: /jobs → 404 (no route)
```

**After Fix:**
```javascript
// Request construction
baseURL: 'https://kelmah-api-gateway-qlyk.onrender.com'
path: '/api/jobs'
// Final URL: https://kelmah-api-gateway-qlyk.onrender.com/api/jobs
// API Gateway receives: /api/jobs → 200 (routes to Job Service)
```

### Expected Behavior After Deployment

**Console Logs:**
```
🔗 Vercel deployment detected, using LocalTunnel URL from runtime config
🔄 Service client updating baseURL: /api → https://kelmah-api-gateway-qlyk.onrender.com
🔍 Calling job service API with params: {status: 'open', ...}
GET https://kelmah-api-gateway-qlyk.onrender.com/api/jobs?status=open... 200 OK
📊 Raw API response: {success: true, items: [...], total: 12}
✅ Jobs loaded from API: 12
```

**Network Tab:**
- Request URL: `https://kelmah-api-gateway-qlyk.onrender.com/api/jobs`
- Status: `200 OK`
- Response: Jobs data array

**No More Errors:**
- ❌ No more `404 Not Found` errors
- ❌ No more missing `/api` prefix issues
- ❌ No more inconsistent paths

---

## Testing & Verification

### Manual Testing Steps

1. **Open Production Site**: https://kelmah-frontend-cyan.vercel.app
2. **Navigate to Jobs Page**: Click "Find Talents" or browse jobs
3. **Check Browser Console**:
   - Should see: `GET https://...onrender.com/api/jobs 200 OK`
   - Should NOT see: `404 Not Found` errors
4. **Verify Jobs Load**: Jobs should display on the page
5. **Check Network Tab**:
   - Request URL should include `/api/jobs`
   - Status should be `200 OK`

### Automated Verification

```bash
# Test job listing endpoint
curl https://kelmah-api-gateway-qlyk.onrender.com/api/jobs?status=open

# Should return: 200 OK with jobs data
# Should NOT return: 404 Not Found
```

---

## Lessons Learned

### Key Takeaways

1. **Path Consistency is Critical**: All service endpoints must use consistent path patterns
   - Workers: `/api/workers` ✅
   - Jobs: `/api/jobs` ✅ (now fixed)
   - Auth: `/api/auth` ✅
   - Messaging: `/api/messaging` ✅

2. **Absolute vs Relative URLs**: Understand how URL construction works
   - With relative baseURL (`/api`): normalizeUrlForGateway adds /api
   - With absolute baseURL (`https://...`): path must already include /api

3. **Check Working Examples**: When debugging, compare with working features
   - Workers API worked → used `/api/workers`
   - Jobs API failed → used `/jobs`
   - Solution: Match the working pattern

4. **5-Step Protocol Works**: Following structured investigation prevents guesswork
   - List all files → Read completely → Scan related → Confirm flow → Verify fix
   - Each step builds on previous understanding
   - No assumptions, only evidence

5. **API Gateway Routing**: Frontend paths must match backend routes
   - API Gateway has routes for `/api/*`
   - Frontend must request `/api/*`
   - Mismatched paths → 404 errors

### Future Prevention

- **Establish Path Convention**: Document that all service endpoints use `/api/[service]/*` pattern
- **Code Review Checklist**: Verify new endpoints follow path convention
- **Integration Tests**: Test that all endpoints match API Gateway routes
- **Centralized Constants**: Consider using path constants to avoid hardcoding

---

## Git Commit

**Commit**: 5f1e97fc  
**Branch**: main  
**Deployed**: Vercel auto-deployment triggered  
**Status**: ✅ FIXED

**Commit Message:**
```
fix: Add /api prefix to all job service endpoints

ROOT CAUSE: jobsApi.js used inconsistent paths - some with /api prefix, most without.
API Gateway only routes /api/jobs, not /jobs. Workers API worked because it uses
/api/workers (full path with prefix).

FIX: Changed 6 endpoints to include /api prefix:
- getJobs: /jobs → /api/jobs
- createJob: /jobs → /api/jobs  
- getSavedJobs: /jobs/saved → /api/jobs/saved
- getContracts: /jobs/contracts → /api/jobs/contracts
- searchJobs: /jobs → /api/jobs
- getJobCategories: /jobs/categories → /api/jobs/categories

VERIFICATION: 5-step protocol followed. All files scanned. Flow confirmed.
Pattern now matches workers (/api/workers) and API Gateway routing.
```

---

## Resolution Status

**Status**: FIXED ✅  
**Deployed**: In progress (Vercel auto-deployment)  
**Verification**: Pending production testing  
**Expected Outcome**: Jobs will load successfully with no 404 errors

**Next Steps:**
1. Wait for Vercel deployment (~2-3 minutes)
2. Test production site at https://kelmah-frontend-cyan.vercel.app
3. Verify jobs load without errors
4. Confirm network requests go to `/api/jobs`
5. Close issue if successful
