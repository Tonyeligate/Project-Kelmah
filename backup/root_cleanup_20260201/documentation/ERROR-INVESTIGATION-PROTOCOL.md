# 🔍 Spec-Kit Error Investigation Protocol

## Systematic Error Finding and Fixing Process

### **Phase 1: Error Collection and Analysis**

#### **Step 1: Gather All Error Information**
```javascript
// In your browser console, run this to collect all errors:
console.clear();
window.addEventListener('error', (e) => {
  console.error('ERROR:', {
    message: e.message,
    filename: e.filename,
    lineno: e.lineno,
    colno: e.colno,
    error: e.error,
    stack: e.error?.stack
  });
});

// Also capture unhandled promise rejections:
window.addEventListener('unhandledrejection', (e) => {
  console.error('UNHANDLED PROMISE REJECTION:', e.reason);
});
```

#### **Step 2: Categorize Errors by Type**
- **Network Errors**: API calls failing, CORS issues, 404s, 500s
- **JavaScript Errors**: Syntax errors, undefined variables, type errors
- **React Errors**: Component rendering, state management, lifecycle issues
- **Authentication Errors**: Token issues, permission problems
- **Real-time Errors**: Socket.IO connection, WebSocket issues

### **Phase 2: Systematic Investigation (5-Step Process)**

#### **Step 1: List All Files Involved**
For each error, identify ALL files in the error chain:
- Error source file
- Files that import/use the error source
- Related service files
- API endpoints involved
- Database queries affected

#### **Step 2: Read All Listed Files**
- Read complete files, not just error lines
- Understand the full context
- Identify the exact error location
- Check for related issues

#### **Step 3: Cross-Reference Analysis**
- Scan related files to confirm error cause
- Check service integrations
- Verify API contracts
- Validate data flow

#### **Step 4: Confirm Process Flow**
- Trace complete request/response flow
- Validate authentication flow
- Check state management flow
- Verify real-time communication flow

#### **Step 5: Verify Solution Accuracy**
- Scan ALL files in the process flow
- Ensure fix addresses root cause
- Check for side effects
- Validate mobile impact

### **Phase 3: Error-Specific Investigation Patterns**

#### **Network/API Errors**
1. **Check API Gateway logs**: Look for proxy routing issues
2. **Verify service health**: Check `/health` endpoints
3. **Validate authentication**: Check JWT tokens and middleware
4. **Check CORS configuration**: Verify gateway CORS settings
5. **Test service communication**: Verify service-to-service calls

#### **React/Component Errors**
1. **Check component props**: Verify prop types and required props
2. **Validate state management**: Check Redux state and actions
3. **Check lifecycle methods**: Verify useEffect dependencies
4. **Validate routing**: Check route definitions and navigation
5. **Check error boundaries**: Ensure proper error handling

#### **Authentication Errors**
1. **Check token storage**: Verify localStorage/sessionStorage
2. **Validate token expiration**: Check JWT expiration times
3. **Check middleware chain**: Verify auth middleware order
4. **Validate user state**: Check Redux user state
5. **Check protected routes**: Verify route protection logic

#### **Real-time Communication Errors**
1. **Check Socket.IO connection**: Verify connection status
2. **Validate authentication**: Check JWT auth for WebSocket
3. **Check room management**: Verify room joining/leaving
4. **Validate event handling**: Check event listeners
5. **Check service integration**: Verify messaging service

### **Phase 4: Fix Implementation**

#### **Safe Defaults Pattern**
```javascript
// Always provide safe defaults for required fields
const user = {
  id: userData?.id || 'unknown',
  name: userData?.name || 'Anonymous',
  role: userData?.role || 'user'
};
```

#### **Error Boundary Pattern**
```javascript
// Wrap components in error boundaries
<ErrorBoundary fallback={<ErrorFallback />}>
  <YourComponent />
</ErrorBoundary>
```

#### **Graceful Degradation Pattern**
```javascript
// Implement graceful degradation
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  console.error('Operation failed, using fallback:', error);
  return fallbackValue;
}
```

#### **Validation Pattern**
```javascript
// Pre-validate data before processing
if (!user || !user.id) {
  console.error('Invalid user data:', user);
  return { error: 'User not authenticated' };
}
```

### **Phase 5: Testing and Validation**

#### **Test Error Scenarios**
1. **Network failures**: Test with offline/online states
2. **Invalid data**: Test with malformed API responses
3. **Authentication failures**: Test with expired/invalid tokens
4. **Real-time failures**: Test with connection drops
5. **Mobile scenarios**: Test on different screen sizes

#### **Validate Fixes**
1. **Error is resolved**: No more console errors
2. **Functionality works**: Feature operates correctly
3. **Mobile compatibility**: Works on mobile devices
4. **Performance impact**: No performance degradation
5. **Side effects**: No new errors introduced

## 🛠️ **Spec-Kit Error Investigation Tools**

### **Error Investigation Template**
Use this template for each error investigation:

```markdown
## Error Investigation: [Error Type]

### Error Details
- **Message**: [Error message]
- **File**: [Source file]
- **Line**: [Line number]
- **Stack**: [Stack trace]

### Files Involved
1. [Primary error file]
2. [Related component files]
3. [Service files]
4. [API endpoint files]
5. [Database model files]

### Investigation Steps
1. **Read all files**: [List files read]
2. **Cross-reference**: [Related files checked]
3. **Process flow**: [Flow traced]
4. **Root cause**: [Identified cause]
5. **Solution**: [Proposed fix]

### Fix Implementation
- **Code changes**: [Specific changes made]
- **Testing**: [Tests performed]
- **Validation**: [Fix verified]
```

### **Common Error Patterns and Fixes**

#### **API 404 Errors**
- **Cause**: Missing API endpoints or incorrect routing
- **Fix**: Add missing endpoints or fix routing configuration
- **Prevention**: Use API contracts and health checks

#### **Authentication 401 Errors**
- **Cause**: Invalid or expired JWT tokens
- **Fix**: Implement token refresh or re-authentication
- **Prevention**: Add token validation and refresh logic

#### **React Component Errors**
- **Cause**: Missing props or state issues
- **Fix**: Add prop validation and default values
- **Prevention**: Use TypeScript and prop validation

#### **Socket.IO Connection Errors**
- **Cause**: Authentication or network issues
- **Fix**: Implement connection retry and auth validation
- **Prevention**: Add connection monitoring and health checks

## 🎯 **Next Steps**

1. **Share your console errors** so I can help investigate specific issues
2. **Follow the 5-step investigation process** for each error
3. **Use the error investigation template** to document findings
4. **Implement fixes** following the safe patterns
5. **Test and validate** all fixes thoroughly

---

**This systematic approach ensures you find and fix errors efficiently while maintaining code quality and preventing future issues!** 🔧
