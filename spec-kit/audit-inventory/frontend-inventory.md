# Frontend Dry Audit Inventory
**Prepared:** October 3, 2025  
**Owner:** Audit Task Force – Frontend Sector

This inventory scopes the dry audit effort across the React/Vite frontend. It enumerates every major sector, highlights their substructures, and documents integration seams that must be validated to guarantee clean data flow with the backend API gateway. Use it alongside the [Dry Audit Execution Plan](../DRY_AUDIT_EXECUTION_PLAN.md) to drive file-by-file reviews, ensuring each dependency uncovered during a primary audit is queued for its own primary pass.

---

## 1. Scope Overview

| Sector | Root Path | Key Subdirectories / Files | Primary Responsibilities | Audit Notes |
| --- | --- | --- | --- | --- |
| Domain Modules | `src/modules/` | `auth/`, `dashboard/`, `worker/`, `hirer/`, `jobs/`, `messaging/`, etc. | Route-level pages, feature-specific components, hooks, and services | Largest surface area; confirm each module’s services map to consolidated API endpoints. |
| Shared Components | `src/components/` | `ai/`, `common/`, `contracts/`, `mobile/`, `reputation/`, `reviews/`, `PaymentMethodCard.jsx` | Cross-module UI primitives and composites | Track usage across modules to avoid duplicate implementations embedded inside feature folders. |
| Core API Layer | `src/api/`, `src/services/` | `dynamic-importer.js`, `workersApiProxy.js`, `aiMatchingService.js`, etc. | HTTP clients, proxy helpers, background sync services | Several legacy backups exist (`services_backup*`, `index.js.backup`). Identify authoritative entrypoints and retire duplicates. |
| Configuration & Environment | `src/config/`, `public/runtime-config.json`, `environment.js`, `securityConfig.js` | Runtime environment detection, API base URL resolution, navigation config | Validate LocalTunnel URL updates, CSP rules, and service registry alignment with backend gateway. |
| State Management | `src/store/`, `src/store/slices/` | Redux store, slices (`authSlice.js`, `profileSlice.js`, etc.) | Global state orchestration and async thunks | Confirm slices consume shared services and normalize responses from gateway endpoints. |
| Routing | `src/routes/` | `workerRoutes.jsx`, `hirerRoutes.jsx`, `publicRoutes.jsx`, etc. | Declares React Router maps and guards | Ensure route configs align with module ownership and lazy loading strategy. |
| Hooks | `src/hooks/` | Custom hooks, `__tests__/` | Data fetching, responsive helpers, payments, WebSocket connectors | Verify hooks delegate to canonical services; remove shadow copies living inside modules. |
| Utilities & Helpers | `src/utils/`, `src/constants/`, `src/data/` | `resilientApiClient.js`, `secureStorage.js`, `themeValidator.js` | Shared business logic, formatters, cache utilities | Audit for duplication with module-level helpers; ensure secure storage aligns with auth flow. |
| Styling & Theming | `src/styles/`, `src/theme/`, `App.css`, `assets/` | Theming primitives, animation configs, global styles | Validate theme tokens vs module-level styled components; document animation dependencies. |
| Public Assets & PWA | `public/` | `runtime-config.json`, `sw.js`, `offline.html`, `mockAuth.js` | Static assets, service worker, runtime config injection | Ensure runtime config auto-updates with LocalTunnel protocol; audit service worker offline strategy. |
| Tests & Tooling | `src/tests/`, hook/util test dirs, `jest.config.js`, `vite.config.js` | Unit/integration test harness, build configuration | Confirm test coverage extends to newly audited modules and references correct API mocks. |
| Documentation & Spec-Kit | `docs/`, `spec-kit/kelmah-frontend/`, local checklists | Feature docs, interactive component checklists | Keep documentation synced with audit findings; note any stale instructions. |

> **Exclusions:** `node_modules/`, compiled `build/`, and generated artifacts are omitted from audit scope.

---

## 2. Domain Modules (`src/modules/`)
- **Structure:** 24 domain folders including `auth/`, `dashboard/`, `worker/`, `hirer/`, `jobs/`, `messaging/`, `notifications/`, `payment/`, etc. Each typically contains `pages/`, `components/`, `services/`, `hooks/`, `contexts/`, `utils/`.
- **Connectivity Expectations:** Modules must source API calls through shared services (`src/api`, `src/services`, or `modules/common/services/axios.js` where present) and share UI primitives from `modules/common/components/`.
- **Audit Hotspots:**
  - Identify instances where modules define ad-hoc axios clients or mock data to replace them with gateway-aligned services.
  - Check for duplicate page implementations between `dashboard/`, `worker/`, and `hirer/` modules.
  - Verify messaging module integrates consistently with Socket.IO client and service worker.

---

## 3. Shared Components (`src/components/`)
- Houses reusable UI suites for AI features, contracts, reputation, and mobile layouts.
- Includes standalone `PaymentMethodCard.jsx`—confirm no divergent copies exist inside domain modules.
- **Hotspots:** Assess naming consistency and ensure component props align with data contracts defined in modules; document any drift requiring refactor.

---

## 4. Core API & Service Layer
- **`src/api/`:** Contains dynamic import helpers and legacy backups (`index.js.backup`, `services_backup*/`). Confirm the active entrypoint (likely consumed by `modules/common/services/axios.js`) and plan retirement of unused backups after verification.
- **`workersApiProxy.js`:** Legacy proxy bridging worker dashboard to backend—ensure routes updated to `/api/users/workers/*` per latest backend alignment.
- **`src/services/`:** Higher-level services for AI matching, reputation, reviews, caching, websockets. Validate they consume the canonical API layer and respect gateway base URLs.
- **Hotspots:** Consolidate duplicate service logic living in modules, ensure background sync service handles auth token refresh consistently.

---

## 5. Configuration & Environment Controls
- **Files:** `src/config/environment.js`, `env.js`, `api.js`, `securityConfig.js`, `dynamicConfig.js`, `services.js`, plus `public/runtime-config.json` updated by LocalTunnel automation.
- **Responsibilities:** Determine API base URL (`/api` vs LocalTunnel), apply security headers, and map navigation.
- **Hotspots:**
  - Confirm LocalTunnel automation (via backend scripts) keeps `runtime-config.json` and `securityConfig.js` in sync.
  - Validate that any hard-coded URLs inside modules are replaced with config-driven values.
  - Ensure `securityConfig.js` connect-src matches current tunnel domain.

---

## 6. State Management (`src/store/`)
- Redux store exported from `index.js`; slices located in `slices/` (auth, notification, profile, settings).
- **Audit Focus:**
  - Verify slices dispatch thunks that use canonical services.
  - Confirm persistent storage (if any) leverages `secureStorage.js` and respects authentication lifecycle.
  - Check for unused legacy slices or reducers outside this directory.

---

## 7. Routing (`src/routes/`)
- Route configuration files per persona (`workerRoutes.jsx`, `hirerRoutes.jsx`, `adminRoutes.jsx`, `publicRoutes.jsx`, `realTimeRoutes.jsx`).
- **Audit Focus:** Ensure route definitions align with module directories, lazy imports reference correct component paths, and auth guards integrate with Redux/state.

---

## 8. Hooks & Utilities
- **Hooks:** Located under `src/hooks/` with dedicated tests. Cover API wrappers, responsive logic, payments, WebSockets, and analytics.
  - Verify they centralize cross-cutting concerns and are not reimplemented inside modules.
- **Utilities:** `src/utils/` and `src/constants/` provide shared formatters, resilient API client, service health checker, secure storage helpers.
  - Confirm duplicates (`modules/common/utils`) are rationalized and data contracts are documented.

---

## 9. Styling & Theming
- **Global Styles:** `App.css`, `index.css`, `src/styles/` (animations, calendar styles, theme config).
- **Theme System:** `src/theme/` exports `ThemeProvider.jsx`, `JobSystemTheme.js`, etc.
- **Audit Focus:** Ensure theme tokens used consistently across styled components; identify any inline style blocks inside modules that should migrate here.

---

## 10. Public Assets & Service Worker
- `public/runtime-config.json` (auto-updated LocalTunnel host), `sw.js`, `offline.html`, `mockAuth.js`, plus static assets under `assets/`, `icons/`, `images/`.
- **Audit Focus:**
  - Validate service worker caching strategy and offline asset list.
  - Confirm `mockAuth.js` isn’t accidentally shipped to production bundles.
  - Ensure runtime config mirrors backend tunnel automation logs.

---

## 11. Tests, Tooling, and Documentation
- **Tests:** Distributed under `src/tests/`, `src/hooks/__tests__/`, `src/utils/__tests__/`. Evaluate coverage per sector during audits.
- **Tooling:** `vite.config.js`, `jest.config.js`, `eslint.config.js`, `tailwind.config.js`, `vercel-build.js` orchestrate build and linting pipelines; document any divergent configs per module.
- **Documentation:** `docs/` (specs), `INTERACTIVE_COMPONENTS_CHECKLIST.md`, `REFACTORING-COMPLETION.md`. Keep updated with audit findings.

---

## 12. Immediate Audit Follow-Ups
- Create `spec-kit/audits/frontend/` (if absent) and begin logging primary audits starting with `src/config/environment.js`, then `modules/common/services/axios.js`, before expanding into domain modules.
- Verify modules rely on shared axios instance (`modules/common/services/axios.js`) and adjust outliers.
- Inventory legacy/backup directories for consolidation:
  - `src/api/index.js.backup`
  - `src/api/services_backup*/`
  - `src/modules/backup-old-components/`
- Coordinate with backend audit team to cross-reference endpoint usage and ensure every frontend service hits the correct gateway route.

---

## 13. Next Steps & Reporting
- Seed `spec-kit/audit-tracking/coverage-matrix.csv` with frontend sectors marked `pending`.
- Schedule audit sequencing: **Configuration → Shared API Layer → Common Components → Domain Modules (prioritize auth & worker) → Hooks/Utilities → Routing → State Store → Public Assets → Tests/Tooling**.
- After each audit session, update `spec-kit/STATUS_LOG.md` and attach detailed findings within `spec-kit/audits/frontend/` reports.
