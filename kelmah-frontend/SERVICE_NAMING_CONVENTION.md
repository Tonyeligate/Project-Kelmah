# Service Naming Convention

## Overview
This document defines the standardized naming conventions for all frontend API service files in the Kelmah platform.

## Standard Pattern: `*Service.js`

All API service files MUST follow the naming pattern `*Service.js` (e.g., `jobsService.js`, `reviewService.js`).

### ✅ Correct Examples
- `reviewService.js` - Review management operations
- `jobsService.js` - Job listing and management
- `portfolioService.js` - Portfolio CRUD operations
- `applicationsService.js` - Application management
- `eventsService.js` - Calendar events management
- `userService.js` - User profile operations
- `authService.js` - Authentication operations

### ❌ Deprecated Pattern
The `*Api.js` pattern is deprecated and should NO LONGER be used:
- ~~`reviewsApi.js`~~ → Use `reviewService.js`
- ~~`jobsApi.js`~~ → Use `jobsService.js`
- ~~`portfolioApi.js`~~ → Use `portfolioService.js`

## Rationale

1. **Semantic Clarity**: "Service" better describes the business logic layer vs raw "API" calls
2. **Consistency**: Aligns with backend naming (e.g., `auth-service`, `user-service`)
3. **Domain-Driven**: Emphasizes domain services over technical implementation details
4. **Future-Proof**: Service abstraction allows internal implementation changes

## File Structure

### Service File Template
```javascript
import { serviceClient } from '../../common/services/axios';

/**
 * [Domain] Service - Handles [domain] management
 * Routes through [Service Name] for [domain] operations
 */
class DomainService {
  /**
   * Brief description of operation
   * @param {Type} param - Parameter description
   * @returns {Promise<Object>} - Return value description
   */
  async operationName(param) {
    try {
      const response = await serviceClient.get('/endpoint', {
        params: { param }
      });
      return response.data;
    } catch (error) {
      console.error('Error message:', error);
      throw error;
    }
  }
}

const domainService = new DomainService();
export default domainService;
```

### Key Points

1. **Class-Based**: Use ES6 class pattern for service definition
2. **Singleton Export**: Export single instance (`export default new DomainService()` or instantiate then export)
3. **JSDoc Comments**: Document all methods with parameter and return types
4. **Error Handling**: Wrap API calls in try-catch blocks
5. **Console Logging**: Log errors with descriptive context

## Service Client Imports

### ✅ Correct Service Client Usage
```javascript
// Import specific service client from axios.js
import { userServiceClient } from '../../common/services/axios';
import { jobServiceClient } from '../../common/services/axios';
import { messagingServiceClient } from '../../common/services/axios';
```

### ❌ Incorrect Patterns
```javascript
// DON'T import non-existent clients
import reviewServiceClient from '../../common/services/axios'; // ❌ doesn't exist

// DON'T use generic axios
import axios from 'axios'; // ❌ bypasses interceptors and auth
```

### Available Service Clients
See `src/modules/common/services/axios.js` for complete list:
- `authServiceClient`
- `userServiceClient`
- `jobServiceClient`
- `paymentServiceClient`
- `messagingServiceClient`
- `gatewayClient` (for services without dedicated client)

## Endpoint Conventions

### ✅ Correct Endpoint Pattern
```javascript
// NO /api prefix - baseURL='/api' provides it automatically
const response = await userServiceClient.get('/reviews/worker/${userId}');
const response = await jobServiceClient.post('/jobs', jobData);
const response = await userServiceClient.delete('/reviews/${reviewId}');
```

### ❌ Incorrect Patterns
```javascript
// DON'T include /api prefix (causes /api/api/ duplication)
const response = await userServiceClient.get('/api/reviews/worker/${userId}'); // ❌
const response = await jobServiceClient.post('/api/jobs', jobData); // ❌
```

### Rationale
- Service clients are pre-configured with `baseURL='/api'`
- Requests automatically prepend `/api/` to all endpoints
- Explicit `/api/` prefix causes double slashes: `/api/api/reviews/...`

## Module Organization

### Standard Service Location
```
src/modules/[domain]/services/
├── [domain]Service.js    # Main domain service
├── [domain]Slice.js      # Redux slice (if using Redux)
└── [utility]Service.js   # Domain-specific utility services
```

### Examples
```
src/modules/reviews/services/
├── reviewService.js      # Review CRUD operations
└── reviewSlice.js        # Review state management

src/modules/jobs/services/
├── jobsService.js        # Job listing and management
└── jobsSlice.js          # Job state management

src/modules/worker/services/
├── portfolioService.js   # Portfolio management
├── applicationsService.js # Application tracking
├── certificateService.js # Certificate uploads
└── earningsService.js    # Worker earnings
```

## Import Path Conventions

### ✅ Relative Module Imports (Preferred)
```javascript
// From pages in same module
import reviewService from '../services/reviewService';
import portfolioService from '../services/portfolioService';

// From other modules (use module path)
import reviewService from '../../reviews/services/reviewService';
import userService from '../../user/services/userService';
```

### ❌ Root-Level Imports (Deprecated)
```javascript
// DON'T import from root services folder
import reviewsApi from '../../../services/reviewsApi'; // ❌ wrong location
import userService from '../../../services/userService'; // ❌ deprecated
```

### Rationale
- Modular organization keeps related code together
- Relative imports make refactoring easier
- Clear module boundaries improve maintainability

## Migration Guide

### Renaming Existing Files

1. **Rename the file**:
   ```bash
   # PowerShell
   Rename-Item -Path "jobsApi.js" -NewName "jobsService.js"
   ```

2. **Update all imports**:
   ```javascript
   // OLD
   import jobsApi from '../services/jobsApi';
   
   // NEW
   import jobsService from '../services/jobsService';
   ```

3. **Update variable references**:
   ```javascript
   // OLD
   const response = await jobsApi.getJobs();
   
   // NEW
   const response = await jobsService.getJobs();
   ```

4. **Update internal variable names** (if applicable):
   ```javascript
   // Inside the service file
   // OLD
   const jobsApi = { ... };
   export default jobsApi;
   
   // NEW
   const jobsService = { ... };
   export default jobsService;
   ```

### Verification Steps

1. **Search for old imports**:
   ```bash
   # Find remaining *Api.js imports
   grep -r "from.*Api'" src/modules/
   ```

2. **Check for /api/ prefixes**:
   ```bash
   # Find endpoints with /api/ prefix
   grep -r "'/api/" src/modules/*/services/
   ```

3. **Lint and test**:
   ```bash
   npm run lint
   npm run test
   ```

## Enforcement

### Code Review Checklist
- [ ] All new services follow `*Service.js` naming
- [ ] No `*Api.js` files in new code
- [ ] Service imports use correct client from axios.js
- [ ] Endpoints do NOT include `/api/` prefix
- [ ] Import paths are relative to module (not root)
- [ ] JSDoc comments document all methods
- [ ] Error handling includes descriptive logging

### Automated Checks
Consider adding ESLint rules to enforce:
- Filename patterns matching `*Service.js`
- No imports from deprecated `services/` root folder
- No hardcoded `/api/` in endpoint strings

## Questions?

See also:
- `API_FLOW_ARCHITECTURE.md` - Complete API flow documentation
- `src/modules/common/services/axios.js` - Service client definitions
- `FRONTEND_API_FLOW_AUDIT_COMPLETE.md` - Audit findings and fixes
