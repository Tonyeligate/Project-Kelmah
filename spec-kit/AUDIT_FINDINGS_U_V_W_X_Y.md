# Kelmah Frontend — Focused Quality Audit Report

**Generated**: 2025-06-18  
**Scope**: `kelmah-frontend/src/modules/**` (57 pages, 164 components)  
**Categories**: U, V, W, X, Y

---

## Category U — API Mutations with No Snackbar / Toast Feedback

Silent success paths where the user performs a write action (POST/PUT/PATCH/DELETE) and receives zero visual confirmation.

| # | File | Line(s) | Issue |
|---|------|---------|-------|
| U1 | `src/modules/profile/pages/ProfilePage.jsx` | ~140 | `handleSave` → calls `updateProfile(formData)` — no success or error toast anywhere in the file. |
| U2 | `src/modules/profile/pages/ProfilePage.jsx` | ~390–398 | `updateSkills()` called inline inside JSX callback — no user feedback. |
| U3 | `src/modules/profile/pages/ProfilePage.jsx` | ~456–465 | `updateEducation()` called inline — no user feedback. |
| U4 | `src/modules/profile/pages/ProfilePage.jsx` | ~508–517 | `updateExperience()` called inline — no user feedback. |
| U5 | `src/modules/profile/pages/ProfilePage.jsx` | ~600 | `updatePreferences()` via debounced callback — no feedback. |
| U6 | `src/modules/payments/pages/PaymentMethodsPage.jsx` | ~99–125 | `handleAddCard` — error displayed via `setError()` but on success only closes dialog. No success toast. |
| U7 | `src/modules/payments/pages/PaymentMethodsPage.jsx` | ~128–148 | `handleAddMobile` — same silent-success pattern. |
| U8 | `src/modules/payments/pages/PaymentMethodsPage.jsx` | ~150–178 | `handleAddBank` — same silent-success pattern. |
| U9 | `src/modules/payments/pages/PaymentMethodsPage.jsx` | ~183–192 | `handleSetDefault` — same silent-success pattern. |
| U10 | `src/modules/payments/pages/PaymentMethodsPage.jsx` | ~198–212 | `handleConfirmDelete` — same silent-success pattern. |
| U11 | `src/modules/search/pages/SearchPage.jsx` | 684 | `handleSaveWorker` → `api.post('/users/workers/${worker.id}/bookmark')` — no success/error toast, only `console.error` on failure. |
| U12 | `src/modules/jobs/components/EnhancedJobCard.jsx` | ~100–118 | `handleBidSubmit` → `bidApi.createBid()` — no success or error feedback; only `console.error` in DEV mode. |
| U13 | `src/modules/profile/components/ProfilePicture.jsx` | 55–66 | `handleUpload` — no success/error toast; only `console.error` in DEV. |
| U14 | `src/modules/profile/components/ProfilePicture.jsx` | 69–78 | `handleRemove` — no success/error toast; only `console.error` in DEV. |
| U15 | `src/modules/hirer/pages/ApplicationManagementPage.jsx` | 207–227 | `handleStatusUpdate` → `hirerService.updateApplicationStatus()` — no success toast. Error path only sets `setError()` string. |

**Counter-examples (good patterns observed)**:
- `SchedulingPage.jsx` — every handler calls `enqueueSnackbar()` on success and error.
- `AccountSettings.jsx` / `SecuritySettings.jsx` — proper snackbar on success and error.
- `PremiumPage.jsx` — renders `upgradeSuccess` Snackbar/Alert on upgrade.
- `ContractDetailsPage.jsx` — uses `setToast()` on every action (cancel, sign, milestone, dispute).

---

## Category V — Images / CardMedia with No `onError` and No Fallback

`<CardMedia image={...}>` or `<img src={...}>` where a broken/null URL will render a blank rectangle or browser-default broken icon with no recovery.

| # | File | Line(s) | Issue |
|---|------|---------|-------|
| V1 | `src/modules/worker/components/ProjectShowcase.jsx` | 32, 43 | Two `<CardMedia>` using `beforeImageUrl` and `afterImageUrl` — no `onError`, no null guard. If either URL is `undefined`, renders empty card. |
| V2 | `src/modules/worker/components/PortfolioGallery.jsx` | 24 | `<CardMedia image={item.thumbnailUrl}>` — no `onError`, no fallback box. |
| V3 | `src/modules/worker/components/WorkerProfile.jsx` | ~1165 | `<CardMedia image={item.image}>` (portfolio section) — no `onError` handler. Conditional render on `item.image` prevents `undefined`, but a broken URL will still show a blank. |
| V4 | `src/modules/jobs/components/EnhancedJobCard.jsx` | ~206 | `<CardMedia image={job.coverImage}>` — no `onError` handler. |
| V5 | `src/modules/jobs/components/JobCard.jsx` | ~195 | `<CardMedia image={coverImage}>` — no `onError` handler. |
| V6 | `src/modules/hirer/pages/JobManagementPage.jsx` | ~305 | `MobileJobCard` → `<CardMedia image={job.coverImage}>` — no `onError`. Has conditional render so null won't render, but broken URL still breaks. |
| V7 | `src/modules/worker/components/PortfolioManager.jsx` | 313 | `<CardMedia image={item.images[0]}>` — no `onError`. (Has fallback Box when `images` array is empty, but not when URL is broken.) |

**Note**: MUI `<Avatar>` components (e.g., ContractCard, UserCard) gracefully degrade to initials when `src` fails — these are NOT flagged.

---

## Category W — Text Truncation / Overflow Missing

Typography elements that render user-generated content without `noWrap`, `text-overflow: ellipsis`, or line-clamp — risk of breaking card layouts on long titles/names.

| # | File | Line(s) | Issue |
|---|------|---------|-------|
| W1 | `src/modules/jobs/components/JobCard.jsx` | ~215 | Title `<Typography>{title}</Typography>` with `flexGrow:1` — no `noWrap`, no `textOverflow`. A 200-character title will shatter the card header. |
| W2 | `src/modules/contracts/components/ContractCard.jsx` | ~100–107 | Contract title — `lineHeight: 1.4, flexGrow: 1` with no truncation. |
| W3 | `src/modules/contracts/components/ContractCard.jsx` | ~85 | `hirer.name` — `variant="subtitle2"` with no overflow handling. |
| W4 | `src/modules/worker/components/WorkerProfile.jsx` | 1174 | Portfolio `item.title` — no truncation. Renders raw inside `<Typography variant="subtitle1">`. |
| W5 | `src/modules/worker/components/WorkerProfile.jsx` | 1177 | Portfolio `item.description` — no truncation or line-clamp. |
| W6 | `src/modules/worker/components/PortfolioGallery.jsx` | 30 | `item.title` — `<Typography variant="h6">` with no `noWrap` or line-clamp. |
| W7 | `src/modules/worker/components/PortfolioGallery.jsx` | 35 | `item.description` — rendered untruncated inside `<Typography variant="body2">`. |
| W8 | `src/modules/hirer/pages/JobManagementPage.jsx` | ~310 | `MobileJobCard` → `job.title` with `sx={{ flex: 1, pr: 1 }}` but no `noWrap` / `textOverflow`. |
| W9 | `src/modules/worker/components/PortfolioManager.jsx` | 337 | Portfolio item `item.title` — `<Typography variant="h6">` with no overflow handling. |

**Counter-examples (good patterns observed)**:
- `NearbyJobsPage.jsx` (line ~490): Quote dialog description uses `-webkit-line-clamp: 2` with `textOverflow: 'ellipsis'`.
- `PortfolioManager.jsx` (line ~340): Description uses JS `substring(0, 100)` truncation — acceptable.

---

## Category X — Mobile Bottom Navigation Overlap

Elements using `position: 'fixed', bottom: 0` (or very small bottom offset) that will be fully or partially hidden behind the 56px `MobileBottomNav`. `Layout.jsx` applies `pb` to the content wrapper, but that does NOT push fixed-position elements up.

| # | File | Line(s) | Issue |
|---|------|---------|-------|
| X1 | `src/modules/jobs/pages/JobDetailsPage.jsx` | 855–856 | Sticky CTA bar: `position: 'fixed', bottom: 0` with `pb: 'calc(12px + env(safe-area-inset-bottom))'`. Does NOT add `BOTTOM_NAV_HEIGHT` (56px) — the CTA sits directly under the nav bar on mobile. |
| X2 | `src/modules/contracts/pages/CreateContractPage.jsx` | 983–984 | Sticky action bar: `position: 'fixed', bottom: 0` — no `BOTTOM_NAV_HEIGHT` offset. Back/Next buttons hidden behind bottom nav. |
| X3 | `src/modules/hirer/pages/JobPostingPage.jsx` | 1327–1328 | Sticky action bar: `position: 'fixed', bottom: 0` — no `BOTTOM_NAV_HEIGHT` offset. Back/Post buttons hidden behind bottom nav. |
| X4 | `src/modules/worker/components/WorkerProfile.jsx` | 1634 | `<SpeedDial>` FAB: `position: 'fixed', bottom: 16, right: 16` — overlaps bottom nav on mobile (needs `bottom: 72+` on xs). |

**Counter-examples (correctly handled)**:
- `HirerDashboardPage.jsx` (line 990): `<SpeedDial bottom={{ xs: 80, md: 32 }}>` — accounts for nav bar. ✅
- `NearbyJobsPage.jsx` (line 441): FAB `bottom: 80` — clearance above nav. ✅

---

## Category Y — Stale Data / Missing Cache Invalidation After Mutation

Write operations that succeed but leave the UI showing old data because there is no refetch, no Redux state update from fulfillment, and no `queryClient.invalidateQueries`.

| # | File | Line(s) | Issue |
|---|------|---------|-------|
| Y1 | `src/modules/hirer/pages/ApplicationManagementPage.jsx` | 221–226 | `handleStatusUpdate` — on success, removes application from local `allApplications` array via `filter()`. No server refetch to reconcile (e.g., server-side status change notifications, updated counts). If the API silently fails or returns different data, the UI diverges. |
| Y2 | `src/modules/jobs/components/EnhancedJobCard.jsx` | ~100–118 | `handleBidSubmit` — after successful `bidApi.createBid()`, no state update or refetch. The bid form remains active; no UI indication the bid was recorded. |

**Cleared (Redux slices properly handle)**:
- `JobManagementPage.jsx`: `updateJobStatus` / `deleteHirerJob` — `hirerSlice.js` (lines 522, 544) moves/removes the job in Redux state from the fulfilled action payload. ✅
- `ContractDetailsPage.jsx`: `cancelContract` / `signContract` / `sendContractForSignature` / `completeMilestone` — `contractSlice.js` (lines 291, 320, 376, 398) updates `state.currentContract` from fulfilled payload. ✅
- `PaymentMethodsPage.jsx`: All handlers call `await fetchMethods()` explicitly. ✅

---

## Summary

| Category | Issues Found |
|----------|-------------|
| **U** — Missing snackbar / toast | **15** |
| **V** — Image / CardMedia no fallback | **7** |
| **W** — Text truncation missing | **9** |
| **X** — Bottom nav overlap | **4** |
| **Y** — Stale data / no invalidation | **2** |
| **Total** | **37** |
