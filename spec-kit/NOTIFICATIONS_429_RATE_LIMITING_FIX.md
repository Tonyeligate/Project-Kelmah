# Notifications 429 Rate Limiting Fix - COMPLETED ✅

**Date**: January 2025  
**Status**: RESOLVED ✅  
**Priority**: CRITICAL - Production System Under Attack from Rate Limit Storm

## Problem Analysis

### Root Cause Discovery
Production console logs showed **hundreds of 429 "Too Many Requests" errors** flooding the `/api/notifications` endpoint, creating a cascading failure pattern:

1. **Initial Request** → 429 Too Many Requests (rate limited by backend)
2. **Retry Logic Triggered** → Exponential backoff retry after 3-4 seconds
3. **Retry ALSO Returns 429** → Triggers another retry
4. **Retry Storm Created** → Each failed request spawns more retries
5. **Infinite Loop** → System continuously hammers rate-limited endpoint

### Technical Analysis

#### Issue #1: NotificationContext Excessive Re-fetching
**File**: `kelmah-frontend/src/modules/notifications/contexts/NotificationContext.jsx`

**Problem**:
```javascript
const normalizedUser = useMemo(() => {
  const rawUser = user || userProp;
  if (!rawUser) return null;
  return {
    id: rawUser.id || rawUser._id || rawUser.userId,
    role: rawUser.role,
    token: rawUser.token,
  };
}, [user, userProp]);  // ⚠️ PROBLEM: Depends on entire user object

const fetchNotifications = useCallback(
  async ({ limit = 20, skip = 0 } = {}) => {
    // ... fetch logic
  },
  [normalizedUser],  // ⚠️ PROBLEM: Re-creates on every user mutation
);

useEffect(() => {
  fetchNotifications();
  // ... socket setup
}, [fetchNotifications, user]);  // ⚠️ PROBLEM: Re-runs on every user change
```

**Root Cause**: Every time Redux updated the user object (even non-id field changes), the useEffect would re-run, triggering a new notification fetch. This happened frequently during auth flows, profile updates, or any Redux state mutation.

#### Issue #2: Axios Retry Interceptor Compounding 429 Errors
**File**: `kelmah-frontend/src/modules/common/services/axios.js`

**Problem**:
```javascript
const shouldRetry =
  error.code === 'ECONNABORTED' || // timeout
  error.code === 'NETWORK_ERROR' ||
  error.message?.includes('timeout') ||
  error.message?.includes('Network Error') ||
  status >= 500 || // Server errors
  status === 429 || // ⚠️ PROBLEM: Retrying rate limits creates MORE requests!
  status === 408 || // Request timeout
  !error.response;
```

**Root Cause**: When backend rate-limited a request (429), the interceptor treated it as a retryable error and attempted exponential backoff retries. This created MORE requests to an already rate-limited endpoint, compounding the problem exponentially.

**Retry Storm Pattern**:
```
Request 1 → 429 → Retry after 3s  → 429
                → Retry after 6s  → 429
                → Retry after 12s → 429
                → Retry after 24s → 429
                → Retry after 48s → 429
                
Meanwhile, another user mutation triggers:
Request 2 → 429 → Retry after 3s  → 429
                → Retry after 6s  → 429
                → ...
```

Result: **Exponential request multiplication** overwhelming the backend rate limiter.

## Solution Implementation

### Fix #1: Stabilize NotificationContext User Dependency ✅

**Changes**:
```javascript
// Before: Tracked entire user object
const normalizedUser = useMemo(() => { ... }, [user, userProp]);

// After: Track ONLY user ID to prevent re-renders on object mutations
const userId = useMemo(() => {
  const rawUser = user || userProp;
  if (!rawUser) return null;
  return rawUser.id || rawUser._id || rawUser.userId;
}, [user?.id, user?._id, user?.userId, userProp?.id, userProp?._id, userProp?.userId]);
```

**Impact**: Prevents re-fetching notifications unless user ID actually changes (login/logout events only).

### Fix #2: Add Rate Limiting Protection in NotificationContext ✅

**Changes**:
```javascript
// Track last fetch timestamp to prevent rapid re-fetches
const lastFetchRef = useRef(0);
const MIN_FETCH_INTERVAL = 30000; // 30 seconds minimum between fetches

const fetchNotifications = useCallback(
  async ({ limit = 20, skip = 0 } = {}) => {
    // Rate limiting check - prevent rapid re-fetches
    const now = Date.now();
    if (now - lastFetchRef.current < MIN_FETCH_INTERVAL) {
      console.log('⏱️ Skipping notification fetch - too soon since last fetch');
      return;
    }

    // ... existing fetch logic ...
    
    lastFetchRef.current = now; // Update last fetch timestamp

    // Enhanced 429 handling with extended backoff
    if (err?.response?.status === 429) {
      console.warn('⚠️ Rate limited on notifications endpoint - backing off 2 minutes');
      lastFetchRef.current = now + 120000; // Block fetches for 2 minutes
      setError('Too many requests. Please wait a moment before refreshing.');
    }
  },
  [userId], // ⚠️ CRITICAL: Only depend on userId, not entire user object
);
```

**Protection Layers**:
1. **Minimum Fetch Interval**: 30 seconds between any notification fetches
2. **429 Response Backoff**: 2-minute cooldown if rate limited
3. **User Feedback**: Display error message on rate limiting

### Fix #3: Remove 429 from Axios Retry Logic ✅

**Changes**:
```javascript
const shouldRetry =
  error.code === 'ECONNABORTED' || // timeout
  error.code === 'NETWORK_ERROR' ||
  error.message?.includes('timeout') ||
  error.message?.includes('Network Error') ||
  status >= 500 || // Server errors
  // ⚠️ CRITICAL FIX: DO NOT retry 429 Rate Limiting - it compounds the problem
  // status === 429 || // Rate limiting - REMOVED to prevent retry storms
  status === 408 || // Request timeout
  !error.response;
```

**Impact**: 429 errors now **fail immediately** without retries, preventing retry storms.

### Fix #4: Update useEffect Dependencies ✅

**Changes**:
```javascript
// Before: Re-ran on every user object change
useEffect(() => {
  fetchNotifications();
  // ... socket setup
}, [fetchNotifications, user]);

// After: Only re-runs when userId changes
useEffect(() => {
  if (userId) {
    fetchNotifications();
  }
  // ... socket setup with userId check
}, [fetchNotifications, userId]); // ⚠️ CRITICAL: Depend on userId, not user object
```

**Impact**: Eliminates unnecessary re-fetches on user object mutations.

## Files Modified

### 1. NotificationContext.jsx ✅
**Path**: `kelmah-frontend/src/modules/notifications/contexts/NotificationContext.jsx`

**Changes**:
- Replaced `normalizedUser` with stable `userId` extraction
- Added `lastFetchRef` and `MIN_FETCH_INTERVAL` rate limiting
- Enhanced 429 error handling with 2-minute backoff
- Updated `fetchNotifications` dependency from `[normalizedUser]` to `[userId]`
- Updated useEffect dependency from `[fetchNotifications, user]` to `[fetchNotifications, userId]`

### 2. axios.js Retry Interceptor ✅
**Path**: `kelmah-frontend/src/modules/common/services/axios.js`

**Changes**:
- Removed `status === 429` from `shouldRetry` conditions
- Added comment explaining why 429 should not be retried
- Prevents retry storms on rate-limited endpoints

## Verification Steps

### Before Fix:
```
GET /api/notifications 429 (Too Many Requests)
🔄 Retrying request (1/5) after 3156ms delay
GET /api/notifications 429 (Too Many Requests)
🔄 Retrying request (2/5) after 6904ms delay
GET /api/notifications 429 (Too Many Requests)
🔄 Retrying request (3/5) after 13821ms delay
... (pattern repeats hundreds of times)
```

### After Fix:
```
✅ Notification fetch limited to once per 30 seconds
✅ 429 errors fail immediately without retries
✅ User object mutations don't trigger re-fetches
✅ Only userId changes (login/logout) trigger fetches
✅ 2-minute cooldown on rate limiting hits
```

## Testing Protocol

### 1. User Login Flow
- Login with test user
- Verify single notification fetch occurs
- No additional fetches on Redux state updates

### 2. Navigation Testing
- Navigate between dashboard pages
- Verify no notification re-fetches on page navigation
- Only manual refresh should trigger new fetch (with 30s limit)

### 3. Rate Limiting Response
- Manually trigger rapid fetches (if possible)
- Verify 30-second minimum interval enforced
- Verify 429 responses don't trigger retries
- Verify 2-minute cooldown on 429 errors

### 4. Production Monitoring
- Deploy changes to production
- Monitor `/api/notifications` request patterns
- Verify 429 error rate drops to near-zero
- Verify no retry storms in console logs

## Expected Outcomes

### Performance Improvements:
1. **90-95% reduction** in `/api/notifications` request volume
2. **Zero retry storms** on rate-limited endpoints
3. **Improved backend stability** - no more rate limiter overload
4. **Better user experience** - no console spam with 429 errors

### Behavior Changes:
- Notifications fetch once on login
- Notifications fetch once every 30 seconds maximum
- 429 errors display user-friendly message with 2-minute cooldown
- No retries on rate-limited requests

## Related Issues

### Similar Pattern in Header.jsx Worker Availability (500 Error)
**File**: `kelmah-frontend/src/modules/layout/components/Header.jsx` (Line 477-479)

**Issue**:
```javascript
React.useEffect(() => {
  const loadHeaderWorkerStatus = async () => {
    try {
      if (!showUserFeatures || user?.role !== 'worker') return;
      const id = user?.id || user?._id || user?.userId;
      if (id) {
        const [avail, comp] = await Promise.all([
          workerService.getWorkerAvailability(id).catch(() => null),  // ⚠️ Causing 500 errors
          workerService.getWorkerStats().catch(() => null),
        ]);
        // ...
      }
    } catch (e) {
      // Non-blocking: header chips are optional
    }
  };
  loadHeaderWorkerStatus();
}, [showUserFeatures, user?.role, user?.id, user?._id, user?.userId]);
```

**Status**: Identified but NOT fixed in this session (separate issue)
**Next Steps**: Apply similar stabilization pattern to prevent excessive availability checks

## Production Deployment Notes

### Pre-Deployment Checklist:
- [x] NotificationContext fixes verified locally
- [x] Axios interceptor fixes verified locally
- [x] No breaking changes to notification API
- [x] Backward compatible with existing backend

### Post-Deployment Monitoring:
1. Watch for `/api/notifications` request volume drop
2. Monitor 429 error rates (should be near-zero)
3. Check console logs for retry storm patterns (should be absent)
4. Verify user notifications still work correctly
5. Monitor WebSocket connection stability

### Rollback Plan:
If issues occur, revert these specific changes:
1. `NotificationContext.jsx` userId dependency changes
2. `axios.js` retry interceptor 429 removal

## Lessons Learned

### 1. Retry Logic Must Respect Rate Limiting
**Problem**: Treating 429 as a retryable error compounds the problem
**Solution**: Rate limits should fail fast, not retry

### 2. React Dependency Arrays Are Critical for Performance
**Problem**: Depending on entire objects causes excessive re-renders
**Solution**: Extract primitive values (IDs) and depend only on those

### 3. Frontend Rate Limiting is Essential
**Problem**: Relying solely on backend rate limits creates storms
**Solution**: Implement client-side rate limiting/throttling

### 4. User Object Mutations Are Frequent
**Problem**: Redux state updates mutate user objects often
**Solution**: Use stable identifiers (IDs) not entire objects

## Additional Recommendations

### 1. Add Rate Limiting to Other Frequent Endpoints
Consider similar fixes for:
- Worker availability checks (Header.jsx)
- Job listing fetches
- Message polling
- Dashboard data refreshes

### 2. Implement Request Deduplication
Use libraries like `axios-retry` with proper deduplication to prevent duplicate concurrent requests.

### 3. Add Backend Rate Limit Headers
Backend should return `Retry-After` header with 429 responses for proper client backoff timing.

### 4. Monitor Request Patterns
Set up monitoring for:
- Request frequency per endpoint
- 429 error rates
- Retry attempt patterns
- User session behavior

## Conclusion

This fix addresses a **critical production issue** where notification polling combined with retry logic created exponential request storms, overwhelming the backend rate limiter. The solution stabilizes notification fetching, eliminates retry storms, and implements proper client-side rate limiting.

**Status**: COMPLETED ✅  
**Impact**: Critical production stability fix  
**Next Steps**: Monitor production metrics and apply similar patterns to other frequent-polling endpoints
