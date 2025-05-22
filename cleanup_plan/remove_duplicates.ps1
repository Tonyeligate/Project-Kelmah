# PowerShell script to remove duplicate and unnecessary files

# Navigate to project root
Set-Location ..

# Store the current directory
$PROJECT_ROOT = Get-Location

# 1. Delete duplicate files in frontend
Write-Host "Removing duplicate files in frontend..."

# Check and remove duplicate App files (keep App.jsx)
if ((Test-Path "$PROJECT_ROOT\kelmah-frontend\src\App.js") -and (Test-Path "$PROJECT_ROOT\kelmah-frontend\src\App.jsx")) {
    # Create backup directory
    New-Item -Path "$PROJECT_ROOT\cleanup_plan\backups\src" -ItemType Directory -Force | Out-Null
    Copy-Item "$PROJECT_ROOT\kelmah-frontend\src\App.js" -Destination "$PROJECT_ROOT\cleanup_plan\backups\src\App.js" -Force
    
    # Remove duplicate
    Remove-Item "$PROJECT_ROOT\kelmah-frontend\src\App.js" -Force
    Write-Host "Deleted duplicate App.js (keeping App.jsx)"
}

# Check and remove duplicate index files (keep main.jsx)
if ((Test-Path "$PROJECT_ROOT\kelmah-frontend\src\index.js") -and (Test-Path "$PROJECT_ROOT\kelmah-frontend\src\main.jsx")) {
    # Create backup directory if not exists
    New-Item -Path "$PROJECT_ROOT\cleanup_plan\backups\src" -ItemType Directory -Force | Out-Null
    Copy-Item "$PROJECT_ROOT\kelmah-frontend\src\index.js" -Destination "$PROJECT_ROOT\cleanup_plan\backups\src\index.js" -Force
    
    # Remove duplicate
    Remove-Item "$PROJECT_ROOT\kelmah-frontend\src\index.js" -Force
    Write-Host "Deleted duplicate index.js (keeping main.jsx)"
}

# Check and remove empty messagingService.js stub file
if (Test-Path "$PROJECT_ROOT\kelmah-frontend\src\messagingService.js") {
    # Check if file is empty or nearly empty (less than 10 bytes)
    $fileInfo = Get-Item "$PROJECT_ROOT\kelmah-frontend\src\messagingService.js"
    if ($fileInfo.Length -lt 10) {
        # Create backup directory if not exists
        New-Item -Path "$PROJECT_ROOT\cleanup_plan\backups\src" -ItemType Directory -Force | Out-Null
        Copy-Item "$PROJECT_ROOT\kelmah-frontend\src\messagingService.js" -Destination "$PROJECT_ROOT\cleanup_plan\backups\src\messagingService.js" -Force
        
        # Remove stub file
        Remove-Item "$PROJECT_ROOT\kelmah-frontend\src\messagingService.js" -Force
        Write-Host "Deleted empty stub file: messagingService.js"
    }
}

# 2. Remove duplicate auth service in API
if ((Test-Path "$PROJECT_ROOT\kelmah-frontend\src\api\authService.js") -and (Test-Path "$PROJECT_ROOT\kelmah-frontend\src\services\authService.js")) {
    # Make a backup first
    New-Item -Path "$PROJECT_ROOT\cleanup_plan\backups\api" -ItemType Directory -Force | Out-Null
    Copy-Item "$PROJECT_ROOT\kelmah-frontend\src\api\authService.js" -Destination "$PROJECT_ROOT\cleanup_plan\backups\api\authService.js" -Force
    Write-Host "Backed up api\authService.js to cleanup_plan\backups\api\"
    
    # Now remove the duplicate
    Remove-Item "$PROJECT_ROOT\kelmah-frontend\src\api\authService.js" -Force
    Write-Host "Deleted duplicate authService.js in api\ (keeping the one in services\)"
}

# Check for duplicate component directories with similar functionality
Write-Host "Checking for component directories with similar functionality..."

# 3. Merge chat and messaging directories if both exist
if ((Test-Path "$PROJECT_ROOT\kelmah-frontend\src\components\chat") -and (Test-Path "$PROJECT_ROOT\kelmah-frontend\src\components\messaging")) {
    # Create backup
    New-Item -Path "$PROJECT_ROOT\cleanup_plan\backups\components" -ItemType Directory -Force | Out-Null
    Copy-Item "$PROJECT_ROOT\kelmah-frontend\src\components\chat" -Destination "$PROJECT_ROOT\cleanup_plan\backups\components\chat" -Recurse -Force
    Write-Host "Backed up components\chat\ to cleanup_plan\backups\components\"
    
    # Copy files from chat to messaging if they don't already exist
    Get-ChildItem "$PROJECT_ROOT\kelmah-frontend\src\components\chat\*" | ForEach-Object {
        $filename = $_.Name
        if (-not (Test-Path "$PROJECT_ROOT\kelmah-frontend\src\components\messaging\$filename")) {
            Copy-Item $_.FullName -Destination "$PROJECT_ROOT\kelmah-frontend\src\components\messaging\" -Force
            Write-Host "Copied $filename from chat\ to messaging\"
        }
    }
    
    # Now remove the chat directory
    Remove-Item "$PROJECT_ROOT\kelmah-frontend\src\components\chat" -Recurse -Force
    Write-Host "Merged chat\ into messaging\ and removed chat\ directory"
}

# 4. Merge messages and messaging directories if both exist
if ((Test-Path "$PROJECT_ROOT\kelmah-frontend\src\components\messages") -and (Test-Path "$PROJECT_ROOT\kelmah-frontend\src\components\messaging")) {
    # Create backup
    New-Item -Path "$PROJECT_ROOT\cleanup_plan\backups\components" -ItemType Directory -Force | Out-Null
    Copy-Item "$PROJECT_ROOT\kelmah-frontend\src\components\messages" -Destination "$PROJECT_ROOT\cleanup_plan\backups\components\messages" -Recurse -Force
    Write-Host "Backed up components\messages\ to cleanup_plan\backups\components\"
    
    # Copy files from messages to messaging if they don't already exist
    Get-ChildItem "$PROJECT_ROOT\kelmah-frontend\src\components\messages\*" | ForEach-Object {
        $filename = $_.Name
        if (-not (Test-Path "$PROJECT_ROOT\kelmah-frontend\src\components\messaging\$filename")) {
            Copy-Item $_.FullName -Destination "$PROJECT_ROOT\kelmah-frontend\src\components\messaging\" -Force
            Write-Host "Copied $filename from messages\ to messaging\"
        }
    }
    
    # Now remove the messages directory
    Remove-Item "$PROJECT_ROOT\kelmah-frontend\src\components\messages" -Recurse -Force
    Write-Host "Merged messages\ into messaging\ and removed messages\ directory"
}

# 5. Merge payment and payments directories if both exist
if ((Test-Path "$PROJECT_ROOT\kelmah-frontend\src\components\payment") -and (Test-Path "$PROJECT_ROOT\kelmah-frontend\src\components\payments")) {
    # Create backup
    New-Item -Path "$PROJECT_ROOT\cleanup_plan\backups\components" -ItemType Directory -Force | Out-Null
    Copy-Item "$PROJECT_ROOT\kelmah-frontend\src\components\payment" -Destination "$PROJECT_ROOT\cleanup_plan\backups\components\payment" -Recurse -Force
    Write-Host "Backed up components\payment\ to cleanup_plan\backups\components\"
    
    # Copy files from payment to payments if they don't already exist
    Get-ChildItem "$PROJECT_ROOT\kelmah-frontend\src\components\payment\*" | ForEach-Object {
        $filename = $_.Name
        if (-not (Test-Path "$PROJECT_ROOT\kelmah-frontend\src\components\payments\$filename")) {
            Copy-Item $_.FullName -Destination "$PROJECT_ROOT\kelmah-frontend\src\components\payments\" -Force
            Write-Host "Copied $filename from payment\ to payments\"
        }
    }
    
    # Now remove the payment directory
    Remove-Item "$PROJECT_ROOT\kelmah-frontend\src\components\payment" -Recurse -Force
    Write-Host "Merged payment\ into payments\ and removed payment\ directory"
}

# 6. Merge job and jobs directories if both exist
if ((Test-Path "$PROJECT_ROOT\kelmah-frontend\src\components\job") -and (Test-Path "$PROJECT_ROOT\kelmah-frontend\src\components\jobs")) {
    # Create backup
    New-Item -Path "$PROJECT_ROOT\cleanup_plan\backups\components" -ItemType Directory -Force | Out-Null
    Copy-Item "$PROJECT_ROOT\kelmah-frontend\src\components\job" -Destination "$PROJECT_ROOT\cleanup_plan\backups\components\job" -Recurse -Force
    Write-Host "Backed up components\job\ to cleanup_plan\backups\components\"
    
    # Copy files from job to jobs if they don't already exist
    Get-ChildItem "$PROJECT_ROOT\kelmah-frontend\src\components\job\*" | ForEach-Object {
        $filename = $_.Name
        if (-not (Test-Path "$PROJECT_ROOT\kelmah-frontend\src\components\jobs\$filename")) {
            Copy-Item $_.FullName -Destination "$PROJECT_ROOT\kelmah-frontend\src\components\jobs\" -Force
            Write-Host "Copied $filename from job\ to jobs\"
        }
    }
    
    # Now remove the job directory
    Remove-Item "$PROJECT_ROOT\kelmah-frontend\src\components\job" -Recurse -Force
    Write-Host "Merged job\ into jobs\ and removed job\ directory"
}

# 7. Merge workers and worker directories if both exist
if ((Test-Path "$PROJECT_ROOT\kelmah-frontend\src\components\workers") -and (Test-Path "$PROJECT_ROOT\kelmah-frontend\src\components\worker")) {
    # Create backup
    New-Item -Path "$PROJECT_ROOT\cleanup_plan\backups\components" -ItemType Directory -Force | Out-Null
    Copy-Item "$PROJECT_ROOT\kelmah-frontend\src\components\workers" -Destination "$PROJECT_ROOT\cleanup_plan\backups\components\workers" -Recurse -Force
    Write-Host "Backed up components\workers\ to cleanup_plan\backups\components\"
    
    # Copy files from workers to worker if they don't already exist
    Get-ChildItem "$PROJECT_ROOT\kelmah-frontend\src\components\workers\*" | ForEach-Object {
        $filename = $_.Name
        if (-not (Test-Path "$PROJECT_ROOT\kelmah-frontend\src\components\worker\$filename")) {
            Copy-Item $_.FullName -Destination "$PROJECT_ROOT\kelmah-frontend\src\components\worker\" -Force
            Write-Host "Copied $filename from workers\ to worker\"
        }
    }
    
    # Now remove the workers directory
    Remove-Item "$PROJECT_ROOT\kelmah-frontend\src\components\workers" -Recurse -Force
    Write-Host "Merged workers\ into worker\ and removed workers\ directory"
}

Write-Host "Duplicate file cleanup completed!"
Write-Host "Backups are stored in cleanup_plan\backups\ directory"

# Return to the cleanup_plan directory
Set-Location "$PROJECT_ROOT\cleanup_plan" 