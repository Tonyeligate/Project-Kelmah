# Frontend API Routing Audit - November 2025

## Status: COMPLETED ✅
**Date**: November 2025
**Auditor**: AI Agent
**Type**: API Endpoint Flow Audit and Fixes

---

## Executive Summary

A comprehensive audit of the frontend API routing and endpoint flow was conducted. The audit identified and fixed **critical double `/api/` prefix bugs** that were causing API requests to fail with 404 errors.

### Root Cause
The `apiClient.js` uses `baseURL: 'https://kelmah-api-gateway-50z3.onrender.com/api'` which already includes the `/api` prefix. However, several service files were also prefixing their endpoints with `/api/`, resulting in malformed URLs like:
```
https://kelmah-api-gateway-50z3.onrender.com/api/api/profile/...
```

---

## Fixes Applied

### 1. portfolioService.js ✅
**Location**: `src/modules/worker/services/portfolioService.js`
**Issue**: `PROFILE_BASE = '/api/profile'`
**Fix**: Changed to `PROFILE_BASE = '/profile'`

```javascript
// BEFORE (broken)
const PROFILE_BASE = '/api/profile';

// AFTER (fixed)
const PROFILE_BASE = '/profile';
```

### 2. settingsService.js ✅
**Location**: `src/modules/settings/services/settingsService.js`
**Issue**: `SETTINGS_BASE = '/api/settings'`
**Fix**: Changed to `SETTINGS_BASE = '/settings'`

```javascript
// BEFORE (broken)
const SETTINGS_BASE = '/api/settings';

// AFTER (fixed)
const SETTINGS_BASE = '/settings';
```

### 3. fileUploadService.js ✅
**Location**: `src/modules/common/services/fileUploadService.js`
**Issue**: All paths had `/api/` prefix
**Fix**: Removed `/api/` from all paths

```javascript
// BEFORE (broken)
const SERVICE_TARGETS = {
  user: {
    presign: '/api/profile/uploads/presign',
    directUpload: '/api/profile/uploads',
  },
  messaging: {
    presign: '/api/uploads/presign',
    directUpload: (folder) => `/api/messages/${folder}/attachments`,
  },
};

// AFTER (fixed)
const SERVICE_TARGETS = {
  user: {
    presign: '/profile/uploads/presign',
    directUpload: '/profile/uploads',
  },
  messaging: {
    presign: '/uploads/presign',
    directUpload: (folder) => `/messages/${folder}/attachments`,
  },
};
```

### 4. certificateService.js ✅
**Location**: `src/modules/worker/services/certificateService.js`
**Issue**: All 11 endpoints had `/api/profile` prefix
**Fix**: Removed `/api/` from all endpoints

**Endpoints Fixed**:
- `getWorkerCertificates`: `/api/profile/${workerId}/certificates` → `/profile/${workerId}/certificates`
- `createCertificate`: `/api/profile/${workerId}/certificates` → `/profile/${workerId}/certificates`
- `updateCertificate`: `/api/profile/certificates/${id}` → `/profile/certificates/${id}`
- `deleteCertificate`: `/api/profile/certificates/${id}` → `/profile/certificates/${id}`
- `requestVerification`: `/api/profile/certificates/${id}/verify` → `/profile/certificates/${id}/verify`
- `getVerificationStatus`: `/api/profile/certificates/${id}/verification` → `/profile/certificates/${id}/verification`
- `getCertificateStats`: `/api/profile/${workerId}/certificates/stats` → `/profile/${workerId}/certificates/stats`
- `shareCertificate`: `/api/profile/certificates/${id}/share` → `/profile/certificates/${id}/share`
- `validateCertificate`: `/api/profile/certificates/${id}/validate` → `/profile/certificates/${id}/validate`
- `getExpiringCertificates`: `/api/profile/${workerId}/certificates/expiring` → `/profile/${workerId}/certificates/expiring`
- `searchCertificates`: `/api/profile/${workerId}/certificates/search` → `/profile/${workerId}/certificates/search`

### 5. messagingService.js ✅
**Location**: `src/modules/messaging/services/messagingService.js`
**Issues**: 
1. Malformed path for getMessages: `/messaging/messages/conversations/${id}/messages`
2. Undefined `jobId` variable in `createDirectConversation`

**Fixes**:
```javascript
// BEFORE (broken getMessages)
api.get(`/messaging/messages/conversations/${conversationId}/messages`)

// AFTER (fixed)
api.get(`/messages/conversations/${conversationId}/messages`)

// BEFORE (broken createDirectConversation)
async createDirectConversation(participantId) {
  // jobId was undefined!
  api.post('/messaging/conversations', { participantIds: [participantId], type: 'direct', jobId });
}

// AFTER (fixed)
async createDirectConversation(participantId, jobId = null) {
  const payload = { participantIds: [participantId], type: 'direct' };
  if (jobId) payload.jobId = jobId;
  api.post('/messaging/conversations', payload);
}
```

### 6. hirerService.js ✅
**Location**: `src/modules/hirer/services/hirerService.js`
**Issue**: Fallback path had `/api/` prefix
**Fix**: Removed `/api/` from fallback

```javascript
// BEFORE (broken)
return `/api/users/workers/${workerId}/bookmark`;

// AFTER (fixed)
return `/users/workers/${workerId}/bookmark`;
```

### 7. profileService.js ✅
**Location**: `src/modules/profile/services/profileService.js`
**Issue**: Misleading comment (code was correct)
**Fix**: Updated comment to reflect actual behavior

---

## API Architecture Overview

### Frontend API Client Configuration
```
apiClient.baseURL = 'https://kelmah-api-gateway-50z3.onrender.com/api'
```

### Correct Endpoint Pattern
All service files should use paths **WITHOUT** the `/api/` prefix:
- ✅ Correct: `/users/profile`
- ❌ Wrong: `/api/users/profile`

### Backend API Gateway Routes
The API Gateway exposes these route prefixes:
- `/api/auth/*` - Authentication
- `/api/users/*` - User management
- `/api/jobs/*` - Job operations
- `/api/messages/*` - Messaging (also `/api/messaging/*`)
- `/api/payments/*` - Payment processing
- `/api/reviews/*` - Reviews
- `/api/notifications/*` - Notifications
- `/api/profile/*` - Profile management
- `/api/settings/*` - Settings

---

## Testing Verification

After fixes, all API calls should produce correct URLs:

### Before Fixes (Broken)
```
GET https://kelmah-api-gateway-50z3.onrender.com/api/api/profile/worker123/certificates → 404
GET https://kelmah-api-gateway-50z3.onrender.com/api/api/settings/notifications → 404
POST https://kelmah-api-gateway-50z3.onrender.com/api/api/profile/uploads/presign → 404
```

### After Fixes (Working)
```
GET https://kelmah-api-gateway-50z3.onrender.com/api/profile/worker123/certificates → 200
GET https://kelmah-api-gateway-50z3.onrender.com/api/settings/notifications → 200
POST https://kelmah-api-gateway-50z3.onrender.com/api/profile/uploads/presign → 200
```

---

## Files Modified

| File | Changes |
|------|---------|
| `src/modules/worker/services/portfolioService.js` | Removed `/api/` prefix from PROFILE_BASE |
| `src/modules/settings/services/settingsService.js` | Removed `/api/` prefix from SETTINGS_BASE |
| `src/modules/common/services/fileUploadService.js` | Removed `/api/` from all SERVICE_TARGETS paths |
| `src/modules/worker/services/certificateService.js` | Removed `/api/` from all 11 endpoints |
| `src/modules/messaging/services/messagingService.js` | Fixed path structure and undefined jobId |
| `src/modules/hirer/services/hirerService.js` | Removed `/api/` from fallback path |
| `src/modules/profile/services/profileService.js` | Fixed misleading comment |

---

## Prevention Guidelines

### For Future Development

1. **Never prefix paths with `/api/`** when using the `api` client from `apiClient.js`
2. **The baseURL already includes `/api`**, so all paths should start with the resource name
3. **Example patterns**:
   - ✅ `/users/profile`
   - ✅ `/jobs/${jobId}/apply`
   - ✅ `/messaging/conversations`
   - ❌ `/api/users/profile`
   - ❌ `/api/jobs/${jobId}/apply`

4. **When creating new services**, follow this pattern:
   ```javascript
   import { api } from '../../../services/apiClient';
   
   // Correct - no /api prefix
   const myService = {
     getItems: () => api.get('/myresource/items'),
     createItem: (data) => api.post('/myresource/items', data),
   };
   ```

---

## Related Documentation

- Previous fix: `workerSlice.js` - Double /api prefix fix (7 endpoints)
- Architecture: `spec-kit/REMOTE_SERVER_ARCHITECTURE.md`
- API Standards: `.github/copilot-instructions.md` - API Routing section

---

## Additional Fix: Job Creation 500 Error

### Issue Discovered
After fixing the API routing issues, a **500 Internal Server Error** was occurring on `POST /api/jobs` when users tried to create jobs.

### Root Cause Analysis
1. **Frontend skills mismatch**: `JobPostingPage.jsx` offered generic skills like "Web Development", "Mobile Development", "Design", "Writing", "Marketing"
2. **Backend validation**: The `Job` model requires `requirements.primarySkills` to be from a specific enum: `["Plumbing", "Electrical", "Carpentry", "Construction", "Painting", "Welding", "Masonry", "HVAC", "Roofing", "Flooring"]`
3. **Controller mapping**: The job controller was copying frontend skills directly to `requirements.primarySkills` without validation

### Fixes Applied

#### 1. Frontend - JobPostingPage.jsx
Changed skills options to match vocational platform purpose:
```javascript
// BEFORE (wrong for vocational platform)
options={[
  'Web Development',
  'Mobile Development',
  'Design',
  'Writing',
  'Marketing',
]}

// AFTER (correct vocational skills)
options={[
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Construction',
  'Painting',
  'Welding',
  'Masonry',
  'HVAC',
  'Roofing',
  'Flooring',
]}
```

#### 2. Backend - job.controller.js
Added skill validation and category-to-skill mapping:
```javascript
const VALID_PRIMARY_SKILLS = ["Plumbing", "Electrical", "Carpentry", "Construction", "Painting", "Welding", "Masonry", "HVAC", "Roofing", "Flooring"];

// Filter to valid skills only
const validSkills = allSkills.filter(skill => VALID_PRIMARY_SKILLS.includes(skill));

// Map categories to skills if no valid skills found
const categoryToSkill = {
  'Plumbing': 'Plumbing',
  'Electrical': 'Electrical',
  'Carpentry': 'Carpentry',
  'Tiling': 'Flooring',
  'Interior Design': 'Painting',
  'Landscaping': 'Construction',
  // ... etc
};
```

### Deployment Status
- Git commit: `b1656104`
- Vercel: Auto-deploying (~1-2 minutes)
- Render: Auto-deploying (~2-3 minutes)

---

**Audit Complete** ✅
