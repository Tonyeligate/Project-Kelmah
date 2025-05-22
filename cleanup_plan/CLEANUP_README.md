# Kelmah Project Cleanup Scripts

This directory contains scripts to clean up and reorganize the Kelmah project codebase according to the architecture diagrams and best practices.

## Available Scripts

### Windows Scripts (PowerShell)
1. **run_cleanup.bat** - Main batch script that runs all cleanup steps in order
2. **remove_duplicates.ps1** - PowerShell script to remove duplicate files and merge redundant directories
3. **rename_service_files.ps1** - PowerShell script to rename service files to follow PascalCase naming convention
4. **create_review_service.ps1** - PowerShell script to create Review Service microservice structure
5. **update_api_gateway.ps1** - PowerShell script to update API Gateway to incorporate Review Service

### Linux/Mac Scripts (Bash)
1. **run_cleanup.sh** - Main bash script that runs all cleanup steps in order
2. **remove_duplicates.sh** - Bash script to remove duplicate files and merge redundant directories
3. **rename_service_files.sh** - Bash script to rename service files to follow PascalCase naming convention
4. **create_review_service.sh** - Bash script to create Review Service microservice structure
5. **update_api_gateway.sh** - Bash script to update API Gateway to incorporate Review Service

## How to Run

### Windows
1. Run the main batch script by double-clicking on `run_cleanup.bat` or running it from PowerShell/Command Prompt:
   ```
   .\run_cleanup.bat
   ```

2. Follow the prompts to confirm the cleanup process.

### Linux/Mac
1. Make the main script executable:
   ```bash
   chmod +x run_cleanup.sh
   ```

2. Run the main script:
   ```bash
   ./run_cleanup.sh
   ```

3. Follow the prompts to confirm the cleanup process.

## What the Scripts Do

### remove_duplicates.ps1/sh
- Removes duplicate files like App.js/App.jsx and index.js/main.jsx
- Removes empty stub files
- Merges redundant component directories (chat/messaging, job/jobs, etc.)
- Creates backups of all files before deletion

### rename_service_files.ps1/sh
- Renames service files to follow PascalCase naming convention
- Only renames files that don't already follow the convention
- Maintains the common convention for api.js

### create_review_service.ps1/sh
- Creates a complete Review Service microservice structure
- Implements models, controllers, routes, and utilities
- Sets up authentication middleware and error handling
- Creates package.json and configuration files

### update_api_gateway.ps1/sh
- Updates API Gateway routes to include Review Service
- Updates environment and configuration files
- Creates frontend ReviewService.js if it doesn't exist
- Updates service index exports

## Backup Strategy

Before any changes are made, the scripts create backups of the original files:
- **./backups/** - Main backup directory
- **./backups/api/** - Backups of API-related files
- **./backups/components/** - Backups of component directories
- **./backups/api-gateway/** - Backups of API Gateway configuration

## Post-Cleanup Steps

After running the scripts, you should:
1. Review the changes to ensure they match the expected results
2. Test the application to verify functionality is preserved
3. Update imports in your codebase if necessary
4. Run linting and formatting tools to maintain code quality

## File Structure After Cleanup

### Frontend
```
kelmah-frontend/src/
├── components/
│   ├── auth/
│   ├── common/
│   ├── contracts/
│   ├── dashboard/
│   ├── hirer/
│   ├── jobs/
│   ├── map/
│   ├── messaging/
│   ├── notifications/
│   ├── payments/
│   ├── profiles/
│   ├── reviews/
│   ├── search/
│   ├── settings/
│   └── worker/
├── services/
│   ├── api.js
│   ├── AuthService.js
│   ├── ContractService.js
│   ├── DashboardService.js
│   ├── FileUploadService.js
│   ├── HirerService.js
│   ├── JobService.js
│   ├── LocationService.js
│   ├── MessagingService.js
│   ├── MilestoneService.js
│   ├── NotificationService.js
│   ├── PaymentService.js
│   ├── ReviewService.js
│   ├── SearchService.js
│   ├── UserService.js
│   ├── WebSocketService.js
│   └── index.js
└── contexts/
    ├── AuthContext.jsx
    ├── MessageContext.jsx
    ├── NotificationContext.jsx
    └── SearchContext.jsx
```

### Backend
```
kelmah-backend/
├── api-gateway/
├── services/
│   ├── auth-service/
│   ├── job-service/
│   ├── messaging-service/
│   ├── notification-service/
│   ├── payment-service/
│   ├── review-service/
│   └── user-service/
└── index.js
```

## Troubleshooting

### Windows Specific Issues
- If you encounter "Access Denied" errors, make sure you have appropriate permissions to modify the files
- If PowerShell script execution is blocked, you may need to adjust your execution policy:
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
  ```
- If some scripts seem to hang, check if any programs have the files open or locked

### General Issues
If you encounter any issues during the cleanup process:
1. Refer to the backup files to restore the original state
2. Check the console output for error messages
3. Run individual scripts manually to isolate the issue

## Contributors

This cleanup plan and scripts were created based on the analysis of the Kelmah project architecture and best practices for microservices and frontend organization. 