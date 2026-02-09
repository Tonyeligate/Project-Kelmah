# File Audit: `kelmah-frontend/src/config/services.js`
**Audit Date:** October 3, 2025  
**Auditor:** AI Development Agent  
**Primary Status:** 🔄 In Progress (blocking issues identified)

---

## Primary Analysis
- **Purpose:** Central microservice configuration that maps environment-specific base URLs, exposes gateway-compatible endpoint builders, and surfaces external third-party services used across the frontend.
- **Core Responsibilities:**
  - Provide absolute service hosts for development (`localhost`) vs production (relative `/api` by default) through the `SERVICES` object.
  - Generate REST endpoint paths via `getServicePath`, abstracting gateway routing details for each domain service.
  - Supply WebSocket URLs (`getWebSocketUrl`) and third-party API endpoints consumed across modules.
- **Key Dependencies:**
  - Relies on `import.meta.env.MODE` and other Vite environment variables to determine runtime context.
  - Shares responsibility space with `src/config/environment.js` (`SERVICES`, `API_ENDPOINTS`, tunnel detection) leading to duplication.
- **Key Consumers:**
  - Frontend modules and utilities that import `SERVICES` or `API_ENDPOINTS` directly (notably older code paths predating the shared axios client).
  - `environment.js`, which re-imports `SERVICES` for endpoint construction, creating dual source-of-truth scenarios.
- **Data Contracts:**
  - Development service URLs expected to match backend port assignments (per consolidation docs: payment 5004, messaging 5005).
  - `API_ENDPOINTS` should yield gateway routes (`/api/...`) with optional service-specific rewrites handled on the backend.
- **Error Handling Strategy:** Minimal; configuration assumes valid environment values and does not guard against malformed paths or missing service keys.

---

## Secondary Files Reviewed
| File | Relationship | Status | Notes |
| --- | --- | --- | --- |
| `src/config/environment.js` | Imports `SERVICES` and redefines overlapping endpoint maps; main consumer of this config. | ⚠️ Issues Found | Parallel endpoint builders imply duplication and risk drift. |
| `api-gateway/routes/messaging.routes.js` (backend) | Defines gateway path rewrites for messaging routes. | ⚠️ Issues Found | Confirms expected frontend paths for conversations/messages. |
| `src/modules/common/services/axios.js` | Uses `getApiBaseUrl` from environment configuration; only partially relies on this module. | ✅ Reviewed | Validates expectation that `/api` base URL should not be double-prefixed. |

---

## Issues Identified
- **Connectivity:**
  1. Development host map swaps messaging and payment ports (`MESSAGING_SERVICE` → `http://localhost:5004`, `PAYMENT_SERVICE` → `http://localhost:5005`). Should align with backend consolidation (payment 5004, messaging 5005).
  2. `getServicePath('MESSAGING_SERVICE', '/messages')` returns `/api/messages/messages`, conflicting with gateway routes that expect `/api/messages`.
  3. Messaging conversation helpers (`/conversations`) do not match gateway rewrite rules (`/api/messages/conversations` → `/api/conversations`). Resulting endpoints are `/api/messages/conversations`, which the proxy transforms to `/api/conversations` – acceptable, but the base builder should reflect intent explicitly.
- **Responsibility:**
  1. Module duplicates endpoint definitions already present in `environment.js`, creating two partially diverging maps.
  2. `getServicePath` mixes gateway-aware logic with environment branching, making it hard to trace actual URLs during audits.
- **Duplication:**
  1. Payment endpoints exist both here and in `environment.js`; changes must be synchronized manually.
  2. WebSocket URL logic overlaps with `dynamicConfig.js` which already derives tunnel-based sockets.
- **Communication:**
  1. Terminology (`ngrok`) persists in dependent modules, increasing confusion about the active LocalTunnel setup.
  2. Debug console log prints all service endpoints in development; useful for auditors but noisy during normal dev runs.
- **Documentation:**
  1. No inline explanation for Vite proxy expectations or gateway rewrites, leaving path logic implicit.

---

## Actions & Recommendations
- **Immediate Fixes:**
  - Correct development service map to match API gateway ports (payment → 5004, messaging → 5005) and add unit test or lint rule to detect regressions.
  - Update `getServicePath` messaging case to avoid `/messages/messages` duplication; ensure helper returns `/api/messages${path}` only when `path` doesnt already start with `/messages`.
  - Gate development console logging behind `LOG_CONFIG.enableConsole` (via consumer) or remove to reduce noise.
- **Refactors / Consolidation:**
  - Decide on single source of truth for endpoint maps—prefer consolidating into `environment.js` and exporting typed helpers from there.
  - Extract WebSocket URL handling to `dynamicConfig.js` exclusively to remove duplication and mitigate circular dependencies.
  - Document gateway rewrite expectations (e.g., `/api/messages/conversations` → `/api/conversations`) in comments or spec-kit to guide future audits.
- **Follow-up Tickets:**
  - Schedule dedicated fix tasks for port swap and messaging path duplication (blocking frontend messaging functionality locally).
  - Plan a consolidation effort to reconcile `services.js`, `environment.js`, and `dynamicConfig.js` after immediate fixes land.
  - Update LocalTunnel automation scripts to use neutral terminology (`tunnelUrl`, `gatewayUrl`) and propagate across config modules.

---

**Next Primary Audit Candidate:** `src/config/dynamicConfig.js` (pending) – resolve tunnel detection redundancy and circular dependencies surfaced during this review.
