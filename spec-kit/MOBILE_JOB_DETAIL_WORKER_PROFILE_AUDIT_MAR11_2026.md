# Mobile Job Detail And Worker Profile Audit - March 11 2026

## Scope
- Audit the mobile job detail page and mobile worker profile page shown in the screenshots.
- Focus on routing correctness, user data flow, backend communication, and visible UI/UX defects.
- Keep this pass read-only: no code changes, no restarts, no redeploys.

## Acceptance Criteria
- Read the current route config, page components, service calls, and backend endpoints for both flows.
- Trace page load, share/save/apply actions, and public profile metadata from frontend to backend.
- Produce severity-ranked findings with root cause, impact, and fix direction.

## Mapped File Surface
- `kelmah-frontend/src/routes/config.jsx`
- `kelmah-frontend/src/modules/jobs/pages/JobDetailsPage.jsx`
- `kelmah-frontend/src/modules/jobs/services/jobsService.js`
- `kelmah-frontend/src/modules/worker/pages/WorkerProfilePage.jsx`
- `kelmah-frontend/src/modules/worker/components/WorkerProfile.jsx`
- `kelmah-frontend/src/modules/worker/services/workerService.js`
- `kelmah-backend/services/job-service/routes/job.routes.js`
- `kelmah-backend/services/job-service/controllers/job.controller.js`
- `kelmah-backend/services/user-service/routes/user.routes.js`
- `kelmah-backend/services/user-service/controllers/worker.controller.js`
- `spec-kit/STATUS_LOG.md`

## Initial Visual Signals From Screenshots
- Job detail mobile CTA bar overlays detail cards and image content instead of docking with reserved bottom spacing.
- Worker profile public chips render `undefined portfolio items` and `undefined certificates` on the live page.
- Worker profile visual hierarchy is inconsistent on mobile, with overlapping action affordances competing for attention near the hero image and floating action button.

## Verified Route And Data Flow
- Job detail deep link: `/jobs/:id` in `kelmah-frontend/src/routes/config.jsx` renders `JobDetailsPage`, which dispatches `fetchJobById(id)` and then loads `jobsService.getJobById()` against `GET /jobs/:id` on job-service.
- Worker profile deep links: both `/workers/:workerId` and `/worker-profile/:workerId` render `WorkerProfilePage`, which mounts `WorkerProfile` and resolves the worker ID from route params.
- Worker profile load path: `WorkerProfile` first calls `workerService.getWorkerById()` and then launches parallel secondary requests for skills, portfolio, certificates, work history, availability, profile completeness, rating, and optionally earnings.
- Worker nested resource endpoints are mounted under `/users/workers/:workerId/*` via `workerDetail.routes.js`, while profile, availability, completeness, bookmark, and earnings routes live directly in `user.routes.js`.

## Severity-Ranked Findings

### High
1. Worker profile portfolio and certificate state uses the wrong response shape.
	- Frontend stores `portfolioRes?.data?.data` and `certsRes?.data?.data` directly, then treats both as arrays when rendering `.length`, `.map`, and empty states.
	- Backend returns wrapped objects: portfolio comes back as `{ portfolioItems, pagination, stats }` and certificates come back as `{ certificates, totals }`.
	- Impact: the public hero chips show literal `undefined` counts, and both sections can render incorrect empty states even when backend data exists.

2. Worker availability UI renders a different contract than the availability service returns.
	- `workerService.getWorkerAvailability()` normalizes fields like `status`, `isAvailable`, `daySlots`, `schedule`, `pausedUntil`, and `lastUpdated`.
	- `WorkerProfile` renders `availabilityStatus`, `responseTime`, and `availableHours`, which are not supplied by that service response.
	- Impact: the page can falsely show default availability, `Not specified` response time, and blank working hours instead of the worker's real availability.

3. Owner performance and wallet cards are wired to the profile-completeness endpoint instead of a metrics endpoint.
	- `workerService.getWorkerStats()` calls `/users/workers/:id/completeness`.
	- The owner mobile UI then renders business metrics such as `upcoming_jobs`, `average_rating`, `wallet_balance`, and `in_escrow` from that payload.
	- Impact: those cards default to zeros or placeholders because the backend endpoint only returns completion percentages and recommendations.

### Medium
4. Job detail mobile CTA layout is structurally broken on narrow screens.
	- The fixed mobile CTA bar defines `gridTemplateColumns: 'minmax(0, 1fr) auto auto'` but renders four children: text, primary CTA, save, and share.
	- Impact: one action is forced into an unintended wrap or compression path, which matches the screenshot's broken sticky footer layout.

5. Worker profile over-fetches and mixes overlapping contracts.
	- `WorkerProfile` calls `getWorkerById()` and then immediately fires seven more requests in parallel.
	- `getWorkerById()` already includes stats, availability, portfolio summary, certification summary, and skills in its response payload.
	- Impact: the public page pays extra latency, increases cold-start failure surface, and allows sections on the same screen to disagree because they are sourced from different endpoints.

6. The same public worker profile is reachable through two canonical URLs.
	- Both `/workers/:workerId` and `/worker-profile/:workerId` are active public routes.
	- The page shares and copies `window.location.href`, so the outgoing URL depends on whichever route variant the user entered.
	- Impact: analytics, indexing, and shared links fragment across two public URLs for the same worker.

### Low
7. Worker bookmark semantics are non-idempotent and ignore the explicit delete path.
	- The frontend bookmark handler always posts to `bookmarkWorker()` even when removing a saved worker.
	- The backend currently toggles bookmark state on both `POST` and `DELETE`, which masks the bug for single clicks but makes retries and duplicate submissions unsafe.
	- Impact: save/remove semantics are brittle and user feedback can desynchronize from actual state under repeated requests.

## Recommended Fix Order
1. Normalize worker profile portfolio, certificates, availability, and owner metrics onto the backend contracts actually returned today.
2. Collapse the worker public profile onto one canonical route and one authoritative data payload.
3. Rebuild the job-detail mobile CTA footer with a layout that matches its actual action count.
4. Make worker bookmark save/remove operations explicit and idempotent end to end.