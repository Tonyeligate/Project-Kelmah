# Settings Sidebar & Logout Fix – Consolerrorsfix Bug #2 (Nov 19, 2025)

## Problem Summary
- **Sidebar Visibility:** QA reported the left Settings navigation vanished or was clipped on tablets/phones. Tabs were locked to a vertical column that overflowed the viewport, so crucial sections (including Account) became unreachable.
- **Missing Logout CTA:** Account Settings offered save-only actions. Users who jumped directly into `/settings`—especially after the header auto-hid—had no visible way to sign out.

## Implemented Fixes
1. **Responsive Navigation (`settings/pages/SettingsPage.jsx`)
   - Tabs now switch between vertical (≥md) and horizontal (smaller viewports) orientation using `useMediaQuery`.
   - Added sticky behavior + `maxHeight` for desktop to keep the sidebar visible while scrolling long forms.
   - Horizontal mode wraps into multiple rows, enabling tap targets without horizontal scroll while keeping icons above labels for clarity.
   - Scroll buttons remain available for keyboard/mouse users, so every panel stays accessible regardless of viewport height.

2. **Account Logout CTA (`settings/components/common/AccountSettings.jsx`)
   - Injected a dedicated "Logout of Kelmah" button tied to the canonical `logoutUser` thunk. The button dispatches the thunk, surfaces snackbar errors, and redirects to `/login` on success.
   - Action row now uses a responsive `Stack`, aligning the logout button next to the "Save Changes" CTA on desktop and stacking them on small screens.
   - Snackbar feedback covers both save and logout flows, with the existing skeleton states preserved for initial hydration.

## Data Flow: Account Logout Action
```
AccountSettings.jsx logout button
  ↓
handleLogout() → dispatch(logoutUser()).unwrap()
  ↓
authSlice.logoutUser thunk → authService.logout() → POST /api/auth/logout
  ↓
Redux auth slice clears token/user + secureStorage
  ↓
AccountSettings navigate('/login') ensures user lands on auth screen
  ↓
Global header reflects guest state + profile menus disappear
```

## Verification Steps
- `cd kelmah-frontend && npx eslint src/modules/settings/pages/SettingsPage.jsx src/modules/settings/components/common/AccountSettings.jsx` (passes; only the expected npm workspace warning remains).
- Manually resize the Settings page:
  - ≥1024px: sidebar sticks to the left, scrolls independently, and tabs stay vertically aligned.
  - ≤768px: tabs relocate to the top, wrap into two rows, and remain scrollable horizontally if needed.
- Open Account tab → click "Logout of Kelmah": snackbar shows success, Redux clears auth, and router redirects to `/login`.

## Follow-ups
- Consider persisting the last visited tab so deep links into `/settings` maintain context after reloads.
- Evaluate whether Security/Privacy sections also need inline critical actions (e.g., "Disable account", "Download data") similar to the new logout control.
