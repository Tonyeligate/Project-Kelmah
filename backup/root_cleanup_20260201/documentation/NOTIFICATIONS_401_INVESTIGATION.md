# Notifications 401 Error - Investigation Summary

## Current Status: 401 Unauthorized ❌
**Date**: October 7, 2025 03:26 UTC
**Latest Deploy**: 9b39b544 (status: "live", finished: 2025-10-07T03:25:25Z)

## Error Details
```
GET /api/notifications
Response: 401 Unauthorized
Body: {"error":"Authentication required","message":"No token provided"}
```

## Root Cause Analysis

### The Problem
The messaging service's `verifyGatewayRequest` middleware expects:
- `x-authenticated-user` header (JSON-encoded user object)
- `x-auth-source: api-gateway` header

But these headers are NOT reaching the messaging service.

### Why Headers Aren't Being Forwarded

**http-proxy-middleware behavior:**
- Creates a NEW HTTP request to the target service
- Does NOT automatically copy custom headers from original request
- Only copies standard headers (Host, User-Agent, etc.)

**Our current code:**
```javascript
// In authenticate middleware (middlewares/auth.js line 105)
req.headers['x-authenticated-user'] = JSON.stringify(req.user);
req.headers['x-auth-source'] = 'api-gateway';

// In proxy configuration (server.js line 695)
onProxyReq: (proxyReq, req) => {
  if (req.user) {
    proxyReq.setHeader('x-authenticated-user', JSON.stringify(req.user));
    proxyReq.setHeader('x-auth-source', 'api-gateway');
  }
  
  // Attempt to preserve headers (ADDED IN COMMIT 9b39b544)
  if (req.headers['x-authenticated-user']) {
    proxyReq.setHeader('x-authenticated-user', req.headers['x-authenticated-user']);
  }
  if (req.headers['x-auth-source']) {
    proxyReq.setHeader('x-auth-source', req.headers['x-auth-source']);
  }
}
```

**The Flow:**
1. Request comes to Gateway with `Authorization: Bearer <token>`
2. `authenticate` middleware validates token and creates `req.user`
3. `authenticate` also sets `req.headers['x-authenticated-user']` (line 105 auth.js)
4. Request reaches `notificationsProxy`
5. `onProxyReq` runs and should copy headers to outgoing request
6. But header copying might not be working correctly

### Possible Issues

1. **Header Already Set**: The authenticate middleware already sets `req.headers['x-authenticated-user']`, so we might be overwriting it or duplicating it incorrectly

2. **http-proxy-middleware Version**: Some versions of http-proxy-middleware have issues with header forwarding

3. **Header Case Sensitivity**: HTTP headers are case-insensitive, but JavaScript object keys are case-sensitive. `req.headers['x-authenticated-user']` vs `proxyReq.setHeader('x-authenticated-user')`

4. **Middleware Order**: If `authenticate` modifies `req.headers` AFTER the proxy starts setting up the proxyReq, headers won't be copied

## Testing Evidence

### Direct Messaging Service Test (WORKS ✅)
```bash
curl -i "https://kelmah-messaging-service-rjot.onrender.com/api/notifications" \
  -H "x-authenticated-user: {\"id\":\"6891595768c3cdade00f564f\"}" \
  -H "x-auth-source: api-gateway"
  
Result: 200 OK (with PowerShell JSON formatting issues, but service responds)
```

### Through Gateway Test (FAILS ❌)
```bash
curl -i "https://kelmah-api-gateway-5loa.onrender.com/api/notifications" \
  -H "Authorization: Bearer <token>"
  
Result: 401 Unauthorized
Error: {"error":"Authentication required","message":"No token provided"}
```

This proves:
- ✅ Messaging service `/api/notifications` endpoint exists and works
- ✅ Messaging service's `verifyGatewayRequest` middleware works correctly
- ❌ Headers are NOT being forwarded from Gateway to Messaging Service
- ✅ Gateway can reach Messaging Service (no more 502 errors)

## Code References

### Gateway Authentication Middleware
**File**: `kelmah-backend/api-gateway/middlewares/auth.js`
**Lines**: 90-105
```javascript
// Populate request with user info for downstream services
req.user = {
  id: user._id || user.id,
  email: user.email,
  role: user.role,
  // ... other fields
};

// Add authentication headers for service-to-service communication
req.headers['x-authenticated-user'] = JSON.stringify(req.user);
req.headers['x-auth-source'] = 'api-gateway';
```

### Gateway Notifications Proxy
**File**: `kelmah-backend/api-gateway/server.js`
**Lines**: 689-710
```javascript
const notificationsProxy = createProxyMiddleware({
  target: process.env.MESSAGING_SERVICE_CLOUD_URL || 'http://localhost:5005',
  changeOrigin: true,
  pathRewrite: { '^/api/notifications': '/api/notifications' },
  onProxyReq: (proxyReq, req) => {
    if (req.user) {
      proxyReq.setHeader('x-authenticated-user', JSON.stringify(req.user));
      proxyReq.setHeader('x-auth-source', 'api-gateway');
    }
    
    // Attempt to preserve headers from authenticate middleware
    if (req.headers['x-authenticated-user']) {
      proxyReq.setHeader('x-authenticated-user', req.headers['x-authenticated-user']);
    }
    if (req.headers['x-auth-source']) {
      proxyReq.setHeader('x-auth-source', req.headers['x-auth-source']);
    }
  },
  logLevel: 'debug'
});

app.use('/api/notifications', authenticate, notificationsProxy);
```

### Messaging Service Gateway Verification
**File**: `kelmah-backend/shared/middlewares/serviceTrust.js`
**Lines**: 11-60
```javascript
const verifyGatewayRequest = (req, res, next) => {
  const gatewayAuth = req.headers['x-authenticated-user'];
  const authSource = req.headers['x-auth-source'];
  
  // Allow requests from API Gateway with authenticated user info
  if (gatewayAuth && authSource === 'api-gateway') {
    try {
      req.user = JSON.parse(gatewayAuth);
      req.isGatewayAuthenticated = true;
      return next();
    } catch (error) {
      return res.status(400).json({ 
        error: 'Invalid gateway authentication',
        message: 'Malformed user information' 
      });
    }
  }
  
  // ... legacy header support and internal key checks
  
  // If none of the authentication methods work, deny access
  return res.status(401).json({ 
    error: 'Authentication required',
    message: 'No token provided'
  });
};
```

## Next Steps to Fix

### Option 1: Simplify - Remove Duplicate Logic
Since `authenticate` middleware already sets `req.headers`, we should remove the `onProxyReq` duplication and use a different approach to ensure header forwarding.

```javascript
const notificationsProxy = createProxyMiddleware({
  target: process.env.MESSAGING_SERVICE_CLOUD_URL || 'http://localhost:5005',
  changeOrigin: true,
  pathRewrite: { '^/api/notifications': '/api/notifications' },
  // Option: Use headers property to explicitly forward
  headers: {
    'x-auth-source': 'api-gateway'
  },
  onProxyReq: (proxyReq, req) => {
    // Only set user header if it exists
    if (req.headers['x-authenticated-user']) {
      proxyReq.setHeader('x-authenticated-user', req.headers['x-authenticated-user']);
    }
  },
  logLevel: 'debug'
});
```

### Option 2: Debug - Add Logging
Add console.log statements to see what's actually happening:

```javascript
onProxyReq: (proxyReq, req) => {
  console.log('[DEBUG] Original req.headers:', req.headers);
  console.log('[DEBUG] req.user:', req.user);
  console.log('[DEBUG] Setting proxy headers...');
  
  if (req.user) {
    const userHeader = JSON.stringify(req.user);
    console.log('[DEBUG] x-authenticated-user value:', userHeader);
    proxyReq.setHeader('x-authenticated-user', userHeader);
    proxyReq.setHeader('x-auth-source', 'api-gateway');
  }
  
  console.log('[DEBUG] Proxy headers set:', proxyReq.getHeaders());
}
```

### Option 3: Alternative Approach - Manual Proxy
Instead of using http-proxy-middleware, manually fetch from messaging service:

```javascript
app.get('/api/notifications', authenticate, async (req, res) => {
  try {
    const response = await axios.get(
      `${process.env.MESSAGING_SERVICE_CLOUD_URL}/api/notifications`,
      {
        headers: {
          'x-authenticated-user': JSON.stringify(req.user),
          'x-auth-source': 'api-gateway'
        },
        params: req.query
      }
    );
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Proxy failed' });
  }
});
```

## Render Free Tier Considerations

The initial 502 errors were due to **Render free tier service "spin down"** after inactivity:
- Services sleep after 15 minutes of no activity
- First request wakes service (takes 30-60 seconds)
- During wake-up, requests get 502 Bad Gateway
- Once awake, requests work normally

**Current state**: Services are awake (both Gateway and Messaging responding to /health)

## Deployment Information

**Latest Commits:**
1. `3dd9c85a` - Static proxy instance (deployed, working - solved 502)
2. `9b39b544` - Explicit header preservation (deployed, not solving 401)

**Render Services:**
- API Gateway: `srv-d3hjv0buibrs73avs5rg` (kelmah-api-gateway-5loa) - **LIVE**
- Messaging: `srv-d3hk9615pdvs73fbauj0` (kelmah-messaging-service-rjot) - **LIVE**

**Environment Variables (Gateway):**
- `MESSAGING_SERVICE_CLOUD_URL`: `https://kelmah-messaging-service-rjot.onrender.com` ✅

## Recommendation

**Immediate action**: Add debug logging to see what headers are actually being sent by the proxy. This will confirm whether the issue is:
1. Headers not being set in onProxyReq
2. Headers being set but not forwarded by http-proxy-middleware
3. Headers being forwarded but messaging service not receiving them
4. Some other middleware/proxy issue

Once we see the actual headers being sent, we can determine the correct fix.
