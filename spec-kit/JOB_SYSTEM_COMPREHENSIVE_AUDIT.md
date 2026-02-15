# Kelmah Platform — Job System Comprehensive Audit

**Date**: June 2025  
**Scope**: Every file touching job creation, listing, detail, application, bidding, search, filtering, and management across frontend and backend  
**Status**: COMPLETE ✅

---

## 1. Complete File Catalog

### 1A. Backend — Shared Models
| File | Lines | Role |
|------|-------|------|
| `kelmah-backend/shared/models/Job.js` | ~270 | Core Job schema (Mongoose) |
| `kelmah-backend/shared/models/Application.js` | ~80 | Job application schema |
| `kelmah-backend/shared/models/QuickJob.js` | 524 | Same-day quick-hire system with escrow |
| `kelmah-backend/shared/models/index.js` | ~30 | Re-exports Job, Application, User, QuickJob |

### 1B. Backend — Job-Service Local Models
| File | Lines | Role |
|------|-------|------|
| `kelmah-backend/services/job-service/models/index.js` | 37 | Service model index (shared + local) |
| `kelmah-backend/services/job-service/models/Bid.js` | 276 | Bidding system model |
| `kelmah-backend/services/job-service/models/SavedJob.js` | 32 | Bookmarked jobs |
| `kelmah-backend/services/job-service/models/UserPerformance.js` | 385 | Worker performance tiers & bid quotas |
| `kelmah-backend/services/job-service/models/Category.js` | — | Job categories |
| `kelmah-backend/services/job-service/models/Contract.js` | — | Contract model |
| `kelmah-backend/services/job-service/models/ContractDispute.js` | — | Contract disputes |
| `kelmah-backend/services/job-service/models/ContractTemplate.js` | — | Contract templates |

### 1C. Backend — Routes
| File | Lines | Role |
|------|-------|------|
| `kelmah-backend/services/job-service/routes/job.routes.js` | ~130 | Main job CRUD, applications, saved, search |
| `kelmah-backend/services/job-service/routes/bid.routes.js` | ~95 | Bid CRUD, stats, cleanup |
| `kelmah-backend/services/job-service/routes/quickJobRoutes.js` | ~65 | QuickJob + Paystack payment webhook |
| `kelmah-backend/api-gateway/routes/job.routes.js` | 227 | Gateway proxy → job-service via axios |

### 1D. Backend — Controllers
| File | Lines | Role |
|------|-------|------|
| `kelmah-backend/services/job-service/controllers/job.controller.js` | 3169 | 40+ endpoints for all job operations |
| `kelmah-backend/services/job-service/controllers/bid.controller.js` | 397 | 8 bid endpoints |
| `kelmah-backend/services/job-service/controllers/quickJobController.js` | — | QuickJob management |
| `kelmah-backend/services/job-service/controllers/quickJobPaymentController.js` | — | Paystack escrow payments |
| `kelmah-backend/services/job-service/controllers/disputeController.js` | — | Dispute resolution |

### 1E. Backend — Validation & Middleware
| File | Role |
|------|------|
| `kelmah-backend/services/job-service/validations/job.validation.js` | Joi schemas for create/update/status/search |
| `kelmah-backend/services/job-service/middlewares/` | Service-specific middleware |
| `kelmah-backend/services/job-service/utils/response.js` | Standardized response helpers |

### 1F. Frontend — Jobs Module
| File | Lines | Role |
|------|-------|------|
| `kelmah-frontend/src/modules/jobs/services/jobsService.js` | 405 | API client layer (axios calls) |
| `kelmah-frontend/src/modules/jobs/services/jobSlice.js` | ~200 | Redux Toolkit slice + thunks |
| `kelmah-frontend/src/modules/jobs/hooks/useJobsQuery.js` | 221 | React Query hooks (parallel data layer) |
| `kelmah-frontend/src/modules/jobs/hooks/useJobs.js` | 190 | Redux-based hook (legacy pattern) |
| `kelmah-frontend/src/modules/jobs/hooks/useJobDraft.js` | 150 | Auto-save drafts to localStorage |
| `kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx` | 2433 | Main jobs listing page |
| `kelmah-frontend/src/modules/jobs/pages/JobDetailsPage.jsx` | 738 | Single job detail view |
| `kelmah-frontend/src/modules/jobs/pages/JobAlertsPage.jsx` | ~200 | Notification preferences for jobs |
| `kelmah-frontend/src/modules/jobs/components/HeroFiltersSection.jsx` | 483 | Search bar + category/location/budget filters |
| `kelmah-frontend/src/modules/jobs/components/JobResultsSection.jsx` | 1110 | Job card grid, animated stats, empty states |
| `kelmah-frontend/src/modules/jobs/components/JobsCompactSearchBar.jsx` | — | Compact search bar variant |
| `kelmah-frontend/src/modules/jobs/components/JobsMobileFilterDrawer.jsx` | — | Mobile filter drawer |
| `kelmah-frontend/src/modules/jobs/components/RealTimeJobAlerts.jsx` | — | Real-time job alert component |
| `kelmah-frontend/src/modules/jobs/components/job-application/JobApplication.jsx` | 1035 | Multi-step application form |
| `kelmah-frontend/src/modules/jobs/components/job-creation/JobCreationForm.jsx` | 1059 | Dialog-based job creation |
| `kelmah-frontend/src/modules/jobs/components/common/JobFilters.jsx` | ~140 | Dialog-based filter form (simple) |
| `kelmah-frontend/src/modules/jobs/components/common/JobList.jsx` | — | List rendering component |
| `kelmah-frontend/src/modules/jobs/components/common/JobSearch.jsx` | — | Search component |
| `kelmah-frontend/src/modules/jobs/components/common/SavedJobs.jsx` | ~85 | Saved jobs list page (uses workerService) |
| `kelmah-frontend/src/modules/jobs/components/common/MyApplications.jsx` | ~10 | Wrapper for MyApplicationsPage |
| `kelmah-frontend/src/modules/jobs/components/common/CreateJobDialog.jsx` | — | Dialog wrapper |
| `kelmah-frontend/src/modules/jobs/components/common/PostJob.jsx` | — | Post-job CTA component |
| `kelmah-frontend/src/modules/jobs/components/common/SearchFilters.jsx` | — | Search filter component |
| `kelmah-frontend/src/modules/jobs/components/common/Jobs.jsx` | — | Legacy jobs wrapper |
| `kelmah-frontend/src/modules/jobs/components/common/JobDetails.jsx` | — | Legacy detail component |
| `kelmah-frontend/src/modules/jobs/components/common/JobListing.jsx` | — | Legacy listing component |
| `kelmah-frontend/src/modules/jobs/data/tradeCategories.json` | 9 entries | Category dropdown data |
| `kelmah-frontend/src/modules/jobs/data/ghanaLocations.json` | 9 entries | Location dropdown data |

### 1G. Frontend — Hirer Module (Job-Related)
| File | Lines | Role |
|------|-------|------|
| `kelmah-frontend/src/modules/hirer/pages/JobPostingPage.jsx` | 1123 | 5-step job creation wizard |
| `kelmah-frontend/src/modules/hirer/pages/JobManagementPage.jsx` | 873 | Tabbed job management table |
| `kelmah-frontend/src/modules/hirer/pages/ApplicationManagementPage.jsx` | 436 | Application review & status updates |
| `kelmah-frontend/src/modules/hirer/pages/HirerDashboardPage.jsx` | — | Hirer overview dashboard |
| `kelmah-frontend/src/modules/hirer/components/HirerJobManagement.jsx` | 665 | Dashboard job management widget |
| `kelmah-frontend/src/modules/hirer/components/JobCreationWizard.jsx` | ~200 | Simple 4-step wizard (basic) |
| `kelmah-frontend/src/modules/hirer/components/JobProgressTracker.jsx` | 525 | Active jobs progress + milestones |
| `kelmah-frontend/src/modules/hirer/components/ProposalReview.jsx` | — | Proposal review component |
| `kelmah-frontend/src/modules/hirer/components/WorkerSearch.jsx` | — | Worker search component |
| `kelmah-frontend/src/modules/hirer/services/hirerSlice.js` | 674 | Redux slice with job thunks |
| `kelmah-frontend/src/modules/hirer/services/hirerService.js` | 321 | API service layer |

### 1H. Frontend — Worker Module (Job-Related)
| File | Lines | Role |
|------|-------|------|
| `kelmah-frontend/src/modules/worker/components/EnhancedJobCard.jsx` | 563 | Bid-enabled job card |
| `kelmah-frontend/src/modules/worker/components/JobManagement.jsx` | 372 | Worker's active/completed/available jobs |
| `kelmah-frontend/src/modules/worker/services/workerSlice.js` | 493 | Redux slice with fetchWorkerJobs, fetchWorkerApplications |

### 1I. Frontend — Routing
| File | Lines | Role |
|------|-------|------|
| `kelmah-frontend/src/routes/config.jsx` | 972 | All route definitions |
| `kelmah-frontend/src/App.jsx` | ~120 | Root app with auth bootstrap & service warm-up |

---

## 2. Frontend Component Analysis

### 2A. Job Listing Flow
```
User visits /jobs
  ↓
routes/config.jsx → <JobsPage /> (public, no auth)
  ↓
JobsPage.jsx (2433 lines)
  ├── HeroFiltersSection.jsx — search text, category dropdown, location dropdown, budget slider
  ├── JobResultsSection.jsx — animated stats, job card grid, empty states
  └── Data hooks:
      ├── useJobsQuery (React Query) — primary data source
      └── dispatch(fetchJobs) (Redux) — also fires on load ⚠️ DUAL FETCH
  ↓
JobResultsSection renders job cards → onClick → navigate(`/jobs/${job._id || job.id}`)
  ↓
routes/config.jsx → <JobDetailsPage /> (protected — requires auth)
```

### 2B. Job Creation Flow — THREE SEPARATE PATHS ⚠️

| Path | Component | Route | Notes |
|------|-----------|-------|-------|
| **Path 1** | `JobCreationForm.jsx` (1059 lines) | Dialog, no dedicated route | React Hook Form, 10 categories, 30 skills, bidding, useJobDraft |
| **Path 2** | `JobPostingPage.jsx` (1123 lines) | `/hirer/jobs/post` | 5-step stepper, hirerSlice, supports edit mode |
| **Path 3** | `JobCreationWizard.jsx` (~200 lines) | No route (embedded) | Very basic 4-step text-only form |

**⚠️ CRITICAL ISSUE**: Three separate job creation components with different field sets, validation rules, and backend integration. Only Path 2 is routed for hirers.

### 2C. Job Application Flow
```
User clicks "Apply Now" on JobDetailsPage
  ↓
Opens JobApplication.jsx as dialog (or ?apply=true query param)
  ↓
4-step form: Job Overview → Your Proposal → Milestones → Review & Submit
  Fields: coverLetter, proposedBudget, currency, estimatedDuration, attachments, milestones
  ↓
useApplyToJobMutation (React Query) → jobsService.applyToJob(jobId, data)
  ↓
POST /api/jobs/:id/apply → Gateway → job-service → job.controller.applyToJob
  ↓
Creates Application document, checks duplicates, validates job status
```

### 2D. Bidding Flow (Worker Side)
```
EnhancedJobCard.jsx → "Bid Now" button → opens bid dialog
  ↓
Form: bidAmount, estimatedDuration, coverLetter, hoursPerWeek
  ↓
handleBidSubmit() → ⚠️ API CALL IS COMMENTED OUT (TODO)
  ↓
bid.controller.createBid — POST /api/bids (fully functional backend)
```
**⚠️ CRITICAL ISSUE**: The frontend bidding dialog exists but the actual API call is entirely commented out. The bidding system is backend-complete but frontend-disconnected.

### 2E. Worker Job Management
```
/worker/find-work → JobSearchPage (lazy-loaded, separate from /jobs)
/worker/applications → MyApplicationsPage
Worker's JobManagement.jsx → fetches /api/workers/:id/jobs (NOT standard API path)
```
**⚠️ ISSUE**: `JobManagement.jsx` uses raw `fetch()` to `/api/workers/:id/jobs` which is NOT a defined backend route. Should use `/api/jobs/assigned` as `workerSlice.fetchWorkerJobs` does.

### 2F. Hirer Job Management
```
/hirer/jobs → JobManagementPage (tabbed table: All/Open/In-Progress/Completed/Cancelled/Draft)
  ├── Uses hirerSlice.fetchHirerJobs → GET /api/jobs/my-jobs
  ├── Actions: edit, delete, view, status change
  └── Search + pagination

/hirer/applications → ApplicationManagementPage
  ├── Fetches applications across all hirer's jobs
  ├── Status tabs (pending, reviewed, accepted, rejected)
  └── Accept/reject with feedback, message worker
```

---

## 3. Backend Route Analysis

### 3A. Job Routes (job.routes.js → job.controller.js)

| Method | Path | Auth | Role | Controller | Notes |
|--------|------|------|------|-----------|-------|
| GET | `/` | No | — | `getJobs` | Public listing, uses native MongoDB driver ⚠️ |
| GET | `/search` | No | — | `advancedJobSearch` | Aggregation pipeline |
| GET | `/categories` | No | — | `getJobCategories` | From Category model |
| GET | `/suggestions` | No | — | `getSearchSuggestions` | Text search regex |
| GET | `/stats` | Yes | — | `getPlatformStats` | Platform-wide job stats |
| GET | `/dashboard` | Yes | — | `getDashboardJobs` | Has hardcoded fallback ⚠️ |
| GET | `/contracts` | Yes | — | `getContracts` | Returns MOCK data only ⚠️ |
| GET | `/contracts/:id` | Yes | — | `getContractById` | Returns MOCK data only ⚠️ |
| POST | `/` | Yes | hirer | `createJob` | Rate-limited (10/15min), validated |
| GET | `/my-jobs` | Yes | hirer | `getMyJobs` | Uses native MongoDB driver ⚠️ |
| PUT | `/:id` | Yes | hirer | `updateJob` | Owner-only, draft/open only |
| DELETE | `/:id` | Yes | hirer | `deleteJob` | Owner-only, draft/open only |
| PATCH | `/:id/status` | Yes | hirer | `changeJobStatus` | Validates transitions |
| GET | `/:id/worker-matches` | Yes | hirer | `getWorkerMatches` | Scored matching |
| PATCH | `/:id/close-bidding` | Yes | hirer | `closeBidding` | Closes bidding early |
| PATCH | `/:id/extend-deadline` | Yes | hirer | `extendDeadline` | Extends bid deadline |
| PATCH | `/:id/renew` | Yes | hirer | `renewJob` | Renews expired job |
| GET | `/recommendations` | Yes | worker | `getJobRecommendations` | Scored matching |
| POST | `/:id/apply` | Yes | worker | `applyToJob` | Creates Application |
| GET | `/assigned` | Yes | worker | `getAssignedJobs` | Worker's active jobs |
| GET | `/applications/me` | Yes | worker | `getWorkerApplications` | Worker's applications |
| GET | `/recommendations/personalized` | Yes | worker | `getPersonalizedJobRecommendations` | UserPerformance-based |
| GET | `/saved` | Yes | — | `getSavedJobs` | Bookmarked jobs |
| POST | `/:id/save` | Yes | — | `saveJob` | Bookmark a job |
| DELETE | `/:id/save` | Yes | — | `unsaveJob` | Remove bookmark |
| GET | `/:id` | No | — | `getJobById` | Public detail, populates hirer |
| GET | `/analytics` | Yes | admin | `getJobAnalytics` | Admin analytics |
| GET | `/expired` | Yes | admin | `getExpiredJobs` | Expired job list |

### 3B. Bid Routes (bid.routes.js → bid.controller.js)

| Method | Path | Auth | Role | Controller |
|--------|------|------|------|-----------|
| POST | `/` | Yes | worker | `createBid` |
| GET | `/job/:jobId` | Yes | hirer | `getJobBids` |
| GET | `/worker/:workerId` | Yes | worker | `getWorkerBids` |
| GET | `/:bidId` | Yes | — | `getBidById` |
| PATCH | `/:bidId/accept` | Yes | hirer | `acceptBid` |
| PATCH | `/:bidId/reject` | Yes | hirer | `rejectBid` |
| PATCH | `/:bidId/withdraw` | Yes | worker | `withdrawBid` |
| PATCH | `/:bidId/modify` | Yes | worker | `modifyBid` |
| GET | `/stats/worker/:workerId` | Yes | — | `getWorkerBidStats` |
| GET | `/expired` | Yes | admin | `getExpiredBids` |
| PATCH | `/cleanup/expired` | Yes | admin | `cleanupExpiredBids` |

### 3C. Route Specificity Order ✅
Routes in `job.routes.js` are correctly ordered: specific literal paths (`/my-jobs`, `/search`, `/dashboard`, etc.) come before the `/:id` catch-all parameter route. This is properly structured.

### 3D. Gateway Forwarding
The API Gateway (`api-gateway/routes/job.routes.js`) forwards all job requests to the job-service using axios. It:
- Extracts `req.user` from gateway auth and attaches as headers (`x-user-id`, `x-user-role`, `x-user-email`)
- Handles service discovery with periodic re-discovery
- Returns 503 when job-service is unreachable

---

## 4. Job Model Field Catalog

### 4A. Job Schema (shared/models/Job.js)

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `title` | String | ✅ | — | max 100 chars, trimmed |
| `description` | String | ✅ | — | max 5000 chars |
| `category` | String | ✅ | — | e.g. "Plumbing", "Electrical" |
| `skills` | [String] | — | [] | Array of skill tags |
| `budget` | Number | ✅ | — | In GHS by default |
| `currency` | String | — | 'GHS' | |
| `duration.value` | Number | — | — | |
| `duration.unit` | String (enum) | — | — | hour/day/week/month |
| `paymentType` | String (enum) | ✅ | — | fixed/hourly |
| `location.type` | String (enum) | — | — | remote/onsite/hybrid |
| `location.country` | String | — | — | |
| `location.city` | String | — | — | |
| `status` | String (enum) | — | 'open' | draft/open/in-progress/completed/cancelled |
| `visibility` | String (enum) | — | 'public' | public/private/invite-only |
| `hirer` | ObjectId→User | ✅ | — | Job poster |
| `worker` | ObjectId→User | — | — | Assigned worker |
| `proposalCount` | Number | — | 0 | |
| `viewCount` | Number | — | 0 | |
| `startDate` | Date | — | — | |
| `endDate` | Date | — | — | |
| `completedDate` | Date | — | — | |
| `expiresAt` | Date | — | now+30d | Auto-expiry |

**Enhanced Fields (Bidding System):**

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `bidding.maxBidders` | Number | 10 | Max simultaneous bids |
| `bidding.currentBidders` | Number | 0 | Current bid count |
| `bidding.bidDeadline` | Date | now+14d | Bidding closing date |
| `bidding.minBidAmount` | Number | 100 | Minimum bid in GHS |
| `bidding.maxBidAmount` | Number | 10000 | Maximum bid in GHS |
| `bidding.bidStatus` | String (enum) | 'open' | open/closed/full |

**Enhanced Fields (Ghana-Specific Location):**

| Field | Type | Notes |
|-------|------|-------|
| `locationDetails.region` | String (enum) | 16 Ghana regions |
| `locationDetails.district` | String | |
| `locationDetails.coordinates` | [Number] (2dsphere) | GeoJSON point |
| `locationDetails.searchRadius` | Number | Default 50km |

**Enhanced Fields (Requirements):**

| Field | Type | Notes |
|-------|------|-------|
| `requirements.primarySkills` | [String (enum)] | 10 trade skills |
| `requirements.secondarySkills` | [String] | Free-form |
| `requirements.experienceLevel` | String (enum) | entry/intermediate/expert |
| `requirements.certifications` | [String] | |
| `requirements.tools` | [String] | |

### 4B. Application Schema

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `job` | ObjectId→Job | ✅ | |
| `worker` | ObjectId→User | ✅ | |
| `proposedRate` | Number | ✅ | |
| `coverLetter` | String | ✅ | |
| `estimatedDuration` | {value, unit} | — | |
| `attachments` | [{name, fileUrl, fileType, uploadDate}] | — | |
| `status` | String (enum) | — | pending/under_review/accepted/rejected/withdrawn |
| `notes` | String | — | |
| `availabilityStartDate` | Date | — | |
| `questionResponses` | [{question, answer}] | — | |
| `isInvited` | Boolean | — | |
| **Unique Index** | `(job, worker)` | — | One application per worker per job |

### 4C. Bid Schema (Local)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `job` | ObjectId→Job | ✅ | |
| `worker` | ObjectId→User | ✅ | |
| `bidAmount` | Number | ✅ | min 0 |
| `estimatedDuration` | {value, unit} | ✅ | |
| `coverLetter` | String | ✅ | max 2000 |
| `portfolio` | [{name, url, type, description}] | — | |
| `availability` | {startDate, endDate, hoursPerWeek, flexible} | startDate ✅ | |
| `status` | String (enum) | — | pending/accepted/rejected/withdrawn/expired |
| `performanceScore` | Number | — | 0-100 |
| `monthlyBidCount` | Number | — | |
| `modifications` | Array | — | Tracked bid edits (max 3) |

---

## 5. Issues Identified

### 🔴 CRITICAL

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| C1 | **Bidding API completely disconnected** | `EnhancedJobCard.jsx` lines 100-115 | Bid dialog exists but `handleBidSubmit()` has API calls commented out with TODO. Backend bid system is 100% functional. Workers cannot actually bid. |
| C2 | **Dual Application + Bid systems overlap** | Application model + Bid model | Two separate systems for workers to express interest in jobs. `applyToJob` creates Applications, bid routes create Bids. No clear UX boundary — users see "Apply" on some screens and "Bid" on others. |
| C3 | **Three separate job creation UIs** | `JobCreationForm`, `JobPostingPage`, `JobCreationWizard` | Different field sets, validation, and backends. Only `JobPostingPage` is routed. Increases maintenance burden and inconsistency risk. |
| C4 | **Native MongoDB driver workaround** | `job.controller.js` — `getJobs()`, `getMyJobs()` | Bypasses Mongoose entirely, using `mongoose.connection.db.collection()`. Loses schema validation, virtuals, middleware, and population. Sign of unresolved model initialization issues. |
| C5 | **Mock/hardcoded contract data** | `job.controller.js` — `getContracts()`, `getContractById()` | Returns hardcoded fake contracts instead of querying DB. Users see fabricated data. |

### 🟡 HIGH

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| H1 | **Status case inconsistency** | `advancedJobSearch` uses `'Open'`, `getPersonalizedJobRecommendations` uses `'Open'` — schema enum is `'open'` (lowercase) | Search and recommendation queries may return 0 results against real data |
| H2 | **Dual data-fetching patterns** | `JobsPage.jsx` dispatches Redux `fetchJobs` AND uses React Query `useJobsQuery` | Same data fetched twice on page load; inconsistent caching |
| H3 | **Method name mismatch** | `jobSlice.applyForJob` calls `jobsApi.applyForJob()` but service exports `applyToJob()` | Will crash at runtime if Redux path is used for applications |
| H4 | **Worker JobManagement broken URL** | `JobManagement.jsx` line 65 | Uses `fetch('/api/workers/:id/jobs')` — this route doesn't exist. Should use `/api/jobs/assigned` |
| H5 | **SavedJobs uses wrong service** | `SavedJobs.jsx` line 12 | Imports `workerService.getSavedJobs()` instead of `jobsService.getSavedJobs()`. Different API path. |
| H6 | **Budget format inconsistency** | Frontend sends budget as `{min, max, type}` object (hirer) or flat number; backend schema is `budget: Number` | Frontend `transformJobListItem` has elaborate normalization but the core mismatch persists |
| H7 | **Dashboard hardcoded fallback** | `getDashboardJobs` in controller | Returns fake jobs when DB fails — masks real errors |

### 🟢 MEDIUM

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| M1 | **Hirer analytics mock data** | `HirerJobManagement.jsx` | Hardcoded analytics (Active: 12, Views: 1,234, etc.) regardless of actual data |
| M2 | **Filter/category mismatch** | `JobFilters.jsx` has 12 categories, `tradeCategories.json` has 8, `JobCreationForm` has 10, backend schema has 10 | Users see different categories depending on which component |
| M3 | **Currency display: "$" vs "GH₵"** | `JobFilters.jsx` uses `$`, `EnhancedJobCard.jsx` uses `GH₵`, `JobPostingPage.jsx` uses `GH₵` | Inconsistent currency symbols |
| M4 | **Location dropdown mismatch** | `ghanaLocations.json` has 8 cities; backend `locationDetails.region` has 16 regions; `JobCreationForm` has 10 cities | Filtering by location may miss jobs |
| M5 | **Employer data fallback chain** | `jobsService.transformJobListItem()` | Elaborate null-handling (hirer→hirer_name→company→"Employer Name Pending") indicates persistent backend population failures |
| M6 | **Quick filters non-functional** | `HeroFiltersSection.jsx` | "Urgent", "Verified", "Full-time", "Contract" chips render but have no click handlers |
| M7 | **Bookmark handler placeholder** | `JobResultsSection.jsx` line 250 | `handleBookmark` logs `console.log('Bookmark functionality to be implemented')` |

---

## 6. End-to-End Job Creation Flow

### Primary Path (Hirer → Job Posting)

```
1. Hirer navigates to /hirer/jobs/post
   ↓
2. routes/config.jsx → <JobPostingPage /> (roles: hirer, admin)
   ↓
3. JobPostingPage.jsx — 5-step stepper:
   Step 1: Title, Category, PaymentType
   Step 2: Description, Skills (multi-select)
   Step 3: Budget (fixed amount or hourly min/max), Duration, Currency
   Step 4: Location (type, region, city), Visibility
   Step 5: Review & Publish
   ↓
4. Submit → dispatch(createHirerJob(jobData))
   ↓
5. hirerSlice.createHirerJob thunk → hirerService.createJob(data)
   ↓
6. hirerService → api.post('/jobs', data)
   ↓
7. API Gateway /api/jobs (POST) → forwards to job-service with auth headers
   ↓
8. job-service routes: POST / → verifyGatewayRequest → authorizeRoles('hirer')
   → jobRateLimiter → validateJob('create') → createJob controller
   ↓
9. job.controller.createJob:
   a. Normalize budget (object → number)
   b. Normalize duration (string → {value, unit})
   c. Normalize location → locationDetails with auto-region mapping
   d. Auto-generate requirements.primarySkills from category
   e. Auto-generate bidding defaults if not present
   f. Create Job document → save
   g. Return { success: true, data: job }
   ↓
10. Frontend receives response → Redux state updated → redirect to /hirer/jobs
```

### Data Shape Transformations

```
FRONTEND SENDS (JobPostingPage):
{
  title: "Fix Kitchen Plumbing",
  category: "Plumbing",
  description: "Need a plumber...",
  skills: ["Pipe Fitting", "Leak Repair"],
  budget: { type: "fixed", amount: 500 } OR { type: "hourly", min: 50, max: 100 },
  currency: "GHS",
  duration: { value: 3, unit: "day" },
  paymentType: "fixed",
  location: { type: "onsite", region: "Greater Accra", city: "Accra" },
  visibility: "public"
}

BACKEND NORMALIZES TO:
{
  title: "Fix Kitchen Plumbing",
  category: "Plumbing",
  description: "Need a plumber...",
  skills: ["Pipe Fitting", "Leak Repair"],
  budget: 500,                        // ← Flattened from object
  currency: "GHS",
  duration: { value: 3, unit: "day" },
  paymentType: "fixed",
  location: { type: "onsite" },
  locationDetails: {
    region: "Greater Accra",
    district: "",
    coordinates: [/* auto if available */],
    searchRadius: 50
  },
  requirements: {
    primarySkills: ["Plumbing"],       // ← Auto-generated from category
    secondarySkills: ["Pipe Fitting", "Leak Repair"],
    experienceLevel: "entry"
  },
  bidding: {
    maxBidders: 10,                    // ← Auto defaults
    minBidAmount: 100,
    maxBidAmount: 10000,
    bidStatus: "open",
    bidDeadline: /* now + 14 days */
  },
  status: "open",
  visibility: "public",
  hirer: req.user.id
}
```

---

## 7. Search & Filter Analysis

### 7A. Frontend Search/Filter Architecture

**HeroFiltersSection.jsx** provides:
1. **Text search** — free-text input, triggers `onSearchChange(query)`
2. **Category dropdown** — from `tradeCategories.json` (8 values + "All Trades")
3. **Location dropdown** — from `ghanaLocations.json` (8 cities + "All Locations")
4. **Budget range slider** — GHS 500–10,000, step 100
5. **Quick filters** — "Urgent", "Verified", "Full-time", "Contract" (⚠️ non-functional)
6. **Collapsible advanced filters** — controlled by toggle button

**JobsPage.jsx** state management:
- `searchQuery` (string)
- `selectedCategory` (string)
- `selectedLocation` (string)
- `budgetRange` ([number, number])
- All passed as `params` to `useJobsQuery({ search, category, location, minBudget, maxBudget })`

### 7B. Backend Search Endpoints

**`getJobs` (GET /):**
- Query params: `page`, `limit`, `sort`, `category`, `search`, `location`, `minBudget`, `maxBudget`, `status`
- Uses native MongoDB driver
- Manual text regex on `title` and `description`
- Category and location exact match

**`advancedJobSearch` (GET /search):**
- Aggregation pipeline with `$lookup` for hirer population
- Text search, category filter, location filter, budget range, skills match
- Relevance scoring algorithm
- ⚠️ Uses `status: 'Open'` (wrong case)

**`getSearchSuggestions` (GET /suggestions):**
- Regex search on title and description
- Returns distinct matching titles/descriptions as suggestions

### 7C. Filter Gaps

| Filter | Frontend | Backend | Gap |
|--------|----------|---------|-----|
| Text search | ✅ | ✅ | None |
| Category | ✅ (8 values) | ✅ (10 values in schema) | Frontend missing 2 categories (Welding, Flooring) |
| Location | ✅ (8 cities) | ✅ (16 regions) | Frontend uses cities, backend indexes by region — mismatch |
| Budget range | ✅ (500-10000) | ✅ | None |
| Skills | ❌ Not in filters | ✅ (backend supports) | Lost filtering capability |
| Payment type | ❌ Not in filters | ✅ (schema supports) | Lost filtering capability |
| Duration | ❌ Not in filters | ✅ (schema supports) | Lost filtering capability |
| Experience level | ❌ Not in filters | ✅ (schema supports) | Lost filtering capability |
| Performance tier | ❌ Not in filters | ✅ (backend supports) | Lost filtering capability |
| Bidding status | ❌ Not in filters | ✅ (backend supports) | Lost filtering capability |
| Urgent | Chip exists | ❌ No handler | Non-functional |
| Verified | Chip exists | ❌ No handler | Non-functional |
| Job type | `JobFilters.jsx` has it | ❌ Not in schema or getJobs | Sends unusable param |

---

## 8. UI–Backend Gap Analysis

### 8A. Fields Frontend Sends vs Backend Expects

| Field | Frontend Send | Backend Expect | Gap |
|-------|---------------|----------------|-----|
| `budget` | Object `{type, amount/min/max}` (hirer module) OR Number (job module) | Number (required) | Controller normalizes but fragile |
| `duration` | String `"3 days"` sometimes | Object `{value, unit}` | Controller normalizes `"3 days"` → `{value:3, unit:'day'}` |
| `location` | Object `{type, region, city}` | Nested `location.type` + `locationDetails.region` | Controller splits into two fields |
| `paymentType` | `'fixed'` or `'hourly'` | Same enum ✅ | Match |
| `skills` | Array of strings | Array of strings ✅ | Match |
| `bidding` | Optional object from JobCreationForm | Auto-generated defaults | Controller fills if absent |
| `requirements` | Not sent from any frontend | Auto-generated from category | OK |
| `performanceTier` | Not sent | Not settable on create | OK |

### 8B. Fields Backend Returns vs Frontend Expects

| Field | Backend Returns | Frontend Expects | Gap |
|-------|----------------|------------------|-----|
| `hirer` | Populated object OR null | Object with `firstName`, `lastName`, `profilePicture` | Frequent null — elaborate fallback chain |
| `budget` | Number (from DB) | `getJobById` transforms to `{min, max, type}` object | Inconsistent: `getJobs` returns raw number |
| `status` | Lowercase enum | Frontend handles both cases | ⚠️ Backend inconsistency (`'Open'` in search vs `'open'` in list) |
| `_id` vs `id` | MongoDB `_id` | Frontend checks both `job._id || job.id` | Mongoose virtuals should handle but native driver doesn't |
| `employer` | Not a field | `JobResultsSection.jsx` uses `job.employer.name` | `transformJobListItem` creates this from `hirer` |
| `company` | Not a field | Some components check `job.company.name` | Transformation layer maps hirer → company |

### 8C. API Endpoint Alignment

| Frontend Call | Expected Endpoint | Actual Backend | Status |
|---------------|-------------------|----------------|--------|
| `jobsService.getJobs(params)` | GET `/api/jobs` | ✅ Exists | OK |
| `jobsService.createJob(data)` | POST `/api/jobs` | ✅ Exists | OK |
| `jobsService.getJobById(id)` | GET `/api/jobs/:id` | ✅ Exists | OK |
| `jobsService.searchJobs(params)` | GET `/api/jobs/search` | ✅ Exists | OK (but status case bug) |
| `jobsService.applyToJob(id, data)` | POST `/api/jobs/:id/apply` | ✅ Exists | OK |
| `jobsService.getSavedJobs()` | GET `/api/jobs/saved` | ✅ Exists | OK |
| `jobsService.saveJob(id)` | POST `/api/jobs/:id/save` | ✅ Exists | OK |
| `jobsService.unsaveJob(id)` | DELETE `/api/jobs/:id/save` | ✅ Exists | OK |
| `hirerService.getJobs()` | GET `/api/jobs/my-jobs` | ✅ Exists | OK |
| `hirerService.createJob(data)` | POST `/api/jobs` | ✅ Exists | OK |
| `workerSlice.fetchWorkerJobs()` | GET `/api/jobs/assigned` | ✅ Exists | OK |
| `workerSlice.fetchWorkerApplications()` | GET `/api/jobs/applications/me` | ✅ Exists | OK |
| `JobManagement.jsx fetch()` | GET `/api/workers/:id/jobs` | ❌ Does NOT exist | **BROKEN** |
| `EnhancedJobCard bidApi.createBid()` | POST `/api/bids` | ✅ Exists (backend) | **Commented out in frontend** |
| `SavedJobs workerService.getSavedJobs()` | Unknown path | May differ from `/api/jobs/saved` | **Likely wrong service** |

### 8D. Frontend Route → Backend Mapping

| Frontend Route | Page Component | Backend Endpoints Used |
|----------------|----------------|----------------------|
| `/jobs` (public) | `JobsPage` | GET `/api/jobs`, GET `/api/jobs/search` |
| `/jobs/:id` (protected) | `JobDetailsPage` | GET `/api/jobs/:id` |
| `/hirer/jobs` | `JobManagementPage` | GET `/api/jobs/my-jobs` |
| `/hirer/jobs/post` | `JobPostingPage` | POST `/api/jobs` |
| `/hirer/jobs/edit/:jobId` | `JobPostingPage` | PUT `/api/jobs/:id` |
| `/hirer/applications` | `ApplicationManagementPage` | GET `/api/jobs/:id/applications` (per job) |
| `/worker/find-work` | `JobSearchPage` | GET `/api/jobs` or `/api/jobs/search` |
| `/worker/applications` | `MyApplicationsPage` | GET `/api/jobs/applications/me` |
| `/worker/saved-jobs` | `SavedJobs` | GET `/api/jobs/saved` (should be) |

---

## 9. Recommendations Summary

### Priority 1 — Fix Broken Features
1. **Connect bidding frontend to backend**: Wire `EnhancedJobCard.handleBidSubmit()` to `POST /api/bids`
2. **Fix worker JobManagement URL**: Change `/api/workers/:id/jobs` → `/api/jobs/assigned`
3. **Fix method name mismatch**: Align `jobSlice.applyForJob` with `jobsService.applyToJob`
4. **Fix status case inconsistency**: Change `'Open'` → `'open'` in `advancedJobSearch` and `getPersonalizedJobRecommendations`

### Priority 2 — Consolidate Duplications
5. **Unify job creation**: Pick one job creation component (recommend `JobPostingPage`) and route all creation through it
6. **Unify data-fetching**: Pick React Query OR Redux for jobs data — not both
7. **Replace native MongoDB driver**: Fix the underlying Mongoose model initialization issue so `getJobs`/`getMyJobs` can use the Mongoose model

### Priority 3 — Complete Incomplete Features
8. **Replace mock contract data** with real DB queries
9. **Replace mock hirer analytics** with real aggregation
10. **Wire quick-filter chips** ("Urgent", "Verified") to actual filter logic
11. **Implement bookmark handler** in `JobResultsSection`
12. **Add missing filter capabilities**: skills, payment type, experience level, bidding status

### Priority 4 — Data Consistency
13. **Standardize category lists**: Use one source of truth (suggest backend Category model or `tradeCategories.json`)
14. **Standardize location lists**: Align frontend cities with backend regions
15. **Standardize currency display**: Use `GH₵` everywhere, not `$`
16. **Fix SavedJobs service import**: Use `jobsService` instead of `workerService`

---

*End of audit — 80+ files analyzed, 3169-line controller fully traced, 40+ endpoints documented, 15+ issues cataloged with severity.*
