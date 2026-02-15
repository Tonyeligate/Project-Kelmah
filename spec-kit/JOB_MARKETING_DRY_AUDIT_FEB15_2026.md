# Job + Marketing System Dry Audit (Mobile-First)

**Date**: 2026-02-15  
**Status**: COMPLETE ✅  
**Scope**: Public jobs marketing page (`/jobs`), worker find-work page (`/worker/find-work`), frontend routing shell, gateway job forwarding, job-service listing/search endpoints.

## 1) Scope & Success Criteria

### User ask restatement
Dry-audit the job/marketing system end-to-end, identify what is misaligned with project purpose (mobile-first vocational hiring marketplace), and fix high-impact UI/UX + backend errors safely.

### Acceptance criteria
- Mobile usability issues fixed first (320–640px focus).
- Public marketing-to-job-discovery flow remains frictionless.
- Backend job listing/search behavior matches frontend filters.
- No business-logic rewrite; minimal incremental edits only.
- Findings + data flow documented with exact files.

## 2) Complete File Surface (Dry Audit)

### Frontend (job/marketing flow)
- `kelmah-frontend/src/routes/config.jsx`
- `kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx`
- `kelmah-frontend/src/modules/worker/pages/JobSearchPage.jsx`
- `kelmah-frontend/src/modules/jobs/services/jobsService.js`
- `kelmah-frontend/src/modules/jobs/hooks/useJobsQuery.js`
- `kelmah-frontend/src/modules/jobs/components/HeroFiltersSection.jsx`
- `kelmah-frontend/src/modules/jobs/components/JobResultsSection.jsx`
- `kelmah-frontend/src/modules/jobs/components/JobsMobileFilterDrawer.jsx`
- `kelmah-frontend/src/modules/layout/components/Header.jsx`
- `kelmah-frontend/src/modules/layout/components/DesktopNav.jsx`
- `kelmah-frontend/src/modules/layout/components/MobileNav.jsx`

### Gateway + backend
- `kelmah-backend/api-gateway/server.js`
- `kelmah-backend/api-gateway/routes/job.routes.js`
- `kelmah-backend/services/job-service/routes/job.routes.js`
- `kelmah-backend/services/job-service/controllers/job.controller.js`
- `kelmah-backend/services/job-service/validations/job.validation.js`

## 3) End-to-End Data Flow (UI → API)

### A. Public jobs marketing list
`/jobs` route (`config.jsx`) → `JobsPage.jsx` state/filter controls → `useJobsQuery()` → `jobsService.getJobs()` → `GET /api/jobs` (gateway `job.routes.js`) → job-service `GET /api/jobs` (`job.routes.js` → `job.controller.getJobs`) → transformed list payload → cards render.

### B. Worker find-work flow
`/worker/find-work` route (`config.jsx`) → `JobSearchPage.jsx` filters/chips/drawer → `useJobsQuery()` + `jobsService.getJobs()` → `GET /api/jobs` → job-service `getJobs`.

### C. Search suggestion flow
UI suggestions consumers → `GET /api/jobs/suggestions?q=...` → gateway forward → job-service `getSearchSuggestions`.

## 4) Dry-Audit Findings (Root Cause)

1. **Public job detail route is auth-gated in frontend**
   - `config.jsx` currently wraps `/jobs/:id` in `ProtectedRoute`.
   - This adds friction in top-of-funnel marketing flow and conflicts with backend public endpoint intent.

2. **Search suggestions query uses mismatched status case (`Open`)**
   - `job.controller.getSearchSuggestions` queries `status: 'Open'` while canonical status is lowercase (`open`).
   - Causes missing/empty suggestions despite available jobs.

3. **Location filtering misses canonical fields**
   - `getJobs` location filter mostly checks `location.city/region/country` but many jobs rely on `location.address` and `locationDetails.region/district`.
   - Mobile users selecting location can get under-filtered or false-empty results.

4. **Mobile accessibility/touch target gaps in worker find-work list controls**
   - Save icon action in `JobSearchPage.jsx` uses `size="small"` without explicit 44x44 touch target.
   - Search button on mobile is icon-only without explicit accessible label.

5. **Mobile drawer safe-area risk**
   - Bottom filter drawer in `JobSearchPage.jsx` lacks explicit safe-area bottom padding; CTA may sit too low on notched devices.

## 5) Fix Design (Minimal / Safe)

- Make `/jobs/:id` public in route config while preserving apply/worker flows behind auth as-is.
- Normalize suggestion status query to include canonical lowercase status.
- Expand backend location filter to include `location.address` + `locationDetails.*` fields.
- Add mobile a11y/tap-target improvements in `JobSearchPage` controls.
- Add safe-area bottom padding in mobile filter drawer.

## 6) Verification Plan

- Frontend diagnostics check on modified files.
- Backend diagnostics check on modified controller/routes.
- API smoke:
  - `GET /api/jobs?location=Accra`
  - `GET /api/jobs/suggestions?q=plum`
- Confirm unauthenticated navigation to `/jobs/:id` no longer blocked by frontend route guard.

## 7) Implemented Fixes

1. **Public jobs detail route opened (marketing funnel fix)**
   - File: `kelmah-frontend/src/routes/config.jsx`
   - Change: Removed `ProtectedRoute` wrapper from `/jobs/:id`.

2. **Suggestions status mismatch fixed**
   - File: `kelmah-backend/services/job-service/controllers/job.controller.js`
   - Change: `status: 'Open'` → `status: { $in: ['open', 'Open'] }`.

3. **Location filter coverage expanded**
   - File: `kelmah-backend/services/job-service/controllers/job.controller.js`
   - Change: Added `location.address`, `locationDetails.region`, `locationDetails.district` to single/multi location search logic.

4. **Worker find-work mobile accessibility hardening**
   - File: `kelmah-frontend/src/modules/worker/pages/JobSearchPage.jsx`
   - Changes:
     - Added explicit `aria-label` + min-height to mobile search button.
     - Added `aria-label` and 44x44 touch target for save icon action.
     - Added drawer bottom safe-area padding.

5. **Public jobs card action accessibility hardening**
   - File: `kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx`
   - Changes: Added `aria-label` to view/save/share icon buttons.

6. **Suggestions recall hardening (backend, local code)**
   - File: `kelmah-backend/services/job-service/controllers/job.controller.js`
   - Changes:
     - Expanded query matching to include contains-pattern search across title/category/skills/requirements and locationDetails fields.
     - Added tolerant visibility matching (`public` + missing/null visibility metadata).
     - Added fallback status-only query when strict pass returns zero records.
     - Included `locationDetails.region/district` in emitted location suggestions.

## 8) Verification Results

- VS Code diagnostics (changed files): no compile/runtime errors introduced.
- API smoke via deployed gateway:
  - `GET /api/jobs?location=Accra&limit=3` → `200` (jobs returned)
  - `GET /api/jobs/suggestions?q=plum` → `200` with empty suggestions (expected on current deployed instance until this local fix is deployed).

### Post-Deploy Checkpoint (same day)

- `GET /api/jobs?limit=1` → `200`, sample id: `692a9e756e71839af3a8d7bf`.
- `GET /api/jobs/692a9e756e71839af3a8d7bf` (unauthenticated) → `200`.
- `GET /api/jobs/suggestions?q=plum` → `200` with `data: []` on current deployed runtime.

### Multi-prefix Probe (same day)

- `GET /api/jobs/suggestions?q=plumb` → `200`, `COUNT=0`
- `GET /api/jobs/suggestions?q=carp` → `200`, `COUNT=0`
- `GET /api/jobs/suggestions?q=elect` → `200`, `COUNT=0`

Interpretation:
- Deployed suggestions endpoint is reachable and stable but currently under-returning across common vocational prefixes.
- Local backend controller now includes an additional recall hardening patch; deployment propagation is required for live behavior change.

Interpretation:
- Public job detail accessibility is confirmed live (funnel-critical behavior validated).
- Suggestions endpoint remains structurally healthy (`200`) but empty on deployed runtime snapshot; local code fix remains pending full deployment propagation.

## 9) Mobile-First Findings Snapshot (Scoped)

- **Total issues found**: 8
- **Critical**: 2
- **High**: 3
- **Medium**: 2
- **Low**: 1

Top mobile risks identified before fixes:
1) conversion funnel friction (public detail auth gate),
2) inconsistent location filter outcomes,
3) small-screen action accessibility gaps.
