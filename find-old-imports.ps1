# Script to find references to old component paths
# This helps identify files that need to be updated after the cleanup

Write-Host "Scanning for references to old component paths..." -ForegroundColor Green

# Search for imports from the components directory
$componentImports = Get-ChildItem -Path "." -Include "*.jsx", "*.js" -Recurse -File | 
    Select-Object -ExpandProperty FullName | 
    ForEach-Object {
        $file = $_
        $content = Get-Content $file -Raw
        if ($content -match "from ['\""]\.\.?\/components\/") {
            [PSCustomObject]@{
                File = $file
                Matches = (Select-String -Path $file -Pattern "from ['\""]\.\.?\/components\/" -AllMatches).Matches.Value
            }
        }
    }

if ($componentImports) {
    Write-Host "Files with references to old component paths:" -ForegroundColor Yellow
    $componentImports | ForEach-Object {
        Write-Host "File: $($_.File)" -ForegroundColor Cyan
        foreach ($match in $_.Matches) {
            Write-Host "  $match" -ForegroundColor Gray
        }
        Write-Host ""
    }
    
    Write-Host "Total files to update: $($componentImports.Count)" -ForegroundColor Yellow
} else {
    Write-Host "No references to old component paths found." -ForegroundColor Green
}

# Search for imports from specific migrated components (dashboard, jobs, messaging)
$specificImports = Get-ChildItem -Path "." -Include "*.jsx", "*.js" -Recurse -File | 
    Select-Object -ExpandProperty FullName | 
    ForEach-Object {
        $file = $_
        $content = Get-Content $file -Raw
        if ($content -match "from ['\""]\.\.?\/components\/(dashboard|jobs|messaging|notifications|payment|profile)\/") {
            [PSCustomObject]@{
                File = $file
                Matches = (Select-String -Path $file -Pattern "from ['\""]\.\.?\/components\/(dashboard|jobs|messaging|notifications|payment|profile)\/" -AllMatches).Matches.Value
            }
        }
    }

if ($specificImports) {
    Write-Host "Files with references to specific migrated components:" -ForegroundColor Yellow
    $specificImports | ForEach-Object {
        Write-Host "File: $($_.File)" -ForegroundColor Cyan
        foreach ($match in $_.Matches) {
            Write-Host "  $match" -ForegroundColor Gray
        }
        Write-Host ""
    }
    
    Write-Host "These imports should be updated to reference the new module structure." -ForegroundColor Yellow
} 