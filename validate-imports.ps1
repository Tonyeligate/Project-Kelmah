# Validation script to check for import errors
# This script checks for any import paths referencing files/components that might not exist

Write-Host "Validating imports..." -ForegroundColor Green

# Check for imports to non-existent components/modules
$importCheck = Get-ChildItem -Path "." -Include "*.jsx", "*.js" -Recurse -File | 
    Select-Object -ExpandProperty FullName | 
    ForEach-Object {
        $file = $_
        $content = Get-Content $file -Raw
        # Extract imports from the file
        $importMatches = [regex]::Matches($content, "import\s+(?:(?:\{[^}]+\})|(?:\w+))\s+from\s+['\"](\.\.?\/.*?)['\"]")
        
        foreach ($match in $importMatches) {
            $importPath = $match.Groups[1].Value
            
            # Skip node_modules and relative imports that go outside the src directory
            if ($importPath -match "^[^\.\/]") {
                continue
            }
            
            # Get the directory of the current file
            $currentDir = [System.IO.Path]::GetDirectoryName($file)
            
            # Resolve the import path relative to the current file
            try {
                $resolvedPath = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($currentDir, $importPath))
                
                # Check if the resolved path is a JavaScript/React file
                $jsFile = $resolvedPath + ".js"
                $jsxFile = $resolvedPath + ".jsx"
                $indexJs = [System.IO.Path]::Combine($resolvedPath, "index.js")
                $indexJsx = [System.IO.Path]::Combine($resolvedPath, "index.jsx")
                
                $exists = (Test-Path $resolvedPath) -or (Test-Path $jsFile) -or (Test-Path $jsxFile) -or 
                          (Test-Path $indexJs) -or (Test-Path $indexJsx)
                
                if (-not $exists) {
                    [PSCustomObject]@{
                        File = $file
                        ImportPath = $importPath
                        ResolvedPath = $resolvedPath
                    }
                }
            } catch {
                Write-Host "Error resolving path in file $file for import $importPath" -ForegroundColor Red
            }
        }
    }

if ($importCheck) {
    Write-Host "Found potential import errors:" -ForegroundColor Yellow
    $importCheck | ForEach-Object {
        Write-Host "  File: $($_.File)" -ForegroundColor Cyan
        Write-Host "  Import path: $($_.ImportPath)" -ForegroundColor Red
        Write-Host "  Resolved path: $($_.ResolvedPath)" -ForegroundColor Gray
        Write-Host ""
    }
    
    Write-Host "Total potential import errors: $($importCheck.Count)" -ForegroundColor Yellow
} else {
    Write-Host "No import errors detected." -ForegroundColor Green
}

# Check for any remaining references to old components directory
$oldComponentRefs = Get-ChildItem -Path "." -Include "*.jsx", "*.js" -Recurse -File | 
    Select-String -Pattern "from ['\""]\.\.?\/components\/" | 
    Select-Object Path, Line

if ($oldComponentRefs) {
    Write-Host "Files still referencing old components directory:" -ForegroundColor Yellow
    $oldComponentRefs | ForEach-Object {
        Write-Host "  File: $($_.Path)" -ForegroundColor Cyan
        Write-Host "  Line: $($_.Line)" -ForegroundColor Gray
        Write-Host ""
    }
    
    Write-Host "Total files with old component references: $($oldComponentRefs.Count)" -ForegroundColor Yellow
} else {
    Write-Host "No references to old components directory found." -ForegroundColor Green
}

Write-Host "Validation complete!" -ForegroundColor Green 