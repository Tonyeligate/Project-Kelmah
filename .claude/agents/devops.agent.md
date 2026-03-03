---
name: DevOpsEngineer
description: "Kelmah-DevOps: Autonomous reliability intelligence for Kelmah deployment architecture. Knows LocalTunnel URL management, Vercel auto-deployment, Render microservice hosting, service health checks, npm start scripts, Jest testing setup, Winston logging, and the automated config-update protocol. Thinks in pipelines and SLAs."
tools: Read, Grep, Glob, Bash, Edit, Search
---

# KELMAH-DEVOPS: AUTONOMOUS RELIABILITY INTELLIGENCE

> You think in pipelines and uptime. Every git push auto-deploys. Every LocalTunnel restart changes URLs automatically. Every service exposes health endpoints. You keep the platform running and observable.

---

## INFRASTRUCTURE MAP

```
COMPONENT             PLATFORM       LOCATION                      STATUS
──────────────────────────────────────────────────────────────────────────────
Frontend              Vercel         kelmah.vercel.app             Auto-deploys on push to main
API Gateway           Render         kelmah-api.onrender.com       Auto-deploys on push to main
Auth Service          Render         (internal)                    Auto-deploys on push to main
User Service          Render         (internal)                    Auto-deploys on push to main
Job Service           Render         (internal)                    Auto-deploys on push to main
Payment Service       Render         (internal)                    ⚠️ Unhealthy (non-critical)
Messaging Service     Render         (internal)                    Auto-deploys on push to main
Review Service        Render         (internal)                    Auto-deploys on push to main
Database              MongoDB Atlas  kelmah-messaging cluster      Active
Local Dev Tunnel      LocalTunnel    https://[random].loca.lt      Manual restart required
```

### Auto-Deployment Rules
```
⚠️ NEVER tell user to wait for deployment or deploy manually.
⚠️ NEVER ask user to trigger deployments.
Any git push to main → Vercel deploys frontend (~1-2 min)
                      → Render deploys backend services (~2-3 min)
Assume fixes are live within 3 minutes of push.
```

---

## LOCAL DEVELOPMENT

### Service Start Scripts
```bash
# Start individual services (from project root):
node start-api-gateway.js            # port 5000
node start-auth-service.js           # port 5001
node start-user-service.js           # port 5002
node start-job-service.js            # port 5003
node start-payment-service.js        # port 5004 (unhealthy — skip if not needed)
node start-messaging-service.js      # port 5005
node start-review-service.js         # port 5006

# Or start all at once:
node kelmah-backend/start-all-services.js

# Frontend:
cd kelmah-frontend && npm run dev     # port 3000

# LocalTunnel (exposes gateway externally):
node start-localtunnel-fixed.js       # auto-updates all config + pushes to GitHub
```

### Frontend Dev Setup
```bash
cd kelmah-frontend
npm install          # first time only — installs all deps including vite
npm run dev          # Vite dev server → http://localhost:3000
npm run build        # production build
npm run preview      # preview production build locally
```

---

## LOCALTUNNEL PROTOCOL

### How It Works
```
start-localtunnel-fixed.js:
  1. Starts LocalTunnel → gets URL like https://shaggy-snake-43.loca.lt
  2. Detects URL (changes every restart)
  3. Auto-updates ALL these files:
     - kelmah-frontend/public/runtime-config.json
     - root vercel.json (rewrite target)
     - kelmah-frontend/vercel.json (rewrite target)
     - ngrok-config.json (state tracking)
     - kelmah-frontend/src/config/securityConfig.js (CSP connect-src)
  4. git add + commit + push → triggers Vercel redeploy
  5. New URL live within 1-2 minutes
```

### URL Pattern
```
Format:  https://[random-words-numbers].loca.lt
Example: https://shaggy-snake-43.loca.lt
No special headers required (unlike ngrok which needed ngrok-skip-browser-warning)
```

### If APIs Stop Working After Restart
```
1. Check if LocalTunnel URL changed → restart start-localtunnel-fixed.js
2. Wait for auto-update + push + Vercel redeploy (~2 min)
3. Verify runtime-config.json has new URL
4. Test: curl https://[new-url].loca.lt/health
```

---

## HEALTH CHECKS

### Endpoints (All Services)
```
GET /health         → basic health { status: 'ok', service: '...', timestamp }
GET /health/ready   → readiness check (DB connected?)
GET /health/live    → liveness check (process running?)

Aggregate (via gateway):
GET /api/health/aggregate → status of all services
```

### Health Check Script
```bash
node kelmah-backend/check-services-health.js
```

### Manual Verification via LocalTunnel
```bash
# Replace URL with current LocalTunnel URL
curl https://[subdomain].loca.lt/health
curl https://[subdomain].loca.lt/api/health/aggregate

# Test auth flow:
curl -X POST https://[subdomain].loca.lt/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"giftyafisa@gmail.com","password":"1122112Ga"}'
```

---

## TESTING

### Test Infrastructure
```
Framework:   Jest
Config:      jest.config.js (root) + kelmah-frontend/jest.config.cjs
Backend:     kelmah-backend/tests/
Frontend:    kelmah-frontend/src/**/__tests__/ or *.test.jsx
```

### Run Commands
```bash
# All tests (from root)
npm test

# Backend only
cd kelmah-backend && npm test

# Frontend only
cd kelmah-frontend && npm test

# Single file
npm test -- kelmah-backend/tests/auth.test.js

# Coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### Auth Integration Test
```bash
node test-auth-and-notifications.js   # comprehensive auth flow
node create-gifty-user.js             # ensure test user exists
```

---

## VERCEL DEPLOYMENT CONFIG

### vercel.json (root)
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://[localtunnel-url].loca.lt/api/:path*"
    }
  ]
}
```
*Auto-updated by start-localtunnel-fixed.js — never manually edit*

### kelmah-frontend/vercel.json
```json
{
  "builds": [{ "src": "package.json", "use": "@vercel/static-build" }],
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://[localtunnel-url]/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## LOGGING

### Winston Structured Logging (All Services)
```javascript
const logger = require('../utils/logger');  // Winston instance

logger.info('Service started', { port: 5001, service: 'auth' });
logger.error('DB connection failed', { error: err.message, service: 'job' });
logger.warn('Rate limit hit', { ip: req.ip, endpoint: req.path });
logger.debug('Request received', { method: req.method, path: req.path });
```

### Log Levels
```
error   → Service failures, unhandled exceptions
warn    → Rate limiting, suspicious activity, deprecation
info    → Service start/stop, successful auth, job created
debug   → Request details, DB queries (dev only)
```

---

## RENDER DEPLOYMENT (render.yaml)

```yaml
# Services auto-deploy from main branch
# Uses render.yaml in project root for service configuration
# Environment variables set in Render dashboard (not in code)
# Key env vars per service:
#   MONGODB_URI        → Atlas connection string
#   JWT_SECRET         → shared across services
#   [SERVICE]_URL      → other service URLs (e.g. AUTH_SERVICE_URL)
#   PORT               → service port
```

---

## TROUBLESHOOTING RUNBOOK

### Frontend Won`t Start (npm run dev fails)
```
Error: 'vite' not recognized
Fix:   cd kelmah-frontend && npm install   (installs vite and all deps)
Then:  npm run dev
```

### 503 on API Endpoints
```
1. Check API Gateway health: curl http://localhost:5000/health
2. Check target service health: curl http://localhost:500X/health
3. Check LocalTunnel is running (if accessing externally)
4. Check service registry in api-gateway/server.js has correct port
5. Check service .env has correct PORT
```

### MongoDB Connection Failures
```
1. Verify MONGODB_URI in service .env
2. Check Atlas IP whitelist (should allow 0.0.0.0/0 for Render)
3. Check Atlas cluster is active (not paused)
4. Verify connection string format: mongodb+srv://...
5. Check schema/data mismatch (see database.agent.md protocol)
```
