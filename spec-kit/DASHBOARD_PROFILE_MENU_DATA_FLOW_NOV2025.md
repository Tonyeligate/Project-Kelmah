# Dashboard Profile Menu Data Flow – Consolerrorsfix Bug #1 (Nov 19, 2025)

## Summary
Bug #1 from `Consolerrorsfix.txt` described an "Inconsistent Profile Icon on Dashboard" where the shared header had a working account dropdown, but the hirer/worker dashboards rendered static avatars with no menu, logout, or navigation affordances. Both dashboards now embed the same Material UI `Avatar + Menu` interaction pattern that wires into the canonical Redux auth slice, preserving role chips and logout flows after route transitions.

## Hirer Dashboard Chain
- **Component**: `kelmah-frontend/src/modules/hirer/pages/HirerDashboardPage.jsx` (top toolbar + dashboard shell).
- **State/Selectors**: `useSelector((state) => state.auth.user)` for normalized user, local `profileMenuAnchor` state for menu visibility.
- **Services/Slices**: `logoutUser` thunk from `src/modules/auth/services/authSlice.js` → `authService.logout()` → API Gateway `/api/auth/logout`.
- **Navigation**: `useNavigate` from `react-router-dom` for Profile/Settings routes and post-logout redirect to `/login`.

### Flow Map
```
User clicks Hirer dashboard avatar
  ↓
HirerDashboardPage.handleProfileMenuOpen(event)
  ↓
Reacts state: profileMenuAnchor = event.currentTarget → Menu opens
  ↓
MenuItem selection
  ↓
• "View Profile" → handleProfileMenuNavigate('/profile')
• "Manage Profile" → handleProfileMenuNavigate('/hirer/profile/edit')
• "Logout" → handleLogout()
  ↓
handleLogout dispatches logoutUser() thunk
  ↓
logoutUser → authService.logout() → POST /api/auth/logout via API Gateway
  ↓
Redux auth slice clears `user`, `token`, `isAuthenticated`
  ↓
secureStorage cleared; navigate('/login') executes
  ↓
Global header + dashboards re-render as guest state
```

### UI States & Guards
- **Loading**: Logout button disables while `logoutUser.pending` sets `auth.loading = true`; spinner handled globally by header/auth state.
- **Success**: Menu closes automatically, toast handled by global logout redirection; role badge remains visible.
- **Error**: Even if `authService.logout` fails, thunk clears local auth and navigation still routes to `/login`, matching header behavior.

## Worker Dashboard Chain
- **Component**: `kelmah-frontend/src/modules/worker/pages/WorkerDashboardPage.jsx` (hero header + dashboard shell).
- **State/Selectors**: Normalized `displayUser`, local `profileMenuAnchor`, plus derived `getProfessionalTitle()` for hero text.
- **Services/Slices**: Same `logoutUser` thunk; worker menu adds `Manage Profile` target `/worker/profile/edit`.
- **Navigation**: `useNavigate` for profile/settings/redirect.

### Flow Map
```
User taps Worker dashboard avatar (desktop/mobile)
  ↓
WorkerDashboardPage.handleProfileMenuOpen(event)
  ↓
Menu renders with account chip + email summary
  ↓
Menu actions
  ↓
• "View Profile" → handleProfileMenuNavigate('/profile')
• "Manage Profile" → handleProfileMenuNavigate('/worker/profile/edit')
• "Logout" → handleLogout()
  ↓
handleLogout dispatches logoutUser() ⇒ authService.logout() ⇒ /api/auth/logout
  ↓
Redux auth slice clears credentials + secureStorage
  ↓
navigate('/login'); dashboard unmounts and Layout falls back to guest state
```

### UI States & Guards
- **Role Chip**: `Chip` displays `(displayUser.role || 'worker').toUpperCase() + ' MODE'` so QA can verify context after refresh.
- **Menu Disclosure**: Tooltip clarifies action; menu closes on route changes and logout completion via `handleProfileMenuClose`.
- **Error Handling**: Same fallback as hirer flow; secureStorage is cleared even if API call fails.

## Verification Steps
1. Authenticate as hirer (`giftyafisa@gmail.com`), navigate to `/hirer/dashboard`, click avatar → verify menu actions work and logout returns to `/login`.
2. Authenticate as worker, open `/worker/dashboard`, confirm avatar menu matches header (profile/manage/logout) and respects role chip label.
3. Inspect Redux devtools while logging out from dashboard pages to confirm `auth/logoutUser` pending/fulfilled actions fire and state resets.
4. Lint targeted files: `npx eslint src/modules/hirer/pages/HirerDashboardPage.jsx src/modules/worker/pages/WorkerDashboardPage.jsx --max-warnings=0` (known repo-wide warnings excluded) to ensure menu additions introduce no syntax regressions.

## Outstanding Follow-ups
- Extract the duplicated toolbar (role chip + avatar menu) into a shared `DashboardAccountMenu` component once Consolerrorsfix Bug #1 is fully validated.
- Propagate the same menu to additional dashboard variants (admin/support) if they emerge to maintain parity with the global header.
