# Frontend Public Pages Audit (Feb 16, 2026)

## Scope
- Audit and improve frontend pages **outside** `src/modules` only.
- Included pages:
  - `kelmah-frontend/src/pages/HomeLanding.jsx`
  - `kelmah-frontend/src/pages/ResetPassword.jsx`
  - `kelmah-frontend/src/components/PaymentMethodCard.jsx`
  - `kelmah-frontend/src/components/common/BreadcrumbNavigation.jsx`
  - `kelmah-frontend/src/components/common/ErrorBoundary.jsx`
  - `kelmah-frontend/src/components/common/InteractiveChart.jsx`
- Read-only architecture/context files:
  - `kelmah-frontend/src/App.jsx`
  - `kelmah-frontend/src/routes/config.jsx`
  - `kelmah-frontend/src/modules/layout/components/Layout.jsx`
  - `spec-kit/Kelmaholddocs/old-docs/Kelma.txt`
  - `spec-kit/Kelmaholddocs/old-docs/Kelma docs.txt`

## Data Flow Trace

### 1) Landing discovery flow (`HomeLanding.jsx`)

User Action: Tap primary CTA (`Find a worker`)  
↓  
Handler: `onClick={() => navigate('/search')}`  
↓  
Routing: `src/routes/config.jsx` public alias route (`/search`)  
↓  
Target Page: `modules/search/pages/SearchPage`  
↓  
Expected Outcome: Worker discovery list with filters

User Action: Tap `Browse jobs`  
↓  
Handler: `onClick={() => navigate('/jobs')}`  
↓  
Routing: `/jobs` collection route in `src/routes/config.jsx`  
↓  
Target Page: `modules/jobs/pages/JobsPage`  
↓  
Expected Outcome: Job listings list

User Action: Tap final CTA `Sign up free`  
↓  
Handler: `onClick={() => navigate('/register')}`  
↓  
Routing: `/register` public route  
↓  
Target Page: `modules/auth/pages/RegisterPage`

### 2) Password reset flow (`ResetPassword.jsx`)

User Action: Submit new password and confirmation  
↓  
Handler: `handleSubmit` in `src/pages/ResetPassword.jsx`  
↓  
Token source: `useParams()` or `useSearchParams()` (`/reset-password/:token` and query token supported)  
↓  
Service: `modules/auth/services/authService.resetPassword(token, password)`  
↓  
Backend via gateway: auth reset endpoint through `/api/auth/*` service routing  
↓  
Expected Outcome: success alert and navigation option back to login

## Issues Found and Actions

1. **Perceived top empty space on landing hero**
- Cause: Header compensation + hero top spacing overlap.
- Action: Reduced hero top spacing pressure for mobile.

2. **Low-literacy decision friction on landing**
- Cause: Core actions were present but less explicit for first-time users.
- Action: Added direct intent actions: `I need work`, `I want to hire`.

3. **Category card accessibility gap**
- Cause: Clickable cards lacked semantic button behavior/focus visibility.
- Action: Converted cards to semantic button-cards with visible focus state and clearer action text.

4. **Reset password duplicate submissions risk**
- Cause: No loading lock during async submit.
- Action: Added loading state, disabled inputs/button during submit, and success-forward button.

5. **Breadcrumb mobile logic bug**
- Cause: `isMobile` was computed from breakpoint helper object, not viewport state.
- Action: Switched to `useMediaQuery(...)` and added compact breadcrumb rendering on small screens.

6. **Payment method card mobile layout pressure**
- Cause: Card used fixed horizontal layout and could compress/clip content on smaller devices.
- Action: Added responsive stack layout, wrapping text behavior, and full-width action button on mobile.

7. **ErrorBoundary environment compatibility risk**
- Cause: Development-check relied on `process.env.NODE_ENV` in Vite browser context.
- Action: Switched to Vite-compatible `import.meta.env.DEV` guard.

8. **Interactive chart robustness gap**
- Cause: Chart assumed non-pie axes and non-empty series; could fail or render incorrectly for some chart types.
- Action: Added safe `series` default, pie-specific axis handling, and fallback series metadata.

## Verification Evidence
- Diagnostics: no errors in changed files.
- Build: `npm --prefix kelmah-frontend run build` passed.
- Note: root workspace `npm run build` fails for frontend because entry `index.html` is in `kelmah-frontend/`.

## Non-Goals (Respected)
- No edits made inside `kelmah-frontend/src/modules`.
- No route-contract changes in gateway/services for this pass.
- No file deletions performed in this pass.
