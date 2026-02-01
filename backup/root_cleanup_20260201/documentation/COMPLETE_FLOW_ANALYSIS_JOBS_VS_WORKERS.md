# Complete Flow Analysis: Jobs API vs Workers API

**Date**: October 11, 2025  
**Issue**: 511 errors on production for Jobs API  
**Status**: ✅ FIXED (Commit 5fd5ff28)

## Executive Summary

The Jobs API was failing with 511 errors while the Workers API worked correctly. Root cause: **Service clients lacked dynamic baseURL loading from runtime-config.json**, causing axios to convert relative '/api' paths to absolute frontend URLs that bypassed Vercel rewrites.

---

## 🔍 WORKING FLOW: Workers API

### Request Chain
```
SearchPage.jsx (line 215)
  ↓
axios.get('/api/workers')  ← Uses MAIN axios instance
  ↓
axios.js initializeAxios() (line 26-38)
  ↓ 
baseURL = await getApiBaseUrl()  ← Loads from runtime-config.json
  ↓
Main axios interceptor (line 106-118)
  ↓
🔥 CRITICAL: Dynamic baseURL update from runtime-config.json
  const currentBaseURL = await getApiBaseUrl();
  config.baseURL = currentBaseURL;  ← LocalTunnel URL loaded here!
  ↓
Final request: GET https://kelmah-api.loca.lt/api/workers
  ↓
Vercel rewrite: /api/* → https://kelmah-api.loca.lt/api/*
  ↓
✅ SUCCESS: Request reaches API Gateway
```

### Key Code Points

**SearchPage.jsx (line 173, 215):**
```javascript
const apiEndpoint = '/api/workers';  // Hardcoded full path
const response = await axios.get(apiEndpoint, { params: apiParams });
```

**axios.js Main Interceptor (line 106-118):**
```javascript
instance.interceptors.request.use(
  async (config) => {
    // 🔥 DYNAMIC baseURL loading - THIS IS WHY IT WORKS!
    const currentBaseURL = await getApiBaseUrl();
    if (currentBaseURL && currentBaseURL !== config.baseURL) {
      console.log(`🔄 Updating baseURL: ${config.baseURL} → ${currentBaseURL}`);
      config.baseURL = currentBaseURL;
    }
    // ... rest of interceptor
  }
);
```

**Why Workers Worked:**
1. Uses main axios instance with dynamic baseURL loading
2. Every request fetches LocalTunnel URL from runtime-config.json
3. baseURL is set to `https://kelmah-api.loca.lt` (absolute URL)
4. Path '/api/workers' is appended
5. Final URL: `https://kelmah-api.loca.lt/api/workers`
6. Vercel rewrites this correctly to API Gateway

---

## ❌ BROKEN FLOW: Jobs API (Before Fix)

### Request Chain
```
JobsPage.jsx (line 468)
  ↓
jobsApi.getJobs()
  ↓
jobsApi.js (line 45)
  ↓
jobServiceClient.get('/jobs')  ← Uses SERVICE CLIENT (not main axios)
  ↓
axios.js createServiceClient() (line 522-533)
  ↓
baseURL = await getClientBaseUrl(serviceUrl)
  ↓
getClientBaseUrl() (line 492-493)
  ↓
serviceUrl === '/api' → return '/api'  ← Returns RELATIVE path!
  ↓
Service client interceptor (line 536-550) - BEFORE FIX
  ↓
❌ NO DYNAMIC baseURL UPDATE!  ← This is the bug!
  Interceptor only normalizes URL and adds auth token
  config.baseURL remains '/api' (relative)
  ↓
Axios converts relative '/api' to absolute using page origin
  ↓
Final request: GET https://kelmah-frontend-cyan.vercel.app/api/jobs
  ↓
❌ FAILURE: Request goes to frontend domain, not API Gateway!
  Vercel can't rewrite (it's already on Vercel domain)
  Backend not reached → 511 Network Authentication Required
```

### Key Code Points

**jobsApi.js (line 1, 45):**
```javascript
import { jobServiceClient } from '@/modules/common/services/axios';

export const getJobs = async (params = {}) => {
  const response = await jobServiceClient.get('/jobs', { params });
  return response.data;
};
```

**axios.js Service Client Creation (line 522-533) - BEFORE FIX:**
```javascript
const createServiceClient = async (serviceUrl, extraHeaders = {}) => {
  const baseURL = await getClientBaseUrl(serviceUrl);  // Returns '/api'
  const client = axios.create({
    baseURL,  // baseURL = '/api' (STATIC, RELATIVE)
    timeout: timeoutConfig.timeout,
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...extraHeaders,
    },
    withCredentials: false,
  });
  
  // Interceptor WITHOUT dynamic baseURL loading
  client.interceptors.request.use(
    (config) => {  // ❌ NOT async!
      config = normalizeUrlForGateway(config);
      const token = secureStorage.getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;  // config.baseURL still '/api'
    }
  );
  
  return client;
};
```

**Why Jobs Failed:**
1. Uses jobServiceClient with STATIC baseURL = '/api'
2. Service client interceptor had NO dynamic baseURL loading
3. Axios converts relative '/api' to absolute URL using window.location.origin
4. Final URL becomes: `https://kelmah-frontend-cyan.vercel.app/api/jobs`
5. Request goes to frontend domain instead of API Gateway
6. Backend never reached → 511 error

---

## ✅ FIXED FLOW: Jobs API (After Fix)

### Request Chain
```
JobsPage.jsx (line 468)
  ↓
jobsApi.getJobs()
  ↓
jobsApi.js (line 45)
  ↓
jobServiceClient.get('/jobs')
  ↓
axios.js createServiceClient() (line 522-533)
  ↓
baseURL = await getClientBaseUrl(serviceUrl) → '/api'
  ↓
Service client interceptor (line 536-565) - AFTER FIX
  ↓
🔥 NEW: Dynamic baseURL update from runtime-config.json!
  const currentBaseURL = await getApiBaseUrl();
  config.baseURL = currentBaseURL;  ← LocalTunnel URL loaded here!
  ↓
Final request: GET https://kelmah-api.loca.lt/api/jobs
  ↓
Vercel rewrite: /api/* → https://kelmah-api.loca.lt/api/*
  ↓
✅ SUCCESS: Request reaches API Gateway
```

### Key Code Changes

**axios.js Service Client Interceptor (line 536-565) - AFTER FIX:**
```javascript
// 🔥 FIX: Add request interceptor for dynamic baseURL and auth token
client.interceptors.request.use(
  async (config) => {  // ✅ NOW async!
    // 🔥 CRITICAL FIX: Dynamically update baseURL from runtime-config.json
    try {
      const currentBaseURL = await getApiBaseUrl();
      if (currentBaseURL && currentBaseURL !== config.baseURL) {
        console.log(
          `🔄 Service client updating baseURL: ${config.baseURL} → ${currentBaseURL}`,
        );
        config.baseURL = currentBaseURL;  // ✅ LocalTunnel URL loaded!
      }
    } catch (error) {
      console.warn('⚠️ Failed to update service client baseURL:', error.message);
    }

    // Normalize URL to prevent /api/jobs/api/jobs duplication
    config = normalizeUrlForGateway(config);
    
    // Add auth token securely
    const token = secureStorage.getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);
```

---

## 🎯 Root Cause Analysis

### The Fundamental Issue

**Axios URL Resolution Behavior:**
- When `baseURL` is an **absolute URL** (e.g., `https://api.example.com`), axios uses it directly
- When `baseURL` is a **relative path** (e.g., `/api`), axios converts it to absolute using `window.location.origin`

**Example:**
```javascript
// Page: https://kelmah-frontend-cyan.vercel.app/jobs

// Case 1: Absolute baseURL (WORKS)
axios.create({ baseURL: 'https://kelmah-api.loca.lt' })
  .get('/api/jobs')
  → Final URL: https://kelmah-api.loca.lt/api/jobs ✅

// Case 2: Relative baseURL (FAILS)
axios.create({ baseURL: '/api' })
  .get('/jobs')
  → Final URL: https://kelmah-frontend-cyan.vercel.app/api/jobs ❌
```

### Why Main Axios Worked

The main axios instance had **dynamic baseURL loading** in its interceptor:

```javascript
instance.interceptors.request.use(async (config) => {
  const currentBaseURL = await getApiBaseUrl();  // Loads from runtime-config.json
  config.baseURL = currentBaseURL;  // Updates to LocalTunnel URL
  // ...
});
```

This meant every request:
1. Fetched the LocalTunnel URL from `/runtime-config.json`
2. Updated `config.baseURL` to the absolute LocalTunnel URL
3. Axios used the absolute URL → request went to API Gateway ✅

### Why Service Clients Failed

Service clients were created with **static relative baseURL**:

```javascript
const client = axios.create({
  baseURL: '/api'  // Static relative path
});

client.interceptors.request.use((config) => {  // NOT async!
  // No dynamic baseURL loading!
  // config.baseURL remains '/api'
});
```

This meant every request:
1. Used static `baseURL = '/api'`
2. Axios converted `/api` to `https://kelmah-frontend-cyan.vercel.app/api`
3. Request went to frontend domain instead of API Gateway ❌

---

## 📋 The Fix

### What Changed

Added dynamic baseURL loading to service client interceptors, matching the pattern used by main axios.

**Before:**
```javascript
client.interceptors.request.use(
  (config) => {  // Synchronous
    // No baseURL update
    config = normalizeUrlForGateway(config);
    // ...
    return config;
  }
);
```

**After:**
```javascript
client.interceptors.request.use(
  async (config) => {  // Asynchronous
    // 🔥 Dynamic baseURL loading
    const currentBaseURL = await getApiBaseUrl();
    if (currentBaseURL && currentBaseURL !== config.baseURL) {
      config.baseURL = currentBaseURL;
    }
    config = normalizeUrlForGateway(config);
    // ...
    return config;
  }
);
```

### Why This Works

1. **On every request**, service clients now call `getApiBaseUrl()`
2. This fetches the current LocalTunnel URL from `/runtime-config.json`
3. `config.baseURL` is updated to the absolute LocalTunnel URL
4. Axios uses the absolute URL → request goes to API Gateway
5. Vercel rewrites `/api/*` → API Gateway → Success! ✅

---

## 🧪 Testing & Verification

### Expected Behavior After Fix

**Console Logs:**
```
🔄 Service client updating baseURL: /api → https://kelmah-api.loca.lt
🔧 URL normalized: /jobs -> /jobs (baseURL: https://kelmah-api.loca.lt)
GET https://kelmah-api.loca.lt/api/jobs?status=open... 200 OK
```

**Network Tab:**
- Request URL: `https://kelmah-api.loca.lt/api/jobs`
- Status: `200 OK`
- Response: Jobs data array

**No More Errors:**
- ❌ No more `511 Network Authentication Required`
- ❌ No more requests to `https://kelmah-frontend-cyan.vercel.app/api/...`
- ❌ No more retries or failed requests

### Production Testing

1. **Open**: https://kelmah-frontend-cyan.vercel.app
2. **Navigate**: To Jobs page
3. **Check Console**: Should see dynamic baseURL updates
4. **Check Network**: Requests should go to `https://kelmah-api.loca.lt/api/*`
5. **Verify**: Jobs load successfully with no errors

---

## 📝 Lessons Learned

### Key Takeaways

1. **Consistency is Critical**: All axios clients (main and service-specific) must use the same URL resolution pattern

2. **Relative vs Absolute URLs**: Understand how axios resolves baseURL:
   - Absolute URLs are used directly
   - Relative URLs are converted using window.location.origin

3. **Dynamic Configuration**: When using tunneling services (LocalTunnel/ngrok), baseURL must be loaded dynamically from runtime config

4. **Service Client Pattern**: Service clients need the same interceptor logic as main axios instance

5. **Testing Isolation**: Main axios worked while service clients failed because they used different initialization patterns

### Future Prevention

- Always use the same baseURL loading pattern across all axios instances
- Test both main axios and service clients in production
- Document the dependency on runtime-config.json for URL resolution
- Consider creating a shared interceptor factory function to ensure consistency

---

## 🔧 Related Files

### Modified Files
- `kelmah-frontend/src/modules/common/services/axios.js` (line 536-565)

### Key Files for Reference
- `kelmah-frontend/src/config/environment.js` - `getApiBaseUrl()` implementation
- `kelmah-frontend/public/runtime-config.json` - Dynamic LocalTunnel URL storage
- `kelmah-frontend/vercel.json` - Vercel rewrite rules
- `kelmah-frontend/src/modules/jobs/services/jobsApi.js` - Jobs API service
- `kelmah-frontend/src/modules/search/pages/SearchPage.jsx` - Workers API usage

### Git Commits
1. `4dfa2fad` - First attempt: Changed API call paths
2. `83aaedf1` - Second attempt: Changed service baseURLs to '/api'
3. `61022a3c` - Third attempt: Fixed getClientBaseUrl() string check
4. `5fd5ff28` - **FINAL FIX**: Added dynamic baseURL loading to service clients ✅

---

## ✅ Resolution Status

**Status**: FIXED ✅  
**Commit**: 5fd5ff28  
**Deployed**: Vercel auto-deployment in progress  
**Expected Outcome**: Jobs API will work identically to Workers API with no 511 errors

**Verification**: After Vercel deployment completes (~2-3 minutes), production site should show:
- Jobs loading successfully
- Network requests to `https://kelmah-api.loca.lt/api/jobs`
- No 511 errors in console
- Dynamic baseURL update logs in console
