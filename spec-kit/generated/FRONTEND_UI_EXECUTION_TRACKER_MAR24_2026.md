# Frontend UI Execution Tracker (Refreshed Baseline)

Date: March 24, 2026
Scope: Sprint-ready implementation tracker based on the refreshed re-audit baseline, excluding items closed in `FRONTEND_REAUDIT_FIXED_AREAS_MAR23_2026.md`.

## Workflow Rules

- Status values: `Todo`, `In Progress`, `Blocked`, `Review`, `Done`
- ETA format: `YYYY-MM-DD`
- Verification notes must cite at least one concrete check (build, smoke test, viewport QA, accessibility check)
- Mobile and desktop validation required before moving to `Done`

## Week 1 - Mobile Clarity and Primary Actions

| ID | Work Item | File Target | Status | Owner | ETA | Verification Notes |
|---|---|---|---|---|---|---|
| W1-01 | Reduce landing hero height on phones so primary CTA is above fold | kelmah-frontend/src/pages/HomeLanding.jsx | Done | FE-A | 2026-03-24 | Implemented and validated in Mar 24 pass; frontend build + smoke suites passed |
| W1-02 | Reorder hero trust + CTA sequence for faster first action | kelmah-frontend/src/pages/HomeLanding.jsx | Done | FE-A | 2026-03-24 | Mobile CTA/trust order implemented; frontend build + smoke suites passed |
| W1-03 | Improve category card readability on small screens | kelmah-frontend/src/pages/HomeLanding.jsx | Done | FE-A | 2026-03-24 | Category card sizing/typography adjusted for small screens; build + smoke suites passed |
| W1-04 | Normalize mobile content spacing in public shell | kelmah-frontend/src/modules/layout/components/Layout.jsx | Done | FE-A | 2026-03-24 | Public shell xs/sm spacing normalized; build + smoke suites passed |
| W1-05 | Improve bottom-nav active state clarity and badge legibility | kelmah-frontend/src/modules/layout/components/MobileBottomNav.jsx | Done | FE-A | 2026-03-24 | Active-state border/background and badge readability improved; build + smoke suites passed |
| W1-06 | Reduce jobs filter complexity on mobile | kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx | Done | FE-B | 2026-03-24 | Quick-filter chip row and reset path added for mobile flow reduction; build + smoke suites passed |
| W1-07 | Improve no-results guidance and reset action | kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx | Done | FE-B | 2026-03-24 | Empty-state guidance and explicit reset actions refined; build + smoke suites passed |
| W1-08 | Improve mobile job-card hierarchy (pay/location/urgency) | kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx | Done | FE-B | 2026-03-24 | Mobile hierarchy reinforced via pay/location/urgency blocks in job cards; build + smoke suites passed |
| W1-09 | Simplify messaging top bar controls on small screens | kelmah-frontend/src/modules/messaging/pages/MessagingPage.jsx | Done | FE-C | 2026-03-24 | Small-phone top-bar controls simplified and non-essential control hidden; build + smoke suites passed |
| W1-10 | Improve attachment guidance and empty-thread prompts | kelmah-frontend/src/modules/messaging/pages/MessagingPage.jsx | Done | FE-C | 2026-03-24 | Attachment and empty-thread guidance copy improved for clarity; build + smoke suites passed |

## Week 2 - Desktop Hierarchy and Dashboard Scanability

| ID | Work Item | File Target | Status | Owner | ETA | Verification Notes |
|---|---|---|---|---|---|---|
| W2-01 | De-clutter desktop header action cluster | kelmah-frontend/src/modules/layout/components/Header.jsx | Done | FE-B | 2026-03-24 | Header action area compacted, worker chips reduced on compact desktop, and unread summary chip added |
| W2-02 | Improve desktop notification/message visual priority | kelmah-frontend/src/modules/layout/components/Header.jsx | Done | FE-B | 2026-03-24 | Notification/message controls now show stronger unread visual priority with unread-total affordance |
| W2-03 | Improve worker dashboard first-screen task priority | kelmah-frontend/src/modules/worker/pages/WorkerDashboardPage.jsx | Done | FE-C | 2026-03-24 | Next-best-action priority strip and direct pipeline CTA added in first-screen header |
| W2-04 | Reduce worker dashboard KPI crowding on md/lg breakpoints | kelmah-frontend/src/modules/worker/pages/WorkerDashboardPage.jsx | Done | FE-C | 2026-03-24 | KPI card layout tuned to md=6/lg=4 for cleaner medium/large desktop density |
| W2-05 | Rebalance hirer dashboard modules toward action queues | kelmah-frontend/src/modules/hirer/pages/HirerDashboardPage.jsx | Done | FE-A | 2026-03-24 | Action-queue-first dashboard composition applied; build + smoke suites passed |
| W2-06 | Reduce chart density on smaller desktop widths | kelmah-frontend/src/modules/hirer/pages/HirerDashboardPage.jsx | Done | FE-A | 2026-03-24 | Chart container density tuned for 1024/1280 layouts; build + smoke suites passed |
| W2-07 | Re-group jobs desktop toolbar controls | kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx | Done | FE-B | 2026-03-24 | Results toolbar now groups jobs count, sort mode, and filter-state chips for faster scanability |
| W2-08 | Improve job details desktop section rhythm | kelmah-frontend/src/modules/jobs/pages/JobDetailsPage.jsx | Done | FE-B | 2026-03-29 | Checklist PASS: mobile(320/768) sticky action controls raised to 44x44 and compact spacing retained; desktop(1024/1440) hero and section rhythm confirmed via responsive p/spacing tokens; build + smoke suites passed |
| W2-09 | Standardize desktop card spacing and border rhythm | kelmah-frontend/src/theme/index.js | Done | FE-A | 2026-03-29 | Checklist PASS: mobile/desktop card-paper rhythm validated in both light and dark themes (Paper/Card radius 14-16, border/divider consistency, breakpoint overrides reviewed); build + smoke suites passed |
| W2-10 | Improve skip-link discoverability and focus visuals | kelmah-frontend/src/modules/layout/components/Layout.jsx | Done | FE-C | 2026-03-29 | Checklist PASS: mobile + desktop skip-link verified for visibility, focus ring, and contrast (accent background + strong focus outline); build + smoke suites passed |

## Week 3 - Trust, Payment, and Onboarding Language

| ID | Work Item | File Target | Status | Owner | ETA | Verification Notes |
|---|---|---|---|---|---|---|
| W3-01 | Clarify landing trust copy for first-time Ghana users | kelmah-frontend/src/pages/HomeLanding.jsx | Done | Design-UX | 2026-03-24 | Trust badge/copy ordering and wording clarified in hero; build + smoke suites passed |
| W3-02 | Add clearer payment confidence copy near critical actions | kelmah-frontend/src/modules/payment/pages/PaymentCenterPage.jsx | Done | FE-A | 2026-03-24 | Confidence note and trust chips added near wallet action controls |
| W3-03 | Improve payment method empty-state setup guidance | kelmah-frontend/src/modules/payment/pages/PaymentCenterPage.jsx | Done | FE-A | 2026-03-24 | Empty-state now includes explicit setup path guidance for first method |
| W3-04 | Improve payment transaction row readability on mobile | kelmah-frontend/src/modules/payment/pages/PaymentCenterPage.jsx | Done | FE-A | 2026-03-24 | Mobile transaction rows now include clearer amount block and movement labels |
| W3-05 | Improve login helper messaging clarity | kelmah-frontend/src/modules/auth/pages/LoginPage.jsx | Done | FE-C | 2026-03-24 | Added explicit login helper and fallback recovery guidance alert |
| W3-06 | Improve register role-specific expectations | kelmah-frontend/src/modules/auth/pages/RegisterPage.jsx | Done | FE-C | 2026-03-24 | Role expectation chips added for hirer and worker onboarding clarity |
| W3-07 | Improve search first-screen guidance and recovery actions | kelmah-frontend/src/modules/search/pages/SearchPage.jsx | Done | FE-B | 2026-03-24 | Added first-screen recovery guidance panel with quick-step chips |
| W3-08 | Improve job details trust panel placement near primary CTA | kelmah-frontend/src/modules/jobs/pages/JobDetailsPage.jsx | Done | FE-B | 2026-03-24 | Trust/status guidance reinforced directly above primary CTA action zone |
| W3-09 | Improve messaging retry/error copy for weak networks | kelmah-frontend/src/modules/messaging/pages/MessagingPage.jsx | Done | FE-C | 2026-03-24 | Messaging helper prompts and guidance copy refined for weak-network scenarios |
| W3-10 | Add plain-language status explanations for chips/badges | kelmah-frontend/src/modules/jobs/pages/JobDetailsPage.jsx | Done | Design-UX | 2026-03-24 | Added plain-language badge guide for verification, application state, and competition meaning |

## Week 4 - Accessibility, Consistency, and Closure

| ID | Work Item | File Target | Status | Owner | ETA | Verification Notes |
|---|---|---|---|---|---|---|
| W4-01 | Focus-visible audit for top interactive pages | kelmah-frontend/src/modules/layout/components/Header.jsx | Done | QA-A11y | 2026-03-24 | Header and notification action controls now enforce stronger focus-visible contrast and offset; build + smoke suites passed |
| W4-02 | Focus-visible audit for payment and auth flows | kelmah-frontend/src/modules/payment/pages/PaymentCenterPage.jsx | Done | QA-A11y | 2026-03-24 | Payment filters and action controls now include explicit keyboard-focus visuals; auth helper alerts already normalized; build + smoke suites passed |
| W4-03 | Verify touch-target minimums on key mobile actions | kelmah-frontend/src/modules/layout/components/MobileBottomNav.jsx | Done | QA-A11y | 2026-03-24 | Mobile nav action sizing and focus states verified in implementation; build + smoke suites passed |
| W4-04 | Normalize alert tone and structure across key pages | kelmah-frontend/src/pages/HomeLanding.jsx | Done | FE-A | 2026-03-24 | Home landing warning alert now uses consistent title + supporting detail format aligned with auth/payment helper alerts |
| W4-05 | Normalize error/empty/loading state composition pattern | kelmah-frontend/src/modules/common/components/common/EmptyState.jsx | Done | FE-B | 2026-03-24 | EmptyState now enforces consistent title-description-hint-actions pattern across types |
| W4-06 | Final mobile regression sweep | kelmah-frontend/src/modules/**/pages/*.jsx | Done | QA-UI | 2026-03-24 | Follow-up cleanup batch also normalized messaging comments and escrow amount label rendering; build + smoke suites passed |
| W4-07 | Final desktop regression sweep | kelmah-frontend/src/modules/**/pages/*.jsx | Done | QA-UI | 2026-03-24 | Follow-up cleanup batch removed remaining jobs/job-details encoding artifacts and re-validated with build + smoke suites |
| W4-08 | Build + smoke suite validation gate | kelmah-frontend | Done | QA-UI | 2026-03-24 | PASS: `npm run build` and routed smoke suites (`routed-paths`, `critical-path-happy-flow`, `critical-path-gateway-contract`) |
| W4-09 | Re-audit open items and mark closures | spec-kit/generated/FRONTEND_REAUDIT_OPEN_AREAS_MAR23_2026.md | Done | FE-Lead | 2026-03-24 | Open findings scope re-validated: responsive drift, console noise, and lint suppression checks closed |
| W4-10 | Final status-log closure update | spec-kit/STATUS_LOG.md | Done | FE-Lead | 2026-03-24 | Status log updated with closure evidence and tracker synchronization |

## Cross-Cutting Follow-up Tracks (Keep Active)

| ID | Work Item | File Target | Status | Owner | ETA | Verification Notes |
|---|---|---|---|---|---|---|
| X-01 | Reduce dev-only console noise in high-traffic modules | kelmah-frontend/src/modules/** | Done | FE-Platform | 2026-03-24 | Static grep audit confirms no direct `console.(log|warn|error|info|debug)` usage in `src/modules/**` |
| X-02 | Periodic contract review for query hooks and client auth refresh | kelmah-frontend/src/modules/jobs/hooks/useJobsQuery.js | Done | FE-Platform | 2026-03-24 | Verified stable query-key serialization, sanitized params, and request cancellation signal pass-through |
| X-03 | Periodic contract review for auth refresh cross-tab behaviors | kelmah-frontend/src/services/apiClient.js | Done | FE-Platform | 2026-03-24 | Verified public-auth refresh skip guards, queued unauthorized replay, and cross-tab logout sync handlers |

## Execution Notes

- This tracker intentionally excludes resolved items from:
  - `spec-kit/generated/FRONTEND_REAUDIT_FIXED_AREAS_MAR23_2026.md`
- Update status at least once per day during active sprint execution.
- Attach verification evidence in PR descriptions and mirror final closure in `spec-kit/STATUS_LOG.md`.
