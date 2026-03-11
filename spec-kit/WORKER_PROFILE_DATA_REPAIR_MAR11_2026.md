# Worker Profile Data Repair March 11 2026

## Scope

- Audit and repair stored `User` and `WorkerProfile` mismatches for profession, skills, specializations, and bio.
- Tighten worker discovery so stale fallback fields do not keep polluting search after the repair.
- Keep the migration safe by defaulting to dry-run mode and requiring an explicit apply flag for writes.

## Acceptance Criteria

- A reusable reconciliation rule exists for `User` ↔ `WorkerProfile` worker summary fields.
- A migration script can report mismatches and optionally apply the repair.
- Worker discovery prefers profile-owned skills and specializations when present instead of unioning stale user fields back in.
- Automated tests cover the reconciliation logic and the discovery fallback change.

## Mapped Execution Surface

- kelmah-backend/shared/utils/canonicalWorker.js
- kelmah-backend/shared/models/User.js
- kelmah-backend/shared/models/WorkerProfile.js
- kelmah-backend/services/user-service/controllers/worker.controller.js
- kelmah-backend/services/user-service/scripts/populate-worker-fields.js
- kelmah-backend/services/user-service/tests/worker-directory.controller.test.js
- kelmah-backend/services/user-service/tests/worker-profile.controller.test.js
- spec-kit/STATUS_LOG.md

## Planned Fix Shape

- Add a shared worker-profile alignment utility that chooses authoritative values from `WorkerProfile` first and falls back to `User` only when the profile is missing that field.
- Create a user-service maintenance script that reports mismatches and, with `--apply`, writes the reconciled values back to both documents.
- Update worker discovery aggregation so profile-owned skills and specializations are preferred over stale `User` arrays once profile data exists.

## Implementation Completed

- Added `kelmah-backend/shared/utils/workerProfileAlignment.js` to compute authoritative worker summary values and field-level alignment deltas for `User` and `WorkerProfile` documents.
- Added `kelmah-backend/services/user-service/scripts/reconcile-worker-profile-alignment.js` with safe dry-run defaults plus `--apply`, `--limit`, and `--worker-id` controls.
- Updated `kelmah-backend/services/user-service/controllers/worker.controller.js` so worker discovery and trade-stats aggregations prefer profile-owned skills and specializations when they exist instead of always unioning stale `User` arrays back in.
- Added focused backend coverage in `kelmah-backend/services/user-service/tests/worker-profile-alignment.test.js` and extended `kelmah-backend/services/user-service/tests/worker-directory.controller.test.js` to lock the new profile-first fallback behavior.

## Validation

- Focused backend Jest validation passed for:
	- `services/user-service/tests/worker-profile-alignment.test.js`
	- `services/user-service/tests/worker-directory.controller.test.js`
	- `services/user-service/tests/worker-profile.controller.test.js`
	- `services/job-service/tests/job-ranking.contract.test.js`
- Result: `4` suites passed, `16` tests passed, `0` failures.

## Live Audit Attempt

- Initial dry-run execution hit an Atlas SRV DNS blocker in the current environment: `querySrv ECONNREFUSED _mongodb._tcp.kelmah-messaging.xyqcurn.mongodb.net`.
- PowerShell DNS lookups against `8.8.8.8` returned the cluster SRV hosts and TXT options, which were then assembled into a direct replica-set `mongodb://` URI workaround:
	- hosts: `ac-monrsuz-shard-00-00.xyqcurn.mongodb.net`, `ac-monrsuz-shard-00-01.xyqcurn.mongodb.net`, `ac-monrsuz-shard-00-02.xyqcurn.mongodb.net`
	- options: `ssl=true`, `replicaSet=atlas-rtsei5-shard-0`, `authSource=admin`, `retryWrites=true`, `w=majority`
- Full live dry-run then completed successfully and reported:
	- `totalWorkers=26`
	- `inspectedProfiles=20`
	- `missingProfiles=6`
	- `workersNeedingChanges=26`
	- `userUpdates=40`
	- `profileUpdates=46`
	- `profilesCreated=6`
- Apply execution then completed successfully against the same dataset.
- Follow-up full dry-run confirmed the repair was fully consumed:
	- `inspectedProfiles=26`
	- `missingProfiles=0`
	- `workersNeedingChanges=0`
	- `userUpdates=0`
	- `profileUpdates=0`
	- `profilesCreated=0`

## Current Status

- Code remediation, automated validation, live dry-run auditing, and live apply repair are complete.
- Stored `User` and `WorkerProfile` worker-summary data is now aligned across the current 26-worker dataset, and discovery no longer unions stale user arrays back in when profile-owned arrays exist.

## Post-Repair Live Re-Probe

- Production gateway health remained healthy at `200` on `https://kelmah-api-gateway-gf3g.onrender.com/health`.
- Public free-text worker search now returns materially trade-relevant results against the repaired dataset:
	- `GET /api/users/workers/search?query=carpentry&limit=5` returned `5/5` trade-relevant previews.
	- `GET /api/users/workers/search?query=electrical work&limit=5` returned `5/5` trade-relevant previews.
	- `GET /api/users/workers/search?query=plumbing&limit=5` returned `5/5` trade-relevant previews.
- Live explicit trade-filter searches are still stale in production even after the data repair:
	- `GET /api/users/workers/search?primaryTrade=carpentry&limit=5`
	- `GET /api/users/workers/search?trade=carpentry&limit=5`
	- `GET /api/users/workers/search?category=carpentry&limit=5`
	- all returned the same near-default worker list and response metadata omitted `searchParams.primaryTrade`, while the current controller code should echo that field and apply the trade filter.
- Live personalized recommendations remain stale in production relative to the repaired dataset and current workspace code:
	- worker logins succeeded for `kwaku.addai@kelmah.test`, `adjoa.oppong@kelmah.test`, `efua.mensah@kelmah.test`, and `yaa.adjei@kelmah.test`
	- each `GET /api/jobs/recommendations/personalized?limit=5` returned `200` with `0` jobs and `recommendationSource=worker-profile`
	- direct MongoDB verification using the current controller query found strict candidate counts of `6`, `6`, `5`, and `5` respectively for those same workers
	- this means the repaired dataset is present, but the deployed job-service runtime is not reflecting the current recommendation controller behavior yet.

## Interpretation

- The data repair improved the content available to the live free-text worker search path.
- The remaining production precision issues are runtime parity issues, not additional stored-data drift:
	- user-service live runtime is still not honoring the current `primaryTrade`/`trade`/`category` search contract
	- job-service live runtime is still returning empty personalized recommendations for workers whose current-code candidate query resolves live jobs against the same Atlas dataset