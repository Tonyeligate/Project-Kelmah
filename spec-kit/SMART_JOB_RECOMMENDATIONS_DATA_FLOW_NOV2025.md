## Smart Job Recommendations Data Flow Analysis (Nov 11, 2025)

### UI Component Chain
- **Component File**: `kelmah-frontend/src/modules/search/components/SmartJobRecommendations.jsx`
- **Service File**: `kelmah-frontend/src/modules/search/services/smartSearchService.js`
- **Redux Slice**: `kelmah-frontend/src/modules/jobs/services/jobSlice.js` (saved jobs interactions)
- **Backend Controller**: `kelmah-backend/services/job-service/controllers/job.controller.js` (`getJobRecommendations`)
- **Backend Route**: `kelmah-backend/services/job-service/routes/job.routes.js` → `GET /api/jobs/recommendations`
- **Gateway Path**: API Gateway proxy `GET /api/jobs/recommendations/worker` (worker-only)

### Flow Map
```
User opens Find Talents / dashboard widgets
  ↓
SmartJobRecommendations.jsx (useEffect → loadRecommendations)
  ↓
smartSearchService.getSmartJobRecommendations(userId, options)
  ↓
axios userServiceClient GET /api/jobs/recommendations/worker?userId=...
  ↓
API Gateway forwards to job-service /api/jobs/recommendations (verifyGatewayRequest + worker role)
  ↓
job.controller.getJobRecommendations → transformJobForFrontend + calculateJobMatchScore
  ↓
Response: { success, data: { jobs, insights, totalRecommendations, averageMatchScore } }
  ↓
Component state updates → cards render, saved jobs synced via jobSlice
  ↓
User saves/applies → jobSlice thunks → /api/jobs/:id/save, /api/jobs/:id/apply (unchanged)
```

### Issues Identified & Fixes
1. ❌ **Endpoint mismatch caused 404/503 fallback**
   - **Details**: Frontend called `/api/search/recommendations/:id`, but gateway exposed `/api/jobs/recommendations` (worker-auth). Resulted in snackbar errors after QA banner "Failed to load smart recommendations".
   - **Fix**: Updated `smartSearchService.getSmartJobRecommendations` to target `/api/jobs/recommendations/worker` with `userId` query param, aligning with gateway + service trust guard.

2. ❌ **Backend response lacked frontend shape / AI copy**
   - **Details**: Controller returned raw Mongoose documents without `matchBreakdown` keys or AI insight messaging, leaving component to crash when attempting to render optional fields.
   - **Fix**: Augmented `getJobRecommendations` to transform jobs via `transformJobForFrontend`, attach `matchScore`, optional `matchBreakdown`, and compose AI summary/tags when requested.

3. ❌ **UI failed gracefully for non-worker or signed-out users**
   - **Details**: Component assumed worker role and attempted to render recommendations, triggering errors + undefined state updates for hirers/guests.
   - **Fix**: Added worker-role guard, sign-in prompt, and memoized info messages to show actionable guidance without surfacing error alerts.

4. ✅ **Saved job toggle inconsistencies**
   - **Details**: Saved job identification mixed `_id`, `id`, `jobId`, causing duplicate save states.
   - **Fix**: Normalized saved job IDs into a memoized `Set`, using derived `jobKey` for all interactions and card keys.

### Verification Commands
- `curl -H "Authorization: Bearer <worker_token>" "https://<current-tunnel>.loca.lt/api/jobs/recommendations/worker?userId=<workerId>&limit=6"`
- Expect `{ "success": true, "data": { "jobs": [...], "insights": {...} } }` with HTTP 200.
- Repeat with hirer token → expect HTTP 403 and frontend info message, no snackbar error.

### Residual Risks & Follow-Up
- 🔄 **Match scoring**: Still heuristic; consider relocating to dedicated recommendation service when ML model ready.
- 🔄 **Insight tags**: Currently derived from worker profile; enhance once richer analytics available.
- ✅ **Spec-kit linkage**: STATUS_LOG updated; maintain sync if additional rec flows change.
