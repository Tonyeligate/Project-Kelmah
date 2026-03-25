# Kelmah Frontend Purpose-Driven Retry Addendum

**Date**: March 19, 2026

**Purpose**: Capture the concrete issues surfaced by the retry scan so they can be turned into targeted fixes instead of another generic mega backlog.

## Concrete Findings
1. Footer social links still point to `#`, which creates dead external actions and weak trust on mobile and desktop. See [Footer.jsx](../../kelmah-frontend/src/modules/layout/components/Footer.jsx).
2. The service worker still logs at load time, which is noisy and should be gated or removed in production. See [sw.js](../../kelmah-frontend/public/sw.js).
3. The API health utility uses `console.log` in development and contains a retry loop that should be reviewed for user-facing clarity. See [apiUtils.js](../../kelmah-frontend/src/modules/common/utils/apiUtils.js).
4. The hirer analytics service still generates mock dashboard data with `Math.random`, which can make the product appear truthful when it is actually falling back. See [hirerAnalyticsService.js](../../kelmah-frontend/src/modules/hirer/services/hirerAnalyticsService.js).
5. The auth client still redirects with `window.location.replace('/login')`, which can drop in-progress state and bypass SPA routing. See [apiClient.js](../../kelmah-frontend/src/services/apiClient.js).
6. The secure storage layer still creates IDs with `Math.random`, which is weaker than a crypto-grade source for session identifiers. See [secureStorage.js](../../kelmah-frontend/src/utils/secureStorage.js).
7. Jobs and reviews still contain explicit "coming soon" surfaces that should either be hidden or replaced with real actions. See [JobsPage.jsx](../../kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx) and [ReviewsPage.jsx](../../kelmah-frontend/src/modules/reviews/pages/ReviewsPage.jsx).
8. The premium page still tells users subscriptions are coming soon, which is a product placeholder rather than a finished flow. See [PremiumPage.jsx](../../kelmah-frontend/src/modules/premium/pages/PremiumPage.jsx).
9. Mock worker data still exists in fallback docs and temp files, which can mislead audits if it is treated as a real product surface. See [mockWorkersApi.js](../Kelmaholddocs/temp-files/mockWorkersApi.js).
10. Several discovery and profile surfaces already have placeholder-rich inputs, but they are not consistently connected into a single saved-search and demand-intelligence flow. See [SavedSearches.jsx](../../kelmah-frontend/src/modules/search/components/SavedSearches.jsx) and [WorkerProfile.jsx](../../kelmah-frontend/src/modules/worker/components/WorkerProfile.jsx).

## High-Value Fix Themes
1. Replace dead links with real destinations or disabled states.
2. Remove or gate mock analytics and mock fallback UI in production.
3. Keep SPA navigation inside the router instead of raw browser redirects.
4. Replace weak random ID generation with crypto-safe utilities.
5. Hide or complete all "coming soon" UI rather than leaving it in user paths.
6. Turn saved search and demand signals into a shared discovery system.

## Priority Order
1. Footer trust cleanup.
2. Auth redirect and session hygiene.
3. Analytics honesty cleanup.
4. Mock and placeholder removal.
5. Search and demand flow unification.

## Why This Retry Exists
- The earlier backlog was too broad to be useful for implementation.
- These findings are directly tied to the code surface and can be turned into tickets immediately.
- They also map better to Kelmah's purpose: trust, discovery, and low-friction conversion.