@echo off
echo KELMAH IP Update Tool
echo ====================
echo.
echo This tool will update your frontend configuration with the current public IP
echo.
echo Current Public IP: 
powershell -Command "Invoke-WebRequest -Uri 'https://api.ipify.org' -UseBasicParsing | Select-Object -ExpandProperty Content"
echo.
echo Updating configuration files...
powershell -ExecutionPolicy Bypass -File "update-frontend-ip.ps1"
echo.
echo Done! Now commit and push your changes:
echo git add .
echo git commit -m "Update IP address"
echo git push
echo.
pause
