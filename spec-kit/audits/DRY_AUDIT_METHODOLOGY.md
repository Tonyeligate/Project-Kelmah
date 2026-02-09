# Kelmah Platform - Dry Audit Methodology

## Overview

This document provides a systematic approach for auditing code communication, processing, and connectivity flows from frontend to backend **without requiring live servers**. This methodology is essential when infrastructure costs limit the ability to run full backend services.

## Dry Audit Philosophy

**Principle**: Trace data flow, API contracts, and system integration by analyzing static code files in sequence, mapping the complete communication pipeline from user interaction to database operations.

## Core Methodology

### 1. Flow-Based File Inventory

For each feature/flow, create an ordered list of ALL files involved:

```
FLOW: User Login
├── Frontend Entry Points
│   ├── src/modules/auth/pages/LoginPage.jsx
│   ├── src/modules/auth/components/LoginForm.jsx
│   └── src/modules/auth/hooks/useAuth.js
├── Frontend Services
│   ├── src/modules/auth/services/authService.js
│   ├── src/modules/common/services/axios.js
│   └── src/config/environment.js
├── Gateway/Proxy
│   ├── kelmah-backend/api-gateway/server.js
│   ├── kelmah-backend/api-gateway/routes/index.js
│   └── kelmah-backend/api-gateway/proxy/auth.proxy.js
├── Backend Service
│   ├── kelmah-backend/services/auth-service/server.js
│   ├── kelmah-backend/services/auth-service/routes/auth.routes.js
│   ├── kelmah-backend/services/auth-service/controllers/authController.js
│   ├── kelmah-backend/services/auth-service/services/authService.js
│   └── kelmah-backend/services/auth-service/middleware/validation.js
└── Database Layer
    ├── kelmah-backend/services/auth-service/models/User.js
    └── kelmah-backend/services/auth-service/utils/tokenUtils.js
```

### 2. Sequential Code Analysis

For each file in the flow, document:
- **Input**: What data/parameters it expects
- **Processing**: What transformations/validations it performs
- **Output**: What it returns/passes to the next layer
- **Dependencies**: Other files/services it calls
- **Error Handling**: How failures are managed

### 3. Contract Mapping

Document the API contracts at each boundary:
- **Frontend → Gateway**: HTTP request format, headers, body structure
- **Gateway → Service**: Proxied request format, added headers, authentication
- **Service → Database**: Query format, data transformations
- **Return Path**: Response structure through each layer back to frontend

## Audit Templates

### Template A: REST API Flow Audit

```markdown
## AUDIT: [Feature Name] - [Date]

### 1. User Interaction Analysis
**File**: `path/to/component.jsx`
**Trigger**: [User action that starts the flow]
**Data Collected**: [Form fields, user input, state values]
**Validation**: [Client-side validation rules]

### 2. Frontend Service Layer
**File**: `path/to/service.js`
**API Endpoint**: [HTTP method and URL]
**Request Format**: 
```json
{
  "expectedRequestBody": "structure"
}
```
**Headers**: [Authorization, Content-Type, etc.]
**Error Handling**: [How errors are caught and displayed]

### 3. API Gateway Processing
**File**: `kelmah-backend/api-gateway/...`
**Routing Logic**: [How request is matched and forwarded]
**Middleware Applied**: [CORS, rate limiting, authentication]
**Destination Service**: [Which microservice receives the request]

### 4. Backend Service Processing
**Files Involved**:
- Route Handler: `services/[service]/routes/[route].js`
- Controller: `services/[service]/controllers/[controller].js`  
- Business Logic: `services/[service]/services/[service].js`
- Models: `services/[service]/models/[model].js`

**Processing Steps**:
1. Route validation and parameter extraction
2. Authentication/authorization checks
3. Business logic execution
4. Database operations
5. Response formatting

### 5. Data Flow Analysis
**Input Transformation**: [How frontend data becomes database operations]
**Database Schema**: [Tables/collections affected]
**Return Data Structure**: [What gets sent back to frontend]
**Frontend Integration**: [How response updates UI state]

### 6. Error Scenarios
**Validation Failures**: [Where and how validation errors occur]
**Authentication Errors**: [401/403 scenarios and handling]
**Business Logic Errors**: [Domain-specific error conditions]
**Database Errors**: [Connection, constraint, and operational failures]

### 7. Security Analysis
**Authentication Flow**: [How user identity is verified]
**Authorization Checks**: [Role/permission validation]
**Input Sanitization**: [SQL injection, XSS protection]
**Data Encryption**: [Sensitive data handling]
```

### Template B: WebSocket/Real-time Flow Audit

```markdown
## REAL-TIME AUDIT: [Feature Name] - [Date]

### 1. Connection Establishment
**Frontend Files**:
- Connection Logic: `path/to/websocketService.js`
- Context Provider: `path/to/context.jsx`
- Hook Implementation: `path/to/useSocket.js`

**Connection Flow**:
1. Socket.IO client initialization
2. Authentication token passing
3. Room/namespace joining
4. Event listener setup

### 2. Gateway WebSocket Proxy
**File**: `kelmah-backend/api-gateway/server.js`
**Proxy Configuration**: [Socket.IO proxy settings]
**URL Routing**: [How /socket.io requests are handled]
**Authentication**: [How tokens are validated for WebSocket]

### 3. Backend WebSocket Service
**Files**:
- Server Setup: `services/messaging-service/server.js`
- Socket Handlers: `services/messaging-service/sockets/[handler].js`
- Event Processors: `services/messaging-service/services/[processor].js`

**Event Flow Analysis**:
1. Connection authentication
2. User room assignment
3. Event emission/broadcasting
4. Data persistence
5. Real-time distribution

### 4. Data Synchronization
**State Management**: [How real-time data updates frontend state]
**Conflict Resolution**: [Handling simultaneous updates]
**Offline Handling**: [Queue management and sync on reconnect]
```

## Audit Execution Process

### Phase 1: Feature Mapping (15-30 minutes per feature)
1. Identify the user journey you want to audit
2. List ALL files involved from UI component to database
3. Create the file inventory using the flow-based structure

### Phase 2: Sequential Code Reading (2-5 minutes per file)
1. Open each file in the defined order
2. Trace the data flow: input → processing → output
3. Document API contracts, data transformations, error handling
4. Note dependencies and cross-service communications

### Phase 3: Contract Verification (10-15 minutes)
1. Verify frontend API calls match backend route definitions
2. Check request/response structure consistency
3. Validate authentication and authorization flows
4. Identify potential breaking points or mismatches

### Phase 4: Documentation (5-10 minutes)
1. Fill out the audit template with findings
2. Flag any inconsistencies or potential issues
3. Note areas requiring live testing once servers are available
4. Update spec-kit with the completed audit

## Integration with Spec-Kit

### Audit Storage Structure
```
spec-kit/
├── audits/
│   ├── DRY_AUDIT_METHODOLOGY.md (this file)
│   ├── api-flows/
│   │   ├── AUTH_FLOW_AUDIT.md
│   │   ├── MESSAGING_FLOW_AUDIT.md
│   │   ├── NOTIFICATION_FLOW_AUDIT.md
│   │   └── JOB_POSTING_FLOW_AUDIT.md
│   ├── websocket-flows/
│   │   ├── REALTIME_CHAT_AUDIT.md
│   │   └── NOTIFICATION_STREAMING_AUDIT.md
│   └── integration-points/
│       ├── FRONTEND_BACKEND_CONTRACTS.md
│       └── SERVICE_COMMUNICATION_MAP.md
```

### Audit Naming Convention
- `[FEATURE]_FLOW_AUDIT.md` for complete user journeys
- `[COMPONENT]_INTEGRATION_AUDIT.md` for system integration points
- `[SERVICE]_API_CONTRACT_AUDIT.md` for service-specific API analysis

## Benefits of This Methodology

1. **Cost-Effective**: No need for running expensive backend infrastructure
2. **Comprehensive**: Covers entire data flow from UI to database
3. **Systematic**: Ensures no communication points are missed
4. **Documentation**: Creates valuable system knowledge base
5. **Issue Prevention**: Identifies problems before deployment
6. **Team Knowledge**: Helps team understand system architecture
7. **Debugging Aid**: Provides clear roadmap for issue investigation

## When to Use Dry Auditing

- **Pre-deployment**: Before pushing new features to production
- **Architecture Changes**: When modifying system communication patterns
- **Team Onboarding**: To help new developers understand data flows
- **Debugging**: To trace the root cause of integration issues
- **Cost Management**: When live testing infrastructure is limited
- **Code Reviews**: To ensure changes maintain proper communication contracts

## Complementary Tools

- **Static Analysis**: Use with ESLint, TypeScript for additional validation
- **API Documentation**: Generate OpenAPI specs from route analysis
- **Dependency Mapping**: Create visual diagrams of service interactions
- **Test Planning**: Use audit findings to write targeted integration tests

---

**Next Steps**: Use this methodology to create specific flow audits for critical user journeys in your Kelmah platform. Start with authentication flow, then move to messaging and job posting features.