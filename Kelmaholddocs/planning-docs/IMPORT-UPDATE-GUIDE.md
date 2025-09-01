# Import Path Update Guide

## Overview
This guide provides instructions for updating import paths after the modular refactoring of the Kelmah frontend codebase.

## Import Path Mapping

### Components
Old path | New path
---------|----------
`@/components/common/Button` | `@/modules/common/components/common/Button`
`@/components/common/Card` | `@/modules/common/components/common/Card`
`@/components/common/Input` | `@/modules/common/components/common/Input`
`@/components/common/Modal` | `@/modules/common/components/common/Modal`
`@/components/common/Select` | `@/modules/common/components/common/Select`
`@/components/common/Table` | `@/modules/common/components/common/Table`
`@/components/common/Text` | `@/modules/common/components/common/Text`
`@/components/common/Title` | `@/modules/common/components/common/Title`
`@/components/common/Toast` | `@/modules/common/components/common/Toast`
`@/components/common/Tooltip` | `@/modules/common/components/common/Tooltip`
`@/components/common/UserAvatar` | `@/modules/common/components/common/UserAvatar`
`@/components/common/UserBadge` | `@/modules/common/components/common/UserBadge`
`@/components/common/UserCard` | `@/modules/common/components/common/UserCard`
`@/components/common/UserList` | `@/modules/common/components/common/UserList`
`@/components/common/UserProfile` | `@/modules/common/components/common/UserProfile`
`@/components/common/UserSearch` | `@/modules/common/components/common/UserSearch`
`@/components/common/UserSelect` | `@/modules/common/components/common/UserSelect`
`@/components/common/UserTable` | `@/modules/common/components/common/UserTable`
`@/components/common/UserTooltip` | `@/modules/common/components/common/UserTooltip`
`@/components/common/UserAvatar` | `@/modules/common/components/common/UserAvatar`
`@/components/common/UserBadge` | `@/modules/common/components/common/UserBadge`
`@/components/common/UserCard` | `@/modules/common/components/common/UserCard`
`@/components/common/UserList` | `@/modules/common/components/common/UserList`
`@/components/common/UserProfile` | `@/modules/common/components/common/UserProfile`
`@/components/common/UserSearch` | `@/modules/common/components/common/UserSearch`
`@/components/common/UserSelect` | `@/modules/common/components/common/UserSelect`
`@/components/common/UserTable` | `@/modules/common/components/common/UserTable`
`@/components/common/UserTooltip` | `@/modules/common/components/common/UserTooltip`

### Contexts
Old path | New path
---------|----------
`@/contexts/AuthContext` | `@/modules/auth/contexts/AuthContext`
`@/contexts/NotificationContext` | `@/modules/notifications/contexts/NotificationContext`
`@/contexts/SearchContext` | `@/modules/search/contexts/SearchContext`

### Services
Old path | New path
---------|----------
`@/services/authService` | `@/modules/auth/services/authService`
`@/services/contractService` | `@/modules/contracts/services/contractService`
`@/services/notificationService` | `@/modules/notifications/services/notificationService`
`@/services/paymentService` | `@/modules/payment/services/paymentService`
`@/services/searchService` | `@/modules/search/services/searchService`

### Pages
Old path | New path
---------|----------
`@/pages/Home` | `@/modules/home/pages/HomePage`
`@/pages/Dashboard` | `@/modules/dashboard/pages/DashboardPage`
`@/pages/Profile` | `@/modules/profile/pages/ProfilePage`
`@/pages/Settings` | `@/modules/settings/pages/SettingsPage`

## How to Update Imports

1. Use the mapping table above to identify the new path for each import
2. Update the import statement in your file
3. Run the application to verify the import works correctly

## Example

```javascript
// Old import
import { Button } from '@/components/common/Button';

// New import
import { Button } from '@/modules/common/components/common/Button';
```

## Automated Import Updates

You can use the `update-imports.ps1` script to automatically update imports in your codebase. The script will:

1. Scan all JavaScript and TypeScript files in the codebase
2. Identify imports that need to be updated
3. Update the imports to use the new paths
4. Create a backup of the original files

To run the script:

```powershell
.\update-imports.ps1
```

## Manual Verification

After updating imports, you should:

1. Run the application to verify it works correctly
2. Check the browser console for any import-related errors
3. Test the functionality of each component to ensure it works as expected

## Common Issues

- **Missing exports**: If a component is not exported correctly, you may see an error like `Module not found: Can't resolve '@/modules/...'`
- **Circular dependencies**: If you have circular dependencies, you may see an error like `Circular dependency detected`
- **Incorrect paths**: If the path is incorrect, you may see an error like `Module not found: Can't resolve '@/modules/...'`

## Need Help?

If you encounter any issues while updating imports, please:

1. Check the import path mapping table above
2. Verify the file exists in the new location
3. Check the export statement in the file
4. Run the application to see the specific error message
5. Contact the development team for assistance 