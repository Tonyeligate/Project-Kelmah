# Proposal Review Data Flow – November 2025

## Component Chain
- **UI Component:** `kelmah-frontend/src/modules/hirer/components/ProposalReview.jsx`
- **Service Layer:** `kelmah-frontend/src/modules/common/services/axios.js` (`jobServiceClient` proxy)
- **Backend Route:** `kelmah-backend/services/job-service/routes/job.routes.js` → `router.get('/proposals', authorizeRoles('hirer'), jobController.getHirerProposals)`
- **Controller:** `kelmah-backend/services/job-service/controllers/job.controller.js` → `getHirerProposals`

## Flow Map
```
Hirer opens Proposals tab
  ↓
ProposalReview.jsx `useEffect` → fetchProposals({ status, page })
  ↓
jobServiceClient.get('/jobs/proposals', { params })
  ↓
API Gateway proxy → Job Service `/api/jobs/proposals`
  ↓
job.controller.getHirerProposals → Mongo aggregations (Applications, Jobs)
  ↓
Response: { success, data: { items, pagination, aggregates } }
  ↓
ProposalReview state updates (proposals, meta, lastUpdated, cache)
  ↓
UI renders stats cards, table rows, pagination summary
```

### Action Flow (Accept/Reject)
```
Hirer selects menu action → handleDialogOpen('accept'|'reject')
  ↓
Dialog confirm → handleProposalAction(status, payload)
  ↓
jobServiceClient.patch(`/jobs/proposals/${proposalId}`, { status, feedback? })
  ↓
(API Gateway expects PATCH /api/jobs/proposals/:proposalId)
  ↓
❗ Current job service lacks matching PATCH route → request will 404
```

## State Handling
- **Loading:** `loading` true + skeleton rows; `isRefreshing` renders `LinearProgress`. AbortController + timeout (15s) guard each request.
- **Success:** Proposals cached (`Map` keyed by `status:page`) with 60s TTL; aggregates feed stat cards; pagination summary shows `Showing X-Y of Z`.
- **Empty:** `renderEmptyState()` card with retry CTA when proposals array empty and not loading.
- **Error/Timeout:** `Alert` banner surfaces fetch failures; timeout sets `hasTimedOut` and aborts request; retry button re-issues fetch with `useCache: false`.
- **Actions:** Accept/reject dialogs respect `actionInProgress`; after successful action, component refetches proposals bypassing cache.

## Issues & Risks
1. **Missing PATCH backend route:** Frontend calls `PATCH /api/jobs/proposals/:proposalId`, but `job.routes.js` exposes only `GET /proposals`. Need corresponding controller (e.g., `updateProposalStatus`) to transition applications without hardcoding job id.
2. **Proposal identifier variance:** Component normalizes `proposal.id | _id | proposalId | proposalID`; ensure backend response always returns `_id` to avoid fallback reliance.
3. **Aggregates fallback:** When gateway strips `meta`, component derives totals from `proposals.length`. Verify backend always returns `{ meta: { aggregates, pagination } }` to keep stats accurate.

## Verification Plan
1. `curl -H "Authorization: Bearer <token>" "${TUNNEL}/api/jobs/proposals?page=1&limit=10"` → expect `{ success: true, data: { items: [], meta: { aggregates } } }`.
2. Implement/verify `PATCH /api/jobs/proposals/:proposalId` (once backend route exists); until then, expect 404 on action dialog confirm.
3. `npm --prefix kelmah-frontend run build` after component changes to ensure bundler compatibility.
4. Smoke test Proposal tab via LocalTunnel; confirm loading skeleton, refresh button, stats cards, pagination summary, and dialog flows.

## References
- Frontend axios proxy normalization ensures `/api` duplication is avoided when gateway base URL already includes prefix.
- Abort logic clears `timeoutRef` + `AbortController`; cache invalidated when status filter changes.
