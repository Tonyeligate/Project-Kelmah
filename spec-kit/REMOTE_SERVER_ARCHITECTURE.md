# Remote Server Architecture Documentation

## Updated Understanding ✅

### Architecture Clarification
**IMPORTANT**: The microservices do **NOT** run on the local development machine. They run on a **remote server**.

### Actual Service Deployment
```
Local Machine (Development):
├── kelmah-frontend/ (Vite dev server OR deployed to Vercel)
├── ngrok-manager.js (creates tunnels to remote server)
└── API Gateway configuration files

Remote Server (Production):
├── API Gateway (port 5000)
├── Auth Service (port 5001) 
├── User Service (port 5002)
├── Job Service (port 5003) 
├── Payment Service (port 5004)
├── Messaging Service (port 5005)
├── Review Service (port 5006)
└── MongoDB clusters
```

### Request Flow (Corrected)
```
1. Frontend (Local/Vercel) → Vercel rewrites /api/* 
2. → ngrok tunnel (298fb9b8181e.ngrok-free.app)
3. → Remote Server API Gateway (port 5000)
4. → Remote Server microservices (ports 5001-5006)
```

## Application → Contract → Payment Flow (Current Behavior)

### Step-by-step workflow
1. Worker applies to a job
   - UI: `MyApplicationsPage` and job detail pages
   - API: `POST /api/jobs/:id/apply`
   - Data: `Application` document created with `status: pending`

2. Hirer accepts an application (auto-contract)
   - UI: `ApplicationManagementPage`
   - API: `PUT /api/jobs/:id/applications/:applicationId`
   - Data updates:
     - `Application.status = accepted`
     - `Job.status = in-progress`, `Job.worker = application.worker`
     - Other pending applications for the job → `rejected`
     - Draft `Contract` created (if none exists for job + worker)

3. Hirer reviews and sends contract
   - UI: `ContractsPage`, `ContractManagementPage`
   - API: `GET /api/jobs/contracts`, `PUT /api/jobs/contracts/:id`
   - Data: `Contract.status` moves `draft → pending`

4. Worker signs contract
   - UI: contract detail screen
   - API: `PUT /api/jobs/contracts/:id` with `status: active`
   - Data: `Contract.status = active`

5. Work and milestone tracking
   - API: `POST /api/jobs/milestones/contract/:contractId`
   - API: `PUT /api/jobs/milestones/:milestoneId`
   - Data: `Contract.milestones[]` progress updates

6. Payment and escrow release
   - Service: Payment service (Escrow, Transaction)
   - API: `/api/payments/*` and escrow endpoints (when enabled)
   - Data: Escrow holds funds and releases on milestone approval

### Data flow trace (accepted application → contract visible)
```
ApplicationManagementPage.jsx
  → hirerService.updateApplicationStatus(jobId, applicationId, status)
  → PUT /api/jobs/:id/applications/:applicationId
  → api-gateway → job-service routes/job.routes.js
  → job.controller.js:updateApplicationStatus()
      - Application status update
      - Job assignment
      - Contract draft creation
  → response (application)
  → UI reloads applications + worker sees contract in My Contracts
```

### WebSocket Flow (Corrected)
```
1. Frontend → Vercel rewrites /socket.io/*
2. → ngrok WebSocket tunnel (e74c110076f4.ngrok-free.app) 
3. → Remote Server Messaging Service (port 5005)
```

## Ngrok Configuration Impact

### Purpose of Ngrok Tunnels
- **Primary Function**: Create secure tunnels from internet → remote server
- **Not localhost tunnels**: Tunnels connect external traffic to remote server ports
- **Development Access**: Allows local frontend to access remote backend services

### Fixed Configuration Alignment
All previous fixes remain valid and necessary:

1. **WebSocket Tunnel Port Fix** ✅
   - Fixed from port 3005 → 5005 to match remote messaging service
   - Ensures WebSocket connections reach the correct remote service

2. **Frontend Fallback URL Fix** ✅
   - Updated fallback from localhost:3003 → localhost:5005
   - Maintains consistency even though services are remote

3. **API Gateway Routing** ✅
   - Service registry correctly maps to remote service URLs
   - Environment variables point to remote service endpoints

## Service Health Verification

### Current Health Check Results
Based on previous tests via ngrok → remote server:
- ✅ Auth Service (5001): Working
- ✅ User Service (5002): Working
- ❌ Job Service (5003): Not responding
- ❌ Payment Service (5004): Not responding  
- ❌ Messaging Service (5005): Not responding
- ❌ Review Service (5006): Not responding

### Remote Server Status
The missing services need to be started on the **remote server**, not locally:
```bash
# Commands to run ON THE REMOTE SERVER
cd /path/to/kelmah-backend/services/job-service && npm start
cd /path/to/kelmah-backend/services/payment-service && npm start
cd /path/to/kelmah-backend/services/messaging-service && npm start  
cd /path/to/kelmah-backend/services/review-service && npm start
```

## Development Workflow Impact

### What Runs Locally
- Frontend development server (npm run dev)
- ngrok tunnel creation scripts
- Configuration and testing scripts

### What Runs Remotely  
- All backend microservices
- API Gateway 
- MongoDB databases
- Socket.IO messaging service

### Why This Architecture Works
1. **Separation of Concerns**: Frontend development isolated from backend complexity
2. **Consistent Environment**: Backend runs in production-like environment
3. **Easy Scaling**: Remote services can be scaled independently
4. **Security**: Database access restricted to remote server environment
5. **Team Collaboration**: Multiple developers can access same backend instance

## Next Steps
1. **Service Startup**: Start missing services on remote server
2. **Health Verification**: Test all services via ngrok health endpoints
3. **End-to-End Testing**: Verify complete request flow functionality
4. **Documentation Update**: Update any references to "localhost services"