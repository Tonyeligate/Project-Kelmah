# File Audit: Worker Availability Helpers (`workerService.getWorkerAvailability` / `updateWorkerAvailability`)
**Audit Date:** October 3, 2025  
**Auditor:** AI Development Agent  
**Primary Status:** ❌ Blocking (route mismatch + DTO drift)

---

## Primary Analysis
- **Scope:** Availability helpers exported from `kelmah-frontend/src/modules/worker/services/workerService.js`, accompanying Redux thunk in `workerSlice.js`, and UI consumers (`AvailabilityStatus`, `WorkerProfile`, `WorkerProfileEditPage`).
- **Intent:** Provide read/write access to a worker's availability settings through consolidated user-service endpoints while keeping dashboard UI in sync.
- **Backend Targets:**
  - Legacy worker controller route: `GET /api/users/workers/:id/availability` (proxied to user-service worker controller).
  - Canonical availability controller routes: `GET/PUT /api/availability/:userId?`.

---

## Secondary Files Reviewed
| File | Relationship | Status | Notes |
| --- | --- | --- | --- |
| `kelmah-frontend/src/modules/worker/services/workerSlice.js` | Redux thunk `updateWorkerAvailability` used by profile editor. | ❌ Blocking | Issues PUT directly to `/api/users/workers/:id/availability` with no fallback, so every request 404s. Payload shape (`availabilityStatus`, `availableHours`) ignored by backend. |
| `kelmah-frontend/src/modules/dashboard/components/worker/AvailabilityStatus.jsx` | Dashboard widget consuming helper. | ⚠️ Issues | Relies on `workerService.getWorkerAvailability`; because backend route returns placeholder data, the widget defaults to "busy" even when user should be available. |
| `kelmah-frontend/src/modules/worker/pages/WorkerProfileEditPage.jsx` | Profile editor dispatching thunk for schedule updates. | ❌ Blocking | Sends DTO fields (`availabilityStatus`, `availableHours`) that backend filters out; availability never updates.
| `kelmah-backend/services/user-service/routes/user.routes.js` | Worker availability GET route. | ⚠️ Issues | Only GET route exists; no matching PUT, so gateway PUT calls fall through to 404.
| `kelmah-backend/services/user-service/controllers/worker.controller.js` | Legacy availability implementation. | ❌ Blocking | Queries `Availability.findOne({ userId })` but schema uses `user`; always returns "not_set" payload lacking `isAvailable`. |
| `kelmah-backend/services/user-service/controllers/availability.controller.js` | Canonical availability CRUD. | ✅ Reviewed | Properly reads/writes `{ isAvailable, daySlots, holidays, ... }` via `/api/availability` routes. |
| `kelmah-backend/services/user-service/models/Availability.js` | Data model. | ✅ Reviewed | Confirms field names `user`, `daySlots`, `holidays`, etc. Highlights mismatch with worker controller expectations. |

---

## Issues Identified
- **Primary Issue 1 – Dead Route Path:**
  - Frontend helpers still treat `/api/users/workers/:id/availability` as the canonical endpoint. The user-service only defines a GET handler there; PUT is missing, so updates through the gateway always 404. Redux thunk has no fallback, breaking the profile editor outright.

- **Primary Issue 2 – Fallback Never Engages:**
  - `workerService.getWorkerAvailability` catches only non-404/405 errors before falling back to `/api/availability/:id`. Because the legacy worker controller responds `200 OK` with placeholder data, the fallback never runs and the UI consumes stale `status: 'not_set'` payloads.

- **Primary Issue 3 – Legacy Controller Schema Drift:**
  - `worker.controller.getWorkerAvailability` queries `Availability.findOne({ userId })` even though the schema stores the reference under `user`. As a result the handler always returns the placeholder response, guaranteeing wrong data for every worker despite documents existing.
  - The same handler references `availability.schedule`, but the schema exposes `daySlots`; returned object omits `isAvailable`, forcing the frontend to infer availability from `status` (which defaults to `'not_set'`).

- **Primary Issue 4 – DTO Mismatch on Update:**
  - The profile editor dispatches `availabilityData` with keys like `availabilityStatus`, `availableHours`, `pausedUntil`. The backend availability controller whitelists `['timezone','isAvailable','pausedUntil','daySlots','holidays','notes','dailyHours','weeklyHoursCap']`, so nearly all submitted fields are dropped. Even when the fallback PUT succeeds, no meaningful state changes.

- **Secondary Issue – UI Default Behaviour:**
  - Dashboard widget converts the placeholder payload into `isAvailable === false`, making workers appear "Busy" by default. It then stores that state locally, hiding real availability.
  - Multiple code paths (dashboard vs profile editor) diverge between direct helper usage and Redux thunks, increasing the risk of inconsistent fixes.

---

## Actions & Recommendations
- **Immediate (Blocker Remediation):**
  1. Update frontend helpers and Redux thunks to point directly at `/api/availability/:userId?`, removing the brittle legacy first call.
  2. Until consolidation is finished, short-circuit the legacy worker controller routes to 410/404 so the fallback is always triggered and developers see the unsupported path.
  3. Patch `availability.controller` to accept a normalized DTO (e.g., map `availabilityStatus` → `isAvailable`, `availableHours` → `daySlots`) or update frontend forms to send the canonical shape.

- **Backend Fix:**
  - Repair `worker.controller.getWorkerAvailability` to query `{ user: workerId }` and normalize the response to `{ isAvailable, daySlots, holidays, lastUpdated }`. Alternatively, delete the legacy endpoint after frontend migrates fully to `/api/availability`.

- **Frontend Refactor:**
  - Centralize availability helpers (service + thunk) around a single serializer/deserializer that produces consistent structure for dashboards and editors.
  - Add unit tests covering read/write flows to guard against future route drift.

---

**Next Primary Audit Candidate:** Investigate `src/modules/worker/services/notificationsService.js` (or adjacent worker utility) to continue flushing out stale service wrappers.
