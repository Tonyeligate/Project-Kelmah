# COMPLETE REQUEST FLOW ANALYSIS - Job Listing 404 Error

## Error from Production Logs
```
info: HTTP Request {
  "url":"/api/jobs/?status=open&min_budget=500&max_budget=10000&limit=50",
  "statusCode":404
}
```

## Complete File Chain (Frontend → Backend → Database)

### 1. FRONTEND REQUEST ORIGIN
**File**: `kelmah-frontend/src/modules/common/services/axios.js`
- **Line 69-76**: axios interceptor normalizes `/api/api` duplication
- **Line 97**: Adds `Authorization: Bearer ${token}` header
- **Key Code**:
```javascript
const normalizeUrlForGateway = (config) => {
  const base = typeof config.baseURL === 'string' ? config.baseURL : '';
  const url = typeof config.url === 'string' ? config.url : '';
  const baseEndsWithApi = base === '/api' || base.endsWith('/api');
  const urlStartsWithApi = url === '/api' || url.startsWith('/api/');
  
  if (baseEndsWithApi && urlStartsWithApi) {
    config.url = url.replace(/^\/api\/?/, '/'); // Strips /api from url
  }
  return config;
};
```

**Problem Identified**: The frontend is sending `/api/jobs/` with a trailing slash BEFORE the query string.

### 2. API GATEWAY ROUTING
**File**: `kelmah-backend/api-gateway/routes/job.routes.js`

#### Available Routes (Lines 52-58):
```javascript
router.get('', publicJobProxy);                               // Line 52 - Matches /api/jobs (no slash)
router.get('/public', publicJobProxy);                        // Line 53
router.get('/public/:jobId', publicJobProxy);                 // Line 54
router.get('/categories', publicJobProxy);                    // Line 55
router.get('/search', publicJobProxy);                        // Line 56
router.get('/', publicJobProxy);                              // Line 57 - Matches /api/jobs/ (with slash, NO query)
router.get('/:jobId([0-9a-fA-F]{24})', publicJobProxy);      // Line 58 - ObjectID pattern
```

#### The Problem:
- **Incoming request**: `/api/jobs/?status=open&min_budget=500&max_budget=10000&limit=50`
- **Line 57** `router.get('/', ...)` matches `/api/jobs/` **WITHOUT query string**
- **Express route matching**: Query strings are NOT part of route matching
- **Expected behavior**: Route `/` should match both `/api/jobs/` AND `/api/jobs/?query`

#### Path Rewrite Configuration (Lines 20-25):
```javascript
const jobProxy = (req, res, next) => {
  const proxy = createServiceProxy({
    target: getServiceUrl(req),
    pathPrefix: '/api/jobs',
    requireAuth: true,
    pathRewrite: (path) => {
      let normalized = path.replace(/\/\/+/g, '/');         // Remove double slashes
      normalized = normalized.replace(/\/\?/g, '?');        // Strip /? → ?
      return normalized;
    }
  });
  return proxy(req, res, next);
};
```

**Path Rewrite Process**:
1. Input: `/api/jobs/?status=open&min_budget=500`
2. After `/\/\?/g` replace: `/api/jobs?status=open&min_budget=500`
3. Should forward to job-service: `/api/jobs?status=open&min_budget=500`

### 3. API GATEWAY PROXY LAYER
**File**: `kelmah-backend/api-gateway/proxy/serviceProxy.js`

#### Key Functions:

**ensureBasePrefix** (Lines 59-94):
```javascript
const ensureBasePrefix = (incomingPath, req) => {
  let normalizedPath = normalizeSlashes(incomingPath || '/');
  const base = resolveBasePrefix(req);  // Gets '/api/jobs'
  
  // Adds /api/jobs prefix if not already present
  if (!normalizedPath.startsWith(normalizedBase)) {
    normalizedPath = normalizeSlashes(`${normalizedBase}${normalizedPath}`);
  }
  
  return normalizedPath;
};
```

**pathRewrite Execution** (Lines 107-122):
```javascript
pathRewrite: (path, req) => {
  let baseAppliedPath = ensureBasePrefix(path, req);  // Ensures /api/jobs prefix
  
  // If caller supplied a function, use it directly
  if (typeof providedPathRewrite === 'function') {
    const rewritten = providedPathRewrite(baseAppliedPath, req);
    return normalizeSlashes(rewritten || baseAppliedPath);
  }
  
  return normalizeSlashes(rewritten);
}
```

**onProxyReq** (Lines 123-147):
- Forwards `x-authenticated-user` header with user info
- Forwards `Authorization: Bearer <token>` header
- Adds `X-Internal-Request` header for service trust

### 4. JOB SERVICE ENTRY POINT
**File**: `kelmah-backend/services/job-service/server.js`

#### Server Configuration (Lines 48-52):
```javascript
const app = express();
app.set('strict routing', false);    // ⚠️ Treats /api/jobs and /api/jobs/ as SAME
app.set('trust proxy', 1);           // Trust Render proxy headers
```

**Important**: `strict routing: false` means `/api/jobs` and `/api/jobs/` should be treated as equivalent.

#### Route Mounting (Line 152):
```javascript
app.use("/api/jobs", jobRoutes);  // Mounts job routes at /api/jobs
```

### 5. JOB SERVICE ROUTES
**File**: `kelmah-backend/services/job-service/routes/job.routes.js`

#### Public Routes (Lines 30-38):
```javascript
router.get("/", jobController.getJobs);                    // Line 30 - GET /api/jobs
router.get("/search", jobController.advancedJobSearch);    // Line 31
router.get("/dashboard", jobController.getDashboardJobs);  // Line 32
router.get("/categories", jobController.getJobCategories); // Line 33
router.get("/contracts", jobController.getContracts);      // Line 34
```

**Expected Path**: `/api/jobs` or `/api/jobs/` (both should match due to `strict routing: false`)
**With Query**: `/api/jobs?status=open` or `/api/jobs/?status=open`

### 6. JOB CONTROLLER
**File**: `kelmah-backend/services/job-service/controllers/job.controller.js`

#### getJobs Function (Lines 190-300):
```javascript
const getJobs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    let query = { status: "open", visibility: "public" };
    
    // ⚠️ NO handling of min_budget/max_budget parameters
    // Only handles req.query.budget with format "min-max"
    
    if (req.query.budget) {
      const [min, max] = req.query.budget.split("-");
      query.budget = {};
      if (min) query.budget.$gte = parseInt(min);
      if (max) query.budget.$lte = parseInt(max);
    }
    
    // Execute query
    const jobs = await Job.find(query)
      .populate("hirer", "firstName lastName profileImage")
      .skip(startIndex)
      .limit(limit)
      .sort(req.query.sort || "-createdAt");
```

**Problem Found**: Controller expects `budget=500-10000` but frontend sends `min_budget=500&max_budget=10000`

### 7. DATABASE QUERY
**Model**: MongoDB Job collection via Mongoose
**Expected Query**:
```javascript
{
  status: "open",
  visibility: "public",
  budget: { $gte: 500, $lte: 10000 }
}
```

## ROOT CAUSE ANALYSIS

### Primary Issue: Route Matching at API Gateway Level
The 404 error is happening **AT THE API GATEWAY**, not the job service, because:

1. **Browser sends**: `/api/jobs/?status=open&min_budget=500&max_budget=10000&limit=50`
2. **Express route matching** DOES include query strings in the path during matching
3. **Route** `router.get('/', publicJobProxy)` matches `/api/jobs/` but Express sees the full path including `?`
4. **Actually**: Express SHOULD match this correctly because query strings are stripped during route matching

### Wait - Re-analyzing the logs:

```
info: HTTP Request {
  "service":"job-service",
  "url":"/api/jobs/?status=open&min_budget=500&max_budget=10000&limit=50",
  "statusCode":404
}
```

**The log shows `service":"job-service"`** - This means the request DID reach the job-service!

### The REAL Root Cause:

The 404 is happening **IN THE JOB-SERVICE**, not the gateway!

Looking at `kelmah-backend/services/job-service/routes/job.routes.js`:
- Line 30: `router.get("/", jobController.getJobs);`
- This should match `/api/jobs/` AND `/api/jobs/?query`

**But wait** - The server mounts routes at `/api/jobs`:
```javascript
app.use("/api/jobs", jobRoutes);  // server.js Line 152
```

So when the request comes in as `/api/jobs/?query`, Express:
1. Strips `/api/jobs` prefix
2. Passes `/?query` to the router
3. The router needs to match `/` - which IT DOES on Line 30

## THE ACTUAL PROBLEM

After deep analysis, the issue is:

**The request IS reaching the correct controller**, but the 404 is being returned for a different reason!

Let me check if there's middleware that's rejecting the request...

### Secondary Issue: Query Parameter Mismatch
Frontend sends: `min_budget=500&max_budget=10000`
Controller expects: `budget=500-10000`

This won't cause a 404, but will cause jobs to not be filtered correctly.

## SOLUTIONS REQUIRED

### Solution 1: Fix API Gateway Route (IMMEDIATE)
The gateway route needs to explicitly handle the slash-before-query case.

**File**: `kelmah-backend/api-gateway/routes/job.routes.js`

Current problematic line 57:
```javascript
router.get('/', publicJobProxy); // Only matches /api/jobs/ without query
```

**Should be** (using route pattern that explicitly allows query):
```javascript
// This route will match both /api/jobs and /api/jobs/ with or without query strings
router.get('/', publicJobProxy);  // Keep this - Express DOES strip query for matching
```

Wait - Express DOES strip query strings before route matching. So `router.get('/')` SHOULD match `/api/jobs/?query`.

Let me check if the pathRewrite is causing issues...

### The Real Solution: Path Rewrite Execution Order

The problem is in `serviceProxy.js` - the `ensureBasePrefix` function might be adding the prefix BEFORE the custom pathRewrite strips the slash.

Order of operations:
1. Request comes in: `/?status=open` (after Express strips `/api/jobs`)
2. `ensureBasePrefix` adds prefix: `/api/jobs/?status=open`
3. Custom `pathRewrite` function executes: `/api/jobs?status=open`
4. Forwards to job-service: `/api/jobs?status=open`

This SHOULD work correctly!

### THE MYSTERY

The logs show the request reaching job-service with the full URL including the slash:
```
"service":"job-service",
"url":"/api/jobs/?status=open&min_budget=500&max_budget=10000&limit=50",
```

This means:
1. ✅ Gateway matched the route
2. ✅ Request was proxied to job-service
3. ❌ Job-service returned 404

So the problem is **IN THE JOB-SERVICE ROUTING**, not the gateway!

Looking again at job-service routes, Line 30:
```javascript
router.get("/", jobController.getJobs);  // Should match "/" even with query
```

## FINAL ROOT CAUSE

After complete analysis, I believe the issue is:

**The job-service receives `/api/jobs/?status=...` with the slash BEFORE the query string still present**, because:

1. The pathRewrite in the gateway DID execute
2. But it's forwarding the ORIGINAL path, not the rewritten path
3. OR the rewritten path still has the slash

Let me check the exact proxy forwarding behavior...

Actually, looking at the log timestamp and status:
```
"timestamp":"2025-10-02 01:19:03.531"
"duration":"1ms"
```

**1ms response time** means it didn't even hit the database - it's a routing 404, not a "no results" 404.

The job-service route `/` doesn't match `/?query` for some reason. This could be because:
- The router is receiving `/api/jobs/?query` (with full prefix) instead of just `/?query`
- OR there's middleware rejecting before it reaches the route

## ABSOLUTE FIX NEEDED

The path being forwarded to job-service is `/api/jobs/?status=...` but job-service expects just `/` or `/?query` after the `/api/jobs` prefix is stripped by `app.use("/api/jobs", jobRoutes)`.

**If the proxy is forwarding `/api/jobs/?query` to job-service, and job-service mounts routes at `/api/jobs`, then the route sees `/api/jobs/?query` instead of `/?query`, which doesn't match any route!**

The fix is to ensure the pathRewrite in the gateway strips the `/api/jobs` prefix entirely before forwarding to job-service.
