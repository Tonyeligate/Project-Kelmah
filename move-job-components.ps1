# PowerShell script to move job components to their proper locations

# Check for JobApplication component
$jobApplicationSources = @(
    "kelmah-frontend/src/modules/jobs/components/common/JobApplication.jsx",
    "kelmah-frontend/src/components/jobs/JobApplication.jsx"
)

$jobApplicationDestination = "kelmah-frontend/src/modules/jobs/components/job-application/JobApplication.jsx"

$jobApplicationFound = $false
foreach ($source in $jobApplicationSources) {
    if (Test-Path $source) {
        Write-Host "Found JobApplication at $source, moving to proper location" -ForegroundColor Green
        Copy-Item -Path $source -Destination $jobApplicationDestination -Force
        $jobApplicationFound = $true
        break
    }
}

if (-not $jobApplicationFound) {
    Write-Host "JobApplication component not found in expected locations" -ForegroundColor Yellow
}

# Check for JobCard component
$jobCardSources = @(
    "kelmah-frontend/src/modules/jobs/components/common/JobCard.jsx", 
    "kelmah-frontend/src/components/jobs/JobCard.jsx"
)

$jobCardDestination = "kelmah-frontend/src/modules/jobs/components/listing/JobCard.jsx"

$jobCardFound = $false
foreach ($source in $jobCardSources) {
    if (Test-Path $source) {
        Write-Host "Found JobCard at $source, moving to proper location" -ForegroundColor Green
        Copy-Item -Path $source -Destination $jobCardDestination -Force
        $jobCardFound = $true
        break
    }
}

if (-not $jobCardFound) {
    Write-Host "JobCard component not found in expected locations" -ForegroundColor Yellow
}

Write-Host "Job components relocation completed!" -ForegroundColor Green 