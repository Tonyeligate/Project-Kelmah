@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
set "PS_SCRIPT=%SCRIPT_DIR%validate-android.ps1"

if not exist "%PS_SCRIPT%" (
  echo [android-validate] Missing script: "%PS_SCRIPT%"
  exit /b 1
)

set "POWERSHELL_EXE=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
if not exist "%POWERSHELL_EXE%" set "POWERSHELL_EXE=powershell.exe"

"%POWERSHELL_EXE%" -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%PS_SCRIPT%" %*
set "EXIT_CODE=%ERRORLEVEL%"

if not "%EXIT_CODE%"=="0" (
  echo [android-validate] Validation failed with exit code %EXIT_CODE%.
) else (
  echo [android-validate] Validation finished successfully.
)

endlocal & exit /b %EXIT_CODE%
