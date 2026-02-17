# Comprehensive Frontend Dry Audit — Kelmah Platform

**Date**: July 2026  
**Scope**: Every file in `kelmah-frontend/src/` — config, constants, data, hooks, services, store, utils, components, pages, routes, styles, theme, and all 23 module directories  
**Method**: 8 parallel audit passes, each file read end-to-end  
**Total Findings**: ~360  

---

## Executive Summary

| Severity | Count | % |
|----------|-------|---|
| 🔴 **CRITICAL** | ~30 | 8% |
| 🟠 **HIGH** | ~80 | 22% |
| 🟡 **MEDIUM** | ~155 | 43% |
| 🟢 **LOW** | ~95 | 27% |
| **TOTAL** | **~360** | 100% |

### Top Cross-Cutting Themes

1. **Broken API wiring** (~40 findings): Service methods called that don't exist, wrong endpoint paths, mismatched payloads. Entire features silently fail.
2. **Mock data masquerading as real** (~25 findings): Functions return fake data instead of calling APIs. Users see success for operations that never reach the backend.
3. **Hardcoded dark-theme colors** (~30 findings): `#FFD700`, `rgba(255,255,255,...)`, `#D4AF37` used instead of `theme.palette`. Light mode is completely broken across dozens of components.
4. **Wrong currency symbol** (~15 findings): `$` used instead of `GH₵`/`GHS` throughout a Ghana-focused platform.
5. **Missing debounce/throttle** (~10 findings): API calls fire on every keystroke in search, filter, and preference inputs.
6. **Dead code & stubs** (~30 findings): Empty components, unused Redux slices, duplicate service files, console.log debugging statements.
7. **Security concerns** (~10 findings): Raw card data sent to API, hardcoded VAPID keys, exposed credentials in console.log, weak password validation.
8. **State management conflicts** (~8 findings): Dual Context + Redux for the same domain, function callbacks dispatched as plain payloads, direct state mutation.

---

## 🔴 CRITICAL FINDINGS (Must Fix — Broken Features / Data Loss / Security)

### C1. `secureStorage.clear()` key desync → silent data loss
**File**: [utils/secureStorage.js](kelmah-frontend/src/utils/secureStorage.js#L289)  
`clear()` removes the encryption secret from localStorage but does NOT regenerate `this.encryptionKey`. Subsequent `setItem()` writes with the old key; on reload a new key is generated → previously written data is **permanently unreadable**.  
**Fix**: Call `this.encryptionKey = this.generateEncryptionKey()` after clearing.

### C2. `useJobs.setJobs` dispatches function callback → corrupts Redux state
**File**: [modules/jobs/hooks/useJobs.js](kelmah-frontend/src/modules/jobs/hooks/useJobs.js#L25)  
`createJob` dispatches `setJobs((prev) => [...prev, newJob])` but `setJobs` is a plain reducer that does `state.jobs = action.payload`. The function object replaces the array. Same bug in `updateJob` and `deleteJob`.  
**Fix**: Use dedicated `addJob`/`removeJob` reducers, or read state with `getState()` before dispatching.

### C3. `searchJobs` call signature mismatch → always fails
**File**: [modules/jobs/hooks/useJobs.js](kelmah-frontend/src/modules/jobs/hooks/useJobs.js#L55)  
`useJobs.searchJobs(query, filters)` calls service with 2 args; service only accepts 1 `params` object.  
**Fix**: Merge into `jobService.searchJobs({ query, ...filters })`.

### C4. `usePayments` hook calls 7+ non-existent service methods
**File**: [modules/payment/hooks/usePayments.js](kelmah-frontend/src/modules/payment/hooks/usePayments.js)  
Calls `removePaymentMethod`, `getPaymentHistory`, `getWalletBalance`, `createPayment`, `createEscrowPayment`, `releaseEscrowPayment`, `getPaymentDetails` — **none exist** in `paymentService.js`. Every payment feature crashes.  
**Fix**: Align hook method names with actual service exports.

### C5. MoMo interface calls undefined service methods
**File**: [modules/payment/components/GhanaianMobileMoneyInterface.jsx](kelmah-frontend/src/modules/payment/components/GhanaianMobileMoneyInterface.jsx#L390)  
Calls `paymentService.initiateMobileMoneyPayment()` and `confirmMobileMoneyPayment()` — service has `initMomoPayment` and `checkMomoStatus` instead. Entire MoMo stepper is broken.  
**Fix**: Use correct method names.

### C6. SMS verification calls undefined service methods
**File**: [modules/payment/components/GhanaSMSVerification.jsx](kelmah-frontend/src/modules/payment/components/GhanaSMSVerification.jsx#L190)  
`sendSMSVerification()` and `verifySMSCode()` don't exist. Entire SMS flow is non-functional.  
**Fix**: Implement methods or wire to existing endpoints.

### C7. Raw card data sent to API without tokenization (PCI violation)
**File**: [modules/payment/pages/PaymentMethodsPage.jsx](kelmah-frontend/src/modules/payment/pages/PaymentMethodsPage.jsx#L420)  
Full card number, expiry, CVV sent plainly to backend. No Paystack tokenization.  
**Fix**: Use Paystack's client-side tokenization API.

### C8. Payment analytics calls undefined service methods
**File**: [modules/payment/components/PaymentAnalyticsDashboard.jsx](kelmah-frontend/src/modules/payment/components/PaymentAnalyticsDashboard.jsx#L120)  
`getPaymentAnalytics()` and `exportPaymentData()` don't exist. Analytics page never loads.  
**Fix**: Implement methods or build from `getTransactionHistory`.

### C9. `PaymentMethodCard` calls wrong context method
**File**: [modules/payment/components/PaymentMethodCard.jsx](kelmah-frontend/src/modules/payment/components/PaymentMethodCard.jsx#L65)  
Calls `removePaymentMethod` but context exposes `deletePaymentMethod`. Removing a card crashes.  
**Fix**: Use `deletePaymentMethod`.

### C10. `handleReply` in ReviewsPage is a fake setTimeout — never calls API
**File**: [modules/reviews/pages/ReviewsPage.jsx](kelmah-frontend/src/modules/reviews/pages/ReviewsPage.jsx#L680)  
Worker replies are simulated with `setTimeout(500)` — never persisted to backend.  
**Fix**: Call `reviewService.addWorkerResponse(reviewId, replyText)`.

### C11. Double date formatting → "Invalid Date ago"
**File**: [modules/reviews/pages/WorkerReviewsPage.jsx](kelmah-frontend/src/modules/reviews/pages/WorkerReviewsPage.jsx#L130) → [ReviewCard.jsx](kelmah-frontend/src/modules/reviews/components/common/ReviewCard.jsx#L55)  
Parent formats date to string "2 days ago", then card tries `new Date("2 days ago")` → `Invalid Date`.  
**Fix**: Pass raw timestamp; format only once inside ReviewCard.

### C12. `ContractForm.jsx` is empty stub — edit page shows blank
**File**: [modules/contracts/components/common/ContractForm.jsx](kelmah-frontend/src/modules/contracts/components/common/ContractForm.jsx)  
Renders only the text "ContractForm". `EditContractPage` imports and renders it → blank page.  
**Fix**: Implement the form or disable the edit route.

### C13. Direct state mutation in `ContractContext.approveMilestone`
**File**: [modules/contracts/contexts/ContractContext.jsx](kelmah-frontend/src/modules/contracts/contexts/ContractContext.jsx#L80)  
`c.milestones.find(m => m.id === milestoneId).status = 'paid'` mutates state directly. React won't re-render.  
**Fix**: Use immutable update pattern with `setContracts(prev => prev.map(...))`.

### C14. `useResponsive.js` — hooks inside `useMemo` (Rules of Hooks violation)
**File**: [hooks/useResponsive.js](kelmah-frontend/src/hooks/useResponsive.js)  
Calling hooks inside `useMemo` violates React's Rules of Hooks. Will cause unpredictable behavior.  
**Fix**: Move hook calls outside `useMemo`.

### C15. `useAuditNotifications.js` — `user.roles` vs `user.role` (TypeError crash)
**File**: [hooks/useAuditNotifications.js](kelmah-frontend/src/hooks/useAuditNotifications.js)  
Accesses `user.roles` but user object has `user.role` (singular). TypeError on mount.  
**Fix**: Use `user.role`.

### C16. `realTestUsers.js` — hardcoded password in source code
**File**: [data/realTestUsers.js](kelmah-frontend/src/data/realTestUsers.js)  
Real password exposed in committed source. Security vulnerability.  
**Fix**: Remove passwords from source; use environment variables for test credentials.

### C17. `securityConfig.js` — `process.env.NODE_ENV` in Vite (security flags always wrong)
**File**: [config/securityConfig.js](kelmah-frontend/src/config/securityConfig.js)  
Vite doesn't polyfill `process.env.NODE_ENV`. Security flags evaluate incorrectly.  
**Fix**: Use `import.meta.env.MODE` or `import.meta.env.PROD`.

### C18. `environment.js` — `buildEndpoint()` ignores serviceUrl parameter
**File**: [config/environment.js](kelmah-frontend/src/config/environment.js)  
The `serviceUrl` parameter is accepted but never used. All services resolve to the same base URL.  
**Fix**: Use `serviceUrl` in endpoint construction.

### C19. `useAuditNotifications.js` — overwrites `ws.onmessage`
**File**: [hooks/useAuditNotifications.js](kelmah-frontend/src/hooks/useAuditNotifications.js)  
Setting `ws.onmessage` directly overwrites any existing handler. Other WebSocket consumers lose messages.  
**Fix**: Use `ws.addEventListener('message', ...)` instead.

### C20. `ErrorBoundary.jsx` — crashes itself on null `errorInfo`
**File**: [components/common/ErrorBoundary.jsx](kelmah-frontend/src/components/common/ErrorBoundary.jsx#L72)  
`this.state.errorInfo.componentStack` throws when `errorInfo` is null (before `componentDidCatch` runs), causing the boundary itself to crash.  
**Fix**: Use `this.state.errorInfo?.componentStack`.

### C21. `PaymentMethodCard.jsx` — potential PCI violation (full card display)
**File**: [components/PaymentMethodCard.jsx](kelmah-frontend/src/components/PaymentMethodCard.jsx#L28)  
Displays `method.cardNumber` directly. If not pre-masked by API, this exposes full card numbers.  
**Fix**: Mask client-side: `` `•••• ${method.cardNumber.slice(-4)}` ``.

### C22. `ReviewSystem.jsx` — `review.hirerId.firstName[0]` crashes on null
**File**: [components/reviews/ReviewSystem.jsx](kelmah-frontend/src/components/reviews/ReviewSystem.jsx#L460)  
If `hirerId` is null (deleted user), accessing `.firstName` throws TypeError.  
**Fix**: `review.hirerId?.firstName?.[0] || '?'`.

### C23. `JobSystemTheme.js` — `spacing` as object breaks all `theme.spacing()` calls
**File**: [theme/JobSystemTheme.js](kelmah-frontend/src/theme/JobSystemTheme.js#L96)  
MUI expects `spacing` as a number or function, not an object. `theme.spacing(2)` returns `undefined`.  
**Fix**: Use `spacing: 8`.

### C24. Hirer service — `getApplications` returns `[]` (stubbed)
**File**: [modules/hirer/services/hirerService.js](kelmah-frontend/src/modules/hirer/services/hirerService.js)  
Returns empty array without API call. Application management shows no data.  
**Fix**: Implement actual API call.

### C25. Hirer service — `releaseMilestonePayment` returns mock data
**File**: [modules/hirer/services/hirerService.js](kelmah-frontend/src/modules/hirer/services/hirerService.js)  
Returns fake success. Users think payment released but nothing happens on backend.  
**Fix**: Implement actual API call to payment service.

### C26. Hirer service — `createWorkerReview` returns mock data
**File**: [modules/hirer/services/hirerService.js](kelmah-frontend/src/modules/hirer/services/hirerService.js)  
Returns `{ message: 'Review created (mock)' }`. Reviews never persisted.  
**Fix**: Implement actual API call to review service.

### C27. Hirer analytics — entire service is mock data
**File**: [modules/hirer/services/hirerAnalyticsService.js](kelmah-frontend/src/modules/hirer/services/hirerAnalyticsService.js)  
Every method silently falls back to random mock data. All analytics are fabricated.  
**Fix**: Implement real endpoints or label as "Coming Soon".

### C28. `deleteMessage` undefined in MessageList
**File**: [modules/messaging/components/common/MessageList.jsx](kelmah-frontend/src/modules/messaging/components/common/MessageList.jsx#L262)  
`deleteMessage` called but never imported/defined. Clicking "Delete" throws ReferenceError.  
**Fix**: Import from context or service.

### C29. Hardcoded VAPID key (placeholder) in pwaHelpers
**File**: [utils/pwaHelpers.js](kelmah-frontend/src/utils/pwaHelpers.js#L533)  
Comment says "Replace with your VAPID key". If placeholder, push subscriptions fail.  
**Fix**: Move to `import.meta.env.VITE_VAPID_PUBLIC_KEY`.

### C30. `SearchSuggestions.jsx` is a stub — search suggestions never shown
**File**: [modules/search/components/common/SearchSuggestions.jsx](kelmah-frontend/src/modules/search/components/common/SearchSuggestions.jsx)  
Props received but ignored. Renders only "SearchSuggestions" text.  
**Fix**: Implement the component.

---

## 🟠 HIGH FINDINGS (Significant Impact — Should Fix Soon)

### API Wiring & Data Flow

| # | File | Issue |
|---|------|-------|
| H1 | [apiClient.js](kelmah-frontend/src/services/apiClient.js#L80) | Concurrent 401 refresh race condition — multiple simultaneous 401s each trigger their own refresh, causing spurious logouts |
| H2 | [apiClient.js](kelmah-frontend/src/services/apiClient.js#L93) | Refresh token rotation silently dropped — new refresh token from server never saved |
| H3 | [websocketService.js](kelmah-frontend/src/services/websocketService.js) | `Date.now()` notification IDs collide within same millisecond — notifications overwrite each other |
| H4 | [websocketService.js](kelmah-frontend/src/services/websocketService.js#L231) | `data.content.substring(0,100)` crashes if content is null (attachment-only messages) |
| H5 | [workerSlice.js](kelmah-frontend/src/modules/worker/services/workerSlice.js#L245) | `updateWorkerAvailability` hits `/availability/${id}` — missing `/users/workers/` prefix → 404 |
| H6 | [certificateService.js](kelmah-frontend/src/modules/worker/services/certificateService.js#L16) | Routes through `/profile/` prefix not proxied by gateway → 404 |
| H7 | [milestoneService.js](kelmah-frontend/src/modules/contracts/services/milestoneService.js) | All methods hit `/milestones/` — no gateway proxy exists → every call 404s |
| H8 | [GhanaianMobileMoneyInterface.jsx](kelmah-frontend/src/modules/payment/components/GhanaianMobileMoneyInterface.jsx#L395) | Double `.data` access on responses — success checks read `undefined` |
| H9 | [GhanaSMSVerification.jsx](kelmah-frontend/src/modules/payment/components/GhanaSMSVerification.jsx#L400) | `networkInfo` variable used outside its defining function → ReferenceError |
| H10 | [EscrowManager.jsx](kelmah-frontend/src/modules/payment/components/EscrowManager.jsx#L55) | MoMo providers listed but handler only accepts Paystack/Stripe → error on MoMo selection |
| H11 | [ContractsPage.jsx](kelmah-frontend/src/modules/contracts/pages/ContractsPage.jsx#L80) | `filteredContracts` useMemo missing `contracts` dependency → stale list |
| H12 | [ContractsPage.jsx](kelmah-frontend/src/modules/contracts/pages/ContractsPage.jsx#L105) | Sort uses subtraction on date strings → `NaN` → undefined order |
| H13 | [ContractsPage.jsx](kelmah-frontend/src/modules/contracts/pages/ContractsPage.jsx#L95) | `contract.client.name` accessed without null guard → TypeError |
| H14 | [MessageSearch.jsx](kelmah-frontend/src/modules/messaging/components/common/MessageSearch.jsx) | Wrong import path resolves outside module → build error |

### Security

| # | File | Issue |
|---|------|-------|
| H15 | [secureStorage.js](kelmah-frontend/src/utils/secureStorage.js#L93) | Encryption key derived from deprecated/volatile browser properties (`navigator.platform`, screen size, timezone). Changes silently corrupt all stored data |
| H16 | [secureStorage.js](kelmah-frontend/src/utils/secureStorage.js#L239) | `setItem` non-atomic read-modify-write — concurrent calls can lose data |
| H17 | [EscrowManager.jsx](kelmah-frontend/src/modules/payment/components/EscrowManager.jsx#L85) | Client-generated escrow reference — predictable and spoofable |
| H18 | [dashboardService.js](kelmah-frontend/src/modules/dashboard/services/dashboardService.js) | Unsafe JWT decode with `atob()` — no try/catch, no URL-safe base64 handling |
| H19 | [pwaHelpers.js](kelmah-frontend/src/utils/pwaHelpers.js#L349) | Top-level `window.addEventListener` crashes in non-browser/test contexts |

### Performance

| # | File | Issue |
|---|------|-------|
| H20 | [serviceWarmUp.js](kelmah-frontend/src/utils/serviceWarmUp.js#L72) | Unbounded recursive warm-up — infinite retry requests every 10s if services never become healthy |
| H21 | [prefetchLazyIcons.js](kelmah-frontend/src/utils/prefetchLazyIcons.js#L42) | Relies on React internals (`_payload`, `_init`) that change across versions |
| H22 | [useApiHealth.js](kelmah-frontend/src/hooks/useApiHealth.js) | Infinite re-render loop |
| H23 | [useServiceStatus.js](kelmah-frontend/src/hooks/useServiceStatus.js) | Infinite loop |
| H24 | [MessagingPage.jsx](kelmah-frontend/src/modules/messaging/pages/MessagingPage.jsx) | Inner components (`EnhancedConversationList`, `EnhancedChatArea`) recreated every render — all state destroyed |
| H25 | [WorkerSearch.jsx](kelmah-frontend/src/modules/hirer/components/WorkerSearch.jsx) | API call fires on every keystroke — no debounce |
| H26 | [ApplicationManagementPage.jsx](kelmah-frontend/src/modules/hirer/pages/ApplicationManagementPage.jsx) | All job applications re-fetched on every tab change |
| H27 | [InteractiveMap.jsx](kelmah-frontend/src/modules/map/components/common/InteractiveMap.jsx#L80) | Inline `<style>` injected per marker — hundreds of duplicate style blocks |
| H28 | [mapService.js](kelmah-frontend/src/modules/map/services/mapService.js#L20) | Location cache never cleared — unbounded memory growth |
| H29 | [ProfilePage.jsx](kelmah-frontend/src/modules/profile/pages/ProfilePage.jsx#L480) | Preferences `onChange` fires API call on every keystroke (no debounce) |

### UI/UX & Display Bugs

| # | File | Issue |
|---|------|-------|
| H30 | [BreadcrumbNavigation.jsx](kelmah-frontend/src/components/common/BreadcrumbNavigation.jsx) | Hardcoded dark-theme colors — invisible on light backgrounds |
| H31 | [SmartNavigation.jsx](kelmah-frontend/src/components/common/SmartNavigation.jsx#L32) | Default vs named `secureStorage` import mismatch — may resolve to `undefined` |
| H32 | [InteractiveChart.jsx](kelmah-frontend/src/components/common/InteractiveChart.jsx#L99) | `component={motion.path}` not supported by Recharts — animations silently fail |
| H33 | [ReviewSystem.jsx](kelmah-frontend/src/components/reviews/ReviewSystem.jsx#L508) | `review.pros.length` crashes when `pros`/`cons` are null |
| H34 | [ReviewSystem.jsx](kelmah-frontend/src/components/reviews/ReviewSystem.jsx#L618) | `voteHelpful` fires API but never updates local state — vote count never changes visually |
| H35 | [ReviewSystem.jsx](kelmah-frontend/src/components/reviews/ReviewSystem.jsx#L638) | `responseDialogOpen` set to true but no Dialog component exists for worker responses |
| H36 | [styles/theme.js](kelmah-frontend/src/styles/theme.js) | Competing theme with inverted colors — components importing this get wrong styling |
| H37 | [styles/calendar.css](kelmah-frontend/src/styles/calendar.css#L3) | CSS variables `var(--primary-main)` not set by MUI → calendar unstyled |
| H38 | [theme/index.js](kelmah-frontend/src/theme/index.js#L79) | Breakpoint `md: 960` differs from MUI default `md: 900` — layouts fire 60px late |
| H39 | [Header.jsx](kelmah-frontend/src/modules/layout/components/Header.jsx#L740) | Messages badge shows notification count instead of actual unread messages |
| H40 | [handleNewJob dispatch](kelmah-frontend/src/modules/dashboard/hooks/useDashboard.js#L58) | Dispatches function callback to object reducer — silently replaces state with function reference |
| H41 | [JobResultsSection.jsx](kelmah-frontend/src/modules/jobs/components/JobResultsSection.jsx#L195) | Bookmark button is `console.log` stub — visible but non-functional |
| H42 | [JobResultsSection.jsx](kelmah-frontend/src/modules/jobs/components/JobResultsSection.jsx#L885) | "Load More" button is `console.log` stub |
| H43 | [JobResultsSection.jsx](kelmah-frontend/src/modules/jobs/components/JobResultsSection.jsx#L880) | Hardcoded "12 total opportunities" regardless of actual count |
| H44 | [ReviewsPage.jsx](kelmah-frontend/src/modules/reviews/pages/ReviewsPage.jsx#L720) | `handleHelpfulVote` toggles locally but never calls API — votes lost on refresh |
| H45 | [ReviewsPage.jsx](kelmah-frontend/src/modules/reviews/pages/ReviewsPage.jsx#L210) | Refresh button calls `window.location.reload()` — destroys React state |
| H46 | [SavedSearches.jsx](kelmah-frontend/src/modules/search/components/SavedSearches.jsx#L80) | `user.id` null dereference crash |
| H47 | [SearchResults.jsx](kelmah-frontend/src/modules/search/components/results/SearchResults.jsx#L100) | Full page reload via `window.location.href` + wrong `$` currency |
| H48 | [SearchPage.jsx](kelmah-frontend/src/modules/search/pages/SearchPage.jsx#L200) | Workers see no content — conditional rendering only handles hirers |
| H49 | [PayoutQueuePage.jsx](kelmah-frontend/src/modules/admin/pages/PayoutQueuePage.jsx) | Raw HTML instead of MUI — completely inconsistent with app |
| H50 | [calendarSlice.js](kelmah-frontend/src/modules/calendar/services/calendarSlice.js#L8) | `new Date()` in Redux state — non-serializable, breaks DevTools |
| H51 | [workerService.js](kelmah-frontend/src/modules/worker/services/workerService.js#L280) | Retry catch block hits same endpoint as try block — always fails again |
| H52 | [useJobsQuery.js](kelmah-frontend/src/modules/jobs/hooks/useJobsQuery.js#L30) | Deprecated React Query options (`cacheTime`, `keepPreviousData`) — will break on upgrade |
| H53 | [jobSlice.js](kelmah-frontend/src/modules/jobs/services/jobSlice.js#L95) | `createJob.fulfilled` inserts raw data bypassing `transformJobListItem()` |
| H54 | [MessageAttachments.jsx](kelmah-frontend/src/modules/messaging/components/common/MessageAttachments.jsx) | Blob URLs created on every render, never revoked → memory leak |
| H55 | [MessagingPage.jsx](kelmah-frontend/src/modules/messaging/pages/MessagingPage.jsx#L160) | `setMessages` called but not exposed by context → runtime error |

---

## 🟡 MEDIUM FINDINGS (Should Fix — Quality / Maintainability / Minor Bugs)

### State Management Conflicts
- Dual Context + Redux in contracts module (ContractContext ↔ contractSlice)
- Dual Context + Redux in notifications module (NotificationContext ↔ notificationSlice)
- `serializableCheck: false` in Redux store hides bugs
- `verifyAuth` creates synthetic user on API failure → stale "logged in" state

### Missing Validation & Error Handling
- `formatRelativeTime` crashes on invalid dates → "NaN years ago"
- `formatRating` throws `RangeError` on negative/out-of-range values 
- Password validation only checks length ≥ 8 (no complexity rules)
- No input validation on payment method form fields (card number, CVV, expiry)
- `settingsService` methods lack try-catch

### Dead Code & Duplication  
- 6+ duplicate job list/search components in jobs module
- Duplicate `hirerService.js` in dashboard + hirer modules
- Duplicate `portfolioApi.js` and `portfolioService.js` in worker module
- `ReviewList.jsx` (reviews module) renders only "ReviewList" text
- `reviewsSlice.js` Redux slice never dispatched or selected
- `SimplifiedHero.jsx` never imported
- Empty `auth/contexts/` directory
- `DEMO_PAYMENT_METHODS` array never referenced
- Multiple unused styled components in MessageList
- `EmojiButton` import never used
- Numerous `console.log` statements across ~15 files

### Wrong Currency Symbol ($)
- EscrowDetails, TransactionHistory, WalletSummary, PaymentContext
- ContractDetailsPage, CreateContractPage, ContractCard
- WorkerFilter, JobFilters, SearchResults
- MapSearchOverlay price slider
- PremiumPage confirmation dialog

### Hardcoded Dark Theme Colors (~30 occurrences)
- Auth components (Login, Register, MobileRegister)
- Dashboard, Sidebar, MessagingPage
- ReviewsPage, ReviewSystem
- SearchPage components (CollapsibleHero, CompactSearchBar, MobileFilterDrawer)
- InteractiveChart, BreadcrumbNavigation, SmartNavigation
- WorkerSearchPage subtitle

### Performance Concerns
- `register.jsx` uses `watch()` causing full 1,234-line form re-renders on every keystroke
- `secureStorage.getItem` decrypts entire storage blob for every read
- LazyWithRetry storage key collisions after minification
- `warmUpServices` + `waitForServices` can produce exponential request growth
- `smartNavigation` `suggestions` recalculated every render (no useMemo)
- Tab label `.filter()` called 5x per render in JobManagementPage
- `WorkerSearch` fires API + bookmarks on every state change (no debounce)
- `MapSearchOverlay.jsx` is 2,404 lines in a single file
- `Header.jsx` is 1,624 lines monolithic component

### Incomplete Features
- EmojiPicker search returns all emojis regardless of query
- Empty emoji `categories` array
- Quick filter chips in HeroFiltersSection have no onClick handlers
- Voice recording in QuickJobRequestPage toggles state but captures no audio
- Photo uploads use blob URLs as permanent URLs (unresolvable by server)
- "New Chat" dialog has no user-search functionality
- `enableEncryption` toggle in ConversationList has no effect
- `getContractTemplates` always returns empty array
- Admin FraudDetection, NotificationCenter, ReportManagement are stubs
- Admin DisputeManagement, PaymentOverview, SystemSettings use mock data
- PremiumPage upgrade flow uses `setTimeout` simulation

### API & Routing Issues
- `pwaHelpers.js` `sendSubscriptionToServer` uses raw `fetch` bypassing apiClient
- `websocketService.js` unused `API_ENDPOINTS` import
- `JobApplication.jsx` uploads to non-existent `/uploads` endpoint
- `JobDetails.jsx` uses snake_case `created_at` but API returns camelCase `createdAt`
- `searchService.js` has duplicated API functions (`getSuggestions` vs `getSearchSuggestions`)
- `JobSearch.jsx` fires API on every filter keystroke (no debounce)
- `AdvancedFilters.jsx` fires `onFiltersChange` on every interaction (no debounce)
- `LoginRegister` social login feature-flag mismatch (wrong flag used)
- `scheduleAppointment` calls hit wrong endpoint
- `earningsService.js` returns raw `response.data` inconsistent with other services
- `locationSelector.jsx` handleBlur uses fragile setTimeout(150ms)
- Admin `ReviewModerationQueue` uses raw `fetch` instead of api client

### Other Notable Items
- `process.env.REACT_APP_*` mixed with `import.meta.env.VITE_*` in apiUtils
- `Register.jsx` renders literal `&apos;` HTML entities in JSX text
- `COMMON_TRADES` duplicated in 3 places (divergent)
- `PROFESSIONS` lists in jobs module are tech-oriented instead of vocational trades
- `SavedJobs.jsx` uses `<Button href>` instead of React Router Link (full page reload)
- `IndexedDB` handle never closed in pwaHelpers
- Auth module double token storage (authService + authSlice both persist)
- `ProfilePicture.jsx` cleanup checks for `blob:` URLs but creates `data:` URIs
- `useProfile.js` singleton promise never re-fires after unmount/remount
- `calendarSlice.js` `new Date()` in Redux initial state
- `NotificationsPage` shadows reusable `NotificationItem` with local definition
- `SchedulingPage` map view centered at `[0, 0]` (ocean) instead of Ghana

---

## 🟢 LOW FINDINGS (Minor — Clean Up When Convenient)

- `console.log` in polyfills.js, main.jsx, App.jsx shipped to production
- `defaultProps` deprecated pattern in ~5 components
- `onKeyPress` deprecated event in ~3 components
- Missing `PropTypes` in several components
- Redundant dedup cleanup in apiClient
- Stale message queue replayed regardless of age
- `formatRelativeTime` shows "1 minutes ago" (missing singular)
- `formatFileSize` produces "NaN undefined" for negative bytes
- Various unused imports across files
- `dismissUpdate` declared but never exported in pwaHelpers
- Legacy `ngrok-skip-browser-warning` header still in serviceHealthCheck
- Thin re-export wrappers adding unnecessary indirection
- `hasPermission` doesn't normalize case (unlike `hasRole`)
- `_raw` circular reference hazard in `normalizeUser`
- `willChange: 'transform'` applied unconditionally in DepthContainer
- `index` used as React key instead of stable identifiers
- Various hardcoded contact info and placeholder social links in Footer
- Empty `ParticleConfigs` stubs that crash if accessed
- Notification type labels need title-casing
- `TempSchedulingPage.jsx` unnecessary wrapper re-export

---

## Priority Fix Order (Recommended)

### Phase 1: Critical Wiring & Security (Blocks Core Features)
1. Payment module API wiring (C4–C9) — MoMo, cards, analytics all broken
2. `useJobs` Redux bugs (C2, C3) — job CRUD silently fails
3. `secureStorage` key desync (C1) + volatile fingerprint (H15) — data loss risk
4. PCI compliance: card tokenization (C7, C21)
5. Review system fake operations (C10, C11, H44, H45)
6. Contract state mutation + form stub (C12, C13)
7. Hirer mock services (C24–C27) — payments, reviews, analytics all fake
8. ErrorBoundary self-crash fix (C20)

### Phase 2: High-Impact UX & Performance
9. Fix infinite loops (H22, H23, H20)
10. Fix messaging page inner component recreation (H24)
11. Add debounce to search/filter inputs (H25, H29, multiple MEDIUM)
12. Fix Header messages badge (H39)
13. Fix theme conflicts (H36, H37, H38, C23)
14. Implement stub components (C30, C12, C28 + stubs)
15. Replace `window.location.href` with React Router navigate (~8 occurrences)

### Phase 3: Quality & Consistency
16. Standardize currency to GH₵ across platform (~15 files)
17. Replace hardcoded colors with theme tokens (~30 files)
18. Remove `console.log` statements (~20 files)
19. Consolidate duplicate services and components
20. Remove dead code, empty stubs, unused imports
21. Fix `defaultProps` deprecation warnings
22. Add proper error handling to services missing try-catch

---

*This audit covers the complete `kelmah-frontend/src/` directory. Each finding was identified by reading the actual source code end-to-end. Backend service availability was not tested in this pass — only frontend code quality, wiring correctness, and feature completeness.*
