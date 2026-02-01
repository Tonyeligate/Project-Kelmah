# How All Services Connect to Vercel Frontend

## 🏗️ Architecture Overview

Your microservices architecture connects to Vercel frontend using this pattern:

```
Frontend (Vercel) → Service Routing → Backend Services (Render)
```

## 🔄 Service Routing Strategy

### Development Mode (localhost:5173)
All requests go through **Vite proxy** → **Render services**

### Production Mode (Vercel)
All requests go **directly** → **Render services**

---

## 📊 Service Connection Details

### 1. **Auth Service** (`kelmah-auth-service`)
- **Purpose**: Authentication, JWT tokens, user registration/login
- **Render URL**: `https://kelmah-auth-service.onrender.com`

**API Calls:**
```javascript
// Development: POST /api/auth/register → https://kelmah-auth-service.onrender.com/api/auth/register
// Production:  POST https://kelmah-auth-service.onrender.com/api/auth/register

import { API_ENDPOINTS } from '../config/services';
const response = await axios.post(API_ENDPOINTS.AUTH.REGISTER, userData);
```

### 2. **User Service** (`kelmah-user-service`)
- **Purpose**: User profiles, user management, user data
- **Render URL**: `https://kelmah-user-service.onrender.com`

**API Calls:**
```javascript
// Development: GET /api/users/profile → https://kelmah-user-service.onrender.com/api/profile
// Production:  GET https://kelmah-user-service.onrender.com/api/profile

import { API_ENDPOINTS } from '../config/services';
const response = await axios.get(API_ENDPOINTS.USER.PROFILE);
```

### 3. **Job Service** (`kelmah-job-service`)  
- **Purpose**: Job listings, job applications, job management
- **Render URL**: `https://kelmah-job-service.onrender.com`

**API Calls:**
```javascript
// Development: GET /api/jobs → https://kelmah-job-service.onrender.com/api/jobs
// Production:  GET https://kelmah-job-service.onrender.com/api/jobs

import { API_ENDPOINTS } from '../config/services';
const response = await axios.get(API_ENDPOINTS.JOB.LIST);
```

### 4. **Messaging Service** (`kelmah-messaging-service`)
- **Purpose**: Chat, conversations, real-time messaging
- **Render URL**: `https://kelmah-messaging-service.onrender.com`

**API Calls:**
```javascript
// Development: GET /api/messages/conversations → https://kelmah-messaging-service.onrender.com/api/conversations
// Production:  GET https://kelmah-messaging-service.onrender.com/api/conversations

import { API_ENDPOINTS } from '../config/services';
const response = await axios.get(API_ENDPOINTS.MESSAGING.CONVERSATIONS);
```

### 5. **Payment Service** (`kelmah-payment-service`)
- **Purpose**: Payment processing, billing, transactions
- **Render URL**: `https://kelmah-payment-service.onrender.com`

**API Calls:**
```javascript
// Development: POST /api/payments/process → https://kelmah-payment-service.onrender.com/api/payments/process
// Production:  POST https://kelmah-payment-service.onrender.com/api/payments/process

import { API_ENDPOINTS } from '../config/services';
const response = await axios.post(API_ENDPOINTS.PAYMENT.PROCESS, paymentData);
```

---

## 🔧 Technical Implementation

### Vite Proxy Configuration (Development)
```javascript
// vite.config.js
proxy: {
  // Most specific routes first
  '/api/users': {
    target: 'https://kelmah-user-service.onrender.com',
    rewrite: (path) => path.replace(/^\/api\/users/, '/api')
  },
  '/api/jobs': {
    target: 'https://kelmah-job-service.onrender.com',
    rewrite: (path) => path.replace(/^\/api\/jobs/, '/api')
  },
  '/api/messages': {
    target: 'https://kelmah-messaging-service.onrender.com',
    rewrite: (path) => path.replace(/^\/api\/messages/, '/api')
  },
  '/api/payments': {
    target: 'https://kelmah-payment-service.onrender.com',
    rewrite: (path) => path.replace(/^\/api\/payments/, '/api')
  },
  // Fallback for auth service
  '/api': {
    target: 'https://kelmah-auth-service.onrender.com'
  }
}
```

### Services Configuration (All Environments)
```javascript
// src/config/services.js
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/api/auth/register',    // → kelmah-auth-service
    LOGIN: '/api/auth/login'
  },
  USER: {
    PROFILE: '/api/users/profile',     // → kelmah-user-service
    UPDATE: '/api/users/profile/update'
  },
  JOB: {
    LIST: '/api/jobs',                 // → kelmah-job-service
    CREATE: '/api/jobs'
  },
  MESSAGING: {
    CONVERSATIONS: '/api/messages/conversations', // → kelmah-messaging-service
    SEND: '/api/messages/send'
  },
  PAYMENT: {
    PROCESS: '/api/payments/process',  // → kelmah-payment-service
    METHODS: '/api/payments/methods'
  }
};
```

---

## 🌐 Vercel Environment Variables

Set these in Vercel Dashboard → Settings → Environment Variables:

```bash
# Primary API (for fallback and auth)
VITE_API_URL=https://kelmah-auth-service.onrender.com

# Individual services (optional, for future direct routing)
VITE_AUTH_SERVICE_URL=https://kelmah-auth-service.onrender.com
VITE_USER_SERVICE_URL=https://kelmah-user-service.onrender.com
VITE_JOB_SERVICE_URL=https://kelmah-job-service.onrender.com
VITE_MESSAGING_SERVICE_URL=https://kelmah-messaging-service.onrender.com
VITE_PAYMENT_SERVICE_URL=https://kelmah-payment-service.onrender.com

# WebSocket for real-time features
VITE_WS_URL=https://kelmah-messaging-service.onrender.com
```

---

## 🔄 Request Flow Examples

### Example 1: User Registration
```
1. Frontend form submit → API_ENDPOINTS.AUTH.REGISTER
2. Development: POST /api/auth/register → Vite proxy → kelmah-auth-service
3. Production: POST https://kelmah-auth-service.onrender.com/api/auth/register
4. Response: JWT token + user data
```

### Example 2: Job Search
```
1. Jobs page load → API_ENDPOINTS.JOB.LIST  
2. Development: GET /api/jobs → Vite proxy → kelmah-job-service
3. Production: GET https://kelmah-job-service.onrender.com/api/jobs
4. Response: Paginated job listings
```

### Example 3: Send Message
```
1. Chat component → API_ENDPOINTS.MESSAGING.SEND
2. Development: POST /api/messages/send → Vite proxy → kelmah-messaging-service  
3. Production: POST https://kelmah-messaging-service.onrender.com/api/messages/send
4. Response: Message sent confirmation + WebSocket notification
```

### Example 4: Process Payment
```
1. Payment form → API_ENDPOINTS.PAYMENT.PROCESS
2. Development: POST /api/payments/process → Vite proxy → kelmah-payment-service
3. Production: POST https://kelmah-payment-service.onrender.com/api/payments/process
4. Response: Payment confirmation + transaction ID
```

---

## ✅ Connection Checklist

### Backend (Render Services)
- [ ] All 5 services are deployed and showing "Deployed" status
- [ ] Each service has CORS configured for your Vercel domain
- [ ] Health endpoints respond: `/health` or `/api/health`
- [ ] Environment variables set correctly on each service

### Frontend (Vercel)
- [ ] `VITE_API_URL` environment variable set
- [ ] Vercel deployment triggered after env var changes
- [ ] `vercel.json` configured for SPA routing
- [ ] Services configuration imported in API files

### Testing
- [ ] Registration/login works (auth service)
- [ ] Job listings load (job service)
- [ ] User profile loads (user service)  
- [ ] Messages can be sent (messaging service)
- [ ] Payments can be processed (payment service)

---

## 🚀 Next Steps

1. **Set Vercel environment variables** (most important)
2. **Redeploy Vercel frontend**
3. **Test each service connection:**
   - Registration (auth)
   - Job search (jobs) 
   - Profile loading (user)
   - Sending messages (messaging)
   - Payment flow (payments)
4. **Monitor network requests** in browser dev tools
5. **Check Render service logs** for any CORS issues

Your microservices are ready to connect! The routing is automatic based on URL patterns. 