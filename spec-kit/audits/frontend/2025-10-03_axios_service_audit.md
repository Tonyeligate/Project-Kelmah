# File Audit: `kelmah-frontend/src/modules/common/services/axios.js`
**Audit Date:** October 3, 2025  
**Auditor:** AI Development Agent  
**Primary Status:** 🔄 In Progress (blocking gaps remain before rollout)

---

## Primary Analysis
- **Purpose:** Centralizes HTTP transport for the React app via a lazily-initialized axios instance, adds auth/error interceptors, and exposes convenience wrappers plus service-specific clients.
- **Core Responsibilities:**
  - Resolve the current API Gateway base URL through `getApiBaseUrl()` and reuse it for all requests.
  - Inject auth tokens and diagnostic metadata on every outbound call.
  - Retry idempotent requests on transient failures with exponential backoff and service health context.
  - Surface helper clients (`authServiceClient`, `jobServiceClient`, etc.) that mirror backend microservices.
- **Key Dependencies:**
  - `config/environment` for base URL detection, service registry, timeouts, and logging flags.
  - `utils/secureStorage` for JWT access/refresh tokens and session clearing.
  - `utils/serviceHealthCheck` for retry diagnostics (`handleServiceError`, `getServiceStatusMessage`).
- **Key Consumers:**
  - All hooks/components invoking `apiGet/apiPost/...` helpers across modules.
  - Domain services under `src/modules/**/services/` that call the exported service clients.
  - Messaging layer indirectly via axios-based fallbacks.
- **Data Contracts:**
  - Request helpers expect string URLs (relative to gateway) and optional data/config payloads.
  - Retry enhancer assumes `config.baseURL` describes a service name used by health reporter.
  - Token refresh endpoint hard-coded at `${baseURL}/api/auth/refresh-token`.

---

## Secondary Files Reviewed
| File | Relationship | Status | Notes |
| --- | --- | --- | --- |
| `src/config/environment.js` | Supplies `getApiBaseUrl`, `SERVICES`, and logging/timeouts. | ⚠️ Issues Found | Still exports `/api/messages/messages` duplication and port swap called out in earlier audits. Coupling means axios inherits those inaccuracies.
| `src/utils/serviceHealthCheck.js` | Provides `handleServiceError` and status cache referenced during retries. | ✅ Reviewed | Functions expect service URLs keyed by `SERVICES` map; retry logs align with health report contract.
| `src/utils/secureStorage.js` | Read/write tokens for interceptors and refresh handling. | ✅ Reviewed | No new issues spotted; continues to expose synchronous getters required here.

---

## Issues Identified
- **Connectivity & Environment Drift:**
  1. **Stale Tunnel Risk:** `initializeAxios` and `initializeServiceClients` capture the base URL only on first access; when LocalTunnel rotates mid-session the clients never refresh, leaving the app pinned to the expired host. No listener exists for the automation update pipeline documented in spec-kit.
  2. **Legacy Header:** Every client forces `'ngrok-skip-browser-warning': 'true'`, including the job client which adds it twice. LocalTunnel no longer requires this header and some upstream proxies strip unknown headers, wasting bandwidth and causing audit warnings.
  3. **Comment Drift:** Multiple comments still describe "ngrok compatibility" for `withCredentials` and headers, conflicting with the 2025 LocalTunnel migration and confusing future maintainers.
- **Responsibility & Duplication:**
  1. Token refresh posts to `${baseURL}/api/auth/refresh-token`; when `baseURL` is already `/api` the request becomes `/api/api/auth/...`, saved only by the `normalizeUrlForGateway` helper. This implicit coupling duplicates URL normalization logic that should live inside a shared gateway helper.
  2. Service-specific clients repeat the same interceptor wiring already handled by the main axios instance. There is no safeguard preventing diverging behavior (e.g., retries or headers) between helpers.
- **Observability:**
  1. Console logging for retry attempts and request metadata is always active when `LOG_CONFIG.enableConsole` is true, but no throttling exists; repeated retries can spam the console with large payload dumps, obscuring actionable errors.
- **Documentation & Safety Nets:**
  1. No inline notes or README coverage describes how to reset the cached clients when runtime configuration changes, nor guidance on integrating with the LocalTunnel automation.
  2. Missing tests for retry/backoff to guarantee that the synthesized success for escrow 501s keeps working once the payment service ships real endpoints.

---

## Actions & Recommendations
- **Immediate Fixes:**
  - Introduce a `resetAxiosClients()` helper that re-runs `initializeAxios` and service client creation when the automation script broadcasts a tunnel change event.
  - Drop the `'ngrok-skip-browser-warning'` header and update comments to reference LocalTunnel, aligning with active infrastructure.
  - Centralize normalization so both refresh flow and service clients share a single gateway-aware URL builder.
- **Refactors / Consolidation:**
  - Evaluate collapsing service-specific clients into thin wrappers around the primary axios instance to avoid interceptor drift and duplicated retry logic.
  - Document the retry policy (timeouts, jitter, synthetic escrow response) inside spec-kit and consider feature-flagging once payment endpoints launch.
  - Coordinate with the environment/services config refactor so that axios consumes the finalized tunnel resolver rather than ad-hoc helpers.
- **Follow-up Tickets:**
  - Add integration tests simulating LocalTunnel rotation to ensure the reset logic works.
  - Audit downstream consumers to remove any leftover `'ngrok-skip-browser-warning'` usage.
  - Ensure payment service launch includes removing the temporary 501 -> 200 shim.

---

**Next Primary Audit Candidate:** Frontend domain service layer (`src/modules/**/services/`) beginning with shared worker/hirer service wrappers to confirm they rely on the canonical axios helpers.
