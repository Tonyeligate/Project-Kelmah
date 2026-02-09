# Profile Subresource Data Flow – Nov 15, 2025

## Purpose
Document the newly added `/api/users/profile/(statistics|activity|preferences)` endpoints so downstream teams can trace how frontend components map to backend controllers, services, and middleware.

## Endpoint Mapping
| Frontend Component | API Call | Gateway Path | Backend Controller | Notes |
|--------------------|----------|--------------|--------------------|-------|
| `ProfilePage` Stats Tab (`profileService.getStatistics`) | `GET /api/users/profile/statistics` | API Gateway → user-service `profile` router | `user.controller.getProfileStatistics` | Returns `buildProfileStatistics` output derived from `WorkerProfile` success stats and normalized rates. Public route uses `verifyGatewayRequest` so `req.user` is trusted. |
| Activity Timeline (`profileService.getActivity`) | `GET /api/users/profile/activity` | gateway same as above | `user.controller.getProfileActivity` | Gathers job updates from `workerDoc.activity.recentJobs` and login entries from `userDoc.activity.logins`, sorts newest first. |
| Preferences Panel (`settingsService.getPreferences`) | `GET /api/users/profile/preferences` | gateway same path | `user.controller.getProfilePreferences` | Normalizes `user.preferences` Map → plain object with explicit null fallback values. |

## Backend Flow Details
1. **Gateway**: `kelmah-backend/api-gateway/server.js` proxies `/api/users/profile/*` to Render user-service (`http://localhost:5002`). Protected by `verifyGatewayRequest` so tokens forwarded.
2. **Router**: `kelmah-backend/services/user-service/routes/user.routes.js` registers `/profile/statistics`, `/profile/activity`, and `/profile/preferences` before `/me/*` routes to avoid shadowing. All routes require `verifyGatewayRequest` to hydrate `req.user`.
3. **Controller Helpers**: `user.controller.js` exposes:
   - `buildProfileStatistics(workerDoc)` (extracts completed jobs, response/on-time rates, years active, hourly rate)
   - `buildProfileActivity(workerDoc, userDoc)` (compiles job and login timeline entries, sorts by timestamp, caps to 20)
   - `normalizePreferences(preferences)` (maps undefined→null, ensures object fallback)
4. **Data Sources**:
   - `User` and `WorkerProfile` models share Mongo data. `fetchProfileDocuments` loads both while handling BSON version mismatches and native driver fallback.
   - Activity uses `workerDoc.activity.recentJobs` and `userDoc.activity.logins` arrays; statistics rely on `workerDoc.successStats`.

## Verification Steps
1. Acquire bearer token via `curl -X POST https://$TUNNEL/api/auth/login` (use shared QA credentials).
2. `curl -H "Authorization: Bearer <token>" https://$TUNNEL/api/users/profile/statistics` → expect `{ success: true, data: { ... } }`.
3. Repeat for `/profile/activity` and `/profile/preferences` to ensure normalized payload structure (no undefined values) and activity entries sorted.
4. Inspect gateway logs or `curl https://$TUNNEL/api/users/profile/preferences -H "Authorization: Bearer <token>"` ensuring `serviceTrust` middleware included.

## Next Steps
- Mirror same helper outputs on frontend `profileService` to avoid undefined responses.
- Document difference between worker stats and account settings fields so QA knows what to expect during tests.

## Nov 18, 2025 Update – Cold Start Guardrails
- Added lazy model loading helpers in `user.controller.js` (`ensureModelsLoaded`, `getUserModel`, `getWorkerProfileModel`, and `requireUserModel`). `fetchProfileDocuments` now calls these helpers before any query so `/profile/*` endpoints no longer crash when the service boots before `db.loadModels()` resolves.
- Native-driver fallback in `fetchProfileDocuments` was updated to reference the actual collection names returned by the helpers (`users`, `workerprofiles`), eliminating the mismatch that previously caused empty documents under cold starts.
- The statistics/activity/preferences handlers simply invoke `fetchProfileDocuments({ userId: req.user._id })`, keeping the higher-level logic unchanged while guaranteeing both docs exist (or throw a descriptive `AppError(404, 'User profile not found')`).
