# Smart Navigation Visibility Flow (Nov 12, 2025)

## UI Component Chain
- **Component File**: `kelmah-frontend/src/components/common/SmartNavigation.jsx`
- **State Source**: `react-redux` auth slice (`state.auth`)
- **Routing Context**: `react-router-dom` (`useLocation`, `useNavigate`)

## Flow Map
```
User lands on dashboard/search/messages routes (desktop)
  ↓
SmartNavigation useEffect evaluates current pathname against eligible prefixes
  ↓
showSuggestions state toggles true when path matches allowlist
  ↓
getNavigationSuggestions() builds role-aware CTA list using Redux auth user + location
  ↓
Button click executes navigate(path) for selected suggestion
  ↓
React Router handles route change → downstream modules fetch requisite data via existing thunks/services
```

## Issues Found
❌ **Issue 1**: Visibility waited 3 seconds and only activated on `/jobs` + `/search`, leaving dashboards and messaging without the quick links QA expected.
- **Location**: `SmartNavigation.jsx` (useEffect block)
- **Resolution**: Replaced timer with deterministic prefix allowlist (`/jobs`, `/search`, `/worker/*`, `/hirer/*`, `/messages`) and immediate state toggle.

❌ **Issue 2**: Component never reset visibility after leaving eligible pages, risking stray overlays.
- **Location**: `SmartNavigation.jsx` (state management)
- **Resolution**: Effect now sets `showSuggestions` false when paths fall outside the allowlist, ensuring clean teardown.

## Recommendations
1. Extend analytics to log navigation button clicks so we can validate the most-used shortcuts and refine ordering.
2. Consider surfacing the quick navigation card on large tablets by tuning the `md` breakpoint once QA validates layout spacing.
