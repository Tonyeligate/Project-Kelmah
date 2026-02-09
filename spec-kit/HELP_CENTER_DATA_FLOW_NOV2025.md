# Help Center & Status Desk – Data Flow (Nov 2025)

## Component Chain
- **Primary Component**: `kelmah-frontend/src/modules/support/pages/HelpCenterPage.jsx`
- **Routing**: Registered in `kelmah-frontend/src/routes/publicRoutes.jsx` for `/support` and `/support/help-center`
- **Utilities**: `checkServiceHealth` + `getServiceStatusMessage` from `src/utils/serviceHealthCheck.js`
- **Navigation Hooks**: `useNavigate` (React Router) for internal quick actions

## User Action → API Flow Map
```
User opens /support or clicks "Help & Support" in Header menu
  ↓
React Router mounts HelpCenterPage via lazyWithRetry (retryKey: help-center-page)
  ↓
useEffect → checkServiceHealth('aggregate') with 15s timeout
  ↓
API Gateway /api/health/aggregate (GET)
  ↓
Gateway fans out to microservices (auth, user, job, payment, messaging, review)
  ↓
Response cached inside serviceHealthCache (status, response time, timestamp)
  ↓
getServiceStatusMessage('aggregate') derives { status, message, action }
  ↓
Status chip + helper text update in hero panel
  ↓
User selects a quick action (e.g., "Open Support Ticket")
  ↓
useNavigate routes to internal destinations (/messages?tab=support, /docs?category=support, /community)
  ↓
External contact cards trigger mailto/tel handlers for escalation lanes
```

## Data States
- **healthStatus**: `{ status, message, action }`, refreshed every 5 minutes
- **Quick Action Targets**:
  - `/messages?tab=support` → leverages existing messaging module and gateway auth
  - `/docs?category=support` → documentation viewer
  - `/community` → community portal (placeholder route)
- **Contact Actions**: direct channel triggers (`mailto:support@kelmah.com`, `tel:+233201234567`, `mailto:safety@kelmah.com`)

## Loading/Error Handling
- Initial state shows "Checking live system status…" while `checkServiceHealth` runs
- If the aggregate endpoint fails or times out, cached `status='error'` drives the hero chip + helper text to instruct users to retry later
- Interval refresh keeps surface accurate without forcing navigation reloads

## Verification Steps
1. `cd kelmah-frontend && npx eslint src/modules/support/pages/HelpCenterPage.jsx src/routes/publicRoutes.jsx --max-warnings=0`
2. Launch dev server, visit `/support/help-center`, confirm:
   - Hero status chip reflects API gateway aggregate state (toggle by stopping a service locally)
   - Quick action buttons navigate correctly
   - Contact buttons open email or phone handlers
   - FAQ accordions expand/collapse without console warnings

## Notes
- Header profile menu now routes `/support` → `/support/help-center`, eliminating prior 404 dead links
- Page uses Ghana brand palette to stay consistent with Layout/AppBar styling
- Future Enhancements: add support ticket form tied to messaging service once endpoint is ready
