# COMPLETE FILE INVENTORY - Job Listing 404 Error

## CURRENT STATUS: DIAGNOSTIC LOGGING DEPLOYED
**Commit**: 3c6aed92  
**Deployed to**: GitHub (Render auto-deployment in progress)  
**Purpose**: Track exact path transformations to identify where `/api/jobs/?query` → `/api/jobs?query` fails

---

## COMPLETE REQUEST FLOW FILE LIST

### 1. FRONTEND REQUEST ORIGIN
**File**: `kelmah-frontend/src/modules/common/services/axios.js`
- **Purpose**: Centralized axios instance with interceptors
- **Key Functions**:
  - `normalizeUrlForGateway()` - Prevents `/api/api` duplication (Lines 69-84)
  - Request interceptor - Adds auth token (Lines 97-118)
- **Issue**: Unknown where frontend generates `/api/jobs/?status=...` with extra slash

---

### 2. API GATEWAY - ROUTE DEFINITION
**File**: `kelmah-backend/api-gateway/routes/job.routes.js`
- **Purpose**: Define proxy routes for job-service
- **Key Routes**:
  - Line 52: `router.get('', publicJobProxy)` - No trailing slash
  - Line 57: `router.get('/', publicJobProxy)` - With trailing slash
  - Line 58: `router.get('/:jobId([0-9a-fA-F]{24})', publicJobProxy)` - ObjectID pattern
- **Proxy Functions**:
  - `jobProxy()` (Lines 14-28) - Authenticated job proxy
  - `publicJobProxy()` (Lines 31-45) - Public job browsing
- **Path Rewrite Logic** (NOW WITH DEBUG LOGGING):
  ```javascript
  pathRewrite: (path) => {
    console.log(`[PUBLIC JOB PROXY] Original path: ${path}`);
    let normalized = path.replace(/\/\/+/g, '/');
    console.log(`[PUBLIC JOB PROXY] After double slash removal: ${normalized}`);
    normalized = normalized.replace(/\/\?/g, '?');
    console.log(`[PUBLIC JOB PROXY] After slash-before-query removal: ${normalized}`);
    return normalized;
  }
  ```
- **Current Status**: Debug logging added to track path transformations

---

### 3. API GATEWAY - PROXY LAYER
**File**: `kelmah-backend/api-gateway/proxy/serviceProxy.js`
- **Purpose**: Create proxy middleware for service routing
- **Key Functions**:
  - `createServiceProxy()` (Lines 18-169) - Main proxy factory
  - `ensureBasePrefix()` (Lines 59-94) - Ensures `/api/jobs` prefix is present
  - `normalizeSlashes()` (Lines 47-50) - Collapses double slashes
  - `pathRewrite()` (Lines 107-126) - Executes custom rewrite, NOW WITH DEBUG LOGGING
- **Path Transformation Pipeline**:
  1. Input: `path` param (e.g., `/?status=open`)
  2. `ensureBasePrefix()`: Adds `/api/jobs` → `/api/jobs/?status=open`
  3. Custom `providedPathRewrite()`: Strips `/? ` → `/api/jobs?status=open`
  4. `normalizeSlashes()`: Collapses any `//` → `/api/jobs?status=open`
  5. Forwards to job-service: `/api/jobs?status=open`
- **Current Status**: Debug logging added at each transformation step

---

### 4. API GATEWAY - SERVER
**File**: `kelmah-backend/api-gateway/server.js`
- **Purpose**: Main gateway server with service registry
- **Service Registry** (Lines 32-39):
  ```javascript
  const SERVICES = {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:5001',
    job: process.env.JOB_SERVICE_URL || 'http://localhost:5003',
    user: process.env.USER_SERVICE_URL || 'http://localhost:5002',
    // ...
  };
  ```
- **Route Mounting** (Line ~150):
  ```javascript
  app.use('/api/jobs', jobRoutes);  // Mounts job routes
  ```

---

### 5. JOB SERVICE - SERVER ENTRY POINT
**File**: `kelmah-backend/services/job-service/server.js`
- **Purpose**: Job service Express app initialization
- **Key Configuration**:
  - Line 48: `app.set('strict routing', false)` - Treats `/api/jobs` and `/api/jobs/` as same
  - Line 49: `app.set('trust proxy', 1)` - Trust proxy headers
  - Line 152: `app.use("/api/jobs", jobRoutes)` - Mounts job routes at `/api/jobs`
- **Middleware Order**:
  1. HTTP logging (via `createHttpLogger()`)
  2. JSON body parsing
  3. CORS
  4. Health endpoints (BEFORE rate limiting)
  5. Rate limiting
  6. Route handlers

---

### 6. JOB SERVICE - HTTP LOGGER
**File**: `kelmah-backend/services/job-service/utils/logger.js`
- **Purpose**: Winston-based logging for job service
- **Key Function**: `createHttpLogger()` (Lines 95-119)
  - Line 100-104: Logs `req.url` (URL as received by service)
  - Line 113-116: Logs response status and duration
- **Important**: Logs show `/api/jobs/?status=...` proving pathRewrite didn't execute or failed
- **Log Format**:
  ```json
  {
    "timestamp": "2025-10-02 01:19:03.531",
    "method": "GET",
    "url": "/api/jobs/?status=open&min_budget=500",
    "statusCode": 404
  }
  ```

---

### 7. JOB SERVICE - ROUTE DEFINITIONS
**File**: `kelmah-backend/services/job-service/routes/job.routes.js`
- **Purpose**: Define job-related endpoints
- **Public Routes** (Lines 31-37):
  ```javascript
  router.get("/", jobController.getJobs);                    // Line 31
  router.get("/search", jobController.advancedJobSearch);    // Line 32
  router.get("/dashboard", jobController.getDashboardJobs);  // Line 33
  router.get("/categories", jobController.getJobCategories); // Line 34
  router.get("/contracts", jobController.getContracts);      // Line 35
  ```
- **Middleware Split** (Line 40):
  ```javascript
  router.use(verifyGatewayRequest);  // All routes after this require gateway auth
  ```
- **Expected Path**: `/` or `/?query` (after `/api/jobs` is stripped by `app.use("/api/jobs", router)`)

---

### 8. JOB SERVICE - CONTROLLER
**File**: `kelmah-backend/services/job-service/controllers/job.controller.js`
- **Purpose**: Handle job-related business logic
- **Key Function**: `getJobs()` (Lines 190-320)
  - Pagination: `page`, `limit` params
  - Filtering: `category`, `skills`, `budget`, `location`, etc.
  - **Budget Handling** (Lines 212-218):
    ```javascript
    if (req.query.budget) {
      const [min, max] = req.query.budget.split("-");
      query.budget = {};
      if (min) query.budget.$gte = parseInt(min);
      if (max) query.budget.$lte = parseInt(max);
    }
    ```
  - **⚠️ Issue**: Expects `budget=500-10000`, but frontend sends `min_budget=500&max_budget=10000`
- **Database Query**: `Job.find(query).populate().skip().limit().sort()`

---

### 9. DATABASE MODELS
**File**: `kelmah-backend/services/job-service/models/index.js`
- **Purpose**: Export all models for job service
- **Imports from**: `../../../shared/models/` (centralized models)
- **Models Used**:
  - `Job` - Job postings schema
  - `User` - User profiles (for population)
  - `Application` - Job applications
  - `SavedJob` - Saved jobs
  - `Bid` - Job bidding
  - `Contract` - Job contracts

**File**: `kelmah-backend/shared/models/Job.js`
- **Purpose**: Mongoose schema for Job collection
- **Key Fields**:
  - `title`, `description`, `category`, `skills`
  - `budget` (Number), `currency` (default: 'GHS')
  - `status` ('open', 'in_progress', 'completed', 'cancelled')
  - `visibility` ('public', 'private')
  - `location` (Object with type, address, coordinates)

---

## ROOT CAUSE ANALYSIS

### Why the 404 Happens

Based on production logs showing `/api/jobs/?status=...` reaching job-service:

**Hypothesis 1: Path Rewrite Not Executing**
- The `pathRewrite` function in `serviceProxy.js` may not be executing
- OR the custom rewrite function in `job.routes.js` returns undefined/null
- OR there's an error in the rewrite pipeline that's silently caught

**Hypothesis 2: Path Rewrite Executing But Forwarding Original**
- `http-proxy-middleware` may be ignoring the pathRewrite result
- OR there's a bug in how we're constructing the rewrite function

**Hypothesis 3: Route Matching Issue in Job Service**
- Job service receives `/api/jobs/?query` with full prefix intact
- `app.use("/api/jobs", router)` strips `/api/jobs` → `/?query`
- Route `router.get("/", ...)` should match `/?query` but doesn't
- Possible: Express strict routing behavior or query string handling

**Hypothesis 4: Middleware Rejection**
- `verifyGatewayRequest` middleware (Line 40) may be rejecting before route matches
- BUT public routes come BEFORE `router.use(verifyGatewayRequest)`, so this is unlikely

---

## DEBUG STRATEGY

### Phase 1: Deployed Debug Logging (Commit 3c6aed92)
**What We Added:**
- Console.log in `publicJobProxy` pathRewrite function (job.routes.js Lines 36-45)
- Console.log in `serviceProxy` pathRewrite pipeline (serviceProxy.js Lines 107-123)
- Tracks: Input path → ensureBasePrefix → custom rewrite → normalizeSlashes

**Expected Logs in Render**:
```
[SERVICE PROXY] Input path: /?status=open&min_budget=500, baseUrl: /api/jobs
[SERVICE PROXY] After ensureBasePrefix: /api/jobs/?status=open&min_budget=500
[PUBLIC JOB PROXY] Original path: /api/jobs/?status=open&min_budget=500
[PUBLIC JOB PROXY] After double slash removal: /api/jobs/?status=open&min_budget=500
[PUBLIC JOB PROXY] After slash-before-query removal: /api/jobs?status=open&min_budget=500
[SERVICE PROXY] After custom rewrite function: /api/jobs?status=open&min_budget=500
[SERVICE PROXY] After normalizeSlashes: /api/jobs?status=open&min_budget=500
Proxying GET /api/jobs/?status=open to http://job-service:5003/api/jobs?status=open
```

**What to Look For**:
1. Does the pathRewrite function execute at all?
2. Does it correctly transform `/api/jobs/?query` → `/api/jobs?query`?
3. Does `http-proxy-middleware` forward the rewritten path or original path?

---

### Phase 2: Frontend Investigation (NEXT STEP IF DEBUG SHOWS REWRITE WORKING)
**Files to Check**:
- Where is the frontend making the request with `/api/jobs/?status=...`?
- Why does it include the extra slash before the query string?
- Should frontend be sending `/api/jobs?status=...` instead?

**Possible Locations**:
- `kelmah-frontend/src/modules/jobs/` - Job listing components
- `kelmah-frontend/src/modules/common/services/` - API service files
- Check for string concatenation like: `${baseUrl}/?query` instead of `${baseUrl}?query`

---

### Phase 3: Alternative Fix (IF DEBUG SHOWS REWRITE ISN'T WORKING)
**Option A: Fix at Frontend**
- Make frontend send `/api/jobs?status=...` (no slash before query)
- Clean, but requires finding and fixing frontend code

**Option B: Fix Gateway Route Matching**
- Use `router.use('/', publicJobProxy)` instead of `router.get('/', publicJobProxy)`
- Catches ALL methods and paths under `/api/jobs/`

**Option C: Strip Path Prefix Entirely**
- Make pathRewrite return `/?query` instead of `/api/jobs?query`
- But this requires job-service to NOT mount at `/api/jobs`

---

## NEXT STEPS FOR USER

### Immediate Actions:
1. **Wait for Render Deployment** (~2-3 minutes from push at 3c6aed92)
2. **Check Render API Gateway Logs** for console.log debug statements
3. **Test Job Listing** - Browse jobs to trigger the request
4. **Share Debug Logs** - Copy console.log output showing path transformations

### What We're Looking For:
- Confirm pathRewrite executes and transforms path correctly
- Identify if `http-proxy-middleware` forwards rewritten or original path
- Determine if issue is in gateway proxy or job-service routing

### If Debug Shows Rewrite Working Correctly:
- Issue is in job-service routing, not gateway
- Need to investigate Express route matching with query strings
- May need to adjust how job-service handles the path

### If Debug Shows Rewrite NOT Executing:
- Issue is in how we're passing pathRewrite function to createServiceProxy
- May need to fix function signature or parameter passing
- OR `http-proxy-middleware` has specific requirements we're not meeting

---

## PRODUCTION CONSTRAINTS

**User's Requirement**: "I have limit to my render so I have to avoid deploying anyhow"
**Current Approach**: Deploy ONLY debug logging to diagnose, NOT experimental fixes
**Rationale**: Once we see exact path transformation behavior, we can implement ONE correct fix

**Deployment Count**:
- Commit 9fa4bc8d: First fix attempt (string replace) - FAILED
- Commit 4f531ba6: Second fix attempt (regex replace) - FAILED
- Commit 3c6aed92: Debug logging - IN PROGRESS

**Next Deployment**: Will be the FINAL CORRECT FIX based on debug log analysis

---

## FILES MODIFIED IN THIS SESSION

### Commit 3c6aed92 (Debug Logging):
1. `kelmah-backend/api-gateway/routes/job.routes.js` - Added console.log to pathRewrite
2. `kelmah-backend/api-gateway/proxy/serviceProxy.js` - Added console.log to pathRewrite pipeline

### Documentation Created:
1. `COMPLETE_REQUEST_FLOW_ANALYSIS.md` - Full request flow analysis
2. `test-path-rewrite-analysis.js` - Path rewrite behavior test script
3. This file: `COMPLETE_FILE_INVENTORY_JOB_404.md`
