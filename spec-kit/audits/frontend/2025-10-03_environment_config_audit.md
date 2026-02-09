# File Audit: `kelmah-frontend/src/config/environment.js`
**Audit Date:** October 3, 2025  
**Auditor:** AI Development Agent  
**Primary Status:** 🔄 In Progress (frontend configuration stack flagged for targeted fixes)

---

## Primary Analysis
- **Purpose:** Centralizes runtime environment detection, feature flags, and service endpoint construction for the entire React frontend.
- **Core Responsibilities:**
  - Resolve API and WebSocket base URLs via `computeApiBase`, honoring LocalTunnel/ngrok runtime configs and manual overrides.
  - Export shared configuration objects (`APP_CONFIG`, `FEATURES`, `AUTH_CONFIG`, etc.) consumed by modules, hooks, and Redux slices.
  - Build canonical REST endpoint maps (`API_ENDPOINTS`) for auth, user, job, messaging, and payment domains.
- **Key Dependencies:**
  - `./services` for environment-specific microservice host mappings.
  - `./dynamicConfig` for synchronous WebSocket URL detection (introduces a circular import with `environment.js`).
  - Browser runtime config at `/runtime-config.json` (managed by LocalTunnel automation).
  - `import.meta.env` and Vite compile-time constants.
- **Key Consumers:**
  - `src/modules/common/services/axios.js` (baseURL, auth config, performance timeouts).
  - Feature services and hooks referencing `API_ENDPOINTS` and `SERVICES`.
  - Socket initialization flows via `WS_CONFIG`.
- **Data Contracts:**
  - `getApiBaseUrl()` returns a promise resolving to a string base URL (`/api` default).
  - `API_ENDPOINTS` expose string constants; some entries expect higher-level services to append IDs via callbacks (e.g., `JOB.BY_ID(id)`).
  - `SERVICES` maps service identifiers to absolute or relative base URLs, varying by environment.
- **Error Handling Strategy:**
  - Wrapped `fetch` around runtime config with warning logs on failure and fallback to `/api`.
  - Console logs enabled in development via `LOG_CONFIG.enableConsole`; several informational logs remain active in production paths.

---

## Secondary Files Reviewed
| File | Relationship | Status | Notes |
| --- | --- | --- | --- |
| `src/config/services.js` | Supplies development vs production host maps and helper builders (`getServicePath`, `getWebSocketUrl`). | ⚠️ Issues Found | Dev port map misaligned with gateway conventions; helper path duplication. Requires dedicated primary audit. |
| `src/config/dynamicConfig.js` | Provides async/sync helpers for tunnel/WebSocket URLs; imports `getApiBaseUrl`. | ⚠️ Issues Found | Circular import with `environment.js`; redundant runtime-config fetch logic. Follow-up primary audit recommended. |
| `public/runtime-config.json` | LocalTunnel automation artifact consumed by `loadRuntimeConfig`. | ✅ Reviewed | Schema matches loader expectation; terminology still references `ngrok`. |

---

## Issues Identified
- **Connectivity:**
  1. `services.js` sets `MESSAGING_SERVICE` to `http://localhost:5004` and `PAYMENT_SERVICE` to `http://localhost:5005`, reversing the documented gateway ports (payment should be 5004, messaging 5005). This breaks local messaging traffic during audits.
  2. `getServicePath('MESSAGING_SERVICE', '/messages')` produces `/api/messages/messages`, duplicating the path segment and diverging from gateway routing (`/api/messages`).
  3. `API_ENDPOINTS.MESSAGING.*` inherit the duplicated path, so consumers hitting `API_ENDPOINTS.MESSAGING.MESSAGES` will fail against the gateway proxy.
- **Responsibility:**
  1. `environment.js` exports a full `API_ENDPOINTS` map while `services.js` exposes similar endpoint builders, causing parallel configurations to drift.
  2. Runtime config logging (`console.log`, `console.warn`) executes in production contexts; noisy logs should be scoped to development.
- **Duplication:**
  1. Endpoint definitions for auth/user/job/payment exist both in `environment.js` and `services.js`, creating redundant maintenance surfaces.
- **Communication:**
  1. Terminology references `ngrok` throughout (`ngrokUrl`), despite LocalTunnel being the active system, increasing confusion during handoffs.
  2. Circular dependency between `environment.js` and `dynamicConfig.js` can produce undefined exports during module initialization, especially in SSR or fast-refresh scenarios.
- **Documentation:**
  1. No inline comments describe the fallback precedence between runtime config, environment variables, and LocalStorage caching.

---

## Actions & Recommendations
- **Immediate Fixes:**
  - Correct `SERVICES` development map to align with documented ports (`MESSAGING_SERVICE` → `http://localhost:5005`, `PAYMENT_SERVICE` → `http://localhost:5004`).
  - Update `getServicePath` messaging branch to avoid duplicating `/messages` and ensure `API_ENDPOINTS` route through the gateway correctly.
  - Guard production console logging behind `LOG_CONFIG.enableConsole` or explicit environment checks.
- **Refactors / Consolidation:**
  - Consolidate endpoint builders to a single module (either keep `environment.js` authoritative or fully delegate to `services.js`).
  - Break the circular dependency by moving synchronous WebSocket resolver to `dynamicConfig.js` and importing it lazily where needed.
  - Rename runtime config fields (and corresponding loader messaging) from `ngrokUrl` to `tunnelUrl`/`gatewayUrl` to reflect LocalTunnel adoption.
- **Follow-up Tickets:**
  - Schedule primary audits for `src/config/services.js` and `src/config/dynamicConfig.js` to address remaining duplication and resilience concerns.
  - Document configuration precedence and LocalTunnel automation expectations in `spec-kit/audit-inventory/frontend-inventory.md` and module-level README.

---

**Next Primary Audit Candidate:** `src/config/services.js` (pending) – ensure service routing helpers stay aligned with the API Gateway contract.
