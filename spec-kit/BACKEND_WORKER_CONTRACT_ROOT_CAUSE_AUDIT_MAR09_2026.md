# Backend Worker Contract Root-Cause Audit March 9 2026

## Objective

Explain why the live worker-facing backend contracts disagree across `/api/auth/me`, `/api/users/me/profile-signals`, and `/api/jobs/recommendations/personalized`, and isolate whether the remaining mobile precision failure is caused by data drift, controller logic drift, or deployment drift.

## Scope And Success Criteria

- Read the exact route, controller, model, config, gateway, and contract-test files used by the three endpoints.
- Trace the worker data sources used by each endpoint from gateway request to persistence read.
- Compare that code path against the live payloads returned for the same worker account.
- Produce a root-cause conclusion without changing backend runtime code.

## Mapped File Surface

- `kelmah-backend/services/auth-service/routes/auth.routes.js`
- `kelmah-backend/services/auth-service/controllers/auth.controller.js`
- `kelmah-backend/services/auth-service/models/index.js`
- `kelmah-backend/services/auth-service/config/db.js`
- `kelmah-backend/services/user-service/routes/user.routes.js`
- `kelmah-backend/services/user-service/controllers/user.controller.js`
- `kelmah-backend/services/user-service/controllers/worker.controller.js`
- `kelmah-backend/services/user-service/models/index.js`
- `kelmah-backend/services/user-service/models/WorkerProfileMongo.js`
- `kelmah-backend/services/user-service/config/db.js`
- `kelmah-backend/services/user-service/tests/mobile-profile-signals.contract.test.js`
- `kelmah-backend/services/job-service/routes/job.routes.js`
- `kelmah-backend/services/job-service/controllers/job.controller.js`
- `kelmah-backend/services/job-service/models/index.js`
- `kelmah-backend/services/job-service/config/db.js`
- `kelmah-backend/services/job-service/tests/mobile-recommendations.contract.test.js`
- `kelmah-backend/api-gateway/routes/job.routes.js`
- `kelmah-backend/api-gateway/routes/job.routes.test.js`
- `kelmah-backend/shared/models/User.js`
- `kelmah-backend/shared/models/WorkerProfile.js`
- `kelmah-backend/shared/models/index.js`
- `kelmah-backend/shared/utils/canonicalWorker.js`

## End-To-End Data Flow

### Auth Identity Flow

`/api/auth/me`
-> API gateway auth middleware
-> auth-service route `/me`
-> `auth.controller.getMe()`
-> shared `User.findById(userId).select("-password -tokenVersion")`
-> raw `data.user`

This endpoint does not read `WorkerProfile` and does not attempt canonicalization.

### Mobile Profile Signals Flow

`/api/users/me/profile-signals`
-> gateway trust middleware
-> user-service route `/me/profile-signals`
-> `getMyProfileSignals()`
-> `fetchProfileDocuments()`
-> shared `User` + shared `WorkerProfile`
-> `formatProfilePayload()`
-> `loadCredentialPayload()`
-> `buildAvailabilityPayload()`
-> `buildProfileCompletenessPayload()`
-> `success: true` contract with `profile`, `credentials`, `availability`, `completeness`, and `portfolio`

This endpoint is intentionally composite and prefers worker-profile values for several recommendation-relevant fields.

### Personalized Recommendations Flow

`/api/jobs/recommendations/personalized`
-> gateway worker auth route
-> job-service route `/recommendations/personalized`
-> `getPersonalizedJobRecommendations()`
-> `getCanonicalWorkerContext()`
-> shared `User.findById(workerId)` + shared `WorkerProfile.findOne({ userId: workerId })`
-> `buildCanonicalWorkerSnapshot()`
-> `collectWorkerSkills()`
-> optional `UserPerformance.findOne({ userId })`
-> recommendation candidate query and scoring

The current repo code should treat merged user and worker-profile skills as eligible personalized input before falling back to an empty-state contract.

## Code Findings

### Finding 1: `auth/me` returns raw `User`, not canonical worker identity

`auth.controller.getMe()` simply reads the shared `User` document and returns it unchanged. That means worker-facing fields stored on `users` are treated as authoritative even though the platform also stores overlapping worker data in `WorkerProfile`.

Impact:
- mobile session identity can cache stale profession, skill, rate, and experience values;
- the session shell and recommendation surfaces can disagree before any client bug is involved.

### Finding 2: `profile-signals` is a merged view with worker-profile precedence

`formatProfilePayload()` in user-service prefers `WorkerProfile` values for:
- bio
- location
- profession only when `workerDoc.profession` exists
- hourly rate
- currency
- experience level
- years of experience
- skills

It falls back to `User` values when the worker profile field is absent. That explains the live mixed payload for Kwame Asante:
- `profession` still came from `User` as `Master Carpenter`
- `bio`, `hourlyRate`, `yearsOfExperience`, and `skills` came from `WorkerProfile`

This is not a frontend parsing issue. It is the direct intended result of the merge function operating on diverged documents.

### Finding 3: the schema duplicates mutable worker attributes across two documents

Both shared models contain overlapping worker identity fields.

Shared `User` includes worker-facing fields such as:
- profession
- skills
- hourlyRate
- currency
- yearsOfExperience
- location
- specializations

Shared `WorkerProfile` also includes:
- profession
- skills
- skillEntries
- hourlyRate
- currency
- yearsOfExperience
- location
- specializations

This duplication guarantees drift unless every write path is perfectly synchronized.

### Finding 4: user-service still performs overlapping dual writes

`worker.controller.js` updates worker profile edits in two places during the same request:
- `user.firstName`, `user.location`, `user.bio`, `user.hourlyRate`, `user.yearsOfExperience`, `user.skills`
- `profile.bio`, `profile.hourlyRate`, `profile.yearsOfExperience`, `profile.location`, `profile.skills`

That confirms the codebase still treats both documents as mutable worker sources rather than preserving one canonical owner.

### Finding 5: live personalized recommendations do not match the checked-in controller

The current repo controller returns this empty-state message when no skills are available:

`Complete your profile and add skills to get personalized recommendations`

The live gateway returned this instead for the same worker:

`Complete your profile and start working to get personalized recommendations`

That live string does not exist anywhere in the current workspace. The gateway route itself is present and tested, so the remaining explanation is deployed job-service drift: production is serving a different personalized-controller build than the one audited locally.

This matters because the current repo implementation now uses canonical worker reads, but the live service still behaves as if the worker is a new, incomplete user despite a populated `profile-signals` contract.

## Live Evidence

Authenticated live probe for `kwame.asante1@kelmah.test` on `https://kelmah-api-gateway-gf3g.onrender.com` returned:

### `/api/auth/me`

- profession: `Master Carpenter`
- hourlyRate: `45`
- yearsOfExperience: `12`
- skills: `Carpentry`, `Furniture Making`, `Wood Finishing`, `Cabinet Installation`
- bio: carpenter-focused

### `/api/users/me/profile-signals`

- profession: `Master Carpenter`
- bio: `Professional electrical work specialist. Quality work guaranteed.`
- hourlyRate: `43`
- experienceLevel: `advanced`
- yearsOfExperience: `9`
- profile.skills: `electrical work`, `wiring`, `lighting`
- credentials.skills: `electrical work`, `wiring`, `lighting`
- completeness.completionPercentage: `85`
- meta.source: `user-service`

### `/api/jobs/recommendations/personalized?limit=2&page=1`

- success: `true`
- jobs: `[]`
- isNewUser: `true`
- meta.recommendationSource: `profile-incomplete`
- message: `Complete your profile and start working to get personalized recommendations`

## Root Cause

The backend precision problem is not a single bug.

It is a compound failure made of two independent issues:

1. Source-of-truth drift

Worker identity and matching inputs are duplicated across `User` and `WorkerProfile`. `auth/me` trusts raw `User`; `profile-signals` composes a merged view with worker-profile precedence. When those two documents drift, mobile receives conflicting truths for the same worker.

2. Deployment drift in personalized recommendations

The live personalized recommendation response does not match the current repo controller text, which means production is not running the same job-service logic audited in the workspace. That makes the personalized endpoint an unreliable diagnostic source until deployment parity is restored.

## Recommended Remediation Direction

1. Treat `WorkerProfile` as the single mutable worker recommendation source and stop storing overlapping worker identity fields as authoritative on `User`.
2. Reduce `/api/auth/me` to auth/session identity fields only, or replace its worker-facing usage with a canonical merged worker contract.
3. Redeploy job-service and confirm the live personalized endpoint matches the current repo controller contract exactly.
4. Add a production-parity probe that fails if live personalized empty-state metadata or message text diverges from the checked-in controller.
5. Backfill existing worker records so the stale `User` worker fields do not continue poisoning auth-session identity after canonicalization.

## Verification Performed

- Read the auth-service, user-service, job-service, gateway, shared model, shared utility, and contract-test surfaces listed above.
- Compared the current repo controller text against the live personalized recommendation payload.
- Confirmed live gateway route presence and worker auth access while verifying contract drift.
- Performed no backend runtime edits during this audit.