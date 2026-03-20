# Frontend Deep Audit Findings (March 19 2026)

This file collects *extra* issues discovered during the latest deep dive into the frontend code base. The goal is to build out an actionable backlog of fixes and improvements.

---

## 🔒 Security & Privacy

1. **Client-side token storage is not secure**
   - File: `src/utils/secureStorage.js`
   - Issue: Encryption key (`kelmah_encryption_secret`) is stored in `localStorage` and used to encrypt tokens, giving only obfuscation rather than real protection. XSS can expose both ciphertext + key.

2. **Logout clears too much storage**
   - File: `src/utils/secureStorage.js` + logout flows
   - Issue: `secureStorage.clear()` wipes **all** Kelmah keys and uses BroadcastChannel for tab sync; could erase user preferences unexpectedly (theme, nav state, drafts).

3. **Auth redirect is global and brittle**
   - File: `src/services/apiClient.js`
   - Issue: `redirectToLogin` uses `window.location.replace('/login')`, which loses SPA state and ignores `from` route (user gets bounced unexpectedly).

4. **Auth refresh flow may break parallel requests**
   - File: `src/services/apiClient.js`
   - Issue: Global `pendingUnauthorizedRequests` queue and `hasTriggeredAuthRedirect` can cause race conditions and dropped request resends when multiple 401s occur.

5. **Fake analytics / bogus data used in UI**
   - File: `src/modules/hirer/services/hirerAnalyticsService.js`
   - Issue: When backend endpoints are missing, the UI is populated with randomly generated analytics. This is misleading for users (and potentially violates transparency).

6. **Social/social link placeholders with `#`**
   - File: `src/modules/layout/components/Footer.jsx`
   - Issue: Social icons link to `#` which is poor UX and potentially triggers scroll-to-top; should be disabled or replaced with real URLs.

7. **`key={index}` anti-patterns across many lists**
   - Files: `src/components/reviews/ReviewSystem.jsx`, `src/components/common/BreadcrumbNavigation.jsx`, `src/modules/messaging/components/common/MessageList.jsx`, etc.
   - Issue: Using `index` as React key can cause rendering glitches when list items change order.

8. **`eslint-disable` for hook dependencies**
   - Files: `src/modules/contracts/pages/CreateContractPage.jsx`, `src/hooks/useApi.js`, `src/modules/auth/pages/MfaSetupPage.jsx`, etc.
   - Issue: Disabling `react-hooks/exhaustive-deps` can hide stale closure bugs and memory leaks.

---

## 🧭 Navigation & UX

1. **Chunk load error recovery reloads app**
   - File: `src/utils/lazyWithRetry.js`
   - Issue: Reloading the page on chunk failure is heavy and can trap users in a reload loop if the underlying issue persists. Needs better offline-mode fallback.

2. **Hard reload on SW update**
   - File: `src/utils/pwaHelpers.js`
   - Issue: `window.location.reload()` is called without warning when a new service worker is available; may interrupt user tasks.

3. **Service health UI is verbose & not user-friendly**
   - Files: `src/utils/serviceHealthCheck.js`, `src/App.jsx`
   - Issue: Complex wake-up UI and logs exist; may confuse users and cause them to reload unnecessarily in poor network.

4. **Missing consistent “back” / “cancel” patterns**
   - Across many forms (application, profile, contracts) there are no explicit navigation affordances; users can lose data.

5. **Footer uses repeated internal routes (copy/paste)**
   - File: `src/modules/layout/components/Footer.jsx`
   - Issue: Several links point to `/about` or `/terms` but are labeled differently (Community, Careers), increasing confusion and preventing deep linking.

---

## 🚀 Performance & Maintainability

1. **Huge pages with deep component trees**
   - Files: `src/modules/jobs/pages/JobsPage.jsx` (and similar large pages like ApplicationManagementPage)
   - Issue: Monolithic pages with very large bundle size will slow JS parsing on budget devices.

2. **Repeated `Math.random()` in render paths**
   - File: `src/modules/hirer/services/hirerAnalyticsService.js`
   - Issue: Random values in UI make it hard to test / compare; also violates accessibility for screen readers if values shift.

3. **Legacy build artifacts & console logs in build scripts**
   - Files: `kelmah-frontend/vercel-build.js`, `public/sw.js`
   - Issue: Build scripts and service worker still print verbose logs; could be trimmed or gated to debug mode.

4. **`serviceHealthCheck` initialisation is hostname-brittle**
   - File: `src/utils/serviceHealthCheck.js`
   - Issue: Condition `window.location.hostname !== 'localhost'` excludes `127.0.0.1`, `::1`, custom hostnames, and local tunneling. May skip health checks in dev.

---

## 📱 Offline / PWA Resilience

1. **Service worker logs to console heavily**
   - File: `public/sw.js`
   - Issue: Console noise impacts debugging; should be guarder by `__DEV__` or remove for production.

2. **PWA install prompt logic is spread and duplicated**
   - File: `src/utils/pwaHelpers.js` + `index.html`
   - Issue: Install prompt logic uses `document.getElementById` and global DOM queries instead of React state, which may break in embedded views.

3. **No clear “offline mode enabled” indicator**
   - Multiple components (OfflineBanner, service health) exist but the UX is inconsistent and sometimes hidden behind a snackbar.

---

## 🔧 Code Quality & Patterns

1. **Inconsistent use of `useMemo`/`useCallback`**
   - Multiple large components use these hooks without stable dependencies or proper memoization, creating potential re-renders.

2. **Custom `uuidv4` in `apiClient` duplicates dependencies**
   - File: `src/services/apiClient.js`
   - Issue: This could be replaced with an existing UUID library to ensure consistent uniqueness and avoid subtle bugs.

3. **Numerous `console.*` debugging statements gated by `import.meta.env.DEV`**
   - Files: `src/utils/serviceWarmUp.js`, `src/utils/serviceHealthCheck.js`, `src/utils/secureStorage.js`, etc.
   - Issue: Still clutters dev tools and risks leaking into production if build config changes.

4. **`setTimeout`/`setInterval` usage without cleanup**
   - Files: `src/modules/worker/pages/WorkerDashboardPage.jsx`, `src/modules/hirer/pages/HirerDashboardPage.jsx`, etc.
   - Issue: Potential memory leaks and unnecessary background work when components unmount.

---

## 🧪 Testing & Developer Experience

1. **No tests covering large pages / key components**
   - Missing coverage for JobsPage, ApplicationManagementPage, secureStorage logic, and apiClient refresh.

2. **`eslint-disable` comments hide real issues**
   - Files: `src/modules/jobs/hooks/useJobsQuery.js`, `src/hooks/useApi.js`.
   - Issue: The lint suppression should be replaced with correct dependencies and stable callbacks.

---

## 📚 Documentation & TODOs

1. **Multiple TODOs in core UI components**
   - Files: `src/modules/jobs/pages/JobsPage.jsx`, `src/modules/hirer/pages/ApplicationManagementPage.jsx`, `src/modules/jobs/services/jobsService.js`.
   - Issue: TODOs are actionable items that should be tracked in a backlog ticket rather than left in code.

2. **Outdated docs / `spec-kit` entries clutter**
   - There are dozens of `spec-kit/generated/...` files; key ones should be consolidated and linked from a central roadmap.

---

## Next Steps (Suggested)

1. **Create triage tickets** for each category above with a clear priority and owner.
2. **Fix high-risk security issues first**: auth storage, auth redirect, fake analytics.
3. **Refactor large pages into smaller components** (JobsPage, ApplicationManagementPage, etc.) to improve performance and testability.
4. **Improve offline/PWA UX**: graceful fallbacks, explicit offline state, and non-disruptive update prompts.
5. **Remove placeholder UI artifacts** (e.g., social links, random analytics, console logs).

---

⚠️ This list is not exhaustive — it is a launchpad. If you want the next expansion wave (e.g., mapping every hardcoded magic string, identifying missing ARIA labels, or reviewing network error handling per screen), say the word and I’ll run the next audit pass.

---

## 🔎 Deeper Findings (More than 1 million-level backlog)

### 🧩 Risky Global State + Side-Effects

1. **Global retry counter stored on function object**
   - File: `src/utils/serviceWarmUp.js`
   - Issue: `warmUpServices._retryCount` is a mutable global property; if other code assigns it, retry logic can break, and it is not cleared when errors occur.

2. **`warmUpServices` hardcodes a single health endpoint**
   - File: `src/utils/serviceWarmUp.js`
   - Issue: Any backend refactor (different health path) will silently break warmup; the app should optionally accept a list (or derive from runtime config).

3. **LocalStorage keys are used in mixed contexts**
   - Files: `src/utils/serviceWarmUp.js`, `src/utils/secureStorage.js`, `src/modules/layout/components/Layout.jsx`, etc.
   - Issue: Multiple systems read/write `kelmah:*` keys without coordination; a schema collision could cause hard-to-debug failures.

### 🐞 Edge Case Behaviour Risks

1. **Chunk reload loop if offline**
   - File: `src/utils/lazyWithRetry.js`
   - Issue: It always `window.location.reload()` after a chunk error; in offline/slow networks this can repeatedly reload without user control.

2. **`apiClient` refresh can trigger UI flicker**
   - File: `src/services/apiClient.js`
   - Issue: When refresh fails and triggers `redirectToLogin`, users lose context and may lose in-progress work (e.g., form modals).

3. **`secureStorage` clear can still leave stale auth keys**
   - File: `src/utils/secureStorage.js`
   - Issue: `clear()` does not remove `kelmah_encryption_secret`, meaning stale encrypted data could persist and lead to inconsistent state across tabs after logout.

### 🧵 Maintenance / Technical Debt Hotspots

1. **`console.log`/`console.warn` logging spread across production code**
   - Many files (service health, warm-up, PWA, secure storage). Even if stripped in production, they clutter dev tools and can hide real warnings in noise.

2. **Large, monolithic modules still have TODOs for refactor**
   - JobsPage, ApplicationManagementPage, and other multi-hundred-line pages still have TODOs; this is a maintenance risk for onboarding new engineers.

3. **No structured feature flag / feature gating system**
   - Multiple behaviors are gated by `import.meta.env.*` checks; should be unified into a feature-flag system for safer throttle and rollouts.

---

If you want, I can start **turning these findings into a runnable backlog/tracking ticket format** (e.g., with labels, priority, and suggested fix steps per item). Just say “generate backlog tickets” and I’ll produce a structured backlog file with issue IDs and next-action tasks.
