@ECHO OFF
ECHO Starting Kelmah Backend Services...

:: Start the Auth Service
START "Auth Service" cmd /k "cd %~dp0 && npm run start:auth"

:: Start the User Service
START "User Service" cmd /k "cd %~dp0 && npm run start:user"

:: Start the API Gateway
START "API Gateway" cmd /k "cd %~dp0 && npm run dev"

ECHO All services started. Use CTRL+C in each window to stop the respective service. 