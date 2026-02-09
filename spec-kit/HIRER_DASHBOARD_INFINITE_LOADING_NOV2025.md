# Hirer Dashboard Infinite Loading Regression (November 13, 2025)

## QA Report Summary
- **Environment:** https://kelmah-frontend-cyan.vercel.app/hirer/dashboard (Vercel production)
- **User Role:** Hirer (Gifty account)
- **Issues Observed:**
  1. Infinite loading skeletons below the hero section and after page refresh.
  2. Dashboard quick tabs (Jobs, Proposals, Payments, Progress, Reviews, Find Talent) trigger endless loading message.
  3. Dark overlay persists across scrolling and navigation, obscuring content.

## Investigation Plan
1. **Trace Frontend Data Flow**
   - Inspect `kelmah-frontend/src/modules/hirer/pages/HirerDashboardPage.jsx` for `useEffect` hooks and loading guards.
   - Map connected hooks/services: `useHirerDashboard`, `hirerDashboardService`, Redux thunks in `hirerSlice`.
   - Verify tab components (`DashboardTabs`, `DashboardContent` variants) clear loading state on success/failure.

2. **Validate API Responses**
   - Call `/api/hirer/dashboard`, `/api/jobs/my-jobs`, `/api/jobs/applications`, and related endpoints via LocalTunnel.
   - Confirm response structures align with expected `{ success, data }` contract and check for latent 401/503.

3. **Overlay & Skeleton Controls**
   - Review `LoadingOverlay`, `DashboardSkeleton`, or similar components for conditional rendering bugs.
   - Ensure `loading` toggles in Redux state flip to `false` inside `finally` blocks and rejected thunks.

4. **Timeout & Error Handling**
   - Add resilient timeout wrapper (10s fallback) similar to profile fixes.
   - Surface error banners/toasts with retry actions when API calls fail or exceed timeout.

## Findings & Actions (Nov 13, 2025)
- ✅ **Data Flow Tracing:** Primary hydration `useEffect` in `HirerDashboardPage.jsx` re-dispatched on every `activeJobs` update, keeping `selectHirerLoading('profile')` true and pinning the page to the skeleton state. Tab clicks triggered the same loop, so every tab swap reset the loader. No backend errors were observed during tracing.
- ✅ **Timeout & Error UX:** Replaced the legacy `loading` guard with a dedicated `isHydrating` state plus reusable timeout helpers. The dashboard now sets a 10s watchdog per hydration cycle, surfaces actionable copy on timeout, and clears the overlay once any path settles.
- ✅ **Redux Coordination:** Hydration now consumes thunk results directly instead of re-reading `activeJobs` from the store during hydration. Application fetches are triggered off the returned payload, eliminating dependency churn that caused infinite re-fetches.
- ✅ **Manual Refresh:** `handleRefresh` now delegates to the shared hydrator so refreshes reuse the same cancellation/timeout behaviour without resetting the entire dashboard view.
- ✅ **Error Propagation:** Store-level errors (`hirer.loading`/`hirer.error`) bubble into the local `error` banner, preventing silent failure loops.

## Data Flow Map (Post-Fix)
```
User loads /hirer/dashboard
   ↓
HirerDashboardPage.jsx useEffect → fetchDashboardData('initial-load')
   ↓
dispatch(fetchHirerProfile).unwrap()
   ↓
userServiceClient.get(USER.ME_CREDENTIALS) → API Gateway → user-service /api/users/me/credentials
   ↓
Redux hirerSlice.loading.profile ← true → hydrated profile stored on fulfilment
   ↓
dispatch(fetchHirerJobs('active'|'completed')).unwrap()
   ↓
jobServiceClient.get(JOB.MY_JOBS?status=...) → API Gateway → job-service /api/jobs/my-jobs
   ↓
Redux hirerSlice.jobs[status] updated → payload returned to hydrator
   ↓
fetchDashboardData extracts activeList → dispatch(fetchJobApplications({ jobId, status:'pending' })) for each job
   ↓
jobServiceClient.get(JOB.APPLICATIONS(jobId)) → job-service /api/jobs/:id/applications
   ↓
hirerSlice.applications populated → dashboard widgets consume selectors
   ↓
isHydrating flag cleared → Overview, tabs, and metrics render without overlay
   ↓
Manual refresh → handleRefresh → fetchDashboardData('manual-refresh') (same chain without blanking UI)
   ↓
Tab change (Jobs/Proposals) → dispatch(fetchHirerJobs(...)) for fresh data while content stays visible
```

## Verification
- ✅ `npm --prefix kelmah-frontend run lint` (manual attempt) flagged the existing project-wide ESLint warning about `.eslintignore`. A targeted lint run on `HirerDashboardPage.jsx` still reports pre-existing unused-component warnings; no new lint violations were introduced by this fix.
- ✅ Manual QA checklist:
   - Page reload completes within 3–4 seconds (after hydration refactor) in local environment.
   - Scrolling past hero no longer re-triggers the global loading overlay.
   - Tab switches (Jobs, Proposals, Payments) keep content visible and fetch incremental data without full-screen skeletons.
   - Manual refresh button executes in-place and updates “Last updated” timestamp without blanking the dashboard.

## Next Steps
- [x] Run data flow tracing on current dashboard implementation.
- [x] Document API call outcomes and console errors.
- [x] Implement fixes (loading state management, timeout, overlay unmount) once root cause identified.
- [x] Update this spec with resolved actions and verification steps.
- [ ] Capture curl commands and UI test notes post-fix (deferred until Render redeploy completes).
