# Vercel + Render Microservices Setup Guide

## Overview
Your architecture:
- **Frontend**: React app deployed on Vercel
- **Backend**: Multiple microservices deployed on Render
- **Development**: Vite proxy routes to services
- **Production**: Direct API calls to Render services

## Current Services on Render
1. `kelmah-auth-service` - Authentication & authorization
2. `kelmah-user-service` - User profile management  
3. `kelmah-job-service` - Job listings & applications
4. `kelmah-messaging-service` - Chat & notifications
5. `kelmah-payment-service` - Payment processing

## Step 1: Set Vercel Environment Variables

Go to your Vercel project → Settings → Environment Variables and add:

```bash
# Primary API URL (auth service)
VITE_API_URL=https://kelmah-auth-service.onrender.com

# Individual service URLs (for future use)
VITE_AUTH_SERVICE_URL=https://kelmah-auth-service.onrender.com
VITE_USER_SERVICE_URL=https://kelmah-user-service.onrender.com
VITE_JOB_SERVICE_URL=https://kelmah-job-service.onrender.com
VITE_MESSAGING_SERVICE_URL=https://kelmah-messaging-service.onrender.com
VITE_PAYMENT_SERVICE_URL=https://kelmah-payment-service.onrender.com

# WebSocket URL for real-time features
VITE_WS_URL=https://kelmah-messaging-service.onrender.com
```

## Step 2: How the API Routing Works

### Development Mode (localhost:5173)
```javascript
// vite.config.js proxy configuration
'/api' → 'https://kelmah-auth-service.onrender.com'
'/api/users' → 'https://kelmah-user-service.onrender.com' 
'/api/jobs' → 'https://kelmah-job-service.onrender.com'
'/api/messages' → 'https://kelmah-messaging-service.onrender.com'
'/api/payments' → 'https://kelmah-payment-service.onrender.com'
```

### Production Mode (Vercel)
```javascript
// Direct calls to Render services
axios.post('https://kelmah-auth-service.onrender.com/api/auth/register')
axios.get('https://kelmah-user-service.onrender.com/api/users/profile')
```

## Step 3: Frontend API Configuration

Your frontend uses this pattern:

```javascript
// src/modules/common/services/axios.js
const isDevelopment = import.meta.env.MODE === 'development';
const baseURL = isDevelopment ? '/api' : API_BASE_URL;

const axiosInstance = axios.create({
  baseURL,
  timeout: 30000,
  withCredentials: true,
});
```

## Step 4: CORS Configuration on Backend

Each Render service needs CORS setup:

```javascript
// In each service's server.js
app.use(cors({
  origin: [
    'http://localhost:5173',           // Development
    'http://127.0.0.1:5173',          // Development  
    'https://kelmah-frontend-ecru.vercel.app'  // Production
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

## Step 5: Service Communication Patterns

### Authentication Flow
1. **Register/Login**: `kelmah-auth-service`
2. **Get JWT token**: Store in localStorage
3. **API calls**: Include `Authorization: Bearer <token>` header
4. **Token refresh**: Auto-refresh on 401 errors

### API Call Pattern
```javascript
// Any API call automatically includes auth token
const response = await axiosInstance.post('/auth/login', {
  email: 'user@example.com',
  password: 'password'
});
```

### Service Discovery
```javascript
// Use services config for different environments
import { API_ENDPOINTS } from './config/services';

// Development: /api/auth/register (proxied)
// Production: https://kelmah-auth-service.onrender.com/api/auth/register
const response = await axios.post(API_ENDPOINTS.AUTH.REGISTER, data);
```

## Step 6: Deployment Checklist

### Frontend (Vercel)
- [ ] Set all environment variables
- [ ] Ensure `vercel.json` has SPA rewrites
- [ ] Test production build locally: `npm run build && npm run preview`

### Backend (Render)
- [ ] Each service has CORS configured for Vercel domain
- [ ] Environment variables set on Render dashboard
- [ ] All services are "Deployed" status
- [ ] Test health endpoints: `https://service.onrender.com/health`

## Step 7: Testing the Connection

### Development Testing
```bash
# Start frontend dev server
npm run dev

# Check network tab - should see:
# POST http://localhost:5173/api/auth/register
# (proxied to https://kelmah-auth-service.onrender.com/api/auth/register)
```

### Production Testing  
```bash
# Build and preview production
npm run build
npm run preview

# Check network tab - should see:
# POST https://kelmah-auth-service.onrender.com/api/auth/register
```

## Step 8: Common Issues & Solutions

### Issue: CORS errors in production
**Solution**: Add Vercel domain to CORS origins in backend services

### Issue: 404 on SPA routes  
**Solution**: Ensure `vercel.json` has rewrite rules

### Issue: Environment variables not working
**Solution**: Restart Vercel deployment after adding env vars

### Issue: Services sleeping (Render free tier)
**Solution**: Services auto-wake on requests, but expect 30s delay for first request

## Next Steps

1. Set the environment variables in Vercel dashboard
2. Redeploy your Vercel frontend
3. Test registration/login flow
4. Monitor network requests in browser dev tools
5. Check Render service logs for any CORS issues

Your microservices architecture is properly set up - you just need to configure the environment variables correctly! 