# Job Search Suggestions Endpoint Implementation

## Status
- **Date:** November 7, 2025
- **State:** In Progress 🔄
- **Owner:** GitHub Copilot (AI Agent)

## Problem Statement
- Frontend autosuggest flow (`SearchPage.jsx`, `fetchSearchSuggestions`) issues GET `/api/search/suggestions` on every debounced keyword change.
- API Gateway proxies `/api/search` traffic to the job-service, but job-service lacks a matching route/controller method; 404 bubbles back to frontend.
- Result: Suggestion dropdown never opens, console logs `Error fetching search suggestions`, and QA blockers persist for Find Workers experience.

## Affected Components
- `kelmah-frontend/src/modules/search/pages/SearchPage.jsx`
- `kelmah-backend/api-gateway/routes/job.routes.js`
- `kelmah-backend/services/job-service/routes/job.routes.js`
- `kelmah-backend/services/job-service/controllers/job.controller.js`
- Shared models: `Job`, `User`

## Solution Outline
1. **Controller Logic**
   - Add `getSearchSuggestions` to `job.controller.js`.
   - Accept `q` (alias `keyword`) query param; trim, lowercase, early exit on <2 chars.
   - Query MongoDB for open/public jobs, projecting title, category, skills, location, hirer.
   - Build suggestion buckets (job title, skill, location, employer) capped at 8 total.
   - Provide highlight metadata `{ type, label, value }` to support UI improvements.
2. **Routing**
   - Expose new public GET `/suggestions` route in job-service router before auth middleware.
   - Ensure API Gateway maps `/api/search/suggestions` to job-service `/api/jobs/suggestions` (public proxy).
3. **Response Contract**
   - Standard success wrapper via `successResponse` helper: `{ success: true, message, data: suggestions }`.
   - On invalid query: return `success: true` with empty array to keep UI silent.
4. **Performance & Resilience**
   - Use Mongo `$regex` anchored at query start for key fields; limit pipeline to 20 docs before transformation.
   - Add try/catch with structured logging using existing controller patterns.
   - Consider caching hook (future) once pattern validated.

## Verification Plan
- `curl "https://<CURRENT_LOCALTUNNEL>.loca.lt/api/search/suggestions?q=elec"`
- Expect HTTP 200 with structured payload, max 8 suggestions, ordered by relevance.
- Regression: `/api/jobs` unaffected, job routes remain public for browsing.
- Frontend manual test: Type `elec` in Find Workers search input → dropdown populates.

## Open Questions / Follow-Up
- Should worker-service also expose suggestions (workers + jobs)? Current UI only queries jobs index; coordinate if worker autosuggest planned.
- Need to confirm if API Gateway requires explicit `/search/suggestions` entry or reuse existing wildcard.

## Next Actions
1. Implement controller + route updates (current task). ✅ _Completed_
   - Added `getSearchSuggestions` in `job.controller.js` with Mongo driver aggregation.
   - Exposed public route `GET /api/jobs/suggestions` in job-service router.
2. Update API Gateway mapping as needed. ✅ _Completed_
   - Registered `/api/search/suggestions` proxy via new `search.routes.js` forwarding to job-service.
3. Add regression notes to STATUS_LOG once completed with verification evidence. 🔄
4. Consider unit test coverage in follow-up iteration. 🔄

## Pending Verification
- [ ] Start API Gateway + job-service locally, invoke `curl http://localhost:5000/api/search/suggestions?q=elec` (or via active LocalTunnel) and confirm `data` array populated.
- [ ] Manual Find Workers UI regression to ensure dropdown renders suggestions and handles empty states gracefully.
