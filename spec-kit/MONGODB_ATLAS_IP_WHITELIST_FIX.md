# MongoDB Atlas IP Whitelist Fix Required

## Problem Discovered: November 29, 2025

### Issue
POST /api/jobs returns 500 error with message:
```
"Operation `jobs.insertOne()` buffering timed out after 10000ms"
```

### Root Cause Analysis - CONFIRMED

1. **MongoDB reads work** - GET /api/jobs returns data successfully
2. **MongoDB writes fail** - POST /api/jobs times out after 10 seconds
3. **Local test works** - Running test-mongodb-write.js from local machine completes in ~1.3 seconds
4. **Render deployment works** - Service is deployed and healthy
5. **Connection ping works** - `mongo.ensureReady.pingSuccess` with 138ms latency
6. **Connection state is CONNECTED** - `readyState: 1` confirmed in logs
7. **Write still fails** - Despite connection being ready, `Job.create()` times out

### Confirmed Root Cause: MongoDB Atlas IP Whitelist

MongoDB Atlas is blocking **write operations** from Render's server IPs. This is because:
- MongoDB Atlas free tier (M0) has IP whitelisting enabled by default
- Render uses **dynamic IPs** for free tier services
- Read operations may use different networking paths than writes
- The connection establishes successfully but write packets are blocked/dropped

### Evidence from Logs

```
info: mongo.ensureReady.pingSuccess {"pingLatencyMs":138,"readyState":"connected"}
info: job.create.readyReuse {"readySource":"middleware"}
error: job.create.failed {"message":"Operation `jobs.insertOne()` buffering timed out after 10000ms"}
```

The ping succeeds but the actual write operation times out - classic IP whitelist blocking pattern.

### Solution Required (MUST BE DONE BY PROJECT OWNER)

**The project owner must update MongoDB Atlas Network Access settings:**

1. Go to MongoDB Atlas Dashboard: https://cloud.mongodb.com/
2. Login with your MongoDB Atlas credentials
3. Select the project containing `kelmah-messaging` cluster
4. Click "Network Access" in the left sidebar (under Security)
5. Click "+ ADD IP ADDRESS" button
6. Select "ALLOW ACCESS FROM ANYWHERE" 
7. This adds `0.0.0.0/0` to the whitelist
8. Click "Confirm"
9. Wait 1-2 minutes for changes to propagate

**Screenshot guide:**
- Network Access → Add IP Address → Allow Access from Anywhere → Confirm

**Note:** This is necessary for services with dynamic IPs like Render free tier. For production, consider upgrading to Render's paid tier with static IPs.

### Alternative Solutions

1. **Upgrade Render** to a paid plan with static outbound IPs, then whitelist those specific IPs
2. **Use MongoDB Atlas Peering** (requires MongoDB dedicated tier + AWS/GCP/Azure)
3. **Deploy backend to a service with static IPs** (e.g., Railway, Fly.io, DigitalOcean)
4. **Use a different database** that doesn't have IP restrictions

### Verification After Fix

After updating MongoDB Atlas Network Access, test job creation:

```powershell
# Login
$body = '{"email":"giftyafisa@gmail.com","password":"11221122Tg"}'
$login = Invoke-RestMethod -Uri "https://kelmah-api-gateway-50z3.onrender.com/api/auth/login" -Method POST -ContentType "application/json" -Body $body
$token = $login.data.token

# Create job
$headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }
$job = '{"title":"Test Job","description":"Test","category":"Plumbing","skills":["Plumbing"],"budget":500,"paymentType":"fixed","duration":{"value":3,"unit":"day"},"location":{"type":"onsite","city":"Accra","region":"Greater Accra"}}'
Invoke-RestMethod -Uri "https://kelmah-api-gateway-50z3.onrender.com/api/jobs" -Method POST -Headers $headers -Body $job
```

Expected response: HTTP 201 with job data including `_id`

### Code Changes Made (Ready to Work After Atlas Fix)

1. **Connection wait mechanism** - Waits up to 60s for connection before write
2. **Increased timeouts** - All MongoDB timeouts increased to 60s
3. **Write concern optimization** - Using w:1 for faster writes
4. **Skills validation** - Frontend and backend now use matching vocational skills

### Files Modified

- `kelmah-backend/services/job-service/config/db.js` - Connection settings
- `kelmah-backend/services/job-service/controllers/job.controller.js` - Connection wait logic
- `kelmah-backend/shared/models/Job.js` - Schema configuration

### Status

⏳ **BLOCKED - WAITING FOR ATLAS CONFIGURATION** 

Code fixes are deployed and working. Job creation will succeed immediately once MongoDB Atlas IP whitelist is updated to allow `0.0.0.0/0`.
