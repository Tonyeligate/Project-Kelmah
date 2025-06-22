# PowerShell script to fix import paths in moved module files
# This script updates imports in the files that were moved to the module structure

Write-Host "Fixing import paths in module files..." -ForegroundColor Green

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
    }
}

# Define mappings for import paths
$sliceImportMappings = @{
    # Auth slice imports
    "from '../../modules/auth/services/authService'" = "from './authService'"
    "from '../../api/jobsApi'" = "from '../../../api/jobsApi'"
    "from '../../api/axios'" = "from '../../../api/axios'"
    "from '../../api/eventsApi'" = "from '../../../api/eventsApi'"
    "from '../../api/contractService'" = "from '../../../api/contractService'"
    "from '../../services/api/apiClient'" = "from '../../../api/axios'"
    "from '../../config/constants'" = "from '../../../config/constants'"
}

# Define mappings for component imports
$componentImportMappings = @{
    # Component imports to updated locations
    "from '../../../../store/slices/hirerSlice'" = "from '../../services/hirerSlice'"
    "from '../../../../store/slices/workerSlice'" = "from '../../services/workerSlice'"
    "from '../../../../store/slices/notificationSlice'" = "from '../../services/notificationSlice'"
    "from '../../../../store/slices/jobSlice'" = "from '../../services/jobSlice'"
    "from '../../../../store/slices/contractSlice'" = "from '../../services/contractSlice'"
    "from '../../../../store/slices/appSlice'" = "from '../../services/appSlice'"
    "from '../../../../store/slices/reviewsSlice'" = "from '../../services/reviewsSlice'"
    "from '../../../../store/slices/calendarSlice'" = "from '../../services/calendarSlice'"
    "from '../../../../api/axios'" = "from '../../../common/services/axios'"
    "from '../../../services/messagingService'" = "from '../services/messagingService'"
    "from '../../../components/jobs/JobApplication'" = "from '../components/job-application/JobApplication'"
    "from '../../../components/jobs/JobCard'" = "from '../components/listing/JobCard'"
    "from '../../../auth/contexts/AuthContext'" = "from '../../auth/contexts/AuthContext'"
    "from '../../common/components/seo/SEO'" = "from '../../common/components/common/SEO'"
}

# Update slice imports
Write-Host "Updating import paths in slice files..." -ForegroundColor Cyan
$sliceFiles = @(
    "kelmah-frontend/src/modules/auth/services/authSlice.js",
    "kelmah-frontend/src/modules/jobs/services/jobSlice.js",
    "kelmah-frontend/src/modules/dashboard/services/dashboardSlice.js",
    "kelmah-frontend/src/modules/calendar/services/calendarSlice.js",
    "kelmah-frontend/src/modules/worker/services/workerSlice.js",
    "kelmah-frontend/src/modules/hirer/services/hirerSlice.js",
    "kelmah-frontend/src/modules/contracts/services/contractSlice.js",
    "kelmah-frontend/src/modules/common/services/appSlice.js",
    "kelmah-frontend/src/modules/reviews/services/reviewsSlice.js"
)

foreach ($file in $sliceFiles) {
    if (Test-Path $file) {
        Update-ImportPaths -FilePath $file -ImportMappings $sliceImportMappings
    } else {
        Write-Host "File not found: $file" -ForegroundColor Red
    }
}

# Update component imports
Write-Host "Updating import paths in component files..." -ForegroundColor Cyan
$componentFiles = @(
    "kelmah-frontend/src/modules/hirer/pages/JobPostingPage.jsx",
    "kelmah-frontend/src/modules/worker/pages/WorkerDashboardPage.jsx",
    "kelmah-frontend/src/modules/hirer/pages/HirerDashboardPage.jsx",
    "kelmah-frontend/src/modules/worker/pages/MyApplicationsPage.jsx",
    "kelmah-frontend/src/modules/worker/pages/WorkerProfileEditPage.jsx",
    "kelmah-frontend/src/modules/worker/pages/JobApplicationPage.jsx",
    "kelmah-frontend/src/modules/search/pages/GeoLocationSearch.jsx",
    "kelmah-frontend/src/modules/search/pages/SearchPage.jsx",
    "kelmah-frontend/src/modules/notifications/pages/NotificationsPage.jsx",
    "kelmah-frontend/src/modules/messaging/pages/MessagingPage.jsx",
    "kelmah-frontend/src/modules/jobs/pages/JobDetailsPage.jsx",
    "kelmah-frontend/src/modules/hirer/pages/ApplicationManagementPage.jsx",
    "kelmah-frontend/src/modules/hirer/pages/JobManagementPage.jsx",
    "kelmah-frontend/src/modules/layout/components/Header.jsx"
)

foreach ($file in $componentFiles) {
    if (Test-Path $file) {
        Update-ImportPaths -FilePath $file -ImportMappings $componentImportMappings
    } else {
        Write-Host "File not found: $file" -ForegroundColor Red
    }
}

Write-Host "`nFinished fixing import paths!" -ForegroundColor Green 