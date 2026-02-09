# Profile Page Data Flow – November 2025

## Summary
- **Issue:** `/profile` skeleton never resolves because the gateway returned `USER_PROFILE_ERROR` (BSON version mismatch) and the UI lacked a timeout or retry path.
- **Status:** ✅ Code fixes landed (backend BSON fallback + frontend timeout/error UX); pending deployment to Render + verification through LocalTunnel.

## UI Component Chain
- **Component File:** `kelmah-frontend/src/modules/profile/pages/ProfilePage.jsx`
- **Hook:** `kelmah-frontend/src/modules/profile/hooks/useProfile.js`
- **Service:** `kelmah-frontend/src/modules/profile/services/profileService.js`
- **Redux Slice:** `kelmah-frontend/src/store/slices/profileSlice.js`
- **Backend Route:** `kelmah-backend/services/user-service/routes/user.routes.js`
- **Backend Controller:** `kelmah-backend/services/user-service/controllers/user.controller.js`

## Flow Map
```
User opens /profile route
  ↓
ProfilePage.jsx useEffect detects missing profile and calls loadProfile()
  ↓
useProfile.loadProfile dispatches setLoading(true) + starts 5s timeout
  ↓
profileService.getProfile issues GET /api/users/profile via userServiceClient
  ↓
API Gateway → user-service getUserProfile controller
  ↓
Controller fetchProfileDocuments() queries Mongo (Mongoose) and falls back to native driver when BSON version mismatch is detected
  ↓
Response { success: true, data: profile, meta } returned to frontend
  ↓
profileService resolves payload, hook dispatches setProfile(profile) + setError(null)
  ↓
ProfilePage.jsx receives hydrated profile from Redux, hides skeleton, renders tabs/content
  ↓
If request exceeds 5s or errors, hook sets friendly error message; ProfilePage shows alert + Retry button
```

## Issues Identified
1. **Backend 500:** Render user-service emitted `Unsupported BSON version` whenever `findById()` executed (legacy BSON 4.x data).
2. **Frontend Timeout Gap:** `loadProfile()` awaited indefinitely, leaving `loading=true` and skeleton visible forever.
3. **Array Mutations Unsafe:** UI tried to spread `profile.skills` / `education` without guarding against `undefined`, risking runtime errors after fallback payloads.
4. **Missing Error Boundary:** Exceptions in child components could crash the page without recovery.

## Fixes Implemented
- **Backend:**
  - Added `fetchProfileDocuments()` helper with BSON version detection and native driver fallback (`db.collection('users')/('workerprofiles')`).
  - Updated `updateUserProfile` to share the same fallback path for writes and ensure worker upserts work even when Mongoose models are unavailable.
  - Normalized mongoose import to tolerate missing dependency exports.
- **Frontend:**
  - Introduced 5-second timeout + lifecycle logging in `useProfile.loadProfile()` and propagated friendly error messaging.
  - Wrapped profile content in shared `ErrorBoundary` with retry controls on `ProfilePage`.
  - Added “Retry Loading Profile” button + conditional alert when data is absent.
  - Hardened skills/education/experience mutations against `undefined` arrays.
  - Added service-level console.debug statements for better tracing.

## Verification Plan (Pending Deployment)
- [ ] Redeploy user-service so BSON fallback ships to Render (or restart after merge).
- [ ] `Invoke-RestMethod -Method Get https://<tunnel>/api/users/profile` with auth token -> expect `success:true` payload.
- [ ] Load `/profile` via frontend: skeleton hides <5s, profile data rendered, no console errors.
- [ ] Simulate network stall (throttle) to confirm timeout surfaces alert + retry button.
- [ ] Exercise skill/education/experience add/remove flows to ensure guards prevent crashes.

## Observability & Logging
- Service logs now emit `Detected BSON version mismatch while loading profile` before native retry, aiding Render diagnosis.
- `ProfileService`/`useProfile` output debug statements for request lifecycle and timeout detection.

## Follow-Up
- Coordinate Render deployment so new controller logic replaces the running instance.
- Once live, capture QA screenshots showing skeleton → hydrated transition and post to spec-kit.
- Consider porting timeout pattern to other profile-dependent screens (e.g., dashboard cards).