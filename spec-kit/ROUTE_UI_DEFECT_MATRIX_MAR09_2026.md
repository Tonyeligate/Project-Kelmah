# Route-By-Route UI Defect Matrix (Verified)

Date: March 9, 2026
Scope: Frontend route surface from `kelmah-frontend/src/routes/config.jsx` with verified defects only.

## `/jobs` (JobsPage)

1. Severity: High
   File: `kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx:457`
   Issue: Error boundary fallback uses `window.location.reload()`, forcing full app reload and dropping SPA state.
   Fix: Replace with local recovery (`setPage(1)`, `refetchJobs()`, clear local error state).

2. Severity: Medium
   File: `kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx:1808`
   Issue: Runtime error state "Retry" also uses `window.location.reload()`, repeating heavy full refresh behavior.
   Fix: Reuse route-level retry handler that refetches jobs without browser reload.

3. Severity: Medium
   File: `kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx:1189`
   Issue: Search button calls `refetchJobs()` but query payload is built from `debouncedSearch` (`.../JobsPage.jsx:487`), so fast click after typing can fetch stale criteria.
   Fix: Add a submitted-search state (`searchInput` -> `submittedSearch`) and drive query key from submitted value when button is clicked.

## `/jobs/:id` (JobDetailsPage)

1. Severity: Medium
   File: `kelmah-frontend/src/modules/jobs/pages/JobDetailsPage.jsx:908`
   Issue: "Sign in" is a clickable `<span>` without keyboard semantics.
   Fix: Replace with `<Button>` or add `role="button"`, `tabIndex={0}`, and Enter/Space handlers.

## `/worker/find-work` (JobSearchPage)

1. Severity: Medium
   File: `kelmah-frontend/src/modules/worker/pages/JobSearchPage.jsx:809`
   Issue: URL sync-on-mount only restores `category`; `search` and `location` query params are not rehydrated consistently.
   Fix: Hydrate all filter state from `searchParams` in one effect (`search`, `category`, `location`, and page if present).

2. Severity: Medium
   File: `kelmah-frontend/src/modules/worker/pages/JobSearchPage.jsx:759`
   Issue: `totalPages` can fall back to client-derived length while active filtering is server-driven, leading to pagination/visible-count mismatch.
   Fix: Prefer server pagination metadata exclusively when available, and render a separate "visible count" if client filtering is applied.

## `/hirer/dashboard` (HirerDashboardPage)

1. Severity: Medium
   File: `kelmah-frontend/src/modules/hirer/pages/HirerDashboardPage.jsx:82`
   Issue: `APPLICATION_REFRESH_TTL_MS` is fixed at 2 minutes; application-record cache can stay stale during high activity.
   Fix: Reduce TTL (for example 30-60s) or trigger targeted invalidation on action events.

## `/hirer/find-talent` (WorkerSearchPage / WorkerSearch)

1. Severity: Medium
   File: `kelmah-frontend/src/routes/config.jsx:453`
   Issue: Route does not use `RouteErrorBoundary`, so a rendering error can blank the page.
   Fix: Wrap `WorkerSearchPage` with `RouteErrorBoundary` at route config level.

2. Severity: Medium
   File: `kelmah-frontend/src/modules/hirer/components/WorkerSearch.jsx:471`
   Issue: Offline fallback cache TTL is 30 minutes (`30 * 60 * 1000`), which can surface stale worker ranking/availability data.
   Fix: Reduce TTL (5-10 min) and tag UI as fallback/stale when cache is used.

## `/messages` (MessagingPage)

1. Severity: Medium
   File: `kelmah-frontend/src/modules/messaging/pages/MessagingPage.jsx:446`
   Issue: Typing timeout ref is cleared when retyping, but no explicit unmount cleanup for `typingTimeoutRef` is present.
   Fix: Add unmount cleanup effect to clear timeout and call `stopTyping` safely.

2. Severity: Low
   File: `kelmah-frontend/src/modules/messaging/pages/MessagingPage.jsx:457`
   Issue: `handleFileSelect` callback uses `showFeedback` but has empty dependency array, risking stale closure behavior.
   Fix: Include `showFeedback` in dependency list or wrap it in a stable ref.

## Fixed In Current Pass

1. `kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx`: undefined refresh callback fixed; nested action click bubbling fixed; keyboard activation added to clickable cards.
2. `kelmah-frontend/src/modules/hirer/components/RecentActivityFeed.jsx`: application events now derived from bucketized state.
3. `kelmah-frontend/src/modules/hirer/components/WorkerSearch.jsx`: deterministic fallback IDs added; stale-response guard added; bookmark fetch decoupled from search requests.
4. `kelmah-frontend/src/modules/hirer/services/hirerSlice.js`: `active -> open` status alias normalization + robust `id/_id` handling.
