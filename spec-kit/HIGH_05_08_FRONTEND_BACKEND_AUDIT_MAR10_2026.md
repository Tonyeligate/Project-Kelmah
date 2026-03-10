# HIGH-05 To HIGH-08 Frontend And Backend Audit

Date: March 10, 2026
Status: COMPLETED
Owner: GitHub Copilot

## Scope
Audit and fix the reported registration mobile-layout, search suggestion request-churn, worker-profile defaulting side effect, and job hirer-id normalization defects across the frontend and backend.

## Acceptance Criteria
- The registration experience remains mobile-safe even when the desktop Register component is rendered directly, with responsive padding and panel heights or a mobile handoff on small screens.
- Search suggestions stop firing an uncancelled request on every keystroke from the shared search service boundary, using debounce plus request cancellation/deduplication semantics.
- No worker-profile public read path contains controller logic that can write generated defaults back into MongoDB during unauthenticated reads.
- Job transformation never serializes a missing hirer identifier into the literal string `"undefined"`.
- Touched paths validate cleanly, and focused regressions cover the backend safety fixes plus the frontend routing/mobile safeguard where practical.

## Mapped Execution Surface
- `kelmah-frontend/src/modules/auth/components/register/Register.jsx`
- `kelmah-frontend/src/modules/auth/components/mobile/MobileRegister.jsx`
- `kelmah-frontend/src/modules/auth/pages/RegisterPage.jsx`
- `kelmah-frontend/src/routes/config.jsx`
- `kelmah-frontend/src/tests/smoke/register-flows.smoke.test.jsx`
- `kelmah-frontend/src/modules/search/services/searchService.js`
- `kelmah-frontend/jest.config.cjs`
- `kelmah-frontend/src/services/apiClient.js`
- `kelmah-backend/services/user-service/controllers/worker.controller.js`
- `kelmah-backend/services/user-service/routes/user.routes.js`
- `kelmah-backend/services/user-service/scripts/populate-worker-fields.js`
- `kelmah-backend/services/user-service/models/index.js`
- `kelmah-backend/services/user-service/config/db.js`
- `kelmah-backend/services/user-service/tests/worker-profile.controller.test.js`
- `kelmah-backend/services/job-service/utils/jobTransform.js`
- `kelmah-backend/services/job-service/controllers/job.controller.js`
- `spec-kit/STATUS_LOG.md`

## Data Flow Trace
1. Frontend registration requests route through `src/routes/config.jsx` to `RegisterPage.jsx`, which currently selects `MobileRegister.jsx` below the `md` breakpoint and otherwise renders `Register.jsx`.
2. The desktop `Register.jsx` component still owns its own shell sizing, padding, and panel heights, so direct renders of that component can still present a desktop-only layout on narrow viewports.
3. Shared search suggestions call `searchService.getSuggestions()` in `kelmah-frontend/src/modules/search/services/searchService.js`, which reaches `GET /search/suggestions` through `src/services/apiClient.js`.
4. Public worker profile reads flow through `GET /workers/:id` in `kelmah-backend/services/user-service/routes/user.routes.js` into `WorkerController.getWorkerById()` in `worker.controller.js`.
5. Job-list and personalized-recommendation responses call `transformJobForFrontend()` or `transformJobsForFrontend()` from `kelmah-backend/services/job-service/utils/jobTransform.js` before returning job payloads.

## Dry-Audit Findings
- The report that `MobileRegister.jsx` is never imported or used is stale: `RegisterPage.jsx` already imports `MobileRegister.jsx` and renders it below the `md` breakpoint.
- The underlying mobile risk is still real in `Register.jsx` itself: the component shell omits `xs` and `sm` padding values and hard-codes `minHeight: 760` on both major panels, so any direct render of `Register.jsx` remains hostile to phones.
- `searchService.getSuggestions()` currently issues a fresh request immediately for every non-empty query and has no internal debounce, no internal cancellation, and no same-query reuse. `apiClient.js` only deduplicates concurrent identical GETs, which does not address sequential as-you-type churn.
- `WorkerController.getWorkerById()` no longer calls `autopopulateWorkerDefaults()`, so the exact production read path in the report appears stale. However, the helper still exists in the public-read controller file and still contains write-on-read logic plus generated bio text, which is unsafe to keep there.
- An existing maintenance script, `populate-worker-fields.js`, already exists as a better home for explicit backfill behavior, but it currently bypasses service-model conventions and still uses misleading defaults such as `rating = 4.5` plus generated bio text.
- `jobTransform.js` still converts a missing populated hirer id through `String(job.hirer._id || job.hirer.id)`, which can emit the literal string `"undefined"` into `_id` and `id`.

## Planned Fix
- Harden `Register.jsx` so it is safe on small screens even when rendered directly, while preserving the existing `RegisterPage.jsx` mobile handoff.
- Add a debounced, abortable, same-query-aware implementation for `searchService.getSuggestions()` without changing the public response shape.
- Remove the controller-local `autopopulateWorkerDefaults()` helper from `worker.controller.js` and migrate the explicit maintenance behavior into `populate-worker-fields.js` using user-service model conventions and safer defaults.
- Guard hirer id normalization in `jobTransform.js` so absent ids stay `null`, not `"undefined"`.

## Implementation Completed
- Hardened `kelmah-frontend/src/modules/auth/components/register/Register.jsx` with a direct mobile handoff to `MobileRegister.jsx` below the `md` breakpoint, plus responsive `xs` and `sm` shell padding and panel sizing so standalone renders no longer assume desktop-only spacing.
- Added focused route-level coverage in `kelmah-frontend/src/modules/auth/pages/RegisterPage.test.jsx` to lock the existing desktop/mobile breakpoint split in place.
- Reworked `kelmah-frontend/src/modules/search/services/searchService.js` so `getSuggestions()` now debounces requests, reuses the same scheduled promise for duplicate queries, aborts superseded in-flight requests, and preserves the existing `[]` fallback contract on abort or failure.
- Added `kelmah-frontend/src/modules/search/services/searchService.test.js` to cover duplicate-query reuse and abort-on-new-query behavior.
- Wired `kelmah-frontend/jest.config.cjs` to the already-checked-in `babel.jest.config.cjs` so frontend tests can transform `import.meta` consistently outside the smoke-only Jest config.
- Removed the unused but unsafe `autopopulateWorkerDefaults()` helper from `kelmah-backend/services/user-service/controllers/worker.controller.js`, keeping public worker profile reads read-only.
- Hardened `kelmah-backend/services/user-service/scripts/populate-worker-fields.js` into an explicit maintenance script that uses user-service model conventions, defaults to dry-run mode, and only backfills operationally safe fields when `--apply` is provided.
- Added a no-write regression to `kelmah-backend/services/user-service/tests/worker-profile.controller.test.js` so public profile reads cannot silently mutate worker records.
- Updated `kelmah-backend/services/job-service/utils/jobTransform.js` so missing populated hirer ids now remain `null` instead of being stringified to `"undefined"`.
- Added `kelmah-backend/services/job-service/tests/job-transform.test.js` to lock the hirer-id guard in place.

## Validation
- `get_errors` reported no diagnostics across all touched frontend files, backend files, and spec-kit documents after the edits.
- Focused frontend Jest verification passed from `kelmah-frontend/`:
	- `src/modules/auth/pages/RegisterPage.test.jsx`
	- `src/modules/search/services/searchService.test.js`
	- Result: 2 suites passed, 4 tests passed.
- Focused backend Jest verification passed from `kelmah-backend/`:
	- `services/user-service/tests/worker-profile.controller.test.js`
	- `services/job-service/tests/job-transform.test.js`
	- Result: 2 suites passed, 9 tests passed.
- Frontend production build verification passed from `kelmah-frontend/`:
	- `npm run build`
	- Result: Vite build completed successfully and emitted the updated `build/` output.

## Outcome
- The mobile registration concern was partly stale but still actionable: route-level mobile rendering already existed, and the remaining risk is now removed from direct standalone `Register.jsx` renders.
- Search suggestions now have a real service-layer request-churn control point instead of relying solely on caller behavior or shared GET dedupe.
- The dangerous write-on-read worker defaulting logic is no longer present in the public controller surface.
- Job transforms no longer leak the literal string `"undefined"` into hirer identifiers.