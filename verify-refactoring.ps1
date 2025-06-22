# Refactoring Verification Script
# This script verifies that all necessary files have been moved and imports updated

# Set error action preference
$ErrorActionPreference = "Stop"

# Function to check if a file exists
function Test-FileExists {
    param (
        [string]$FilePath
    )
    
    if (Test-Path $FilePath) {
        Write-Host "✓ File exists: $FilePath" -ForegroundColor Green
        return $true
    } else {
        Write-Host "✗ File missing: $FilePath" -ForegroundColor Red
        return $false
    }
}

# Function to check if a directory exists
function Test-DirectoryExists {
    param (
        [string]$DirectoryPath
    )
    
    if (Test-Path $DirectoryPath) {
        Write-Host "✓ Directory exists: $DirectoryPath" -ForegroundColor Green
        return $true
    } else {
        Write-Host "✗ Directory missing: $DirectoryPath" -ForegroundColor Red
        return $false
    }
}

# Function to check if a file contains old import paths
function Test-OldImports {
    param (
        [string]$FilePath
    )
    
    if (Test-Path $FilePath) {
        $content = Get-Content -Path $FilePath -Raw
        
        # Check for old import paths
        $oldPaths = @(
            '@/components/common/',
            '@/contexts/',
            '@/services/',
            '@/pages/'
        )
        
        foreach ($oldPath in $oldPaths) {
            if ($content -match [regex]::Escape($oldPath)) {
                Write-Host "✗ File contains old import path: $FilePath" -ForegroundColor Red
                Write-Host "  Found: $oldPath" -ForegroundColor Red
                return $true
            }
        }
        
        Write-Host "✓ File has updated imports: $FilePath" -ForegroundColor Green
        return $false
    } else {
        Write-Host "✗ File not found: $FilePath" -ForegroundColor Red
        return $true
    }
}

# Check if all necessary directories exist
Write-Host "Checking directories..." -ForegroundColor Cyan
$directories = @(
    './modules/auth',
    './modules/common',
    './modules/contracts',
    './modules/dashboard',
    './modules/home',
    './modules/hirer',
    './modules/jobs',
    './modules/layout',
    './modules/messaging',
    './modules/notifications',
    './modules/payment',
    './modules/profile',
    './modules/search',
    './modules/settings',
    './modules/worker'
)

$allDirectoriesExist = $true
foreach ($directory in $directories) {
    if (-not (Test-DirectoryExists -DirectoryPath $directory)) {
        $allDirectoriesExist = $false
    }
}

# Check if all necessary files exist
Write-Host "`nChecking files..." -ForegroundColor Cyan
$files = @(
    './modules/auth/contexts/AuthContext.jsx',
    './modules/auth/services/authService.js',
    './modules/auth/hooks/useAuth.js',
    './modules/notifications/contexts/NotificationContext.jsx',
    './modules/notifications/services/notificationService.js',
    './modules/search/contexts/SearchContext.jsx',
    './modules/search/services/searchService.js',
    './modules/contracts/services/contractService.js',
    './modules/home/pages/HomePage.jsx'
)

$allFilesExist = $true
foreach ($file in $files) {
    if (-not (Test-FileExists -FilePath $file)) {
        $allFilesExist = $false
    }
}

# Check if all files have updated imports
Write-Host "`nChecking imports..." -ForegroundColor Cyan
$allImportsUpdated = $true
foreach ($file in $files) {
    if (Test-OldImports -FilePath $file) {
        $allImportsUpdated = $false
    }
}

# Print summary
Write-Host "`nRefactoring Verification Summary:" -ForegroundColor Magenta
Write-Host "--------------------------------" -ForegroundColor Magenta
Write-Host "All directories exist: $(if ($allDirectoriesExist) { 'Yes' } else { 'No' })" -ForegroundColor $(if ($allDirectoriesExist) { 'Green' } else { 'Red' })
Write-Host "All files exist: $(if ($allFilesExist) { 'Yes' } else { 'No' })" -ForegroundColor $(if ($allFilesExist) { 'Green' } else { 'Red' })
Write-Host "All imports updated: $(if ($allImportsUpdated) { 'Yes' } else { 'No' })" -ForegroundColor $(if ($allImportsUpdated) { 'Green' } else { 'Red' })

if ($allDirectoriesExist -and $allFilesExist -and $allImportsUpdated) {
    Write-Host "`n✓ Refactoring verification passed!" -ForegroundColor Green
} else {
    Write-Host "`n✗ Refactoring verification failed. Please fix the issues above." -ForegroundColor Red
} 