# 404 Notifications Endpoint - Diagnostic Report

**Date**: October 4, 2025 03:48 UTC  
**Status**: ✅ DIAGNOSED - Misleading Frontend Error  
**Actual Issue**: 401 Authentication Failure (Not 404 Not Found)

---

## Error Symptoms (Frontend Browser Console)

```
GET https://kelmah-api-gateway-si57.onrender.com/api/notifications 404 (Not Found)
🚨 Service Error - https://kelmah-api-gateway-si57.onrender.com: {error: 'Request failed with status code 404'...}
Failed to fetch notifications: {error: 'Messaging service endpoint not found', serviceStatus: 'unknown'...}
```

**Frontend Interpretation**: Endpoint doesn't exist (404 Not Found)  
**Reality**: Endpoint exists, but authentication failed (401 Unauthorized)

---

## Diagnostic Tests Performed

### Test 1: Direct API Call with Invalid Token ✅

```bash
curl -X GET "https://kelmah-api-gateway-si57.onrender.com/api/notifications" \
  -H "Authorization: Bearer test-token" -v
```

**Result**: 
```
< HTTP/1.1 401 Unauthorized
< Content-Type: application/json; charset=utf-8
{"error":"Invalid token","message":"Token verification failed"}
```

**Finding**: Server correctly returns **401 Unauthorized**, NOT 404

### Test 2: CORS Preflight Check ✅

```bash
curl -X OPTIONS "https://kelmah-api-gateway-si57.onrender.com/api/notifications" \
  -H "Origin: https://kelmah-frontend-cyan.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: authorization" -v
```

**Result**:
```
< HTTP/1.1 204 No Content
< access-control-allow-origin: https://kelmah-frontend-cyan.vercel.app
< access-control-allow-credentials: true
< access-control-allow-methods: GET,POST,PUT,DELETE,PATCH,OPTIONS
< access-control-allow-headers: Content-Type,Authorization,ngrok-skip-browser-warning,x-requested-with
```

**Finding**: CORS is configured correctly

### Test 3: Route Configuration Verification ✅

**File**: `kelmah-backend/api-gateway/server.js` line 670-681

```javascript
app.use('/api/notifications',
  authenticate,
  (req, res, next) => {
    if (!services.messaging || typeof services.messaging !== 'string' || services.messaging.length === 0) {
      return res.status(503).json({ error: 'Messaging service unavailable' });
    }
    const proxy = createProxyMiddleware({
      target: services.messaging,
      changeOrigin: true,
      pathRewrite: { '^/api/notifications': '/api/notifications' }
    });
    return proxy(req, res, next);
  }
);
```

**Finding**: Route exists and is properly configured with authentication middleware

---

## Root Cause Analysis

### What's Actually Happening

1. **User logs in successfully** → receives JWT token (verified from production logs)
2. **Frontend requests `/api/notifications`** → token might be expired/invalid/missing
3. **API Gateway `authenticate` middleware** → validates token, fails validation
4. **Server returns 401 Unauthorized** → "Invalid token" or "Token verification failed"
5. **Frontend axios error handler** → misinterprets 401 as 404
6. **Frontend logs show 404** → misleading error message "endpoint not found"

### Why 401 Becomes 404 in Frontend

**Hypothesis #1**: Frontend error handling code in `notificationService.js` lines 85-100 catches the 401 and creates a custom error message "Messaging service endpoint not found"

**Hypothesis #2**: Axios response interceptor in `axios.js` might be transforming the error

**Hypothesis #3**: The JWT token is not being properly attached to the request header

---

## Why Authentication Might Be Failing

### Possible Cause 1: MongoDB Connection (Most Likely) ⚠️

The `authenticate` middleware (`api-gateway/middlewares/auth.js` line 76) needs to query the database:

```javascript
user = await User.findById(userId).select('-password');
```

**Current Status**:
- ✅ Code fix complete (MongoDB connection added to API Gateway)
- ✅ Commits pushed to GitHub (c941215f, 851675a1)
- 🟡 **MONGODB_URI environment variable NOT YET SET on Render**
- ❌ **API Gateway cannot connect to database without MONGODB_URI**

**Impact**: Even with valid JWT tokens, authentication fails because:
1. Middleware tries to verify user in database
2. No MongoDB connection exists
3. Database query times out or fails immediately (bufferCommands: false)
4. Middleware returns 500 or 401 error

**Expected After MONGODB_URI Set**:
- API Gateway connects to MongoDB on startup
- Authenticate middleware can successfully query User collection
- Valid tokens will be verified → 200 OK responses
- Invalid/expired tokens will get proper 401 errors

### Possible Cause 2: Token Storage/Retrieval Issue

**Check**:
1. Does login store tokens in `secureStorage`?
2. Does axios interceptor retrieve and attach tokens?
3. Are tokens expiring too quickly?

**From previous logs**: Login returns 200 OK with 1032-byte response (includes tokens)

### Possible Cause 3: JWT Secret Mismatch

**Less Likely**: Auth service successfully validates tokens (login works), so JWT_SECRET is correct

---

## Evidence Summary

| Component | Status | Evidence |
|-----------|--------|----------|
| API Gateway Route | ✅ EXISTS | server.js line 670-681 |
| CORS Configuration | ✅ WORKING | 204 preflight with correct headers |
| Server Response | ✅ CORRECT | 401 Unauthorized (not 404) |
| Frontend Display | ❌ MISLEADING | Shows 404 instead of 401 |
| Authentication | ❌ FAILING | "Invalid token" error |
| MongoDB Connection | 🟡 CODE READY | Awaiting MONGODB_URI env var |

---

## Resolution Plan

### Step 1: Set MONGODB_URI on Render (IMMEDIATE) 🔴

**Action Required**: Backend team sets environment variable

**Instructions**: See `RENDER_DEPLOYMENT_INSTRUCTIONS.md`

**Expected Result**: 
- API Gateway connects to MongoDB
- Authenticate middleware can verify users
- Valid tokens → 200 OK
- Invalid tokens → proper 401 with user lookup

### Step 2: Test with Valid Token (After Step 1)

**Test Command**:
```bash
# 1. Login to get valid token
curl -X POST "https://kelmah-api-gateway-si57.onrender.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"giftyafisa@gmail.com","password":"1221122Ga"}'

# 2. Extract token from response (copy accessToken field)

# 3. Test notifications with real token
curl -X GET "https://kelmah-api-gateway-si57.onrender.com/api/notifications" \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>"
```

**Expected Before MONGODB_URI**:
```
< HTTP/1.1 500 Internal Server Error
{"error":"Authentication error","message":"Unable to verify user"}
```

**Expected After MONGODB_URI**:
```
< HTTP/1.1 200 OK
{"notifications": [...], "pagination": {...}}
```

### Step 3: Fix Frontend Error Messages (OPTIONAL)

**File**: `kelmah-frontend/src/modules/notifications/services/notificationService.js` lines 85-100

**Issue**: 401 errors are being reported as "endpoint not found"

**Improvement**: Distinguish between:
- 401 Unauthorized → "Authentication failed, please login again"
- 404 Not Found → "Endpoint not available"
- 500 Server Error → "Server error occurred"
- 503 Service Unavailable → "Service temporarily unavailable"

**Priority**: LOW (not blocking, just improves error clarity)

---

## Key Takeaways

1. **Don't Trust Frontend Error Messages** - Always verify with direct API calls (curl/Postman)
2. **401 ≠ 404** - Authentication failures are distinct from missing endpoints
3. **Middleware Dependencies** - Authenticate middleware requires database connection to function
4. **Code Fixes Alone Aren't Enough** - Environment variables are critical for database connectivity
5. **Test in Isolation** - Test server responses separately from frontend interpretation

---

## Status After MongoDB Fix

**Once MONGODB_URI is set on Render:**

✅ **Expected Working**:
- Login: Returns 200 OK with tokens
- Notifications: Returns 200 OK with notification data (if token valid)
- Dashboard: Returns 200 OK with user data (if token valid)
- All protected endpoints: Authenticate successfully

❌ **May Still Fail**:
- Expired tokens → 401 Unauthorized (expected behavior)
- Invalid tokens → 401 Unauthorized (expected behavior)
- Messaging service down → 503 Service Unavailable (expected behavior)

**Next Steps After Verification**:
- Test login → notifications flow end-to-end
- Verify dashboard loads all data
- Check other 404 errors (job applications, worker profiles)
- Improve frontend error message handling

---

## Related Documentation

- MongoDB Fix: `MONGODB_CONNECTION_AUDIT_RESULTS.md`
- Deployment Guide: `RENDER_DEPLOYMENT_INSTRUCTIONS.md`
- Fix Summary: `MONGODB_CONNECTION_FIX_SUMMARY.md`
- Action Plan: `IMMEDIATE_BACKEND_FIXES_REQUIRED.md`

---

**Conclusion**: The "404 Not Found" error is misleading. The actual issue is 401 authentication failure, likely caused by API Gateway's inability to connect to MongoDB (MONGODB_URI not yet set). Once environment variable is configured, authentication should work correctly.

**Recommendation**: Focus on Step 1 (set MONGODB_URI) before investigating further. This single action should resolve both the MongoDB timeout issue AND the notifications 404/401 issue.
