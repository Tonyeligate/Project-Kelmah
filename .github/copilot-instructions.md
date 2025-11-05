---
alwaysApply: true
---
# Kelmah Platform - AI Coding Agent Instructions

**Last Updated**: September 21, 2025  
**Architecture Status**: FULLY CONSOLIDATED ✅  
**Critical Backend Fixes**: COMPLETED September 2025

## Architecture Overview

Kelmah is a **freelance marketplace** with a **fully consolidated microservices backend** and **modular React frontend**. The system uses an **API Gateway pattern** with service-specific microservices, all routing through a central gateway for the frontend.

### 🏆 Architectural Consolidation Status (September 2025)
- ✅ **Database Standardization**: 100% MongoDB/Mongoose across ALL services
- ✅ **Shared Models**: Centralized models in `kelmah-backend/shared/models/`
- ✅ **Authentication**: API Gateway-based centralized authentication with service trust
- ✅ **Service Boundaries**: Clean microservice separation with no cross-service dependencies
- ✅ **Component Library**: Ghana-inspired design system with reusable UI components
- ✅ **Legacy Cleanup**: All orphaned code and architectural remnants removed

### Backend: Local Microservices Architecture ⚠️ FULLY CONSOLIDATED SEPTEMBER 2025
- **API Gateway** (`kelmah-backend/api-gateway/`) - Central routing hub on **localhost** port 5000
- **Services** (`kelmah-backend/services/`): auth, user, job, payment, messaging, review
- **Tech Stack**: Express.js, **PURE MongoDB/Mongoose**, Socket.IO, JWT auth, Winston logging
- **Key Pattern**: Each service has `server.js`, `routes/`, `controllers/`, `models/`, `services/`
- **Shared Resources**: `kelmah-backend/shared/` contains models, middleware, and utilities
- **Model Architecture**: All services use shared models via `require('../../../shared/models')`
- **Authentication**: Centralized at API Gateway with service trust middleware
- **⚠️ ARCHITECTURE UPDATE**: All microservices run on **localhost** during development
- **External Access**: Via LocalTunnel (replaced ngrok) to localhost ports 5000-5006

### Frontend: Domain-Driven Modules
- **Modular Structure** (`kelmah-frontend/src/modules/`): auth, jobs, dashboard, worker, hirer, etc.
- **Tech Stack**: React 18, Vite, Redux Toolkit, Material-UI, React Query, Socket.IO client
- **Key Pattern**: Each module has `components/`, `pages/`, `services/`, `contexts/`, `hooks/`

## Critical Architectural Patterns ⚠️ MANDATORY COMPLIANCE

### Model Usage Patterns ✅ COMPLETED SEPTEMBER 2025
- **ALWAYS USE**: `const { User, Job, Application } = require('../models')` for shared models
- **NEVER USE**: `const User = require('../models/User')` (bypasses consolidation)
- **Pattern**: All controllers must import from service's `models/index.js`
- **Location**: Shared models centralized in `kelmah-backend/shared/models/`
- **Verification**: All services use shared models via service model index

### Database Patterns ✅ COMPLETED SEPTEMBER 2025
- **ONLY MongoDB/Mongoose**: Zero SQL or Sequelize code permitted
- **NEVER MIX**: No mixed database code in controllers
- **Pattern**: Pure `Model.findById()`, `Model.create()`, etc.
- **Configuration**: Database configs are MongoDB-only
- **Verification**: 100% MongoDB standardization achieved

### Service Boundary Patterns ✅ COMPLETED SEPTEMBER 2025
- **Shared Resources**: Use `require('../../shared/middlewares/rateLimiter')`
- **NEVER Cross-Service**: No `require('../../auth-service/middlewares/...')`
- **Pattern**: All shared utilities in `kelmah-backend/shared/`
- **Architecture**: Clean microservice boundaries with no violations
- **Verification**: All cross-service imports eliminated

### Import Path Conventions ✅ VERIFIED
- **Frontend**: Use `@/modules/[domain]/...` for absolute imports
- **Backend Models**: `const { Model } = require('../models')` (service index)
- **Backend Shared**: `require('../../shared/[type]/[utility]')` pattern
- **Verification**: Consistent import patterns across all services

## Critical Development Workflows

### Local Development Architecture ⚠️ UPDATED 2025-09-16
```
Local Development Machine:
├── Frontend development (Vite dev server)
├── Backend microservices (all localhost)
│   ├── API Gateway (port 5000) ✅ Running
│   ├── Auth Service (port 5001) ✅ Running  
│   ├── User Service (port 5002) ✅ Running
│   ├── Job Service (port 5003) ✅ Running
│   ├── Payment Service (port 5004) ❌ Unhealthy (non-critical)
│   ├── Messaging Service (port 5005) ✅ Running
│   └── Review Service (port 5006) ✅ Running
├── LocalTunnel management (replaced ngrok)
└── Testing/debugging scripts
```

### Backend Development ⚠️ UPDATED
```bash
# All services run LOCALLY now - start with provided scripts
node start-api-gateway.js     # API Gateway on localhost:5000
node start-auth-service.js    # Auth service on localhost:5001  
node start-user-service.js    # User service on localhost:5002
node start-job-service.js     # Job service on localhost:5003
node start-messaging-service.js # Messaging service on localhost:5005

# Testing and debugging scripts
node test-auth-and-notifications.js  # Comprehensive auth testing
node create-gifty-user.js           # User setup for testing
```

### Frontend Development
```bash
# Development server (from kelmah-frontend/)
npm run dev  # Vite dev server on :3000

# Build for production
npm run build  # Creates build/ directory
```

### Service Communication ⚠️ UPDATED TO LOCALTUNNEL
- **Frontend → API Gateway**: All API calls go through `/api/*` routes via LocalTunnel
- **Gateway → Services**: Proxy routing with service registry pattern to localhost services
- **Real-time**: Socket.IO client connects to messaging service via gateway proxy
- **Current LocalTunnel**: `https://red-bobcat-90.loca.lt` (unified mode) - **CHANGES ON RESTART**
- **Architecture**: Single tunnel for both HTTP and WebSocket traffic
- **⚠️ URL Behavior**: LocalTunnel URL changes every time `start-localtunnel-fixed.js` is restarted - this is normal

### LocalTunnel URL Management Protocol ⚠️ CURRENT PRIMARY SYSTEM - CRITICAL

### Current LocalTunnel Configuration (September 2025)
The platform has transitioned to LocalTunnel as the primary development tunnel solution, offering improved reliability and unified mode operation.

**⚠️ CURRENT SYSTEM**: LocalTunnel unified mode is now the default configuration for all development work.

- **Current Active URL**: `https://shaggy-snake-43.loca.lt` (changes on restart)
- **URL Change Pattern**: `https://[random-words-numbers].loca.lt` assigned on each restart
- **Mode**: Unified (HTTP + WebSocket on single domain)
- **Automatic Update System**: `start-localtunnel-fixed.js` automatically detects URL changes and updates all configuration files
- **Auto-Push Protocol**: System commits and pushes URL changes to trigger Vercel deployment automatically
- **Unified Architecture**: 
  - API Gateway tunnel (port 5000): `https://[subdomain].loca.lt` → All HTTP API requests
  - WebSocket traffic: Same URL with `/socket.io` → Real-time Socket.IO connections (routed through API Gateway)
- **Files Auto-Updated on URL Change**: 
  - `kelmah-frontend/public/runtime-config.json` - Frontend runtime configuration
  - Root `vercel.json` and `kelmah-frontend/vercel.json` rewrites configuration - Deployment routing
  - `ngrok-config.json` - LocalTunnel state tracking (kept same filename for compatibility)
  - `kelmah-frontend/src/config/securityConfig.js` - Security headers and CSP connect-src
- **Zero Manual Intervention**: Never manually edit these files - let the protocol handle all updates
- **Deployment Trigger**: URL changes auto-deploy to Vercel for immediate availability
- **Usage**: Always run `node start-localtunnel-fixed.js` to start tunnels and auto-update all configs
- **Advantages**: No browser warning pages, faster access, better development workflow, unified routing
- **⚠️ Expected Behavior**: If APIs stop working after restart, check if URL changed and verify auto-update process completed

### LocalTunnel vs Ngrok Comparison
- **LocalTunnel Advantages**: No browser warnings, unified mode default, simpler setup
- **Ngrok Legacy**: Still documented below for reference, but LocalTunnel is now preferred
- **Compatibility**: Both systems use the same config file structure and update protocols

### Ngrok Protocol Documentation (LEGACY REFERENCE)

### Ngrok URL Management Protocol ⚠️ REPLACED BY LOCALTUNNEL - LEGACY REFERENCE
**⚠️ LEGACY SYSTEM**: The information below is kept for reference. LocalTunnel is now the primary system.

- **Legacy URL Pattern**: `https://[random-id].ngrok-free.app` assigned on each restart
- **Legacy Mode**: Dual tunnels (separate HTTP and WebSocket)
- **Legacy Script**: `start-ngrok.js` (replaced by `start-localtunnel-fixed.js`)

## Key Configuration Patterns

### Environment Management
- **Frontend**: `src/config/environment.js` - Centralized config with service URL detection
- **Backend**: Each service has its own `.env` with shared patterns
- **Production**: Uses LocalTunnel tunneling for external API access (see `vercel.json` rewrites)

### Service Registry (API Gateway) ✅ CONSOLIDATED
```javascript
// From api-gateway/server.js - All services properly registered
const SERVICES = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:5001',
  user: process.env.USER_SERVICE_URL || 'http://localhost:5002',
  job: process.env.JOB_SERVICE_URL || 'http://localhost:5003',
  messaging: process.env.MESSAGING_SERVICE_URL || 'http://localhost:5005',
  payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:5004',
  review: process.env.REVIEW_SERVICE_URL || 'http://localhost:5006'
};
```

### Frontend API Configuration ✅ CONSOLIDATED
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

### Backend Service Structure ✅ CONSOLIDATED
```
services/[service-name]/
├── server.js         # Express app entry point
├── routes/           # Route definitions
├── controllers/      # Request handlers  
├── models/           # Service model index (imports shared models)
│   └── index.js      # Imports from ../../../shared/models/
├── services/         # Business logic
├── middleware/       # Service-specific middleware
└── utils/           # Utilities, logging, validation
```

### Shared Resources Structure ✅ CONSOLIDATED
```
shared/
├── models/           # Centralized Mongoose schemas
│   ├── User.js       # Shared User model
│   ├── Job.js        # Shared Job model
│   ├── Application.js# Shared Application model
│   └── index.js      # Export all shared models
├── middlewares/      # Shared middleware (rateLimiter, etc.)
└── utils/           # Shared utilities and helpers
```

### Import Path Conventions ✅ UPDATED
- **Frontend**: Use `@/modules/[domain]/...` for absolute imports
- **Module imports**: `import { Component } from '@/modules/common/components/Component'`
- **Backend Models**: `const { User } = require('../models')` (service index)
- **Backend Shared**: `require('../../shared/[type]/[utility]')` pattern

## State Management Patterns

### Redux Store Structure (Frontend)
- **Modular slices**: Each domain has its own slice in `modules/[domain]/services/`
- **Global store**: `src/store/index.js` combines all domain slices
- **Async actions**: Use Redux Toolkit's `createAsyncThunk` pattern

### Authentication Flow ⚠️ UPDATED 2025-09-16
1. **Login**: Frontend → Gateway `/api/auth/login` → Auth Service
2. **JWT Storage**: Uses `secureStorage` utility (localStorage/sessionStorage)
3. **Axios Interceptors**: Auto-attach tokens, handle refresh logic
4. **Socket.IO Auth**: Token passed via connection auth

### Authentication Debugging Protocol ⚠️ CRITICAL
**Common Issues & Solutions:**

#### Credential Management
- **Test User**: `giftyafisa@gmail.com` with password `1221122Ga`
- **Email Verification**: Must be set to `true` in database to avoid 403 errors
- **Password Hashing**: Uses bcrypt with 12 salt rounds
- **Setup Script**: Use `node create-gifty-user.js` to ensure test user exists

#### Authentication Testing
- **Comprehensive Test**: Use `node test-auth-and-notifications.js` for full auth flow
- **Health Checks**: Verify all services running before auth testing
- **Token Validation**: Check JWT tokens work for protected endpoints
- **Common Errors**:
  - 401 "Incorrect email or password" → Check credentials and user existence
  - 403 "Email not verified" → Set `isEmailVerified: true` in database
  - 404 on protected endpoints → Check API Gateway routing
  - 401 on protected endpoints → Check JWT token validity

#### Service Dependencies
- **Auth Service**: Must be running on localhost:5001
- **User Service**: Required for profile data (localhost:5002)
- **Messaging Service**: Required for notifications (localhost:5005)
- **Database**: MongoDB connection required for user authentication

## Deployment & Infrastructure

### Production Setup
- **Frontend**: Deployed on Vercel with API rewrites to backend
- **Backend**: Services run on Render with internal load balancing
- **Database**: MongoDB clusters per service
- **Real-time**: Socket.IO with Redis adapter for scaling
- **⚠️ AUTO-DEPLOYMENT**: All services are configured for automatic deployment on git push to main branch
  - **Frontend (Vercel)**: Auto-deploys on push to main (~1-2 minutes)
  - **Backend (Render)**: Auto-deploys on push to main (~2-3 minutes)
  - **NEVER** tell user "wait for deployment" - fixes are automatically deployed
  - **NEVER** ask user to manually deploy - system handles all deployments
  - **ASSUME**: Any fix pushed to GitHub is automatically deploying/deployed

### Key Files for Deployment
- `kelmah-frontend/vercel.json` - Frontend deployment config with API rewrites
- `kelmah-backend/api-gateway/server.js` - Service registry and routing
- `.env` files - Service-specific environment variables

### Development Debugging ⚠️ UPDATED 2025-09-16
- **Health Checks**: All services expose `/health`, `/health/ready`, `/health/live` endpoints
- **Logging**: Winston logger with structured JSON output
- **Service Status**: Use `src/utils/serviceHealthCheck.js` for frontend service monitoring
- **Testing**: Jest-based testing with coverage thresholds (90% critical, 70% non-critical)
- **Debug Scripts**: Use dedicated scripts for service testing (`test-*.js` files in root)
- **Authentication Testing**: Use `test-auth-and-notifications.js` for comprehensive auth flow testing
- **User Management**: Use `create-gifty-user.js` for test user setup and credential management

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
- Use the current LocalTunnel host to access remote services; servers may be hosted locally or remotely.
- Always test via the API Gateway (`/api/*`) routes through the current tunnel URL.
- For LocalTunnel: No special headers required (advantage over ngrok)
- For Legacy Ngrok: Include `ngrok-skip-browser-warning: true` header when needed
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
# 1. Check Gateway health (via current tunnel - LocalTunnel or ngrok)
# LocalTunnel example:
curl https://shaggy-snake-43.loca.lt/health

# Legacy ngrok example:
curl https://298fb9b8181e.ngrok-free.app/health -H "ngrok-skip-browser-warning: true"

# 2. Check specific service health via gateway
# LocalTunnel:
curl https://shaggy-snake-43.loca.lt/api/health/aggregate

# Legacy ngrok:
curl https://298fb9b8181e.ngrok-free.app/api/health/aggregate -H "ngrok-skip-browser-warning: true"

# 3. Test problematic endpoint via gateway
# LocalTunnel:
curl https://shaggy-snake-43.loca.lt/api/[endpoint-path]

# Legacy ngrok:
curl https://298fb9b8181e.ngrok-free.app/api/[endpoint-path] -H "ngrok-skip-browser-warning: true"

# 4. Compare local vs deployed routes
# Local: check kelmah-backend/services/[service]/routes/
# Remote: test actual service behavior via current tunnel
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

## Spec-Kit Documentation System ⚠️ MANDATORY REQUIREMENT

### Continuous Spec-Kit Updates Required
All AI agents MUST continuously update the `spec-kit/` directory with current work status and project state.

**⚠️ CRITICAL**: Always update spec-kit documents when working on any system issues, fixes, or development work.

### Required Spec-Kit Workflow for ALL Development Work
1. **Before Starting Work**: Update relevant spec-kit documents with current task and status
2. **During Development**: Document discoveries, issues found, and interim progress
3. **After Completion**: Mark tasks as COMPLETED ✅ with verification details and current project state
4. **System Changes**: Update architecture documents when system understanding changes
5. **Status Tracking**: Always maintain current project status in `STATUS_LOG.md`

### Spec-Kit Structure ✅ UPDATED SEPTEMBER 2025
```
spec-kit/
├── STATUS_LOG.md              # Completed fixes and their status
├── SEPTEMBER_2025_CRITICAL_FIXES_COMPLETE.md # Complete critical fixes documentation
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
- **LocalTunnel Protocol**: `LOCALTUNNEL_PROTOCOL_DOCUMENTATION.md` - Complete unified tunnel configuration and automated update system
- **Legacy Ngrok Protocol**: `NGROK_PROTOCOL_DOCUMENTATION.md` - Complete tunnel configuration and automated update system (legacy reference)
- **System Status**: `STATUS_LOG.md` - Track of all completed system improvements and current project state
- **Messaging Audit**: `MESSAGING_SYSTEM_AUDIT_COMPLETE.md` - Complete frontend/backend communication analysis

### Critical Spec-Kit Documents for Reference
- **Remote Architecture**: `REMOTE_SERVER_ARCHITECTURE.md` - Authoritative source for deployment understanding
- **LocalTunnel Protocol**: `LOCALTUNNEL_PROTOCOL_DOCUMENTATION.md` - Complete unified tunnel configuration and automated update system
- **Legacy Ngrok Protocol**: `NGROK_PROTOCOL_DOCUMENTATION.md` - Complete tunnel configuration and automated update system (legacy reference)
- **System Status**: `STATUS_LOG.md` - Track of all completed system improvements and current project state
- **Messaging Audit**: `MESSAGING_SYSTEM_AUDIT_COMPLETE.md` - Complete frontend/backend communication analysis
- **Critical Fixes**: `SEPTEMBER_2025_CRITICAL_FIXES_COMPLETE.md` - Comprehensive documentation of architectural consolidation completion

### Continuous Spec-Kit Updates Required
- **Before Starting Work**: Update STATUS_LOG.md with current task status and project state
- **During Development**: Document discoveries, issues found, and interim findings in relevant spec-kit files
- **After Completion**: Mark tasks as COMPLETED ✅ with verification details and current project state
- **System Changes**: Update architecture documents when system understanding changes
- **LocalTunnel Protocol**: Reference LOCALTUNNEL_PROTOCOL_DOCUMENTATION.md for URL management and automatic updates
- **Legacy Ngrok Protocol**: Reference NGROK_PROTOCOL_DOCUMENTATION.md for legacy tunnel configuration (historical reference)

**⚠️ MANDATORY: Always check and update relevant spec-kit documents when working on system issues and maintain current project status.**

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

## UI Component Data Flow Tracing Protocol ⚠️ MANDATORY FOR ALL UI WORK

### Objective
For every UI component examined or fixed, trace the complete data flow from user interaction to the component's assigned frontend API. Report any breakages, mismatches, or unclear responsibilities and suggest fixes.

### Component-to-API Mapping Requirements

**For Each UI Component:**
1. **Component Identification**
   - Identify exact file/component code responsible for UI element
   - Document component location: `kelmah-frontend/src/modules/[domain]/components/[component].jsx`
   - Note component type: page, container, presentational, or utility

2. **API Connection Mapping**
   - Locate function, hook, service, or utility calling the API endpoint
   - Document service file: `kelmah-frontend/src/modules/[domain]/services/[service].js`
   - Map UI action → Redux action/hook → API function → Backend endpoint
   - Specify: URL path, HTTP method, payload shape, response shape

3. **Data Flow Documentation Template**
   ```
   UI Component: [ComponentName.jsx]
   Location: kelmah-frontend/src/modules/[domain]/components/
   
   User Action: [click Apply, enter search, select filter, etc.]
   ↓
   Event Handler: [handleApply(), onSearch(), handleFilterChange()]
   ↓
   State Management: [Redux dispatch, useState update, Context change]
   ↓
   API Service: kelmah-frontend/src/modules/[domain]/services/[service].js
   ↓
   API Call: [POST /api/jobs/:id/apply, GET /api/jobs?search=term]
   ↓
   Backend Endpoint: kelmah-backend/services/[service]/routes/[route].js
   ↓
   Expected Response: { success: boolean, data: [...], message: string }
   ↓
   UI Update: [Show success message, update list, redirect user]
   ```

### Data and Action Flow Verification

**Input Validation:**
- ✅ Verify user input triggers expected state updates
- ✅ Check Redux/Context/Store actions dispatch correctly
- ✅ Confirm right frontend API functions called with correct params
- ✅ Validate payload format matches backend expectations

**Response Handling:**
- ✅ Check data from backend passed down correctly (props/context/state)
- ✅ Verify UI renders received data as intended (no stale/missing data)
- ✅ Ensure dynamic updates reflect live backend state
- ✅ Validate error responses trigger appropriate UI feedback

**State Synchronization:**
- ✅ Confirm no unnecessary middleman layers between UI and API
- ✅ Check for redundant fetches or unclear state sync
- ✅ Verify loading states work correctly
- ✅ Ensure optimistic updates (if any) reconcile with server response

### API Success, Error, and Loading States

**Required UI States:**
1. **Loading State**
   - ✅ Spinner/skeleton screen during API call
   - ✅ Disabled buttons to prevent duplicate requests
   - ✅ Loading indicator placement and visibility

2. **Success State**
   - ✅ Success message/toast notification
   - ✅ UI update reflects new data
   - ✅ Redirect or navigation if required
   - ✅ Clear any error states

3. **Error State**
   - ✅ Clear error message displayed to user
   - ✅ Error boundary coverage for critical failures
   - ✅ Retry mechanism available
   - ✅ Fallback UI or graceful degradation

### Actionable Output Format

**For Each Feature Audited, Provide:**

```markdown
## [Feature Name] Data Flow Analysis

### UI Component Chain
- **Component File**: `kelmah-frontend/src/modules/jobs/components/JobCard.jsx`
- **Service File**: `kelmah-frontend/src/modules/jobs/services/jobsService.js`
- **Redux Slice**: `kelmah-frontend/src/modules/jobs/services/jobSlice.js`

### Flow Map
```
User clicks "Apply Now" button
  ↓
JobCard.jsx: handleApply() @ line 245
  ↓
dispatch(applyToJob(jobId))
  ↓
jobSlice.js: applyToJob thunk @ line 180
  ↓
jobsService.js: applyToJob(jobId) @ line 320
  ↓
axios.post('/api/jobs/:id/apply', { coverLetter, resume })
  ↓
Backend: POST /api/jobs/:id/apply
  ↓
Response: { success: true, application: {...} }
  ↓
Redux state updated: applications array
  ↓
JobCard re-renders: "Applied" badge shown
```

### Issues Found
❌ **Issue 1**: Loading state not implemented
- **Location**: JobCard.jsx line 245
- **Fix**: Add `isLoading` state check before showing button

✅ **Issue 2**: Error handling exists but generic
- **Location**: jobSlice.js line 195
- **Recommendation**: Add specific error messages for 401, 403, 404

⚠️ **Issue 3**: No optimistic update
- **Location**: JobCard.jsx
- **Enhancement**: Show "Applied" immediately, rollback if API fails

### Recommendations
1. Create reusable `useJobApplication` hook
2. Standardize error messages across job features
3. Add retry logic for failed applications
```

### Common Data Flow Anti-Patterns to Flag

**❌ Red Flags:**
1. UI directly calls backend URL (bypassing service layer)
2. API response not validated before rendering
3. Multiple components fetching same data independently
4. State updates not synchronized across components
5. Error states missing or poorly handled
6. Loading states inconsistent or missing
7. Stale data shown after updates
8. No error boundaries around critical flows

**✅ Best Practices:**
1. Single service file per domain handles all API calls
2. Redux/Context centralizes shared state
3. Custom hooks encapsulate common patterns
4. Consistent error/loading/success state handling
5. Optimistic updates with rollback capability
6. Clear separation: UI → State → Service → API
7. Type checking on API responses (if using TypeScript)
8. Comprehensive error boundaries

### File & Code Reference Standards

**Always Specify:**
- ✅ Exact file paths from project root
- ✅ Line numbers for functions/components mentioned
- ✅ Import statements showing dependencies
- ✅ Related files in the data flow chain
- ✅ Backend endpoint corresponding to frontend call

**Example Reference:**
```
Component: kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx (line 145)
Handler: handleSearch (line 245-267)
Service: kelmah-frontend/src/modules/jobs/services/jobsService.js (line 42)
API Call: getJobs({ search, category, location })
Backend: kelmah-backend/services/job-service/routes/jobRoutes.js (line 28)
Controller: kelmah-backend/services/job-service/controllers/jobController.js (line 65)
```

### Data Flow Improvement Recommendations

**When Suggesting Improvements:**
1. **Reusable Hooks**: Propose custom hooks for repeated patterns
   - Example: `useJobSearch`, `useJobApplication`, `useJobFilters`

2. **Unified Patterns**: Identify inconsistencies across features
   - Example: "Jobs use Redux, but Worker profiles use Context - consider standardizing"

3. **Performance**: Flag unnecessary re-renders or redundant API calls
   - Example: "Search triggers API call on every keystroke - debounce recommended"

4. **Error Recovery**: Suggest retry mechanisms and fallbacks
   - Example: "Add exponential backoff for failed job submissions"

5. **Type Safety**: Recommend validation for API responses
   - Example: "Add Zod schema validation for job API responses"

**⚠️ MANDATORY: Document complete data flow for every UI component touched during development or debugging.**

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