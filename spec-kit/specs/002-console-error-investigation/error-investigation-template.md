# Console Error Investigation Template

## Error Investigation: [Error Type] #X

### Error Details
- **Message**: [Error message from console]
- **File**: [Source file where error occurs]
- **Line**: [Line number]
- **Time**: [Timestamp]
- **Status Code**: [HTTP status if applicable]

### Files to Investigate
1. **[Primary error file]** (Primary error source)
2. **[Related component files]** (Components that use this functionality)
3. **[Service files]** (Backend services that handle this request)
4. **[API endpoint files]** (API routes and controllers)
5. **[Configuration files]** (Environment, routing, CORS configs)

### Investigation Steps
1. **Read all files**: Examine the error source and related files
2. **Cross-reference**: Check imports and dependencies
3. **Process flow**: Trace the complete data flow
4. **Root cause**: Identify the underlying issue
5. **Solution**: Implement fix following Kelmah patterns

### Suggested Fixes
- **For 503 errors**: Check service health, implement retry logic, add fallbacks
- **For 404 errors**: Implement missing endpoints, fix routing
- **For 401 errors**: Add auth guards, fix token handling
- **For TypeError**: Add null checks, array guards, safe defaults
- **For WebSocket**: Fix routing, add connection retry, implement fallbacks

---

## Specific Error Investigations

### Error #1: 503 Service Unavailable - /api/notifications
**Files to Investigate**:
1. `kelmah-frontend/src/utils/axios.js` - Axios interceptors and retry logic
2. `kelmah-frontend/src/utils/serviceHealthCheck.js` - Service health monitoring
3. `kelmah-frontend/src/config/environment.js` - Environment configuration
4. `kelmah-backend/api-gateway/server.js` - API Gateway routing
5. `kelmah-backend/services/messaging/routes/notifications.js` - Notifications endpoint

**Investigation Steps**:
1. **Read all files** to understand notification service flow
2. **Cross-reference** with service health check logic
3. **Trace process flow** from frontend to messaging service
4. **Identify root cause** for service unavailability
5. **Verify solution** by implementing retry logic and fallbacks

**Suggested Fixes**:
- Implement exponential backoff retry (max 3 attempts)
- Add service health check before retry
- Show degraded mode banner when service is down
- Implement fallback to empty notifications list

### Error #2: 503 Service Unavailable - /api/auth/refresh-token
**Files to Investigate**:
1. `kelmah-frontend/src/utils/axios.js` - Axios instance and auth interceptors
2. `kelmah-frontend/src/modules/auth/services/authService.js` - Auth service calls
3. `kelmah-backend/services/auth/routes/auth.js` - Auth routes
4. `kelmah-backend/services/auth/controllers/authController.js` - Token refresh logic
5. `kelmah-backend/api-gateway/server.js` - Gateway proxy routing

**Investigation Steps**:
1. **Read all files** to understand token refresh flow
2. **Cross-reference** with auth service configuration
3. **Trace process flow** from token expiration to refresh
4. **Identify root cause** for refresh token failure
5. **Verify solution** by implementing single refresh attempt

**Suggested Fixes**:
- Implement single refresh attempt with graceful logout
- Add token validation before refresh
- Show user feedback for auth failures
- Implement proper error handling and redirects

### Error #3: 404 Not Found - /api/users/me/credentials
**Files to Investigate**:
1. `kelmah-frontend/src/modules/hirer/services/hirerService.js` - Profile API calls
2. `kelmah-frontend/src/modules/hirer/services/hirerSlice.js` - Redux state management
3. `kelmah-backend/services/user/routes/user.js` - User routes
4. `kelmah-backend/services/user/controllers/userController.js` - User controller
5. `kelmah-backend/api-gateway/server.js` - API Gateway routing

**Investigation Steps**:
1. **Read all files** to understand user profile flow
2. **Cross-reference** with frontend API calls
3. **Trace process flow** from profile load to API call
4. **Identify root cause** for missing credentials endpoint
5. **Verify solution** by implementing missing endpoint

**Suggested Fixes**:
- Implement `/api/users/me/credentials` endpoint in user service
- Add proper API Gateway routing for user endpoints
- Implement fallback data for missing credentials
- Add proper error handling and user feedback

### Error #4: 404 Not Found - /api/users/bookmarks
**Files to Investigate**:
1. `kelmah-frontend/src/modules/hirer/components/WorkerSearch.jsx` - Bookmark functionality
2. `kelmah-frontend/src/modules/worker/services/workerService.js` - Worker API calls
3. `kelmah-backend/services/user/routes/user.js` - User routes
4. `kelmah-backend/services/user/controllers/userController.js` - User controller
5. `kelmah-backend/api-gateway/server.js` - API Gateway routing

**Investigation Steps**:
1. **Read all files** to understand bookmark functionality
2. **Cross-reference** with frontend bookmark operations
3. **Trace process flow** from bookmark toggle to API call
4. **Identify root cause** for missing bookmark endpoints
5. **Verify solution** by implementing bookmark endpoints

**Suggested Fixes**:
- Implement `/api/users/bookmarks` GET endpoint
- Implement `/api/users/workers/:id/bookmark` POST endpoint
- Add proper API Gateway routing for bookmark endpoints
- Implement fallback behavior for missing bookmarks

### Error #5: 401 Unauthorized - /api/jobs/:id
**Files to Investigate**:
1. `kelmah-frontend/src/modules/jobs/pages/JobDetailsPage.jsx` - Job details page
2. `kelmah-frontend/src/modules/jobs/services/jobSlice.js` - Job Redux state
3. `kelmah-frontend/src/utils/secureStorage.js` - Token storage
4. `kelmah-backend/services/job/routes/job.js` - Job routes
5. `kelmah-backend/api-gateway/server.js` - API Gateway routing

**Investigation Steps**:
1. **Read all files** to understand job details authentication
2. **Cross-reference** with token storage and validation
3. **Trace process flow** from job details to API call
4. **Identify root cause** for authentication failure
5. **Verify solution** by implementing auth guards

**Suggested Fixes**:
- Add authentication guard before job details API calls
- Implement token validation before requests
- Add graceful redirect to login for unauthenticated users
- Implement proper error handling and user feedback

### Error #6: TypeError: Cannot read properties of null (reading 'data')
**Files to Investigate**:
1. `kelmah-frontend/src/utils/axios.js` - Response interceptors
2. `kelmah-frontend/src/utils/serviceHealthCheck.js` - Health check responses
3. `kelmah-frontend/src/modules/common/services/axios.js` - Axios configuration
4. `kelmah-frontend/src/config/environment.js` - Environment config

**Investigation Steps**:
1. **Read all files** to understand response handling
2. **Cross-reference** with error handling patterns
3. **Trace process flow** from API response to data access
4. **Identify root cause** for null reference errors
5. **Verify solution** by implementing null safety

**Suggested Fixes**:
- Add null safety guards: `res?.data ?? {}`
- Implement safe defaults for response data
- Add proper error handling for null responses
- Implement graceful degradation patterns

### Error #7: WebSocket Connection Errors
**Files to Investigate**:
1. `kelmah-frontend/src/services/websocketService.js` - WebSocket connection
2. `kelmah-frontend/src/config/environment.js` - WebSocket URL config
3. `kelmah-backend/services/messaging/server.js` - Socket.IO server
4. `kelmah-backend/api-gateway/server.js` - WebSocket proxy routing
5. `kelmah-frontend/vercel.json` - Production configuration

**Investigation Steps**:
1. **Read all files** to understand WebSocket configuration
2. **Cross-reference** with production deployment setup
3. **Trace process flow** from frontend to backend WebSocket
4. **Identify root cause** for connection failures
5. **Verify solution** by fixing routing and configuration

**Suggested Fixes**:
- Fix Socket.IO routing in API Gateway
- Update Vercel configuration for WebSocket
- Implement connection retry logic
- Add fallback to polling for real-time updates

### Error #8: CORS Policy Blocks
**Files to Investigate**:
1. `kelmah-backend/api-gateway/server.js` - CORS configuration
2. `kelmah-backend/services/*/server.js` - Service CORS setup
3. `kelmah-frontend/src/config/environment.js` - Frontend origin config
4. `kelmah-frontend/vercel.json` - Deployment CORS config

**Investigation Steps**:
1. **Read all files** to understand CORS configuration
2. **Cross-reference** with frontend origin settings
3. **Trace process flow** from frontend request to CORS check
4. **Identify root cause** for CORS policy violations
5. **Verify solution** by fixing CORS headers

**Suggested Fixes**:
- Add Vercel domain to CORS allowed origins
- Implement proper CORS headers for all services
- Add preflight request handling
- Update deployment configuration

### Error #9: Service Health Check Failures
**Files to Investigate**:
1. `kelmah-frontend/src/utils/serviceHealthCheck.js` - Health check implementation
2. `kelmah-frontend/src/config/environment.js` - Service registry
3. `kelmah-backend/src/routes/health.js` - Backend health endpoints
4. `kelmah-backend/api-gateway/server.js` - Gateway health routing

**Investigation Steps**:
1. **Read all files** to understand health check system
2. **Cross-reference** with service availability
3. **Trace process flow** from health check to service status
4. **Identify root cause** for health check failures
5. **Verify solution** by implementing proper health checks

**Suggested Fixes**:
- Implement proper health check endpoints
- Add service availability monitoring
- Implement degraded mode detection
- Add user feedback for service issues

### Error #10: TypeError: Cannot read properties of undefined (reading 'map')
**Files to Investigate**:
1. `kelmah-frontend/src/modules/hirer/components/WorkerSearch.jsx` - Worker search component
2. Related component files with array operations
3. Data fetching and state management files

**Investigation Steps**:
1. **Read all files** to understand array handling
2. **Cross-reference** with data fetching patterns
3. **Trace process flow** from data fetch to rendering
4. **Identify root cause** for undefined array errors
5. **Verify solution** by implementing array guards

**Suggested Fixes**:
- Add array guards: `Array.isArray(items) ? items : []`
- Initialize all arrays as empty arrays
- Use optional chaining for object properties
- Add error boundaries for component crashes

---

## Investigation Checklist

### Before Starting Investigation
- [ ] Clear browser console and reproduce errors
- [ ] Note exact error messages and timestamps
- [ ] Identify all files mentioned in error stack traces
- [ ] Check service health endpoints
- [ ] Verify authentication status

### During Investigation
- [ ] Read all files completely (not just error lines)
- [ ] Cross-reference related files and dependencies
- [ ] Trace complete process flow from start to error
- [ ] Identify root cause, not just symptoms
- [ ] Document findings and proposed solutions

### After Investigation
- [ ] Implement fixes following Kelmah patterns
- [ ] Test fixes with error scenarios
- [ ] Verify mobile compatibility
- [ ] Check for side effects
- [ ] Document changes and lessons learned

### Verification Steps
- [ ] Error is resolved and no longer appears in console
- [ ] Functionality works correctly
- [ ] Mobile compatibility is maintained
- [ ] Performance is not degraded
- [ ] No new errors are introduced
