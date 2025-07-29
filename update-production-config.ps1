# Update Production Configuration Script
# This script updates all configuration files to work with the new frontend domain

$FRONTEND_URL = "https://kelmah-frontend-cyan.vercel.app"
$BACKEND_API_URL = "https://kelmah-backend-six.vercel.app"

Write-Host "🚀 Updating production configuration files..." -ForegroundColor Green

# Update backend CORS configurations
$backendFiles = @(
    "kelmah-backend/src/app.js",
    "kelmah-backend/services/auth-service/server.js",
    "kelmah-backend/services/job-service/server.js",
    "kelmah-backend/services/user-service/server.js",
    "kelmah-backend/services/payment-service/server.js",
    "kelmah-backend/services/messaging-service/server.js",
    "kelmah-backend/api-gateway/server.js"
)

foreach ($file in $backendFiles) {
    if (Test-Path $file) {
        Write-Host "📝 Updating $file" -ForegroundColor Yellow
        (Get-Content $file) -replace "http://localhost:3000", $FRONTEND_URL | Set-Content $file
        (Get-Content $file) -replace "http://localhost:5173", $FRONTEND_URL | Set-Content $file
    }
}

# Update environment configuration files
$envFiles = @(
    "kelmah-backend/src/config/env.js",
    "kelmah-backend/services/auth-service/config/env.js",
    "kelmah-backend/services/job-service/config/env.js",
    "kelmah-backend/services/user-service/config/env.js"
)

foreach ($file in $envFiles) {
    if (Test-Path $file) {
        Write-Host "🔧 Updating environment config: $file" -ForegroundColor Cyan
        (Get-Content $file) -replace "http://localhost:3000", $FRONTEND_URL | Set-Content $file
    }
}

# Update OAuth redirect URLs
$authFiles = @(
    "kelmah-backend/src/routes/auth.js",
    "kelmah-backend/services/auth-service/routes/auth.routes.js"
)

foreach ($file in $authFiles) {
    if (Test-Path $file) {
        Write-Host "🔐 Updating OAuth redirects: $file" -ForegroundColor Magenta
        (Get-Content $file) -replace "http://localhost:5173", $FRONTEND_URL | Set-Content $file
    }
}

# Update frontend API configurations
$frontendConfigFiles = @(
    "kelmah-frontend/src/config/constants.js",
    "kelmah-frontend/src/config/env.js",
    "kelmah-frontend/src/config/config.js",
    "kelmah-frontend/src/config/environment.js"
)

foreach ($file in $frontendConfigFiles) {
    if (Test-Path $file) {
        Write-Host "⚛️ Updating frontend config: $file" -ForegroundColor Blue
        (Get-Content $file) -replace "http://localhost:5000", $BACKEND_API_URL | Set-Content $file
        (Get-Content $file) -replace "https://api.kelmah.com", $BACKEND_API_URL | Set-Content $file
    }
}

Write-Host "✅ Configuration update completed!" -ForegroundColor Green
Write-Host "🌐 Frontend URL: $FRONTEND_URL" -ForegroundColor Green
Write-Host "🔧 Backend API URL: $BACKEND_API_URL" -ForegroundColor Green 