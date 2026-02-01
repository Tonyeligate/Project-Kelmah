# Production Deployment Guide

## ✅ Completed Configurations

### Frontend Configuration
- **URL**: https://kelmah-frontend-cyan.vercel.app
- **Status**: ✅ Online and accessible
- **API Configuration**: Updated to point to production backend

### Backend Configuration  
- **Main API**: https://kelmah-backend-six.vercel.app
- **Status**: ✅ Online (404 on /health is expected - need to add endpoint)
- **CORS**: ✅ Updated to allow new frontend domain

## 🔧 Current Setup

### Working Services
1. **Frontend**: https://kelmah-frontend-cyan.vercel.app
2. **Main Backend/API Gateway**: https://kelmah-backend-six.vercel.app

### Configuration Updates Made
1. ✅ Updated CORS in all backend services to allow new frontend domain
2. ✅ Updated OAuth redirect URLs to use production frontend
3. ✅ Updated frontend API configuration to use production backend
4. ✅ Environment configurations updated across all services

## 🚀 Next Steps

### 1. Test Core API Endpoints
```bash
# Test these endpoints from your frontend:
GET https://kelmah-backend-six.vercel.app/api/auth/status
GET https://kelmah-backend-six.vercel.app/api/jobs
GET https://kelmah-backend-six.vercel.app/api/users/profile
```

### 2. Microservices Status
The individual microservices on Render appear to be sleeping or need redeployment:
- Auth Service: https://kelmah-auth-service.onrender.com
- Job Service: https://kelmah-job-service.onrender.com  
- User Service: https://kelmah-user-service.onrender.com
- Messaging Service: https://kelmah-messaging-service.onrender.com
- Payment Service: https://kelmah-payment-service.onrender.com

### 3. Database Connections
Ensure database connections are properly configured for production.

## 🔍 Testing Your Setup

### Frontend → Backend Connection Test
1. Open your frontend: https://kelmah-frontend-cyan.vercel.app
2. Check browser console for API calls
3. Verify no CORS errors
4. Test login/authentication flow

### API Health Check
```javascript
// Test this in browser console on your frontend:
fetch('https://kelmah-backend-six.vercel.app/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

## 🎯 Key URLs Summary

| Service | URL |
|---------|-----|
| **Frontend** | https://kelmah-frontend-cyan.vercel.app |
| **Main Backend** | https://kelmah-backend-six.vercel.app |
| **Auth Service** | https://kelmah-auth-service.onrender.com |
| **Job Service** | https://kelmah-job-service.onrender.com |
| **User Service** | https://kelmah-user-service.onrender.com |

## 🔐 Environment Variables

### Frontend (.env.production)
```
VITE_API_URL=https://kelmah-backend-six.vercel.app
VITE_WS_URL=wss://kelmah-backend-six.vercel.app
```

### Backend (.env.production)  
```
FRONTEND_URL=https://kelmah-frontend-cyan.vercel.app
NODE_ENV=production
CORS_ALLOWED_ORIGINS=https://kelmah-frontend-cyan.vercel.app
``` 