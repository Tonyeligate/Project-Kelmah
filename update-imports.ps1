# Import Path Update Script
# This script automatically updates import paths after the modular refactoring

# Set error action preference
$ErrorActionPreference = "Stop"

# Define the import path mappings
$importMappings = @{
    # Components
    '@/components/common/Button' = '@/modules/common/components/common/Button'
    '@/components/common/Card' = '@/modules/common/components/common/Card'
    '@/components/common/Input' = '@/modules/common/components/common/Input'
    '@/components/common/Modal' = '@/modules/common/components/common/Modal'
    '@/components/common/Select' = '@/modules/common/components/common/Select'
    '@/components/common/Table' = '@/modules/common/components/common/Table'
    '@/components/common/Text' = '@/modules/common/components/common/Text'
    '@/components/common/Title' = '@/modules/common/components/common/Title'
    '@/components/common/Toast' = '@/modules/common/components/common/Toast'
    '@/components/common/Tooltip' = '@/modules/common/components/common/Tooltip'
    '@/components/common/UserAvatar' = '@/modules/common/components/common/UserAvatar'
    '@/components/common/UserBadge' = '@/modules/common/components/common/UserBadge'
    '@/components/common/UserCard' = '@/modules/common/components/common/UserCard'
    '@/components/common/UserList' = '@/modules/common/components/common/UserList'
    '@/components/common/UserProfile' = '@/modules/common/components/common/UserProfile'
    '@/components/common/UserSearch' = '@/modules/common/components/common/UserSearch'
    '@/components/common/UserSelect' = '@/modules/common/components/common/UserSelect'
    '@/components/common/UserTable' = '@/modules/common/components/common/UserTable'
    '@/components/common/UserTooltip' = '@/modules/common/components/common/UserTooltip'
    
    # Contexts
    '@/contexts/AuthContext' = '@/modules/auth/contexts/AuthContext'
    '@/contexts/NotificationContext' = '@/modules/notifications/contexts/NotificationContext'
    '@/contexts/SearchContext' = '@/modules/search/contexts/SearchContext'
    
    # Services
    '@/services/authService' = '@/modules/auth/services/authService'
    '@/services/contractService' = '@/modules/contracts/services/contractService'
    '@/services/notificationService' = '@/modules/notifications/services/notificationService'
    '@/services/paymentService' = '@/modules/payment/services/paymentService'
    '@/services/searchService' = '@/modules/search/services/searchService'
    
    # Pages
    '@/pages/Home' = '@/modules/home/pages/HomePage'
    '@/pages/Dashboard' = '@/modules/dashboard/pages/DashboardPage'
    '@/pages/Profile' = '@/modules/profile/pages/ProfilePage'
    '@/pages/Settings' = '@/modules/settings/pages/SettingsPage'
}

# Function to update imports in a file
function Update-ImportsInFile {
    param (
        [string]$FilePath
    )
    
    # Read the file content
    $content = Get-Content -Path $FilePath -Raw
    
    # Check if the file contains any of the old import paths
    $hasOldImports = $false
    foreach ($oldPath in $importMappings.Keys) {
        if ($content -match [regex]::Escape($oldPath)) {
            $hasOldImports = $true
            break
        }
    }
    
    # If the file contains old imports, update them
    if ($hasOldImports) {
        Write-Host "Updating imports in: $FilePath" -ForegroundColor Cyan
        
        # Create a backup of the file
        $backupPath = "$FilePath.bak"
        Copy-Item -Path $FilePath -Destination $backupPath -Force
        Write-Host "Created backup: $backupPath" -ForegroundColor Yellow
        
        # Update each import path
        foreach ($oldPath in $importMappings.Keys) {
            $newPath = $importMappings[$oldPath]
            $content = $content -replace [regex]::Escape($oldPath), $newPath
        }
        
        # Write the updated content back to the file
        Set-Content -Path $FilePath -Value $content -Force
        Write-Host "Updated imports in: $FilePath" -ForegroundColor Green
    }
}

# Get all JavaScript and TypeScript files in the codebase
$files = Get-ChildItem -Path . -Recurse -Include *.js,*.jsx,*.ts,*.tsx

# Update imports in each file
foreach ($file in $files) {
    Update-ImportsInFile -FilePath $file.FullName
}

Write-Host "Import path update completed!" -ForegroundColor Green
Write-Host "IMPORTANT: Please verify that your application still works correctly after these changes." -ForegroundColor Magenta 