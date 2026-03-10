# Follow-Up Backfill, Settings, And JWT Safety Audit

Date: March 10, 2026
Status: COMPLETED
Owner: GitHub Copilot

## Scope
Execute the explicit worker-default backfill safely, then fix adjacent backend safety issues discovered during the same second-pass audit: user-settings write-on-read behavior and JWT subject serialization that can degrade missing ids into the literal string `"undefined"`.

## Acceptance Criteria
- `populate-worker-fields.js` is run in dry-run mode first and only re-run with `--apply` if the proposed updates are limited to safe operational defaults.
- User settings GET endpoints return effective defaults without creating a `Settings` record as a side effect.
- Shared JWT signing helpers reject missing subjects instead of emitting `sub: "undefined"`.
- Focused backend regression tests cover the settings read path and JWT subject guard.

## Mapped Execution Surface
- `kelmah-backend/services/user-service/scripts/populate-worker-fields.js`
- `kelmah-backend/services/user-service/config/db.js`
- `kelmah-backend/services/user-service/models/index.js`
- `kelmah-backend/services/user-service/models/Settings.js`
- `kelmah-backend/services/user-service/routes/settings.routes.js`
- `kelmah-backend/shared/utils/jwt.js`
- `kelmah-backend/services/auth-service/utils/shared-jwt.js`
- `kelmah-backend/services/user-service/tests/`
- `kelmah-backend/services/auth-service/tests/`
- `spec-kit/STATUS_LOG.md`

## Data Flow Trace
1. Worker-default backfill runs only through `populate-worker-fields.js`, which loads user-service env/config, ensures a MongoDB connection, queries active workers, and optionally applies safe `$set` updates.
2. Settings reads enter `settings.routes.js` through `GET /`, `GET /notifications`, and `GET /privacy`, then currently route through `getOrCreateSettings()`.
3. JWT issuance enters `signAccessToken()` / `signRefreshToken()` in the shared JWT helpers, where the `sub` claim is currently stringified before signing.

## Dry-Audit Findings
- The worker-default backfill script is already separated from read controllers and defaults to dry-run mode, which makes it safe to execute before any code edits.
- `settings.routes.js` still violates the read-only boundary by creating `Settings` documents during GET requests.
- `shared/utils/jwt.js` and `services/auth-service/utils/shared-jwt.js` both contain a real `String(undefined)` risk on the `sub` claim.
- The review analytics comment flagged by the sweep is stale wording, not the highest-value live defect, because route middleware already enforces admin access.

## Planned Fix
- Run the backfill dry-run, inspect the proposed updates, then apply only if the script remains limited to safe defaults.
- Replace settings read-side creation with read-only effective-default composition, preserving upsert behavior on PUT/reset flows.
- Add an explicit subject resolver for both JWT helper copies so signing throws on missing ids instead of emitting invalid claims.
- Add focused regression tests for settings GET behavior and JWT signing failure modes.

## Implementation Completed
- Attempted the worker-default backfill dry-run from `kelmah-backend/` with the service's SRV-based environment configuration.
- Confirmed the execution target and configuration were correct, but the first attempt could not reach MongoDB because the Node driver failed SRV resolution with `querySrv ECONNREFUSED _mongodb._tcp.kelmah-messaging.xyqcurn.mongodb.net`.
- Verified that DNS resolution from the workspace was otherwise healthy via both local `Resolve-DnsName` and DNS-over-HTTPS lookups, then derived the equivalent direct Atlas seedlist URI from the SRV and TXT answers.
- Re-ran the worker-default dry-run using that direct non-SRV MongoDB connection string and confirmed the dataset is already converged: 26 workers inspected, 0 proposed updates.
- Re-ran the same script with `--apply` against the same direct URI and confirmed a safe no-op apply pass: 26 workers inspected, 0 updates applied.
- Reworked `kelmah-backend/services/user-service/routes/settings.routes.js` so `GET /settings`, `GET /settings/notifications`, and `GET /settings/privacy` now return effective defaults without creating `Settings` documents on reads.
- Preserved explicit persistence on mutation routes by keeping upsert behavior on `PUT` endpoints and recreating defaults explicitly during `POST /settings/reset`.
- Hardened both JWT helper copies in `kelmah-backend/shared/utils/jwt.js` and `kelmah-backend/services/auth-service/utils/shared-jwt.js` so missing `id` / `sub` now throw `JWT subject is required` instead of emitting `sub: "undefined"`.
- Added focused regression coverage in `kelmah-backend/services/user-service/tests/settings.routes.test.js` and `kelmah-backend/services/auth-service/tests/shared-jwt.test.js`.
- Fixed an adjacent live syntax defect uncovered during verification in `kelmah-backend/services/user-service/controllers/worker.controller.js`, where `await verifyAccessToken(token)` sat inside a non-async helper in `getRecentJobs()`.
- Fixed the MongoDB driver deprecation warning surfaced during the backfill path by replacing `j: false` with `journal: false` in `kelmah-backend/services/user-service/config/db.js` and `kelmah-backend/services/job-service/config/db.js`.

## Validation
- Initial SRV-based execution from `kelmah-backend/` failed before inspection with:
	- `querySrv ECONNREFUSED _mongodb._tcp.kelmah-messaging.xyqcurn.mongodb.net`
- Direct-URI execution from `kelmah-backend/` then succeeded:
	- Dry-run result: `Found 26 workers to inspect`, `Mode: dry-run`, no worker update lines emitted.
	- Apply result: `Found 26 workers to inspect`, `Mode: apply`, `Applied safe defaults to 0 workers`.
- Post-fix verification rerun of the user-service dry-run completed without the previous MongoDB driver deprecation warning.
- Focused backend Jest verification passed from `kelmah-backend/`:
	- `services/user-service/tests/settings.routes.test.js`
	- `services/auth-service/tests/shared-jwt.test.js`
	- `services/user-service/tests/worker-profile.controller.test.js`
	- `services/job-service/tests/job-transform.test.js`
	- Result: 4 suites passed, 17 tests passed.

## Current State
- The follow-up code audit items are fixed: settings reads are read-only again, JWT subject serialization is guarded, the `getRecentJobs()` syntax defect is resolved, and the Mongo driver option warning is removed.
- The worker-default backfill request is now fully completed on the target database through the direct non-SRV Atlas connection path.
- The live worker dataset required no safe default backfill changes at the time of execution.