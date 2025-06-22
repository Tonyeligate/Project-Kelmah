# Script to update import paths in migrated components
# This is a basic update script - manual verification will be needed

# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host "Creating script to update import paths in migrated components..." -ForegroundColor Cyan
Write-Host "IMPORTANT: This script will make basic updates, but manual verification will be needed!" -ForegroundColor Yellow

# Function to replace import paths in a file
function Update-ImportPaths {
    param (
        [string]$FilePath
    )
    
    $content = Get-Content -Path $FilePath -Raw
    $originalContent = $content
    
    # Common replacements to update relative imports
    $replacements = @{
        # Components to modules paths
        "from '../../components/messaging/" = "from '../";
        "from '../messaging/" = "from '../";
        "from '../../components/jobs/" = "from '../";
        "from '../jobs/" = "from '../";
        
        # Common services and utils - adjust these based on your project structure
        "from '../../services/" = "from '../../../../services/";
        "from '../../../services/" = "from '../../../../services/";
        "from '../../utils/" = "from '../../../../utils/";
        "from '../../../utils/" = "from '../../../../utils/";
        "from '../../hooks/" = "from '../../../../hooks/";
        "from '../../../hooks/" = "from '../../../../hooks/";
        "from '../../contexts/" = "from '../../../../contexts/";
        "from '../../../contexts/" = "from '../../../../contexts/";
    }
    
    foreach ($oldPath in $replacements.Keys) {
        $newPath = $replacements[$oldPath]
        $content = $content -replace [regex]::Escape($oldPath), $newPath
    }
    
    if ($content -ne $originalContent) {
        Set-Content -Path $FilePath -Value $content
        Write-Host "Updated imports in $FilePath" -ForegroundColor Green
    }
    else {
        Write-Host "No import updates needed in $FilePath" -ForegroundColor Gray
    }
}

# Update messaging components
Write-Host "Updating import paths in messaging components..." -ForegroundColor Yellow
Get-ChildItem -Path ".\modules\messaging\components\common" -File -Filter "*.jsx" | ForEach-Object {
    Update-ImportPaths -FilePath $_.FullName
}

# Update jobs components
Write-Host "Updating import paths in jobs components..." -ForegroundColor Yellow
Get-ChildItem -Path ".\modules\jobs\components\common" -File -Filter "*.jsx" | ForEach-Object {
    Update-ImportPaths -FilePath $_.FullName
}

Write-Host "Import path updates completed!" -ForegroundColor Green
Write-Host "IMPORTANT: You should manually review the updated imports to ensure they are correct." -ForegroundColor Magenta
Write-Host "Once you've verified that everything works correctly, you can safely delete the original components." -ForegroundColor Yellow 