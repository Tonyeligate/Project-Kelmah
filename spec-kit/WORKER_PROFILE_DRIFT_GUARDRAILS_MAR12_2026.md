# Worker Profile Drift Guardrails March 12 2026

## Scope

- Add an admin-only read-only audit endpoint for `User` ↔ `WorkerProfile` alignment drift.
- Add a scheduled user-service maintenance job that reuses the reconciliation logic to self-heal future drift.
- Refactor the reconciliation logic into a reusable service so scripts, routes, and background jobs share the same behavior.

## Acceptance Criteria

- An authenticated admin can request a non-mutating alignment audit with summary counts and sample mismatches.
- User-service can run periodic alignment repair without a manual script invocation.
- Scheduling is safe against overlapping runs and does not block service startup.
- Automated tests cover the admin route protection and the shared alignment service behavior.

## Mapped Execution Surface

- kelmah-backend/services/user-service/routes/user.routes.js
- kelmah-backend/services/user-service/controllers/worker.controller.js
- kelmah-backend/services/user-service/server.js
- kelmah-backend/services/user-service/scripts/reconcile-worker-profile-alignment.js
- kelmah-backend/shared/utils/workerProfileAlignment.js
- spec-kit/STATUS_LOG.md

## Planned Fix Shape

- Extract the reconciliation query and apply flow into a reusable user-service alignment service.
- Add a protected `GET /api/users/workers/alignment/audit` endpoint for admin-only drift reporting.
- Add a startup-managed periodic maintenance runner with a simple in-process lock and env-controlled cadence.

## Implementation Completed

- Added `kelmah-backend/services/user-service/services/workerProfileAlignment.service.js` as the shared reconciliation surface for dry-run audits, apply-mode repairs, and scheduled maintenance.
- Refactored `kelmah-backend/services/user-service/scripts/reconcile-worker-profile-alignment.js` to use the shared service instead of duplicating the query and write logic.
- Added admin-only `GET /api/users/workers/alignment/audit` in `user.routes.js` and `worker.controller.js`, returning summary counts plus sample mismatches without mutating data.
- Started a periodic user-service maintenance loop from `server.js` that reuses the same shared service, defaults to enabled in production, and protects against overlapping runs with an in-process lock.
- Added focused tests in `services/user-service/tests/worker-profile-alignment.service.test.js` and extended `services/user-service/tests/dashboard-routes.auth.test.js` for the new admin endpoint.

## Configuration Notes

- `WORKER_PROFILE_ALIGNMENT_MAINTENANCE_ENABLED`:
	- explicit `true` or `false` overrides scheduler behavior
	- defaults to enabled in production and disabled outside production
- `WORKER_PROFILE_ALIGNMENT_MAINTENANCE_INTERVAL_MS` controls the recurring cadence and defaults to `21600000` (`6` hours).
- `WORKER_PROFILE_ALIGNMENT_MAINTENANCE_INITIAL_DELAY_MS` controls the first delayed run and defaults to `300000` (`5` minutes).

## Validation

- Focused Jest passed for:
	- `services/user-service/tests/worker-profile-alignment.service.test.js`
	- `services/user-service/tests/worker-profile-alignment.test.js`
	- `services/user-service/tests/dashboard-routes.auth.test.js`
	- `services/user-service/tests/worker-directory.controller.test.js`
- Result: `4` suites passed, `17` tests passed, `0` failures.
- `--detectOpenHandles` validation passed for the newly added guardrail suites:
	- `services/user-service/tests/worker-profile-alignment.service.test.js`
	- `services/user-service/tests/dashboard-routes.auth.test.js`
- Syntax checks passed for the touched user-service files via `node --check`.
- Live dry-run validation of the refactored script against Atlas completed successfully with `--limit=2` and reported zero remaining drift in the sampled records.

## Current Status

- Long-term worker summary drift guardrails are implemented.
- Admins now have a read-only audit path, and production user-service can self-heal future drift on a schedule using the same reconciliation logic as the maintenance script.