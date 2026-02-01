# 🔍 Console Error Investigation with Spec-Kit

## How to Use Spec-Kit for Your Console Errors

Based on your `Consolerrorsfix.txt`, you have **15 critical errors** that need systematic investigation. Here's how to use spec-kit to tackle them efficiently.

## 🚀 **Quick Start: Using Spec-Kit for Error Investigation**

### **Step 1: Load the Error Investigation Tool**

1. **Open your Kelmah frontend** in the browser
2. **Open Developer Tools** (F12)
3. **Go to Console tab**
4. **Copy and paste the entire `debug-console-errors.js` file** into the console
5. **Press Enter** to run it

### **Step 2: Reproduce Your Errors**

1. **Navigate through your app** to trigger the errors you're seeing
2. **The tool will automatically capture** all errors, warnings, and network issues
3. **Watch the console** for captured errors (they'll show with 🚨 emoji)

### **Step 3: Analyze the Errors**

Run this command in the console:
```javascript
analyzeErrors()
```

This will give you:
- ✅ **Total count** of errors, warnings, and network issues
- ✅ **Categorized breakdown** by error type
- ✅ **Detailed error information** with file names and line numbers
- ✅ **Investigation recommendations** for each error type

### **Step 4: Generate Investigation Template**

Run this command in the console:
```javascript
generateInvestigationTemplate()
```

This will generate a **spec-kit investigation template** for each error, showing:
- ✅ **Files to investigate** (following your 5-step process)
- ✅ **Investigation steps** to follow
- ✅ **Suggested fixes** based on error patterns

## 📋 **Using Spec-Kit Templates for Your Specific Errors**

### **Template 1: /specify Command**

In VS Code with GitHub Copilot Chat, use:

```
/specify Fix the 15 console errors identified in Consolerrorsfix.txt using the 5-step investigation process. The errors include 503 Service Unavailable, 404 Not Found, 401 Unauthorized, WebSocket failures, CORS issues, and TypeError crashes. Implement safe defaults, graceful degradation, and mobile compatibility while following the "Find Errors and Fix" principle.
```

### **Template 2: /plan Command**

```
/plan Implement systematic error investigation and resolution for all 15 console errors. Start with critical 503 and 401 errors, then address 404 missing endpoints, WebSocket connection issues, and frontend crashes. Use the 5-step investigation process: list all files, read all files, cross-reference analysis, confirm process flow, verify solution accuracy. Implement fixes following Kelmah patterns with safe defaults and graceful degradation.
```

### **Template 3: /tasks Command**

```
/tasks Create detailed task breakdown for fixing all 15 console errors. Prioritize critical errors (503, 401, TypeError) first, then high priority (404, WebSocket), then medium priority (CORS, health checks). Each task should follow the 5-step investigation process and implement fixes for frontend infrastructure, user service endpoints, job service authentication, messaging WebSocket, and UI robustness. Include testing and validation for each fix.
```

## 🎯 **Specific Error Investigation Process**

### **Error #1: 503 Service Unavailable - /api/notifications**

**Files to Investigate**:
1. `kelmah-frontend/src/utils/axios.js`
2. `kelmah-frontend/src/utils/serviceHealthCheck.js`
3. `kelmah-backend/api-gateway/server.js`
4. `kelmah-backend/services/messaging/routes/notifications.js`

**Investigation Steps**:
1. **Read all files** to understand notification service flow
2. **Cross-reference** with service health check logic
3. **Trace process flow** from frontend to messaging service
4. **Identify root cause** for service unavailability
5. **Verify solution** by implementing retry logic and fallbacks

**Quick Fix**:
```javascript
// In axios.js - Add retry logic with exponential backoff
const retryConfig = {
  retries: 3,
  retryDelay: (retryCount) => Math.pow(2, retryCount) * 1000,
  retryCondition: (error) => error.response?.status >= 500
};
```

### **Error #2: 404 Not Found - /api/users/me/credentials**

**Files to Investigate**:
1. `kelmah-frontend/src/modules/hirer/services/hirerService.js`
2. `kelmah-backend/services/user/routes/user.js`
3. `kelmah-backend/services/user/controllers/userController.js`
4. `kelmah-backend/api-gateway/server.js`

**Investigation Steps**:
1. **Read all files** to understand user profile flow
2. **Cross-reference** with frontend API calls
3. **Trace process flow** from profile load to API call
4. **Identify root cause** for missing credentials endpoint
5. **Verify solution** by implementing missing endpoint

**Quick Fix**:
```javascript
// In user routes - Add missing credentials endpoint
router.get('/me/credentials', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ data: user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch credentials' });
  }
});
```

### **Error #3: 401 Unauthorized - /api/jobs/:id**

**Files to Investigate**:
1. `kelmah-frontend/src/modules/jobs/pages/JobDetailsPage.jsx`
2. `kelmah-frontend/src/utils/secureStorage.js`
3. `kelmah-backend/services/job/routes/job.js`
4. `kelmah-backend/api-gateway/server.js`

**Investigation Steps**:
1. **Read all files** to understand job details authentication
2. **Cross-reference** with token storage and validation
3. **Trace process flow** from job details to API call
4. **Identify root cause** for authentication failure
5. **Verify solution** by implementing auth guards

**Quick Fix**:
```javascript
// In JobDetailsPage.jsx - Add auth guard
useEffect(() => {
  const token = secureStorage.getAuthToken();
  if (!token) {
    navigate('/login');
    return;
  }
  // Proceed with job details fetch
}, []);
```

## 🔧 **Systematic Error Resolution Workflow**

### **Phase 1: Critical Errors (503, 401, TypeError)**
1. **Load error investigation tool** in browser console
2. **Reproduce errors** by navigating through app
3. **Run `analyzeErrors()`** to get detailed analysis
4. **Follow 5-step investigation process** for each error
5. **Implement fixes** with safe defaults and graceful degradation

### **Phase 2: High Priority Errors (404, WebSocket)**
1. **Use spec-kit templates** to generate investigation plans
2. **Read all files involved** in each error
3. **Cross-reference** with related services and components
4. **Trace complete process flow** from frontend to backend
5. **Implement missing endpoints** and fix routing issues

### **Phase 3: Medium Priority Errors (CORS, Health Checks)**
1. **Use generated investigation templates** for each error
2. **Check configuration files** for CORS and health check setup
3. **Verify service deployment** and connectivity
4. **Update configuration** to fix CORS and health check issues
5. **Test fixes** with production deployment

## 📊 **Error Investigation Dashboard**

### **Current Error Status**
- **Critical Errors**: 5 (503, 401, TypeError)
- **High Priority**: 4 (404, WebSocket)
- **Medium Priority**: 4 (CORS, Health checks)
- **Low Priority**: 2 (External, Browser extension)

### **Investigation Progress**
- **Files Identified**: 25+ files across frontend and backend
- **Investigation Started**: 0/15 errors
- **Root Causes Found**: 0/15 errors
- **Fixes Implemented**: 0/15 errors
- **Testing Completed**: 0/15 errors

### **Next Steps**
1. **Start with Error #1** (503 notifications) - most critical
2. **Follow 5-step investigation process** for each error
3. **Use spec-kit templates** to generate investigation plans
4. **Implement fixes** following Kelmah patterns
5. **Test and validate** each fix before moving to next

## 🎯 **Success Metrics**

### **Error Resolution Targets**
- **All 15 console errors resolved** within 17 hours
- **Error investigation follows 5-step process** for each error
- **Fixes implement safe defaults** and graceful degradation
- **Mobile compatibility maintained** throughout fixes
- **Performance optimized** through better error handling

### **Quality Gates**
- **No new errors introduced** during fixes
- **All fixes tested** with error scenarios
- **Mobile compatibility verified** for all fixes
- **Performance maintained** or improved
- **User experience enhanced** with better error handling

## 🚀 **Ready to Start?**

1. **Load the error investigation tool** in your browser console
2. **Reproduce your errors** by navigating through your app
3. **Run `analyzeErrors()`** to see the detailed analysis
4. **Start with Error #1** (503 notifications) using the investigation template
5. **Follow the 5-step process** for each error systematically

**This systematic approach will help you find and fix all your console errors efficiently while following your "Find Errors and Fix" principle!** 🔧

---

**Need help with a specific error? Share the output from `analyzeErrors()` and I'll help you investigate it step by step!**
