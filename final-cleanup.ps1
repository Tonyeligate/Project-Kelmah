# PowerShell script for final cleanup of the project structure
Write-Host "Performing final cleanup tasks..." -ForegroundColor Green

# Create specific axios instance for the common module if needed
$commonAxiosPath = "kelmah-frontend/src/modules/common/services/axios.js"
if (-not (Test-Path $commonAxiosPath)) {
    Write-Host "Creating common axios service..." -ForegroundColor Cyan
    
    $axiosContent = @"
import axios from 'axios';
import { API_URL } from '../../../config/constants';

// Create an axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to inject auth token
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('kelmah_auth_token');
    
    // If token exists, add it to the headers
    if (token) {
      config.headers.Authorization = `Bearer \${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle token expiration and refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Token refresh logic would go here
      
      // For now, just redirect to login
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
"@
    
    # Create directory if needed
    $axiosDir = Split-Path $commonAxiosPath -Parent
    if (-not (Test-Path $axiosDir)) {
        New-Item -Path $axiosDir -ItemType Directory -Force | Out-Null
    }
    
    # Write axios instance
    Set-Content -Path $commonAxiosPath -Value $axiosContent
    Write-Host "Common axios service created successfully" -ForegroundColor Green
}

# Update import paths for axios in slice files
$commonSliceImportMappings = @{
    "import api from '../../../api/axios';" = "import api from '../../common/services/axios';"
    "import jobsApi from '../../../api/jobsApi';" = "import jobsApi from '../../jobs/services/jobsService';"
    "import eventsApi from '../../../api/eventsApi';" = "import eventsApi from '../../calendar/services/eventsService';"
    "import { contractService } from '../../../api/contractService';" = "import { contractService } from '../../contracts/services/contractService';"
}

# Look for slices to update
$sliceFiles = Get-ChildItem -Path "kelmah-frontend/src/modules" -Include "*Slice.js" -Recurse

foreach ($file in $sliceFiles) {
    $content = Get-Content -Path $file.FullName -Raw
    $originalContent = $content
    
    foreach ($oldImport in $commonSliceImportMappings.Keys) {
        $newImport = $commonSliceImportMappings[$oldImport]
        $content = $content -replace [regex]::Escape($oldImport), $newImport
    }
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content
        Write-Host "Updated import paths in $($file.FullName)" -ForegroundColor Green
    }
}

# Create a config/constants.js file if it doesn't exist
$constantsPath = "kelmah-frontend/src/config/constants.js"
if (-not (Test-Path $constantsPath)) {
    Write-Host "Creating API constants file..." -ForegroundColor Cyan
    
    $constantsContent = @"
// Environment-based configuration
const ENV = process.env.NODE_ENV || 'development';

// API URLs for different environments
const API_URLS = {
  development: 'http://localhost:5000',
  test: 'http://localhost:5000',
  production: 'https://api.kelmah.com'
};

// Core constants
export const API_URL = API_URLS[ENV];
export const API_BASE_URL = API_URL;
export const SOCKET_URL = API_URL;
export const APP_NAME = 'Kelmah';

// Authentication related
export const TOKEN_KEY = 'kelmah_auth_token';
export const USER_KEY = 'kelmah_user';
export const TOKEN_EXPIRY_KEY = 'kelmah_token_expiry';
export const AUTH_ROLES = {
  WORKER: 'worker',
  HIRER: 'hirer',
  ADMIN: 'admin'
};

// Local storage keys
export const THEME_KEY = 'kelmah_theme';
export const LANGUAGE_KEY = 'kelmah_language';
export const LAST_ROUTE_KEY = 'kelmah_last_route';

// Job related constants
export const JOB_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired'
};

// Payment related constants
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

// Application related
export const APPLICATION_STATUS = {
  PENDING: 'pending',
  UNDER_REVIEW: 'under-review',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn'
};
"@
    
    # Create directory if needed
    $constantsDir = Split-Path $constantsPath -Parent
    if (-not (Test-Path $constantsDir)) {
        New-Item -Path $constantsDir -ItemType Directory -Force | Out-Null
    }
    
    # Write constants file
    Set-Content -Path $constantsPath -Value $constantsContent
    Write-Host "API constants file created successfully" -ForegroundColor Green
}

Write-Host "Final cleanup completed!" -ForegroundColor Green 