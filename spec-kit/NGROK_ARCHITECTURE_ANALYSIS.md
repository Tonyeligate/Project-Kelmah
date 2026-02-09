# Ngrok Protocol & API Gateway Architecture Analysis

## Current Architecture Flow

### 1. Request Flow Path
```
Frontend (Vercel) → ngrok tunnel → API Gateway (localhost:5000) → Microservices (localhost:500X)
```

### 2. Ngrok Tunnel Configuration
- **API Gateway Tunnel**: `https://298fb9b8181e.ngrok-free.app` → `localhost:5000`
- **WebSocket Tunnel**: `https://e74c110076f4.ngrok-free.app` → `localhost:3005` (messaging service direct)

### 3. API Gateway Service Registry
```javascript
const services = {
  auth: 'http://localhost:5001',
  user: 'http://localhost:5002', 
  job: 'http://localhost:5003',
  payment: 'http://localhost:5004',
  messaging: 'http://localhost:5005',
  review: 'http://localhost:5006'
};
```

## Issues Identified

### ❌ WebSocket Tunnel Misconfiguration
**Problem**: NgrokManager creates separate WebSocket tunnel to port 3005, but messaging service runs on port 5005
```javascript
// ngrok-manager.js line 28
const wsUrl = await ngrok.connect(3005); // WRONG PORT!
```
**Should be**: Port 5005 to match messaging service

### ❌ Service Health Check Results
- **Auth Service**: ✅ Working (localhost:5001)
- **User Service**: ✅ Working (localhost:5002)
- **Job Service**: ❌ 404 error (localhost:5003)
- **Payment Service**: ❌ Empty error (localhost:5004)
- **Messaging Service**: ❌ Empty error (localhost:5005)
- **Review Service**: ❌ Empty error (localhost:5006)

### ❌ Port Inconsistencies
Multiple port references for messaging service:
- `.env`: `MESSAGING_SERVICE_URL=http://localhost:5005` ✅
- `ngrok-manager.js`: Creates tunnel for port 3005 ❌
- `websocketService.js`: Fallback to `localhost:3003` ❌

## Required Fixes

### 1. Fix WebSocket Tunnel Port
```javascript
// In ngrok-manager.js
const wsUrl = await ngrok.connect(5005); // Fix: Use correct messaging service port
```

### 2. Verify All Services Are Running
Services should be started on their designated ports:
```bash
# Check which services are actually running
netstat -an | findstr "5001 5002 5003 5004 5005 5006"
```

### 3. Update WebSocket Service Fallback
```javascript
// In websocketService.js
const wsUrl = process.env.NODE_ENV === 'production' 
  ? '/socket.io' 
  : 'http://localhost:5005'; // Fix: Use correct port
```

## Ngrok Protocol Compatibility

### ✅ HTTP Requests
- Ngrok tunnels HTTP/HTTPS correctly to API Gateway
- API Gateway proxies to localhost microservices work
- Authentication flow: Frontend → ngrok → Gateway → Auth Service ✅

### ❌ WebSocket Connections
- Current: Separate tunnel to wrong port (3005)
- Should: Either tunnel messaging service port (5005) OR proxy through gateway

### Recommended Architecture

#### Option 1: Single Tunnel (Recommended)
```
Frontend → ngrok(5000) → API Gateway → WebSocket proxy → Messaging Service(5005)
```

#### Option 2: Dual Tunnel (Current, but needs port fix)
```
Frontend HTTP → ngrok(5000) → API Gateway → Services
Frontend WebSocket → ngrok(5005) → Messaging Service
```

## Implementation Plan

1. **Fix ngrok-manager.js**: Change WebSocket tunnel to port 5005
2. **Verify Services**: Ensure all microservices are running on correct ports
3. **Update Frontend**: Fix WebSocket fallback URL
4. **Test Flow**: Verify end-to-end messaging works
5. **Update Config**: Regenerate ngrok URLs and push to Vercel

This will ensure all requests properly flow through the API Gateway architecture while maintaining ngrok tunnel compatibility.