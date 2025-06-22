# Master script to fix all import issues and complete the refactoring
Write-Host "Starting comprehensive refactoring fixes..." -ForegroundColor Green

# ======== UTILITY FUNCTIONS ========

# Function to update import paths in a file
function Update-ImportPaths {
    param (
        [string]$FilePath,
        [hashtable]$ImportMappings
    )
    
    if (-not (Test-Path $FilePath)) {
        Write-Host "File not found: $FilePath" -ForegroundColor Red
        return
    }
    
    $content = Get-Content -Path $FilePath -Raw
    $originalContent = $content
    
    foreach ($oldPath in $ImportMappings.Keys) {
        $newPath = $ImportMappings[$oldPath]
        $content = $content -replace [regex]::Escape($oldPath), $newPath
    }
    
    if ($content -ne $originalContent) {
        Set-Content -Path $FilePath -Value $content
        Write-Host "Updated imports in $FilePath" -ForegroundColor Green
    }
}

# Function to ensure a directory exists
function Ensure-DirectoryExists {
    param (
        [string]$Path
    )
    
    if (-not (Test-Path $Path)) {
        New-Item -Path $Path -ItemType Directory -Force | Out-Null
        Write-Host "Created directory: $Path" -ForegroundColor Green
    }
}

# ======== PART 1: SLICE RELOCATIONS ========
Write-Host "`nStep 1: Moving store slices to domain modules..." -ForegroundColor Cyan

$sliceDestinations = @{
    "kelmah-frontend/src/store/slices/authSlice.js" = "kelmah-frontend/src/modules/auth/services/authSlice.js"
    "kelmah-frontend/src/store/slices/jobSlice.js" = "kelmah-frontend/src/modules/jobs/services/jobSlice.js"
    "kelmah-frontend/src/store/slices/reviewsSlice.js" = "kelmah-frontend/src/modules/reviews/services/reviewsSlice.js"
    "kelmah-frontend/src/store/slices/calendarSlice.js" = "kelmah-frontend/src/modules/calendar/services/calendarSlice.js"
    "kelmah-frontend/src/store/slices/dashboardSlice.js" = "kelmah-frontend/src/modules/dashboard/services/dashboardSlice.js"
    "kelmah-frontend/src/store/slices/contractSlice.js" = "kelmah-frontend/src/modules/contracts/services/contractSlice.js"
    "kelmah-frontend/src/store/slices/appSlice.js" = "kelmah-frontend/src/modules/common/services/appSlice.js"
    "kelmah-frontend/src/store/slices/workerSlice.js" = "kelmah-frontend/src/modules/worker/services/workerSlice.js"
    "kelmah-frontend/src/store/slices/hirerSlice.js" = "kelmah-frontend/src/modules/hirer/services/hirerSlice.js"
    "kelmah-frontend/src/store/slices/notificationSlice.js" = "kelmah-frontend/src/modules/notifications/services/notificationSlice.js"
}

foreach ($source in $sliceDestinations.Keys) {
    $destination = $sliceDestinations[$source]
    $destinationDir = Split-Path $destination -Parent
    
    Ensure-DirectoryExists -Path $destinationDir
    
    if (Test-Path $source) {
        Copy-Item -Path $source -Destination $destination -Force
        Write-Host "Copied $source to $destination" -ForegroundColor Green
    }
    else {
        Write-Host "Source file not found: $source" -ForegroundColor Yellow
    }
}

# ======== PART 2: SERVICE RELOCATIONS ========
Write-Host "`nStep 2: Moving API services to domain modules..." -ForegroundColor Cyan

$serviceDestinations = @{
    "kelmah-frontend/src/api/workerService.js" = "kelmah-frontend/src/modules/worker/services/workerService.js"
    "kelmah-frontend/src/api/contractService.js" = "kelmah-frontend/src/modules/contracts/services/contractService.js"
    "kelmah-frontend/src/api/hirerService.js" = "kelmah-frontend/src/modules/hirer/services/hirerService.js"
    "kelmah-frontend/src/api/messageService.js" = "kelmah-frontend/src/modules/messaging/services/messageService.js"
    "kelmah-frontend/src/api/jobsApi.js" = "kelmah-frontend/src/modules/jobs/services/jobsService.js"
    "kelmah-frontend/src/api/eventsApi.js" = "kelmah-frontend/src/modules/calendar/services/eventsService.js"
    "kelmah-frontend/src/services/milestoneService.js" = "kelmah-frontend/src/modules/contracts/services/milestoneService.js"
    "kelmah-frontend/src/services/fileUploadService.js" = "kelmah-frontend/src/modules/common/services/fileUploadService.js"
    "kelmah-frontend/src/services/PaymentService.js" = "kelmah-frontend/src/modules/payment/services/paymentService.js"
    "kelmah-frontend/src/services/ReviewService.js" = "kelmah-frontend/src/modules/reviews/services/reviewService.js"
}

foreach ($source in $serviceDestinations.Keys) {
    $destination = $serviceDestinations[$source]
    $destinationDir = Split-Path $destination -Parent
    
    Ensure-DirectoryExists -Path $destinationDir
    
    if (Test-Path $source) {
        Copy-Item -Path $source -Destination $destination -Force
        Write-Host "Copied $source to $destination" -ForegroundColor Green
    }
    else {
        Write-Host "Source file not found: $source" -ForegroundColor Yellow
    }
}

# ======== PART 3: COMMON AXIOS SERVICE ========
Write-Host "`nStep 3: Setting up common axios service..." -ForegroundColor Cyan

$commonAxiosPath = "kelmah-frontend/src/modules/common/services/axios.js"
$axiosDir = Split-Path $commonAxiosPath -Parent
Ensure-DirectoryExists -Path $axiosDir

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

Set-Content -Path $commonAxiosPath -Value $axiosContent
Write-Host "Created common axios service at $commonAxiosPath" -ForegroundColor Green

# ======== PART 4: API UTILS SETUP ========
Write-Host "`nStep 4: Setting up apiUtils..." -ForegroundColor Cyan

$apiUtilsPath = "kelmah-frontend/src/utils/apiUtils.js"
$apiUtilsDir = Split-Path $apiUtilsPath -Parent
Ensure-DirectoryExists -Path $apiUtilsDir

$apiUtilsContent = @"
import axios from 'axios';
import { API_URL } from '../config/constants';

// Create an axios instance with default config
const apiInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to inject auth token
apiInstance.interceptors.request.use(
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
apiInstance.interceptors.response.use(
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

// Utility functions for API calls
export const apiService = {
  /**
   * Make a GET request
   * @param {string} url - URL to request
   * @param {Object} params - Query parameters
   * @param {Object} options - Additional options
   * @returns {Promise<any>} - Promise with response data
   */
  get: (url, params = {}, options = {}) => {
    return apiInstance.get(url, { params, ...options })
      .then(response => response.data);
  },

  /**
   * Make a POST request
   * @param {string} url - URL to request
   * @param {Object} data - Data to send
   * @param {Object} options - Additional options
   * @returns {Promise<any>} - Promise with response data
   */
  post: (url, data = {}, options = {}) => {
    return apiInstance.post(url, data, options)
      .then(response => response.data);
  },

  /**
   * Make a PUT request
   * @param {string} url - URL to request
   * @param {Object} data - Data to send
   * @param {Object} options - Additional options
   * @returns {Promise<any>} - Promise with response data
   */
  put: (url, data = {}, options = {}) => {
    return apiInstance.put(url, data, options)
      .then(response => response.data);
  },

  /**
   * Make a DELETE request
   * @param {string} url - URL to request
   * @param {Object} options - Additional options
   * @returns {Promise<any>} - Promise with response data
   */
  delete: (url, options = {}) => {
    return apiInstance.delete(url, options)
      .then(response => response.data);
  }
};

export default apiInstance;
"@

Set-Content -Path $apiUtilsPath -Value $apiUtilsContent
Write-Host "Created apiUtils at $apiUtilsPath" -ForegroundColor Green

# ======== PART 5: CONSTANTS FILE SETUP ========
Write-Host "`nStep 5: Setting up constants file..." -ForegroundColor Cyan

$constantsPath = "kelmah-frontend/src/config/constants.js"
$constantsDir = Split-Path $constantsPath -Parent
Ensure-DirectoryExists -Path $constantsDir

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

Set-Content -Path $constantsPath -Value $constantsContent
Write-Host "Created constants file at $constantsPath" -ForegroundColor Green

# ======== PART 6: NOTIFICATION CONTEXT SETUP ========
Write-Host "`nStep 6: Setting up NotificationContext..." -ForegroundColor Cyan

$notificationContextPath = "kelmah-frontend/src/modules/notifications/contexts/NotificationContext.jsx"
$notificationDir = Split-Path $notificationContextPath -Parent
Ensure-DirectoryExists -Path $notificationDir

if (-not (Test-Path $notificationContextPath)) {
    $notificationContextContent = @"
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectNotifications, markAsRead, removeNotification } from '../services/notificationSlice';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const dispatch = useDispatch();
  const storeNotifications = useSelector(selectNotifications);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Sync notifications from the store
  useEffect(() => {
    if (storeNotifications) {
      setNotifications(storeNotifications);
      setUnreadCount(storeNotifications.filter(notification => !notification.read).length);
    }
  }, [storeNotifications]);

  // Mark a notification as read
  const markNotificationAsRead = useCallback((notificationId) => {
    dispatch(markAsRead(notificationId));
  }, [dispatch]);

  // Remove a notification
  const dismissNotification = useCallback((notificationId) => {
    dispatch(removeNotification(notificationId));
  }, [dispatch]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    notifications.forEach(notification => {
      if (!notification.read) {
        dispatch(markAsRead(notification.id));
      }
    });
  }, [dispatch, notifications]);

  // Provide context value
  const contextValue = {
    notifications,
    unreadCount,
    markNotificationAsRead,
    dismissNotification,
    markAllAsRead
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
"@
    
    Set-Content -Path $notificationContextPath -Value $notificationContextContent
    Write-Host "Created NotificationContext at $notificationContextPath" -ForegroundColor Green
}
else {
    Write-Host "NotificationContext already exists at $notificationContextPath" -ForegroundColor Yellow
}

# ======== PART 7: SEO COMPONENT SETUP ========
Write-Host "`nStep 7: Setting up SEO component..." -ForegroundColor Cyan

$seoComponentPath = "kelmah-frontend/src/modules/common/components/common/SEO.jsx"
$seoDir = Split-Path $seoComponentPath -Parent
Ensure-DirectoryExists -Path $seoDir

if (-not (Test-Path $seoComponentPath)) {
    $seoContent = @"
import React from 'react';
import { Helmet } from 'react-helmet';

const SEO = ({ title, description, keywords, ogImage }) => {
  const siteTitle = 'Kelmah - Connect with Professionals';
  const fullTitle = title ? `\${title} | \${siteTitle}` : siteTitle;
  
  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {keywords && <meta name="keywords" content={keywords} />}
      
      {/* Open Graph / Social Media Meta Tags */}
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta property="og:type" content="website" />
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      {ogImage && <meta name="twitter:image" content={ogImage} />}
    </Helmet>
  );
};

export default SEO;
"@
    
    Set-Content -Path $seoComponentPath -Value $seoContent
    Write-Host "Created SEO component at $seoComponentPath" -ForegroundColor Green
}
else {
    Write-Host "SEO component already exists at $seoComponentPath" -ForegroundColor Yellow
}

# ======== PART 8: JOB COMPONENTS SETUP ========
Write-Host "`nStep 8: Setting up JobCard and JobApplication components..." -ForegroundColor Cyan

$jobCardDir = "kelmah-frontend/src/modules/jobs/components/listing"
$jobAppDir = "kelmah-frontend/src/modules/jobs/components/job-application"

Ensure-DirectoryExists -Path $jobCardDir
Ensure-DirectoryExists -Path $jobAppDir

$jobCardSources = @(
    "kelmah-frontend/src/modules/jobs/components/common/JobCard.jsx", 
    "kelmah-frontend/src/components/jobs/JobCard.jsx"
)

$jobCardDestination = "kelmah-frontend/src/modules/jobs/components/listing/JobCard.jsx"

$jobCardFound = $false
foreach ($source in $jobCardSources) {
    if (Test-Path $source) {
        Copy-Item -Path $source -Destination $jobCardDestination -Force
        Write-Host "Copied JobCard from $source to $jobCardDestination" -ForegroundColor Green
        $jobCardFound = $true
        break
    }
}

if (-not $jobCardFound) {
    Write-Host "JobCard component not found in expected locations" -ForegroundColor Yellow
}

$jobAppSources = @(
    "kelmah-frontend/src/modules/jobs/components/common/JobApplication.jsx",
    "kelmah-frontend/src/components/jobs/JobApplication.jsx"
)

$jobAppDestination = "kelmah-frontend/src/modules/jobs/components/job-application/JobApplication.jsx"

$jobAppFound = $false
foreach ($source in $jobAppSources) {
    if (Test-Path $source) {
        Copy-Item -Path $source -Destination $jobAppDestination -Force
        Write-Host "Copied JobApplication from $source to $jobAppDestination" -ForegroundColor Green
        $jobAppFound = $true
        break
    }
}

if (-not $jobAppFound) {
    Write-Host "JobApplication component not found in expected locations" -ForegroundColor Yellow
}

# ======== PART 9: FIX SLICE IMPORTS ========
Write-Host "`nStep 9: Fixing slice imports..." -ForegroundColor Cyan

$sliceImportMappings = @{
    # Auth slice imports
    "import authService from '../../modules/auth/services/authService';" = "import authService from './authService';"
    "import jobsApi from '../../api/jobsApi';" = "import jobsApi from '../../../api/jobsApi';"
    "import api from '../../api/axios';" = "import api from '../../common/services/axios';"
    "import eventsApi from '../../api/eventsApi';" = "import eventsApi from '../../../api/eventsApi';"
    "import { contractService } from '../../api/contractService';" = "import { contractService } from '../../../api/contractService';"
    "import apiClient from '../../services/api/apiClient';" = "import apiClient from '../../../api/axios';"
    "import { API_URL } from '../../config/constants';" = "import { API_URL } from '../../../config/constants';"
}

$sliceFiles = @(
    "kelmah-frontend/src/modules/auth/services/authSlice.js",
    "kelmah-frontend/src/modules/jobs/services/jobSlice.js",
    "kelmah-frontend/src/modules/dashboard/services/dashboardSlice.js",
    "kelmah-frontend/src/modules/calendar/services/calendarSlice.js",
    "kelmah-frontend/src/modules/worker/services/workerSlice.js",
    "kelmah-frontend/src/modules/hirer/services/hirerSlice.js",
    "kelmah-frontend/src/modules/contracts/services/contractSlice.js",
    "kelmah-frontend/src/modules/common/services/appSlice.js",
    "kelmah-frontend/src/modules/reviews/services/reviewsSlice.js"
)

foreach ($file in $sliceFiles) {
    Update-ImportPaths -FilePath $file -ImportMappings $sliceImportMappings
}

# ======== PART 10: FIX COMPONENT IMPORTS ========
Write-Host "`nStep 10: Fixing component imports..." -ForegroundColor Cyan

$componentImportMappings = @{
    # Component imports to updated locations
    'from "../../../../store/slices/hirerSlice"' = 'from "../services/hirerSlice"'
    'from "../../../../store/slices/workerSlice"' = 'from "../services/workerSlice"'
    'from "../../../../store/slices/notificationSlice"' = 'from "../services/notificationSlice"'
    'from "../../../../store/slices/jobSlice"' = 'from "../services/jobSlice"'
    'from "../../services/hirerSlice"' = 'from "../services/hirerSlice"'
    'from "../../services/workerSlice"' = 'from "../services/workerSlice"'
    'from "../../services/notificationSlice"' = 'from "../services/notificationSlice"'
    'from "../../../../api/axios"' = 'from "../../common/services/axios"'
    'from "../../../services/messagingService"' = 'from "../services/messagingService"'
    'from "../../../components/jobs/JobApplication"' = 'from "../../jobs/components/job-application/JobApplication"'
    'from "../../../components/jobs/JobCard"' = 'from "../../jobs/components/listing/JobCard"'
    'from "../components/listing/JobCard"' = 'from "../../jobs/components/listing/JobCard"'
    'from "../../../auth/contexts/AuthContext"' = 'from "../../auth/contexts/AuthContext"'
    'from "../../../../auth/contexts/AuthContext"' = 'from "../../auth/contexts/AuthContext"'
    'from "../../common/components/seo/SEO"' = 'from "../../common/components/common/SEO"'
    'from "../../../notifications/contexts/NotificationContext"' = 'from "../../notifications/contexts/NotificationContext"'
    'from "../../modules/auth/services/authSlice"' = 'from "../services/authSlice"'
    'import axios from "../../../common/services/axios"' = 'import axios from "../../common/services/axios"'
    'import api from "./axios"' = 'import api from "../../common/services/axios"'
    'import { apiService } from "../utils/apiUtils"' = 'import { apiService } from "../../../utils/apiUtils"'
}

$components = Get-ChildItem -Path "kelmah-frontend/src/modules" -Include "*.jsx", "*.js" -Recurse

foreach ($component in $components) {
    Update-ImportPaths -FilePath $component.FullName -ImportMappings $componentImportMappings
}

# ======== PART 11: UPDATE STORE INDEX.JS ========
Write-Host "`nStep 11: Updating store index.js..." -ForegroundColor Cyan

$storeIndexPath = "kelmah-frontend/src/store/index.js"
if (Test-Path $storeIndexPath) {
    $storeIndexContent = @"
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../modules/auth/services/authSlice';
import jobReducer from '../modules/jobs/services/jobSlice';
import dashboardReducer from '../modules/dashboard/services/dashboardSlice';
import notificationsReducer from '../modules/notifications/services/notificationSlice';
import calendarReducer from '../modules/calendar/services/calendarSlice';
import workerReducer from '../modules/worker/services/workerSlice';
import hirerReducer from '../modules/hirer/services/hirerSlice';
import contractReducer from '../modules/contracts/services/contractSlice';
import appReducer from '../modules/common/services/appSlice';
import reviewsReducer from '../modules/reviews/services/reviewsSlice';
import { setupListeners } from '@reduxjs/toolkit/query';

const store = configureStore({
  reducer: {
    auth: authReducer,
    job: jobReducer,
    dashboard: dashboardReducer,
    notification: notificationsReducer,
    calendar: calendarReducer,
    worker: workerReducer,
    hirer: hirerReducer,
    contract: contractReducer,
    app: appReducer,
    reviews: reviewsReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// Setup listeners for RTK-Query
setupListeners(store.dispatch);

export default store;
"@
    
    Set-Content -Path $storeIndexPath -Value $storeIndexContent
    Write-Host "Updated store/index.js with new module paths" -ForegroundColor Green
}

Write-Host "`nRefactoring completed successfully!" -ForegroundColor Green 