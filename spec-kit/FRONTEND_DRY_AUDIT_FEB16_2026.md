# Frontend Dry Audit — February 16, 2026

## Scope
- Audited frontend surface requested by user:
  - `kelmah-frontend/src/components`
  - `kelmah-frontend/src/config`
  - `kelmah-frontend/src/constants`
  - `kelmah-frontend/src/data`
  - `kelmah-frontend/src/hooks`
  - `kelmah-frontend/src/modules`
  - `kelmah-frontend/src/pages`
  - `kelmah-frontend/src/routes`
  - `kelmah-frontend/src/services`
  - `kelmah-frontend/src/services_backup_audit_20251013_015855`
  - `kelmah-frontend/src/store`
  - `kelmah-frontend/src/styles`
  - `kelmah-frontend/src/tests`
  - `kelmah-frontend/src/theme`
  - `kelmah-frontend/src/utils`
- Inventory summary:
  - Active page files: 60 (`src/pages` + `src/modules/**/pages`)
  - Backup page files: 2 (`src/services_backup_audit_20251013_015855/**/pages`)
  - Frontend source files discovered: 410

## High-Impact Findings (Prompt3/5/6 Criteria)

### 1) Missing route for apply flow (broken navigation)
- **Severity**: High
- **Location**:
  - `kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx` (navigates to `/jobs/${job.id}/apply`)
  - `kelmah-frontend/src/routes/config.jsx` (no `/jobs/:id/apply` route)
- **What’s wrong**:
  - Jobs listing CTA navigates to a route that is not declared in active router config.
- **Failure scenario**:
  - Worker clicks “Apply” from Jobs page and hits app 404.
- **Fix**:
  - Add explicit route `/jobs/:id/apply` wired to the intended application component (or route to `JobDetailsPage` anchored application panel).

### 2) Bid real-time hook never connects websocket service
- **Severity**: High
- **Location**:
  - `kelmah-frontend/src/modules/jobs/hooks/useBidNotifications.js`
  - `kelmah-frontend/src/services/websocketService.js`
- **What’s wrong**:
  - Hook only registers listeners; it never calls `websocketService.connect(...)`.
  - Result: listeners are attached to an unconnected singleton.
- **Failure scenario**:
  - No bid toast/real-time updates even when backend emits events.
- **Fix**:
  - Add centralized socket bootstrap (single place after auth) or connect/disconnect in hook via authenticated user/token.

### 3) Endpoint config duplication and drift (two API endpoint sources)
- **Severity**: High
- **Location**:
  - `kelmah-frontend/src/config/environment.js` (`API_ENDPOINTS` defined)
  - `kelmah-frontend/src/config/services.js` (`API_ENDPOINTS` also defined)
  - Consumers split across both files
- **What’s wrong**:
  - Multiple endpoint authorities increase path drift and silent breakage.
- **Failure scenario**:
  - Some modules work while others call stale or malformed paths after backend/gateway updates.
- **Fix**:
  - Consolidate to one canonical endpoint map and migrate all imports to it.

### 4) Defective service-path composition in secondary config
- **Severity**: Medium
- **Location**: `kelmah-frontend/src/config/services.js`
- **What’s wrong**:
  - `getServicePath('JOB_SERVICE', '/jobs')` can produce `/jobs/jobs`.
- **Failure scenario**:
  - Any consumer using this map for job routes gets incorrect endpoints.
- **Fix**:
  - Normalize path join logic and eliminate duplicated route segments.

### 5) Runtime config loader is effectively unused for API base URL
- **Severity**: Medium
- **Location**: `kelmah-frontend/src/config/environment.js`
- **What’s wrong**:
  - `loadRuntimeConfig()` exists, but API base export is resolved synchronously and async loader has no active consumers.
- **Failure scenario**:
  - LocalTunnel/runtime URL changes are not applied at runtime as intended.
- **Fix**:
  - Bootstrap runtime config before app mounts (or persist/reload via dedicated initialization module).

### 6) Security model for token storage is vulnerable to XSS exfiltration
- **Severity**: High
- **Location**: `kelmah-frontend/src/utils/secureStorage.js`
- **What’s wrong**:
  - Encryption key material and encrypted payload live in browser storage. Any XSS can read both and decrypt tokens.
- **Attack scenario**:
  - Injected script steals refresh/access tokens from localStorage/sessionStorage path.
- **Fix**:
  - Prefer HttpOnly, Secure, SameSite cookies for auth; treat client-side encryption as obfuscation only.
- **Reference**:
  - OWASP ASVS (session/token protection), CWE-922 (sensitive data in client storage), CWE-79 (XSS enabling theft).

### 7) Sensitive/runtime verbosity in production paths
- **Severity**: Medium
- **Location**:
  - `src/services/websocketService.js`
  - `src/modules/messaging/contexts/MessageContext.jsx`
  - `src/utils/pwaHelpers.js`
  - `src/utils/serviceHealthCheck.js`
  - `src/modules/jobs/pages/JobsPage.jsx`
- **What’s wrong**:
  - Extensive `console.log` of payloads, connection details, and internal state.
- **Attack scenario**:
  - Browser console and shared device logs can expose behavior details and metadata.
- **Fix**:
  - Gate logs behind strict debug flag and redact payload content.
- **Reference**:
  - CWE-532 (sensitive info in logs).

### 8) Multiple parallel Socket.IO clients per user session
- **Severity**: Medium
- **Location**:
  - `MessageContext` creates socket
  - `NotificationService` creates socket
  - `DashboardService` creates socket
  - `websocketService` singleton exists separately
- **What’s wrong**:
  - No single socket broker; each feature may open its own channel.
- **Failure scenario**:
  - Extra server load, duplicate events, increased reconnect storms on network instability.
- **Fix**:
  - Consolidate to one socket manager with multiplexed feature subscriptions.

### 9) Module-level intervals/listeners without lifecycle owner
- **Severity**: Medium
- **Location**: `kelmah-frontend/src/utils/serviceHealthCheck.js`
- **What’s wrong**:
  - `initializeServiceHealth()` is auto-invoked on module load and sets interval/event listener without teardown handle.
- **Failure scenario**:
  - Duplicate checks in HMR/re-mount patterns; noisy network and memory overhead.
- **Fix**:
  - Expose start/stop lifecycle and call from top-level provider/component with cleanup.

### 10) Legacy route/page leftovers create confusion and incomplete fix risk
- **Severity**: Medium
- **Location**:
  - `src/modules/home/pages/HomePage.jsx` (not routed in active config)
  - `src/services_backup_audit_20251013_015855/**` contains legacy route definitions (including `/jobs/:id/apply`)
- **What’s wrong**:
  - Active app and backup snapshots diverge, causing contributors to patch wrong files.
- **Failure scenario**:
  - Fix applied to backup path only; production remains broken.
- **Fix**:
  - Tag backup tree as non-runtime, enforce lint/CI ignore rules, and add architecture note for active routing source of truth.

## Edge-Case Breakpoints
- Auth refresh race across tabs can produce inconsistent token/user state because token scheduling is timer-based and storage-backed.
- Any user journey relying on `/jobs/:id/apply` deep-link fails until route exists.
- Cold-start + multi-socket reconnect can create burst retries and notification noise.
- LocalTunnel/runtime URL rotation may not propagate due to sync-first API base resolution.

## Prompt4 — Approach Evaluation

### Top 3 Risks
1. **Config fragmentation risk**: duplicated API/WS config maps.
2. **Runtime wiring risk**: unconnected bid notification service + missing apply route.
3. **Security posture risk**: token persistence in JS-readable storage.

### What breaks first at 10x scale
1. Socket fan-out/reconnect pressure from multiple independent socket clients.
2. Polling/interval overlap (`jobs`, `health`, `dashboard`, `tracking`) amplifying backend load.
3. Client-side logging/diagnostic overhead and noisy retries harming UX.

### Simplest version to ship first (MVP hardening)
1. Add missing apply route and verify all apply entry points.
2. Introduce single socket manager and migrate bid/notification/dashboard listeners.
3. Collapse endpoint config to one module and run a path validation smoke suite.
4. Remove production payload logs and keep debug-only gated logging.

### Alternatives
- Keep current feature modules but add an internal adapter layer (`apiRoutes.ts` + `socketGateway.ts`) to isolate existing code from URL drift.
- If full cookie auth is too large now, move refresh token to HttpOnly first and keep short-lived access token in memory.

### With more time vs less time
- **Less time**: route fix + socket bootstrap + endpoint consolidation + log cleanup.
- **More time**: auth storage redesign (cookie-based), typed API contracts, route contract tests, and dead-code archival automation.

## Prompt7 — Migration Checklist (Old → Stable Unified Frontend Wiring)

### Ordered Steps (riskiest first)
1. **Route compatibility first**: add `/jobs/:id/apply` and keep existing `/jobs/:id` behavior.
2. **Single endpoint source**: choose `config/environment.js` (or dedicated `config/apiRoutes.js`) as canonical.
3. **Refactor imports**: migrate all `API_ENDPOINTS` consumers to canonical source.
4. **Socket unification**: introduce one socket provider/manager; migrate bid + notifications + dashboard.
5. **Security pass**: move refresh token handling away from JS-readable storage.
6. **Delete/lock legacy references**: clearly isolate backup tree and prevent runtime imports.

### Breaking changes to watch
- Any module importing `API_ENDPOINTS` from `config/services.js`.
- Any deep-links expecting legacy `/messages/:id` vs query param format.
- Any direct route navigation expecting component routes removed from legacy route files.

### Rollback plan
- Keep adapter aliases for old endpoint keys one release cycle.
- Keep legacy route aliases while telemetry confirms no active hits.
- Feature-flag socket broker rollout (fall back to existing context sockets if needed).

### Validation tests
- Route smoke: `/jobs/:id`, `/jobs/:id/apply`, `/worker/*`, `/hirer/*`, `/payment/*`, `/contracts/*`.
- Auth smoke: login, refresh, logout, multi-tab behavior.
- Realtime smoke: bid event toast, message receive, notification receive, dashboard event.
- API path smoke: scripted check for all exported endpoint constants resolving to reachable gateway routes.

## Prompt8 — Structure Analysis (Frontend)

### Architecture
- Modular frontend monolith (domain-driven feature modules) with centralized gateway API integration.

### Entry points
- `kelmah-frontend/src/main.jsx`
- `kelmah-frontend/src/App.jsx`
- `kelmah-frontend/src/routes/config.jsx`

### 5 most important folders/files
1. `src/routes/config.jsx` — route graph and auth gates.
2. `src/services/apiClient.js` — request, auth header, refresh behavior.
3. `src/config/environment.js` — API/WS/environment and endpoint constants.
4. `src/modules/auth/services/authSlice.js` — auth state lifecycle.
5. `src/modules/messaging/contexts/MessageContext.jsx` — high-traffic realtime messaging orchestration.

### Data flow (summary)
- UI page/component → domain service/hook/context → `apiClient`/socket client → API gateway `/api/*` + socket endpoint → Redux/context state update → re-render.

### External dependencies
- API Gateway endpoints under `/api/*`.
- Socket.IO backend over runtime-derived URL.
- Third-party map tile/search services via `EXTERNAL_SERVICES`.

### Maintenance red flags
- Duplicate endpoint authorities.
- Multiple websocket clients and unowned intervals.
- Active + backup trees with overlapping responsibilities.
