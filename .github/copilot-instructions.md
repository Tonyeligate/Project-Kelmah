
# Kelmah Platform - AI Coding Agent Instructions

## Architecture Overview

Kelmah is a **freelance marketplace** connecting vocational workers (carpenters, masons, plumbers, electricians) with hirers. Built with **microservices backend** and **modular React frontend**, using **API Gateway patter## Operational Rules and Incident Playbooks (Updated)

### API Gateway ↔ Job Service Proxying
- Always preserve the `/api/jobs` prefix end-to-end when proxying to job-service.
- When using `createEnhancedJobProxy`, do not override `pathRewrite` at the gateway; rely on the proxy's built-in rewrite to keep `/api/jobs`.
- Health checks: gateway periodically hits `<JOB_SERVICE_URL>/health`. Ensure job-service `/health` is mounted before any limiter.

### Rate Limiting Rules (Gateway and Job-Service)
- Global limiter at the gateway must skip using `req.originalUrl` to match:
  - Skip: `request.originalUrl.startsWith('/api/jobs/my-jobs')`
- Jobs route limiter at the gateway must also bypass `GET /api/jobs/my-jobs` (use `req.path.startsWith('/my-jobs') || req.originalUrl.startsWith('/api/jobs/my-jobs')`).
- Job-service limiter must skip both paths to handle pre/post rewrite states:
  - Skip: `req.path.startsWith('/api/jobs/my-jobs')` OR `req.path === '/my-jobs' || req.path.startsWith('/my-jobs')`
- Always skip rate limiting for `/health`, `/health/ready`, `/health/live` at both gateway and services.

### Job-Service Route Ordering
- Keep `router.get('/:id', ...)` ONLY once and strictly LAST in `routes/job.routes.js` to avoid shadowing specific routes like `/my-jobs`.
- Define specific routes (e.g., `/my-jobs`, `/contracts`, `/dashboard`) before any `/:id` route.

### Messaging & Notifications through Gateway
- Always call messaging REST via gateway:
  - Conversations: Frontend uses `/api/messages/conversations[...]`; gateway rewrites to messaging-service `/api/conversations[...]`.
  - Messages in conversation: Frontend `/api/messages/conversations/:id/messages`; gateway rewrites to `/api/messages/conversation/:id`.
  - Notifications: `/api/notifications` (protected) → messaging-service.
- WebSocket: connect via gateway `/socket.io` with `auth: { token }`. Messaging-service validates JWT with `JWT_SECRET`.
- Do not duplicate `/api` in rewrites. Preserve a single `/api` prefix end-to-end.
- Conversation creation payload must be `{ participantIds: [string], type: 'direct' | 'group', title? }`. Sender must not be supplied on message POST; backend derives from JWT.
- Read status updates must be scoped to the current conversation participants; avoid global read marking.

### Authentication & Testing Protocol
- Never use placeholder tokens. Obtain a real JWT via `POST /api/auth/login` through the gateway and pass the header exactly as `Authorization: Bearer <token>`.
- For ngrok-accessed endpoints, always include `ngrok-skip-browser-warning: true`.
- Test protected job endpoints through the gateway: `GET /api/jobs/my-jobs?status=...&role=hirer` with a hirer JWT.

### Deployment/Restart Semantics
- Gateway changes to proxy/limiters require a gateway restart to take effect.
- Service route changes require that specific microservice to be restarted/redeployed (owner-controlled in production).
- If 429 is returned, observe `Retry-After`/rate-limit headers; resets may be needed even after code changes.

### Incident Playbook: `/api/jobs/my-jobs` returns 404/429/503
1. Verify gateway health: `GET /health` should be 200.
2. Check job-service health: `GET <JOB_SERVICE_URL>/health` should be 200.
3. Confirm gateway → job-service proxy preserves `/api/jobs` (remove custom `pathRewrite` if conflicting).
4. Ensure job-service route order places `/:id` last; `/my-jobs` defined before it.
5. Ensure limiter bypass rules above are in place on both gateway and job-service.
6. Restart gateway (proxy/limiter updates) and the job-service (route changes). Respect owner-only restart policy in production.
7. Re-test via gateway with a real JWT and `ngrok-skip-browser-warning: true`.

### Incident Playbook: Messaging/Notifications 401/404/WS Failures
1. Verify frontend uses `/api/*` for REST and `/socket.io` for WebSocket.
2. Confirm gateway messaging rewrites exist and are correct (no double `/api`).
3. Ensure requests include `Authorization: Bearer <token>`; gateway passes it through.
4. Check messaging-service `JWT_SECRET` is set and matches the issuer.
5. Inspect gateway logs for proxied paths and status; inspect messaging-service logs for auth errors.

### Performance Note
- First-call latency may be high (cold path/DB). Subsequent calls can return 304 quickly. Consider indexing and caching if initial latency is problematic.h service-specific microservices routing through a central gateway.

### Backend: Microservices Architecture
- **API Gateway** (`kelmah-backend/api-gateway/server.js`) - Central routing hub on **port 5000**
- **Services** (`kelmah-backend/services/`): auth (5001), user (5002), job (5003), messaging (5004), payment (5005), review (5006)
- **Tech Stack**: Express.js, MongoDB/Mongoose, Socket.IO, JWT auth, Winston logging, Helmet security
- **Service Registry Pattern**: Dynamic service URL resolution with AWS/local fallbacks
- **Key Files**: Each service has `server.js`, `routes/`, `controllers/`, `models/`, `services/`, `middleware/`

### Frontend: Domain-Driven Modules
- **Modular Structure** (`kelmah-frontend/src/modules/`): auth, common, dashboard, jobs, search, messaging, worker, hirer, etc.
- **Tech Stack**: React 18, Vite, Redux Toolkit, Material-UI, Framer Motion, Socket.IO client, Recharts
- **Module Pattern**: Each module has `components/`, `pages/`, `services/`, `contexts/`, `hooks/`
- **Enhanced Prototypes**: Modern Ghana-themed components like `EnhancedWorkerDashboard.jsx` and `EnhancedHirerDashboard.jsx`

## Current State & Deployment Architecture (December 2024)

### Production Deployment Pattern
- **Backend**: Local microservices (API Gateway on port 5000) exposed via **ngrok tunnels**
- **Frontend**: Deployed on **Vercel** with dynamic routing to ngrok URLs via `vercel.json` rewrites
- **Dynamic Configuration**: `public/runtime-config.json` for real-time URL management
- **Auto-deployment**: `NgrokManager` class handles tunnel creation, config updates, and Git commits

### Enhanced Component Prototypes
Modern, Ghana-focused component implementations demonstrate current architecture patterns:

#### Enhanced Dashboard Components
- **`EnhancedWorkerDashboard.jsx`**: Mobile-first worker interface with Ghana theme colors
  - Ghana theme: `{ red: '#DC143C', gold: '#FFD700', green: '#2E7D32', trust: '#1976D2' }`
  - Memoized `StatsCard` components with `React.memo()` to prevent re-renders
  - Responsive grid layout using Material-UI breakpoints (`theme.breakpoints.down('md')`)
  - Framer Motion animations with proper loading states and error boundaries
  - Vocational job categories optimized for Ghana market

- **`EnhancedHirerDashboard.jsx`**: Professional hirer management interface
  - Business-focused theme with `HirerStatsCard` and `HirerActionCard` components
  - Modern card-based layout with gradient backgrounds and hover animations
  - Real-time data integration with Redux state management
  - Mobile-optimized responsive design with collapsible sections

#### Key Component Development Patterns (Current Implementation)
```javascript
// Ghana Theme Integration (Standard across all components)
const GhanaTheme = {
  red: '#DC143C',
  gold: '#FFD700', 
  green: '#2E7D32',
  trust: '#1976D2'
};

// Memoized component pattern to prevent re-renders
const StatsCard = React.memo(({ title, value, change, icon, color, loading }) => (
  <Card sx={{ 
    background: `linear-gradient(135deg, ${color} 0%, ${alpha(color, 0.8)} 100%)`,
    borderRadius: 3,
    '&::before': {
      content: '""',
      position: 'absolute',
      background: 'url("data:image/svg+xml,%3Csvg...")', // Ghana patterns
    }
  }}>
    {loading ? (
      <Skeleton variant="text" sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
    ) : (
      // Actual content with proper responsive design
    )}
  </Card>
));

// Responsive design with Material-UI breakpoints
const isMobile = useMediaQuery(theme.breakpoints.down('md'));
const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
```

### Network Configuration System
```javascript
// NgrokManager (c:\Users\SAMSUNG\Desktop\Project-Kelmah\ngrok-manager.js)
class NgrokManager {
  // 1. Creates tunnels for API Gateway (5000) and WebSocket (3005)
  // 2. Updates vercel.json with new tunnel URLs  
  // 3. Creates runtime-config.json for dynamic frontend config
  // 4. Auto-commits changes to trigger Vercel deployment
}

// Runtime config structure (public/runtime-config.json):
{
  "ngrokUrl": "https://91ad20324cfa.ngrok-free.app",
  "websocketUrl": "wss://d1d2f3df291c.ngrok-free.app", 
  "timestamp": "2025-09-09T21:55:00.000Z",
  "isDevelopment": true
}
```

### Service Communication & Integration Patterns

#### API Gateway Service Registry (kelmah-backend/api-gateway/server.js)
```javascript
const services = {
  auth: process.env.AUTH_SERVICE_URL || `${INTERNAL_NLB}:5001`,
  user: process.env.USER_SERVICE_URL || `${INTERNAL_NLB}:5002`,
  job: process.env.JOB_SERVICE_URL || `${INTERNAL_NLB}:5003`,
  messaging: process.env.MESSAGING_SERVICE_URL || `${INTERNAL_NLB}:5004`,
  payment: process.env.PAYMENT_SERVICE_URL || `${INTERNAL_NLB}:5005`,
  review: process.env.REVIEW_SERVICE_URL || `${INTERNAL_NLB}:5006`
};
```

#### Frontend API Configuration Pattern
```javascript
// Centralized axios configuration (src/modules/common/services/axios.js)
const baseURL = await getApiBaseUrl(); // Dynamic detection: '/api' in prod, service URLs in dev

// Runtime config loading for ngrok URLs
const config = await fetch('/runtime-config.json');
if (config.ngrokUrl) {
  // Use ngrok URL for backend communication
}
```

#### Communication Flow
- **Frontend → API Gateway**: All requests go through `/api/*` routes
- **Gateway → Services**: Proxy routing with service registry resolution
- **Real-time**: Socket.IO client connects to messaging service via gateway proxy
- **Dynamic URLs**: Runtime configuration supports ngrok tunnel URL switching

### Backend Development Commands
```bash
# Start all services in development (from kelmah-backend/)
npm run dev  # Starts API Gateway on port 5000

# Start individual services
node start-api-gateway.js  # API Gateway on port 5000
npm run start:auth     # Auth service on port 5001
npm run start:messaging # Messaging service on port 5004 (Socket.IO)

# Testing and debugging
npm test              # Run all tests
npm run test:coverage # Run tests with coverage
node test-*.js        # Run specific debug scripts
```

**⚠️ IMPORTANT: Server restart/shutdown operations must be performed only by the project owner.**

### Frontend Development Commands
```bash
# Development server (from kelmah-frontend/)
npm run dev  # Vite dev server on port 3000

# Build for production
npm run build  # Creates build/ directory for Vercel deployment
```

### Ngrok Tunnel Management
```bash
# Start ngrok tunnel for local development
node ngrok-manager.js
# OR  
node start-ngrok.js

# This automatically:
# - Creates tunnels for API Gateway (port 5000) and WebSocket (port 3005)
# - Updates vercel.json with new ngrok URLs for Vercel rewrites
# - Updates runtime-config.json for dynamic frontend URL loading
# - Commits and pushes changes to trigger Vercel deployment
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

### Environment Management
- **Frontend**: `src/config/environment.js` - Centralized config with service URL detection
- **Backend**: Each service has its own `.env` with shared patterns
- **Production**: Uses ngrok tunneling for external API access (see `vercel.json` rewrites)
- **Dynamic Config**: `runtime-config.json` loaded at runtime for URL flexibility

### Import Path Conventions
- **Frontend**: Use `src/modules/[domain]/...` for absolute imports
- **Module imports**: `import { Component } from 'src/modules/common/components/Component'`
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

## Enhanced Component Prototypes (December 2024)

### Current Dashboard Implementations
- **Worker Dashboard**: `src/modules/dashboard/components/worker/EnhancedWorkerDashboard.jsx`
  - **Features**: Ghana-themed stats cards, mobile-responsive layout, real-time data
  - **Patterns**: Memoized components, proper useEffect dependencies, loading states
  - **Theme**: Uses `GhanaTheme` colors (red: '#DC143C', gold: '#FFD700', green: '#2E7D32')
- **Hirer Dashboard**: `src/modules/dashboard/components/hirer/EnhancedHirerDashboard.jsx`
  - **Features**: Professional hirer interface, job management tools
  - **Responsive**: Mobile-first design with collapsible sections

### Component Development Patterns (Current Prototypes)
```javascript
// Example: Enhanced component with Ghana theming
const GhanaTheme = {
  red: '#DC143C',
  gold: '#FFD700', 
  green: '#2E7D32',
  trust: '#1976D2'
};

// Memoized stats card to prevent re-renders
const StatsCard = React.memo(({ title, value, change, icon, color, loading }) => (
  <Card sx={{ 
    background: `linear-gradient(135deg, ${color} 0%, ${alpha(color, 0.8)} 100%)`,
    color: 'white',
    borderRadius: 3,
    '&::before': {
      content: '""',
      position: 'absolute',
      background: 'url("data:image/svg+xml,%3Csvg...", // Ghana pattern
    }
  }}>
    {/* Mobile-responsive content with loading states */}
  </Card>
));
```

### Mobile-First Design Principles (Implemented)
- **Breakpoints**: Use Material-UI's responsive system (`theme.breakpoints`)
- **Touch-First**: Large tap targets, swipe gestures where appropriate
- **Ghana Context**: Colors, payment methods (MTN MoMo), local patterns
- **Performance**: Lazy loading, code splitting, optimized images

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

## Common Gotchas

1. **Import Paths**: After refactoring, use new modular paths (`@/modules/[domain]/...`)
2. **Service URLs**: Frontend detects environment and routes through gateway in production
3. **CORS**: API Gateway handles CORS for all services
4. **Socket.IO**: Connects through gateway proxy (`/socket.io`), not directly to messaging service
5. **Rate Limiting**: Configured at API Gateway level, affects all services
6. **Public vs Protected Routes**: Always distinguish between public pages (accessible without auth) and protected pages (require authentication)
7. **Null Safety**: Components must handle null/undefined user state gracefully, especially in public routes
8. **Navigation Consistency**: Ensure navigation links point to correct routes based on authentication state
9. **Header Navigation**: Never add hirer-only or worker-only links to global header; use dashboard/sidebar instead
10. **Job Page Confusion**: "Jobs" = public browse, "My Jobs" = hirer management (different APIs, different audiences)
11. **Service Worker Caching**: Changes to header navigation may require service worker unregistration or hard refresh
12. **Navigation Redirects**: Never redirect public navigation items to login pages; use public routes instead
13. **Route Component Mismatch**: Ensure public routes use public components, not authenticated components that redirect to login
14. **Dual Navigation Sources**: Always check both `useNavLinks.js` and `navLinks.js` when fixing navigation issues

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
- **Public Route Testing**: Always test public routes without authentication to ensure they work for all users
- **Navigation Flow Validation**: Verify navigation links work correctly for both authenticated and unauthenticated users
- **Navigation Source Verification**: Check both `useNavLinks.js` and `navLinks.js` when investigating navigation issues
- **Route Component Validation**: Ensure public routes use appropriate public components, not authenticated ones

### Proven Investigation Methodology (From Mobile Optimization Success)
1. **List All Files Involved**: Identify every file in the error/problem report - no guesswork
2. **Read All Listed Files**: Thoroughly examine each file to locate exact error lines
3. **Scan Related Files**: Cross-reference other files to confirm the actual error cause
4. **Confirm Process Flow**: Validate complete file process flow and logic before proposing fixes
5. **Verify Solution Accuracy**: Scan ALL files in the process flow to confirm the fix is correct
6. **Test Mobile Impact**: Ensure fixes improve mobile experience without breaking desktop functionality

### Mongoose Schema Validation Patterns
- **Required Field Handling**: Always provide safe defaults for required schema fields in controllers
- **Legacy Payload Support**: Map legacy UI fields to canonical model structure in create/update handlers
- **Validation Error Prevention**: Add fallback values for missing required fields before model creation
- **Field Mapping Examples**:
  - `skills` → `requirements.primarySkills` and `requirements.secondarySkills`
  - `budget` object → `bidding.minBidAmount` and `bidding.maxBidAmount`
  - `location` string → `locationDetails.region` and `locationDetails.district`
  - `duration` string → `duration.value` and `duration.unit`

### Job Service Specific Validation
- **Required Fields**: `bidding.minBidAmount`, `bidding.maxBidAmount`, `locationDetails.region`, `requirements.primarySkills`, `duration.value`, `duration.unit`
- **Default Values**: Use sensible defaults (e.g., 'Greater Accra' for region, 'GHS' for currency, 'fixed' for paymentType)
- **Budget Mapping**: Convert budget objects to bidding amounts with fallback ranges
- **Skills Processing**: Ensure at least one primary skill is always present

## Development Environment Management

### Ngrok Tunnel Management
- **Process Control**: Use `taskkill /IM ngrok.exe /F` to terminate running ngrok processes
- **Restart Protocol**: Always kill existing ngrok before starting new tunnels to avoid port conflicts
- **Tunnel Health**: Monitor ngrok status through health check endpoints
- **Production Access**: Use ngrok for external API access in development/testing environments

### Service Health Monitoring
- **Health Endpoints**: All services expose `/health`, `/health/ready`, `/health/live`
- **MongoDB Connection**: Monitor connection status in service logs
- **Service Dependencies**: Check service-to-service connectivity through health checks
- **Log Analysis**: Use structured JSON logging for debugging service issues

## Error Diagnosis & Resolution Protocol

### Empty Response Investigation
- **Root Cause Analysis**: Empty API responses often indicate upstream creation failures
- **Validation Errors**: Check for 400 status codes in service logs indicating schema validation failures
- **Database State**: Verify collection has documents before investigating empty list responses
- **Payload Analysis**: Ensure request payloads match required schema fields

### Service Communication Debugging
- **Gateway Logs**: Check API Gateway logs for proxy routing issues
- **Service Logs**: Review individual service logs for validation/processing errors
- **Database Logs**: Monitor MongoDB connection and query execution
- **Network Issues**: Verify service-to-service communication through health endpoints

### Common Failure Patterns
- **Schema Validation**: Missing required fields cause 400 errors and prevent data creation
- **Authentication**: Invalid or missing JWT tokens cause 401/403 responses
- **Rate Limiting**: Excessive requests trigger 429 responses with retry-after headers
- **Service Unavailability**: Down services return 503/504 responses

## Common Gotchas

1. **Import Paths**: After refactoring, use new modular paths (`@/modules/[domain]/...`)
2. **Service URLs**: Frontend detects environment and routes through gateway in production
3. **CORS**: API Gateway handles CORS for all services
4. **Socket.IO**: Connects through gateway proxy (`/socket.io`), not directly to messaging service
5. **Rate Limiting**: Configured at API Gateway level, affects all services
6. **Public vs Protected Routes**: Always distinguish between public pages (accessible without auth) and protected pages (require authentication)
7. **Null Safety**: Components must handle null/undefined user state gracefully, especially in public routes
8. **Navigation Consistency**: Ensure navigation links point to correct routes based on authentication state
9. **Header Navigation**: Never add hirer-only or worker-only links to global header; use dashboard/sidebar instead
10. **Job Page Confusion**: "Jobs" = public browse, "My Jobs" = hirer management (different APIs, different audiences)
11. **Service Worker Caching**: Changes to header navigation may require service worker unregistration or hard refresh
12. **Navigation Redirects**: Never redirect public navigation items to login pages; use public routes instead
13. **Route Component Mismatch**: Ensure public routes use public components, not authenticated components that redirect to login
14. **Dual Navigation Sources**: Always check both `useNavLinks.js` and `navLinks.js` when fixing navigation issues

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
- **Public Route Testing**: Always test public routes without authentication to ensure they work for all users
- **Navigation Flow Validation**: Verify navigation links work correctly for both authenticated and unauthenticated users
- **Navigation Source Verification**: Check both `useNavLinks.js` and `navLinks.js` when investigating navigation issues
- **Route Component Validation**: Ensure public routes use appropriate public components, not authenticated ones

### Proven Investigation Methodology (From Mobile Optimization Success)
1. **List All Files Involved**: Identify every file in the error/problem report - no guesswork
2. **Read All Listed Files**: Thoroughly examine each file to locate exact error lines
3. **Scan Related Files**: Cross-reference other files to confirm the actual error cause
4. **Confirm Process Flow**: Validate complete file process flow and logic before proposing fixes
5. **Verify Solution Accuracy**: Scan ALL files in the process flow to confirm the fix is correct
6. **Test Mobile Impact**: Ensure fixes improve mobile experience without breaking desktop functionality

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

## Public Route & Navigation Patterns

### Public Route Requirements
- **Public Pages**: Must work without authentication (e.g., `/find-talents`, `/jobs`, `/search`)
- **Null Safety**: All components in public routes must handle `user = null` gracefully
- **No Auth Dependencies**: Avoid accessing `user.id`, `user.role`, or auth-only APIs in public components
- **Graceful Degradation**: Show appropriate fallbacks when personalized features aren't available

### Navigation Link Patterns
- **Unauthenticated Users**: Route to public pages (e.g., `/find-talents` for "Find Talents")
- **Authenticated Users**: Route to role-specific pages (e.g., `/hirer/find-talent` for hirers)
- **Consistent Behavior**: Same navigation item should work for both logged-in and logged-out users
- **Redirect Handling**: Use public routes instead of login redirects for discoverable content
- **Route Component Mapping**: Ensure public routes use public components (SearchPage) not authenticated components (WorkerSearchPage)
- **Navigation Sources**: Always check both `src/hooks/useNavLinks.js` and `src/config/navLinks.js` for navigation logic

### Component Safety Guidelines
- **User Context Checks**: Always verify `user?.id` exists before accessing user properties
- **Conditional Rendering**: Use `user && user.id` patterns for auth-dependent features
- **Error Boundaries**: Wrap components that might fail due to missing auth data
- **Loading States**: Show appropriate loading/empty states when user data is unavailable

## Header Navigation & Job Page Architecture

### Global Header Navigation Rules
- **Header Links**: Only show public, universally relevant links in global header
- **Current Header Links**: Home, Jobs, Find Talents, Pricing, Auth buttons
- **Removed from Header**: "Find Work" (redundant with Jobs), "My Jobs" (hirer-only)
- **Navigation Sources**: `src/hooks/useNavLinks.js` and `src/config/navLinks.js` control header links

### Job Page Differentiation
- **All Jobs (Public Browse)**: `/jobs` - Shows all open opportunities to everyone
  - API: `GET /api/jobs` (no authentication required)
  - Purpose: Public job discovery and browsing
  - Audience: All users (authenticated and unauthenticated)
  
- **My Jobs (Hirer Management)**: `/hirer/jobs` or dashboard tabs
  - API: `GET /api/jobs/my-jobs?status=...` (requires authentication + hirer role)
  - Purpose: Manage hirer's own job postings (active, completed, drafts)
  - Audience: Authenticated hirers only
  - Location: Inside hirer dashboard/sidebar, NOT in global header

### Find Talents Navigation Pattern
- **Unauthenticated Users**: Route to `/find-talents` (public page)
- **Authenticated Hirers**: Route to `/hirer/find-talent` (dashboard page)
- **Implementation**: Conditional routing based on authentication state
- **Critical Fix**: Ensure `/find-talents` route uses `SearchPage` component, NOT `WorkerSearchPage` (which redirects to login)
- **Navigation Sources**: Both `useNavLinks.js` and `navLinks.js` must route unauthenticated users to `/find-talents`, not login redirects

### Search & Discovery Patterns
- **Worker Search**: Accessible via Jobs page filters, hero CTAs, not global header
- **Location Search**: Available through Jobs page and dedicated search components
- **Map Search**: Separate `/map` route for geographic job discovery

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

## Operational Rules and Incident Playbooks (Updated)

### API Gateway ↔ Job Service Proxying
- Always preserve the `/api/jobs` prefix end-to-end when proxying to job-service.
- When using `createEnhancedJobProxy`, do not override `pathRewrite` at the gateway; rely on the proxy’s built-in rewrite to keep `/api/jobs`.
- Health checks: gateway periodically hits `<JOB_SERVICE_URL>/health`. Ensure job-service `/health` is mounted before any limiter.

### Rate Limiting Rules (Gateway and Job-Service)
- Global limiter at the gateway must skip using `req.originalUrl` to match:
  - Skip: `request.originalUrl.startsWith('/api/jobs/my-jobs')`
- Jobs route limiter at the gateway must also bypass `GET /api/jobs/my-jobs` (use `req.path.startsWith('/my-jobs') || req.originalUrl.startsWith('/api/jobs/my-jobs')`).
- Job-service limiter must skip both paths to handle pre/post rewrite states:
  - Skip: `req.path.startsWith('/api/jobs/my-jobs')` OR `req.path === '/my-jobs' || req.path.startsWith('/my-jobs')`
- Always skip rate limiting for `/health`, `/health/ready`, `/health/live` at both gateway and services.

### Job-Service Route Ordering
### Messaging & Notifications through Gateway
- Always call messaging REST via gateway:
  - Conversations: Frontend uses `/api/messages/conversations[...]`; gateway rewrites to messaging-service `/api/conversations[...]`.
  - Messages in conversation: Frontend `/api/messages/conversations/:id/messages`; gateway rewrites to `/api/messages/conversation/:id`.
  - Notifications: `/api/notifications` (protected) → messaging-service.
- WebSocket: connect via gateway `/socket.io` with `auth: { token }`. Messaging-service validates JWT with `JWT_SECRET`.
- Do not duplicate `/api` in rewrites. Preserve a single `/api` prefix end-to-end.
- Conversation creation payload must be `{ participantIds: [string], type: 'direct' | 'group', title? }`. Sender must not be supplied on message POST; backend derives from JWT.
- Read status updates must be scoped to the current conversation participants; avoid global read marking.

- Keep `router.get('/:id', ...)` ONLY once and strictly LAST in `routes/job.routes.js` to avoid shadowing specific routes like `/my-jobs`.
- Define specific routes (e.g., `/my-jobs`, `/contracts`, `/dashboard`) before any `/:id` route.

### Authentication & Testing Protocol
- Never use placeholder tokens. Obtain a real JWT via `POST /api/auth/login` through the gateway and pass the header exactly as `Authorization: Bearer <token>`.
- For ngrok-accessed endpoints, always include `ngrok-skip-browser-warning: true`.
- Test protected job endpoints through the gateway: `GET /api/jobs/my-jobs?status=...&role=hirer` with a hirer JWT.

### Deployment/Restart Semantics
- Gateway changes to proxy/limiters require a gateway restart to take effect.
- Service route changes require that specific microservice to be restarted/redeployed (owner-controlled in production).
- If 429 is returned, observe `Retry-After`/rate-limit headers; resets may be needed even after code changes.

### Incident Playbook: `/api/jobs/my-jobs` returns 404/429/503
### Incident Playbook: Messaging/Notifications 401/404/WS Failures
1. Verify frontend uses `/api/*` for REST and `/socket.io` for WebSocket.
2. Confirm gateway messaging rewrites exist and are correct (no double `/api`).
3. Ensure requests include `Authorization: Bearer <token>`; gateway passes it through.
4. Check messaging-service `JWT_SECRET` is set and matches the issuer.
5. Inspect gateway logs for proxied paths and status; inspect messaging-service logs for auth errors.

1. Verify gateway health: `GET /health` should be 200.
2. Check job-service health: `GET <JOB_SERVICE_URL>/health` should be 200.
3. Confirm gateway → job-service proxy preserves `/api/jobs` (remove custom `pathRewrite` if conflicting).
4. Ensure job-service route order places `/:id` last; `/my-jobs` defined before it.
5. Ensure limiter bypass rules above are in place on both gateway and job-service.
6. Restart gateway (proxy/limiter updates) and the job-service (route changes). Respect owner-only restart policy in production.
7. Re-test via gateway with a real JWT and `ngrok-skip-browser-warning: true`.

### Performance Note
- First-call latency may be high (cold path/DB). Subsequent calls can return 304 quickly. Consider indexing and caching if initial latency is problematic.

## Data Validation & Schema Management

### Mongoose Schema Validation Patterns
- **Required Field Handling**: Always provide safe defaults for required schema fields in controllers
- **Legacy Payload Support**: Map legacy UI fields to canonical model structure in create/update handlers
- **Validation Error Prevention**: Add fallback values for missing required fields before model creation
- **Field Mapping Examples**:
  - `skills` → `requirements.primarySkills` and `requirements.secondarySkills`
  - `budget` object → `bidding.minBidAmount` and `bidding.maxBidAmount`
  - `location` string → `locationDetails.region` and `locationDetails.district`
  - `duration` string → `duration.value` and `duration.unit`

### Job Service Specific Validation
- **Required Fields**: `bidding.minBidAmount`, `bidding.maxBidAmount`, `locationDetails.region`, `requirements.primarySkills`, `duration.value`, `duration.unit`
- **Default Values**: Use sensible defaults (e.g., 'Greater Accra' for region, 'GHS' for currency, 'fixed' for paymentType)
- **Budget Mapping**: Convert budget objects to bidding amounts with fallback ranges
- **Skills Processing**: Ensure at least one primary skill is always present

## Development Environment Management

### Ngrok Tunnel Management
- **Process Control**: Use `taskkill /IM ngrok.exe /F` to terminate running ngrok processes
- **Restart Protocol**: Always kill existing ngrok before starting new tunnels to avoid port conflicts
- **Tunnel Health**: Monitor ngrok status through health check endpoints
- **Production Access**: Use ngrok for external API access in development/testing environments

### Service Health Monitoring
- **Health Endpoints**: All services expose `/health`, `/health/ready`, `/health/live`
- **MongoDB Connection**: Monitor connection status in service logs
- **Service Dependencies**: Check service-to-service connectivity through health checks
- **Log Analysis**: Use structured JSON logging for debugging service issues

## Error Diagnosis & Resolution Protocol

### Empty Response Investigation
- **Root Cause Analysis**: Empty API responses often indicate upstream creation failures
- **Validation Errors**: Check for 400 status codes in service logs indicating schema validation failures
- **Database State**: Verify collection has documents before investigating empty list responses
- **Payload Analysis**: Ensure request payloads match required schema fields

### Service Communication Debugging
- **Gateway Logs**: Check API Gateway logs for proxy routing issues
- **Service Logs**: Review individual service logs for validation/processing errors
- **Database Logs**: Monitor MongoDB connection and query execution
- **Network Issues**: Verify service-to-service communication through health endpoints

### Common Failure Patterns
- **Schema Validation**: Missing required fields cause 400 errors and prevent data creation
- **Authentication**: Invalid or missing JWT tokens cause 401/403 responses
- **Rate Limiting**: Excessive requests trigger 429 responses with retry-after headers
- **Service Unavailability**: Down services return 503/504 responses

## Mobile Responsiveness & UI Optimization

### Mobile-First Design Principles
- **Single Screen Fit**: Mobile auth pages must fit in single viewport without scrolling
- **Ultra-Compact Layout**: Minimize spacing, padding, and non-essential elements on mobile
- **Touch-Friendly**: Ensure all interactive elements are properly sized for touch
- **Professional Appearance**: Maintain clean, modern design while maximizing space efficiency

### Mobile Authentication Optimization
- **Mobile Login**: Ultra-compact design with minimal header, no excess space below form
- **Mobile Register**: Remove role selection, streamline form for single-screen completion
- **Layout Wrapper**: Use `justifyContent: { xs: 'flex-start', md: 'center' }` to prevent vertical centering on mobile
- **Padding Control**: Remove mobile padding with `p: { xs: 0, sm: 3, md: 4 }` patterns
- **Viewport Height**: Use `minHeight: { xs: '100vh', md: 650 }` for full mobile coverage

### Mobile Component Patterns
- **Responsive Typography**: Scale font sizes appropriately for mobile screens
- **Compact Spacing**: Use minimal margins and padding on mobile breakpoints
- **Essential Elements Only**: Remove decorative elements that waste mobile space
- **Desktop Preservation**: Ensure desktop views remain unchanged when optimizing mobile

### Mobile Layout Wrapper Patterns (Proven Solutions)
- **AuthWrapper.jsx**: Use `justifyContent: { xs: 'flex-start', md: 'center' }` to prevent vertical centering on mobile
- **Layout.jsx**: Remove mobile padding with `py: 0, px: 0` for auth pages
- **Paper Components**: Use `minHeight: { xs: '100vh', md: 650 }` for full mobile coverage
- **Flexbox Control**: Avoid `justifyContent: 'center'` on mobile - causes excess space below content
- **Padding Management**: Use `p: { xs: 0, sm: 3, md: 4 }` patterns to remove mobile padding

### Mobile Investigation Protocol
1. **Identify Layout Wrappers**: Check AuthWrapper, Layout, and parent components for mobile spacing issues
2. **Examine Flexbox Properties**: Look for `justifyContent: 'center'` causing vertical centering
3. **Check Padding/Margin**: Review responsive padding patterns that may create excess space
4. **Validate Breakpoints**: Ensure mobile-specific styles are properly applied
5. **Test Single Screen Fit**: Verify content fits in viewport without scrolling

### Mobile Optimization Success Patterns (From Kelmah Project)
- **MobileLogin.jsx**: Ultra-compact design with minimal header, no excess space below form
- **MobileRegister.jsx**: Removed role selection, streamlined for single-screen completion
- **AuthWrapper.jsx**: Fixed vertical centering and padding issues for mobile
- **Layout.jsx**: Removed mobile padding for auth pages to maximize space
- **File Flow**: App.jsx → Layout.jsx → AuthWrapper.jsx → Login.jsx → MobileLogin.jsx
- **Root Cause**: AuthWrapper.jsx was the main culprit causing excess space below mobile forms

## Public Worker Search Flow & Critical Fixes

### Public Worker Discovery Architecture
- **Frontend Route**: `/find-talents` → `SearchPage` component (public, no auth required)
- **API Endpoints**: 
  - Public workers: `GET /api/workers` → proxies to user-service `/api/users/workers`
  - Search suggestions: `GET /api/search/suggestions` → proxies to job-service `/api/search/suggestions`
- **Data Flow**: Frontend → API Gateway → User Service → MongoDB → Response

### Critical Gateway Configuration (Fixed Issues)
- **Public Worker Proxy**: `/api/workers` must rewrite to `/api/users/workers` in gateway
- **Search Suggestions Alias**: `/api/jobs/search/*` must alias to `/api/search/*` to prevent 404s
- **Auth Bypass**: `GET /api/users/workers*` must bypass authentication for public access
- **Route Ordering**: Public routes must be defined before protected routes in gateway

### Frontend Data Mapping (Fixed Issues)
- **API Response Structure**: User-service returns `{ data: { workers: [], pagination: {} } }`
- **Frontend Mapping**: Must read `response.data.data.workers` not `response.data.data` as array
- **Fallback Handling**: Support both `data.workers` and `results` for backward compatibility
- **Error States**: Handle empty responses gracefully with appropriate user feedback

### Investigation Protocol for Worker Search Issues
1. **Check Gateway Proxies**: Verify `/api/workers` → `/api/users/workers` rewrite exists
2. **Verify Auth Bypass**: Confirm `GET /api/users/workers*` bypasses authentication
3. **Test Suggestions**: Ensure `/api/jobs/search/suggestions` aliases to `/api/search/suggestions`
4. **Frontend Mapping**: Verify SearchPage reads `data.workers` from API response
5. **Database Content**: Check MongoDB has worker documents in users collection
6. **Service Health**: Verify user-service and job-service are running and healthy

### Common Worker Search Failures
- **404 Errors**: Missing gateway proxy rewrites or incorrect path mappings
- **401 Errors**: Authentication middleware blocking public access
- **Empty Results**: Frontend data mapping issues or empty database
- **Suggestions 404**: Missing `/api/jobs/search/*` alias to `/api/search/*`
- **CORS Issues**: Gateway CORS configuration problems

### Proven Fixes Implemented (December 2024)
1. **Gateway Worker Proxy Fix**:
   ```javascript
   // kelmah-backend/api-gateway/server.js
   pathRewrite: { '^/api/workers': '/api/users/workers' }
   ```

2. **Search Suggestions Alias**:
   ```javascript
   // kelmah-backend/api-gateway/server.js
   app.use('/api/jobs/search', createProxyMiddleware({
     target: services.job,
     pathRewrite: { '^/api/jobs/search': '/api/search' }
   }));
   ```

3. **Auth Bypass for Public Workers**:
   ```javascript
   // kelmah-backend/api-gateway/server.js
   app.use('/api/users', (req, res, next) => {
     if (req.method === 'GET' && (req.path === '/workers' || /^\/workers\//.test(req.path))) {
       return next(); // Skip auth for public worker access
     }
     return authMiddleware.authenticate(req, res, next);
   });
   ```

4. **Frontend Data Mapping Fix**:
   ```javascript
   // kelmah-frontend/src/modules/search/pages/SearchPage.jsx
   const workers = response.data?.data?.workers || response.data?.results || [];
   ```

5. **Suggestions Endpoint Update**:
   ```javascript
   // Changed from /api/jobs/search/suggestions to /api/search/suggestions
   const response = await axios.get('/api/search/suggestions', { params: { query } });
   ```

### Git Workflow & Debugging Approach
- **Investigation Protocol**: Follow the 5-step process for all error investigations
  1. List all files involved in error reports (no guesswork)
  2. Read all listed files to find exact error lines
  3. Scan related files to confirm actual error cause
  4. Confirm complete file process flow before proposing fixes
  5. Verify fix accuracy by scanning all files in the process flow
- **Git Conflict Resolution**: Use `git commit` then `git pull --rebase` then `git push` for merge conflicts
- **Incremental Fixes**: Fix one issue at a time, test, then move to next issue
- **Service Restart Policy**: Gateway changes require restart; service changes require owner approval

## AI Agent Investigation Guidelines

### Systematic Problem Solving
- **File Reading**: Always read complete files involved in error reports, never make assumptions
- **Cross-Reference Analysis**: Scan related files to confirm error causes and solution accuracy
- **Flow Validation**: Trace complete request/response flows before implementing fixes
- **Solution Verification**: Validate fixes by scanning all files in the process flow

### Investigation Priority Order
1. **Service Health**: Check health endpoints for all involved services
2. **Log Analysis**: Review service logs for error patterns and validation failures
3. **Schema Validation**: Verify request payloads match required model fields
4. **Database State**: Confirm data exists in collections before investigating empty responses
5. **Network Connectivity**: Test service-to-service communication through health checks
6. **Mobile Layout Issues**: Check wrapper components for spacing and centering problems
7. **Public Route Flow**: Verify unauthenticated access works for public endpoints

### Fix Implementation Standards
- **Safe Defaults**: Always provide fallback values for required schema fields
- **Backward Compatibility**: Support legacy payload formats while mapping to canonical models
- **Error Handling**: Implement graceful error handling with meaningful error messages
- **Testing**: Verify fixes work with both new and legacy payload formats
- **Mobile Optimization**: Ensure fixes improve mobile experience without breaking desktop
- **Public Access**: Ensure public routes work without authentication

## Project Context & Purpose

Kelmah is a **vocational freelance marketplace** specifically designed for Ghana's skilled trades sector. The platform connects carpenters, masons, plumbers, electricians, and other vocational workers with hirers seeking their services.

### Ghana-Specific Features
- **Mobile-First Design**: Optimized for high mobile usage in Ghana
- **Local Payment Integration**: MTN Mobile Money and local payment processors
- **Ghana Theme Colors**: Red (#DC143C), Gold (#FFD700), Green (#2E7D32) representing national colors
- **Vocational Focus**: Specialized job categories for traditional Ghanaian trades
- **Network Resilience**: Designed for intermittent connectivity common in Ghana

### Target Users
- **Workers**: Skilled vocational professionals seeking contract opportunities
- **Hirers**: Businesses and individuals needing vocational services  
- **Public Users**: Anyone searching for available workers and services

### Development Philosophy
- **AI Agent Friendly**: Codebase structured for easy AI coding agent onboarding and productivity
- **Documentation-Driven**: Comprehensive documentation and instructions for rapid context acquisition
- **Pattern-Based**: Consistent architectural patterns for predictable development workflows
- **Ghana-Centric**: Culturally appropriate design and functionality for the Ghanaian market