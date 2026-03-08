# Frontend Structural Role Split Follow-up — March 8, 2026

## Scope
This pass completed the deeper structural separation left open after the first March 8 frontend remediation.

Targeted objectives:
- split requester quick-hire flows from worker quick-job flows
- give hirers their own profile and scheduling surfaces
- remove duplicate public vs hirer worker-search orchestration
- keep shared internals reusable while moving user-facing ownership to role-owned routes

## Dry-audit file surface
- `kelmah-frontend/src/routes/config.jsx`
- `kelmah-frontend/src/modules/search/pages/SearchPage.jsx`
- `kelmah-frontend/src/modules/search/components/WorkerDirectoryExperience.jsx`
- `kelmah-frontend/src/modules/hirer/pages/WorkerSearchPage.jsx`
- `kelmah-frontend/src/modules/hirer/components/WorkerSearch.jsx`
- `kelmah-frontend/src/modules/quickjobs/components/ServiceCategorySelector.jsx`
- `kelmah-frontend/src/modules/quickjobs/pages/QuickJobRequestPage.jsx`
- `kelmah-frontend/src/modules/quickjobs/pages/QuickJobTrackingPage.jsx`
- `kelmah-frontend/src/modules/quickjobs/pages/NearbyJobsPage.jsx`
- `kelmah-frontend/src/modules/quickjobs/services/quickJobService.js`
- `kelmah-frontend/src/modules/profile/pages/ProfilePage.jsx`
- `kelmah-frontend/src/modules/profile/hooks/useProfile.js`
- `kelmah-frontend/src/modules/profile/services/profileService.js`
- `kelmah-frontend/src/modules/scheduling/pages/SchedulingPage.jsx`
- `kelmah-frontend/src/modules/scheduling/components/AppointmentForm.jsx`
- `kelmah-backend/shared/models/QuickJob.js`
- `kelmah-backend/services/job-service/controllers/quickJobController.js`
- `kelmah-backend/services/job-service/controllers/quickJobPaymentController.js`

## End-to-end flow updates

### 1. Public worker discovery
```text
User visits /find-talents or /search
  ↓
SearchPage.jsx
  ↓
WorkerDirectoryExperience.jsx (variant="public")
  ↓
worker search UI + URL sync + suggestions + results orchestration
  ↓
GET /api/users/workers + GET /api/users/workers/suggest
  ↓
API Gateway
  ↓
User service worker-search endpoints
  ↓
Public worker results render
```

### 2. Hirer talent discovery
```text
Hirer visits /hirer/find-talent
  ↓
WorkerSearchPage.jsx
  ↓
WorkerDirectoryExperience.jsx (variant="hirer")
  ↓
shared search orchestration with hirer-only tools sidebar
  ↓
GET /api/users/workers + GET /api/users/workers/suggest
  ↓
API Gateway
  ↓
User service worker-search endpoints
  ↓
Role-owned hirer recruiting view renders
```

### 3. Hirer quick-hire request flow
```text
Hirer selects service category or visits /hirer/quick-hire/request
  ↓
QuickJobRequestPage.jsx
  ↓
POST /api/quick-jobs
  ↓
API Gateway quick-job proxy
  ↓
job-service quickJobController.createQuickJob()
  ↓
Mongo QuickJob document created
  ↓
frontend redirects to /hirer/quick-hire/:jobId
  ↓
HirerQuickJobTrackingPage.jsx
```

### 4. Hirer quick-hire tracking flow
```text
Hirer visits /hirer/quick-hire/:jobId
  ↓
HirerQuickJobTrackingPage.jsx
  ↓
GET /api/quick-jobs/:id
  ↓
job-service quickJobController.getQuickJob()
  ↓
quotes / accepted worker / tracking / escrow returned
  ↓
Hirer actions:
  - accept quote → POST /api/quick-jobs/:id/accept-quote
  - pay → POST /api/quick-jobs/:id/pay
  - approve → POST /api/quick-jobs/:id/approve
  - dispute → POST /api/quick-jobs/:id/dispute
  - cancel → POST /api/quick-jobs/:id/cancel

Paystack callback flow:
  - backend issues /quick-job/:jobId/payment-callback
  - frontend compatibility route preserves query params and redirects by role
  - hirer page verifies `reference` / `trxref` via GET /api/quick-jobs/payment/verify/:reference
  - request refetch updates UI to funded status
```

### 5. Role-owned profile + schedule aliases
```text
Header / mobile nav still links to /profile and /schedule
  ↓
routes/config.jsx RoleAliasRedirect
  ↓
worker → /worker/profile or /worker/schedule
hirer → /hirer/profile or /hirer/schedule
admin → admin home
```

## Files changed
- `kelmah-frontend/src/routes/config.jsx`
- `kelmah-frontend/src/modules/search/pages/SearchPage.jsx`
- `kelmah-frontend/src/modules/search/components/WorkerDirectoryExperience.jsx`
- `kelmah-frontend/src/modules/hirer/pages/WorkerSearchPage.jsx`
- `kelmah-frontend/src/modules/hirer/pages/HirerProfilePage.jsx`
- `kelmah-frontend/src/modules/hirer/pages/HirerSchedulingPage.jsx`
- `kelmah-frontend/src/modules/hirer/pages/HirerQuickJobTrackingPage.jsx`
- `kelmah-frontend/src/modules/quickjobs/pages/QuickJobRequestPage.jsx`
- `kelmah-frontend/src/modules/quickjobs/components/ServiceCategorySelector.jsx`
- `kelmah-frontend/src/modules/quickjobs/services/quickJobService.js`
- `kelmah-frontend/src/modules/scheduling/pages/SchedulingPage.jsx`
- `kelmah-frontend/src/modules/scheduling/components/AppointmentForm.jsx`
- `spec-kit/STATUS_LOG.md`

## Fixes completed

### 1. Search ownership is now shared-internal but route-owned externally
- `SearchPage.jsx` is now a thin public wrapper.
- `WorkerSearchPage.jsx` now uses the same shared container in hirer mode.
- `WorkerDirectoryExperience.jsx` now becomes the single orchestration surface for worker directory UX.

**Impact**
- removed public/hirer pathname sniffing from the route pages
- future search split can happen around wrappers instead of duplicate implementations

### 2. Hirers now have a true profile surface
Added `modules/hirer/pages/HirerProfilePage.jsx` and routed `/hirer/profile` there.

The page reuses:
- `useProfile()`
- profile slice selectors
- shared `ProfilePicture`

But the visible UX is hirer-owned:
- business identity summary
- company-oriented editing fields
- hiring snapshot card
- activity feed card

**Impact**
- `/profile` no longer pushes hirers into worker-centric or settings-only fallbacks

### 3. Hirers now have a true scheduling surface
Added `modules/hirer/pages/HirerSchedulingPage.jsx` and routed `/hirer/schedule` there.

Shared scheduling internals were kept reusable by making `SchedulingPage.jsx` and `AppointmentForm.jsx` accept role-aware copy overrides.

**Impact**
- hirers now land on a scheduler framed around workers rather than hirers
- shared implementation remains reusable for worker and hirer variants

### 4. Quick-hire requester and worker ownership is now structurally separated
#### Hirer/requester side
- canonical routes under `/hirer/quick-hire/*`
- request creation stays in `QuickJobRequestPage.jsx`
- post-create redirect now lands in `/hirer/quick-hire/:jobId`
- added `HirerQuickJobTrackingPage.jsx`

#### Worker side
- canonical routes under `/worker/quick-jobs/*`
- nearby jobs list stays worker-owned
- worker tracking stays worker-owned

#### Compatibility layer
Legacy entry points now redirect by role:
- `/quick-hire`
- `/quick-hire/request`
- `/quick-hire/request/:category`
- `/quick-hire/track/:jobId`
- `/quick-hire/payment/:jobId`
- `/quick-job/new`
- `/quick-job/:jobId`

**Impact**
- requesters no longer fall into worker execution tracking after creating a quick job
- worker nearby/fulfillment flows stay isolated under worker-owned routes

### 5. Service category CTA now targets requester ownership correctly
`ServiceCategorySelector.jsx` now:
- sends hirers/guests to `/hirer/quick-hire/request?category=...`
- sends workers to `/worker/quick-jobs`
- sends generic talent discovery to `/find-talents`

**Impact**
- homepage quick-hire CTA no longer points at the stale `/quick-job/new` flow

### 6. Quick-job service now exposes requester payment helpers
Added:
- `initializeQuickJobPayment(jobId, paymentMethod)`
- `getQuickJobPaymentStatus(jobId)`
- `verifyQuickJobPayment(reference)`

These map to the existing backend quick-job payment controller and power the requester tracking UI.

### 7. Quick-job payment callback routes are now covered
- Added frontend compatibility routes for:
  - `/quick-job/:jobId/payment-callback`
  - `/quick-job/:jobId/payment-complete`
- Updated role redirects to preserve callback query strings during reroute.
- `HirerQuickJobTrackingPage.jsx` now verifies callback references and refreshes the quick-job state after payment return.

**Impact**
- payment providers no longer land on a frontend 404 after quick-job checkout
- callback returns now reconcile against the backend verification endpoint and refresh the hirer request state

## Validation
- `get_errors` returned no file-level errors on all touched files.
- Frontend build succeeded:
  - `npm run build` in `kelmah-frontend/`
  - result: success

## Remaining considerations
These are lower priority than the structural blockers fixed in this pass:
1. `modules/hirer/components/WorkerSearch.jsx` is now legacy-only and can be retired in a later cleanup pass once there are no remaining internal consumers.
2. The shared scheduler still stores counterpart selection in legacy `hirer`/`hirerId` form fields internally; user-facing ownership is fixed, but the internal payload shape can be renamed in a later dedicated cleanup.
3. Quick-hire requester analytics/list pages can still be expanded later if hirers need a dedicated overview page in addition to per-request tracking.

## Outcome
The frontend now has clearer role ownership in the highest-leak structural areas:
- public search vs hirer search
- requester quick-hire vs worker quick-jobs
- hirer profile vs worker profile
- hirer schedule vs worker schedule

This keeps the current single-app shell functional while making a future worker/hirer app split materially easier.
