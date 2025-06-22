# Kelmah Frontend Refactoring

## Overview
This repository contains the refactored Kelmah frontend codebase. The refactoring was done to improve code organization, maintainability, and separation of concerns by following a modular domain-driven design pattern.

## Project Structure
The codebase is organized into domain-specific modules:

```
src/
├── modules/
│   ├── auth/              # Authentication related components
│   ├── common/            # Shared UI components and utilities
│   ├── contracts/         # Contract management
│   ├── dashboard/         # Dashboard features
│   ├── home/              # Home page components
│   ├── hirer/             # Hirer-specific features
│   ├── jobs/              # Job listings and management
│   ├── layout/            # Layout components
│   ├── messaging/         # Messaging features
│   ├── notifications/     # Notification components and services
│   ├── payment/           # Payment processing
│   ├── profile/           # User profiles
│   ├── search/            # Search functionality
│   ├── settings/          # Settings pages
│   └── worker/            # Worker-specific features
```

Each module follows a consistent internal structure:
- `/components/` - React components specific to the module
  - `/common/` - Shared components within the module
- `/contexts/` - React contexts for state management
- `/hooks/` - Custom hooks
- `/pages/` - Page components
- `/services/` - API services
- `/utils/` - Utility functions

## Refactoring Scripts
The repository includes several scripts to help with the refactoring process:

- `cleanup.ps1` - Removes redundant files after the dashboard module migration
- `update-imports.ps1` - Automatically updates import paths to use the new modular structure
- `verify-refactoring.ps1` - Verifies that all necessary files have been moved and imports updated

## How to Use

### Running the Cleanup Script
```powershell
.\cleanup.ps1
```

### Updating Import Paths
```powershell
.\update-imports.ps1
```

### Verifying the Refactoring
```powershell
.\verify-refactoring.ps1
```

## Import Path Updates
After the refactoring, import paths have been updated to use the new modular structure. For example:

```javascript
// Old import
import { Button } from '@/components/common/Button';

// New import
import { Button } from '@/modules/common/components/common/Button';
```

See `IMPORT-UPDATE-GUIDE.md` for a complete mapping of old to new import paths.

## Refactoring Summary
See `REFACTORING-SUMMARY.md` for a detailed summary of the refactoring work done.

## Common Issues
- **Missing exports**: If a component is not exported correctly, you may see an error like `Module not found: Can't resolve '@/modules/...'`
- **Circular dependencies**: If you have circular dependencies, you may see an error like `Circular dependency detected`
- **Incorrect paths**: If the path is incorrect, you may see an error like `Module not found: Can't resolve '@/modules/...'`

## Need Help?
If you encounter any issues while working with the refactored codebase, please:

1. Check the import path mapping table in `IMPORT-UPDATE-GUIDE.md`
2. Verify the file exists in the new location
3. Check the export statement in the file
4. Run the application to see the specific error message
5. Contact the development team for assistance 