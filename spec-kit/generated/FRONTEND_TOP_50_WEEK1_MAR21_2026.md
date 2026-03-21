# Kelmah Frontend Top 50 Fixes for Week 1

Date: March 21, 2026
Source backlog: spec-kit/generated/FRONTEND_BACKLOG_1000_DELTA_MAR21_2026.md
Goal: collapse the highest-risk contract, reliability, accessibility, and test gaps into one executable week plan.

## How to Execute
- Complete items in order.
- Validate each endpoint through gateway paths only at /api/*.
- Enforce response envelope shape: success, data, error.
- For UI items, validate on mobile and desktop.

## Track A: API Contract Alignment (1-20)

1. Calendar contract map: document actual gateway-supported calendar/event routes and match frontend calls in kelmah-frontend/src/modules/calendar/services/eventsService.js.
2. Calendar fallback strategy: if service route is absent, route calendar calls through a supported jobs/scheduling endpoint adapter in the frontend service layer.
3. Calendar thunk envelope normalization: update kelmah-frontend/src/modules/calendar/services/calendarSlice.js to consume success/data/error safely.
4. Payment route inventory: cross-check all endpoints in kelmah-frontend/src/modules/payment/services/paymentService.js against gateway support.
5. Payment path unification: remove duplicate singular/plural divergences for escrow paths used across paymentService and hirerService.
6. Payment transaction history contract: normalize /payments/history versus /payments/transactions/history usage to one canonical route.
7. Payment payout contract: align admin payout endpoints in kelmah-frontend/src/modules/admin/services/adminService.js with supported gateway paths.
8. Payment status/verify contract: align quick-job payment verify calls in kelmah-frontend/src/modules/quickjobs/services/quickJobService.js.
9. Search endpoint unification: converge /search and /jobs/search usage in kelmah-frontend/src/modules/search/services/searchService.js.
10. Search suggestion contract hardening: enforce envelope checks for /search/suggestions and /search/popular in searchService.
11. Contract module path verification: verify /jobs/contracts endpoints used in kelmah-frontend/src/modules/contracts/services/contractService.js.
12. Contract milestone action validation: verify milestone approve/dispute paths in contractService before dispatch.
13. Worker base path consistency: resolve any divergence around /users/workers and /workers paths in workerService and environment config.
14. Worker search contract hardening: normalize worker search payload mapping in kelmah-frontend/src/modules/worker/services/workerService.js.
15. Profile media upload contract verification: validate kelmah-frontend/src/modules/common/services/fileUploadService.js path compatibility.
16. Quick job photo upload contract: validate /jobs/upload-photos in quickJobService or route through supported upload endpoint.
17. Map search/location contract: verify /jobs/search/location usage in kelmah-frontend/src/modules/map/services/mapService.js.
18. Notification deep-link contract coherence: ensure notification link builders map to real routes for contracts/payment.
19. Service endpoint source of truth: remove stale duplicate endpoint constants between kelmah-frontend/src/config/services.js and kelmah-frontend/src/config/environment.js.
20. Contract risk matrix artifact: add a route-by-route contract matrix to spec-kit/generated for frontend-to-gateway mapping.

## Track B: Error Envelope and UI Resilience (21-30)

21. Central response normalizer: add a shared response parser utility for success/data/error handling in API calls.
22. ApiClient interceptor envelope guard: enforce normalized errors in kelmah-frontend/src/services/apiClient.js.
23. Service-level parse adoption: adopt shared parser in paymentService, searchService, contractService, workerService, and eventsService.
24. Slice reject payload standards: ensure rejected thunks carry structured error objects rather than mixed strings/objects.
25. Empty-state standards: guarantee explicit empty states for jobs, contracts, messaging, and payment pages.
26. Retry affordances: add retry actions where failures are currently terminal in key list/detail pages.
27. No silent catch blocks: replace swallowed errors with user-visible recoverable messages.
28. Form submission failure UX: standardize field-level and form-level error display patterns across auth, payment, and quickjob.
29. Loading timeout handling: add slow-network timeout hints for long requests.
30. Error telemetry hook: centralize frontend capture of contract mismatch errors to speed backend fixes.

## Track C: Socket and Realtime Cohesion (31-36)

31. Socket ownership model: define single source of truth between kelmah-frontend/src/services/websocketService.js and hook-level wrappers.
32. Event name registry: create shared constants for message/job/payment notification events.
33. Duplicate listener cleanup: remove duplicated message listeners across messaging components and hooks.
34. Lifecycle coherence: enforce consistent connect/disconnect behavior on auth change and route transitions.
35. Reconnect backoff hardening: verify exponential backoff and cap behavior under offline/online flapping.
36. Realtime contract tests: add tests for event payload shape and duplicate-delivery prevention.

## Track D: Mobile/Desktop UX and Accessibility (37-44)

37. Touch-target pass: enforce minimum 44x44 interactive controls in high-use flows not yet covered.
38. Form readability pass: increase low-contrast labels/hints and simplify helper text language in critical forms.
39. Keyboard navigation pass: ensure icon-only actions are tabbable and have explicit labels.
40. Focus visibility pass: unify strong visible focus rings in global components.
41. Information hierarchy pass: improve section headings and spacing density for low-literacy readability.
42. Error clarity pass: rewrite ambiguous UI errors into plain language with next action.
43. Mobile layout stress test: validate key pages at narrow widths and high zoom settings.
44. Desktop density pass: reduce cramped action groups and improve clickable separation in data-heavy pages.

## Track E: Test Coverage Expansion (45-50)

45. Calendar service contract tests: add tests for eventsService success/failure envelope handling.
46. Payment service contract tests: add endpoint and envelope tests for core wallet, transaction, escrow, payout flows.
47. Search service contract tests: validate fallback behavior and mixed endpoint compatibility.
48. Contract service tests: cover list/detail/update/milestone/dispute path correctness.
49. ApiClient integration tests: add tests for normalized errors, auth refresh queue, and forced-logout edge cases.
50. Critical-path smoke suite: wire a gateway-backed smoke run for auth -> search -> quickjob upload -> contracts -> payment happy path.

## Week 1 Done Criteria
- All 50 items either completed or explicitly deferred with reason and owner.
- Gateway contract matrix published and linked from status log.
- Build passes after each batch.
- Minimum 20 new or updated frontend tests merged.
- No unresolved P0 contract mismatches on calendar, payment, search, worker, quickjob upload.
