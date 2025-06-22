# PowerShell script to fix specific import paths that are still causing errors
Write-Host "Fixing remaining import path issues..." -ForegroundColor Green

# Function to update import paths in a file
function Update-ImportPaths {
    param (
        [string]$FilePath,
        [hashtable]$ImportMappings
    )
    
    if (-not (Test-Path $FilePath)) {
        Write-Host "File not found: $FilePath" -ForegroundColor Red
        return
    }
    
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

# Fix worker and hirer page imports to their service files
$modulePageImportMappings = @{
    # Worker page imports
    "from ""../../services/workerSlice""" = "from ""../services/workerSlice"""
    "from '../../services/workerSlice'" = "from '../services/workerSlice'"
    
    # Hirer page imports
    "from ""../../services/hirerSlice""" = "from ""../services/hirerSlice"""
    "from '../../services/hirerSlice'" = "from '../services/hirerSlice'"
    
    # Notifications page imports
    "from ""../../services/notificationSlice""" = "from ""../services/notificationSlice"""
    "from '../../services/notificationSlice'" = "from '../services/notificationSlice'"
}

# List of files to update worker/hirer service imports
$modulePageFiles = @(
    "kelmah-frontend/src/modules/worker/pages/WorkerDashboardPage.jsx",
    "kelmah-frontend/src/modules/worker/pages/WorkerProfileEditPage.jsx",
    "kelmah-frontend/src/modules/worker/pages/JobApplicationPage.jsx",
    "kelmah-frontend/src/modules/hirer/pages/JobPostingPage.jsx",
    "kelmah-frontend/src/modules/hirer/pages/JobManagementPage.jsx",
    "kelmah-frontend/src/modules/hirer/pages/HirerDashboardPage.jsx",
    "kelmah-frontend/src/modules/notifications/pages/NotificationsPage.jsx"
)

Write-Host "Fixing module page imports..." -ForegroundColor Cyan
foreach ($file in $modulePageFiles) {
    Update-ImportPaths -FilePath $file -ImportMappings $modulePageImportMappings
}

# Fix axios imports in service files
$axiosImportMappings = @{
    # Fix axios imports in api services
    "import api from './axios';" = "import api from '../../common/services/axios';"
    "import api from ""./axios"";" = "import api from ""../../common/services/axios"";"
    "import axios from ""../../../../api/axios"";" = "import axios from ""../../common/services/axios"";"
    "import axios from ""../../../common/services/axios"";" = "import axios from ""../../common/services/axios"";"
}

# List of files to update axios imports
$axiosImportFiles = @(
    "kelmah-frontend/src/modules/jobs/services/jobsService.js",
    "kelmah-frontend/src/modules/calendar/services/eventsService.js",
    "kelmah-frontend/src/modules/hirer/pages/ApplicationManagementPage.jsx",
    "kelmah-frontend/src/modules/worker/pages/MyApplicationsPage.jsx"
)

Write-Host "Fixing axios imports..." -ForegroundColor Cyan
foreach ($file in $axiosImportFiles) {
    Update-ImportPaths -FilePath $file -ImportMappings $axiosImportMappings
}

# Fix AuthContext imports
$authContextImportMappings = @{
    "import { useAuth } from ""../../../auth/contexts/AuthContext"";" = "import { useAuth } from ""../../auth/contexts/AuthContext"";"
    "import { useAuth } from '../../../auth/contexts/AuthContext';" = "import { useAuth } from '../../auth/contexts/AuthContext';"
    "import { useAuth } from ""../../../../auth/contexts/AuthContext"";" = "import { useAuth } from ""../../auth/contexts/AuthContext"";"
    "import { useAuth } from '../../../../auth/contexts/AuthContext';" = "import { useAuth } from '../../auth/contexts/AuthContext';"
}

# List of files to update AuthContext imports
$authContextFiles = @(
    "kelmah-frontend/src/modules/dashboard/pages/DashboardPage.jsx",
    "kelmah-frontend/src/modules/worker/components/JobManagement.jsx",
    "kelmah-frontend/src/modules/worker/components/AvailabilityCalendar.jsx",
    "kelmah-frontend/src/modules/hirer/components/HirerJobManagement.jsx",
    "kelmah-frontend/src/modules/hirer/components/PaymentRelease.jsx"
)

Write-Host "Fixing AuthContext imports..." -ForegroundColor Cyan
foreach ($file in $authContextFiles) {
    Update-ImportPaths -FilePath $file -ImportMappings $authContextImportMappings
}

# Fix JobCard and NotificationContext imports
$componentImportMappings = @{
    "import JobCard from ""../components/listing/JobCard"";" = "import JobCard from ""../../jobs/components/listing/JobCard"";"
    "import JobCard from '../components/listing/JobCard';" = "import JobCard from '../../jobs/components/listing/JobCard';"
    "import { useNotifications } from ""../../../notifications/contexts/NotificationContext"";" = "import { useNotifications } from ""../../notifications/contexts/NotificationContext"";"
    "import { useNotifications } from '../../../notifications/contexts/NotificationContext';" = "import { useNotifications } from '../../notifications/contexts/NotificationContext';"
}

# List of component import files to fix
$componentFiles = @(
    "kelmah-frontend/src/modules/search/pages/GeoLocationSearch.jsx",
    "kelmah-frontend/src/modules/layout/components/Header.jsx"
)

Write-Host "Fixing component imports..." -ForegroundColor Cyan
foreach ($file in $componentFiles) {
    Update-ImportPaths -FilePath $file -ImportMappings $componentImportMappings
}

# Fix apiUtils import in contractService
$apiUtilsImportMapping = @{
    "import { apiService } from '../utils/apiUtils';" = "import { apiService } from '../../../utils/apiUtils';"
    "import { apiService } from ""../utils/apiUtils"";" = "import { apiService } from ""../../../utils/apiUtils"";"
}

Update-ImportPaths -FilePath "kelmah-frontend/src/modules/contracts/services/contractService.js" -ImportMappings $apiUtilsImportMapping

Write-Host "Import path fixes completed!" -ForegroundColor Green 