# PowerShell script to fix very specific import issues
Write-Host "Fixing specific import issues..." -ForegroundColor Green

# Fix DashboardPage.jsx AuthContext import
$dashboardPagePath = "kelmah-frontend/src/modules/dashboard/pages/DashboardPage.jsx"
if (Test-Path $dashboardPagePath) {
    $content = Get-Content -Path $dashboardPagePath -Raw
    $content = $content -replace 'import \{ useAuth \} from ".*?AuthContext";', 'import { useAuth } from "../../auth/contexts/AuthContext";'
    Set-Content -Path $dashboardPagePath -Value $content
    Write-Host "Updated AuthContext import in $dashboardPagePath" -ForegroundColor Green
}

# Fix worker pages slice imports - this is more specific than our previous script
$workerFilesToFix = @(
    "kelmah-frontend/src/modules/worker/pages/WorkerDashboardPage.jsx",
    "kelmah-frontend/src/modules/worker/pages/WorkerProfileEditPage.jsx",
    "kelmah-frontend/src/modules/worker/pages/JobApplicationPage.jsx"
)

foreach ($file in $workerFilesToFix) {
    if (Test-Path $file) {
        $content = Get-Content -Path $file -Raw
        $content = $content -replace 'from ".*?workerSlice"', 'from "../services/workerSlice"'
        Set-Content -Path $file -Value $content
        Write-Host "Updated workerSlice import in $file" -ForegroundColor Green
    }
}

# Fix hirer pages slice imports
$hirerFilesToFix = @(
    "kelmah-frontend/src/modules/hirer/pages/JobPostingPage.jsx",
    "kelmah-frontend/src/modules/hirer/pages/JobManagementPage.jsx",
    "kelmah-frontend/src/modules/hirer/pages/HirerDashboardPage.jsx"
)

foreach ($file in $hirerFilesToFix) {
    if (Test-Path $file) {
        $content = Get-Content -Path $file -Raw
        $content = $content -replace 'from ".*?hirerSlice"', 'from "../services/hirerSlice"'
        Set-Content -Path $file -Value $content
        Write-Host "Updated hirerSlice import in $file" -ForegroundColor Green
    }
}

# Fix axios imports in ApplicationManagementPage.jsx
$applicationPagePath = "kelmah-frontend/src/modules/hirer/pages/ApplicationManagementPage.jsx"
if (Test-Path $applicationPagePath) {
    $content = Get-Content -Path $applicationPagePath -Raw
    $content = $content -replace 'import axios from ".*?axios";', 'import axios from "../../common/services/axios";'
    Set-Content -Path $applicationPagePath -Value $content
    Write-Host "Updated axios import in $applicationPagePath" -ForegroundColor Green
}

# Fix axios imports in MyApplicationsPage.jsx
$myAppsPath = "kelmah-frontend/src/modules/worker/pages/MyApplicationsPage.jsx"
if (Test-Path $myAppsPath) {
    $content = Get-Content -Path $myAppsPath -Raw
    $content = $content -replace 'import axios from ".*?axios";', 'import axios from "../../common/services/axios";'
    Set-Content -Path $myAppsPath -Value $content
    Write-Host "Updated axios import in $myAppsPath" -ForegroundColor Green
}

# Fix JobCard import in GeoLocationSearch.jsx
$geoSearchPath = "kelmah-frontend/src/modules/search/pages/GeoLocationSearch.jsx"
if (Test-Path $geoSearchPath) {
    $content = Get-Content -Path $geoSearchPath -Raw
    $content = $content -replace 'import JobCard from ".*?JobCard";', 'import JobCard from "../../jobs/components/listing/JobCard";'
    Set-Content -Path $geoSearchPath -Value $content
    Write-Host "Updated JobCard import in $geoSearchPath" -ForegroundColor Green
}

# Fix NotificationContext import in Header.jsx
$headerPath = "kelmah-frontend/src/modules/layout/components/Header.jsx"
if (Test-Path $headerPath) {
    $content = Get-Content -Path $headerPath -Raw
    $content = $content -replace 'import \{ useNotifications \} from ".*?NotificationContext";', 'import { useNotifications } from "../../notifications/contexts/NotificationContext";'
    Set-Content -Path $headerPath -Value $content
    Write-Host "Updated NotificationContext import in $headerPath" -ForegroundColor Green
}

# Fix notificationSlice import in NotificationsPage.jsx
$notifPath = "kelmah-frontend/src/modules/notifications/pages/NotificationsPage.jsx"
if (Test-Path $notifPath) {
    $content = Get-Content -Path $notifPath -Raw
    $content = $content -replace 'from ".*?notificationSlice"', 'from "../services/notificationSlice"'
    Set-Content -Path $notifPath -Value $content
    Write-Host "Updated notificationSlice import in $notifPath" -ForegroundColor Green
}

# Fix api service imports in jobsService.js and eventsService.js
$serviceFilesToFix = @(
    "kelmah-frontend/src/modules/jobs/services/jobsService.js",
    "kelmah-frontend/src/modules/calendar/services/eventsService.js"
)

foreach ($file in $serviceFilesToFix) {
    if (Test-Path $file) {
        $content = Get-Content -Path $file -Raw
        $content = $content -replace "import api from '.*?';", "import api from '../../common/services/axios';"
        $content = $content -replace 'import api from ".*?";', 'import api from "../../common/services/axios";'
        Set-Content -Path $file -Value $content
        Write-Host "Updated api import in $file" -ForegroundColor Green
    }
}

Write-Host "Specific import fixes completed!" -ForegroundColor Green 