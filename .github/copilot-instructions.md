---
alwaysApply: true
---
# Kelmah Platform - AI Coding Agent Instructions

## Architecture Overview

Kelmah is a **freelance marketplace** with a **microservices backend** and **modular React frontend**. The system uses an **API Gateway pattern** with service-specific microservices, all routing through a central gateway for the frontend.

### Backend: Remote Microservices Architecture ⚠️ UPDATED
- **API Gateway** (`kelmah-backend/api-gateway/`) - Central routing hub on **remote server** port 5000
- **Services** (`kelmah-backend/services/`): auth, user, job, payment, messaging, review
- **Tech Stack**: Express.js, MongoDB/Mongoose, Socket.IO, JWT auth, Winston logging
- **Key Pattern**: Each service has `server.js`, `routes/`, `controllers/`, `models/`, `services/`
- **⚠️ CRITICAL**: All microservices run on **remote server**, NOT localhost
- **Development Access**: Via ngrok tunnels to remote server ports 5001-5006

### Frontend: Domain-Driven Modules
- **Modular Structure** (`kelmah-frontend/src/modules/`): auth, jobs, dashboard, worker, hirer, etc.
- **Tech Stack**: React 18, Vite, Redux Toolkit, Material-UI, React Query, Socket.IO client
- **Key Pattern**: Each module has `components/`, `pages/`, `services/`, `contexts/`, `hooks/`

## Critical Development Workflows

### Remote Server Architecture ⚠️ UPDATED
```
Local Development Machine:
├── Frontend development (Vite dev server)
├── ngrok tunnel management  
├── Configuration files
└── Testing/debugging scripts

Remote Production Server:
├── API Gateway (port 5000)
├── Auth Service (port 5001) ✅ Running
├── User Service (port 5002) ✅ Running  
├── Job Service (port 5003) ❌ Needs restart
├── Payment Service (port 5004) ❌ Needs restart
├── Messaging Service (port 5005) ❌ Needs restart
└── Review Service (port 5006) ❌ Needs restart
```

### Backend Development
```bash
# ⚠️ IMPORTANT: Services run on REMOTE SERVER, not locally
# These commands are for REFERENCE ONLY - run on remote server

# Start all services (REMOTE SERVER ONLY)
npm run dev  # from kelmah-backend/

# Start individual services (REMOTE SERVER ONLY) 
npm run start:gateway  # API Gateway on :5000
npm run start:auth     # Auth service on :5001
npm run start:messaging # Messaging service on :5005 (Socket.IO)

# Testing and debugging (can run locally)
npm test              # Run all tests
npm run test:coverage # Run tests with coverage
node test-*.js        # Run specific debug scripts
```

**⚠️ CRITICAL: Server restart/shutdown operations must be performed only by the project owner.**
**⚠️ ARCHITECTURE: All backend services run on remote server, accessed via ngrok tunnels.**

### Frontend Development
```bash
# Development server (from kelmah-frontend/)
npm run dev  # Vite dev server on :3000

# Build for production
npm run build  # Creates build/ directory
```

### Service Communication
- **Frontend → API Gateway**: All API calls go through `/api/*` routes via ngrok tunnel
- **Gateway → Services**: Proxy routing with service registry pattern to remote services
- **Real-time**: Socket.IO client connects to remote messaging service via gateway proxy
- **Ngrok Tunnels**: 
  - API Gateway: `https://298fb9b8181e.ngrok-free.app` → remote port 5000
  - WebSocket: `https://e74c110076f4.ngrok-free.app` → remote port 5005

### Ngrok URL Management Protocol ⚠️ DYNAMIC URLS
- **URL Regeneration**: Ngrok URLs change every time ngrok is restarted
- **Automatic Update System**: `start-ngrok.js` automatically updates configuration files
- **Auto-Push Protocol**: System commits and pushes URL changes to trigger Vercel deployment
- **Files Auto-Updated**: 
  - `kelmah-frontend/src/config/runtime-config.json`
  - `vercel.json` rewrites configuration
- **Deployment Trigger**: Changes auto-deploy to Vercel for immediate availability
- **Usage**: Run `node start-ngrok.js` to regenerate URLs and auto-update all configs

## Key Configuration Patterns

### Environment Management
- **Frontend**: `src/config/environment.js` - Centralized config with service URL detection
- **Backend**: Each service has its own `.env` with shared patterns
- **Production**: Uses ngrok tunneling for external API access (see `vercel.json` rewrites)

### Service Registry (API Gateway)
```javascript
// From api-gateway/server.js
const SERVICES = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:5001',
  user: process.env.USER_SERVICE_URL || 'http://localhost:5002'
  // ... other services
};
```

### Frontend API Configuration
```javascript
// Centralized axios in src/modules/common/services/axios.js
// Auto-detects environment and routes via gateway in production
const baseURL = await getApiBaseUrl(); // '/api' in production, service URLs in dev
```

## Domain-Specific Patterns

### Frontend Module Structure
```
src/modules/[domain]/
├── components/        # Domain-specific React components
│   └── common/       # Shared within module
├── pages/            # Route-level components
├── services/         # API calls, Redux slices
├── contexts/         # React Context providers
├── hooks/            # Custom React hooks
└── utils/            # Domain utilities
```

### Backend Service Structure  
```
services/[service-name]/
├── server.js         # Express app entry point
├── routes/           # Route definitions
├── controllers/      # Request handlers  
├── models/           # Mongoose schemas
├── services/         # Business logic
├── middleware/       # Service-specific middleware
└── utils/           # Utilities, logging, validation
```

### Import Path Conventions
- **Frontend**: Use `@/modules/[domain]/...` for absolute imports
- **Module imports**: `import { Component } from '@/modules/common/components/Component'`
- **Backend**: Relative imports within services, shared utilities in `../../shared/`

## State Management Patterns

### Redux Store Structure (Frontend)
- **Modular slices**: Each domain has its own slice in `modules/[domain]/services/`
- **Global store**: `src/store/index.js` combines all domain slices
- **Async actions**: Use Redux Toolkit's `createAsyncThunk` pattern

### Authentication Flow
1. **Login**: Frontend → Gateway `/api/auth/login` → Auth Service
2. **JWT Storage**: Uses `secureStorage` utility (localStorage/sessionStorage)
3. **Axios Interceptors**: Auto-attach tokens, handle refresh logic
4. **Socket.IO Auth**: Token passed via connection auth

## Deployment & Infrastructure

### Production Setup
- **Frontend**: Deployed on Vercel with API rewrites to backend
- **Backend**: Services run on containers/EC2 with internal load balancing
- **Database**: MongoDB clusters per service
- **Real-time**: Socket.IO with Redis adapter for scaling

### Key Files for Deployment
- `kelmah-frontend/vercel.json` - Frontend deployment config with API rewrites
- `kelmah-backend/api-gateway/server.js` - Service registry and routing
- `.env` files - Service-specific environment variables

### Development Debugging
- **Health Checks**: All services expose `/health`, `/health/ready`, `/health/live` endpoints
- **Logging**: Winston logger with structured JSON output
- **Service Status**: Use `src/utils/serviceHealthCheck.js` for frontend service monitoring
- **Testing**: Jest-based testing with coverage thresholds (90% critical, 70% non-critical)
- **Debug Scripts**: Use dedicated scripts for service testing (`test-*.js` files in root)

## Common Gotchas

1. **Import Paths**: After refactoring, use new modular paths (`@/modules/[domain]/...`)
2. **Service URLs**: Frontend detects environment and routes through gateway in production
3. **CORS**: API Gateway handles CORS for all services
4. **Socket.IO**: Connects through gateway proxy, not directly to messaging service
5. **Rate Limiting**: Configured at API Gateway level, affects all services

## Error Investigation & Fix Protocol

### Systematic Error Investigation Process
1. **Error Analysis**: List ALL files involved in test/error reports - no guesswork, read all files completely
2. **Root Cause Location**: Read listed files thoroughly to locate exact error lines in code
3. **Cross-Reference Scanning**: Scan related files to confirm actual error cause
4. **Flow Validation**: Confirm complete file process flow and logic before proposing fixes
5. **Solution Verification**: Validate fix accuracy by scanning ALL files in the process flow

### Critical Investigation Rules
- **Always read files**: For accuracy, read all files related to the subject matter
- **No assumptions**: Base solutions on actual code analysis, not assumptions
- **Complete flow understanding**: Trace entire process flow before implementing fixes
- **Proactive Testing**: Execute diagnostic commands yourself using terminal tools - do not ask user to run tests
- **Self-Verification**: Perform your own health checks, endpoint tests, and status verification

## AI Agent Operational Rules (Augmented)

### Strict Investigation Protocol (MANDATORY)
1. List all files involved in the Test/Error report. No guesswork; read all of them fully.
2. Read the listed files and identify the exact lines/areas causing the issue.
3. Scan related files to confirm the true root cause and interactions.
4. Confirm the end-to-end flow and logic before proposing or implementing a fix.
5. Confirm the fix precisely addresses the root cause by re-scanning all involved files and re-running verification.

### Agent Diagnostics Policy
- Agents MUST perform diagnostics themselves (terminal/web requests) and must NOT ask the user to run commands.
- Use the current ngrok host to access remote services; servers are not hosted on this machine.
- Always test via the API Gateway (`/api/*`) and include `ngrok-skip-browser-warning: true` where needed.
- Use provided credentials for auth flows:
  - Gifty password: `1122112Ga`
  - All other users: `TestUser123!`
- Database reference for investigations when needed:
  - `MONGODB_URI=mongodb+srv://TonyGate:0553366244Aj@kelmah-messaging.xyqcurn.mongodb.net/kelmah_platform?retryWrites=true&w=majority&appName=Kelmah-messaging`

### Deployment/Verification Checklist for Backend Route Issues
- Ensure route specificity order is correct (e.g., `/:id` goes LAST so it doesn't shadow specific routes like `/my-jobs`).
- After code changes, restart/redeploy the specific microservice that the API Gateway/ngrok targets.
- Verify via curl:
  - Login to get token at `/api/auth/login`
  - Call protected endpoints (e.g., `/api/jobs/my-jobs`) with `Authorization: Bearer <token>`
- If 404/503 persists through the Gateway, compare local routes vs deployed instance and inspect service logs for auth/role middleware and route mounting issues.

### Backend Deployment Mismatch Diagnosis

**503 Service Unavailable Pattern:**
1. **Gateway Status**: Check if API Gateway is responding (usually is)
2. **Service Mismatch**: Local code fixed, but deployed service behind ngrok/proxy still has old code
3. **Route Existence**: Verify endpoint exists in deployed service vs local version
4. **Deployment Status**: Check if service needs restart/redeploy with latest code

**Diagnosis Steps:**
```bash
# 1. Check Gateway health (via ngrok)
curl https://298fb9b8181e.ngrok-free.app/health -H "ngrok-skip-browser-warning: true"

# 2. Check specific service health via gateway
curl https://298fb9b8181e.ngrok-free.app/api/health/aggregate -H "ngrok-skip-browser-warning: true"

# 3. Test problematic endpoint via gateway
curl https://298fb9b8181e.ngrok-free.app/api/[endpoint-path] -H "ngrok-skip-browser-warning: true"

# 4. Compare local vs deployed routes
# Local: check kelmah-backend/services/[service]/routes/
# Remote: test actual service behavior via ngrok
```

**⚠️ DIAGNOSTIC TESTING PROTOCOL: AI agents should PERFORM diagnostic tests themselves using terminal commands, not ask the user to run them. Use run_in_terminal or terminal-tools to execute verification commands directly.**

**Resolution Protocol:**
1. **Identify Mismatch**: Compare local route definitions vs deployed service behavior
2. **Code Verification**: Confirm local code has the fix  
3. **Perform Tests**: Execute diagnostic commands yourself to verify service status
4. **Deployment Request**: Request service restart/redeploy from project owner only if tests confirm mismatch
5. **Wait for Deployment**: Do not attempt service operations - owner handles deployment
5. **Verify Fix**: Test endpoint after redeployment

## User Experience & Accessibility Guidelines

### Target User Considerations
- **Primary Users**: Vocational workers (carpenters, masons, plumbers, electricians, etc.)
- **Accessibility**: Many users may be illiterate or have limited formal education
- **Design Principle**: Make interfaces intuitive, simple, and easy to use

### Professional UI/UX Standards
- **Responsive Design**: Ensure all components work across devices
- **Functional Components**: Every clickable element must be properly functional
- **Professional Appearance**: Maintain clean, professional visual design
- **Navigation Flow**: Verify smooth navigation between pages and sections

### Development Quality Assurance
- **Component Functionality**: Test all interactive elements work as intended
- **Responsive Testing**: Verify responsiveness across different screen sizes
- **Deep Scanning**: Thoroughly scan all files involved in each area of the codebase
- **Flow Validation**: Check navigation and user flow patterns work correctly

## Frontend Enhancement Protocol

## Spec-Kit Documentation System ⚠️ NEW REQUIREMENT

### Mandatory Spec-Kit Usage
All AI agents MUST use the `spec-kit/` directory for comprehensive project documentation and status tracking.

### Spec-Kit Structure
```
spec-kit/
├── STATUS_LOG.md              # Completed fixes and their status
├── MESSAGING_SYSTEM_AUDIT.md  # Complete messaging architecture audit
├── NGROK_ARCHITECTURE_ANALYSIS.md # Ngrok protocol and routing analysis  
├── NGROK_FIXES_COMPLETE.md    # Summary of all ngrok-related fixes
├── REMOTE_SERVER_ARCHITECTURE.md # Updated architecture documentation
└── [issue-specific].md        # Individual problem analysis and fixes
```

### Required Spec-Kit Workflows
1. **Status Logging**: Document all completed fixes in `STATUS_LOG.md`
2. **Architecture Updates**: Create comprehensive analysis documents for major architectural discoveries
3. **Fix Summaries**: Create complete fix documentation with before/after states
4. **Issue Tracking**: Create dedicated documents for complex debugging sessions
5. **Reference Material**: Use spec-kit documents as authoritative source for system understanding
6. **Current State Tracking**: Always update spec-kit with current project status and ongoing work

### Spec-Kit Documentation Standards
- **Comprehensive Analysis**: Include complete problem analysis, root cause identification, and solution details
- **Executable Examples**: Include working curl commands, code snippets, and configuration examples
- **Status Tracking**: Mark items as COMPLETED ✅, IN-PROGRESS 🔄, or PENDING ❌
- **Cross-References**: Link related spec-kit documents and reference external dependencies
- **Validation Steps**: Include verification commands and expected outputs
- **Current State Documentation**: Always document what you're working on and current project status
- **Progress Updates**: Update relevant spec-kit documents with progress on ongoing tasks

### Critical Spec-Kit Documents for Reference
- **Remote Architecture**: `REMOTE_SERVER_ARCHITECTURE.md` - Authoritative source for deployment understanding
- **Ngrok Protocol**: `NGROK_FIXES_COMPLETE.md` - Complete tunnel configuration and fixes
- **System Status**: `STATUS_LOG.md` - Track of all completed system improvements
- **Messaging Audit**: `MESSAGING_SYSTEM_AUDIT.md` - Complete frontend/backend communication analysis

### Continuous Spec-Kit Updates Required
- **Before Starting Work**: Update STATUS_LOG.md with current task status
- **During Development**: Document discoveries and interim findings
- **After Completion**: Mark tasks as completed with verification details
- **System Changes**: Update architecture documents when system understanding changes

**⚠️ MANDATORY: Always check and update relevant spec-kit documents when working on system issues.**

### Module Protection
- **Preserve Structure**: Do NOT modify anything in `@/modules` directory
- **Extension Focus**: Improve other frontend areas that need enhancement

### Continuous Improvement Process
1. **Professional Standards**: Make pages look professional and ensure functionality
2. **Component Verification**: Scan and verify all page components work correctly
3. **Knowledge-Based Decisions**: Reference project documentation for informed decisions
4. **Visual Enhancement**: Improve visual display of pages and components
5. **Navigation Testing**: Check flow between different pages works correctly

### File Management Protocol
- **Deep Search Required**: Before deleting files, perform thorough search to confirm they're unused
- **Documentation Reference**: Use project knowledge from documentation for decision-making
- **Professional Standards**: Apply professional judgment based on project purpose

## Project Context & Purpose

### Platform Mission
Kelmah connects vocational job seekers (carpenters, masons, plumbers, electricians, etc.) with potential hirers through:
- Efficient job matching and worker discovery
- Seamless communication between parties
- Modern, responsive design for easy access
- Revolutionary approach to vocational job hiring

### Core Features
- User authentication (workers/hirers)
- Job listing and application system  
- Advanced worker search and filtering
- Real-time messaging system
- Review and rating system
- Contract and payment management
- Map-based navigation and location services