# Frontend Role-Separation Remediation — March 8, 2026

## Scope
Focused remediation pass after the March 8 frontend page audit.

Targeted objectives:
- reduce worker/hirer boundary leakage in shared surfaces
- repair broken protected-route behavior
- fix obvious route and navigation contradictions
- keep current shared app workable while preserving a future worker/hirer split path

## Files changed
- `kelmah-frontend/src/utils/userUtils.js`
- `kelmah-frontend/src/modules/auth/components/common/ProtectedRoute.jsx`
- `kelmah-frontend/src/config/navLinks.js`
- `kelmah-frontend/src/modules/auth/pages/LoginPage.jsx`
- `kelmah-frontend/src/modules/dashboard/pages/DashboardPage.jsx`
- `kelmah-frontend/src/modules/premium/pages/PremiumPage.jsx`
- `kelmah-frontend/src/routes/config.jsx`
- `kelmah-frontend/src/modules/payment/pages/PaymentsPage.jsx`
- `kelmah-frontend/src/modules/payment/pages/EscrowDetailsPage.jsx`
- `kelmah-frontend/src/modules/search/pages/SearchPage.jsx`
- `kelmah-frontend/src/modules/jobs/pages/JobDetailsPage.jsx`
- `kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx`

## Fixes completed

### 1. Role-aware home routing helper
Added `getRoleHomePath(user)` in `userUtils.js`.

Purpose:
- standardize where users land when the app needs to recover from bad route access
- remove duplicated role-home decisions scattered across components

### 2. `ProtectedRoute` now distinguishes unauthenticated vs unauthorized
Before:
- both states were redirected to `/login`

After:
- unauthenticated users still go to `/login`
- authenticated users lacking the required role are redirected to their role home with an authorization message

Impact:
- cleaner worker/hirer separation
- fewer false “you are logged out” experiences

### 3. Header nav now uses normalized role logic
Updated `navLinks.js` to use `hasRole(user, 'hirer')` instead of raw `user.role === 'hirer'`.

Impact:
- hirer navigation no longer breaks when auth payload uses alternate role fields

### 4. Pricing route is now consistent
Before:
- nav linked to `/premium`
- `/premium` was protected
- `/pricing` rendered `HelpCenterPage`

After:
- header nav links to `/pricing`
- `/pricing` renders `PremiumPage` publicly
- `/premium` redirects to `/pricing`

Impact:
- public pricing path now works as a real acquisition surface

### 5. Hirer talent search now uses the hirer-owned page
Updated `/hirer/find-talent` to render `modules/hirer/pages/WorkerSearchPage.jsx` instead of the shared public search page.

Impact:
- cleaner domain ownership
- easier future split of public discovery vs hirer recruiting

### 6. Admin dashboard CTA fixed
Before:
- admin CTA sent users to `/admin`, which had no index route

After:
- admin CTA uses role home helper
- router now includes `/admin` index redirect to `/admin/skills-management`

Impact:
- admin navigation no longer dead-ends

### 7. Login page preserves protected-route return target
Before:
- login page cleared all location state when banner messages existed

After:
- state cleanup is skipped when `from` exists

Impact:
- fewer lost post-login redirects

### 8. Premium page now uses centralized auth state
Before:
- raw local/session storage checks

After:
- Redux auth selector is used for upgrade gating
- unauthenticated upgrade attempts redirect to login with preserved `from`

Impact:
- one auth truth instead of several

### 9. Payments page is now role-aware
Before:
- shared `/payments` showed worker/admin-only actions and tabs to everyone

After:
- Actions menu hides payment-method management from unsupported roles
- visible tabs are built dynamically by role
- tab index self-corrects when tab availability changes

Impact:
- fewer hirer dead ends
- less role leakage inside shared payment surface

### 10. Escrow back-navigation is role-aware
Before:
- escrow detail back button always sent users to `/worker/payment`

After:
- back target resolves from current role

Impact:
- removes obvious worker-path leakage from shared escrow detail view

### 11. Search result IDs are now deterministic when backend IDs are missing
Before:
- `crypto.randomUUID()` fallback created unstable IDs

After:
- deterministic fallback derived from stable worker fields

Impact:
- better React key stability and more predictable result identity

### 12. Jobs CTAs now separate worker and hirer intent better
Updated `JobsPage.jsx` and `JobDetailsPage.jsx`:
- hirers now see “Post a Job” / “Find Talent” pathways instead of worker-only CV/apply paths
- `JobDetailsPage` no longer encourages hirers to use the worker apply flow
- `JobDetailsPage` now uses centralized `selectIsAuthenticated`

Impact:
- cleaner public/shared experience
- less wrong-role funneling

### 13. Shared profile/schedule aliases now redirect into role-owned areas
Updated `routes/config.jsx`:
- `/profile` now redirects workers to `/worker/profile`
- `/profile` now redirects hirers to `/settings` instead of the worker-centric shared profile form
- `/schedule` now redirects workers to `/worker/schedule`
- `/schedule` now redirects hirers away from the worker-biased scheduler surface

Impact:
- less role leakage through shared aliases
- cleaner canonical ownership for future split work

### 14. Shared settings copy now uses neutral fallback identity
Updated `SettingsPage.jsx` fallback name from `Kelmah Worker` to `Kelmah User`.

Impact:
- reduced worker-only language on shared settings surface

## Verification
- `get_errors` returned no file-level errors on all touched files.
- Frontend build succeeded:
  - `npx vite build`
  - result: success

## Remaining high-priority follow-up
These were intentionally left for a later controlled pass because they require broader page/domain work, not isolated fixes:

1. **Quick-hire requester/worker inversion**
   - `QuickJobRequestPage` is still structurally a requester page inside a worker-owned module.
   - Needs a dedicated requester/hirer quick-job surface and likely a requester tracking/list page.

2. **Shared `/profile` route is still worker-centric**
   - Needs either role-owned profile pages or a neutral shared shell with role-injected sections.

3. **Shared `/schedule` route is still worker-biased**
   - Needs route-level separation or explicit role-aware scheduler variants.

4. **`SearchPage` still contains pathname branching**
   - Even after `/hirer/find-talent` was rerouted, the shared page still mixes concerns internally and should be decomposed.

## Architectural note
This remediation keeps the current single app working but improves future split-readiness by pushing more decisions toward:
- role-owned routes
- centralized role helpers
- role-aware shared wrappers
- fewer polymorphic shared pages with hidden role assumptions
