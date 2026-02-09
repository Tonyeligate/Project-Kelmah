# Navigation Bar Data Flow – November 19, 2025

## UI Component Chain
- **Desktop navigation**: `kelmah-frontend/src/modules/layout/components/DesktopNav.jsx`
  - Consumes `useNavLinks` for CTA metadata and `useAuthCheck` for Redux-backed auth state.
- **Mobile drawer navigation**: `kelmah-frontend/src/modules/layout/components/MobileNav.jsx`
  - Uses `useAuthCheck`, `useNotifications`, `logoutUser` (Redux thunk), and `secureStorage` for logout flows.
- **Helper hook**: `kelmah-frontend/src/hooks/useNavLinks.js`
  - Builds role-aware link arrays (`Home`, `Jobs`, `Find Workers`, `Post a Job`, `Messages`).
- **Auth utilities**: `kelmah-frontend/src/hooks/useAuthCheck.js`, `kelmah-frontend/src/modules/auth/services/authSlice.js`, `kelmah-frontend/src/utils/secureStorage.js`.

## Flow Map
```
User opens header (desktop or hamburger)
  ↓
Header toggles DesktopNav or MobileNav visibility
  ↓
useAuthCheck reads Redux auth slice → { isAuthenticated, user, loading }
  ↓
DesktopNav:
  - Blocks rendering until authState.isReady
  - Renders navLinks from useNavLinks (role-aware)
MobileNav:
  - Builds navigationItems (public + protected) using normalized user.role
  - Displays profile chips + badges when canShowUserFeatures === true
  - Sign-in buttons shown only when shouldShowAuthButtons === true
  ↓
User action (navigate/logout)
  ↓
handleNavigate(path)
  - onClose() drawer → navigate(path)
  ↓
handleLogout()
  - secureStorage.clear() + local/sessionStorage cleanup
  - dispatch(logoutUser()) → Redux authSlice → /api/auth/logout
  - navigate('/', { replace: true }) → window.location.reload()
```

## Issues Found
1. **Dual-state race**: Desktop/Mobile navs referenced the legacy `useAuth` context, so navigation links flashed guest CTAs while Redux `verifyAuth()` was still resolving refresh tokens.
2. **Inconsistent logout**: Mobile drawer relied on the deprecated `useAuth()` logout helper, which no longer cleared secureStorage or forced a reload, leaving profile menus visible after logout in certain flows.

## Fixes Implemented
- Replaced `useAuth()` references with `useAuthCheck()` in both navigation components, ensuring they listen to the same Redux-backed auth source as the header/profile menu.
- Added guarded placeholders so DesktopNav waits for `authState.isReady` before rendering links, preventing guest flashes mid-refresh.
- Migrated the mobile logout handler to the same secure-storage purge + `logoutUser` dispatch sequence used in the main header, guaranteeing tokens/storage are wiped before the reload.
- Normalized role detection inside MobileNav (worker vs. hirer) so dashboard/application links resolve correctly even when the backend supplies role variants.
- Added PropTypes for the drawer props and aligned formatting to match repo lint rules.

## Verification
- `cd kelmah-frontend && npx eslint src/modules/layout/components/DesktopNav.jsx src/modules/layout/components/MobileNav.jsx`
- Manual sanity: toggle mobile drawer while a refresh-token verification is running → no more "Sign In" flicker; trigger logout from drawer → drawer closes, storage clears, and app reloads on the home page.
