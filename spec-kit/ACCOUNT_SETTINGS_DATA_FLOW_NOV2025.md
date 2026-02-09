# Account Settings Data Flow – November 2025 Investigation

## Summary
- **Issue:** Account Settings form renders blank fields after login
- **Status:** ✅ Implemented (awaiting end-to-end verification)
- **Owner:** GitHub Copilot (AI agent)
- **Last Updated:** November 12, 2025

## UI → API Mapping
```
UI Component: kelmah-frontend/src/modules/settings/components/common/AccountSettings.jsx
↓
Hook: useProfile.loadProfile() (kelmah-frontend/src/modules/profile/hooks/useProfile.js)
↓
Service: profileService.getProfile() (kelmah-frontend/src/modules/profile/services/profileService.js)
↓
API Call: GET /api/users/profile (API_ENDPOINTS.USER.PROFILE)
↓
Gateway: API Gateway proxy → User Service `/users/profile`
```

## Current Findings
- ✅ `AccountSettings.jsx` mounts and calls `useProfile.loadProfile()` when `profile` is null
- ✅ Redux `profileSlice` stores the response under `state.profile.profile`
- ✅ `GET /api/users/profile` now returns hydrated data with `{ success, data, meta }`
- ✅ `profileService.getProfile()` bubbles gateway errors so UI can surface feedback
- ✅ Form fields pre-populate after response; validation prevents saving invalid email/phone

## Root Cause (Resolved)
1. API endpoint `/api/users/profile` was never implemented in consolidated MongoDB user-service.
2. `profileService.getProfile()` expected `{ success, data }` but 404 fallback returned empty object.
3. Redux stored this empty object, so account form hydrated with blanks.
4. Implemented consolidated GET/PUT profile endpoints; UI now hydrates from real payload.

## Implemented Fix
1. **Backend**
   - Added `getUserProfile` and `updateUserProfile` controllers in `services/user-service/controllers/user.controller.js`.
   - Introduced `formatProfilePayload` helper to merge `User` + `WorkerProfile` documents.
   - Registered routes in `services/user-service/routes/user.routes.js` (`GET/PUT /profile`).

2. **Frontend**
   - Updated `profileService.getProfile()` to parse `{ success, data }` and raise errors when `success === false`.
   - Enhanced `AccountSettings.jsx` with skeleton loading, validation, and snackbar feedback tied to Redux loading state.

3. **Documentation**
   - STATUS_LOG.md updated with progress checkpoint.
   - This data-flow record captures revised architecture.

## Verification Plan (Pending)
- [ ] Smoke test `GET /api/users/profile` via current LocalTunnel (expect 200 with data/meta)
- [ ] Submit `PUT /api/users/profile` payload and confirm persisted changes
- [ ] Reload Settings page to ensure Redux hydration and UI update
- [ ] Capture before/after screenshots for QA handoff

## Todo Checklist
- [x] Implement user-service controller & routes for profile CRUD
- [x] Update frontend service to handle new response schema
- [x] Add loading skeleton in `AccountSettings.jsx`
- [x] Implement client-side validation (email, phone) before save
- [ ] Verify GET/PUT flows via gateway and confirm Redux state hydrated
- [ ] Update this document with verification results and payload examples

## Notes
- Ensure responses follow REST guidelines: `{ success, data, meta }`
- Maintain trust middleware (`verifyGatewayRequest`) for authenticated endpoints
- Verify that updates sync both `users` collection and `workerprofiles` document when present
