# Worker Profile Deep-Link Investigation (Nov 29, 2025)

## Scope & Problem Restatement
- **User Symptom**: From the public Find Talents page, clicking a worker card updates the URL to `/worker-profile/:workerId`, but the rendered profile stays on the previous worker until the user performs a hard refresh.
- **Goal**: Ensure in-app navigation between worker profiles immediately loads the target worker without manual reloads, and document the full UI → API flow so future audits understand how remounting/data refresh occur.

## File Surface (Dry Audit Completed Nov 29)
| Layer | File | Notes |
| --- | --- | --- |
| UI Grid | `kelmah-frontend/src/modules/search/components/results/WorkerSearchResults.jsx` | Renders `WorkerCard` inside a `Grid`; passes `worker` props plus optional `onSaveWorker` handler. |
| Card Interaction | `kelmah-frontend/src/modules/worker/components/WorkerCard.jsx` | Card body is a `RouterLink` to `/worker-profile/:workerId`; legacy `handleViewProfile` also calls `navigate`. Contains CTA buttons (View, Message, Bookmark). |
| Routing | `kelmah-frontend/src/routes/config.jsx` | Declares both `/workers/:workerId` and `/worker-profile/:workerId` pointing to `WorkerProfilePage`; Layout wraps routed children via `<Outlet />`. |
| Page Wrapper | `kelmah-frontend/src/modules/worker/pages/WorkerProfilePage.jsx` | Reads `workerId` from `useParams`, scrolls to top on change, renders `<WorkerProfile key={workerId} />` inside `Container`. |
| Core Component | `kelmah-frontend/src/modules/worker/components/WorkerProfile.jsx` | Large component that fetches profile + related data via `workerService`; `fetchAllData` resets state, uses `workerId` dependency. |
| API Client | `kelmah-frontend/src/modules/worker/services/workerService.js` | Provides `/users/workers/:id` API helpers for profile, skills, availability, etc. Relies on shared `apiClient`. |
| Service Worker | `kelmah-frontend/public/sw.js` | Caches `/api/workers` responses using stale-while-revalidate; network-only for auth-sensitive endpoints.

## UI → API Data Flow Trace
```
Find Workers page (SearchPage.jsx)
  ↓ renders
WorkerSearchResults.jsx
  ↓ maps workers → cards
WorkerCard.jsx (RouterLink to `/worker-profile/${id}`)
  ↓ React Router (config.jsx) routes to WorkerProfilePage
Layout.jsx <Outlet /> with Fade keyed by pathname
  ↓
WorkerProfilePage.jsx
  - useParams() extracts workerId
  - Scroll-to-top + <WorkerProfile key={workerId} />
  ↓
WorkerProfile.jsx
  - useParams() + Redux auth state
  - useEffect(() => fetchAllData(), [workerId])
  - fetchAllData() resets local state, calls workerService
  ↓
workerService.js
  - api.get(`/users/workers/${workerId}`)
  - Secondary calls: skills, portfolio, certificates, availability, stats, reviews, earnings
  ↓
API Gateway `/api/users/workers/:workerId`
  ↓ proxies to
User Service `/users/workers/:workerId`
  ↓ responds with { success, data: { worker } }
  ↓
WorkerProfile state updates → UI re-renders with new worker info
```

## Findings So Far
1. **Routing Basics Intact**: `/worker-profile/:workerId` is properly declared in `routes/config.jsx`, and `WorkerCard` uses the same path, so the URL updates legitimately.
2. **Component Remount Strategy**: `WorkerProfilePage.jsx` already passes `key={workerId}` to force a remount when params change. This should reset local state, yet the user still sees stale data, implying either the component is not receiving a new workerId or cached data is replayed.
3. **State Reset Pattern**: Inside `fetchAllData`, all local state setters run before the async request. However, the function is memoized with `useCallback([workerId])` and invoked inside `useEffect([workerId, fetchAllData, authUser])`. Any stale closure over `workerId` should be handled, but we need to confirm no parent component prevents re-render (e.g., Layout animation or Suspense fallback).
4. **Service Worker Caching**: `sw.js` treats `/api/workers` endpoints with a stale-while-revalidate strategy, meaning cached responses could be served instantly even after `workerId` changes. If multiple worker IDs share the same cache key (e.g., only `/api/workers` without the ID), the wrong payload might appear until network completes. Need to confirm cache keys honor the full URL.
5. **Navigation Handler Redundancy**: `WorkerCard` mixes `RouterLink` wrapping and manual `navigate` in `handleViewProfile`, which can emit duplicate navigation events. Not necessarily the root cause but worth simplifying after fixing remount behavior.

## Next Steps
1. **Verify Cache Keys**: Inspect service worker cache contents to ensure each `/api/users/workers/:id` request is keyed uniquely; adjust `CACHE_API_PATTERNS` if needed.
2. **Trace Layout Transition**: Confirm `<Layout>` and its `<Fade key={location.pathname}>` don’t preserve the old component instance by wrapping `<Outlet>` incorrectly.
3. **Add Diagnostics**: Temporarily log `workerId` at each layer (WorkerProfilePage, WorkerProfile, fetchAllData) to observe whether navigation triggers the expected re-run.
4. **Design Fix**: Depending on findings, force `WorkerProfile` to read `workerId` solely from props instead of `useParams`, or add `useEffect` watchers that explicitly reset state whenever `workerId` changes, even during transitional renders.

---
*Document owner: Investigation logged by Copilot (GPT-5.1-Codex Preview) on Nov 29, 2025 to satisfy the mandated dry-audit + data-flow documentation workflow prior to implementation.*

## Implementation Progress (Nov 30, 2025 – Deterministic Worker ID Resolution)
- ✅ **Prop-driven ID Source**: `WorkerProfile.jsx` now accepts an explicit `workerId` prop and derives a `resolvedWorkerId` that falls back to `useParams()` or the authenticated worker ID only when the prop is absent. Every fetch/bookmark/navigation handler now keys off this resolved value, eliminating stale closures that previously referenced an outdated param.
- ✅ **Page Wiring**: `WorkerProfilePage.jsx` forwards the `workerId` from `useParams()` to the component while keeping `key={workerId}` so React still remounts between profile transitions.
- 🔄 **Data Flow Adjustment**: The documented UI → API flow now guarantees that the ID selected on `WorkerCard` (or deep-linked URL) travels as a prop directly into `WorkerProfile`, triggering `fetchAllData(resolvedWorkerId)` without depending on Router context timing.
- 🧪 **Verification**: `cd kelmah-frontend && npm run lint` continues to fail for the pre-existing worker module lint debt (missing PropTypes/unused imports across JobSearchPage, MyApplicationsPage, etc.). No new errors were introduced by this fix; captured the failing command in the terminal transcript for traceability. Manual navigation testing still pending once the lint backlog is cleared.
- ⚠️ **Follow-ups**: Re-run browser navigation tests after the deterministic ID change deploys, then validate whether service worker caching needs further tweaks. Update this doc once end-to-end verification through the LocalTunnel gateway is complete.

## Debug Build (Nov 30, 2025 – Build 48a56042)
- 🔍 **Added Explicit Prop Dependency**: Modified useEffect to include `workerIdProp` in dependency array: `[workerIdProp, resolvedWorkerId, fetchAllData, authUser]`. This ensures the effect re-runs even if React's diffing doesn't detect the change through the memoized `fetchAllData` callback alone.
- 📊 **Console Logging Added**: Inserted debug output at component render to trace:
  ```javascript
  console.log('[WorkerProfile] Render:', {
    workerIdProp,
    routeParamWorkerId: routeParams?.workerId,
    resolvedWorkerId,
    timestamp: new Date().toISOString()
  });
  ```
- 🧪 **How to Verify**:
  1. Open the deployed app with DevTools console visible
  2. Navigate from Find Workers page to Worker A profile
  3. Look for `[WorkerProfile] Render:` log showing Worker A's ID
  4. Click another worker card to navigate to Worker B
  5. **Expected**: New console log with Worker B's ID and updated timestamp, profile content changes immediately
  6. **If broken**: Console will show whether the ID is updating or staying stale
- 📋 **Share Console Output**: If still not working, copy the console logs showing the IDs before and after navigation to identify where the data flow breaks.
