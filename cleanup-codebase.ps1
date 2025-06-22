# Cleanup script for Kelmah frontend codebase
# This script will remove redundant and empty directories

# 1. Remove the entire components directory (since it's been migrated to modules)
Write-Host "Removing redundant components directory..." -ForegroundColor Green
Remove-Item -Path "./components" -Recurse -Force -ErrorAction SilentlyContinue

# 2. Remove empty directories
Write-Host "Removing empty directories..." -ForegroundColor Green

# App directory - empty structure
Remove-Item -Path "./app" -Recurse -Force -ErrorAction SilentlyContinue

# Sectors directory - empty structure
Remove-Item -Path "./sectors" -Recurse -Force -ErrorAction SilentlyContinue

# Shared directory - empty structure 
Remove-Item -Path "./shared" -Recurse -Force -ErrorAction SilentlyContinue

# Empty API subdirectories
Remove-Item -Path "./api/modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "./api/services" -Recurse -Force -ErrorAction SilentlyContinue

# Check for any remaining empty directories
$emptyDirs = Get-ChildItem -Path "." -Directory -Recurse | Where-Object { 
    (Get-ChildItem -Path $_.FullName -File -Recurse -ErrorAction SilentlyContinue).Count -eq 0 
} | Select-Object -ExpandProperty FullName

if ($emptyDirs.Count -gt 0) {
    Write-Host "Found additional empty directories. Consider removing:" -ForegroundColor Yellow
    $emptyDirs | ForEach-Object { Write-Host "  $_" }
}

Write-Host "Cleanup complete!" -ForegroundColor Green
Write-Host "Remember to update any import references in your code." -ForegroundColor Yellow 