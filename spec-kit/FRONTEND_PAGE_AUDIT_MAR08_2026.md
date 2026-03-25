# Frontend Page Audit — March 8, 2026

## Scope
Harsh dry audit of frontend page surfaces with emphasis on:
- bugs and null/race issues
- security/auth and data exposure
- performance hot spots
- maintainability and split-readiness
- worker vs hirer boundary leaks

## Coverage
### Route / shell / auth control surface
- `kelmah-frontend/src/routes/config.jsx`
- `kelmah-frontend/src/modules/auth/components/common/ProtectedRoute.jsx`
- `kelmah-frontend/src/config/navLinks.js`
- `kelmah-frontend/src/App.jsx`
- `kelmah-frontend/src/utils/userUtils.js`

### Page inventory audited
58 page files under `kelmah-frontend/src/modules/**/pages/*.jsx` across:
- `admin`
- `auth`
- `common`
- `contracts`
- `dashboard`
- `hirer`
- `home`
- `jobs`
- `map`
- `messaging`
- `notifications`
- `payment`
- `premium`
- `profile`
- `quickjobs`
- `reviews`
- `scheduling`
- `search`
- `settings`
- `support`
- `worker`

## End-to-end separation view
Current route structure already hints at a future split (`/worker/*`, `/hirer/*`, shared public routes), but too many pages in the shared layer still contain worker-only assumptions or path-sniff role logic. The biggest risk is not missing routes — it is shared pages carrying role-specific copy, actions, redirects, and data contracts.

## Highest-value findings

### 1) Critical — quick-hire request flow is assigned to the wrong role
- Files:
  - `kelmah-frontend/src/routes/config.jsx`
  - `kelmah-frontend/src/modules/quickjobs/pages/QuickJobRequestPage.jsx`
- Evidence:
  - Route protects `/quick-hire` for workers/admin only.
  - Page copy says requesters create a job and workers nearby respond.
  - Success redirect points to `/quick-job/:id`, another worker-only path.
- Why it matters:
  - Direct worker/hirer inversion at route level.
  - Prevents clean future split into requester/hirer app and worker responder app.
- Fix:
  - Create `requester/quick-jobs` vs `worker/quick-jobs` ownership.
  - Move create-request into hirer/requester domain.
  - Keep nearby/track/respond in worker domain.

### 2) High — `ProtectedRoute` conflates 401 and 403
- File: `kelmah-frontend/src/modules/auth/components/common/ProtectedRoute.jsx`
- Evidence:
  - Failed auth and failed role checks both redirect to `/login` with the same message.
- Why it matters:
  - Signed-in users with the wrong role look logged out.
  - Hides authorization defects and causes role confusion.
- Fix:
  - Redirect unauthenticated users to login.
  - Redirect authenticated-but-forbidden users to role home or an explicit 403 page.

### 3) High — nav role checks bypass normalization
- File: `kelmah-frontend/src/config/navLinks.js`
- Evidence:
  - `user?.role === 'hirer'` is used directly.
- Why it matters:
  - Elsewhere the app supports `role`, `userType`, `userRole`, and `roles[]`.
  - Hirers with alternate payload shapes can be sent into public search.
- Fix:
  - Replace direct field checks with `hasRole()` / normalized role helpers.

### 4) High — pricing route model is broken
- Files:
  - `kelmah-frontend/src/config/navLinks.js`
  - `kelmah-frontend/src/routes/config.jsx`
- Evidence:
  - Header says `Pricing` and links to `/premium`.
  - `/premium` is protected.
  - `/pricing` exists but renders `HelpCenterPage`.
- Why it matters:
  - Public acquisition path is broken.
  - Shared navigation semantics do not match route ownership.
- Fix:
  - Make `/pricing` canonical and public.
  - Keep `/premium` as a logged-in upgrade/manage plan route if needed.

### 5) High — dedicated hirer search page exists but is bypassed
- Files:
  - `kelmah-frontend/src/modules/hirer/pages/WorkerSearchPage.jsx`
  - `kelmah-frontend/src/routes/config.jsx`
- Evidence:
  - Dedicated page exists and handles auth itself.
  - `/hirer/find-talent` routes to shared `SearchPage` instead.
- Why it matters:
  - Clear domain drift.
  - Harder to split later because role-specific wrapper is unused.
- Fix:
  - Route hirer talent discovery through the hirer page, or formalize a shared search shell with explicit worker/public and hirer wrappers.

### 6) High — `SearchPage` is a multi-role page driven by pathname sniffing
- File: `kelmah-frontend/src/modules/search/pages/SearchPage.jsx`
- Evidence:
  - The page checks whether the path starts with `/find-talents`, `/search`, or `/hirer/find-talent`.
  - Same container calls internal worker directory endpoints directly.
- Why it matters:
  - Public and authenticated hirer discovery are mixed in one stateful container.
  - Makes privacy, analytics, and future app separation messy.
- Fix:
  - Split into `PublicTalentDirectoryPage` and `HirerTalentSearchPage` containers.
  - Keep filters/cards/results as shared presentational components only.

### 7) High — worker profiles are publicly exposed through three aliases
- Files:
  - `kelmah-frontend/src/routes/config.jsx`
  - `kelmah-frontend/src/modules/worker/pages/WorkerProfilePage.jsx`
- Evidence:
  - `/workers/:workerId`, `/worker-profile/:workerId`, and `/profile/:workerId` all hit the same public worker profile surface.
- Why it matters:
  - Alias sprawl increases exposure and weakens canonical ownership.
- Fix:
  - Pick one canonical public worker profile route.
  - Convert aliases into redirect-only compatibility entries.

### 8) High — shared `/profile` is worker-centric, not shared
- File: `kelmah-frontend/src/modules/profile/pages/ProfilePage.jsx`
- Evidence:
  - Worker copy: "Tell hirers about yourself and your skills..."
  - Worker metrics: jobs applied, offers.
  - Worker data sections: skills, education, work history.
- Why it matters:
  - Hirers land inside a worker self-marketing flow.
- Fix:
  - Split into `worker/profile/*` and `hirer/profile/*`, or use a role-owned shell around shared form primitives.

### 9) High — shared `/schedule` is worker-biased
- File: `kelmah-frontend/src/modules/scheduling/pages/SchedulingPage.jsx`
- Evidence:
  - Card navigation assumes `appointment.hirerId`.
  - User-loading logic fetches workers for autocomplete.
- Why it matters:
  - Shared route, non-shared mental model.
- Fix:
  - Move scheduling into role-owned routes or inject `viewerRole`/`counterpartyType` from route wrappers.

### 10) High — shared payments page links into worker-only actions
- Files:
  - `kelmah-frontend/src/modules/payment/pages/PaymentsPage.jsx`
  - `kelmah-frontend/src/routes/config.jsx`
- Evidence:
  - Shared `/payments` route is allowed for worker/hirer/admin.
  - Actions menu links to `/payment/methods`, which is worker/admin only.
- Why it matters:
  - Hirers see dead-end actions.
- Fix:
  - Role-aware actions menu or separate worker/hirer payment centers.

### 11) High — escrow details back button always returns to worker path
- File: `kelmah-frontend/src/modules/payment/pages/EscrowDetailsPage.jsx`
- Evidence:
  - Back link hardcoded to `/worker/payment`.
- Why it matters:
  - Shared page routes users into the wrong domain.
- Fix:
  - Resolve back target from current role, referrer, or query context.

### 12) High — public job pages show worker-only actions to everybody
- Files:
  - `kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx`
  - `kelmah-frontend/src/modules/jobs/pages/JobDetailsPage.jsx`
  - `kelmah-frontend/src/routes/config.jsx`
- Evidence:
  - Public screens render `Apply Now` / `Upload CV` without role gating.
  - Protected routes reject later.
- Why it matters:
  - Cross-role confusion.
  - Users are invited into flows they cannot complete.
- Fix:
  - Role-aware CTA matrix: guest → sign in, worker → apply/upload, hirer → post job/find talent.

### 13) High — login page clears navigation state too aggressively
- File: `kelmah-frontend/src/modules/auth/pages/LoginPage.jsx`
- Evidence:
  - `window.history.replaceState({}, '')` runs whenever `registered` or `message` exists.
- Why it matters:
  - Can erase `from` redirect state set by protected routes.
- Fix:
  - Clear only transient banner fields, preserve `from`, or use router `replace` with filtered state.

### 14) High — admin dashboard CTA points to a non-existent index route
- Files:
  - `kelmah-frontend/src/modules/dashboard/pages/DashboardPage.jsx`
  - `kelmah-frontend/src/routes/config.jsx`
- Evidence:
  - Admin CTA goes to `/admin`.
  - Router defines only child routes under `/admin`, no index.
- Why it matters:
  - Broken admin navigation at the shell level.
- Fix:
  - Add `/admin` index redirect or point CTA at a concrete admin child.

### 15) Medium-High — `PremiumPage` bypasses auth abstraction
- File: `kelmah-frontend/src/modules/premium/pages/PremiumPage.jsx`
- Evidence:
  - Reads raw `localStorage` / `sessionStorage` instead of using auth selector or `secureStorage`.
- Why it matters:
  - Multiple auth truths increase bugs during token refresh and future app extraction.
- Fix:
  - Use one auth source only.

### 16) Medium-High — `JobDetailsPage` uses a second auth truth
- File: `kelmah-frontend/src/modules/jobs/pages/JobDetailsPage.jsx`
- Evidence:
  - Computes auth as `!!state.auth.user && !!state.auth.token` instead of `isAuthenticated`.
- Why it matters:
  - UI state can disagree with route protection and session refresh handling.
- Fix:
  - Centralize auth selectors.

### 17) Medium — route alias sprawl is undermining separation
- File: `kelmah-frontend/src/routes/config.jsx`
- Evidence:
  - Search aliases, worker-profile aliases, support aliases, contracts aliases, wallet aliases, schedule alias all live in the same monolithic route tree.
- Why it matters:
  - Future split work starts with untangling aliases.
- Fix:
  - Keep canonical routes in the main tree.
  - Move legacy aliases to a redirect map layer.

### 18) Medium — shared settings/profile copy defaults to worker identity
- Files:
  - `kelmah-frontend/src/modules/settings/pages/SettingsPage.jsx`
  - `kelmah-frontend/src/modules/profile/pages/ProfilePage.jsx`
- Evidence:
  - Fallback label `Kelmah Worker`.
  - Worker-facing copy inside shared pages.
- Why it matters:
  - Shared surfaces are not actually neutral.
- Fix:
  - Use role-neutral defaults in shared shell, role-specific copy in thin wrappers.

### 19) Medium — `SearchPage` creates random IDs
- File: `kelmah-frontend/src/modules/search/pages/SearchPage.jsx`
- Evidence:
  - Fallback `crypto.randomUUID()` when worker ID is missing.
- Why it matters:
  - Unstable React keys and deep-link inconsistency.
- Fix:
  - Require stable IDs from backend or derive deterministic fallback.

### 20) Medium — scheduling dev mocks are embedded in page logic
- File: `kelmah-frontend/src/modules/scheduling/pages/SchedulingPage.jsx`
- Evidence:
  - Development fallback injects mock users inside production page logic.
- Why it matters:
  - Broken integrations can look healthy in testing.
- Fix:
  - Move mocks into fixtures/stories only.

### 21) Medium — dashboard hydration and polling are heavy and duplicated
- Files:
  - `kelmah-frontend/src/modules/hirer/pages/HirerDashboardPage.jsx`
  - `kelmah-frontend/src/modules/worker/pages/WorkerDashboardPage.jsx`
- Evidence:
  - Large multi-request hydration plus polling in both dashboards.
- Why it matters:
  - More backend load, more split pain, more cache incoherence.
- Fix:
  - Use visibility-aware refresh, query caching, and push invalidation where possible.

## 80/20 performance wins
1. Replace dashboard polling with cached query invalidation and visibility-aware refresh.
2. Split `SearchPage` into two containers and remove pathname branching.
3. Remove duplicate auth checks (`localStorage`, raw token checks) and centralize selectors.
4. Collapse route aliases into redirects so the route tree becomes smaller and easier to optimize.
5. Stop random UUID fallback in search results to stabilize rendering.

## Architecture recommendation for future split-readiness
### Domain ownership
- `public/*`: landing, marketing, public jobs browse, public worker discovery, public worker profile
- `worker/*`: worker dashboard, apply/search, bids, portfolio, availability, worker payment center, worker scheduling, reviews
- `hirer/*`: hirer dashboard, job posting/management, talent sourcing, requester quick jobs, hirer contracts/payments
- `shared/*`: auth, messaging shell, notifications shell, error/loading/layout, design system primitives only

### Non-negotiable rules
1. Shared pages must not infer role from pathname.
2. Shared pages must not contain worker-only or hirer-only routes/copy.
3. Shared APIs should expose role-safe DTOs; public worker discovery must not reuse internal hiring payloads blindly.
4. Canonical route ownership must be explicit; legacy aliases should only redirect.
5. Use thin role-specific page wrappers around shared components instead of one giant polymorphic page.

## Suggested next fix order
1. Quick-hire role inversion
2. `ProtectedRoute` 401 vs 403 split
3. `/hirer/find-talent` → actual hirer page/container
4. `/profile` and `/schedule` separation
5. Shared payments/escrow role-aware navigation
6. Pricing/public premium route cleanup
7. Alias consolidation
