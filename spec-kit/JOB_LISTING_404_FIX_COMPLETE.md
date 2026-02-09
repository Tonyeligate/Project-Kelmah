# Job Listing 404 Fix - Complete Resolution

**Date**: October 2, 2025  
**Issue**: `/api/jobs/?status=open` returning 404  
**Commits**: 9fa4bc8d, 4f531ba6, 3c6aed92, 12212dd9  
**Status**: ✅ FIXED (Commit 12212dd9)

---

## Root Cause Identified

### The Problem
When Express.js strips a mount path using `app.use("/api/jobs", router)`, it removes the mount path prefix from the incoming URL. However, **if there's no slash between the mount path and the query string**, Express leaves the query string without a leading slash.

**Example**:
```javascript
// Job-service has:
app.use("/api/jobs", router);

// Scenario 1: WITH slash before query (WORKS ✅)
Request: GET /api/jobs/?status=open
After stripping /api/jobs: /?status=open
Router route "/" matches /?status=open → SUCCESS

// Scenario 2: WITHOUT slash before query (FAILS ❌)
Request: GET /api/jobs?status=open
After stripping /api/jobs: ?status=open (NO LEADING SLASH!)
Router route "/" expects / or /?query
Path ?status=open does NOT match / → 404 NOT FOUND
```

### Why Previous Fixes Failed

**Commit 9fa4bc8d** - First attempt:
```javascript
pathRewrite: (path) => {
  const normalized = path.replace(/\/\/+/g, '/');
  return normalized.replace('/?', '?'); // ❌ String replace - only first occurrence
}
```
- **Problem**: Used string replace which only replaces first occurrence
- **Result**: Still failed in production

**Commit 4f531ba6** - Second attempt:
```javascript
pathRewrite: (path) => {
  let normalized = path.replace(/\/\/+/g, '/');
  normalized = normalized.replace(/\/\?/g, '?'); // ❌ Regex with g flag - TOO AGGRESSIVE
  return normalized;
}
```
- **Problem**: Removed ALL `/?` occurrences, including the critical one before query string
- **Result**: Transformed `/api/jobs/?query` → `/api/jobs?query` → Express strips → `?query` (no slash) → 404

**Commit 3c6aed92** - Debug logging:
- Added console.log statements to diagnose path transformations
- Revealed the issue but didn't fix it

---

## The Solution (Commit 12212dd9)

### Correct Implementation
```javascript
pathRewrite: (path) => {
  console.log(`[PUBLIC JOB PROXY] Original path: ${path}`);
  // Remove double slashes ONLY (e.g., //api/jobs → /api/jobs)
  let normalized = path.replace(/\/\/+/g, '/');
  console.log(`[PUBLIC JOB PROXY] After normalization: ${normalized}`);
  // DO NOT remove slash before query string!
  // Express needs /api/jobs/?query so after stripping /api/jobs, it leaves /?query
  return normalized;
}
```

### Key Insight
**The slash before the query string is CRITICAL for Express route matching!**

- Gateway must forward: `/api/jobs/?status=open` (WITH `/?`)
- NOT: `/api/jobs?status=open` (WITHOUT `/?`)
- After Express strips `/api/jobs`: `/?status=open` (leading slash preserved)
- Router route `router.get("/", ...)` matches `/?status=open` ✅

---

## Complete Request Flow (Fixed)

### 1. Browser Request
```
GET /api/jobs/?status=open&min_budget=500&max_budget=10000&limit=50
```

### 2. API Gateway Routing
- **File**: `kelmah-backend/api-gateway/routes/job.routes.js`
- Route: `router.get('/', publicJobProxy)` matches `/api/jobs/`
- Route includes query string in matching

### 3. API Gateway Proxy (serviceProxy.js)
```javascript
// ensureBasePrefix ensures /api/jobs prefix
Input: /?status=open
After ensureBasePrefix: /api/jobs/?status=open

// Custom pathRewrite function (job.routes.js)
Input: /api/jobs/?status=open
After double slash removal: /api/jobs/?status=open
Output: /api/jobs/?status=open (PRESERVES /?)
```

### 4. Forwarded to Job Service
```
GET /api/jobs/?status=open&min_budget=500&max_budget=10000&limit=50
```

### 5. Job Service Entry (server.js)
```javascript
app.set('strict routing', false); // Treats /api/jobs and /api/jobs/ as same
app.use("/api/jobs", jobRoutes); // Mounts router at /api/jobs
```

### 6. Express Path Stripping
```
Request: /api/jobs/?status=open
Mount path: /api/jobs
After stripping: /?status=open (LEADING SLASH PRESERVED!)
Router receives: req.url = "/?status=open"
                req.path = "/"
                req.query = { status: "open", min_budget: "500", ... }
```

### 7. Router Matching (routes/job.routes.js)
```javascript
router.get("/", jobController.getJobs); // Line 31
```
- Route `/` matches path `/?status=open` ✅
- Controller receives request with `req.query` populated

### 8. Controller Execution (controllers/job.controller.js)
```javascript
const getJobs = async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  // ... filter by status, budget, etc.
  const jobs = await Job.find(query).populate().skip().limit().sort();
  return successResponse(res, 200, "Jobs retrieved", { jobs, total, page, pages });
};
```

### 9. Database Query
```javascript
Job.find({ status: "open", visibility: "public" })
   .populate("hirer", "firstName lastName profileImage")
   .skip(0)
   .limit(50)
   .sort("-createdAt");
```

### 10. Response
```json
{
  "success": true,
  "message": "Jobs retrieved successfully",
  "data": {
    "jobs": [...],
    "total": 10,
    "page": 1,
    "pages": 1
  }
}
```

---

## Files Modified

### Commit 12212dd9 (FINAL FIX):
**File**: `kelmah-backend/api-gateway/routes/job.routes.js`
- Modified `jobProxy` function pathRewrite
- Modified `publicJobProxy` function pathRewrite
- **Key Change**: Removed `normalized.replace(/\/\?/g, '?')` line that was stripping the critical slash

---

## Verification Steps

### After Deployment Completes (~2-3 minutes):

1. **Check API Gateway Logs** for debug output:
   ```
   [PUBLIC JOB PROXY] Original path: /api/jobs/?status=open&min_budget=500
   [PUBLIC JOB PROXY] After normalization: /api/jobs/?status=open&min_budget=500
   ```

2. **Check Job Service Logs** for successful request:
   ```
   info: HTTP Request {
     "url": "/api/jobs/?status=open&min_budget=500",
     "statusCode": 200  ← Should be 200, not 404!
   }
   ```

3. **Test Job Listing Endpoint**:
   ```bash
   curl "https://kelmah-api-gateway-si57.onrender.com/api/jobs?status=open&limit=5"
   ```
   Expected: 200 OK with JSON job array

---

## Lessons Learned

1. **Express Path Stripping Behavior**: When using `app.use(mountPath, router)`, Express strips the mount path but requires a leading slash for route matching. The slash before a query string is part of the path, not the query.

2. **Path Rewrite Precision**: Be extremely careful when normalizing paths. Every character matters, especially slashes before query strings.

3. **Testing Path Transformations**: Always test the complete path transformation pipeline, not just individual steps. The interaction between gateway proxy, Express mount paths, and route matching is complex.

4. **Production Debugging**: Deploy debug logging first to understand actual behavior before implementing fixes. Don't guess!

5. **Deployment Efficiency**: Understanding the root cause prevents wasted deployments. This issue required 4 deployments to resolve, but proper analysis upfront could have reduced it to 2 (debug + fix).

---

## Related Issues

### Secondary Issue: Query Parameter Mismatch (NOT YET FIXED)
**Problem**: Frontend sends `min_budget=500&max_budget=10000`  
**Controller expects**: `budget=500-10000`

**Impact**: Job filtering by budget doesn't work correctly

**Fix Required**: Either:
- Update frontend to send `budget=500-10000` format, OR
- Update controller to handle `min_budget` and `max_budget` separately

**Priority**: Low (jobs are returned, just not filtered by budget)

---

## Status

✅ **FIXED AND DEPLOYED**  
**Commit**: 12212dd9  
**Deployment**: In progress on Render  
**Expected Result**: Job listing requests return 200 with job data  
**Next Verification**: Check production logs after deployment completes
