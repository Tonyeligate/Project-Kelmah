# Kelmah Frontend Codebase Cleanup Script
# This script removes redundant files after the dashboard module migration

# Set error action preference
$ErrorActionPreference = "Stop"

# Function to safely delete a file or directory
function Remove-SafeItem {
    param (
        [string]$Path,
        [switch]$Directory
    )
    
    # Check if path exists
    if (Test-Path $Path) {
        if ($Directory) {
            Write-Host "Removing directory: $Path" -ForegroundColor Yellow
            Remove-Item -Path $Path -Recurse -Force
        } else {
            Write-Host "Removing file: $Path" -ForegroundColor Yellow
            Remove-Item -Path $Path -Force
        }
        Write-Host "Successfully removed: $Path" -ForegroundColor Green
    } else {
        Write-Host "Path not found, skipping: $Path" -ForegroundColor Gray
    }
}

# Get the src directory
$srcDir = ".."

Write-Host "Starting cleanup of redundant files..." -ForegroundColor Cyan

# 1. Remove Dashboard component redundancies
Write-Host "Cleaning up redundant dashboard components..." -ForegroundColor Cyan
Remove-SafeItem -Path "$srcDir\components\dashboard" -Directory

# 2. Remove duplicate messaging components
Write-Host "Cleaning up redundant messaging components..." -ForegroundColor Cyan
Remove-SafeItem -Path "$srcDir\pages\MessagingPage.jsx"
Remove-SafeItem -Path "$srcDir\pages\messages\MessagesPage.jsx"

# 3. Remove duplicate notification components
Write-Host "Cleaning up redundant notification components..." -ForegroundColor Cyan
Remove-SafeItem -Path "$srcDir\pages\NotificationsPage.jsx"
Remove-SafeItem -Path "$srcDir\redux\actions\notificationActions.js"
Remove-SafeItem -Path "$srcDir\redux\reducers\notificationReducer.js"

# 4. Remove duplicate services
Write-Host "Cleaning up redundant services..." -ForegroundColor Cyan
Remove-SafeItem -Path "$srcDir\services\notificationService.js"

# 5. Remove unused or test components
Write-Host "Cleaning up unused test components..." -ForegroundColor Cyan
Remove-SafeItem -Path "$srcDir\components\Learn.jsx"
Remove-SafeItem -Path "$srcDir\components\Learning.jsx"

# 6. Clean up migration scripts (commented out by default - uncomment when verified)
Write-Host "Note: Migration scripts are preserved. Uncomment the following lines when migration is fully verified." -ForegroundColor Yellow
# Remove-SafeItem -Path "dashboard\migrate-components.ps1"
# Remove-SafeItem -Path "dashboard\update-imports.ps1"

Write-Host "Cleanup completed successfully!" -ForegroundColor Green
Write-Host "IMPORTANT: Please verify that your application still works correctly after these changes." -ForegroundColor Magenta 