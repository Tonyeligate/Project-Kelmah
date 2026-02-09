# CORS Configuration for Kelmah Backend Services

## 🚨 Current Issue
The backend services are configured with CORS allowing only `http://localhost:3000`, but the frontend is deployed on Vercel at `https://kelmah-frontend-mu.vercel.app`.

## 🔧 Required CORS Configuration

### Services Affected:
- **Job Service**: `https://kelmah-job-service.onrender.com`
- **User Service**: `https://kelmah-user-service.onrender.com`
- **Auth Service**: `https://kelmah-auth-service.onrender.com`
- **Messaging Service**: `https://kelmah-messaging-service.onrender.com`
- **Payment Service**: `https://kelmah-payment-service.onrender.com`

### Required CORS Origins:
```javascript
const allowedOrigins = [
  'http://localhost:3000',           // Local development
  'http://localhost:5173',           // Vite dev server
  'https://kelmah-frontend-mu.vercel.app', // Production frontend
  'https://kelmah-frontend.vercel.app',    // Alternative production URL
];
```

### Express.js CORS Configuration Example:
```javascript
const cors = require('cors');

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));
```

### Environment Variable Approach:
```javascript
// In your backend services
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000'];

// Set environment variable in production:
// ALLOWED_ORIGINS=http://localhost:3000,https://kelmah-frontend-mu.vercel.app
```

## 🚀 Deployment Steps

### For Each Backend Service:

1. **Update CORS Configuration**
   - Add the Vercel frontend URL to allowed origins
   - Ensure credentials are enabled for authentication

2. **Environment Variables**
   - Set `ALLOWED_ORIGINS` environment variable in Render/deployment platform
   - Include both localhost (for development) and Vercel URL (for production)

3. **Test Configuration**
   - Deploy the updated service
   - Test API calls from the frontend
   - Verify preflight OPTIONS requests are handled correctly

## 🔍 Current Error Messages:
```
Access to XMLHttpRequest at 'https://kelmah-job-service.onrender.com/api/jobs' 
from origin 'https://kelmah-frontend-mu.vercel.app' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
The 'Access-Control-Allow-Origin' header has a value 'http://localhost:3000' 
that is not equal to the supplied origin.
```

## ✅ Expected Result After Fix:
- All API calls from the frontend will work without CORS errors
- The mock data fallback system will still work as a backup
- Both development and production environments will function properly

## 🛠️ Alternative Solutions:

### 1. API Gateway/Proxy
Set up an API gateway that handles CORS for all services

### 2. Environment-Specific Configuration
Different CORS settings for development vs production deployments

### 3. Wildcard Origins (Not Recommended for Production)
```javascript
// Only for development/testing
origin: '*'
```

## 📝 Notes:
- The frontend has been updated with comprehensive mock data fallbacks
- The application works perfectly with mock data when services are unavailable
- CORS fixes will enable the real backend integration
- All API services have been updated with proper service routing 