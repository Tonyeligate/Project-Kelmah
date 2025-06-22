# Script to find references to old component paths
# This will help identify files that need to be updated to use the new module paths

# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host "Scanning for references to old component paths..." -ForegroundColor Cyan

# Search patterns
$patterns = @(
    "from '.*components/messaging",
    "from '.*components/jobs",
    "import.*from '.*components/messaging",
    "import.*from '.*components/jobs",
    "require\('.*components/messaging",
    "require\('.*components/jobs"
)

$results = @()

# Function to search for patterns in files
function Find-Patterns {
    param (
        [string]$Directory,
        [string[]]$FileTypes = @("*.js", "*.jsx", "*.ts", "*.tsx")
    )
    
    foreach ($pattern in $patterns) {
        Write-Host "Searching for pattern: $pattern" -ForegroundColor Yellow
        
        foreach ($fileType in $FileTypes) {
            $files = Get-ChildItem -Path $Directory -Filter $fileType -Recurse -File
            
            foreach ($file in $files) {
                $content = Get-Content -Path $file.FullName -Raw
                if ($content -match $pattern) {
                    $result = [PSCustomObject]@{
                        File = $file.FullName
                        Pattern = $pattern
                        Line = ($content -split "`n" | Where-Object { $_ -match $pattern } | Select-Object -First 1).Trim()
                    }
                    $results += $result
                    Write-Host "Found in $($file.FullName): $($result.Line)" -ForegroundColor Red
                }
            }
        }
    }
}

# Search in src directory excluding node_modules
Write-Host "Searching in source files..." -ForegroundColor Yellow
Find-Patterns -Directory "." -FileTypes @("*.js", "*.jsx", "*.ts", "*.tsx")

# Output summary
Write-Host "===== SUMMARY =====" -ForegroundColor Cyan
Write-Host "Found $($results.Count) references to old component paths" -ForegroundColor $(if ($results.Count -gt 0) { "Red" } else { "Green" })

if ($results.Count -gt 0) {
    $uniqueFiles = $results | Select-Object -Property File -Unique
    Write-Host "Files to update ($($uniqueFiles.Count)):" -ForegroundColor Yellow
    foreach ($file in $uniqueFiles) {
        Write-Host "- $($file.File)" -ForegroundColor Yellow
    }
    
    Write-Host "You need to update these files to use the new module structure:" -ForegroundColor Magenta
    Write-Host "  Old: import Component from '../components/messaging/Component'" -ForegroundColor Red
    Write-Host "  New: import Component from '../modules/messaging/components/common/Component'" -ForegroundColor Green
} else {
    Write-Host "No files found that reference old component paths. Safe to proceed!" -ForegroundColor Green
}

Write-Host "IMPORTANT: After updating all references, you can safely delete the original component folders." -ForegroundColor Yellow 