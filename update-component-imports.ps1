# PowerShell script to update component imports across the project

Write-Host "Updating component imports throughout the project..." -ForegroundColor Green

# Function to update import paths in a file
function Update-ImportPaths {
    param (
        [string]$FilePath,
        [hashtable]$ImportMappings
    )
    
    $content = Get-Content -Path $FilePath -Raw
    $originalContent = $content
    
    foreach ($oldPath in $ImportMappings.Keys) {
        $newPath = $ImportMappings[$oldPath]
        $content = $content -replace [regex]::Escape($oldPath), $newPath
    }
    
    if ($content -ne $originalContent) {
        Set-Content -Path $FilePath -Value $content
        Write-Host "Updated imports in $FilePath" -ForegroundColor Green
        return $true
    }
    return $false
}

# Define mappings for component imports
$componentImportMappings = @{
    # General component imports
    "from '../../../components/worker/WorkerDashboard'" = "from '../../worker/components/dashboard/WorkerDashboard'"
    "from '../../../components/hirer/HirerDashboard'" = "from '../../hirer/components/dashboard/HirerDashboard'"
    "from '../../../components/HirerJobManagement'" = "from '../../hirer/components/HirerJobManagement'"
    "from '../../../components/PaymentRelease'" = "from '../../hirer/components/PaymentRelease'"
    "from '../../../components/JobManagement'" = "from '../../worker/components/JobManagement'"
    "from '../../../components/AvailabilityCalendar'" = "from '../../worker/components/AvailabilityCalendar'"
    "from '../../../components/worker/WorkerCard'" = "from '../../worker/components/common/WorkerCard'"
    "from '../../../components/ChatComponent'" = "from '../../messaging/components/ChatComponent'"
    "from '../../../common/components/LoadingScreen'" = "from '../../common/components/loading/LoadingScreen'"
    "from '../../../common/components/SEO'" = "from '../../common/components/common/SEO'"
    "from '../../../common/contexts/NotificationContext'" = "from '../../notifications/contexts/NotificationContext'"
    
    # Update dashboard component imports
    "from '../../../components/dashboard/'" = "from '../../dashboard/components/'"
}

# Find all JSX/JS files in the modules directory
$jsxFiles = Get-ChildItem -Path "kelmah-frontend/src/modules" -Include "*.jsx", "*.js" -Recurse

$updatedFilesCount = 0
foreach ($file in $jsxFiles) {
    if (Update-ImportPaths -FilePath $file.FullName -ImportMappings $componentImportMappings) {
        $updatedFilesCount++
    }
}

Write-Host "Import path update completed! Updated $updatedFilesCount files." -ForegroundColor Green 