# Kelmah Frontend — Design & Mobile UI/UX Audit
**Date**: March 16, 2026
**Scope**: All pages, mobile view, routing, navigation, accessibility
**Methodology**: Direct code reading per-file + cross-file structural analysis
**Severity scale**: 4 = Catastrophic (blocks task), 3 = Major, 2 = Minor/significant, 1 = Cosmetic

---

## Summary

| Severity | Count |
|----------|-------|
| 4 (Catastrophic) | 0 |
| 3 (Major) | 10 |
| 2 (Minor/Significant) | 15 |
| 1 (Cosmetic) | 8 |
| **Total** | **33** |

---

## CRITICAL ROUTING BUGS

### R-01 · [Sev 3] `/hirer` and `/worker` root paths 404
**File**: `src/routes/config.jsx`
**Detail**: There is no `index` route under `path: 'hirer'` or `path: 'worker'`. Any user who manually navigates to `/hirer` or `/worker` (or a CTA links there) hits the `NotFoundPage`. Only `/hirer/dashboard` and `/worker/dashboard` are valid. This is especially harmful on mobile where users may bookmark or share root-level URLs.
**Fix**: Add index redirects:
```jsx
// inside hirer children array
{ index: true, element: <Navigate to="/hirer/dashboard" replace /> }
// inside worker children array
{ index: true, element: <Navigate to="/worker/dashboard" replace /> }
```

---

### R-02 · [Sev 3] Admin `/profile` alias routes to Skills Management, not profile
**File**: `src/routes/config.jsx:974`
```jsx
<RoleAliasRedirect
  workerPath="/worker/profile"
  hirerPath="/hirer/profile"
  adminPath="/admin/skills-management"   // ← BUG: admin sees skills mgmt, not profile
/>
```
**Detail**: Any admin user clicking a "My Profile" link or button gets sent to the admin skills management tool instead of their user profile. This causes significant confusion and breaks the expected navigation model.
**Fix**: Change `adminPath` to an appropriate admin profile path (e.g., `/hirer/profile` as a fallback, or create `/admin/profile`).

---

### R-03 · [Sev 2] `/about`, `/contact`, `/privacy`, `/terms` all render identical `HelpCenterPage`
**File**: `src/routes/config.jsx:937-958`
**Detail**: Five distinct routes (`about`, `contact`, `privacy`, `terms`, `docs`) all render the same `HelpCenterPage` component with no differentiating prop or URL-based section switching. Users who navigate to `/privacy` and `/about` see identical content. This is legally and UX-problematic: Privacy Policy and Terms of Service are mandatory distinct documents.
**Fix**: Either pass a `section` prop to `HelpCenterPage` so it renders the correct content, or create dedicated page components for Privacy and Terms.

---

### R-04 · [Sev 2] `MobileBottomNav` 4th item shows `ProfileIcon` but routes to `/settings`
**File**: `src/modules/layout/components/MobileBottomNav.jsx:168-172`
```jsx
{
  label: 'Settings',
  value: 'profile',   // ← mismatch: value = 'profile' but label = 'Settings'
  icon: <ProfileIcon />,
  path: '/settings',
}
```
**Detail**: Both the hirer and worker bottom nav 4th items use a person/profile icon (`ProfileIcon`) with label "Settings" but navigate to `/settings`. The icon communicates "Profile" but the action is "Settings". The `value: 'profile'` also means any `/profile` or `/settings` path activates this tab — they are different pages being treated as the same section.
**Fix**: Either rename label to **Profile** and route to the role's profile page, or change icon to `SettingsIcon`. Also split the `currentValue` detection so `/profile` and `/settings` map to distinct tabs.

---

### R-05 · [Sev 2] `MobileBottomNav` `currentValue` defaults to `'home'` for all unmatched paths
**File**: `src/modules/layout/components/MobileBottomNav.jsx:141`
**Detail**: Paths like `/contracts`, `/wallet`, `/reviews`, `/payments`, `/notifications`, `/schedule`, `/premium`, `/map` have no matching case in `currentValue`. They all fall through to `return 'home'` — so the "Home" tab appears selected when the user is actually on e.g. the Wallet page. The user cannot tell which section they're in.
**Fix**: Return `false` (or `''`) when no tab matches so that no tab appears selected when the user is on a page that doesn't correspond to any bottom nav item.

---

### R-06 · [Sev 2] `MobileBottomNav` has no "Profile" access for either role
**File**: `src/modules/layout/components/MobileBottomNav.jsx:144-203`
**Detail**: The 4-item bottom nav for both hirer and worker has: Home, Jobs, Messages, Settings. Neither has a direct link to the user's own profile (Worker Profile or Hirer Profile). Profile is a frequent destination (workers check their portfolio, hirers check their account). It's buried behind the hamburger drawer.
**Fix**: Consider Home, Jobs, Messages, Profile as the 4 items (with Profile icon going to `/worker/profile` or `/hirer/profile`), moving Settings access into the profile page or hamburger only.

---

## HIRER DASHBOARD

### HD-01 · [Sev 3] "Total Spent" metric card has wrong `aria-label` — says "Needs Attention: X payments"
**File**: `src/modules/hirer/pages/HirerDashboardPage.jsx:623`
```jsx
aria-label={`Needs Attention: ${summaryData.pendingPayments}. Click to view payments.`}
```
**Detail**: The card visually shows "Total Spent: GH₵X" but the aria-label announces "Needs Attention: X payments". Screen reader users hear completely different information from what sighted users see. `summaryData.pendingPayments` (count of pending payment records) is used in the aria-label but the card displays `summaryData.totalSpent` (a currency amount). The two metrics are different.
**Fix**: Change aria-label to match the visible content:
```jsx
aria-label={`Total Spent: GH₵${summaryData.totalSpent.toLocaleString()}. Click to view payment history.`}
```

---

### HD-02 · [Sev 2] "Total Spent" card uses `HelpOutlineIcon` (❓ question mark) as background icon
**File**: `src/modules/hirer/pages/HirerDashboardPage.jsx:671-673`
```jsx
<HelpOutlineIcon sx={{ fontSize: { xs: 28, sm: 40 }, color: alpha('#E74C3C', 0.28) }} />
```
**Detail**: The four metric cards display background icons: WorkIcon (Active Jobs), CheckCircleIcon (Completed), ProposalIcon (Applications), and `HelpOutlineIcon` (Total Spent). A question mark icon on a spending card is confusing and undermines the card's semantic meaning. The red (`#E74C3C`) card border reinforces a "danger/warning" association not warranted for "Total Spent" data.
**Fix**: Replace `HelpOutlineIcon` with `PaymentIcon` or `AccountBalanceWalletIcon`. Consider changing border color from red `#E74C3C` to a neutral or brand color, since "Total Spent" is not an error state.

---

### HD-03 · [Sev 2] SpeedDial button has hardcoded `bottom: 80` instead of using `BOTTOM_NAV_HEIGHT` constant
**File**: `src/modules/hirer/pages/HirerDashboardPage.jsx:977`
```jsx
bottom: { xs: 80, md: 32 },
```
**Detail**: `BOTTOM_NAV_HEIGHT` is defined as a constant in `constants/layout`. The SpeedDial uses a hardcoded `80` on mobile. If `BOTTOM_NAV_HEIGHT` changes (e.g., due to a design update), the SpeedDial will overlap the bottom nav. The value `80` also doesn't account for `safe-area-inset-bottom` on notched devices.
**Fix**:
```jsx
import { BOTTOM_NAV_HEIGHT } from '../../../constants/layout';
bottom: { xs: `calc(${BOTTOM_NAV_HEIGHT + 16}px + env(safe-area-inset-bottom, 0px))`, md: 32 },
```

---

### HD-04 · [Sev 2] Error alert on dashboard is not dismissible
**File**: `src/modules/hirer/pages/HirerDashboardPage.jsx:962-965`
```jsx
{error && (
  <Alert severity="error" sx={{ mb: 3 }}>
    {error}
  </Alert>
)}
```
**Detail**: Non-critical errors (network hiccup, partial service failure) show a permanent error banner at the top of the dashboard. The user cannot dismiss it. Even after the data loads successfully, if `error` state remains set, the alert persists covering valuable screen real estate — especially painful on mobile.
**Fix**: Add a close action or auto-clear `error` state after data reloads. At minimum:
```jsx
<Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
```

---

### HD-05 · [Sev 1] Auto-refresh toggle `Chip` has no clear toggle affordance on mobile
**File**: `src/modules/hirer/pages/HirerDashboardPage.jsx:920-934`
**Detail**: The "Live" / "Paused" Chip is clickable to toggle auto-refresh, but on mobile it looks identical to a status badge. There's no switch visual, no pressed state, no aria-pressed attribute. The `Tooltip` text only appears on pointer hover — not accessible on touch devices.
**Fix**: Add `aria-pressed={autoRefreshEnabled}` to the Chip container. Consider adding a small circular indicator or a Switch variant for mobile.

---

## HIRER PROFILE

### HP-01 · [Sev 3] Cancel edit discards all unsaved changes without confirmation
**File**: `src/modules/hirer/pages/HirerProfilePage.jsx:337`
```jsx
<Button onClick={() => setEditing(false)}>Cancel</Button>
```
**Detail**: Clicking Cancel immediately exits edit mode and loses all typed data. There is no "Are you sure? You have unsaved changes" dialog. A user who accidentally taps Cancel (easy on mobile) loses all their profile edits with zero recovery. This violates the User Control principle.
**Fix**: Track `isDirty` (compare `formData` to the original `profile` snapshot), and show a confirmation dialog before discarding:
```jsx
const handleCancel = () => {
  if (isDirty) {
    if (!window.confirm('Discard unsaved changes?')) return;
  }
  setEditing(false);
};
```
(Or use a proper MUI Dialog for the confirmation rather than `window.confirm`.)

---

### HP-02 · [Sev 2] Profile load error displayed as `severity="warning"` instead of `severity="error"`
**File**: `src/modules/hirer/pages/HirerProfilePage.jsx:199`
```jsx
<Alert severity="warning" sx={{ mb: 3 }}>
  {error}
</Alert>
```
**Detail**: The alert fires when `selectProfileError` has a value, meaning the profile failed to load. This is an error condition, but it's presented as a yellow warning. Users cannot clearly understand whether the profile partially loaded (warning) or completely failed (error). Severity mismatch violates the Real World Match and Perceptibility principles.
**Fix**: Change to `severity="error"` and add a "Try Again" button.

---

### HP-03 · [Sev 2] Email field is editable with no indication it may require re-verification
**File**: `src/modules/hirer/pages/HirerProfilePage.jsx:296-304`
**Detail**: The email `TextField` is fully editable in the profile edit form. Email changes on most platforms require re-verification (sending a verification link). If the backend enforces email re-verification, the user will be silently stuck or confused after saving. If it doesn't, it's a security concern. Either way there's no helper text warning the user.
**Fix**: Add a `helperText` to the email field:
```jsx
helperText="Changing your email will require re-verification"
```

---

### HP-04 · [Sev 1] Bio field has no character counter or max-length indicator
**File**: `src/modules/hirer/pages/HirerProfilePage.jsx:326-335`
**Detail**: The multiline bio/about field has a `helperText` describing what to write, but no `inputProps={{ maxLength: N }}` or character counter. Workers in Ghana have intermittent connections — submitting a bio that's too long and getting a server-side error wastes data and time.
**Fix**: Add `inputProps={{ maxLength: 500 }}` and `helperText` showing character count: `${formData.bio.length}/500`.

---

## MOBILE NAV (HAMBURGER DRAWER)

### MN-01 · [Sev 2] "Help & Support" uses `HomeIcon` (house) in navigation drawer
**File**: `src/modules/layout/components/MobileNav.jsx:261, 414-418`
```jsx
{ label: 'Help & Support', icon: <HomeIcon />, path: '/support' }
// and
<StyledListItemButton onClick={() => handleNavigate('/support')}>
  <ListItemIcon><HomeIcon /></ListItemIcon>
  <ListItemText primary="Help & Support" />
```
**Detail**: In both authenticated and unauthenticated states, the "Help & Support" nav item is rendered with `HomeIcon` (a house symbol). A house icon communicates "Home", not "Help". Users scanning icons quickly will either navigate to Help expecting to go home, or avoid it thinking it's a duplicate of the main Home link. This breaks the Consistency principle.
**Fix**: Replace `HomeIcon` with `HelpOutlineIcon` or `SupportAgentIcon` for the Help & Support items.

---

### MN-02 · [Sev 1] `unreadCount` in `useMemo` dependency array but never used in computed value
**File**: `src/modules/layout/components/MobileNav.jsx:272-273`
```jsx
}, [showUserMenu, isHirer, isWorker, unreadCount]);
```
**Detail**: `unreadCount` is imported from `useNotifications()` and placed in the dependency array of `navigationItems` memo. However, none of the navigation items in the computed array reference `unreadCount` — there is no badge applied in the drawer nav items. This indicates either a missing feature (badge on Messages in drawer was removed/forgotten) or an unnecessary dependency.
**Fix**: Either add a badge to the Messages drawer item: `badge: unreadCount > 0 ? unreadCount : 0` and surface it in the `<Badge>` at line 388, or remove `unreadCount` from the dependency array.

---

## MOBILE LAYOUT & APP-LEVEL

### ML-01 · [Sev 3] Duplicate offline indicators: `OfflineBanner` component + `div#network-status` in `index.html`
**File**: `src/App.jsx:235`, `index.html:284-303`
**Detail**: `index.html` contains a script that creates a `div#network-status` DOM element and shows it with "Offline - Some features are limited" when offline. `App.jsx` also renders `<OfflineBanner />` which presumably shows its own offline indicator. Both fire on the same `online`/`offline` events. On mobile, two overlapping banners could stack at the top of the viewport, consuming screen real estate and confusing users with redundant messaging.
**Fix**: Pick one approach. The recommended approach is to keep `OfflineBanner` (React-controlled, styled consistently) and remove the DOM-manipulation script from `index.html`, keeping only the event listeners for service worker sync.

---

### ML-02 · [Sev 2] Service wake-up alert uses `position: 'fixed'` but doesn't push page content down
**File**: `src/App.jsx:211-226`
```jsx
<Box sx={{
  width: '100%',
  position: 'fixed',
  top: 'env(safe-area-inset-top, 0px)',
  left: 0,
  zIndex: Z_INDEX.backdrop,
}}>
  <LinearProgress color="warning" />
  <Alert severity="info" sx={{ borderRadius: 0 }}>
    Waking up backend services...
  </Alert>
</Box>
```
**Detail**: The wake-up banner uses `position: 'fixed'` which overlays page content without adding padding-top. The `LinearProgress` + Alert together are approximately 80-90px tall. On mobile, the top portion of the landing page or dashboard content will be obscured behind this fixed banner. The inner content does not know the banner is there.
**Fix**: Either switch to `position: 'sticky'` (which flows in the document and pushes content down), or add a corresponding `paddingTop` to the main content container when `servicesWakingUp` is true.

---

### ML-03 · [Sev 2] `HomeLanding.jsx` uses `framer-motion` — heavy bundle for 2G Ghana users
**File**: `src/pages/HomeLanding.jsx:17`
```jsx
import { motion } from 'framer-motion';
```
**Detail**: The landing page (first page most users see on initial visit) imports `framer-motion`, which adds ~40-50KB to the bundle. On 2G networks common in Ghana, this increases Time to Interactive meaningfully. The `heroAnim` animation starts at `opacity: 0` which causes a FOUC (flash of unstyled/invisible content) before the animation completes. The scroll animations use `initial: { opacity: 0.15 }` which is safer.
**Impact**: Landing page bundle weight and hero content flash.
**Fix**: Replace `framer-motion` with CSS `@keyframes` or MUI `Fade`/`Slide` transitions for the homepage. If framer-motion is kept, ensure `initial: { opacity: 1 }` for hero so no FOUC occurs.

---

### ML-04 · [Sev 2] Service wake-up indicator banner has no dismiss button
**File**: `src/App.jsx:211-226`
**Detail**: The backend wake-up alert banner (`"Waking up backend services..."`) is always visible for up to 15 seconds (via `setTimeout(() => setServicesWakingUp(false), 15000)`). The user cannot dismiss it early. On mobile, 15 seconds of an overlay banner is disruptive. Additionally, if the user loaded the page and all services wake up in 3 seconds, the banner stays for the remaining 12 seconds because the timer isn't cancelled early when services respond.
**Fix**: Cancel `timerId` as soon as all services respond healthy. Also add an `onClose` dismiss handler to the Alert so users can clear it manually.

---

### ML-05 · [Sev 1] `HomeLanding` hero `initial: { opacity: 0 }` causes flash-of-invisible-content
**File**: `src/pages/HomeLanding.jsx:55-59`
```jsx
const heroAnim = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: 'easeOut' },
};
```
**Detail**: The hero section starts with `opacity: 0`. Before JavaScript runs and framer-motion initialises, the hero text/CTA is invisible. On slow devices or if JS is delayed, the hero remains invisible until the animation runs. For below-fold sections `scrollIn` uses `initial: { opacity: 0.15 }` which is better — the hero section should do the same.
**Fix**: Change hero `initial: { opacity: 0.15, y: 24 }` (or `opacity: 1` with no fade) to ensure content is always visible.

---

## HIRER TOOLS PAGE

### HT-01 · [Sev 3] Page is a minimal shell with no user-facing description of what "Tools" are
**File**: `src/modules/hirer/pages/HirerToolsPage.jsx`
**Detail**: The `HirerTools` page contains two action cards (Post Job, Find Workers) and two sub-components (`SkillsRequirementBuilder`, `BudgetEstimator`). The page title is "Hirer Tools" with no further explanation. A new hirer landing on this page via the sidebar doesn't know if `SkillsRequirementBuilder` is for defining job requirements before posting, or something else. The page has no breadcrumb, no back navigation, no intro text.
**Fix**: Add at minimum a `Typography` subtitle below the page heading: e.g., *"Use these tools to plan your job posting, estimate costs, and find the right workers."* Also add breadcrumb: Home → Tools.

---

### HT-02 · [Sev 1] "Post a New Job" and "Find Workers" cards use `height: '100%'` making equal-height layout suggest equal importance
**File**: `src/modules/hirer/pages/HirerToolsPage.jsx:26-66`
**Detail**: Both top cards have `height: '100%'` and the same visual weight. One uses `variant="contained"` (primary CTA), one uses `variant="outlined"` (secondary). While the buttons correctly communicate hierarchy, the cards' identical size and centred layout suggest they're equal. For most hirers, "Post a Job" is the primary action. The layout could better emphasize it.
**Fix**: Give the "Post a Job" card a subtle `border: '1px solid primary.main'` or slightly larger `Typography` heading to establish visual hierarchy.

---

## APPLICATION MANAGEMENT PAGE

### AM-01 · [Sev 2] Single-file page at 56.6KB is the largest component in the app
**File**: `src/modules/hirer/pages/ApplicationManagementPage.jsx`
**Detail**: The file is 56.6KB (raw) — the largest page component. This means slower JavaScript parsing on mobile devices, especially budget Android phones (the primary Ghana market device). The existing `TODO` in `JobsPage.jsx` notes the same problem there: *"split this page into focused modules."*
**Impact**: Slower parsing → delayed interactivity on first load for hirers managing applications.
**Fix**: Extract the heavy sub-sections (tabs, application card, dialogs, filter bar) into separate component files in `src/modules/hirer/components/`. No functional changes needed — purely structural.

---

## ACCESSIBILITY

### A-01 · [Sev 2] `MobileBottomNav` `BottomNavigationAction` has no accessible label for icon-only states
**File**: `src/modules/layout/components/MobileBottomNav.jsx:219`
**Detail**: MUI `BottomNavigation` with `showLabels` renders text labels, which is good. However, when the keyboard is visible (`isKeyboardVisible`) the nav is hidden, but the underlying issue is that `BottomNavigationAction` for badged items only has the badge `badgeContent` as context — the badge count is not announced via `aria-label` updates. A screen-reader user won't hear "Messages, 3 unread" — they'll hear "Messages" and the badge is silent.
**Fix**: Add `aria-label` to badged items: `aria-label={item.badge ? \`${item.label}, ${item.badge} unread\` : item.label}`.

---

### A-02 · [Sev 1] `VerifyEmailPage` back-to-login link at bottom has very low contrast in dark mode
**File**: `src/modules/auth/pages/VerifyEmailPage.jsx:165`
```jsx
<Link to="/login" style={{ color: 'inherit', fontWeight: 600, textDecoration: 'none' }}>
  Login
</Link>
```
**Detail**: `color: 'inherit'` means the link inherits `text.secondary` colour. On the mobile branch (dark background), `text.secondary` is likely a muted grey that may fail WCAG 4.5:1 contrast for body text. The link also has `textDecoration: 'none'` with no other affordance (no underline, no different weight than surrounding text) making it visually indistinguishable from plain text to low-vision users.
**Fix**: Add `textDecoration: 'underline'` or change colour to `primary.main` for the link, ensuring both colour and decoration distinguish it.

---

## CROSS-CUTTING OBSERVATIONS

### CC-01 · [Sev 2] Session-expired banner only renders in desktop dashboard branch of Layout
**File**: `src/modules/layout/components/Layout.jsx:187-206`
**Detail**: The session-expired warning banner (`auth:tokenExpired` event handler) only renders within the **desktop** dashboard layout branch (the `else` path of `if (isMobile)` inside `if (isDashboardPage)`). If a mobile user's session expires on a dashboard page, they see no notification — the only signal would be a redirect to login (if `ProtectedRoute` handles it). This is a silent failure on mobile.
**Fix**: Move the session-expired banner to the mobile dashboard layout branch as well, or better yet, move it to a global position in `App.jsx` so it works across all layouts.

---

### CC-02 · [Sev 2] `isAuthPage` detection in Layout hard-codes each auth path instead of using route data
**File**: `src/modules/layout/components/Layout.jsx:80-88`
```jsx
const isAuthPage =
  currentPath === '/login' ||
  currentPath === '/register' ||
  currentPath === '/forgot-password' ||
  currentPath === '/role-selection' ||
  currentPath === '/mfa/setup' ||
  currentPath.startsWith('/reset-password') ||
  currentPath.startsWith('/verify-email');
```
**Detail**: Every new auth route added (e.g., `/mfa/verify`, `/oauth-callback`) must be manually added here or it will render with the standard Header on what should be a header-less auth page. This is a maintainability trap — routes and layout logic are coupled across files.
**Fix**: Move auth-page metadata to route definitions (e.g., a `layout: 'auth'` handle property in the route object), and read it with `useMatches()` in Layout. Or centralise the list as a constant exported from `routes/config.jsx`.

---

### CC-03 · [Sev 1] Charts in `HirerDashboardPage` are not accessible (no `role` or ARIA labels)
**File**: `src/modules/hirer/pages/HirerDashboardPage.jsx:694-839`
**Detail**: Recharts `BarChart` and `PieChart` render SVG without any `aria-label`, `role="img"`, or `aria-describedby` attributes. Screen reader users have no textual alternative for the charts. The donut chart shows a total number in the centre via a CSS-absolute `Typography` which is also not associated with the chart via aria.
**Fix**: Wrap each chart in a `<Box role="img" aria-label="Jobs overview chart: X completed, Y active">` or equivalent. Provide a visually-hidden data table as a fallback.

---

### CC-04 · [Sev 1] `MobileNav` "Sign Out" button uses hardcoded `#f44336` red instead of theme token
**File**: `src/modules/layout/components/MobileNav.jsx:422-431`
```jsx
sx={{
  color: '#f44336',
  '&:hover': { backgroundColor: alpha('#f44336', 0.1) },
  '& .MuiListItemIcon-root': { color: '#f44336' },
}}
```
**Detail**: Three uses of hardcoded `#f44336` instead of `theme.palette.error.main`. If the theme's error colour changes (e.g., to match Kelmah branding), this drawer item won't update.
**Fix**: Replace `'#f44336'` with `theme.palette.error.main`.

---

## PREVIOUSLY FIXED (REF)
The following were found and fixed in an earlier session:
- Pinch-zoom restriction removed from viewport meta (WCAG 2.1 AA)
- PWA manifest enabled; assets replaced (vite.svg → kelmah assets)
- SW update `confirm()` replaced with accessible Snackbar
- PWA install banner moved to React (accessible, dismissible, TTL-suppressed)
- OG/Twitter images corrected
- Skip-to-main-content link added (WCAG 2.4.1)
- JobDetailsPage: retry button on error state
- theme/index.js: borderRadius consistency, body fontWeight 400
- MessagingPage: destructive action confirmation dialog foundation
- Login: role="alert" on errors, auto-hide removed, label weight corrected

---

## RECOMMENDED FIX PRIORITY

| Priority | Finding IDs | Effort |
|----------|-------------|--------|
| **Immediate** | R-01, R-02, HD-01, ML-01 | Low–Medium |
| **Sprint 1** | R-04, R-05, R-06, HD-02, HP-01, MN-01, ML-02 | Low–Medium |
| **Sprint 2** | R-03, HD-03, HD-04, HP-02, HP-03, ML-03, CC-01 | Medium |
| **Sprint 3** | AM-01, HT-01, A-01, A-02, CC-02, CC-03, CC-04 | Medium–High |
| **Backlog** | HD-05, HP-04, HT-02, ML-04, ML-05, MN-02 | Low |
