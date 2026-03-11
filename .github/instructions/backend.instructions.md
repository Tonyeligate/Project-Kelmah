---
applyTo: "kelmah-backend/**"
---
# Kelmah Backend Patterns

## Service Map

| Service | Port | Directory |
|---------|------|-----------|
| API Gateway | 5000 | `api-gateway/` |
| Auth | 5001 | `services/auth-service/` |
| User | 5002 | `services/user-service/` |
| Job | 5003 | `services/job-service/` |
| Payment | 5004 | `services/payment-service/` |
| Messaging | 5005 | `services/messaging-service/` |
| Review | 5006 | `services/review-service/` |

## Service Structure

```
services/[service-name]/
├── server.js          # Express entry point
├── routes/            # Route definitions
├── controllers/       # Request handlers
├── models/index.js    # Imports from shared models
├── services/          # Business logic
├── middleware/         # Service-specific middleware
├── utils/             # Validation, logging
└── tests/             # Jest test suites
```

## Model Imports — MANDATORY

```javascript
// ✅ ALWAYS: import from service model index
const { User, Job, Application } = require('../models');

// ❌ NEVER: bypass the index
const User = require('../models/User');
// ❌ NEVER: reach into shared directly from controllers
const User = require('../../../shared/models/User');
```

Service `models/index.js` re-exports from `shared/models/`. Shared models: User, Job, Application, QuickJob, WorkerProfile. Service-local models (Conversation, Message, Notification, etc.) stay in the service.

## Shared Resources

```javascript
// ✅ Shared middleware
require('../../shared/middlewares/rateLimiter');
// ✅ Shared utils
require('../../shared/utils/logger');
// ❌ NEVER cross-service imports
require('../../auth-service/middlewares/auth');
```

## Database — MongoDB Only

- 100% Mongoose operations: `Model.findById()`, `Model.create()`, `Model.aggregate()`
- Zero SQL or Sequelize code permitted anywhere
- Connection: MongoDB Atlas cluster (`kelmah_platform` database)

## Authentication Flow

1. Frontend sends JWT in `Authorization: Bearer <token>` header
2. API Gateway validates token, attaches `req.user`, proxies to service
3. Services use `verifyGatewayRequest` middleware to trust forwarded `req.user`
4. Never re-validate JWT inside microservices — trust the gateway

```javascript
// Service route expecting authenticated user:
router.get('/me/profile', verifyGatewayRequest, getMyProfile);
```

## Route Ordering — CRITICAL

Routes must go from most specific to least specific:

```javascript
// ✅ CORRECT: literals before params
router.get('/my-jobs', authenticate, getMyJobs);
router.get('/featured', getFeaturedJobs);
router.get('/search', searchJobs);
router.get('/:id/applications', authenticate, getJobApps);
router.get('/:id', getJobById);  // param route LAST

// ❌ WRONG: /:id shadows everything after it
router.get('/:id', getJobById);
router.get('/my-jobs', authenticate, getMyJobs);  // never reached
```

## Response Envelope

```javascript
// Success (200, 201)
{ success: true, data: { /* resource */ }, message: "..." }

// Error (4xx, 5xx)
{ success: false, error: { message: "...", code: "ERROR_CODE" } }
```

## Testing

```bash
# Run service tests
npx jest --runTestsByPath services/[service]/tests/[test].js --runInBand

# Run all backend tests
npm run test:backend
```

Each service has its own `tests/` directory with setup fixtures. Use `--runInBand` for tests that share database state.

## Gateway Proxy Pattern

The API Gateway proxies all `/api/*` routes to services. Gateway handles: CORS, rate limiting, authentication, body rehydration for proxied requests. Services never handle CORS or JWT validation directly.

## Health Endpoints

All services expose `/health`, `/health/ready`, `/health/live`. Gateway aggregates at `/api/health/aggregate`.
