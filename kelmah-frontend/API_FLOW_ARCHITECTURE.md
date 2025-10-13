# API Flow Architecture

## Overview
This document describes the complete API request flow from frontend pages through services to backend microservices in the Kelmah platform.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React/Vite)                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐         ┌──────────────────┐                │
│  │     Pages        │────────▶│   Services       │                │
│  │  (*.jsx)         │         │  (*Service.js)   │                │
│  └──────────────────┘         └──────────────────┘                │
│                                       │                              │
│                                       ▼                              │
│                          ┌─────────────────────────┐               │
│                          │  Service Clients        │               │
│                          │  (axios.js exports)     │               │
│                          └─────────────────────────┘               │
│                                       │                              │
└───────────────────────────────────────┼──────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     PRODUCTION: Vercel Proxy                         │
│                 /api/* → LocalTunnel → API Gateway                  │
└─────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      API GATEWAY (localhost:5000)                    │
│                       Routing & Authentication                       │
├─────────────────────────────────────────────────────────────────────┤
│   /api/auth/* → Auth Service (5001)                                │
│   /api/users/* → User Service (5002)                                │
│   /api/jobs/* → Job Service (5003)                                  │
│   /api/payments/* → Payment Service (5004)                          │
│   /api/messages/* → Messaging Service (5005)                        │
│   /api/reviews/* → User Service (5002) - reviews module            │
└─────────────────────────────────────────────────────────────────────┘
```

## Request Flow Details

### 1. Page Component Initiates Request

**Example**: User viewing their reviews on `ReviewsPage.jsx`

```javascript
// src/modules/reviews/pages/ReviewsPage.jsx
import reviewService from '../services/reviewService';

const ReviewsPage = () => {
  useEffect(() => {
    const fetchReviews = async () => {
      const stats = await reviewService.getReviewStats(user.id);
      const reviews = await reviewService.getUserReviews(user.id, 1, 20);
      setReviewStats(stats);
      setReviews(reviews);
    };
    fetchReviews();
  }, [user.id]);
};
```

### 2. Service Handles Business Logic

**Example**: `reviewService.js` processes the request

```javascript
// src/modules/reviews/services/reviewService.js
import { userServiceClient } from '../../common/services/axios';

class ReviewService {
  async getReviewStats(userId) {
    try {
      const response = await userServiceClient.get(`/reviews/worker/${userId}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching review stats:', error);
      throw error;
    }
  }

  async getUserReviews(userId, page = 1, limit = 10) {
    try {
      const response = await userServiceClient.get(`/reviews/worker/${userId}`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      throw error;
    }
  }
}
```

### 3. Service Client Handles HTTP Communication

**Example**: `userServiceClient` from `axios.js`

```javascript
// src/modules/common/services/axios.js
import axios from 'axios';
import { getApiBaseUrl } from '../../../config/environment';

const API_BASE_URL = await getApiBaseUrl(); // '/api' in production

// Create user service client
export const userServiceClient = axios.create({
  baseURL: `${API_BASE_URL}/users`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: Attach auth token
userServiceClient.interceptors.request.use((config) => {
  const token = secureStorage.getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Handle errors, refresh tokens
userServiceClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle 401, token refresh, etc.
    return Promise.reject(error);
  }
);
```

### 4. Production Proxy (Vercel)

**Configuration**: `vercel.json`

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://shaggy-snake-43.loca.lt/:path*"
    }
  ]
}
```

**Effect**:
- Frontend calls `/api/reviews/worker/123/stats`
- Vercel rewrites to `https://shaggy-snake-43.loca.lt/reviews/worker/123/stats`
- LocalTunnel forwards to `localhost:5000/reviews/worker/123/stats`

### 5. API Gateway Routes to Microservice

**Configuration**: `kelmah-backend/api-gateway/server.js`

```javascript
const SERVICES = {
  auth: 'http://localhost:5001',
  user: 'http://localhost:5002',
  job: 'http://localhost:5003',
  payment: 'http://localhost:5004',
  messaging: 'http://localhost:5005',
  review: 'http://localhost:5006'
};

// Route /reviews/* to User Service (reviews module)
app.use('/reviews', createProxyMiddleware({
  target: SERVICES.user,
  changeOrigin: true,
  pathRewrite: { '^/reviews': '/reviews' }
}));
```

### 6. Microservice Handles Request

**Example**: User Service reviews controller

```javascript
// kelmah-backend/services/user-service/routes/reviewRoutes.js
router.get('/reviews/worker/:userId/stats', reviewController.getWorkerReviewStats);

// kelmah-backend/services/user-service/controllers/reviewController.js
async getWorkerReviewStats(req, res) {
  const { userId } = req.params;
  
  const stats = await Review.aggregate([
    { $match: { workerId: userId, status: 'approved' } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);
  
  res.json({ data: stats });
}
```

## Service Client Mapping

### Available Service Clients

| Client Name | Target Service | Base URL | Use Cases |
|------------|---------------|----------|-----------|
| `authServiceClient` | Auth Service | `/api/auth` | Login, register, logout, password reset |
| `userServiceClient` | User Service | `/api/users` | Profiles, reviews, ratings, settings |
| `jobServiceClient` | Job Service | `/api/jobs` | Job listings, applications, contracts |
| `paymentServiceClient` | Payment Service | `/api/payments` | Transactions, invoices, earnings |
| `messagingServiceClient` | Messaging Service | `/api/messages` | Chat, notifications, real-time |
| `gatewayClient` | API Gateway | `/api` | Generic requests, health checks |

### Service Client Selection Guide

**Use `userServiceClient` for:**
- User profile operations
- Worker/hirer profiles
- **Reviews and ratings** (reviews module in user service)
- Profile portfolio items
- Profile settings

**Use `jobServiceClient` for:**
- Job postings and listings
- Job applications
- Job contracts
- Job search and filters

**Use `messagingServiceClient` for:**
- Chat messages
- Notifications
- Real-time updates

**Use `authServiceClient` for:**
- Authentication (login, register)
- Password management
- Email verification
- Token refresh

## Domain-to-Service Mapping

### Reviews Domain
```
Frontend: src/modules/reviews/
Services: reviewService.js
Client: userServiceClient (NOT reviewServiceClient!)
Backend: User Service → reviews module
Routes: /api/users/reviews/* or /api/reviews/* (gateway routing)
```

### Jobs Domain
```
Frontend: src/modules/jobs/
Services: jobsService.js
Client: jobServiceClient
Backend: Job Service
Routes: /api/jobs/*
```

### Worker Domain
```
Frontend: src/modules/worker/
Services: 
  - portfolioService.js (userServiceClient)
  - applicationsService.js (jobServiceClient)
  - earningsService.js (paymentServiceClient)
  - certificateService.js (userServiceClient)
Client: Varies by feature
Backend: Multiple services
Routes: Varies
```

### Portfolio Management
```
Frontend: src/modules/worker/services/portfolioService.js
Client: userServiceClient
Backend: User Service → profile/portfolio module
Routes: /api/users/profile/portfolio/*
```

## Error Handling Flow

### Request Errors

```javascript
try {
  const response = await userServiceClient.get('/reviews/worker/123');
  return response.data;
} catch (error) {
  // 1. Service logs error
  console.error('Error fetching reviews:', error);
  
  // 2. Error bubbles to page component
  throw error;
}
```

### Page Component Error Handling

```javascript
const fetchReviews = async () => {
  try {
    const data = await reviewService.getUserReviews(userId);
    setReviews(data.reviews);
  } catch (error) {
    // 3. Page displays user-friendly error
    setError('Failed to load reviews. Please try again.');
    
    // 4. Optional: Send to error tracking
    errorTracker.captureException(error);
  }
};
```

### Interceptor Error Handling

```javascript
// Response interceptor in axios.js
userServiceClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle 401: Redirect to login
    if (error.response?.status === 401) {
      secureStorage.removeAuthToken();
      window.location.href = '/login';
    }
    
    // Handle 403: Show permission error
    if (error.response?.status === 403) {
      toast.error('You do not have permission for this action');
    }
    
    // Handle 500: Show server error
    if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    }
    
    return Promise.reject(error);
  }
);
```

## Authentication Flow

### Token Management

```javascript
// 1. Login request
const response = await authServiceClient.post('/login', credentials);
const { token, user } = response.data;

// 2. Store token securely
secureStorage.setAuthToken(token);

// 3. Token automatically attached to subsequent requests
// (via axios request interceptor)
```

### Protected Requests

```javascript
// Token automatically included in headers
const response = await userServiceClient.get('/reviews/worker/123');

// Interceptor adds:
// headers: { Authorization: 'Bearer eyJhbGc...' }
```

### Token Refresh

```javascript
// When 401 error occurs with expired token
userServiceClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        // Attempt token refresh
        const refreshToken = secureStorage.getRefreshToken();
        const response = await authServiceClient.post('/refresh', { refreshToken });
        
        // Update stored token
        secureStorage.setAuthToken(response.data.token);
        
        // Retry original request with new token
        error.config.headers.Authorization = `Bearer ${response.data.token}`;
        return axios.request(error.config);
      } catch (refreshError) {
        // Refresh failed: Redirect to login
        secureStorage.clearAuth();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

## Development vs Production

### Development Mode
```
Frontend (localhost:3000)
  ↓
Direct service URLs (localhost:5001, 5002, etc.)
  ↓
Backend microservices (localhost:5001-5006)
```

### Production Mode
```
Frontend (vercel.app)
  ↓
/api/* requests
  ↓
Vercel rewrites to LocalTunnel
  ↓
LocalTunnel forwards to localhost:5000
  ↓
API Gateway (localhost:5000)
  ↓
Backend microservices (localhost:5001-5006)
```

## Best Practices

### 1. Always Use Service Clients
```javascript
// ✅ CORRECT
import { userServiceClient } from '../../common/services/axios';
const response = await userServiceClient.get('/reviews/worker/123');

// ❌ WRONG
import axios from 'axios';
const response = await axios.get('http://localhost:5002/reviews/worker/123');
```

### 2. No /api Prefix in Service Methods
```javascript
// ✅ CORRECT (baseURL='/api/users' provides /api prefix)
const response = await userServiceClient.get('/reviews/worker/123');
// Results in: /api/users/reviews/worker/123

// ❌ WRONG (causes /api/api/ duplication)
const response = await userServiceClient.get('/api/reviews/worker/123');
// Results in: /api/users/api/reviews/worker/123
```

### 3. Consistent Error Handling
```javascript
// ✅ CORRECT
async getUserReviews(userId) {
  try {
    const response = await userServiceClient.get(`/reviews/worker/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    throw error; // Let page component handle UI
  }
}
```

### 4. Use Appropriate Service Client
```javascript
// ✅ CORRECT - Reviews use userServiceClient
import { userServiceClient } from '../../common/services/axios';
await userServiceClient.get('/reviews/worker/123');

// ❌ WRONG - reviewServiceClient doesn't exist
import { reviewServiceClient } from '../../common/services/axios';
await reviewServiceClient.get('/reviews/worker/123');
```

### 5. Modular Service Organization
```javascript
// ✅ CORRECT - Service in domain module
import reviewService from '../services/reviewService';

// ❌ WRONG - Service in root folder
import reviewsApi from '../../../services/reviewsApi';
```

## Debugging Guide

### Check Service Health
```bash
# Check all microservices
curl http://localhost:5000/health/aggregate

# Check specific service
curl http://localhost:5002/health
```

### Test API Flow
```bash
# 1. Test service directly (development)
curl http://localhost:5002/reviews/worker/123 -H "Authorization: Bearer TOKEN"

# 2. Test via gateway
curl http://localhost:5000/reviews/worker/123 -H "Authorization: Bearer TOKEN"

# 3. Test via LocalTunnel (production simulation)
curl https://shaggy-snake-43.loca.lt/reviews/worker/123 -H "Authorization: Bearer TOKEN"
```

### Common Issues

**404 Not Found:**
- Check route exists in microservice
- Verify API Gateway routing configuration
- Confirm service is running (`/health` endpoint)

**401 Unauthorized:**
- Verify token is attached to request
- Check token hasn't expired
- Confirm user has correct permissions

**CORS Errors:**
- API Gateway should handle CORS
- Check origin is allowed in gateway config
- Verify preflight OPTIONS requests work

**Double /api/ in URL:**
- Remove `/api` prefix from service method endpoints
- Service client `baseURL` already includes `/api`

## Questions?

See also:
- `SERVICE_NAMING_CONVENTION.md` - Service file naming standards
- `src/modules/common/services/axios.js` - Service client implementations
- `FRONTEND_API_FLOW_AUDIT_COMPLETE.md` - Audit findings and fixes
- `kelmah-backend/api-gateway/server.js` - Gateway routing configuration
