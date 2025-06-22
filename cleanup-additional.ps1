# Kelmah Frontend Additional Cleanup Script
# This script removes more redundant files identified in the codebase

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

Write-Host "Starting additional cleanup of redundant files..." -ForegroundColor Cyan

# 1. Migration scripts - Since the migration is complete
Write-Host "Cleaning up migration scripts..." -ForegroundColor Cyan
Remove-SafeItem -Path ".\modules\dashboard\migrate-components.ps1"
Remove-SafeItem -Path ".\modules\dashboard\update-imports.ps1"

# 2. Redundant notification components
Write-Host "Cleaning up redundant notification components..." -ForegroundColor Cyan
# Note: We're keeping the module components and removing the old structure
Remove-SafeItem -Path ".\components\notifications" -Directory

# 3. Duplicate report components
Write-Host "Cleaning up duplicate report components..." -ForegroundColor Cyan
Remove-SafeItem -Path ".\components\reporting\ReportScheduler.jsx"
Remove-SafeItem -Path ".\components\reports\ReportScheduler.jsx"

# 4. Duplicate error handling
Write-Host "Cleaning up duplicate error handling..." -ForegroundColor Cyan
Remove-SafeItem -Path ".\components\error\ErrorBoundary.jsx"
# Keep the common one in components/common

# 5. Duplicate UI components
Write-Host "Cleaning up duplicate UI components..." -ForegroundColor Cyan
Remove-SafeItem -Path ".\components\backgrounds\AnimatedBackground.jsx"
# Keep the one in components/common

# 6. Empty directories
Write-Host "Cleaning up empty directories..." -ForegroundColor Cyan
Remove-SafeItem -Path ".\pages\findtalent" -Directory
Remove-SafeItem -Path ".\pages\map" -Directory
Remove-SafeItem -Path ".\pages\messaging" -Directory
Remove-SafeItem -Path ".\redux\actions" -Directory
Remove-SafeItem -Path ".\redux\reducers" -Directory

Write-Host "Additional cleanup completed successfully!" -ForegroundColor Green
Write-Host "IMPORTANT: Please verify that your application still works correctly after these changes." -ForegroundColor Magenta 