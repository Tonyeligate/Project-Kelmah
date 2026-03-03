# Kelmah Platform — Deep Audit Report
**Date:** November 2025
**Scope:** Algorithm logic • Data liveliness • UI/UX mobile-first • Backend security/performance • Every major page + component
**Auditor:** GitHub Copilot (Claude Sonnet 4.6)
**Prior Fixes Applied:** 101-issue batch (Sep–Nov 2025) — all complete

---

## Finding Index

| ID | Severity | Category | Title |
|----|----------|----------|-------|
| AUD2-C01 | CRITICAL | UX / Logic | MyApplicationsPage fake "send" — drafts to sessionStorage only |
| AUD2-H01 | HIGH | Performance | JobsPage double-loads icons (eager + lazy) |
| AUD2-H02 | HIGH | Data Liveliness | Worker earnings always show GH₵0 — backend does not populate payment data |
| AUD2-H03 | HIGH | Mobile/A11y | WorkerSearchPage back button empty on mobile — no accessible label |
| AUD2-H04 | HIGH | Mobile/UX | MyApplicationsPage uses Table layout on mobile |
| AUD2-H05 | HIGH | Mobile/UX | JobManagementPage renders Table without mobile card fallback |
| AUD2-M01 | MEDIUM | Algorithm | job.controller.js defaults primarySkills to Construction silently |
| AUD2-M02 | MEDIUM | Algorithm | ApplicationManagementPage normalizeApplication can set jobId to full object |
| AUD2-M03 | MEDIUM | UX Gap | ForgotPasswordPage says email or phone but only submits email |
| AUD2-M04 | MEDIUM | Data Liveliness | HirerDashboard auto-refresh shows Just now permanently on silent failure |
| AUD2-M05 | MEDIUM | Data Liveliness | WorkerDashboard no auto-refresh — stale on job acceptance events |
| AUD2-M06 | MEDIUM | Security | JobDetailsPage isAuthenticated checks token presence not validity |
| AUD2-M07 | MEDIUM | Security | ForgotPasswordPage leaks server error messages to frontend |
| AUD2-M08 | MEDIUM | Performance | HirerDashboard 100ms artificial setTimeout delay on every load |
| AUD2-M09 | MEDIUM | Performance | JobManagementPage fires 5 separate API calls on mount one per status |
| AUD2-M10 | MEDIUM | Architecture | job.controller.js runs manual validation AND mongoose validateSync redundant |
| AUD2-M11 | MEDIUM | UX | JobDetailsPage share falls back to blocking alert on unsupported browsers |
| AUD2-M12 | MEDIUM | UX | ApplicationManagementPage displays 0 stars for workers with no reviews |
| AUD2-M13 | MEDIUM | Routing | routes/config bypasses module ResetPasswordPage broken module noted in comment |
| AUD2-L01 | LOW | UX | HomePage trust metrics are hardcoded static strings |
| AUD2-L02 | LOW | CSS | AnimatedStatCard shimmer CSS selector broken on inner Box |
| AUD2-L03 | LOW | Code Quality | job.controller.js createJob is 400+ lines — extract sub-functions |
| AUD2-L04 | LOW | Code Quality | JobsPage.jsx is 2533 lines — needs decomposition |
| AUD2-L05 | LOW | Code Quality | JobPostingPage.jsx is 1366 lines — needs decomposition |
| AUD2-L06 | LOW | Dev Logging | console.error in MyApplicationsPage catch fires in production |
| AUD2-L07 | LOW | Dev Logging | JobDetailsPage debug console.log fires on every job load in DEV |
| AUD2-L08 | LOW | Data | useJobsQuery staleTime 30s may be too short for job listings |

---

## CRITICAL Issues

### AUD2-C01 — MyApplicationsPage: "Send Message" button is a fake send
**File:** kelmah-frontend/src/modules/worker/pages/MyApplicationsPage.jsx lines 97-132

**What is wrong:**
handleSendMessage() does NOT send the message. It serialises a draft into sessionStorage under key kelmah_message_draft, closes the dialog, then navigates to /messages. The user sees a Send button and the dialog closes, but no message is ever transmitted. There is no call to messagingService or any API.

**Impact:** Workers believe their message was sent. Silent data loss. Core platform trust violation.

**Fix:** Call messagingService.sendMessage() with the recipient ID and content. Store the draft in sessionStorage only as a fallback when recipient ID is unknown.

---

## HIGH Issues

### AUD2-H01 — JobsPage: Eager + lazy icon imports double bundle cost
**File:** kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx lines 148-194

Icons like ElectricalServices, Plumbing, Construction, Handyman are imported eagerly AND wrapped in React.lazy(). This creates both the main chunk entries AND async chunk entries for the same modules. Remove the LazyIcons object entirely and use only the already-imported eager versions.

### AUD2-H02 — WorkerDashboard: Earnings always GH₵0
**File:** kelmah-frontend/src/modules/worker/pages/WorkerDashboardPage.jsx lines 226-270

earningsSummary extracts job.payment.amount but GET /api/jobs does not populate the payment field. Result: earnings always compute to 0. Fix: add .populate('payment', 'amount status paidAt') in job-service getJobs handler, or use user.totalEarnings as fallback from the auth/user store.

### AUD2-H03 — WorkerSearchPage: Back button empty text + no aria-label on mobile
**File:** kelmah-frontend/src/modules/hirer/pages/WorkerSearchPage.jsx line 55

{isMobile ? '' : 'Go Back'} renders empty button text on mobile. No aria-label present. Fix: add aria-label="Go back" and minWidth: 44 to the Button.

### AUD2-H04 — MyApplicationsPage: Table layout unusable on mobile
**File:** kelmah-frontend/src/modules/worker/pages/MyApplicationsPage.jsx

Full Table with header row used for application list on all screen sizes. On mobile (<600px) this causes horizontal overflow or unreadable column clipping. Fix: use card layout on mobile, table only on desktop (same pattern as MyBidsPage).

### AUD2-H05 — JobManagementPage: Table layout no mobile card fallback
**File:** kelmah-frontend/src/modules/hirer/pages/JobManagementPage.jsx line 653

The isMobile check at line 653 partially handles empty state but the main TableContainer lacks overflow-x: auto or a card-based mobile layout. Fix: wrap TableContainer with overflowX auto or add isMobile card rendering per row.

---

## MEDIUM Issues

### AUD2-M01 — job.controller.js: Silent Construction fallback for primarySkills
**File:** kelmah-backend/services/job-service/controllers/job.controller.js lines 190-202

Any category without a mapping in categoryToSkill silently becomes primarySkills: ['Construction']. Fix: return 400 for unmapped categories instead of silently misfiling the job, or expand the category map to cover all frontend-offered categories.

### AUD2-M02 — ApplicationManagementPage: normalizeApplication sets jobId to full object
**File:** kelmah-frontend/src/modules/hirer/pages/ApplicationManagementPage.jsx line 42

jobId: raw?.jobId || raw?.job causes jobId to be the full populated job object when raw.job is an object. Downstream API calls produce URLs like /api/jobs/[object%20Object]/... Fix: jobId: raw?.jobId || raw?.job?._id || raw?.job?.id || raw?.job

### AUD2-M03 — ForgotPasswordPage: UI says email or phone, only submits email
**File:** kelmah-frontend/src/modules/auth/pages/ForgotPasswordPage.jsx lines 115-125

Copy says "email address or phone number" but only one email TextField exists. Phone number support is not implemented. Fix: update copy to say email only, or implement phone field with detection logic.

### AUD2-M04 — HirerDashboard: lastRefreshed never set on initial load
**File:** kelmah-frontend/src/modules/hirer/pages/HirerDashboardPage.jsx lines 311-334

fetchDashboardData('initial-load') never calls setLastRefreshed(). handleRefresh() does, but only on manual refresh. The timeSinceRefresh display shows stale time after the initial load. Fix: add setLastRefreshed(Date.now()) inside the fetchDashboardData finally block.

### AUD2-M05 — WorkerDashboard: No auto-refresh
**File:** kelmah-frontend/src/modules/worker/pages/WorkerDashboardPage.jsx

Only fetches on mount. A new acceptance/rejection event is invisible until manual refresh. Fix: add a 90-second setInterval that calls fetchDashboardData(), matching the HirerDashboard DASH-001 pattern.

### AUD2-M06 — JobDetailsPage: isAuthenticated trusts token presence not validity
**File:** kelmah-frontend/src/modules/jobs/pages/JobDetailsPage.jsx line 152

const isAuthenticated = !!secureStorage.getAuthToken() — expired tokens pass this check. Fix: use Redux auth state: useSelector(state => !!state.auth.user && !!state.auth.token)

### AUD2-M07 — ForgotPasswordPage: Server error messages leaked to UI
**File:** kelmah-frontend/src/modules/auth/pages/ForgotPasswordPage.jsx line 34

setError(err.response?.data?.message || err.message) can expose messages like "User with email xyz not found" enabling email enumeration. Fix: replace with generic message "Unable to process your request. Please try again later."

### AUD2-M08 — HirerDashboard: Artificial 100ms delay on every dashboard load
**File:** kelmah-frontend/src/modules/hirer/pages/HirerDashboardPage.jsx line 213

await new Promise(resolve => setTimeout(resolve, 100)) adds 100ms latency to every fetch. The comment says it waits for auth token readiness — that race condition should be fixed at the route/auth layer, not patched with a delay. Fix: remove the setTimeout entirely.

### AUD2-M09 — JobManagementPage: 5 parallel API calls on every mount
**File:** kelmah-frontend/src/modules/hirer/pages/JobManagementPage.jsx lines 150-154

forEach over 5 statuses fires 5 separate GET /api/jobs?status=X requests. Fix: add a batch endpoint or combine into one fetchAllHirerJobs thunk that calls GET /api/jobs without status filter.

### AUD2-M10 — job.controller.js: Manual validation + mongoose validateSync is redundant
**File:** kelmah-backend/services/job-service/controllers/job.controller.js lines ~260-380

~120 lines of manual field validation is followed by jobDoc.validateSync() which checks the same constraints via the schema. Remove the manual block, rely on validateSync, and optionally map Mongoose error paths to user-friendly messages.

### AUD2-M11 — JobDetailsPage: share falls back to blocking alert()
**File:** kelmah-frontend/src/modules/jobs/pages/JobDetailsPage.jsx line 196

alert('Share feature not supported in your browser') blocks the JS thread and is unacceptable UX. Fix: copy URL to clipboard and show a Snackbar instead.

### AUD2-M12 — ApplicationManagementPage: 0 stars for new workers is misleading
**File:** kelmah-frontend/src/modules/hirer/pages/ApplicationManagementPage.jsx line 47

workerRating: Number(...?? 0) renders zero filled stars, indistinguishable from a poorly rated worker. Fix: pass null instead of 0 when no rating exists, and show "No reviews yet" caption.

### AUD2-M13 — routes/config bypasses module ResetPasswordPage
**File:** kelmah-frontend/src/routes/config.jsx line 19

Comment: "Use non-module page to avoid importing broken legacy module ResetPasswordPage". The module version is broken and bypassed. Fix: identify and fix the issue in src/modules/auth/pages/ResetPasswordPage.jsx and restore canonical import.

---

## LOW Issues

### AUD2-L01 — HomePage trust metrics are static
kelmah-frontend/src/modules/home/pages/HomePage.jsx lines 264-275
"5,000+ workers", "12,000+ jobs", "98% satisfaction" are hardcoded. Move to a platform stats API call.

### AUD2-L02 — AnimatedStatCard shimmer selector broken
kelmah-frontend/src/modules/jobs/pages/JobsPage.jsx lines 217-226
.MuiPaper-root:hover & targets ancestors not the Paper itself. Shimmer animation never fires.

### AUD2-L03 — job.controller.js createJob is 400+ lines
Extract prepareJobPayload(), validateJobPayload() helpers.

### AUD2-L04 — JobsPage.jsx is 2533 lines
Extract JobsHeroSection, JobsFilterPanel, AnimatedStatCard to separate files.

### AUD2-L05 — JobPostingPage.jsx is 1366 lines
Extract one component per form step: StepJobDetails, StepDescriptionSkills, StepBudgetScope, StepLocationVisibility, StepReviewPublish.

### AUD2-L06 — MyApplicationsPage console.error in production
Wrap with if (import.meta.env.DEV) or use the logger utility.

### AUD2-L07 — JobDetailsPage debug console.log already guarded by DEV
Already uses import.meta.env.DEV check. No action needed in production. Note for completeness.

### AUD2-L08 — useJobsQuery staleTime 30s possibly too aggressive
kelmah-frontend/src/modules/jobs/hooks/useJobsQuery.js line ~102
Consider increasing to 2 minutes to reduce backend query volume for near-static job listings.

---

## Per-Page Summary

| Page | Critical | High | Medium | Low | Status |
|------|----------|------|--------|-----|--------|
| MyApplicationsPage | C01 | H04 | — | L06 | URGENT |
| JobsPage | — | H01 | — | L02, L04, L08 | Performance |
| WorkerDashboardPage | — | H02 | M05 | — | Data accuracy |
| HirerDashboardPage | — | — | M04, M08, M09 | — | UX polish |
| JobDetailsPage | — | — | M06, M11 | L07 | Security + UX |
| JobManagementPage | — | H05 | M09 | — | Mobile + perf |
| ApplicationManagementPage | — | — | M02, M12 | — | Data correctness |
| WorkerSearchPage | — | H03 | — | — | Accessibility |
| ForgotPasswordPage | — | — | M03, M07 | — | Security |
| JobPostingPage | — | — | M10 | L05 | Acceptable |
| HomePage | — | — | — | L01 | Good |
| job.controller.js | — | — | M01, M10 | L03 | Maintainability |
| routes/config.jsx | — | — | M13 | — | Tech debt |

---

## Fix Roadmap

### Sprint 1 — Critical and High (this week, ~8h total)
1. AUD2-C01 — MyApplicationsPage real send (~2h)
2. AUD2-H01 — JobsPage remove LazyIcons (~30 min)
3. AUD2-H03 — WorkerSearchPage aria-label (~15 min)
4. AUD2-H04 — MyApplicationsPage mobile cards (~2h)
5. AUD2-H02 — Worker earnings fix (~3h)

### Sprint 2 — Medium Security and Data (next week, ~3h total)
6. AUD2-M06 — Redux auth state in JobDetailsPage (~20 min)
7. AUD2-M07 — Generic error in ForgotPasswordPage (~10 min)
8. AUD2-M04 — lastRefreshed on initial load (~30 min)
9. AUD2-M05 — WorkerDashboard auto-refresh (~30 min)
10. AUD2-M08 — Remove setTimeout(100) (~5 min)
11. AUD2-M11 — Share Snackbar fallback (~20 min)

### Sprint 3 — Medium Algorithm and UX (~7h total)
12. AUD2-M01 — Remove Construction fallback in job.controller
13. AUD2-M02 — normalizeApplication jobId fix
14. AUD2-M03 — Update ForgotPassword copy
15. AUD2-M09 — Batch status fetch in JobManagementPage
16. AUD2-M10 — Remove redundant manual validation
17. AUD2-M12 — Null rating with "No reviews yet" label
18. AUD2-M13 — Fix module ResetPasswordPage

### Sprint 4 — Low and Polish (as capacity allows)
All AUD2-L series items.

---

## Data Liveliness Summary

| Component | Behaviour | Recommendation |
|-----------|-----------|----------------|
| HirerDashboard | 60s auto-refresh active jobs | Fix initial lastRefreshed (M04) |
| WorkerDashboard | Mount-only | Add 90s auto-refresh (M05) |
| JobDetailsPage | Mount-only | 2 min poll or WS for proposalCount |
| JobsPage | React Query staleTime 30s | Consider increasing to 2 min |
| MyApplicationsPage | Mount-only | Pull-to-refresh + 2 min interval |
| MessagesPage | WebSocket Socket.IO | Good — real-time |

---

## Security Surface

| Area | Status | Finding |
|------|--------|---------|
| JWT validation | WARN — token presence only in JobDetailsPage | AUD2-M06 |
| Error message leakage | WARN — ForgotPassword | AUD2-M07 |
| Email enumeration | WARN — ForgotPassword error path | AUD2-M07 |
| CORS | OK — gateway-level | — |
| Rate limiting | OK — gateway-level | — |
| Input validation | OK — Joi + Mongoose validateSync | Note redundancy M10 |
| Auth on protected routes | OK — ProtectedRoute + gateway middleware | — |
| XSS | OK — React auto-escapes, no dangerouslySetInnerHTML found | — |

---

Total new findings: 27 (1 Critical, 5 High, 13 Medium, 8 Low)
