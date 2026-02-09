# Kelmah Ngrok Protocol Documentation

## 🔄 Dynamic URL Management System

### Overview
The Kelmah platform uses a sophisticated ngrok protocol for dynamic URL management. This system automatically handles the changing nature of ngrok URLs and ensures seamless deployment continuity.

## 🏗️ Ngrok URL Lifecycle Problem & Solution

### The Challenge
- **ngrok URLs Change**: Every time ngrok is restarted, new URLs are generated
- **Deployment Dependencies**: Frontend deployment on Vercel depends on backend URL configuration
- **Manual Updates Required**: Without automation, developers must manually update multiple configuration files

### The Automated Solution
Kelmah implements an **intelligent auto-update system** that:
1. **Detects URL Changes**: Automatically identifies when ngrok generates new URLs
2. **Updates Configuration**: Modifies all dependent configuration files
3. **Commits & Pushes**: Automatically commits changes to trigger Vercel deployment
4. **Zero Manual Intervention**: No manual configuration updates required

## 📋 Ngrok Manager Architecture

### Core Components

#### 1. NgrokManager Class (`ngrok-manager.js`)
```javascript
class NgrokManager {
  // Manages dual tunnel setup
  async start() {
    const apiUrl = await ngrok.connect(5000);    // API Gateway tunnel
    const wsUrl = await ngrok.connect(5005);     // WebSocket tunnel
    
    await this.updateFrontendConfig(apiUrl, wsUrl);
    await this.commitAndPush(apiUrl);
  }
}
```

#### 2. Dual Tunnel Configuration
```
API Gateway Tunnel (Port 5000)
├── Handles all HTTP API requests
├── Routes to /api/* endpoints
└── Primary URL for frontend communication

WebSocket Tunnel (Port 5005)  
├── Handles real-time Socket.IO connections
├── Routes to /socket.io/* endpoints
└── Dedicated WebSocket communication
```

#### 3. Automatic Configuration Updates

**Files Automatically Updated:**
- `vercel.json` - Deployment rewrites configuration
- `kelmah-frontend/public/runtime-config.json` - Runtime configuration
- `ngrok-config.json` - Ngrok state tracking
- `kelmah-frontend/src/config/securityConfig.js` - Security headers

## 🔧 Auto-Update Process Flow

### 1. Ngrok Restart Detection
```bash
node start-ngrok.js  # Initiates the protocol
```

### 2. URL Generation & Capture
```javascript
// Dual tunnel creation
const apiUrl = await ngrok.connect(5000);    // https://abc123.ngrok-free.app
const wsUrl = await ngrok.connect(5005);     // https://def456.ngrok-free.app
```

### 3. Configuration File Updates
```javascript
// vercel.json - Vercel deployment routing
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://abc123.ngrok-free.app/api/$1" },
    { "source": "/socket.io/(.*)", "destination": "https://def456.ngrok-free.app/socket.io/$1" }
  ]
}

// runtime-config.json - Frontend runtime configuration
{
  "ngrokUrl": "https://abc123.ngrok-free.app",
  "websocketUrl": "wss://def456.ngrok-free.app",
  "timestamp": "2025-09-12T10:30:45.123Z",
  "isDevelopment": true
}
```

### 4. Automatic Git Operations
```javascript
async commitAndPush(url) {
  // Stage only modified configuration files
  execSync(`git add vercel.json runtime-config.json ngrok-config.json securityConfig.js`);
  
  // Commit with descriptive message
  execSync(`git commit -m "chore(frontend): update ngrok URLs and runtime config"`);
  
  // Push to trigger Vercel deployment
  execSync('git push origin main');
}
```

### 5. Vercel Deployment Trigger
- Git push triggers automatic Vercel deployment
- New configuration files are deployed
- Frontend now points to updated ngrok URLs
- Zero downtime transition

## 🎯 Benefits of the Ngrok Protocol

### For Development
- **No Manual Updates**: Developers don't need to remember to update configuration files
- **Instant Deployment**: Configuration changes trigger immediate deployment
- **Error Prevention**: Eliminates human error in URL updates
- **Consistent Environment**: All environments automatically stay synchronized

### For Production Readiness
- **Seamless Transitions**: No service interruptions during ngrok restarts
- **Automated DevOps**: Reduces manual deployment steps
- **Configuration Consistency**: All files stay synchronized automatically
- **Deployment Reliability**: Automatic git operations ensure deployment triggers

## 🔍 Current Implementation Status

### ✅ Working Components
- **Dual Tunnel Setup**: API Gateway (5000) + WebSocket (5005) tunnels active
- **Automatic Configuration**: All config files updated on restart
- **Git Integration**: Auto-commit and push functionality working
- **Vercel Integration**: Deployment triggers working correctly
- **Runtime Configuration**: Dynamic URL resolution implemented

### 🔄 Active URLs (Current Session)
```
API Gateway: https://298fb9b8181e.ngrok-free.app
WebSocket:   https://e74c110076f4.ngrok-free.app
Last Update: 2025-09-11T14:05:22.694Z
```

## 🚨 Important Protocol Rules

### 1. Never Hardcode Ngrok URLs
```javascript
// ❌ Wrong - Hardcoded URL
const apiUrl = 'https://abc123.ngrok-free.app';

// ✅ Correct - Dynamic resolution
const config = await fetch('/runtime-config.json');
const apiUrl = config.ngrokUrl;
```

### 2. Always Use the Protocol for Updates
```bash
# ❌ Wrong - Manual ngrok start
ngrok http 5000

# ✅ Correct - Use the protocol
node start-ngrok.js
```

### 3. Trust the Automatic Updates
- Don't manually edit `vercel.json` rewrites
- Don't manually update `runtime-config.json`
- Let the protocol handle all URL changes

### 4. Verify After Updates
```bash
# Check current URLs
curl -s -H "ngrok-skip-browser-warning: true" "$(jq -r .ngrokUrl kelmah-frontend/public/runtime-config.json)/api/health"
```

## 🔧 Integration with Current Messaging Fixes

### WebSocket URL Resolution ✅ Compatible
Our messaging system fixes use `/socket.io` relative URLs, which work perfectly with the ngrok protocol:

```javascript
// Frontend WebSocket connection (Fixed)
const wsUrl = '/socket.io';  // Routes via Vercel rewrites to ngrok WebSocket URL
```

### API Endpoint Resolution ✅ Compatible
All API endpoints use `/api/*` relative URLs that route through the protocol:

```javascript
// Frontend API calls (Fixed)
const response = await apiClient.get('/api/messages/conversations/${id}/messages');
// Routes via Vercel rewrites to: https://[ngrok-api-url]/api/messages/conversations/${id}/messages
```

### Configuration Loading ✅ Compatible
Runtime configuration loading works with dynamic URLs:

```javascript
// Runtime config loading (Compatible)
const config = window.__RUNTIME_CONFIG__ || await fetch('/runtime-config.json');
// Always gets current ngrok URLs
```

## 📈 Protocol Advantages for Messaging System

### 1. Automatic URL Updates
When ngrok restarts, messaging endpoints automatically update without code changes

### 2. WebSocket Continuity  
WebSocket connections automatically reconnect to new URLs after protocol updates

### 3. Zero Configuration Drift
No manual URL updates means no configuration mismatches between services

### 4. Deployment Automation
Messaging system changes deploy automatically when ngrok URLs update

---

## ✅ Protocol Verification Commands

```bash
# Start the protocol
node start-ngrok.js

# Verify API Gateway
curl -s -H "ngrok-skip-browser-warning: true" "$(jq -r .ngrokUrl kelmah-frontend/public/runtime-config.json)/api/health"

# Verify WebSocket tunnel  
curl -s -H "ngrok-skip-browser-warning: true" "$(jq -r .websocketUrl kelmah-frontend/public/runtime-config.json | sed 's/wss:/https:/')/health"

# Check Vercel configuration
cat vercel.json | jq .rewrites
```

**The Ngrok Protocol ensures that all messaging system fixes work seamlessly with dynamic URL changes, providing a robust foundation for development and deployment.**