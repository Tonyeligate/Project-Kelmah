---
description: "Use when designing, reviewing, or debugging REST API endpoints, route definitions, gateway proxy configuration, or HTTP response handling. Covers RESTful naming, route ordering, status codes, and response envelope standards."
---
# Kelmah API Design Standards

## Resource Naming

- Plural nouns for collections: `/jobs`, `/users`, `/applications`
- Hyphens for multi-word: `/worker-profiles`, `/job-categories`
- Nested for relationships: `/jobs/:jobId/applications`
- Never verbs in URLs — HTTP methods express the action

## HTTP Methods

| Method | Purpose | Example |
|--------|---------|---------|
| GET | Retrieve (never modify) | `GET /api/jobs`, `GET /api/jobs/:id` |
| POST | Create resource | `POST /api/jobs`, `POST /api/jobs/:id/apply` |
| PUT | Full replace | `PUT /api/jobs/:id` |
| PATCH | Partial update | `PATCH /api/jobs/:id` |
| DELETE | Remove | `DELETE /api/jobs/:id` |

## Status Codes

| Code | When |
|------|------|
| 200 | Successful GET, PUT, PATCH, DELETE |
| 201 | Successful POST (created) |
| 400 | Invalid input / validation |
| 401 | Missing or invalid auth |
| 403 | Valid auth, insufficient permissions |
| 404 | Resource not found |
| 409 | Conflict (duplicate) |
| 422 | Valid syntax, semantic error |
| 500 | Server error |
| 503 | Service unavailable |

## Response Envelope

```javascript
// Success
{ success: true, data: { ... }, message: "Optional" }

// Success with pagination
{ success: true, data: [...], meta: { total: 150, page: 1, limit: 20 } }

// Error
{ success: false, error: { message: "...", code: "ERROR_CODE", details: {} } }
```

## Route Ordering — CRITICAL

Specific literals MUST come before parameterized routes:

```javascript
router.get('/my-jobs', authenticate, getMyJobs);
router.get('/featured', getFeaturedJobs);
router.get('/search', searchJobs);
router.get('/:id', getJobById);  // LAST — catches remaining
```

## Query Parameters

- Filter: `?category=plumbing&status=active`
- Paginate: `?page=2&limit=20`
- Sort: `?sort=createdAt&order=desc`
- Search: `?search=carpenter&location=Accra`

## Gateway Routing

All external calls go through API Gateway (`/api/*`). Gateway proxies to services:

```javascript
const SERVICES = {
  auth: 'http://localhost:5001',
  user: 'http://localhost:5002',
  job:  'http://localhost:5003',
  payment: 'http://localhost:5004',
  messaging: 'http://localhost:5005',
  review: 'http://localhost:5006'
};
```

## Auth Middleware Patterns

```javascript
// Protected: gateway forwards authenticated user
router.get('/me/profile', verifyGatewayRequest, getMyProfile);

// Role-restricted
router.post('/jobs', authenticate, requireRole('hirer'), createJob);

// Public: no middleware
router.get('/jobs', getPublicJobs);
```

## Checklist for API Route Changes

- [ ] Routes ordered specific → generic (literals before `:id`)
- [ ] Auth middleware on protected endpoints
- [ ] `verifyGatewayRequest` on endpoints expecting `req.user`
- [ ] Response follows success/error envelope
- [ ] Correct HTTP status codes
- [ ] Gateway proxy config tested via `/api/*`
