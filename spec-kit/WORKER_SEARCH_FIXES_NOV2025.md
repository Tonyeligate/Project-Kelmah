# Worker Search Fixes – November 7, 2025

## Overview
User regression tests identified that the public worker discovery flow (`/search`) still exhibited seven critical failures despite earlier hirer-dashboard fixes:

1. Trade filter ignored – electricians query returned carpenters/roofers.
2. Keyword search stuck showing unrelated trades.
3. "View Profile" navigated to `/`, not the worker profile.
4. Sort dropdown reset all filters and navigated away.
5. Location filter ignored city selection.
6. "Clear filters" button redirected to home.
7. Sporadic "No workers found" states when filters were applied.

## Root Causes
- `SearchPage.jsx` still issued legacy parameters (`workNeeded`, `where`, `type`) that the consolidated MongoDB worker endpoint no longer understands.
- No normalization of worker payloads for `WorkerCard` – inconsistent fields prevented deterministic sort/rating display.
- Sort handling depended on `sortOrder` state but never persisted `sort` in `searchParams`, so URL updates cleared context.
- Filter chips could not pass their values back to the remover, making state clean-up brittle.
- `WorkerCard.jsx` continued to point at `/workers/:id`, falling afoul of the catch-all redirect to `/` because no such route existed.
- Desktop `JobSearchForm` still emitted `onSubmit`, but SearchPage provided `onSearch`, so the "Find Work" button and trade dropdown never triggered a request (hence no URL params).
- URL sync always rewrote location to JSON and navigated to `/search`, producing route hops and unreadable query parameters on `/find-talents`.
- Clear-all filters lived only inside the empty state, so QA couldn’t easily reset the view while results existed.

## Fix Summary
- Added helper utilities in `SearchPage.jsx`:
  - `buildWorkerQueryParams` aligns all filters with backend expectations (`keywords`, `city`, `primaryTrade`, `workType`, `rating`, `maxRate`, `availability`).
  - `normalizeWorkerRecord` + `sortWorkerResults` ensure consistent data and client-side sorting for rating/price/newest.
- Centralised search execution so pagination, sorting, and clear operations reuse the same normalized worker list.
- Persisted `sort` inside `searchParams`, updated URL sync to accept explicit overrides, and reset to `relevance` during full clears.
- Enhanced `WorkerSearchResults` active filter chips to surface trade/location/rating and forward values for precise removal.
- Corrected `WorkerCard` navigation to the new public route `/worker-profile/:workerId` (fixing Issue #3 redirect loop).
- JobSearchForm now normalizes `onSearch`/`initialFilters`, syncing UI state with URL params so desktop submissions invoke `handleSearch` correctly.
- `updateSearchURL` keeps visitors on `/find-talents` and preserves human-readable query parameters (`?trade=Plumbing&location=Accra`).
- Added a route guard so URL sync skips navigation once the user moves to `/worker-profile/:workerId`, preventing the search page from hijacking profile views.
- Trade and type dropdowns, skill chips, and text-field blurs auto-call the search handler so filter selections immediately push URL state even before pressing “Find Work.”
- Active filters section now exposes a persistent “Clear all filters” button for quick resets.
- Backend worker query now maps UI trades to stored synonyms (e.g., `Plumbing` → `Plumbing Services`, `Electrical Work` → `Licensed Electrician`) and searches `specializations`, `profession`, and worker profile categories with case-insensitive regex.

## Data Flow Trace
```
SearchPage.jsx (handleSearch / handleSortChange)
  → buildWorkerQueryParams(params)
    → axios.get('/workers', { params: alignedQuery })
      → API Gateway `/api/workers` → User Service `WorkerController.getAllWorkers`
        → Mongo query (role=worker) with filters (city, primaryTrade, workType, rating, maxRate, skills)
      ← results { workers, pagination }
    → normalizeWorkerRecord[] → sortWorkerResults (relevance/rating/price/newest)
  → setSearchResults(sortedWorkers)
  → WorkerSearchResults renders cards + filter chips
      → WorkerCard handleViewProfile → `/worker-profile/:workerId`
```

## Verification
- `npm run build` ✅ (Vite 5.4.19)
- `curl https://kelmah-api-gateway-qlyk.onrender.com/api/workers?primaryTrade=Electrical%20Work` returns only electricians via Render gateway.
- Manual browser assertions pending once Vercel redeploys.

## Follow-Up
- Distance-based sorting still placeholder (no geo data). Consider enriching worker payload with coordinates for proximity ranking.
- Monitor Vercel deployment logs for any remaining `/search` redirects or chip-removal regressions.
