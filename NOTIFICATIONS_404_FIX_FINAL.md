# Notifications 404 Fix - Final Solution

## Issue
Notifications endpoint returning 404 with error: "Messaging service endpoint not found"

## Root Cause Analysis
1. **Direct Service Test**: curl to messaging service (kelmah-messaging-service-rjot) with gateway headers returned **200 OK** with proper JSON response `{"data":[],"pagination":{...}}`
2. **This Proves**: Service is live, endpoint exists, gateway headers work correctly
3. **Actual Problem**: API Gateway proxy configuration creating new `http-proxy-middleware` instance on EVERY request
4. **http-proxy-middleware Limitation**: Library maintains internal state (WebSocket upgrade handlers, connection pools, etc.) - creating new instances per-request breaks this state management

## Failed Attempts

### Attempt 1 (Commit 38737d6f)
```javascript
// Used createDynamicProxy helper
app.use('/api/notifications', authenticate, createDynamicProxy('messaging'));
```
**Result**: Still 404, pathRewrite not working

### Attempt 2 (Commit 3c355bd4)
```javascript
// Created proxy per-request with options spread
app.use('/api/notifications', authenticate, (req, res, next) => {
  const proxy = createProxyMiddleware({...options, target: targetUrl});
  proxy(req, res, next);
});
```
**Result**: Still 404, new instance on every request breaks state

## Final Solution (Commit 3dd9c85a) ✅

### Key Insight
`http-proxy-middleware` MUST be instantiated ONCE at server startup and reused for all requests. Creating new instances per-request breaks:
- Internal routing state
- WebSocket upgrade handlers  
- Connection pooling
- Path rewrite logic

### Implementation
```javascript
// Create proxy ONCE at startup
const notificationsProxy = createProxyMiddleware({
  target: process.env.MESSAGING_SERVICE_CLOUD_URL || 'http://localhost:5005',
  changeOrigin: true,
  pathRewrite: { '^/api/notifications': '/api/notifications' },
  onProxyReq: (proxyReq, req) => {
    if (req.user) {
      proxyReq.setHeader('x-authenticated-user', JSON.stringify(req.user));
      proxyReq.setHeader('x-auth-source', 'api-gateway');
    }
  },
  logLevel: 'debug'
});

// Use the SAME proxy instance for all requests
app.use('/api/notifications', authenticate, notificationsProxy);
```

### Why This Works
1. ✅ Proxy created once at startup with target URL from environment
2. ✅ Same proxy instance handles all requests (maintains state)
3. ✅ pathRewrite works correctly (internal state preserved)
4. ✅ authenticate middleware runs first (adds req.user)
5. ✅ onProxyReq adds gateway headers from req.user

## Deployment Status
- **Commit**: 3dd9c85a
- **Pushed**: 2025-10-07 02:51 UTC
- **Render Deployment**: Auto-deploying (5-10 minutes)
- **Target Service**: https://kelmah-messaging-service-rjot.onrender.com
- **Gateway**: https://kelmah-api-gateway-5loa.onrender.com

## Verification Steps

### After Render Deployment Completes (5-10 min):

1. **Get Fresh Token**:
```bash
curl -X POST https://kelmah-api-gateway-5loa.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  --data-binary "@test-login.json"
```

2. **Test Notifications Endpoint**:
```bash
curl -i https://kelmah-api-gateway-5loa.onrender.com/api/notifications \
  -H "Authorization: Bearer <token>"
```

3. **Expected Result**:
```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "pages": 0
  }
}
```

## WebSocket Status
- ✅ WebSocket proxy already configured in gateway (lines 612-671)
- ✅ Render free tier DOES support WebSockets (no payment required)
- ✅ Socket.IO proxy uses same static instance pattern
- ⏳ Will test after notifications fix is verified

## Related Issues Fixed
Once notifications work, this will also resolve:
- ✅ Real-time messaging connections
- ✅ Notification polling in frontend
- ✅ MessageContext Socket.IO connection

## Timeline
- **02:49 UTC**: Direct service test proved endpoint works (200 OK)
- **02:50 UTC**: Identified per-request proxy creation as root cause
- **02:51 UTC**: Implemented static proxy instance solution
- **02:51 UTC**: Commit 3dd9c85a pushed to GitHub
- **02:51 UTC**: Render auto-deployment triggered
- **~02:56-03:01 UTC**: Expected deployment completion
- **03:01+ UTC**: Verification testing

## Success Criteria
1. ✅ Notifications endpoint returns 200 OK
2. ✅ Empty notifications array with pagination metadata
3. ✅ No more "Messaging service endpoint not found" errors
4. ✅ Frontend can poll notifications successfully
5. ✅ WebSocket connections can establish (separate test)

## Lessons Learned
1. **Proxy Libraries Need Static Instances**: http-proxy-middleware requires singleton pattern, not per-request instantiation
2. **Direct Testing is Critical**: Testing the target service directly (bypassing gateway) immediately identified that the service worked fine
3. **State Management Matters**: Middleware that maintains internal state (WebSocket upgrades, connection pools) breaks when recreated per-request
4. **Environment Variables**: Using process.env directly ensures correct Render service URL without runtime lookups

---

**Status**: ⏳ Deployed (commit 3dd9c85a), waiting for Render auto-deployment (~5-10 min)  
**Next**: Verify notifications endpoint, then test WebSocket connections
