# Route Mounting Investigation - Job Service 404 Issue

**Date**: September 2025  
**Commit**: c07be773  
**Status**: 🔍 INVESTIGATING

## Critical Discovery: Conditional Route Mounting

### The Root Cause Hypothesis

After 6 deployments fixing gateway path transformation, discovered that **job-service routes are mounted CONDITIONALLY** after database connection via `mountApiRoutes()` function.

### Code Analysis

**Location**: `kelmah-backend/services/job-service/server.js` lines 175-185

```javascript
// Defer mounting API routes until DB is connected to avoid Mongoose buffering timeouts
let apiRoutesMounted = false;
const mountApiRoutes = () => {
  if (apiRoutesMounted) return;
  app.use("/api/jobs", jobRoutes);
  app.use("/api/bids", bidRoutes);
  app.use("/api/user-performance", userPerformanceRoutes);
  apiRoutesMounted = true;
  logger.info('✅ API routes mounted after DB connection');
};
```

**Mounting Call**: Line 258 - `mountApiRoutes()` called **INSIDE try block** after DB connection succeeds

```javascript
async function startServerWithDbRetry() {
  for (;;) {
    try {
      await connectDB();
      logger.info('✅ Job Service connected to MongoDB');
      
      // HTTP server starts here if not already started
      if (!httpServerStarted) {
        // ...
      }
      
      // Mount API routes once DB connection is ready
      mountApiRoutes();  // ← Called here after DB success
      break;
    } catch (err) {
      // Retry loop if DB fails
    }
  }
}
```

### The Suspected Issue

**Server Start Sequence** (lines 270-278):
1. HTTP server starts **IMMEDIATELY** so `/health` endpoint is available
2. `startServerWithDbRetry()` called **ASYNCHRONOUSLY**
3. Routes only mounted **AFTER** DB connection succeeds

**Potential Problems**:
1. If DB connection fails or hangs, routes **NEVER MOUNTED**
2. Requests arriving before DB connects hit 404 handler
3. No confirmation in production logs that routes actually mounted

### Debug Logging Added (Commit c07be773)

Added comprehensive logging to trace execution:

**1. Route Mounting Function**:
```javascript
const mountApiRoutes = () => {
  console.log('[ROUTE MOUNTING] mountApiRoutes() function called!');
  console.log('[ROUTE MOUNTING] apiRoutesMounted flag:', apiRoutesMounted);
  if (apiRoutesMounted) {
    console.log('[ROUTE MOUNTING] Routes already mounted, skipping');
    return;
  }
  console.log('[ROUTE MOUNTING] Mounting /api/jobs routes...');
  app.use("/api/jobs", jobRoutes);
  console.log('[ROUTE MOUNTING] Mounting /api/bids routes...');
  app.use("/api/bids", bidRoutes);
  console.log('[ROUTE MOUNTING] Mounting /api/user-performance routes...');
  app.use("/api/user-performance", userPerformanceRoutes);
  apiRoutesMounted = true;
  console.log('[ROUTE MOUNTING] ✅ All API routes mounted successfully!');
  logger.info('✅ API routes mounted after DB connection');
};
```

**2. DB Connection Attempt**:
```javascript
try {
  console.log('[DB CONNECTION] Attempting MongoDB connection...');
  await connectDB();
  console.log('[DB CONNECTION] ✅ MongoDB connection successful!');
  // ...
  console.log('[DB CONNECTION] About to mount API routes...');
  mountApiRoutes();
  console.log('[DB CONNECTION] Routes mounted, breaking retry loop');
  break;
}
```

**3. Server Startup**:
```javascript
if (require.main === module) {
  console.log('[SERVER START] Starting Job Service...');
  console.log('[SERVER START] Port:', PORT);
  console.log('[SERVER START] Environment:', process.env.NODE_ENV);
  // ...
  console.log('[SERVER START] Calling startServerWithDbRetry()...');
  startServerWithDbRetry();
}
```

### What to Look For in Production Logs

**If routes ARE mounting correctly**, you should see:
```
[SERVER START] Starting Job Service...
[SERVER START] Port: 5003
[DB CONNECTION] Attempting MongoDB connection...
[DB CONNECTION] ✅ MongoDB connection successful!
[DB CONNECTION] About to mount API routes...
[ROUTE MOUNTING] mountApiRoutes() function called!
[ROUTE MOUNTING] apiRoutesMounted flag: false
[ROUTE MOUNTING] Mounting /api/jobs routes...
[ROUTE MOUNTING] Mounting /api/bids routes...
[ROUTE MOUNTING] Mounting /api/user-performance routes...
[ROUTE MOUNTING] ✅ All API routes mounted successfully!
[DB CONNECTION] Routes mounted, breaking retry loop
```

**If routes NOT mounting**, you'll see:
- Missing `[ROUTE MOUNTING]` logs completely
- OR `[DB CONNECTION]` errors before mounting
- OR server starts but DB connection hangs

### Previous Investigation Results

**✅ Gateway Path Transformation** (Commit 7d88d898):
- Gateway correctly transforms `/api/jobs?query` → `/api/jobs/?query`
- Production logs confirm job-service receives correct path

**✅ Route Handler Debug Logging** (Commit 6a66e9e5):
- Added logging to route handler wrapper
- NO log output = route handler NEVER called
- Proves issue is NOT in controller or database

**❌ Path Transformation** (Commits 9fa4bc8d, 4f531ba6, 12212dd9):
- Multiple failed attempts to fix gateway path rewriting
- Eventually succeeded with ADD slash logic

### Next Steps

1. **Check production logs** for `[ROUTE MOUNTING]` output from commit c07be773
2. **Verify DB connection** succeeds in production
3. **Confirm route mounting** executes via logging output
4. **If routes not mounting**: Fix DB connection or change to immediate mounting
5. **If routes mounting**: Investigate Express route matching or middleware blocking

### Success Criteria

- Production logs show `[ROUTE MOUNTING] ✅ All API routes mounted successfully!`
- Requests to `/api/jobs/?status=open` reach route handler (see `[JOB ROUTES] GET / matched!` from commit 6a66e9e5)
- 404 errors resolve and job listings load correctly

## Historical Context

- **7 deployments total** (commits 9fa4bc8d, 4f531ba6, 12212dd9, 7d88d898, 3c6aed92, 6a66e9e5, c07be773)
- **User frustration high**: "wasting my time", concern about Render deployment limits
- **Gateway fixes complete**: Path transformation working correctly
- **Focus shifted**: From gateway to job-service internal routing

## Expected Timeline

- Commit c07be773 deploying now (~2-3 minutes)
- Check production logs after deployment
- Analyze `[ROUTE MOUNTING]` and `[DB CONNECTION]` log output
- Determine if routes mounting or DB connection failing
- Deploy fix based on root cause identified
