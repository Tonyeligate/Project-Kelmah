---
applyTo: "**"
---
# Kelmah Platform — Project Guidelines

**Last Updated**: March 11, 2026

## What Is Kelmah

A vocational freelance marketplace connecting workers (carpenters, masons, plumbers, electricians) with hirers. Ghana-focused, accessibility-first — many users have limited formal education, so interfaces must be intuitive and simple.

## Architecture

Microservices backend with modular React frontend, unified through an API Gateway.

| Layer | Stack | Key Directory |
|-------|-------|---------------|
| Frontend | React 18, Vite, Redux Toolkit, MUI v5 | `kelmah-frontend/src/modules/` |
| Gateway | Express, JWT auth, proxy routing | `kelmah-backend/api-gateway/` |
| Services | Express, Mongoose, Winston | `kelmah-backend/services/` |
| Shared | Mongoose models, middleware, utils | `kelmah-backend/shared/` |
| Database | MongoDB Atlas (`kelmah_platform`) | 100% Mongoose — zero SQL |
| Real-time | Socket.IO via gateway proxy | `services/messaging-service/` |

### Service Ports

| Service | Port |
|---------|------|
| API Gateway | 5000 |
| Auth | 5001 |
| User | 5002 |
| Job | 5003 |
| Payment | 5004 |
| Messaging | 5005 |
| Review | 5006 |

## Sacred Rules

1. **Models via index only**: `const { User, Job } = require('../models')` — never import individual model files directly
2. **No cross-service imports**: shared code lives in `kelmah-backend/shared/`
3. **MongoDB only**: zero SQL or Sequelize anywhere
4. **Gateway handles auth**: services trust `verifyGatewayRequest` — never re-validate JWT in services
5. **Route ordering**: literal paths before `:id` params — always
6. **Frontend imports**: use `@/modules/[domain]/...` aliases
7. **Response envelope**: `{ success, data, error }` on every endpoint

## Development Commands

```bash
# Frontend
cd kelmah-frontend && npm run dev          # Vite on localhost:3000
cd kelmah-frontend && npm run build        # Production build

# Backend (individual services)
node start-api-gateway.js                  # Gateway on localhost:5000
node start-auth-service.js                 # Auth on localhost:5001
node start-user-service.js                 # etc.

# Tests
npx jest --runTestsByPath services/[svc]/tests/[file].js --runInBand
npm run test:backend                       # All backend tests
npm run test:critical                      # Auth + payment + email only

# Debugging
node test-auth-and-notifications.js        # Full auth flow test
node create-gifty-user.js                  # Provision test user
```

## Deployment

- **Frontend**: Vercel — auto-deploys on push to main (~1-2 min)
- **Backend**: Render — auto-deploys on push to main (~2-3 min)
- **Tunnel**: LocalTunnel via `node start-localtunnel-fixed.js` (URL changes on restart, auto-updates configs)
- Never ask users to deploy manually — pushes trigger auto-deployment

## Test Credentials

| Account | Email | Password | Role |
|---------|-------|----------|------|
| Gifty | giftyafisa@gmail.com | `Vx7!Rk2#Lm9@Qa4` | hirer |
| Others | \*@kelmah.test | `TestUser123!` | varies |

## Agent Operating Rules

- **Investigate first**: read every file in the flow before editing — see `investigation.instructions.md`
- **Run diagnostics yourself**: never ask the user to execute curl/test commands
- **Test via gateway**: all API testing goes through `/api/*` routes
- **Update spec-kit**: log work in `spec-kit/STATUS_LOG.md` before, during, and after
- **No file deletion without proof**: search thoroughly to confirm a file is unused before removing

## File-Specific Instructions

Detailed patterns are in `.github/instructions/`:

| File | Loaded When |
|------|-------------|
| `backend.instructions.md` | Editing `kelmah-backend/**` |
| `frontend.instructions.md` | Editing `kelmah-frontend/**` |
| `api-design.instructions.md` | Designing or debugging REST endpoints |
| `investigation.instructions.md` | Investigating bugs or auditing features |
| `testing.instructions.md` | Writing or running `*.test.js` files |

## Key Reference Docs

- Architecture: `spec-kit/REMOTE_SERVER_ARCHITECTURE.md`
- Tunnel protocol: `spec-kit/LOCALTUNNEL_PROTOCOL_DOCUMENTATION.md`
- Status log: `spec-kit/STATUS_LOG.md`
- Messaging audit: `spec-kit/MESSAGING_SYSTEM_AUDIT_COMPLETE.md`