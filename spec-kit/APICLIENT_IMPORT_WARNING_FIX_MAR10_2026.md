# CRIT-04D apiClient Mixed Import Build Warning Audit

Date: March 10, 2026
Status: COMPLETED
Owner: GitHub Copilot

## Scope
Remove the remaining Vite mixed dynamic/static import warning around `kelmah-frontend/src/services/apiClient.js` by auditing every dynamic import caller, converting safe lazy imports to consistent static imports, and revalidating the frontend build output.

## Acceptance Criteria
- All frontend callers use a consistent static import pattern for `kelmah-frontend/src/services/apiClient.js` unless a verified cycle requires otherwise.
- The current Vite build no longer emits the `src/services/apiClient.js` mixed dynamic/static import warning.
- Auth refresh logic still uses the shared `apiClient` instance and `_refreshPromise` lock semantics after the import cleanup.
- Touched frontend files validate cleanly and the frontend build passes after the warning fix.

## Mapped Execution Surface
- `kelmah-frontend/src/services/apiClient.js`
- `kelmah-frontend/src/modules/auth/services/authService.js`
- `kelmah-frontend/src/modules/premium/pages/PremiumPage.jsx`
- `kelmah-frontend/src/modules/quickjobs/pages/QuickJobRequestPage.jsx`
- `kelmah-frontend/src/modules/quickjobs/pages/QuickJobTrackingPage.jsx`
- `kelmah-frontend/src/utils/pwaHelpers.js`

## Data Flow Trace
1. Shared frontend services and pages import `api` or the default `apiClient` singleton from `kelmah-frontend/src/services/apiClient.js`.
2. User actions such as premium upgrades and quick-job photo uploads call that singleton to send authenticated `/api/*` requests.
3. `authService.refreshToken()` relies on the default `apiClient` instance so `_refreshPromise` deduplicates concurrent refresh attempts.
4. Vite currently detects both static imports and dynamic `import()` calls for the same module, which produces the residual mixed-import build warning.

## Dry-Audit Findings
- Historical warning output referenced five earlier dynamic-import call sites, but the live source tree already had those callers normalized back to static imports by the time this audit completed.
- A direct source scan confirmed no remaining `import()` expressions targeting `src/services/apiClient.js`.
- The remaining warning came from the bundler layer: route-lazy chunks such as Premium and Quick Jobs depend on the same shared `apiClient` singleton that is also consumed by eagerly loaded modules and services.
- Because the singleton is intentionally shared, the correct fix is explicit chunk ownership rather than forcing eager-loading of lazy routes or duplicating API client instances.

## Implementation
- Updated `kelmah-frontend/vite.config.js` to emit `src/services/apiClient.js` through an explicit `shared-api` manual chunk.
- Added a targeted Vite warning note documenting why `apiClient` is shared across eager and lazy consumers.
- Left the singleton import structure intact so auth refresh locking and shared interceptors continue to use one canonical `apiClient` instance.

## Validation
- `get_errors` returned no diagnostics for `kelmah-frontend/vite.config.js`.
- An isolated `npm run build` from `kelmah-frontend/` completed successfully.
- The clean build output emitted `build/assets/shared-api-*.js` and no longer printed the previous `src/services/apiClient.js` mixed dynamic/static import warning.

## Outcome
The build warning is resolved without regressing code-splitting or the shared-auth interceptor behavior. `apiClient` now has explicit chunk ownership, so the bundler no longer reports the eager-versus-lazy consumer mix as an ambiguous chunking case.

