# Import Path Update Guide

After refactoring our codebase to follow a modular structure, you'll need to update import paths in several files that still reference the old component structure. This guide will help you make these changes consistently.

## Files Requiring Updates

The following files contain imports from the old `/components/` directory that need to be updated:

1. `pages/Home.jsx`
2. `routes/AdminRoute.jsx`
3. `routes/index.jsx` 
4. `App.jsx`
5. Multiple module page files (see complete list below)

## How to Update Import Paths

### General Pattern

Change:
```javascript
import Component from '../components/path/to/Component';
```

To:
```javascript
import Component from '../modules/domain/components/common/Component';
```

### Specific Component Mappings

| Old Path | New Path |
|----------|----------|
| `../components/dashboard/...` | `../modules/dashboard/components/common/...` |
| `../components/jobs/...` | `../modules/jobs/components/common/...` |
| `../components/messaging/...` | `../modules/messaging/components/common/...` |
| `../components/notifications/...` | `../modules/notifications/components/common/...` |
| `../components/payments/...` | `../modules/payment/components/common/...` |
| `../components/profile/...` | `../modules/profile/components/common/...` |
| `../components/layout/...` | Use appropriate layout components from related modules |
| `../components/common/...` | Consider which module these belong to or create shared components |

### Example Update

Before:
```javascript
import JobCard from '../components/jobs/JobCard';
import DashboardLayout from '../components/layout/DashboardLayout';
```

After:
```javascript
import JobCard from '../modules/jobs/components/common/JobCard';
import DashboardLayout from '../modules/dashboard/components/common/DashboardLayout'; // Adjust path as needed
```

## Complete List of Files to Update

```
modules/auth/pages/LoginPage.jsx
modules/auth/pages/RegisterPage.jsx
modules/dashboard/pages/DashboardPage.jsx
modules/hirer/pages/HirerDashboardPage.jsx
modules/jobs/pages/JobsPage.jsx
modules/messaging/pages/ChatPage.jsx
modules/messaging/pages/MessagingPage.jsx
modules/notifications/pages/NotificationsPage.jsx
modules/payment/pages/PaymentsPage.jsx
modules/profile/pages/ProfilePage.jsx
modules/worker/pages/SkillsAssessmentPage.jsx
modules/worker/pages/WorkerDashboardPage.jsx
pages/Home.jsx
routes/AdminRoute.jsx
routes/index.jsx
App.jsx
```

## Testing After Updates

After updating import paths:

1. Run the application locally
2. Check for any console errors related to imports
3. Verify that all pages load correctly
4. Test key functionality to ensure components are properly imported and working 