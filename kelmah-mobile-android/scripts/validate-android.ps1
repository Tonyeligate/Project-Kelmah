[CmdletBinding()]
param(
    [switch]$SkipClean,
    [switch]$NoRetry,
    [string[]]$ExtraGradleArgs = @()
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$GradleWrapper = Join-Path $ProjectRoot "gradlew.bat"

if (-not (Test-Path $GradleWrapper)) {
    throw "Gradle wrapper not found at $GradleWrapper"
}

function Write-Step {
    param([string]$Message)
    Write-Host "[android-validate] $Message" -ForegroundColor Cyan
}

function Remove-PathWithRetry {
    param(
        [string]$Path,
        [int]$MaxAttempts = 4
    )

    if (-not (Test-Path $Path)) {
        return
    }

    for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
        try {
            Remove-Item $Path -Recurse -Force -ErrorAction Stop
            Write-Step "Removed: $Path"
            return
        } catch {
            if ($attempt -eq $MaxAttempts) {
                throw "Failed to remove '$Path' after $MaxAttempts attempts. $($_.Exception.Message)"
            }
        }
    }
}

function Stop-ProjectJavaProcesses {
    param([string]$WorkspacePath)

    $escaped = [Regex]::Escape($WorkspacePath)
    $candidates = Get-CimInstance Win32_Process |
        Where-Object {
            ($_.Name -match '^java(w)?\.exe$' -or $_.Name -match 'kotlinc') -and
            $_.CommandLine -and
            ($_.CommandLine -match $escaped)
        }

    foreach ($proc in $candidates) {
        try {
            Stop-Process -Id $proc.ProcessId -Force -ErrorAction Stop
            Write-Step "Stopped process $($proc.Name) (PID $($proc.ProcessId))"
        } catch {
            Write-Step "Could not stop PID $($proc.ProcessId): $($_.Exception.Message)"
        }
    }
}

function Invoke-Gradle {
    param([string[]]$Arguments)

    Write-Step "Running gradle wrapper: $($Arguments -join ' ')"
    Push-Location $ProjectRoot
    try {
        & $GradleWrapper @Arguments | Out-Host
        return [int]$LASTEXITCODE
    } finally {
        Pop-Location
    }
}

function Invoke-Preclean {
    Write-Step "Stopping Android-related Java/Kotlin processes"
    Stop-ProjectJavaProcesses -WorkspacePath $ProjectRoot

    Write-Step "Stopping Gradle daemons"
    [void](Invoke-Gradle -Arguments @('--stop'))

    $cleanupTargets = @(
        (Join-Path $ProjectRoot 'app\build\generated\ksp'),
        (Join-Path $ProjectRoot 'app\build\kspCaches'),
        (Join-Path $ProjectRoot 'app\build\intermediates\lint-cache'),
        (Join-Path $ProjectRoot 'app\build\intermediates\lint_partial_results'),
        (Join-Path $ProjectRoot 'app\build\intermediates\android_test_lint_partial_results'),
        (Join-Path $ProjectRoot 'app\build\intermediates\unit_test_lint_partial_results'),
        (Join-Path $ProjectRoot 'app\build\intermediates\incremental\debugAndroidTest'),
        (Join-Path $ProjectRoot 'app\build\test-results\testDebugUnitTest'),
        (Join-Path $ProjectRoot '.kotlin\sessions')
    )

    Write-Step "Removing transient Android build artifacts"
    foreach ($target in $cleanupTargets) {
        Remove-PathWithRetry -Path $target
    }
}

$tasks = @()
if (-not $SkipClean) {
    $tasks += 'clean'
}
$tasks += @(
    ':app:testDebugUnitTest',
    ':app:lintDebug',
    ':app:assembleDebug',
    ':app:assembleDebugAndroidTest'
)

$gradleArgs = @()
$gradleArgs += $tasks
$gradleArgs += @('--no-daemon', '--stacktrace')
if ($ExtraGradleArgs.Count -gt 0) {
    $gradleArgs += $ExtraGradleArgs
}

Invoke-Preclean
$exitCode = Invoke-Gradle -Arguments $gradleArgs

if ($exitCode -ne 0 -and -not $NoRetry) {
    Write-Step "Initial run failed with exit code $exitCode; retrying once after pre-clean"
    Invoke-Preclean
    $exitCode = Invoke-Gradle -Arguments $gradleArgs
}

if ($exitCode -ne 0) {
    Write-Error "Android validation failed with exit code $exitCode"
    exit $exitCode
}

Write-Step 'Android validation completed successfully'
exit 0
