# PowerShell script to create apiUtils file in the utils directory
Write-Host "Setting up apiUtils in the utils directory..." -ForegroundColor Green

# Define paths
$targetPath = "kelmah-frontend/src/utils/apiUtils.js"
$sourcePath = "kelmah-frontend/src/api/axios.js"  # Use existing axios as basis

# Create directory if needed
$targetDir = Split-Path $targetPath -Parent
if (-not (Test-Path $targetDir)) {
    New-Item -Path $targetDir -ItemType Directory -Force | Out-Null
    Write-Host "Created directory: $targetDir" -ForegroundColor Green
}

# Check if source exists
if (Test-Path $sourcePath) {
    # Create apiUtils content based on existing axios file
    $axiosContent = Get-Content -Path $sourcePath -Raw
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

    # Write to target file
    Set-Content -Path $targetPath -Value $apiUtilsContent
    Write-Host "Created apiUtils.js at $targetPath" -ForegroundColor Green
} else {
    Write-Host "Source file not found: $sourcePath" -ForegroundColor Red
}

Write-Host "apiUtils setup completed!" -ForegroundColor Green 