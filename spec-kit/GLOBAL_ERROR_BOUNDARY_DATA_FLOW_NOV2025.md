# Global Error Boundary – Data Flow (Nov 2025)

## Component Chain
- **Wrapper**: `kelmah-frontend/src/modules/common/components/GlobalErrorBoundary.jsx`
- **Integration Point**: `kelmah-frontend/src/App.jsx` wraps `<Layout>` + router with `<GlobalErrorBoundary resetKey={location.pathname}>`
- **Utilities**: `checkServiceHealth`, `getServiceStatusMessage` from `src/utils/serviceHealthCheck.js`
- **UI Dependencies**: MUI (Box, Button, Chip, Stack, Typography) + brand palette from `src/theme/index.js`

## Flow Map
```
Runtime error occurs inside any child of Layout/Routes
  ↓
GlobalErrorBoundary.getDerivedStateFromError(error)
  ↓
state.hasError = true, state.error captured for display
  ↓
componentDidUpdate notices hasError switch → calls updateStatus()
  ↓
updateStatus() awaits checkServiceHealth('aggregate', 10s)
  ↓
API Gateway /api/health/aggregate (GET) returns consolidated status
  ↓
getServiceStatusMessage('aggregate') derives { status, message, action }
  ↓
Fallback UI renders:
    - Warning icon + friendly explanation
    - Status chip describing aggregate health (Operational/Warming Up/etc.)
    - Error message box (from runtime error)
    - Actions: Try Again (resets boundary), Go Home (/ route), Reload Application
```

## Reset Logic
- Boundary accepts `resetKey` prop (currently `location.pathname`).
- When the route changes while `hasError === true`, `componentDidUpdate` calls `resetBoundary()` to clear the error state.
- The "Try Again" button resets `hasError` and re-renders children immediately.
- The "Reload Application" button forces a full page reload for unrecoverable failures.

## Loading / Error Handling
- Status chip uses aggregate health to tell users whether cold starts or outages might be responsible.
- If `checkServiceHealth` fails, the chip falls back to “Status Unknown” but still shows actionable copy.
- All actions remain accessible on both desktop and mobile thanks to stacked buttons.

## Verification Steps
1. `cd kelmah-frontend && npx eslint src/modules/common/components/GlobalErrorBoundary.jsx src/App.jsx --max-warnings=0`
2. Introduce a temporary throw (e.g., inside `HomePage`) and visit the route to confirm:
   - Boundary renders fallback UI
   - “Try Again” clears the error after removing the throw
   - Status chip updates once the aggregate health endpoint responds
   - “Go Home” navigates to `/` while resetting the boundary due to `resetKey`

## Notes
- Addresses Consolerrorsfix requirement for actionable error messaging and retry/go-home controls.
- Future hook: add Sentry/LogRocket logging within `componentDidCatch` when telemetry is available.
