# Kelmah Frontend – Page + Security Audit

## Iteration Update (Feb 14, 2026 – Job Notification Action-Link Consistency) ✅

- **Scope**:
  - `kelmah-frontend/src/modules/notifications/services/notificationService.js`
  - `kelmah-frontend/src/modules/notifications/contexts/NotificationContext.jsx`
  - `kelmah-frontend/src/routes/config.jsx` (job-route compatibility confirmation)
- **Data-flow audit (notification payload → link normalization → navigation target)**:
  - Notifications render links via normalized `notification.link` in notifications UI.
  - Backend payloads may carry `actionUrl` variants or only `relatedEntity` metadata for job notifications.
  - Normalization now aligns job notification links with active route surface (`/jobs`, `/jobs/:id`).
- **Root cause**:
  - Job notification types (`job_application`, `job_offer`) had no route fallback when `actionUrl` was missing.
  - Legacy/variant job paths (`/job/:id`, `/jobs/:id/applications`) were not canonicalized.
- **Fixes implemented**:
  - Added canonical mapping:
    - `/job/:id` → `/jobs/:id`
    - `/jobs/:id/applications` → `/jobs/:id`
  - Added entity-based fallback (`relatedEntity.type === 'job'`) to `/jobs/:id`.
  - Added type fallback (`job_application`/`job_offer`) to `/jobs`.
  - Applied same logic in service and context normalizers to keep REST and realtime behavior consistent.
- **Verification**:
  - VS Code diagnostics: no errors in changed files.
  - Frontend production build passed (`npm run build`, `built in 6m 43s`).

## Iteration Update (Feb 14, 2026 – Contracts/Payments Deep-Link ID Hardening) ✅

- **Scope**:
  - `kelmah-frontend/src/modules/notifications/services/notificationService.js`
  - `kelmah-frontend/src/modules/notifications/contexts/NotificationContext.jsx`
  - `kelmah-frontend/src/routes/config.jsx` (route compatibility confirmation)
- **Data-flow audit (notification payload → link normalization → route target)**:
  - Backend notifications can include `relatedEntity.id` as primitive id or object-like ref payload.
  - Notification normalization now resolves entity IDs safely before contract/payment path construction.
  - UI navigation remains through `notification.link`, now guaranteed to avoid malformed object-string paths.
- **Root cause**:
  - Link normalization assumed primitive `relatedEntity.id`, risking malformed deep links when id payload shape varied.
- **Fixes implemented**:
  - Added resilient entity-id extraction from primitive and nested object forms (`_id`/`id`) in both REST and realtime normalization paths.
  - Kept previous route mapping logic intact for contracts (`/contracts/:id`) and payment/escrow destinations.
- **Verification**:
  - VS Code diagnostics: no errors in changed files.
  - Frontend production build passed (`npx vite build`, `built in 3m 1s`).
  - Remote notification endpoint check was rate-limited (`429`) in this run.

## Iteration Update (Feb 13, 2026 – Notification Link Routing Consistency) ✅

- **Scope**:
  - `kelmah-frontend/src/modules/notifications/services/notificationService.js`
  - `kelmah-frontend/src/modules/notifications/contexts/NotificationContext.jsx`
  - `kelmah-frontend/src/routes/config.jsx` (route compatibility audit)
- **Data-flow audit (backend payload → frontend normalization → route navigation)**:
  - Messaging/payment services persist notifications with optional `actionUrl` + `relatedEntity` metadata.
  - Frontend notifications service/context normalize payloads before rendering in notifications pages.
  - Notification cards navigate via `notification.link` in `NotificationsPage`.
  - Link-normalization now translates backend path variants into valid frontend route targets.
- **Root cause**:
  - Backend message notification links used `/messages/:conversationId`, but frontend route surface expects `/messages?conversation=...` (single page with query-based selection).
  - Some payment/contract notification payloads can lack direct link and need deterministic route inference.
- **Fixes implemented**:
  - Added route-aware `normalizeNotificationLink` for both REST and realtime notification normalization paths.
  - Added mapping for message links and fallback route inference for contract/payment notification categories.
  - Kept absolute external URLs unchanged.
- **Verification**:
  - VS Code diagnostics: no errors in modified files.
  - Remote notifications endpoints healthy (authenticated `200` responses for list/preferences/unread count).
  - Local build command remains blocked by environment storage limit (`ENOSPC`).

## Iteration Update (Feb 13, 2026 – Notifications Context + Realtime Payload Consistency) ✅

- **Scope**:
  - `kelmah-frontend/src/modules/notifications/contexts/NotificationContext.jsx`
  - `kelmah-frontend/src/modules/notifications/services/notificationService.js`
  - `kelmah-frontend/src/modules/notifications/components/NotificationItem.jsx` (consumer compatibility validation)
- **Data-flow audit (UI → context → service/socket → backend)**:
  - `NotificationsPage` and notification components consume actions/state from `NotificationContext`.
  - Context fetches via REST (`notificationService.getNotifications`) and subscribes realtime via socket callback (`notificationService.onNotification`).
  - Incoming realtime payloads are now normalized to same UI contract as REST list payloads before state merge.
  - Action handlers (`markAsRead`, `markAllAsRead`, `deleteNotification`) now map cleanly to backend routes (`PATCH /notifications/:id/read`, `PATCH /notifications/read/all`, `DELETE /notifications/:id`).
- **Root cause**:
  - Context value/action surface drift (`deleteNotification` missing) broke component expectations.
  - Realtime payload normalization drift from REST shape risked inconsistent rendering for live notifications.
- **Fixes implemented**:
  - Added provider-level `deleteNotification` action and exposed it in context value.
  - Added unified normalization for realtime notifications (`id/title/message/link/read/date`) and duplicate-safe merge by id.
  - Synchronized mark-all-read local state for both `read` and `readStatus`.
  - Cleared stale socket reference on disconnect in notification service.
- **Verification**:
  - VS Code diagnostics: no errors in modified notification files.
  - Remote authenticated endpoint checks passed:
    - `/api/notifications?page=1&limit=5` → `200`
    - `/api/notifications/preferences` → `200`
    - `/api/notifications/unread/count` → `200`
  - Local frontend build blocked by environment disk-space issue (`ENOSPC`), unrelated to notification code changes.

## Iteration Update (Feb 13, 2026 – Messaging Reconnect Lifecycle Stabilization) ✅

- **Scope**:
  - `kelmah-frontend/src/modules/messaging/contexts/MessageContext.jsx`
  - `kelmah-frontend/src/modules/messaging/pages/MessagingPage.jsx` (consumer validation)
- **Data-flow audit (UI → context → socket/service)**:
  - User opens `/messages` → `MessagingPage` consumes `MessageContext` realtime state.
  - `MessageContext` initializes conversations via REST and establishes socket session for authenticated user.
  - Socket events (`new_message`, `messages_read`, typing/online updates) mutate context state consumed by page UI banners/lists.
  - Degraded realtime mode still falls back to REST (`messagingService`) while preserving user workflow.
- **Root cause**:
  - Socket lifecycle callbacks were coupled to mutable conversation/socket state dependencies, causing avoidable disconnect/reconnect churn and reconnect-noise under state updates.
- **Fixes implemented**:
  - Introduced ref-based socket lifecycle guards and current-conversation references to keep connection setup stable and independent of conversation selection.
  - Replaced callback-attached `_connecting` flag with explicit `connectingRef` guard.
  - Added ref-backed token retrieval to avoid lifecycle churn from unstable callback identity changes.
- **Verification**:
  - VS Code diagnostics: no errors in `MessageContext.jsx`.
  - Frontend production build passed (`npx vite build`, `built in 3m 25s`).
  - Remote login endpoint check passed (`200`), while remote `/api/messages/conversations` probe remained non-responsive during bounded terminal check.

## Iteration Update (Feb 13, 2026 – Worker Search + Bookmarks Contract Hardening) ✅

- **Scope**:
  - `kelmah-frontend/src/modules/hirer/components/WorkerSearch.jsx`
  - `kelmah-frontend/src/modules/hirer/services/hirerService.js`
  - `kelmah-backend/services/user-service/controllers/user.controller.js`
- **Data-flow audit (UI → state → service → gateway → microservice)**:
  - User opens worker search page (`WorkerSearchPage` → `WorkerSearch`).
  - `WorkerSearch` effect triggers:
    - workers fetch: `api.get(API_ENDPOINTS.USER.WORKERS_SEARCH)` (fallback `/workers/search` on 404).
    - bookmark hydration: `api.get(API_ENDPOINTS.USER.BOOKMARKS)` (fallback `/bookmarks` on 404).
  - API Gateway routes `/api/workers/search` (public) and `/api/users/bookmarks` (authenticated) to user-service.
  - User-service bookmark controllers now resolve requester from trusted gateway payload `req.user.id || req.user._id`.
  - UI state updates: normalized worker IDs populate `savedWorkers`; worker cards reflect bookmark state consistently.
- **Root cause**:
  - Bookmark data flow relied on a single auth/user shape and a single response payload shape, creating fragility across environments.
- **Fixes implemented**:
  - Added JWT-shape precheck before bookmark hydration calls.
  - Added robust workerId extraction for multiple bookmark payload forms (`workerIds`, `bookmarks[]`, raw arrays).
  - Added backend requester id fallback (`id || _id`) for bookmark read/toggle handlers.
- **Verification**:
  - Backend syntax check passed (`node -c ...user.controller.js`).
  - Frontend production build passed (`npx vite build`, `built in 2m 36s`).
  - Remote checks passed:
    - `GET /api/workers/search?query=carpenter&limit=1` → `200`
    - `GET /api/users/bookmarks` (authenticated) → `200`

## Iteration Update (Feb 13, 2026 – Help/Docs/Community Route-Context Alignment) ✅

- **Scope**:
  - `kelmah-frontend/src/modules/support/pages/HelpCenterPage.jsx`
  - `kelmah-frontend/src/routes/config.jsx` (route surface validation)
- **Data-flow audit (UI → route-state → action)**:
  - User opens `/support`, `/docs`, or `/community`.
  - Router resolves all three to `HelpCenterPage`.
  - `HelpCenterPage` now derives `supportMode` from pathname and renders mode-specific hero/title/actions.
  - Quick-action buttons dispatch navigation via `navigate(...)` to support, docs, or community destinations excluding the current mode.
  - Health status remains: `HelpCenterPage` → `checkServiceHealth('aggregate')` → gateway health endpoint.
- **Root cause**:
  - `/docs` and `/community` were valid aliases but rendered identical generic help content, so navigation changed URL without context-specific UX.
  - Quick actions could include the current destination mode, creating effectively no-op loops.
- **Fixes implemented**:
  - Added route-context rendering for support/docs/community modes with mode-specific title, subtitle, and top CTA actions.
  - Filtered quick actions to hide the current mode and keep navigation outcomes meaningful.
- **Verification**:
  - VS Code diagnostics: no errors in `HelpCenterPage.jsx`.
  - Frontend production build passed (`npx vite build`, `built in 1m 20s`).
  - Remote auth smoke checks remain rate-limited (`429`) at gateway login endpoint.

## Iteration Update (Feb 13, 2026 – Notification Payload Mapping Alignment) ✅

- **Scope**:
  - `kelmah-frontend/src/modules/notifications/services/notificationService.js`
  - `kelmah-frontend/src/modules/notifications/pages/NotificationsPage.jsx` (consumer validation)
- **Root cause**:
  - Backend notification payloads include `content` and `actionUrl`, while frontend consumers expect `message` and `link`, causing blank notification text and missing action links in parts of the UI.
- **Fixes implemented**:
  - Normalized notification entities in service adapter to map `content -> message` and `actionUrl -> link`.
  - Added resilient title/message fallbacks to support mixed payload variants without breaking existing UI paths.
- **Verification**:
  - Frontend production build passed (`npx vite build`, `built in 1m 20s`).
  - Remote gateway login probe returned `429 Too Many Requests`; deployment verification for authenticated endpoint responses is pending rate-limit cooldown.

## Iteration Update (Feb 12, 2026 – Profile Module API Contract Alignment) ✅

- **Scope**:
  - `kelmah-frontend/src/modules/profile/services/profileService.js`
  - `kelmah-frontend/src/modules/profile/components/ProfilePicture.jsx`
- **Root cause**:
  - Profile service called unsupported endpoints (`/users/profile/skills`, `/users/profile/education`, `/users/profile/experience`, `/users/profile/preferences`) while backend currently exposes a consolidated `PUT /users/profile` update path.
  - Profile picture UI rendered only local preview state and ignored persisted profile avatar data.
- **Fixes implemented**:
  - Consolidated profile sub-updates to `PUT /users/profile` payload updates for skills/education/experience/preferences.
  - Added profile picture fallback persistence for unavailable upload endpoint and rendered stored/persisted avatar in profile UI.
  - Added blob URL cleanup in picture component to avoid memory leaks.
- **Verification**:
  - Frontend production build passed (`npx vite build`, `built in 2m 9s`).

## Iteration Update (Feb 12, 2026 – Scheduling Page Service Contract Resilience) ✅

- **Scope**:
  - `kelmah-frontend/src/modules/scheduling/services/schedulingService.js`
  - `kelmah-frontend/src/modules/scheduling/pages/SchedulingPage.jsx` (consumer validation)
- **Root cause**:
  - Scheduling module called `/appointments` APIs that are not currently mounted in the active gateway/service surface, causing hard failures and non-functional create/update/delete flows.
- **Fixes implemented**:
  - Added local-storage fallback CRUD in scheduling service when appointment endpoints are unavailable.
  - Normalized appointment entities (`id`, `date`) across API and fallback paths for stable rendering.
  - Added fallback filtering and status-update paths for user/job-specific and status operations.
- **Verification**:
  - Frontend production build passed (`npx vite build`, `built in 2m 7s`).

## Iteration Update (Feb 12, 2026 – Notifications + Settings Data-Flow Hardening) ✅

- **Scope**:
  - `kelmah-frontend/src/modules/settings/services/settingsService.js`
  - `kelmah-backend/services/messaging-service/controllers/notification.controller.js`
- **Root cause**:
  - Notification endpoints depended on `req.user._id` only, while gateway-auth user payloads can provide `id`.
  - Settings frontend `getSettings()` ignored persisted backend settings and returned static defaults, causing user preference drift after refresh.
- **Fixes implemented**:
  - Notification controller now resolves requester identity from `req.user._id || req.user.id` and enforces auth checks consistently.
  - Settings service now hydrates from `GET /settings` and merges sane defaults only as fallback.
- **Verification**:
  - Messaging notification controller syntax check passed.
  - Frontend production build passed (`npx vite build`, `built in 2m 34s`).

## Iteration Update (Feb 12, 2026 – Reviews Backend/Gateway Flow Alignment) ✅

- **Scope**:
  - `kelmah-backend/api-gateway/server.js`
  - `kelmah-backend/services/review-service/{server.js,models/Review.js,controllers/review.controller.js,controllers/analytics.controller.js,routes/admin.routes.js,routes/review.routes.js}`
- **Root cause**:
  - Review controller queries used legacy field names not present in active `Review` schema.
  - Gateway auth classification treated eligibility checks as public GET routes, causing missing auth context on protected eligibility logic.
  - Analytics route was shadowed by `/:reviewId` ordering in review-service route declarations.
- **Fixes implemented**:
  - Schema and controller contracts aligned to current field set (`reviewee/reviewer/job/rating` + moderation metadata).
  - Gateway now treats eligibility and analytics as protected review endpoints.
  - Route order corrected so `/analytics` resolves before `/:reviewId`.
  - Protected review-service direct routes now enforce `verifyGatewayRequest`.
- **Verification**:
  - Modified backend files pass diagnostics in VS Code Problems scan.
  - Runtime smoke check via `localhost:5000` attempted; blocked because gateway not reachable in current session.

## Iteration Update (Feb 12, 2026 – ReviewsPage Runtime Stability) ✅

- **Scope**: `kelmah-frontend/src/modules/reviews/pages/ReviewsPage.jsx` and `kelmah-frontend/src/modules/reviews/services/reviewService.js`.
- **Root cause**:
  - Reviews UI assumed strict object shapes (`review.reviewer.name`, `review.job.title`, `ratingDistribution[rating]`, `averageRating.toFixed(1)`) that are not guaranteed by current backend responses.
  - Initial data fetch executed only once on mount and could miss authenticated user context if `user.id` resolved later.
- **Fixes implemented**:
  - Added review payload normalization layer in `reviewService` to provide stable card-ready data.
  - Added safe derived `overallStats` defaults in `ReviewsPage` for rating display and distribution calculations.
  - Switched initial load effect dependency to `[user?.id]` for reliable post-auth fetch.
  - Added null-safe search/filter predicates.
- **Verification**:
  - Production build succeeds (`npm run build` / `vite build`, built in `1m 41s`).

**Date started**: Feb 11, 2026  
**Goal**: Audit every active frontend page + cross-cutting frontend infrastructure to find bugs, UI errors, security issues, and maintainability risks.

## Prompt1 (Session Context)

**Project**: Kelmah Platform – freelance marketplace connecting vocational workers and hirers.

**Stack**: React 18 (Vite) + Express microservices via API Gateway + MongoDB/Mongoose.

**Current focus**: Frontend-wide page audit (bugs/UI/security) and cross-cutting fixes where safe.

**Key files**:
- kelmah-frontend/src/main.jsx – app bootstrap, global providers, global error fallback (react-error-boundary).
- kelmah-frontend/src/App.jsx – PWA init, service warm-up, initial auth verification, health banner.
- kelmah-frontend/src/routes/config.jsx – routing table + lazy-loaded pages + ProtectedRoute wrappers.
- kelmah-frontend/src/services/apiClient.js – axios client, token attach/refresh, retry logic.
- kelmah-frontend/src/utils/secureStorage.js – encrypted client-side storage abstraction.
- kelmah-frontend/src/config/environment.js – API base URL resolution (runtime-config + fallback).
- kelmah-frontend/src/modules/auth/services/authSlice.js – auth state + login/verify/logout flows.

**Conventions observed**:
- Frontend routing via React Router v6 `useRoutes()`.
- Protected routes guarded by `ProtectedRoute` using Redux auth state.
- API calls use `api` / `apiClient` (axios wrapper) with baseURL driven by environment.
- Error handling: global ErrorBoundary at bootstrap + some per-route boundaries.

**Testing strategy (observed)**:
- Jest present; at least secureStorage unit tests exist.

**Known constraints**:
- Backend can cold-start (Render sleep); frontend includes warm-up and retry logic.
- Security: tokens are client-side (encrypted localStorage wrapper) and must avoid leaks.

I’m about to: perform an end-to-end audit and keep this document as the checklist + findings log.

---

## Prompt8 (Codebase Structure Analysis)

### 1) Architecture
- Frontend: modular, domain-driven React app with pages under `src/modules/*/pages`.
- Backend: API Gateway + microservices.

### 2) Entry points
- Frontend execution starts at `kelmah-frontend/src/main.jsx` → renders `App`.
- Frontend routing starts at `kelmah-frontend/src/routes/config.jsx` (`AppRoutes`).

### 3) Core modules (frontend)
1. `src/routes/config.jsx` (routing)
2. `src/services/apiClient.js` (HTTP client + auth refresh)
3. `src/utils/secureStorage.js` (token persistence)
4. `src/modules/auth/services/authSlice.js` + `authService.js` (auth flows)
5. `src/config/environment.js` (API base URL and runtime tunnel config)

### 4) Data flow (typical)
UI page → module service/hook → `api` (axios wrapper) → API Gateway `/api/*` → microservice route → controller/model.

### 5) External dependencies
- Render (backend hosting), Vercel (frontend), LocalTunnel runtime config.
- Third-party APIs: maps (OSM/Nominatim/etc), Paystack, potentially OAuth.

### 6) Red flags (early)
- Multiple token key conventions exist (`kelmah_auth_token` vs secureStorage’s internal `auth_token`).
- WebSocket code that appends `?token=...` in the URL (token leak risk via logs/referrers).
- CSP config includes `'unsafe-inline'` for scripts/styles (weakens XSS protections).
- Duplicate/overlapping error boundary implementations (global + custom class boundary + per-route) with inconsistent DEV gating.

### 7) Where to start for audits
- Cross-cutting: routing (`routes/config.jsx`), auth (`authSlice.js`, `authService.js`), storage (`secureStorage.js`), API client (`apiClient.js`).
- Then per-page, in route order (public → protected areas).

---

## Active Page Inventory (Audit Checklist)

> Source: `kelmah-frontend/src/modules/**/pages/**` plus `kelmah-frontend/src/pages/**`.

- Public
  - kelmah-frontend/src/pages/HomeLanding.jsx
  - kelmah-frontend/src/modules/auth/pages/LoginPage.jsx
  - kelmah-frontend/src/modules/auth/pages/RegisterPage.jsx
  - kelmah-frontend/src/modules/auth/pages/ForgotPasswordPage.jsx
  - kelmah-frontend/src/modules/auth/pages/ResetPasswordPage.jsx
  - kelmah-frontend/src/modules/auth/pages/VerifyEmailPage.jsx
  - kelmah-frontend/src/modules/auth/pages/RoleSelectionPage.jsx
  - kelmah-frontend/src/modules/common/pages/NotFoundPage.jsx
  - kelmah-frontend/src/modules/dashboard/pages/DashboardPage.jsx (protected)
  - kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx
  - kelmah-frontend/src/modules/jobs/pages/JobDetailsPage.jsx
  - kelmah-frontend/src/modules/search/pages/SearchPage.jsx
  - kelmah-frontend/src/modules/worker/pages/WorkerProfilePage.jsx
  - kelmah-frontend/src/modules/messaging/pages/MessagingPage.jsx (protected)

- Hirer
  - kelmah-frontend/src/modules/hirer/pages/HirerDashboardPage.jsx
  - kelmah-frontend/src/modules/hirer/pages/JobPostingPage.jsx
  - kelmah-frontend/src/modules/hirer/pages/JobManagementPage.jsx
  - kelmah-frontend/src/modules/hirer/pages/ApplicationManagementPage.jsx
  - kelmah-frontend/src/modules/hirer/pages/WorkerSearchPage.jsx
  - kelmah-frontend/src/modules/hirer/pages/HirerToolsPage.jsx

- Worker
  - kelmah-frontend/src/modules/worker/pages/WorkerDashboardPage.jsx
  - kelmah-frontend/src/modules/worker/pages/JobSearchPage.jsx
  - kelmah-frontend/src/modules/worker/pages/MyApplicationsPage.jsx
  - kelmah-frontend/src/modules/worker/pages/WorkerProfileEditPage.jsx
  - kelmah-frontend/src/modules/worker/pages/PortfolioPage.jsx
  - kelmah-frontend/src/modules/worker/pages/SkillsAssessmentPage.jsx

- Payments
  - kelmah-frontend/src/modules/payment/pages/PaymentCenterPage.jsx
  - kelmah-frontend/src/modules/payment/pages/WalletPage.jsx
  - kelmah-frontend/src/modules/payment/pages/PaymentsPage.jsx
  - kelmah-frontend/src/modules/payment/pages/PaymentMethodsPage.jsx
  - kelmah-frontend/src/modules/payment/pages/PaymentSettingsPage.jsx
  - kelmah-frontend/src/modules/payment/pages/EscrowDetailsPage.jsx
  - kelmah-frontend/src/modules/payment/pages/BillPage.jsx

- Contracts
  - kelmah-frontend/src/modules/contracts/pages/ContractManagementPage.jsx
  - kelmah-frontend/src/modules/contracts/pages/ContractsPage.jsx
  - kelmah-frontend/src/modules/contracts/pages/ContractDetailsPage.jsx
  - kelmah-frontend/src/modules/contracts/pages/CreateContractPage.jsx
  - kelmah-frontend/src/modules/contracts/pages/EditContractPage.jsx

- Notifications / Settings / Profile / Support
  - kelmah-frontend/src/modules/notifications/pages/NotificationsPage.jsx
  - kelmah-frontend/src/modules/notifications/pages/NotificationSettingsPage.jsx
  - kelmah-frontend/src/modules/settings/pages/SettingsPage.jsx
  - kelmah-frontend/src/modules/profile/pages/ProfilePage.jsx
  - kelmah-frontend/src/modules/support/pages/HelpCenterPage.jsx

- Scheduling
  - kelmah-frontend/src/modules/scheduling/pages/SchedulingPage.jsx
  - kelmah-frontend/src/modules/scheduling/pages/TempSchedulingPage.jsx

- Reviews
  - kelmah-frontend/src/modules/reviews/pages/ReviewsPage.jsx
  - kelmah-frontend/src/modules/reviews/pages/WorkerReviewsPage.jsx

- Quick Hire
  - kelmah-frontend/src/modules/quickjobs/pages/QuickJobRequestPage.jsx
  - kelmah-frontend/src/modules/quickjobs/pages/NearbyJobsPage.jsx
  - kelmah-frontend/src/modules/quickjobs/pages/QuickJobTrackingPage.jsx

- Map / Premium / Admin
  - kelmah-frontend/src/modules/map/pages/ProfessionalMapPage.jsx
  - kelmah-frontend/src/modules/premium/pages/PremiumPage.jsx
  - kelmah-frontend/src/modules/admin/pages/SkillsAssessmentManagement.jsx
  - kelmah-frontend/src/modules/admin/pages/PayoutQueuePage.jsx

---

## Cross-cutting Findings (Initial)

### 1) Auth bootstrap reads wrong token key
- Severity: **High**
- Where: `kelmah-frontend/src/App.jsx`
- What’s wrong: `App` checks `secureStorage.getItem(AUTH_CONFIG.tokenKey)` where `AUTH_CONFIG.tokenKey` defaults to `kelmah_auth_token`, but the app actually stores auth tokens under secureStorage’s internal key `auth_token` (`secureStorage.setAuthToken()` / `getAuthToken()`).
- Why it matters: can skip `verifyAuth()` on reload and leave stale/invalid sessions undetected; hard-to-reproduce auth/routing bugs.
- Fix: use `secureStorage.getAuthToken()` consistently (single source of truth).
- Status: **Fixed** (Feb 11, 2026)

### 2) Logout fallback clears wrong storage keys
- Severity: **Medium**
- Where: `kelmah-frontend/src/modules/auth/services/authSlice.js` (`logoutUser` catch)
- What’s wrong: catch block removes `localStorage.removeItem(AUTH_CONFIG.tokenKey)` + `localStorage.removeItem('user')` but does not guarantee `secureStorage.clear()`.
- Why it matters: “partial logout” risk if the API call fails; could preserve encrypted token/user.
- Fix: always call `secureStorage.clear()` in the catch/finally path.
- Status: **Fixed ✅** (Feb 12, 2026)

### 3) WebSocket token in query string
- Severity: **High**
- Where: `kelmah-frontend/src/modules/messaging/components/common/Messages.jsx`
- What’s wrong: `new WebSocket(`${wsBaseUrl}/ws?token=${token}`)` leaks token via URL (logs/proxies/referrers); also `wsBaseUrl` defaults to `/socket.io` which is not a WS URL.
- Why it matters: token exposure = account compromise.
- Fix: use Socket.IO auth headers/handshake auth payload, or send token in first message after WS open over WSS; avoid querystring tokens.
- Status: **Partially fixed ✅** (Feb 12, 2026) — removed `?token=` URL usage in legacy component; main app uses Socket.IO via `MessageContext`.

### 3b) PWA DOM injection surface
- Severity: **High**
- Where: `kelmah-frontend/src/utils/pwaHelpers.js`
- What was wrong: used `innerHTML` + inline `onclick` handlers (requires global `window.*` exports), increasing XSS blast radius and forcing weaker CSP.
- Status: **Fixed ✅** (DOM nodes + `addEventListener`, no `window.*` exports).
- Note: still uses inline styles via `element.style.cssText` (CSP `style-src 'unsafe-inline'` remains required unless a nonce/hash strategy is adopted).

### 4) CSP includes unsafe inline
- Severity: **Medium**
- Where: `kelmah-frontend/src/config/securityConfig.js`
- What’s wrong: CSP allows `'unsafe-inline'` for scripts/styles.
- Why it matters: makes XSS much easier to exploit.
- Fix: remove unsafe-inline where feasible; use hashes/nonces (requires build support) or restrict by moving inline styles/scripts into bundles.

### 5) Error boundaries are duplicated/inconsistent
- Severity: **Low**
- Where: `kelmah-frontend/src/main.jsx`, `kelmah-frontend/src/components/common/ErrorBoundary.jsx`, `kelmah-frontend/src/modules/common/components/RouteErrorBoundary.jsx`
- What’s wrong: multiple overlapping implementations; inconsistent DEV gating (one uses `process.env.NODE_ENV`, others use `import.meta.env`).
- Why it matters: makes debugging + user experience inconsistent.
- Fix: standardize on one strategy (global + per-route) and align env checks.

---

## Cross-cutting Findings (Deeper)

### 6) Frontend routes missing but UI links exist
- Severity: **High**
- Where:
  - Router: `kelmah-frontend/src/routes/config.jsx`
  - UI links: `kelmah-frontend/src/modules/auth/components/AuthForm.jsx`, `.../Login.jsx`, `.../MobileLogin.jsx`
- What’s wrong: the UI links to `/forgot-password` (and header/nav special-cases `/forgot-password`, `/reset-password`, `/verify-email`), but these paths were not registered in the router, causing 404s and broken flows.
- Why it matters: password reset + email verification are core account recovery flows.
- Fix implemented: added routes for `/forgot-password`, `/reset-password` (and `/:token`), `/verify-email/:token`, `/role-selection`, `/mfa/setup`.

### 7) Job details route marked public but behaves as protected
- Severity: **High**
- Where:
  - Router: `kelmah-frontend/src/routes/config.jsx`
  - Page: `kelmah-frontend/src/modules/jobs/pages/JobDetailsPage.jsx`
- What’s wrong: `/jobs/:id` was public in router, but the page requires an auth token and otherwise renders an auth-required path that contains a crash bug (`location` undefined).
- Why it matters: inconsistent UX + user-facing crash path.
- Fix implemented: wrapped `/jobs/:id` in `ProtectedRoute` (router-level), which also avoids hitting the crash path.

### 8) ResetPassword page file is broken but was previously unreachable
- Severity: **High**
- Where: `kelmah-frontend/src/modules/auth/pages/ResetPasswordPage.jsx`
- What’s wrong: file is syntactically invalid, but wasn’t imported by router so builds could still succeed.
- Why it matters: once routes are correctly wired, importing this module would break builds.
- Fix implemented: routed reset-password to a new non-module page `kelmah-frontend/src/pages/ResetPassword.jsx` to keep router fixed without importing the broken module.

### 9) Payment Center links to a missing route
- Severity: **High**
- Where:
  - UI link: `kelmah-frontend/src/modules/payment/pages/PaymentCenterPage.jsx` (links to `/payment/methods`)
  - Router: `kelmah-frontend/src/routes/config.jsx`
- What was wrong: UI navigated to `/payment/methods` but the route was not registered, causing a 404.
- Why it matters: payment method management is a core worker flow; broken navigation blocks onboarding and deposits/withdrawals.
- Fix implemented: added a protected `/payment/methods` route and wrapped it with `PaymentProvider`.
- Status: **Fixed ✅** (Feb 12, 2026)

### 10) Payment Center Edit/Delete method buttons were non-functional
- Severity: **High**
- Where: `kelmah-frontend/src/modules/payment/pages/PaymentCenterPage.jsx`
- What was wrong: method cards rendered Edit/Delete icon buttons with no handlers, so the UI appeared to support editing/removal but did nothing.
- Why it matters: workers cannot manage payment methods from the Payment Center, leading to stuck flows and user mistrust.
- Fix implemented:
  - Edit now routes to `/payment/methods`
  - Delete prompts confirmation and calls the API via `PaymentContext.deletePaymentMethod()`
  - `paymentService.getPaymentMethods()` now normalizes backend responses to a stable UI shape (ensures `id` exists).
- Status: **Fixed ✅** (Feb 12, 2026)

### 12) Payments actions menu linked to missing Bills route
- Severity: **High**
- Where:
  - UI: `kelmah-frontend/src/modules/payment/pages/PaymentsPage.jsx` (menu links to `/payment/bill`)
  - Router: `kelmah-frontend/src/routes/config.jsx`
- What was wrong: clicking “View Bills” navigated to `/payment/bill` but the route was not registered.
- Fix implemented: added the `/payment/bill` route and ensured bills data is normalized to an array.
- Status: **Fixed ✅** (Feb 12, 2026)

### 11) Payment methods UI offered Mobile Money method type not supported by backend
- Severity: **High**
- Where:
  - UI: `kelmah-frontend/src/modules/payment/pages/PaymentMethodsPage.jsx`
  - Backend: `kelmah-backend/services/payment-service/utils/validation.js` + `models/PaymentMethod.js`
- What’s wrong: UI attempts to create a method with `type: mobile_money`, but backend validation/schema only supports `credit_card`, `bank_account`, and `paypal`.
- Why it matters: user-visible failure when adding a Mobile Money method.
- Fix implemented: added backend support for saved `mobile_money` payment methods and re-enabled the UI flow.
- Status: **Fixed ✅** (Feb 12, 2026)

## Per-page Findings

### kelmah-frontend/src/modules/hirer/pages/HirerDashboardPage.jsx
- Severity: **High**
- What was wrong: dashboard navigated to `/hirer/payments` and `/payments`, but neither route existed in the router.
- Why it matters: user-visible 404 from primary dashboard actions.
- Fix implemented: wired `/hirer/payments` and `/payments` routes to the existing payment UI (`PaymentsPage`) with `PaymentProvider` + role protection.
- Status: **Fixed ✅** (Feb 12, 2026)

### kelmah-frontend/src/modules/hirer/pages/HirerDashboardPage.jsx (refresh UX)
- Severity: **Medium**
- What was wrong: loading timeout warning used `window.location.reload()` which is disruptive and can look like a crash.
- Fix implemented: reuse `handleRefresh()` so the page refreshes data without a full reload.
- Status: **Fixed ✅** (Feb 12, 2026)

### kelmah-frontend/src/modules/hirer/pages/JobManagementPage.jsx
- Severity: **High**
- What was wrong: “Edit Job” navigated to `/jobs/edit/:id` which was not registered (404), and there was no update flow.
- Fix implemented: added `/hirer/jobs/edit/:jobId` route + `updateHirerJob` thunk; `JobPostingPage` now supports edit mode.
- Status: **Fixed ✅** (Feb 12, 2026)

### kelmah-frontend/src/modules/hirer/pages/ApplicationManagementPage.jsx
- Severity: **High**
- What was wrong:
  - Called `hirerService.getJobApplications` / `hirerService.updateApplicationStatus` that did not exist (runtime crash).
  - Navigated to `/messages/:id` which is not registered; router uses `/messages` with query deep-links.
- Fix implemented: added missing service methods, normalized API payloads, and switched navigation to `/messages?conversation=...`.
- Status: **Fixed ✅** (Feb 12, 2026)

### kelmah-frontend/src/modules/worker/pages/WorkerProfileEditPage.jsx
- Severity: **High**
- What was wrong:
  - Profile save used multipart `FormData` against `PUT /api/users/workers/:id`, but the active backend route expects JSON body; this caused update requests to fail/partially apply.
  - Availability load expected `availabilityStatus`/`availableHours`, while backend returns `status` + `daySlots`, causing stale/default values in the editor.
  - Availability save posted to worker route shape while active write surface is `/api/availability/:userId`.
- Fix implemented:
  - Profile save now sends JSON-safe payload aligned with backend `updateWorkerProfile` fields.
  - Added API→UI availability mapper (`daySlots/status` → `availableHours/availabilityStatus`).
  - Updated availability save thunk to target `/availability/:userId` and translate UI schedule to backend `daySlots`.
- Status: **Fixed ✅** (Feb 12, 2026)

### kelmah-frontend/src/modules/hirer/components/WorkerSearch.jsx
- Severity: **High**
- What was wrong:
  - Worker search fetch used `/workers` with non-canonical filter keys (`keywords`, `city`, `rating`, `primaryTrade`) that do not match `searchWorkers` backend contract.
  - Result: filters/sorting were partially ignored or inconsistent despite page rendering.
- Fix implemented:
  - Switched to `GET /users/workers/search`.
  - Aligned params to backend-supported names (`query`, `location`, `skills`, `minRating`, `maxRate`, `availability`, `sortBy`, pagination).
  - Mapped frontend sort options to backend `sortBy` values.
- Status: **Fixed ✅** (Feb 12, 2026)

### kelmah-frontend/src/modules/worker/pages/SkillsAssessmentPage.jsx
- Severity: **Medium**
- What was wrong:
  - Route-driven test loading path (`fetchTestDetails`) did not reset `testPaused`, allowing stale paused state to carry across assessment sessions in edge navigation flows.
- Fix implemented:
  - Added explicit pause-state reset when preparing selected test details.
- Status: **Fixed ✅** (Feb 12, 2026)

### kelmah-frontend/src/modules/map/pages/ProfessionalMapPage.jsx
- Severity: **High**
- What was wrong:
  - “Message” action navigated to `/messages?conversation=<userId>` but `conversation` expects a conversation id; deep-link contract for user ids is `recipient`.
- Fix implemented:
  - Switched to `/messages?recipient=<userId>` and added a warning snackbar if recipient cannot be derived.
- Status: **Fixed ✅** (Feb 12, 2026)

### kelmah-frontend/src/modules/contracts/pages/ContractDetailsPage.jsx
- Severity: **High**
- What was wrong:
  - Page expected `contractId` route param, but active route is `/contracts/:id`; contract actions/fetches could run with undefined id.
- Fix implemented:
  - Added resolved id fallback (`contractId || id`) and updated selectors, fetches, action dispatches, and edit navigation to use resolved id.
  - Updated download URL to existing `/api/jobs/contracts/:id` endpoint path.
- Status: **Fixed ✅** (Feb 12, 2026)

### kelmah-frontend/src/modules/contracts/services/contractService.js
- Severity: **High**
- What was wrong:
  - `contractSlice` relied on multiple service methods that were missing in `contractService`, causing runtime failures in create/sign/cancel/milestone/dispute flows.
- Fix implemented:
  - Added missing methods and normalized backend payloads into stable frontend contract/milestone shapes.
- Status: **Fixed ✅** (Feb 12, 2026)

### kelmah-frontend/src/modules/contracts/pages/ContractsPage.jsx
- Severity: **High**
- What was wrong:
  - Primary CTAs/actions were not wired (new contract button had malformed JSX; empty-state create button had no navigation; view/download actions were non-functional).
- Fix implemented:
  - Wired create CTAs to `/contracts/create`.
  - Wired details action to `/contracts/:id` and download action to `/api/jobs/contracts/:id`.
- Status: **Fixed ✅** (Feb 12, 2026)

### kelmah-frontend/src/modules/auth/pages/ResetPasswordPage.jsx
- Severity: **Medium**
- What’s wrong: file is syntactically broken (JSX tags not closed; conditional rendering logic is embedded inside a `<Typography>` block).
- Why it matters: it’s currently **dead code** (router uses the non-module page at `kelmah-frontend/src/pages/ResetPassword.jsx`), but it will become a build/lint blocker if re-imported.
- Fix: either repair it or delete it after confirming zero imports.
- Status: **Fixed ✅** (Feb 12, 2026) — now a re-export to `kelmah-frontend/src/pages/ResetPassword.jsx`.

### kelmah-frontend/src/pages/ResetPassword.jsx
- Severity: **Low**
- What’s right: active reset-password route uses this file (avoids importing the broken module page). It includes basic password validation, safe error message fallback, and accessibility labels.
- Improvements:
  - Replace hardcoded colors (e.g. `#FFD700`, `#0a0a0a`) with theme tokens for consistency.

### kelmah-frontend/src/modules/jobs/pages/JobDetailsPage.jsx
- Severity: **Low**
- What’s wrong: `handleSignIn()` uses `location.pathname` but `location` is never defined (only `{ search } = useLocation()` is used). This would throw if the “Sign In” button renders.
- Why it matters: the route is currently wrapped in `ProtectedRoute` in `routes/config.jsx`, so unauthenticated users shouldn’t reach this page; however, the dead-path bug is still technical debt.
- Fix: define `const location = useLocation();` and use it consistently, or remove the unused `authRequired` view.
- Status: **Fixed ✅** (Feb 12, 2026)

### kelmah-frontend/src/modules/worker/pages/WorkerDashboardPage.jsx
- Severity: **Medium**
- What was wrong: dashboard sets a loading-timeout `setTimeout` that could fire after unmount and call `setState` (React warning + potential UI glitch).
- Fix implemented: track/clear the timeout via `useRef` + cleanup effect.
- Status: **Fixed ✅** (Feb 12, 2026)

### kelmah-frontend/src/pages/HomeLanding.jsx
- Severity: **Medium**
- What’s wrong: extensive hardcoded colors (`#FFD700`, `#111`, etc.) and font families (e.g., `Montserrat`) instead of design tokens.
- Why it matters: theme/dark-mode consistency and maintainability; violates “no new hard-coded colors/fonts” discipline.
- Fix: replace hardcoded values with `theme.palette.*` and existing typography tokens.

### kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx
- Severity: **Medium**
- What’s wrong: very large page module (~2400+ lines) with heavy MUI imports and many icon imports; likely bundle and render performance impact.
- Why it matters: slower first load, more memory, harder to maintain.
- Fix: split into smaller components/hooks; ensure only used MUI components/icons are imported; prefer module-level lazy loading for below-the-fold sections.

### kelmah-frontend/src/modules/auth/pages/ForgotPasswordPage.jsx
- Severity: **Low**
- What’s wrong: UI accepts “Email or Phone” but calls `authService.forgotPassword(email)` (email-only API unless backend supports phone).
- Why it matters: user confusion + higher support burden.
- Fix: either (a) update label/placeholder to email-only, or (b) extend backend + service to support phone-based reset.

### kelmah-frontend/src/modules/auth/pages/VerifyEmailPage.jsx
-
### kelmah-frontend/src/modules/messaging/pages/MessagingPage.jsx
- Severity: **High**
- Status: **Fixed ✅**
- What was wrong: conversation filtering was not null-safe and could crash rendering.
- Fix applied: default `conversations` to `[]`, guard `participants`, and safely lowercase string fields.

### kelmah-frontend/src/modules/search/pages/SearchPage.jsx
- Severity: **High**
- Status: **Fixed ✅**
- What was wrong:
  1) Location objects were double-encoded into the URL and wouldn’t parse on reload.
  2) Suggestions called `/search/suggestions`, but backend exposes suggestions at `/jobs/suggestions` (accepts `q`, `query`, or `keyword`).
- Fix applied:
  - Avoid manual `encodeURIComponent` when writing location JSON.
  - Decode defensively when reading.
  - Call `/jobs/suggestions`.

### kelmah-frontend/src/modules/search/pages/SearchPage.jsx (logging)
- Severity: **Low**
- What’s wrong: mount/unmount `console.log` calls run in production builds.
- Why it matters: noise + potential privacy concerns (URLs can include user-entered text).
- Fix: guard logs behind `import.meta.env.DEV`.

### kelmah-frontend/src/routes/config.jsx (MFA route)
- Severity: **Medium**
- What was wrong: `/mfa/setup` route was public but the page calls authenticated APIs (`setupMFA`, `verifyMFA`).
- Status: **Fixed ✅** (wrapped route in `ProtectedRoute`).

### kelmah-frontend/src/modules/payment/pages/WalletPage.jsx
- Severity: **Medium**
- What was wrong: renders `transactions.length` without guarding `transactions` type; would crash if context returns `null/undefined`.
- Status: **Fixed ✅** (guarded with `Array.isArray`).

### kelmah-frontend/src/modules/payment/pages/PaymentCenterPage.jsx
- Severity: **Medium**
- What’s wrong: payment method Edit/Delete icon buttons render but have no `onClick` handlers (non-functional UI).
- Why it matters: users can’t manage payment methods; appears broken.
- Fix: wire to existing dialogs/actions in `PaymentContext` (or remove buttons until implemented).

### kelmah-frontend/src/modules/messaging/components/common/Messages.jsx
- Severity: **High**
- What’s wrong: contains token-in-URL WebSocket pattern and uses a likely wrong base WS URL (`/socket.io`).
- Status: **Unreferenced/Dead code (so far)** — no imports/usages found in active pages.
- Recommendation: keep quarantined; do not reintroduce. If needed, replace with Socket.IO auth handshake pattern already used elsewhere.
- Severity: **Low**
- What’s wrong: error paths use `err.message` and may miss server-provided detail (`err.response?.data?.message`).
- Why it matters: worse UX for recoverable failures.
- Fix: prefer server message where available; keep a safe fallback.

---

## Next Steps
1. Implement safe cross-cutting fixes (auth bootstrap token key + logout cleanup) with minimal diffs.
2. Run static scans for risky patterns (`dangerouslySetInnerHTML`, token in URLs, direct `window.location`, etc.).
3. Review each page file for: loading/error states, broken routing, uncontrolled side effects, accessibility, and security-sensitive UI flows.

## Verification
- Frontend production build: **PASS** (`vite build`).

---

## Full Page Audit Pass (Feb 12, 2026)

### Scope audited
- Active route map from [kelmah-frontend/src/routes/config.jsx](../kelmah-frontend/src/routes/config.jsx)
- Active page files under `kelmah-frontend/src/modules/**/pages/*.jsx` and `kelmah-frontend/src/pages/*.jsx`
- Cross-cutting page issues: broken navigation targets, security-sensitive logging, direct network calls bypassing API client, and timer/reload UX patterns

### Highest-priority findings

#### 1) Missing `/search` route while multiple pages navigate to `/search`
- **Severity**: High
- **Where**:
  - Route exists only as `/find-talents` in [kelmah-frontend/src/routes/config.jsx](../kelmah-frontend/src/routes/config.jsx#L236)
  - Pages navigating to `/search`: [kelmah-frontend/src/pages/HomeLanding.jsx](../kelmah-frontend/src/pages/HomeLanding.jsx#L150), [kelmah-frontend/src/pages/HomeLanding.jsx](../kelmah-frontend/src/pages/HomeLanding.jsx#L271), [kelmah-frontend/src/pages/HomeLanding.jsx](../kelmah-frontend/src/pages/HomeLanding.jsx#L336)
- **Impact**: 404 from primary CTA paths
- **Fix**: Add `/search` alias route to `SearchPage` or refactor all UI links to `/find-talents`

#### 2) Contract links point to routes not registered in active router
- **Severity**: High
- **Where**:
  - `ContractManagementPage` links to `/contracts/create` in [kelmah-frontend/src/modules/contracts/pages/ContractManagementPage.jsx](../kelmah-frontend/src/modules/contracts/pages/ContractManagementPage.jsx#L63)
  - `PaymentCenterPage` links to `/contracts/:id` in [kelmah-frontend/src/modules/payment/pages/PaymentCenterPage.jsx](../kelmah-frontend/src/modules/payment/pages/PaymentCenterPage.jsx#L408)
  - Active router only mounts contracts under worker namespace (`/worker/contracts`) in [kelmah-frontend/src/routes/config.jsx](../kelmah-frontend/src/routes/config.jsx#L480)
- **Impact**: Navigation breakage from contract/payment flows
- **Fix**: Add top-level `/contracts/*` aliases or update links to `/worker/contracts` variants

#### 3) Missing `/profile/upload-cv` route from Jobs CTA
- **Severity**: High
- **Where**:
  - Jobs CTA navigates to `/profile/upload-cv` in [kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx](../kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx#L2404)
  - No matching route in [kelmah-frontend/src/routes/config.jsx](../kelmah-frontend/src/routes/config.jsx)
- **Impact**: Broken CTA for authenticated users
- **Fix**: Add route or redirect CTA to an existing profile upload section

#### 4) Help Center links to non-existent docs/community routes
- **Severity**: High
- **Where**:
  - `/docs?category=support` and `/community` in [kelmah-frontend/src/modules/support/pages/HelpCenterPage.jsx](../kelmah-frontend/src/modules/support/pages/HelpCenterPage.jsx#L72-L79)
  - No matching routes in [kelmah-frontend/src/routes/config.jsx](../kelmah-frontend/src/routes/config.jsx)
- **Impact**: Dead support links from critical assistance page
- **Fix**: Route to existing support surfaces or implement missing pages/routes

#### 5) Worker profile completeness call bypasses centralized API client
- **Severity**: Medium
- **Where**: direct `fetch()` in [kelmah-frontend/src/modules/worker/pages/WorkerProfileEditPage.jsx](../kelmah-frontend/src/modules/worker/pages/WorkerProfileEditPage.jsx#L140)
- **Impact**: inconsistent interceptors/auth-refresh/error handling
- **Fix**: replace with shared `api` client call via service layer

#### 6) Production noise/data exposure risk via unguarded debug logs
- **Severity**: Medium
- **Where**:
  - `SearchPage` unguarded logs in [kelmah-frontend/src/modules/search/pages/SearchPage.jsx](../kelmah-frontend/src/modules/search/pages/SearchPage.jsx#L296-L304), [kelmah-frontend/src/modules/search/pages/SearchPage.jsx](../kelmah-frontend/src/modules/search/pages/SearchPage.jsx#L583)
  - `JobsPage` numerous logs including auth-state/debug traces in [kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx](../kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx#L723-L776)
- **Impact**: noisy production logs and accidental data leakage in shared consoles
- **Fix**: gate debug logs behind `import.meta.env.DEV` and remove auth/state object dumps

#### 7) Hard reload fallback patterns hurt UX/state continuity
- **Severity**: Medium
- **Where**:
  - `JobsPage` reload actions in [kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx](../kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx#L617), [kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx](../kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx#L1562)
  - `ReviewsPage` reload action in [kelmah-frontend/src/modules/reviews/pages/ReviewsPage.jsx](../kelmah-frontend/src/modules/reviews/pages/ReviewsPage.jsx#L857)
- **Impact**: loses in-memory state and can mask root causes
- **Fix**: use targeted retry handlers instead of `window.location.reload()`

#### 8) Quick-hire role guard appears inverted against domain model semantics
- **Severity**: Medium
- **Where**:
  - Quick-hire routes are restricted to `worker/admin` in [kelmah-frontend/src/routes/config.jsx](../kelmah-frontend/src/routes/config.jsx#L559-L626)
  - Backend quick job model and comments frame requester as client/hirer flow in [kelmah-backend/shared/models/QuickJob.js](../kelmah-backend/shared/models/QuickJob.js#L1-L5)
- **Impact**: feature availability mismatch and role confusion
- **Fix**: align route guards with actual product role policy (hirer/client request, worker quote/track)

### Dormant page modules found (not mounted in active router)
- `src/modules/map/pages/ProfessionalMapPage.jsx`
- `src/modules/premium/pages/PremiumPage.jsx`
- `src/modules/payment/pages/PaymentSettingsPage.jsx`
- `src/modules/payment/pages/EscrowDetailsPage.jsx`
- `src/modules/messaging/pages/SimpleMessagingPage.jsx`
- `src/modules/contracts/pages/{ContractsPage,CreateContractPage,EditContractPage,ContractDetailsPage}.jsx`
- `src/modules/reviews/pages/ReviewsPage.jsx`
- `src/modules/auth/pages/ResetPasswordPage.jsx` (legacy module alias exists)
- `src/modules/admin/pages/{PayoutQueuePage,SkillsAssessmentManagement}.jsx`
- `src/modules/scheduling/pages/TempSchedulingPage.jsx`

### Recommendation order
1. Route-contract fixes (`/search`, `/contracts/*`, `/profile/upload-cv`, support docs/community)
2. Remove/guard production debug logs in `SearchPage` + `JobsPage`
3. Replace direct `fetch` in profile edit flow with shared API client
4. Decide and enforce Quick-hire role policy
5. Either mount or archive dormant page modules to reduce maintenance ambiguity

---

## Hirer Flow Audit (Feb 13, 2026 – Job Posting / Job Management / Job Details)

### Scope
- `kelmah-frontend/src/modules/hirer/pages/JobPostingPage.jsx` (1113 lines)
- `kelmah-frontend/src/modules/hirer/pages/JobManagementPage.jsx` (873 lines)
- `kelmah-frontend/src/modules/jobs/pages/JobDetailsPage.jsx` (738 lines)
- `kelmah-frontend/src/modules/hirer/services/hirerSlice.js` (674 lines)
- `kelmah-frontend/src/modules/jobs/services/jobsService.js` (405 lines)
- `kelmah-frontend/src/modules/jobs/services/jobSlice.js` (200 lines)
- `kelmah-frontend/src/modules/jobs/components/job-application/JobApplication.jsx` (1035 lines)
- `kelmah-frontend/src/routes/config.jsx` (routing verification)
- `kelmah-backend/services/job-service/routes/job.routes.js` (route surface)
- `kelmah-backend/services/job-service/controllers/job.controller.js` (getMyJobs response shape)

### Data Flow Traces

#### Job Posting (Create Flow)
```
Hirer clicks "Post a New Job" on JobManagementPage
  → navigate('/hirer/jobs/post')
  → Router: ProtectedRoute(roles=['hirer','admin']) → JobPostingPage
  → Multi-step wizard: title/category → description/skills → budget/duration → location → review
  → handleSubmit(asDraft=false) builds canonical payload
  → dispatch(createHirerJob(payload))
  → hirerSlice.js: api.post('/jobs', jobData)
  → Gateway → job-service POST / → createJob controller
  → Response: job doc → state.jobs.draft.unshift(newJob)
  → UI: success screen with "Manage Jobs" / "Post Another Job" CTAs
```

#### Job Posting (Edit Flow)
```
Hirer clicks "Edit Job" on JobManagementPage
  → navigate(`/hirer/jobs/edit/${jobId}`)
  → Router: ProtectedRoute(roles=['hirer','admin']) → JobPostingPage (isEditMode=true)
  → useEffect hydrates formData from Redux store hirerJobsByStatus
  → handleSubmit() builds payload
  → dispatch(updateHirerJob({ jobId, updates: payload }))
  → hirerSlice.js: api.put(`/jobs/${jobId}`, updates)
  → Gateway → job-service PUT /:id → updateJob controller
  → Response: updated job → hirerSlice places in correct status bucket
```

#### Job Management (List/Filter/Actions)
```
Hirer opens /hirer/jobs → JobManagementPage
  → useEffect: dispatch fetchHirerJobs for each canonical status
  → hirerSlice: api.get('/jobs/my-jobs', { params: { status, role: 'hirer' } })
  → Gateway → job-service GET /my-jobs → getMyJobs controller (native MongoDB)
  → Response: paginatedResponse with normalized jobs (id + _id both present)
  → Redux: state.jobs[status] = jobs[]
  → UI: Object.values(jobsByStatus).flat() → tabs/search filter → table/cards
```

#### Job Details (Public View)
```
User opens /jobs/:id → ProtectedRoute → JobDetailsPage
  → dispatch(fetchJobById(id))
  → jobSlice → jobsService.getJobById(id) → api.get(`/jobs/${id}`)
  → Gateway → job-service GET /:id([a-fA-F0-9]{24}) → getJobById (PUBLIC)
  → Non-destructive normalization: skills/dates/hirer_name compatibility
  → Redux: state.currentJob = normalized job
  → UI: details paper with map embed, budget, skills, hirer profile, apply/save/share
```

### Findings – Fixed ✅

#### 1) JobDetailsPage: `handleMessageHirer` used wrong query param
- **Severity**: High
- **Where**: JobDetailsPage.jsx
- **Root cause**: navigated to `/messages?participantId=...` but MessageContext expects `?recipient=...`
- **Fix**: changed to `navigate(\`/messages?recipient=\${...}\`)`
- **Status**: Fixed ✅

#### 2) JobDetailsPage: debug `console.log` in production
- **Severity**: Medium
- **Where**: JobDetailsPage.jsx (budget debug logging effect)
- **Fix**: wrapped in `import.meta.env.DEV` guard
- **Status**: Fixed ✅

#### 3) JobDetailsPage: `job.hirer?.rating?.toFixed(1)` crash risk
- **Severity**: Medium
- **Where**: JobDetailsPage.jsx (sidebar "About the Client")
- **Root cause**: `toFixed(1)` crashes if `rating` is a string/null/non-number
- **Fix**: added explicit `typeof === 'number'` guard
- **Status**: Fixed ✅

#### 4) JobManagementPage: `job.hourlyRate` undefined → `$undefined/hr`
- **Severity**: High
- **Where**: JobManagementPage.jsx (MobileJobCard + desktop table)
- **Root cause**: backend returns `budget` (object or number) + `paymentType`, not `hourlyRate`
- **Fix**: replaced with proper budget shape extraction and paymentType-aware formatting
- **Status**: Fixed ✅

#### 5) JobManagementPage: `job.postedDate` / `job.expiryDate` undefined
- **Severity**: High
- **Where**: JobManagementPage.jsx (desktop table cells)
- **Root cause**: backend returns `createdAt` and `endDate`, not `postedDate`/`expiryDate`
- **Fix**: mapped to `toLocaleDateString()` with `—` fallbacks
- **Status**: Fixed ✅

#### 6) JobManagementPage: `job.applications?.length` always 0
- **Severity**: Medium
- **Where**: JobManagementPage.jsx (badge counts)
- **Root cause**: `getMyJobs` doesn't populate `applications` array
- **Fix**: added fallback chain `applicantCount || proposalCount || applications?.length || 0`
- **Status**: Fixed ✅

#### 7) JobPostingPage: page title shows "Post a Job" in edit mode
- **Severity**: Medium
- **Where**: JobPostingPage.jsx (Helmet + heading)
- **Fix**: conditional text based on `isEditMode`
- **Status**: Fixed ✅

#### 8) JobPostingPage: edit-mode budget hydration lossy for hourly
- **Severity**: Medium
- **Where**: JobPostingPage.jsx (edit mode useEffect)
- **Root cause**: only set `max` from existing data; `min` stayed empty
- **Fix**: hydrates both `min` and `max` from `existing.budget.min/max` with fallback
- **Status**: Fixed ✅

### Findings – Open ❌

#### 9) JobApplication component doesn't honor `open`/`onClose`/`jobId` props
- **Severity**: Critical (UX)
- **Where**: JobDetailsPage + JobApplication.jsx
- **What**: `JobDetailsPage` renders `<JobApplication open={applicationOpen} onClose={...} jobId={...} />` but `JobApplication` ignores all props — uses `useParams()` for `jobId` and renders as inline page form, not a dialog. The `open` state from "Apply Now" click has no effect; form is always visible when `job` exists.
- **Fix needed**: refactor `JobApplication` to accept props and render inside `<Dialog>`, or gate rendering with `{applicationOpen && <JobApplication />}`

#### 10) JobDetailsPage: hardcoded dark theme colors throughout
- **Severity**: Medium
- **What**: `#FFD700`, `#1a1a1a`, `#fff`, `#4caf50`, `#ff9800` used everywhere; breaks theme switching
- **Fix needed**: replace with `theme.palette.*` tokens

#### 11) Google Maps embed shown even for remote jobs
- **Severity**: Low
- **What**: iframe renders with fallback "Ghana" for vague/remote locations
- **Fix needed**: conditionally hide when `locationType === 'remote'`

#### 12) JobPostingPage: skills input accepts unlimited skills
- **Severity**: Low
- **What**: helper says "up to five" but no limit enforced
- **Fix needed**: cap `newSkills.slice(0, 5)` in `handleSkillsChange`

#### 13) No loading guard in edit mode before Redux hydration
- **Severity**: Low
- **What**: direct navigation to edit URL with empty Redux store shows blank form
- **Fix needed**: dispatch fetch + show loader until data arrives

#### 14) hirerSlice `initialState.jobs` has stale `active` key
- **Severity**: Low
- **What**: `active: []` never populated; all fetches use canonical statuses (`open`, etc.)
- **Fix needed**: rename to `open` or remove

#### 15) Tab badge counts recompute on every render
- **Severity**: Low
- **What**: six `jobs.filter(...)` calls inline per render
- **Fix needed**: memoize counts via `useMemo`

### Verification
- Frontend production build: **PASS** (`npx vite build`, built in 5m 4s)
- VS Code diagnostics: no errors in modified files
- Route wiring verified: `/hirer/jobs` → JobManagementPage, `/hirer/jobs/post` → JobPostingPage, `/hirer/jobs/edit/:jobId` → JobPostingPage, `/jobs/:id` → JobDetailsPage
- Backend route order verified: no shadowing issues between specific and parameterized routes
---

## Worker Flow Audit (Dashboard, Find Work, My Applications)

**Audit Date**: 2025-06-13
**Auditor**: AI Agent
**Scope**: WorkerDashboardPage, JobSearchPage, MyApplicationsPage + workerSlice.js, applicationsService.js
**Build**: PASS (exit 0, ~2min)

### Files Audited
- `WorkerDashboardPage.jsx` (573->569 lines)
- `JobSearchPage.jsx` (1063 lines, read-only)
- `MyApplicationsPage.jsx` (819->860 lines)
- `workerSlice.js` (400 lines, read-only)
- `applicationsService.js` (106 lines, read-only)
- `Application.js` (model status enum verified)
- `config.jsx` (worker route wiring verified)

### Data Flow Traces

#### Worker Dashboard
Page mounts -> dispatches fetchWorkerApplications(pending/accepted/rejected) + fetchWorkerJobs(completed)
-> workerSlice thunks -> GET /api/jobs/applications/me?status=X, GET /api/jobs/assigned?status=X
-> Redux state.worker.applications/jobs -> Stats + Pie charts

#### Job Search (Find Work)
Page mounts -> useJobsQuery(filters) -> jobsService.getJobs() -> GET /api/jobs?params
-> useSavedJobsQuery() -> GET /api/jobs/saved
-> Client-side sort + budget filter -> FindWorkJobCard renders

#### My Applications
Page mounts -> applicationsService.getMyApplications() -> GET /api/jobs/applications/me
-> Backend Application[] populated with job {title, category, budget, location, status}
-> Filtered by tab status (pending|under_review|accepted|rejected|withdrawn)

### Fixed Findings (10 items)

1) MyApplicationsPage - Status tabs mismatched backend enum (HIGH) FIXED
   - Tabs used interview/offer but model enum is pending/under_review/accepted/rejected/withdrawn

2) MyApplicationsPage - Status labels wrong for backend values (HIGH) FIXED
   - getStatusInfo() remapped to match Application model statuses

3) MyApplicationsPage - Desktop table crashes on null job (HIGH) FIXED
   - Added optional chaining: application.job?.title, application.job?.location?.city

4) MyApplicationsPage - Desktop table used nonexistent company field (MEDIUM) FIXED
   - Changed Company column to Category showing application.job?.category

5) MyApplicationsPage - Desktop row key unsafe (MEDIUM) FIXED
   - Changed to application.id || application._id

6) MyApplicationsPage - Browse Jobs button non-functional (MEDIUM) FIXED
   - Added onClick navigate to /worker/find-work

7) MyApplicationsPage - Timeline used fake interviewDate calculations (MEDIUM) FIXED
   - Rewrote to use real updatedAt/createdAt and correct statuses

8) MyApplicationsPage - Detail dialog used nonexistent fields (MEDIUM) FIXED
   - Changed jobTitle/company/salary to job?.title/job?.category/proposedRate

9) WorkerDashboardPage - Dead imports removed (LOW) FIXED
   - Removed Chip, HelpOutlineIcon, TrendingUpIcon

10) WorkerDashboardPage - Unused activeJobs variable + wasted API call (MEDIUM) FIXED
    - Removed variable and dispatch(fetchWorkerJobs('active'))

### Open Findings (8 items, not fixed)

11) WorkerDashboardPage - Earnings chart always zeros (HIGH)
    - earningsData reads user.monthlyEarnings etc. which don't exist on auth user

12) WorkerDashboardPage - Stats earnings card always GH0 (MEDIUM)
    - user.totalEarnings doesn't exist on auth user

13) workerSlice - updateWorkerSkills thunk is GET pretending to be update (HIGH)
    - Receives skills param but just does a GET

14) workerSlice - submitWorkerApplication.fulfilled pushes wrong shape (MEDIUM)
    - Should return response.data.data not response.data

15) workerSlice - jobs.available never populated (LOW, dead state)

16) workerSlice - Portfolio reducers have no async thunks (LOW)

17) MyApplicationsPage - handleSendMessage non-functional (MEDIUM)
    - Only closes dialog, doesn't call messaging API

18) JobSearchPage - Clean, no issues found (PASS)

### Verification
- Frontend production build: PASS (exit code 0, ~2min)
- VS Code diagnostics: no errors in modified files
- Routes verified: /worker/dashboard, /worker/find-work, /worker/applications
- Application model enum confirmed: pending, under_review, accepted, rejected, withdrawn
