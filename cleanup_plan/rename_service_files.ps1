# PowerShell script to rename service files to PascalCase

# Navigate to project root
Set-Location ..

# Store the current directory
$PROJECT_ROOT = Get-Location

# Create backup directory
New-Item -Path "$PROJECT_ROOT\cleanup_plan\backups\services" -ItemType Directory -Force | Out-Null

# Navigate to the services directory
$SERVICES_DIR = "$PROJECT_ROOT\kelmah-frontend\src\services"

# Check if directory exists
if (-not (Test-Path $SERVICES_DIR)) {
    Write-Host "Services directory not found at $SERVICES_DIR. Creating directory..."
    New-Item -Path $SERVICES_DIR -ItemType Directory -Force | Out-Null
}

# Define the service files to be renamed
$serviceFiles = @(
    @{ Original = "authService.js"; Pascal = "AuthService.js" },
    @{ Original = "notificationService.js"; Pascal = "NotificationService.js" },
    @{ Original = "messagingService.js"; Pascal = "MessagingService.js" },
    @{ Original = "milestoneService.js"; Pascal = "MilestoneService.js" },
    @{ Original = "fileUploadService.js"; Pascal = "FileUploadService.js" },
    @{ Original = "searchService.js"; Pascal = "SearchService.js" },
    @{ Original = "chatService.js"; Pascal = "ChatService.js" },
    @{ Original = "dashboardService.js"; Pascal = "DashboardService.js" },
    @{ Original = "websocket.js"; Pascal = "WebSocketService.js" }
)

# Rename each service file if it exists
foreach ($file in $serviceFiles) {
    $originalPath = Join-Path -Path $SERVICES_DIR -ChildPath $file.Original
    $pascalPath = Join-Path -Path $SERVICES_DIR -ChildPath $file.Pascal
    
    # Check if original file exists and pascal case version doesn't
    if ((Test-Path $originalPath) -and (-not (Test-Path $pascalPath))) {
        # Create backup
        Copy-Item $originalPath -Destination "$PROJECT_ROOT\cleanup_plan\backups\services\$($file.Original)" -Force
        Write-Host "Backed up $($file.Original)"
        
        # Rename the file
        Rename-Item -Path $originalPath -NewName $file.Pascal -Force
        Write-Host "Renamed $($file.Original) to $($file.Pascal)"
    } elseif ((Test-Path $originalPath) -and (Test-Path $pascalPath)) {
        Write-Host "Both $($file.Original) and $($file.Pascal) exist. Keeping both files."
    } elseif (Test-Path $pascalPath) {
        Write-Host "$($file.Pascal) already exists. Skipping."
    } else {
        Write-Host "$($file.Original) not found. Skipping."
    }
}

# Note about api.js
Write-Host "`nNote: 'api.js' is left as-is since it's often used as a common utility rather than a service class."

Write-Host "`nService file renaming completed!"

# Return to the cleanup_plan directory
Set-Location "$PROJECT_ROOT\cleanup_plan" 