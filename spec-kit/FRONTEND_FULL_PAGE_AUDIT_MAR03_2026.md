# Frontend Full Page Audit — Mar 03, 2026

## Scope
- Audited all frontend page files under `kelmah-frontend/src/**/pages/**/*.jsx` (59 files).
- Review dimensions: bugs, security, performance, maintainability, edge cases.
- Method: full inventory + static pattern scans + in-file validation of high-risk findings.

## High-Impact Findings

### 1) Unsafe external open in scheduling (meeting links)
- Severity: High
- File: `kelmah-frontend/src/modules/scheduling/pages/SchedulingPage.jsx` (line ~183)
- Problem: `window.open(appointment.meetingLink, '_blank')` uses raw, unvalidated URL.
- Why it matters: malicious meeting links can cause phishing/open-redirect behavior.
- Fix: validate protocol (`https:` allowlist), then open with `noopener,noreferrer`.

### 2) `_blank` without `noopener,noreferrer` in multiple pages
- Severity: Medium
- Files:
  - `kelmah-frontend/src/modules/scheduling/pages/SchedulingPage.jsx` (lines ~183, ~201)
  - `kelmah-frontend/src/modules/quickjobs/pages/QuickJobTrackingPage.jsx` (line ~246)
  - `kelmah-frontend/src/modules/map/pages/ProfessionalMapPage.jsx` (line ~396)
  - `kelmah-frontend/src/modules/contracts/pages/ContractDetailsPage.jsx` (line ~254)
  - `kelmah-frontend/src/modules/contracts/pages/ContractsPage.jsx` (line ~351)
- Problem: reverse-tabnabbing risk and opener exposure.
- Fix: always call `window.open(url, '_blank', 'noopener,noreferrer')`.

### 3) Jobs dedupe and key instability (`id` only)
- Severity: High
- Files:
  - `kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx` (line ~760)
  - `kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx` (line ~1843)
- Problem: dedupe map and React key both use `job.id` only; records with `_id` can collapse or collide.
- Why it matters: missing cards, unstable rendering, hard-to-reproduce UI bugs.
- Fix: normalize `const jobId = job.id || job._id`, filter out null IDs, key by normalized id.

### 4) Quick job photo preview URL lifecycle bug
- Severity: High
- File: `kelmah-frontend/src/modules/quickjobs/pages/QuickJobTrackingPage.jsx` (lines ~186–191)
- Problem: cleanup effect depends on `completionPhotos`, revoking still-active preview URLs during state transitions.
- Why it matters: broken images and memory churn.
- Fix: revoke URL when photo is removed; keep unmount-only global cleanup using stable ref.

### 5) Quick job request page leaks timers/media resources
- Severity: High
- File: `kelmah-frontend/src/modules/quickjobs/pages/QuickJobRequestPage.jsx` (lines ~152–184, ~284)
- Problem: no unmount cleanup for recorder/timer and delayed navigation timeout.
- Why it matters: state updates after unmount, mic/timer leaks, flaky navigation.
- Fix: add a cleanup `useEffect` to stop recorder/tracks, clear interval, revoke voice URL, clear pending timeout.

### 6) Unbounded fanout on application loading
- Severity: Medium
- File: `kelmah-frontend/src/modules/hirer/pages/ApplicationManagementPage.jsx` (line ~167)
- Problem: one API call per job in a single fanout; scales poorly with large job counts.
- Why it matters: backend pressure, slow dashboard load, rate-limit risk.
- Fix: client concurrency limit (e.g., 4–8) + backend bulk endpoint/paginated aggregation.

### 7) Unsafe date formatting can crash render paths
- Severity: High/Medium mix
- Files:
  - `kelmah-frontend/src/modules/messaging/pages/MessagingPage.jsx` (line ~1762)
  - `kelmah-frontend/src/modules/reviews/pages/ReviewsPage.jsx` (lines ~585, ~737)
  - `kelmah-frontend/src/modules/notifications/pages/NotificationsPage.jsx` (line ~115)
  - `kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx` (lines ~2221, ~2227)
  - `kelmah-frontend/src/modules/contracts/pages/ContractsPage.jsx` (line ~327)
  - `kelmah-frontend/src/modules/contracts/pages/ContractDetailsPage.jsx` (line ~132)
  - `kelmah-frontend/src/modules/contracts/pages/CreateContractPage.jsx` (line ~379)
  - `kelmah-frontend/src/modules/payment/pages/BillPage.jsx` (line ~264)
  - `kelmah-frontend/src/modules/admin/pages/PayoutQueuePage.jsx` (lines ~182, ~221)
- Problem: `new Date(...)` + format/toLocale* used without robust validity guards.
- Why it matters: `RangeError: Invalid time value` and degraded UX.
- Fix: centralize `safeFormatDate` / `safeFormatRelative` and apply consistently.

### 8) Search query object allows arbitrary keys
- Severity: Medium
- File: `kelmah-frontend/src/modules/search/pages/SearchPage.jsx` (lines ~391–434)
- Problem: arbitrary URL query keys are copied into a plain object.
- Why it matters: pollution-prone input flow, unpredictable filters/state.
- Fix: explicit key whitelist and safer object creation (`Object.create(null)`).

### 9) Delayed navigation timers without cleanup
- Severity: Low/Medium
- Files:
  - `kelmah-frontend/src/modules/worker/pages/WorkerProfileEditPage.jsx` (line ~450)
  - `kelmah-frontend/src/modules/quickjobs/pages/NearbyJobsPage.jsx` (line ~164)
- Problem: timeout can fire after unmount.
- Fix: timeout ref + cleanup effect.

## Performance 80/20 Priorities
1. Normalize IDs once in jobs list (`id || _id`) and use for dedupe/keying.
2. Concurrency-limit app-fetch fanout and move to server-side aggregation endpoint.
3. Standardize safe date formatting utility to remove repetitive parse/format cost and crash risk.
4. Fix quickjobs blob URL/timer lifecycle leaks.
5. Add shared `openExternalSafe(url)` utility to enforce secure link behavior.
6. Add ESLint custom rules:
   - block raw `window.open(..., '_blank')` without `noopener,noreferrer`
   - block direct `new Date(x)` render formatting without safe helper
   - enforce normalized list keys (`id || _id` where legacy payloads exist)

## Audit Outcome
- Total pages audited: 59
- Priority findings to address first: 9
- Estimated quick-win patch set: 1–2 days for highest-risk issues above
