# Double-Faced Backend URL Logic - EXPLAINED
**Date**: October 7, 2025  
**Issue**: Frontend calling wrong backend URL (LocalTunnel instead of Render)  
**Status**: ✅ FIXED - Pushed to trigger Vercel deployment

## 🎭 The Double-Faced Logic

The Kelmah frontend is designed to work with **BOTH** LocalTunnel (development) **AND** Render (production) through a smart URL detection system.

### 📍 Location of Logic
**File**: `kelmah-frontend/src/config/environment.js`  
**Function**: `computeApiBase()` (lines 39-80)  
**Config File**: `kelmah-frontend/public/runtime-config.json`

## 🔄 How It Works

### Step 1: Load Runtime Config
```javascript
const loadRuntimeConfig = async () => {
  try {
    const response = await fetch('/runtime-config.json');
    runtimeConfig = await response.json();
    console.log('🔧 Runtime config loaded:', runtimeConfig);
  } catch (error) {
    console.warn('⚠️ Failed to load runtime config:', error.message);
  }
  return runtimeConfig;
};
```

### Step 2: Extract Backend URL (Supports Both!)
```javascript
const config = await loadRuntimeConfig();
const localtunnelUrl = config?.localtunnelUrl || config?.ngrokUrl; 
// ☝️ DOUBLE-FACED: Checks for BOTH keys!
```

**Supported Keys**:
- `localtunnelUrl` - Primary key for LocalTunnel
- `ngrokUrl` - Backward compatibility (legacy) & also used for Render URL
- `API_URL` - Fallback option

### Step 3: Environment Detection

#### For Vercel Deployments (Production Frontend)
```javascript
if (isVercel) {
  console.log('🔗 Vercel deployment detected, using URL from runtime config');
  if (localtunnelUrl) {
    return localtunnelUrl; // Returns Render or LocalTunnel URL
  }
  console.warn('⚠️ No URL in runtime config, falling back to /api');
  return '/api';
}
```

#### For Production Builds
```javascript
if (isProduction) {
  if (localtunnelUrl) {
    return localtunnelUrl; // Returns Render or LocalTunnel URL
  }
  console.warn('⚠️ No URL in runtime config, falling back to /api');
  return '/api';
}
```

#### For Development (Local)
```javascript
if (envUrl) {
  return envUrl; // Uses VITE_API_URL from .env
}
return '/api'; // Triggers Vite proxy
```

## 📝 Runtime Config Structure

### For Render Deployment (Production)
```json
{
  "ngrokUrl": "https://kelmah-api-gateway-5loa.onrender.com",
  "websocketUrl": "wss://kelmah-api-gateway-5loa.onrender.com",
  "API_URL": "https://kelmah-api-gateway-5loa.onrender.com",
  "WS_URL": "https://kelmah-api-gateway-5loa.onrender.com",
  "NODE_ENV": "production",
  "TUNNEL_TYPE": "render",
  "isDevelopment": false
}
```

### For LocalTunnel Deployment (Development/Testing)
```json
{
  "ngrokUrl": "https://kelmah-api.loca.lt",
  "websocketUrl": "wss://kelmah-api.loca.lt",
  "API_URL": "https://kelmah-api.loca.lt",
  "WS_URL": "https://kelmah-api.loca.lt",
  "NODE_ENV": "production",
  "TUNNEL_TYPE": "localtunnel",
  "isDevelopment": true
}
```

## 🐛 The Bug That Was Fixed

### Problem
**Frontend was calling**: `https://kelmah-api.loca.lt` (dead LocalTunnel URL)  
**Should be calling**: `https://kelmah-api-gateway-5loa.onrender.com` (Render gateway)

### Root Cause
The `runtime-config.json` file was still pointing to the old LocalTunnel URL from development. When the frontend loaded this config, it correctly used the double-faced logic to extract the URL, but got the wrong (outdated) URL.

### Errors Caused
1. **CORS Errors**: 
   ```
   Access to XMLHttpRequest at 'https://kelmah-api.loca.lt/api/health' 
   from origin 'https://kelmah-frontend-cyan.vercel.app' 
   has been blocked by CORS policy
   ```

2. **Network Failures**:
   ```
   GET https://kelmah-api.loca.lt/api/health net::ERR_FAILED
   ```

3. **Service Warmup Failures**:
   ```
   🔥 Service warmup failed - /api/jobs: Network Error
   🔥 Service warmup failed - /api/users: Network Error
   🔥 Service warmup complete: 0/7 services responding
   ```

### The Fix
Updated `runtime-config.json` to point to Render gateway:
```diff
- "ngrokUrl": "https://kelmah-api.loca.lt",
+ "ngrokUrl": "https://kelmah-api-gateway-5loa.onrender.com",
```

## 🎯 Key Takeaways

### 1. The System is Already Double-Faced! ✅
- The code **already** supports both LocalTunnel and Render
- No code changes needed to switch between them
- Just update `runtime-config.json`

### 2. How to Switch Backends
**To use Render (Production)**:
```bash
# Update runtime-config.json with Render URL
git add kelmah-frontend/public/runtime-config.json
git commit -m "Switch to Render backend"
git push origin main
# Vercel auto-deploys with new config
```

**To use LocalTunnel (Development/Testing)**:
```bash
# Update runtime-config.json with LocalTunnel URL
git add kelmah-frontend/public/runtime-config.json
git commit -m "Switch to LocalTunnel backend"
git push origin main
# Vercel auto-deploys with new config
```

### 3. Fallback Behavior
If `runtime-config.json` fails to load or has no URL:
- Frontend uses `/api` (relative path)
- Triggers Vercel rewrites (if configured)
- Falls back to Vite proxy (in development)

### 4. The Config is Loaded Dynamically
- Frontend fetches `/runtime-config.json` on startup
- No rebuild needed to change backend URL
- Just update the file and redeploy

## 🔍 Debugging Tips

### Check Which URL is Being Used
```javascript
// In browser console:
fetch('/runtime-config.json')
  .then(r => r.json())
  .then(config => console.log('Backend URL:', config.ngrokUrl || config.API_URL));
```

### Check Environment Detection
```javascript
// In browser console:
console.log('Is Vercel:', window.location.hostname.includes('vercel.app'));
console.log('Is Production:', import.meta.env.PROD);
console.log('Is HTTPS:', window.location.protocol === 'https:');
```

### Check API Base URL
```javascript
// In browser console (async):
import { getApiBaseUrl } from './config/environment';
getApiBaseUrl().then(url => console.log('API Base URL:', url));
```

## ✅ Current Status

**Commit**: 2a901ac0  
**Action**: Pushed to main → Vercel deploying  
**ETA**: ~2-3 minutes for Vercel to rebuild and deploy  
**Verification**: 
1. Wait for Vercel deployment to complete
2. Clear browser cache
3. Reload https://kelmah-frontend-cyan.vercel.app
4. Check console - should see Render URL being used
5. Verify no more CORS errors
6. Service warmup should succeed

## 📚 Related Files

- **Config Logic**: `kelmah-frontend/src/config/environment.js`
- **Runtime Config**: `kelmah-frontend/public/runtime-config.json`
- **Vercel Rewrites**: `kelmah-frontend/vercel.json`
- **WebSocket Config**: `kelmah-frontend/src/services/websocketService.js`
- **Message Context**: `kelmah-frontend/src/modules/messaging/contexts/MessageContext.jsx`

---

**The double-faced logic works! The bug was just an outdated URL in the config file.** 🎉
