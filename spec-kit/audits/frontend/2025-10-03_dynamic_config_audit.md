# File Audit: `kelmah-frontend/src/config/dynamicConfig.js`
**Audit Date:** October 3, 2025  
**Auditor:** AI Development Agent  
**Primary Status:** 🔄 In Progress (must fix before rollout)

---

## Primary Analysis
- **Purpose:** Supplies asynchronous and synchronous helpers that surface the active tunnel (LocalTunnel/ngrok) URL, API base URL, and WebSocket host. The module is meant to bridge backend automation updates into the React runtime without a rebuild.
- **Core Responsibilities:**
  - Resolve the gateway URL via `getCurrentNgrokUrl`, falling back across runtime config, LocalStorage, and environment variables.
  - Provide async/sync WebSocket URL helpers (`getWebSocketUrl`, `getWebSocketUrlSync`).
  - Update stored tunnel URLs when automation scripts push changes (`updateNgrokUrl`).
- **Key Dependencies:**
  - Imports `getApiBaseUrl` from `environment.js`, creating a circular dependency because `environment.js` synchronously imports `getWebSocketUrlSync` from this module.
  - Relies on `/runtime-config.json` (updated by LocalTunnel automation) and browser-local storage (`kelmah_ngrok_url`).
  - Consumes Vite environment variables such as `import.meta.env.VITE_API_URL`, `VITE_NGROK_URL`, `VITE_MESSAGING_SERVICE_URL`, `VITE_WS_URL`.
- **Key Consumers:**
  - `environment.js` synchronous WebSocket config.
  - Messaging/socket services that call the exported helpers directly.
- **Data Contracts:**
  - Async helpers should return absolute URLs when the tunnel is active; otherwise `null` so callers can fall back to `/api` or default Socket.IO behavior.
  - LocalStorage key `kelmah_ngrok_url` is assumed to contain an HTTPS base.

---

## Secondary Files Reviewed
| File | Relationship | Status | Notes |
| --- | --- | --- | --- |
| `src/config/environment.js` | Imports `getWebSocketUrlSync`, causing a circular import chain. | ⚠️ Issues Found | Needs refactor to break loop (defer sync helper or co-locate in single module). |
| `public/runtime-config.json` | Source of `ngrokUrl`/`websocketUrl` consumed here. | ⚠️ Issues Found | Field names still reference ngrok; should align with LocalTunnel terminology. |
| `spec-kit/audits/frontend/2025-10-03_services_config_audit.md` | Prior findings highlighting duplicated socket logic. | ✅ Reviewed | Confirms consolidation priority. |

---

## Issues Identified
- **Connectivity:**
  1. `getApiUrl` returns `null` when no tunnel URL is present, rather than defaulting to `/api`. Callers expecting a usable base URL will fail requests.
  2. `getWebSocketUrl` mirrors the same behavior, leaving consumers with `null` even though the gateway `/socket.io` endpoint is accessible.
- **Responsibility:**
  1. Circular dependency between `dynamicConfig.js` and `environment.js` risks `undefined` exports during module initialization (especially in SSR or testing contexts).
  2. Module attempts to serve as both tunnel resolver and environment detector, overlapping with logic already present in `environment.js` and `services.js`.
- **Duplication:**
  1. WebSocket URL derivation logic duplicates what `environment.js` already exports via `WS_CONFIG`, creating two diverging sources of truth.
  2. Tunnel fallback order (runtime-config → LocalStorage → env) is reimplemented instead of delegating to a single shared helper.
- **Communication:**
  1. Persistent `ngrok` naming in functions, logs, LocalStorage keys, and runtime config fetch contradicts the LocalTunnel standard documented in spec-kit.
  2. Console logging (e.g., "🎯 Production mode") outputs in production builds, adding noise to logs.
- **Documentation:**
  1. No inline comments or README references explaining the precedence order or expected automation touchpoints (LocalTunnel script, runtime config injection).

---

## Actions & Recommendations
- **Immediate Fixes:**
  - Provide safe fallbacks (`/api`, `/socket.io`) when tunnel detection fails, preventing callers from receiving `null`.
  - Wrap console logging behind environment checks or remove entirely in production builds.
- **Refactors / Consolidation:**
  - Break circular dependency by moving synchronous WebSocket helper into `environment.js` (lazy initialization) or exporting a shared helper from a new `config/tunnel.js` module.
  - Rename functions/keys from `ngrok` to neutral terms (`tunnelUrl`, `gatewayUrl`) and update automation scripts plus runtime config.
  - Centralize tunnel resolution so `environment.js`, `services.js`, and messaging hooks consume the same source of truth.
- **Follow-up Tickets:**
  - Create tasks to consolidate configuration modules (environment/services/dynamicConfig) after immediate fallbacks and port/path fixes land.
  - Review LocalStorage usage—consider expiring or clearing stale tunnel URLs to avoid drift when URLs rotate.
  - Document the runtime config update pipeline in `spec-kit/audit-inventory/frontend-inventory.md` and related playbooks.

---

**Next Primary Audit Candidate:** Frontend Core API layer (`src/modules/common/services/axios.js`) to verify it handles the updated fallback logic once configuration modules are refactored.
