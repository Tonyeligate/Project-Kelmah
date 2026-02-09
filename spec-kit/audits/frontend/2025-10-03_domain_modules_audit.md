# Frontend Domain Modules Audit Report

**Date**: October 3, 2025  
**Auditor**: AI Agent  
**Scope**: All 25 domain modules under `kelmah-frontend/src/modules/`  
**Focus**: Data flow patterns, backend connectivity, and service architecture

---

## Executive Summary

**Status**: ⚠️ Mixed - Several modules have proper architecture but critical connectivity issues exist

**Primary Issues Found**: 7
**Secondary Issues Found**: 11

### Key Findings

1. **✅ Strong Patterns**: Auth, Jobs, Messaging, Payment modules show proper architecture with Redux Toolkit integration and standardized service clients
2. **❌ Raw Axios Usage**: Search, Reviews, Map modules bypass centralized service clients, losing auth/retry interceptors and tunnel awareness
3. **⚠️ Broken Service References**: Worker module imports `applicationsApi.js` and `portfolioApi.js` which target non-existent/broken endpoints
4. **❌ Missing Client References**: Contracts service references undefined `authServiceClient` instead of proper import
5. **⚠️ Legacy WebSocket Imports**: RealTimeChat and RealTimeJobAlerts import from `../../../services/websocketService` instead of using Socket.IO client from centralized service
6. **✅ Redux Integration**: All major modules properly use Redux Toolkit with `createSlice` and `createAsyncThunk` patterns
7. **✅ Context Providers**: 6 modules provide React Context for domain state (auth, messaging, notifications, payment, search, contracts)

---

## Module-by-Module Analysis

### ✅ Auth Module (`modules/auth/`)
**Services**: `authService.js`, `authSlice.js`  
**Backend**: Auth service via `authServiceClient`  
**Status**: ✅ PASSING

**Architecture**:
- Uses centralized `authServiceClient` from common services
- Redux slice with comprehensive thunks (register, login, verifyAuth, logout, refreshToken)
- Proper error handling with user-friendly messages
- Token storage via `secureStorage` utility
- Automatic token refresh setup

**Data Flow**:
```
Component → dispatch(login) → authSlice thunk → authService.login() → authServiceClient.post('/api/auth/login') → Auth Service (port 5001)
```

**Issues**: None

---

### ✅ Jobs Module (`modules/jobs/`)
**Services**: `jobsApi.js`, `jobSlice.js`  
**Backend**: Job service via `jobServiceClient`  
**Status**: ✅ PASSING (already audited separately)

**Architecture**:
- Uses centralized `jobServiceClient`
- Proper response normalization for multiple backend formats
- Redux slice with comprehensive job CRUD operations
- Transform helpers for consistent job data structure

**Data Flow**:
```
Component → dispatch(fetchJobs) → jobSlice thunk → jobsApi.getJobs() → jobServiceClient.get('/api/jobs') → Job Service (port 5003)
```

**Issues**: Debug logging should be removed (already documented in previous audit)

---

### ✅ Messaging Module (`modules/messaging/`)
**Services**: `messagingService.js`, `chatService.js`, `messageService.js`  
**Backend**: Messaging service via `messagingServiceClient`  
**Status**: ✅ PASSING (already audited)

**Architecture**:
- Uses centralized `messagingServiceClient`
- REST endpoints aligned with backend routes
- Socket.IO integration for real-time messaging
- Multiple service files for separation of concerns

**Data Flow**:
```
Component → messagingService.getConversations() → messagingServiceClient.get('/api/conversations') → Messaging Service (port 5005)
```

**Issues**: None

---

### ✅ Payment Module (`modules/payment/`)
**Services**: `paymentService.js`  
**Backend**: Payment service via `paymentServiceClient`  
**Contexts**: `PaymentContext.jsx` for payment state management  
**Status**: ✅ PASSING with comprehensive mock fallbacks

**Architecture**:
- Uses centralized `paymentServiceClient`
- Comprehensive mock data for wallet, escrows, transactions when service unavailable
- Ghana-specific payment methods (Mobile Money)
- Proper error handling with graceful degradation

**Data Flow**:
```
Component → paymentService.getWallet() → paymentServiceClient.get('/api/payments/wallet') → Payment Service (port 5004)
```

**Issues**: None - mock data is intentional for service unavailability

---

### ⚠️ Worker Module (`modules/worker/`)
**Services**: `workerService.js`, `applicationsApi.js`, `portfolioApi.js`, `portfolioService.js`, `certificateService.js`, `earningsService.js`, `workerSlice.js`  
**Backend**: User service via `userServiceClient`, Job service via `jobServiceClient`  
**Status**: ⚠️ MIXED - workerService functional, but imports broken auxiliary services

**Primary Issues**:

1. **Broken applicationsApi.js Import** (🔴 PRIMARY)
   - **Problem**: Worker components import `applicationsApi.js` which targets `/api/applications/*` routes that don't exist on backend
   - **Impact**: All application fetching via this API returns 404
   - **Root Cause**: Documented in `2025-10-03_applications_api_audit.md` - backend only exposes `/api/jobs/:jobId/applications/:applicationId` pattern
   - **Solution**: Deprecate `applicationsApi.js` and migrate all usages to `workerService.getApplications()`

2. **Broken portfolioApi.js Routes** (🔴 PRIMARY)
   - **Problem**: Uses raw axios without tunnel awareness or auth interceptors: `await axios.get('/api/profile/portfolio/search')`
   - **Impact**: Portfolio search and certificate uploads fail in production (tunnel URLs not resolved)
   - **Root Cause**: Bypasses centralized service clients and hits Sequelize-based controller (documented in `2025-10-03_portfolio_api_audit.md`)
   - **Solution**: Migrate to `portfolioService.js` which uses `userServiceClient`

3. **Broken earningsService.js Routes** (🔴 PRIMARY)
   - **Problem**: Targets non-existent `/api/users/earnings/*` routes
   - **Impact**: Earnings tracking components show no data
   - **Root Cause**: Documented in `2025-10-03_worker_earnings_audit.md` - routes not implemented on backend
   - **Solution**: Migrate to job service `/api/jobs/my-jobs` with earnings calculation on frontend

4. **Broken certificateService.js DTOs** (⚠️ SECONDARY)
   - **Problem**: DTO mismatch with backend expectations (documented in certificate service audit)
   - **Impact**: Certificate uploads may fail validation
   - **Solution**: Align DTOs with user-service certificate schema

**Working Components**:
- ✅ `workerService.js` - Properly uses `userServiceClient` for worker profile, reviews, credentials
- ✅ `workerSlice.js` - Redux integration with comprehensive worker state management

**Data Flow** (workerService - WORKING):
```
Component → dispatch(fetchWorkerProfile) → workerSlice thunk → workerService.getWorkerById() → userServiceClient.get('/api/users/workers/:id') → User Service (port 5002)
```

**Data Flow** (applicationsApi - BROKEN):
```
Component → applicationsApi.getMyApplications() → jobServiceClient.get('/api/applications/user') → 404 NOT FOUND
```

---

### ❌ Search Module (`modules/search/`)
**Services**: `searchService.js`, `smartSearchService.js`, `locationService.js`  
**Backend**: Multiple services (user, job) - NO centralized clients  
**Status**: ❌ FAILING - Raw axios usage breaks production

**Primary Issues**:

1. **Raw Axios Import** (🔴 PRIMARY - CRITICAL)
   - **Location**: `searchService.js:1` - `import axios from '../../common/services/axios';`
   - **Problem**: Imports raw axios module instead of configured service client
   - **Impact**: 
     - No authentication token attachment
     - No automatic retry logic for 401/500 errors
     - No tunnel URL resolution in production
     - No service health awareness
   - **Evidence**:
     ```javascript
     const response = await axios.get(`${API_URL}/search`, {
       params: { q: query, ...filters }
     });
     ```
   - **Solution**: Replace with `userServiceClient` or `jobServiceClient` depending on search target

2. **Undefined API_URL Reference** (🔴 PRIMARY)
   - **Location**: Throughout `searchService.js` - references `${API_URL}/search`
   - **Problem**: `API_URL` is never defined or imported
   - **Impact**: All search API calls will throw ReferenceError
   - **Solution**: Remove `API_URL` prefix and use service client base URLs

**Affected Operations**:
- `search()` - General search
- `searchWorkers()` - Worker search
- `searchJobs()` - Job search
- `getSearchSuggestions()` - Autocomplete
- `getPopularSearches()` - Trending searches

**Working Components**:
- ✅ `smartSearchService.js` - Uses `userServiceClient` correctly
- ✅ `locationService.js` - Uses `userServiceClient` correctly

**Required Refactor**:
```javascript
// BEFORE (BROKEN)
import axios from '../../common/services/axios';
const response = await axios.get(`${API_URL}/search/workers`, { params });

// AFTER (FIXED)
import { userServiceClient } from '../../common/services/axios';
const response = await userServiceClient.get('/api/users/workers/search', { params });
```

---

### ❌ Reviews Module (`modules/reviews/`)
**Services**: `reviewsSlice.js`  
**Backend**: Review service - NO centralized client  
**Status**: ❌ FAILING - Manual axios with getApiBaseUrl

**Primary Issues**:

1. **Manual Axios with Dynamic Base URL** (🔴 PRIMARY)
   - **Location**: `reviewsSlice.js:2` - `import axios from 'axios';`
   - **Problem**: Bypasses centralized service clients, manually resolves base URL:
     ```javascript
     const baseURL = await getApiBaseUrl();
     const response = await axios.post(`${baseURL}/api/reviews`, reviewData, {
       headers: { Authorization: `Bearer ${auth.token}` }
     });
     ```
   - **Impact**:
     - No automatic retry logic
     - No token refresh handling
     - Manual header management
     - Race conditions with async base URL resolution
   - **Solution**: Use centralized review service client (may need to create `reviewServiceClient` in `axios.js`)

2. **Manual Token Attachment** (⚠️ SECONDARY)
   - **Problem**: Manually reads token from Redux state and attaches to headers
   - **Impact**: Duplicates logic already in centralized interceptors
   - **Solution**: Remove manual auth headers when using proper service client

**Affected Operations**:
- `submitReview` thunk - Create review
- `fetchReviewsByRecipient` thunk - Get reviews for user/job
- `fetchReviewsByReviewer` thunk - Get reviews authored by user

**Required Refactor**:
```javascript
// BEFORE (BROKEN)
import axios from 'axios';
import { getApiBaseUrl } from '../../../config/environment';

export const submitReview = createAsyncThunk('reviews/submit', async (reviewData, { getState }) => {
  const { auth } = getState();
  const baseURL = await getApiBaseUrl();
  const response = await axios.post(`${baseURL}/api/reviews`, reviewData, {
    headers: { Authorization: `Bearer ${auth.token}` }
  });
  return response.data;
});

// AFTER (FIXED)
import { reviewServiceClient } from '../../common/services/axios';

export const submitReview = createAsyncThunk('reviews/submit', async (reviewData) => {
  const response = await reviewServiceClient.post('/api/reviews', reviewData);
  return response.data;
});
```

---

### ❌ Map Module (`modules/map/`)
**Services**: `mapService.js`  
**Backend**: Job/User services - NO centralized clients  
**Status**: ❌ FAILING - Raw axios breaks location-based features

**Primary Issues**:

1. **Raw Axios Import** (🔴 PRIMARY - CRITICAL)
   - **Location**: `mapService.js:1` - `import axios from 'axios';`
   - **Problem**: Uses raw axios for all location-based searches
   - **Impact**: Map-based job/worker discovery broken in production
   - **Evidence**:
     ```javascript
     const response = await axios.get(`${API_URL}/jobs/search/location`, {
       params: { latitude, longitude, radius, ...filters }
     });
     ```
   - **Solution**: Use `jobServiceClient` and `userServiceClient` for location searches

2. **Undefined API_URL Reference** (🔴 PRIMARY)
   - **Problem**: References `${API_URL}` throughout without definition
   - **Impact**: All map API calls fail with ReferenceError
   - **Solution**: Remove API_URL prefix and use proper service clients

**Affected Operations**:
- `searchJobsByLocation()` - Location-based job search
- `searchWorkersByLocation()` - Location-based worker search
- `getJobClusters()` - Map clustering for jobs
- `getWorkerHeatmap()` - Worker density visualization

**Required Refactor**:
```javascript
// BEFORE (BROKEN)
import axios from 'axios';
const response = await axios.get(`${API_URL}/jobs/search/location`, { params });

// AFTER (FIXED)
import { jobServiceClient } from '../../common/services/axios';
const response = await jobServiceClient.get('/api/jobs/search/location', { params });
```

---

### ⚠️ Dashboard Module (`modules/dashboard/`)
**Services**: `dashboardService.js`, `dashboardSlice.js`, `hirerDashboardSlice.js`, `hirerService.js`  
**Backend**: Multiple services via proper clients  
**Status**: ⚠️ MIXED - Proper clients but manual WebSocket setup

**Secondary Issues**:

1. **Manual WebSocket Configuration** (⚠️ SECONDARY)
   - **Location**: `dashboardService.js` - Custom Socket.IO client initialization
   - **Problem**: Manually fetches runtime-config.json and sets up Socket.IO:
     ```javascript
     const response = await fetch('/runtime-config.json');
     const config = await response.json();
     wsUrl = config.websocketUrl || config.ngrokUrl || '/socket.io';
     this.socket = io(wsUrl, { auth: { token: this.token }, path: '/socket.io' });
     ```
   - **Impact**: Duplicates WebSocket configuration logic that could be centralized
   - **Note**: Not critical as it works, but increases maintenance burden

2. **Manual Base URL Resolution** (⚠️ SECONDARY)
   - **Problem**: Uses `getApiBaseUrl()` helper instead of relying on service clients
   - **Impact**: Adds async overhead when service clients already handle this
   - **Solution**: Let service clients handle base URL resolution transparently

**Working Components**:
- ✅ `hirerService.js` - Properly uses `userServiceClient` and `jobServiceClient`
- ✅ Redux slices properly structured with thunks

---

### ⚠️ Profile Module (`modules/profile/`)
**Services**: `profileService.js`  
**Backend**: User service via `userServiceClient`  
**Status**: ⚠️ PASSING with minor issues

**Secondary Issues**:

1. **Overly Generic Routes** (⚠️ SECONDARY)
   - **Location**: All profile methods use short paths like `/profile`, `/profile/picture`, `/profile/skills`
   - **Problem**: Routes don't match backend pattern `/api/users/me/profile`
   - **Impact**: May cause 404s if backend expects full paths
   - **Solution**: Verify backend routes or update to full paths

2. **Fallback Minimal Profile** (⚠️ SECONDARY)
   - **Problem**: Returns empty profile object on service unavailability:
     ```javascript
     return { firstName: '', lastName: '', bio: '', skills: [], education: [], languages: [] };
     ```
   - **Impact**: UI may show blank profile instead of error state
   - **Solution**: Throw error to let UI handle unavailability appropriately

---

### ⚠️ Hirer Module (`modules/hirer/`)
**Services**: `hirerService.js`, `hirerAnalyticsService.js`, `hirerSlice.js`  
**Backend**: User/Job services via proper clients  
**Status**: ⚠️ PASSING with minor organizational issues

**Secondary Issues**:

1. **Service Import Duplication** (⚠️ SECONDARY)
   - **Location**: `hirerSlice.js:2` imports all service clients:
     ```javascript
     import { authServiceClient, userServiceClient, jobServiceClient, paymentServiceClient } from '../../common/services/axios';
     ```
   - **Problem**: Redux slice directly imports service clients instead of delegating to service layer
   - **Impact**: Violates separation of concerns (slices should call services, not clients directly)
   - **Solution**: Move API calls to `hirerService.js` and have slice thunks call service methods

**Working Architecture**:
- ✅ `hirerService.js` properly uses `userServiceClient` and `jobServiceClient`
- ✅ Worker search, saved workers, job management all functional
- ✅ Analytics service properly structured

---

### ❌ Contracts Module (`modules/contracts/`)
**Services**: `contractService.js`, `contractSlice.js`, `milestoneService.js`  
**Backend**: Job service - BROKEN import  
**Status**: ❌ FAILING - References undefined client

**Primary Issues**:

1. **Undefined authServiceClient Reference** (🔴 PRIMARY - CRITICAL)
   - **Location**: `contractService.js:25-27`
   - **Problem**: References `authServiceClient` without importing it:
     ```javascript
     async updateContract(id, updateData) {
       const response = await authServiceClient.put(`/api/contracts/${id}`, updateData);
       return response.data;
     }
     ```
   - **Impact**: updateContract() throws ReferenceError on every call
   - **Solution**: Import `jobServiceClient` (contracts likely under job service) or add proper import

2. **Inconsistent Client Usage** (⚠️ SECONDARY)
   - **Problem**: getContracts() uses `jobServiceClient`, updateContract() uses undefined `authServiceClient`
   - **Impact**: API calls go to different services for same resource
   - **Solution**: Standardize on `jobServiceClient` for all contract operations

**Working Components**:
- ✅ `milestoneService.js` - Properly uses `jobServiceClient`
- ✅ Redux slice comprehensive with thunks for contract lifecycle

**Required Fix**:
```javascript
// BEFORE (BROKEN)
async updateContract(id, updateData) {
  const response = await authServiceClient.put(`/api/contracts/${id}`, updateData);
  return response.data;
}

// AFTER (FIXED)
import { jobServiceClient } from '../../common/services/axios';

async updateContract(id, updateData) {
  const response = await jobServiceClient.put(`/api/contracts/${id}`, updateData);
  return response.data;
}
```

---

### ⚠️ Messaging Components (Legacy WebSocket)
**Affected Files**: 
- `modules/messaging/components/RealTimeChat.jsx`
- `modules/jobs/components/RealTimeJobAlerts.jsx`

**Secondary Issues**:

1. **Legacy WebSocket Service Import** (⚠️ SECONDARY)
   - **Location**: 
     - `RealTimeChat.jsx:53` - `import websocketService from '../../../services/websocketService';`
     - `RealTimeJobAlerts.jsx:60` - `import websocketService from '../../../services/websocketService';`
   - **Problem**: Imports from `src/services/websocketService.js` instead of using Socket.IO client from centralized messaging service
   - **Impact**: 
     - Duplicates WebSocket connection logic
     - May create multiple socket connections instead of reusing one
     - Hard to maintain separate WebSocket initialization
   - **Solution**: Use Socket.IO client from `messagingService` or centralize in `common/services/socketClient.js`

---

## Remaining Modules Summary

### ✅ Settings Module (`modules/settings/`)
- Uses `userServiceClient` properly
- Hooks and services well-structured

### ✅ Notifications Module (`modules/notifications/`)
- Uses `messagingServiceClient` properly (already audited)
- Context provider for notification state

### ⚠️ Smaller Modules (Not Critical)
The following modules exist but have minimal/no service integration:
- `admin/` - Admin-specific functionality
- `analytics/` - Analytics dashboards
- `calendar/` - Calendar/scheduling features
- `disputes/` - Dispute management
- `home/` - Landing page
- `layout/` - UI layout components
- `marketplace/` - Marketplace features
- `premium/` - Premium features
- `profiles/` - Profile browsing
- `scheduling/` - Appointment scheduling

**Note**: These modules either use shared services from other modules or have minimal backend connectivity requirements.

---

## Critical Architectural Patterns Analysis

### ✅ Redux Toolkit Integration
**Pattern**: All major modules use Redux Toolkit with proper slice/thunk structure

**Evidence**:
- 14 Redux slices found across modules
- Consistent `createSlice` + `createAsyncThunk` pattern
- Proper error handling with `rejectWithValue`

**Example** (jobSlice.js):
```javascript
export const fetchJobs = createAsyncThunk('jobs/fetchJobs', async (params, { rejectWithValue }) => {
  try {
    return await jobsApi.getJobs(params);
  } catch (error) {
    return rejectWithValue(error.message);
  }
});
```

### ⚠️ Service Client Usage
**Pattern**: Mixed - Some modules use centralized clients, others bypass them

**Compliant Modules** (✅):
- Auth, Jobs, Messaging, Payment, Worker (workerService), Hirer, Settings, Profile

**Non-Compliant Modules** (❌):
- Search (raw axios)
- Reviews (manual axios + getApiBaseUrl)
- Map (raw axios)
- Worker (portfolioApi - raw axios)

**Issue Count**:
- ✅ 8 modules properly use centralized clients
- ❌ 4 modules use raw axios or manual clients
- **Compliance Rate**: 67%

### ✅ Context Provider Pattern
**Pattern**: Domain-specific React Context for cross-component state

**Implemented Contexts**:
1. `AuthContext` - Authentication state
2. `MessageContext` - Messaging state
3. `NotificationContext` - Notification state
4. `PaymentContext` - Payment flow state
5. `SearchContext` - Search filters and results
6. `ContractContext` - Contract state management

### ⚠️ WebSocket Integration
**Pattern**: Mixed - Some modules use centralized Socket.IO, others have custom implementations

**Issues**:
- `dashboardService.js` manually sets up Socket.IO client
- `RealTimeChat.jsx` imports from `../../../services/websocketService`
- No centralized Socket.IO client factory in `common/services/`

**Recommendation**: Create `common/services/socketClient.js` with singleton Socket.IO client

---

## Data Flow Validation

### Successful Flow Example (Jobs Module)
```
JobSearchPage (Component)
  ↓ dispatch(fetchJobs({ search: 'plumber' }))
Redux Store (jobSlice)
  ↓ fetchJobs thunk
jobsApi.getJobs()
  ↓ jobServiceClient.get('/api/jobs', { params })
Centralized Axios (axios.js)
  ↓ Request interceptor: attach token, resolve tunnel URL
  ↓ POST https://shaggy-snake-43.loca.lt/api/jobs
API Gateway (port 5000)
  ↓ Proxy to job-service
Job Service (port 5003)
  ↓ MongoDB query, return jobs
Response
  ↓ Response interceptor: handle 401/500, normalize data
jobSlice reducer
  ↓ Update state.jobs with results
Component
  ↓ useSelector(selectJobs) - Re-render with data
```

### Broken Flow Example (Search Module)
```
SearchPage (Component)
  ↓ searchService.searchWorkers({ skills: ['carpentry'] })
searchService.js
  ↓ axios.get(`${API_URL}/search/workers`, { params }) ❌ API_URL undefined
ReferenceError: API_URL is not defined
  ↓ No retry, no auth, no tunnel resolution
  ↓ FAILURE - Component shows error state
```

---

## Issue Severity Matrix

### 🔴 PRIMARY ISSUES (Production Blockers) - 7 Total

| # | Module | Issue | Impact | Priority |
|---|--------|-------|--------|----------|
| 1 | Worker | applicationsApi.js targets non-existent routes | Applications UI broken | 🔥 CRITICAL |
| 2 | Worker | portfolioApi.js uses raw axios | Portfolio features fail in production | 🔥 CRITICAL |
| 3 | Worker | earningsService.js targets non-existent routes | Earnings tracking broken | 🔥 CRITICAL |
| 4 | Search | Raw axios usage without service client | Search broken in production | 🔥 CRITICAL |
| 5 | Search | Undefined API_URL reference | ReferenceError on all searches | 🔥 CRITICAL |
| 6 | Reviews | Manual axios bypasses interceptors | Reviews may fail with auth issues | 🔥 HIGH |
| 7 | Map | Raw axios usage without service client | Location features broken in production | 🔥 CRITICAL |
| 8 | Contracts | Undefined authServiceClient reference | updateContract() throws error | 🔥 CRITICAL |

### ⚠️ SECONDARY ISSUES (Optimization Opportunities) - 11 Total

| # | Module | Issue | Impact | Priority |
|---|--------|-------|--------|----------|
| 1 | Worker | certificateService.js DTO mismatch | Certificate uploads may fail | ⚠️ MEDIUM |
| 2 | Dashboard | Manual WebSocket configuration | Maintenance burden | ⚠️ LOW |
| 3 | Dashboard | Manual base URL resolution | Performance overhead | ⚠️ LOW |
| 4 | Profile | Overly generic route paths | Potential 404s | ⚠️ MEDIUM |
| 5 | Profile | Fallback minimal profile | Hides service errors | ⚠️ LOW |
| 6 | Hirer | Redux slice imports service clients directly | Violates separation of concerns | ⚠️ LOW |
| 7 | Contracts | Inconsistent client usage | Confusing service routing | ⚠️ MEDIUM |
| 8 | Messaging | Legacy WebSocket import in RealTimeChat | Duplicate socket connections | ⚠️ MEDIUM |
| 9 | Jobs | Legacy WebSocket import in RealTimeJobAlerts | Duplicate socket connections | ⚠️ MEDIUM |
| 10 | Reviews | Manual token attachment | Duplicates interceptor logic | ⚠️ LOW |
| 11 | Map | Undefined API_URL reference | ReferenceError on all map calls | 🔥 CRITICAL (moved to primary) |

---

## Remediation Roadmap

### Phase 1: Critical Fixes (Week 1)

#### 1.1 Fix Search Module Raw Axios (2 days)
```bash
# File: modules/search/services/searchService.js
```
**Changes**:
- Replace `import axios from '../../common/services/axios'` with proper service clients
- Remove all `${API_URL}/` prefixes
- Use `userServiceClient` for worker searches
- Use `jobServiceClient` for job searches

**Testing**:
- Search workers by skills
- Search jobs by location
- Verify tunnel URL resolution in production
- Check authentication token attachment

#### 1.2 Fix Reviews Module Manual Axios (1 day)
```bash
# File: modules/reviews/services/reviewsSlice.js
```
**Changes**:
- Add `reviewServiceClient` to `common/services/axios.js` if not exists
- Replace manual axios with `reviewServiceClient`
- Remove `getApiBaseUrl()` calls
- Remove manual Authorization header logic

**Testing**:
- Submit review
- Fetch reviews for recipient
- Verify auto-retry on 401/500

#### 1.3 Fix Map Module Raw Axios (2 days)
```bash
# File: modules/map/services/mapService.js
```
**Changes**:
- Replace `import axios from 'axios'` with service clients
- Use `jobServiceClient` for job location searches
- Use `userServiceClient` for worker location searches
- Remove `${API_URL}/` references

**Testing**:
- Location-based job search
- Worker heatmap visualization
- Job clustering on map

#### 1.4 Fix Contracts Undefined Client (1 hour)
```bash
# File: modules/contracts/services/contractService.js
```
**Changes**:
- Import `jobServiceClient` at top of file
- Replace `authServiceClient` with `jobServiceClient` in updateContract()

**Testing**:
- Update contract status
- Verify route matches backend

#### 1.5 Deprecate Worker applicationsApi.js (2 days)
**Changes**:
- Mark `applicationsApi.js` as deprecated with comments
- Migrate all imports to `workerService.getApplications()`
- Update components:
  - Worker dashboard applications list
  - Application detail pages
  - Application status components

**Testing**:
- Fetch my applications
- View application details
- Update application status

#### 1.6 Fix Worker portfolioApi.js (2 days)
**Changes**:
- Migrate all portfolio operations to `portfolioService.js` (uses `userServiceClient`)
- Update components importing `portfolioApi.js`:
  - PortfolioManager.jsx
  - WorkSampleUploader.jsx
- Fix multipart upload to use presigned URLs from fileUploadService

**Testing**:
- Portfolio search
- Work sample upload
- Certificate upload
- Portfolio item deletion

#### 1.7 Fix Worker earningsService.js (3 days)
**Changes**:
- Remove direct earnings API calls
- Migrate to job service `/api/jobs/my-jobs?status=completed` with role filter
- Calculate earnings on frontend from completed job budgets
- Update EarningsTracker.jsx and EarningsAnalytics.jsx components

**Testing**:
- Earnings display for completed jobs
- Earnings analytics charts
- Payment history correlation

### Phase 2: Secondary Fixes (Week 2)

#### 2.1 Centralize WebSocket Client (2 days)
**New File**: `common/services/socketClient.js`
**Changes**:
- Create singleton Socket.IO client factory
- Move runtime-config.json logic to central location
- Export `getSocketClient()` method
- Migrate dashboardService, RealTimeChat, RealTimeJobAlerts to use it

#### 2.2 Fix Profile Service Routes (1 day)
**Changes**:
- Update all profile routes to match backend: `/api/users/me/profile`, `/api/users/me/profile/picture`, etc.
- Verify routes with backend API documentation
- Remove fallback minimal profile, throw errors instead

#### 2.3 Refactor Hirer Slice Service Calls (2 days)
**Changes**:
- Move all direct service client calls from `hirerSlice.js` to `hirerService.js`
- Update thunks to call service methods instead of clients directly
- Maintain separation of concerns

#### 2.4 Standardize Contracts Service Client (1 day)
**Changes**:
- Ensure all contract methods use `jobServiceClient`
- Verify contract routes match backend structure
- Add JSDoc documentation for all methods

#### 2.5 Fix Worker certificateService DTOs (1 day)
**Changes**:
- Align certificate upload DTOs with user-service schema
- Update CertificateUploader.jsx to match backend expectations
- Add DTO validation before submission

---

## Module Health Scorecard

| Module | Service Client Usage | Redux Integration | Backend Connectivity | Overall Health |
|--------|---------------------|-------------------|---------------------|----------------|
| Auth | ✅ authServiceClient | ✅ Full | ✅ Working | 🟢 EXCELLENT |
| Jobs | ✅ jobServiceClient | ✅ Full | ✅ Working | 🟢 EXCELLENT |
| Messaging | ✅ messagingServiceClient | ⚠️ Partial | ✅ Working | 🟢 GOOD |
| Payment | ✅ paymentServiceClient | ⚠️ Partial | ✅ Working | 🟢 GOOD |
| Worker | ⚠️ Mixed (3 broken services) | ✅ Full | ⚠️ Partial | 🟡 NEEDS WORK |
| Search | ❌ Raw axios | ⚠️ Partial | ❌ Broken | 🔴 CRITICAL |
| Reviews | ❌ Manual axios | ✅ Full | ⚠️ Works but fragile | 🟡 NEEDS WORK |
| Map | ❌ Raw axios | ❌ None | ❌ Broken | 🔴 CRITICAL |
| Dashboard | ✅ Mixed clients | ✅ Full | ✅ Working | 🟢 GOOD |
| Profile | ✅ userServiceClient | ⚠️ Partial | ⚠️ Route mismatch | 🟡 NEEDS WORK |
| Hirer | ✅ Mixed clients | ✅ Full | ✅ Working | 🟢 GOOD |
| Contracts | ❌ Undefined client | ✅ Full | ❌ Broken | 🔴 CRITICAL |
| Settings | ✅ userServiceClient | ⚠️ Partial | ✅ Working | 🟢 GOOD |
| Notifications | ✅ messagingServiceClient | ✅ Full | ✅ Working | 🟢 EXCELLENT |

**Legend**:
- 🟢 EXCELLENT: No issues, production-ready
- 🟢 GOOD: Minor issues, functional
- 🟡 NEEDS WORK: Multiple issues, partial functionality
- 🔴 CRITICAL: Blocking issues, non-functional

---

## Verification Checklist

After completing remediation, verify each module with these tests:

### ✅ Service Client Usage
- [ ] All API calls use centralized service clients (authServiceClient, userServiceClient, jobServiceClient, messagingServiceClient, paymentServiceClient, reviewServiceClient)
- [ ] No raw axios imports from `'axios'` or `'../../common/services/axios'`
- [ ] No manual `getApiBaseUrl()` resolution
- [ ] No `${API_URL}/` prefix usage without definition

### ✅ Authentication
- [ ] No manual Authorization header attachment
- [ ] Tokens automatically attached by interceptors
- [ ] 401 responses trigger automatic token refresh
- [ ] Logout clears all tokens and redirects

### ✅ Error Handling
- [ ] 500 errors automatically retried (up to retry limit)
- [ ] Network errors handled gracefully
- [ ] User-friendly error messages displayed
- [ ] Service unavailability detected and logged

### ✅ Tunnel Resolution
- [ ] Production API calls resolve to current LocalTunnel/ngrok URL
- [ ] WebSocket connections use tunnel URL from runtime-config.json
- [ ] No hardcoded tunnel URLs in code

### ✅ Redux Integration
- [ ] All async operations use `createAsyncThunk`
- [ ] Thunks call service layer, not service clients directly
- [ ] Loading/error states properly managed in slices
- [ ] Selectors created for derived state

### ✅ Data Flow
- [ ] Component → Redux thunk → Service method → Service client → Backend
- [ ] No components calling service clients directly
- [ ] No Redux slices calling service clients directly (except via service methods)

---

## Related Audit Documents

**Cross-References**:
1. `2025-10-03_applications_api_audit.md` - Detailed applicationsApi.js route analysis
2. `2025-10-03_worker_availability_audit.md` - Availability flow route mismatch
3. `2025-10-03_portfolio_api_audit.md` - Portfolio/Sequelize controller issue
4. `2025-10-03_notification_service_audit.md` - Working notification service (reference)
5. `2025-10-03_file_upload_service_audit.md` - Working file upload patterns (reference)
6. `2025-10-03_jobs_api_audit.md` - Working jobs API patterns (reference)

---

## Conclusion

The Frontend Domain Modules sector shows a **mixed architectural health status**. Core modules (auth, jobs, messaging, payment) demonstrate excellent patterns with proper service client usage and Redux integration. However, **7 critical issues** block production functionality in search, map, reviews, and contracts modules.

**Primary Blockers**:
- Raw axios usage in search and map modules breaks tunnel resolution and authentication
- Worker module imports 3 broken auxiliary services (applications, portfolio, earnings)
- Reviews module bypasses centralized infrastructure
- Contracts module references undefined service client

**Estimated Remediation Time**: 2 weeks (1 week critical, 1 week secondary)

**Recommended Priority**: Complete Phase 1 (Critical Fixes) before any production deployment. Phase 2 can be completed iteratively post-launch.

---

**Audit Complete**: October 3, 2025
