@echo off
:: Windows batch script to run all cleanup steps in order

echo ======================================================================================
echo                          KELMAH CODEBASE CLEANUP
echo ======================================================================================
echo This script will run all cleanup steps in the following order:
echo 1. Create backup directory
echo 2. Remove duplicate files and merge redundant directories
echo 3. Rename service files to follow PascalCase naming convention
echo 4. Create Review Service microservice structure
echo 5. Update API Gateway to incorporate Review Service
echo ======================================================================================
echo.

set /p confirm=Do you want to proceed with the cleanup? (y/n): 
if /i not "%confirm%"=="y" (
    echo Cleanup cancelled.
    exit /b 0
)

:: Create backup directory
mkdir backups 2>nul
echo Created backup directory at .\backups

echo.
echo ======================================================================================
echo Step 1: Removing duplicate files and merging redundant directories...
echo ======================================================================================
powershell -ExecutionPolicy Bypass -File remove_duplicates.ps1
echo.

echo ======================================================================================
echo Step 2: Renaming service files to follow PascalCase naming convention...
echo ======================================================================================
powershell -ExecutionPolicy Bypass -File rename_service_files.ps1
echo.

echo ======================================================================================
echo Step 3: Creating Review Service microservice structure...
echo ======================================================================================
powershell -ExecutionPolicy Bypass -File create_review_service.ps1
echo.

echo ======================================================================================
echo Step 4: Updating API Gateway to incorporate Review Service...
echo ======================================================================================
powershell -ExecutionPolicy Bypass -File update_api_gateway.ps1
echo.

echo ======================================================================================
echo                           CLEANUP COMPLETED SUCCESSFULLY
echo ======================================================================================
echo All cleanup steps have been executed. Please review the changes and run any necessary
echo tests to ensure everything works correctly.
echo.
echo Backups of original files can be found in the following locations:
echo - .\backups\ directory
echo - .\backups\api\ directory (for API-related files)
echo - .\backups\components\ directory (for component directories)
echo - .\backups\api-gateway\ directory (for API Gateway configuration)
echo ====================================================================================== 