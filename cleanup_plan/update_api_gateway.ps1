# PowerShell script to update API Gateway to incorporate the Review Service

# Navigate to project root
Set-Location ..

# Store the current directory
$PROJECT_ROOT = Get-Location

# Locate the API Gateway configuration
$API_GATEWAY_DIR = "$PROJECT_ROOT\kelmah-backend\api-gateway"
$ROUTES_DIR = "$API_GATEWAY_DIR\routes"
$CONFIG_DIR = "$API_GATEWAY_DIR\config"
$ROUTES_FILE = "$ROUTES_DIR\index.js"
$CONFIG_FILE = "$CONFIG_DIR\index.js"
$ENV_FILE = "$API_GATEWAY_DIR\.env"

Write-Host "Updating API Gateway to incorporate Review Service..."

# Check if API Gateway directory structure exists, if not create it
if (-not (Test-Path $API_GATEWAY_DIR)) {
    Write-Host "API Gateway directory not found. Creating base structure..."
    New-Item -Path $API_GATEWAY_DIR -ItemType Directory -Force | Out-Null
    New-Item -Path $ROUTES_DIR -ItemType Directory -Force | Out-Null
    New-Item -Path $CONFIG_DIR -ItemType Directory -Force | Out-Null
    
    # Create base routes file if it doesn't exist
    if (-not (Test-Path $ROUTES_FILE)) {
        Write-Host "Creating base routes file..."
        $BASE_ROUTES_CONTENT = @'
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'api-gateway' });
});

// Review Service routes
const reviewServiceProxy = createProxyMiddleware({
  target: process.env.REVIEW_SERVICE_URL || "http://localhost:5006",
  changeOrigin: true,
  pathRewrite: {
    "^/api/reviews": "/api/reviews"
  }
});

// Register Review Service routes
router.use("/api/reviews", reviewServiceProxy);

module.exports = router;
'@
        Set-Content -Path $ROUTES_FILE -Value $BASE_ROUTES_CONTENT
        Write-Host "Created base routes file with Review Service routes included"
    }
    
    # Create base config file if it doesn't exist
    if (-not (Test-Path $CONFIG_FILE)) {
        Write-Host "Creating base config file..."
        $BASE_CONFIG_CONTENT = @'
require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  REVIEW_SERVICE_URL: process.env.REVIEW_SERVICE_URL || "http://localhost:5006",
};
'@
        Set-Content -Path $CONFIG_FILE -Value $BASE_CONFIG_CONTENT
        Write-Host "Created base config file with Review Service URL included"
    }
    
    # Create base .env file if it doesn't exist
    if (-not (Test-Path $ENV_FILE)) {
        Write-Host "Creating base .env file..."
        $BASE_ENV_CONTENT = @'
PORT=5000
NODE_ENV=development

# Review Service
REVIEW_SERVICE_URL=http://localhost:5006
'@
        Set-Content -Path $ENV_FILE -Value $BASE_ENV_CONTENT
        Write-Host "Created base .env file with Review Service URL included"
    }
    
    # Create base server.js file
    $SERVER_FILE = "$API_GATEWAY_DIR\server.js"
    if (-not (Test-Path $SERVER_FILE)) {
        Write-Host "Creating API Gateway server.js file..."
        $SERVER_CONTENT = @'
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes');
const config = require('./config');

// Initialize express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/', routes);

// Start server
const PORT = config.PORT;
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});

module.exports = app;
'@
        Set-Content -Path $SERVER_FILE -Value $SERVER_CONTENT
        Write-Host "Created API Gateway server.js file"
    }
    
    # Create package.json for API Gateway
    $PACKAGE_FILE = "$API_GATEWAY_DIR\package.json"
    if (-not (Test-Path $PACKAGE_FILE)) {
        Write-Host "Creating API Gateway package.json file..."
        $PACKAGE_CONTENT = @'
{
  "name": "kelmah-api-gateway",
  "version": "1.0.0",
  "description": "API Gateway for Kelmah platform",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^10.0.0",
    "express": "^4.17.1",
    "helmet": "^4.6.0",
    "http-proxy-middleware": "^2.0.1"
  },
  "devDependencies": {
    "nodemon": "^2.0.12"
  }
}
'@
        Set-Content -Path $PACKAGE_FILE -Value $PACKAGE_CONTENT
        Write-Host "Created API Gateway package.json file"
    }
    
    Write-Host "API Gateway structure created successfully"
} else {
    # If API Gateway exists but not the subdirectories, create them
    if (-not (Test-Path $ROUTES_DIR)) {
        New-Item -Path $ROUTES_DIR -ItemType Directory -Force | Out-Null
    }
    if (-not (Test-Path $CONFIG_DIR)) {
        New-Item -Path $CONFIG_DIR -ItemType Directory -Force | Out-Null
    }
}

# If routes file doesn't exist, create it with Review Service routes
if (-not (Test-Path $ROUTES_FILE)) {
    Write-Host "Routes file not found. Creating new routes file with Review Service routes..."
    $ROUTES_CONTENT = @'
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'api-gateway' });
});

// Review Service routes
const reviewServiceProxy = createProxyMiddleware({
  target: process.env.REVIEW_SERVICE_URL || "http://localhost:5006",
  changeOrigin: true,
  pathRewrite: {
    "^/api/reviews": "/api/reviews"
  }
});

// Register Review Service routes
router.use("/api/reviews", reviewServiceProxy);

module.exports = router;
'@
    Set-Content -Path $ROUTES_FILE -Value $ROUTES_CONTENT
    Write-Host "Created routes file with Review Service routes"
} else {
    # Backup the original file
    New-Item -Path "$PROJECT_ROOT\cleanup_plan\backups\api-gateway" -ItemType Directory -Force | Out-Null
    Copy-Item $ROUTES_FILE -Destination "$PROJECT_ROOT\cleanup_plan\backups\api-gateway\routes_index.js.bak" -Force
    Write-Host "Backed up routes file to cleanup_plan\backups\api-gateway\"
    
    # 3. Update the routes file to include Review Service routes if not already there
    $routesContent = Get-Content $ROUTES_FILE -Raw
    if ($routesContent -match "REVIEW_SERVICE_URL") {
        Write-Host "Review Service routes already exist in API Gateway. Skipping route configuration."
    } else {
        # Create temp file for the new content
        $TMP_ROUTES_FILE = New-TemporaryFile
        
        # We'll use regex to add the review service route before the module.exports
        $newContent = $routesContent -replace "module\.exports", @"
// Review Service routes
const reviewServiceProxy = createProxyMiddleware({
  target: process.env.REVIEW_SERVICE_URL || "http://localhost:5006",
  changeOrigin: true,
  pathRewrite: {
    "^/api/reviews": "/api/reviews"
  }
});

// Register Review Service routes
router.use("/api/reviews", reviewServiceProxy);

module.exports
"@
        
        # Write the new content to the temp file and then replace the original
        Set-Content -Path $TMP_ROUTES_FILE -Value $newContent
        Move-Item -Path $TMP_ROUTES_FILE -Destination $ROUTES_FILE -Force
        
        Write-Host "Added Review Service routes to API Gateway"
    }
}

# If config file doesn't exist, create it with Review Service URL
if (-not (Test-Path $CONFIG_FILE)) {
    Write-Host "Config file not found. Creating new config file with Review Service URL..."
    $CONFIG_CONTENT = @'
require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  REVIEW_SERVICE_URL: process.env.REVIEW_SERVICE_URL || "http://localhost:5006",
};
'@
    Set-Content -Path $CONFIG_FILE -Value $CONFIG_CONTENT
    Write-Host "Created config file with Review Service URL"
} else {
    # Backup the original file
    if (Test-Path $CONFIG_FILE) {
        Copy-Item $CONFIG_FILE -Destination "$PROJECT_ROOT\cleanup_plan\backups\api-gateway\config_index.js.bak" -Force
        Write-Host "Backed up config file to cleanup_plan\backups\api-gateway\"
    }
    
    # Update config file if it exists
    $configContent = Get-Content $CONFIG_FILE -Raw
    if ($configContent -notmatch "REVIEW_SERVICE_URL") {
        # Use regex to add the review service URL to the config file
        $newConfigContent = $configContent -replace "module\.exports\s*=\s*{", @"
module.exports = {
  REVIEW_SERVICE_URL: process.env.REVIEW_SERVICE_URL || "http://localhost:5006",
"@
        
        # Write the new content to the config file
        Set-Content -Path $CONFIG_FILE -Value $newConfigContent
        Write-Host "Added Review Service URL to config file"
    } else {
        Write-Host "Review Service URL already exists in config file. Skipping."
    }
}

# If .env file doesn't exist, create it with Review Service URL
if (-not (Test-Path $ENV_FILE)) {
    Write-Host ".env file not found. Creating new .env file with Review Service URL..."
    $ENV_CONTENT = @'
PORT=5000
NODE_ENV=development

# Review Service
REVIEW_SERVICE_URL=http://localhost:5006
'@
    Set-Content -Path $ENV_FILE -Value $ENV_CONTENT
    Write-Host "Created .env file with Review Service URL"
} else {
    # Backup the original file
    if (Test-Path $ENV_FILE) {
        Copy-Item $ENV_FILE -Destination "$PROJECT_ROOT\cleanup_plan\backups\api-gateway\env.bak" -Force
        Write-Host "Backed up .env file to cleanup_plan\backups\api-gateway\"
    }
    
    # Update environment configuration if needed
    $envContent = Get-Content $ENV_FILE -Raw
    if ($envContent -notmatch "REVIEW_SERVICE_URL") {
        # Add Review Service URL to .env file
        $reviewServiceEnv = @"

# Review Service
REVIEW_SERVICE_URL=http://localhost:5006
"@
        Add-Content -Path $ENV_FILE -Value $reviewServiceEnv
        Write-Host "Added Review Service URL to .env file"
    } else {
        Write-Host "Review Service URL already exists in .env file. Skipping."
    }
}

# Update backend index.js to include API Gateway and Review Service
$BACKEND_INDEX_FILE = "$PROJECT_ROOT\kelmah-backend\index.js"

if (Test-Path $BACKEND_INDEX_FILE) {
    $indexContent = Get-Content $BACKEND_INDEX_FILE -Raw
    $needsUpdate = $false
    
    # Backup the original file
    Copy-Item $BACKEND_INDEX_FILE -Destination "$PROJECT_ROOT\cleanup_plan\backups\backend_index.js.bak" -Force
    
    # Check if API Gateway needs to be added
    if ($indexContent -notmatch "API Gateway") {
        $needsUpdate = $true
        Write-Host "Adding API Gateway to backend index.js"
    }
    
    # Check if Review Service needs to be added
    if ($indexContent -notmatch "Review Service") {
        $needsUpdate = $true
        Write-Host "Adding Review Service to backend index.js"
    }
    
    if ($needsUpdate) {
        # If services array exists, add both services
        if ($indexContent -match "const services = \[") {
            $newIndexContent = $indexContent -replace "const services = \[([\s\S]*?)\];", @"
const services = [$1  {
    name: "API Gateway",
    path: path.join(__dirname, "api-gateway"),
    script: "server.js",
    color: colors.cyan
  },
  {
    name: "Review Service",
    path: path.join(__dirname, "services", "review-service"),
    script: "server.js",
    color: colors.magenta
  },
];
"@
            
            # Write the new content to the index file
            Set-Content -Path $BACKEND_INDEX_FILE -Value $newIndexContent
            Write-Host "Added API Gateway and Review Service to backend index.js"
        } else {
            # If services array doesn't exist, create a basic index.js file with both services
            $BASIC_INDEX_CONTENT = @'
const path = require('path');
const colors = require('colors/safe');
const { spawn } = require('child_process');

// Define all the services
const services = [
  {
    name: "API Gateway",
    path: path.join(__dirname, "api-gateway"),
    script: "server.js",
    color: colors.cyan
  },
  {
    name: "Review Service",
    path: path.join(__dirname, "services", "review-service"),
    script: "server.js",
    color: colors.magenta
  }
];

// Function to start a service
function startService(service) {
  console.log(`Starting ${service.color(service.name)}...`);
  
  const proc = spawn('node', [service.script], {
    cwd: service.path,
    stdio: 'inherit'
  });
  
  proc.on('close', (code) => {
    console.log(`${service.color(service.name)} exited with code ${code}`);
  });
  
  return proc;
}

// Start all services
console.log('Starting all Kelmah services...');
services.forEach(startService);
'@
            Set-Content -Path $BACKEND_INDEX_FILE -Value $BASIC_INDEX_CONTENT
            Write-Host "Created new backend index.js with API Gateway and Review Service"
        }
    } else {
        Write-Host "API Gateway and Review Service already exist in backend index.js. Skipping."
    }
} else {
    # If backend index.js doesn't exist, create it
    Write-Host "Backend index.js not found. Creating new file..."
    New-Item -Path "$PROJECT_ROOT\kelmah-backend" -ItemType Directory -Force | Out-Null
    
    $BASIC_INDEX_CONTENT = @'
const path = require('path');
const colors = require('colors/safe');
const { spawn } = require('child_process');

// Define all the services
const services = [
  {
    name: "API Gateway",
    path: path.join(__dirname, "api-gateway"),
    script: "server.js",
    color: colors.cyan
  },
  {
    name: "Review Service",
    path: path.join(__dirname, "services", "review-service"),
    script: "server.js",
    color: colors.magenta
  }
];

// Function to start a service
function startService(service) {
  console.log(`Starting ${service.color(service.name)}...`);
  
  const proc = spawn('node', [service.script], {
    cwd: service.path,
    stdio: 'inherit'
  });
  
  proc.on('close', (code) => {
    console.log(`${service.color(service.name)} exited with code ${code}`);
  });
  
  return proc;
}

// Start all services
console.log('Starting all Kelmah services...');
services.forEach(startService);
'@
    Set-Content -Path $BACKEND_INDEX_FILE -Value $BASIC_INDEX_CONTENT
    Write-Host "Created backend index.js with API Gateway and Review Service"
}

# 7. Create frontend ReviewService.js if it doesn't exist
$FRONTEND_SERVICES_DIR = "$PROJECT_ROOT\kelmah-frontend\src\services"
$REVIEW_SERVICE_FILE = "$FRONTEND_SERVICES_DIR\ReviewService.js"

if (-not (Test-Path $REVIEW_SERVICE_FILE)) {
    New-Item -Path $FRONTEND_SERVICES_DIR -ItemType Directory -Force | Out-Null
    
    $REVIEW_SERVICE_JS = @'
import api from './api';

class ReviewService {
  // Get reviews for a specific user
  async getUserReviews(userId, page = 1, limit = 10, reviewType = null) {
    try {
      let url = `/reviews/user/${userId}?page=${page}&limit=${limit}`;
      if (reviewType) {
        url += `&reviewType=${reviewType}`;
      }
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      throw error;
    }
  }

  // Get reviews for a specific job
  async getJobReviews(jobId) {
    try {
      const response = await api.get(`/reviews/job/${jobId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching job reviews:', error);
      throw error;
    }
  }

  // Get review statistics for a user
  async getUserReviewStats(userId) {
    try {
      const response = await api.get(`/reviews/stats/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user review stats:', error);
      throw error;
    }
  }

  // Create a new review
  async createReview(reviewData) {
    try {
      const response = await api.post('/reviews', reviewData);
      return response.data;
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  }

  // Update a review
  async updateReview(reviewId, reviewData) {
    try {
      const response = await api.put(`/reviews/${reviewId}`, reviewData);
      return response.data;
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  }

  // Delete a review
  async deleteReview(reviewId) {
    try {
      const response = await api.delete(`/reviews/${reviewId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  }
}

export default new ReviewService();
'@
    
    Set-Content -Path $REVIEW_SERVICE_FILE -Value $REVIEW_SERVICE_JS
    Write-Host "Created frontend ReviewService.js file"
    
    # Create api.js if it doesn't exist
    $API_FILE = "$FRONTEND_SERVICES_DIR\api.js"
    if (-not (Test-Path $API_FILE)) {
        $API_JS = @'
import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle session expiration
    if (error.response && error.response.status === 401) {
      // Clear localStorage and redirect to login if unauthorized
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
'@
        Set-Content -Path $API_FILE -Value $API_JS
        Write-Host "Created api.js file since it was missing"
    }
    
    # Update services index.js if it exists
    $SERVICES_INDEX_FILE = "$FRONTEND_SERVICES_DIR\index.js"
    
    if (Test-Path $SERVICES_INDEX_FILE) {
        $indexContent = Get-Content $SERVICES_INDEX_FILE -Raw
        if ($indexContent -notmatch "ReviewService") {
            # Backup the original file
            New-Item -Path "$PROJECT_ROOT\cleanup_plan\backups" -ItemType Directory -Force | Out-Null
            Copy-Item $SERVICES_INDEX_FILE -Destination "$PROJECT_ROOT\cleanup_plan\backups\services_index.js.bak" -Force
            
            # Add the import
            $newImport = "import ReviewService from `"./ReviewService`";"
            $newIndexContent = $indexContent -replace "(import.*?;)", "`$1`n$newImport"
            
            # Add to the exports
            if ($indexContent -match "export\s*{") {
                $newIndexContent = $newIndexContent -replace "(export\s*{)([\s\S]*?)(})", "`$1`$2  ReviewService,`n`$3"
            } else {
                # If no export block exists, create one
                $newIndexContent = $newIndexContent + @"

export {
  ReviewService
};
"@
            }
            
            # Write the new content to the index file
            Set-Content -Path $SERVICES_INDEX_FILE -Value $newIndexContent
            Write-Host "Added ReviewService to services/index.js exports"
        } else {
            Write-Host "ReviewService already exists in services/index.js. Skipping."
        }
    } else {
        # Create index.js if it doesn't exist
        $INDEX_JS = @'
import api from "./api";
import ReviewService from "./ReviewService";

export {
  api,
  ReviewService
};
'@
        Set-Content -Path $SERVICES_INDEX_FILE -Value $INDEX_JS
        Write-Host "Created services/index.js file with ReviewService export"
    }
} else {
    Write-Host "Frontend ReviewService.js already exists. Skipping creation."
}

Write-Host "API Gateway update completed successfully!"

# Return to the cleanup_plan directory
Set-Location "$PROJECT_ROOT\cleanup_plan" 