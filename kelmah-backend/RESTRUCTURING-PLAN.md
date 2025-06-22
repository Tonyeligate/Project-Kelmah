# Kelmah Backend Restructuring Plan

## Overview

This document outlines the restructuring of the Kelmah backend from a monolithic architecture to a domain-driven design pattern with microservices. The goal is to improve maintainability, scalability, and separation of concerns.

## Current Progress

### Directory Structure Creation
- ✅ Created API Gateway structure
- ✅ Created Auth Service structure
- ✅ Created User Service structure
- ✅ Created Job Service structure
- ✅ Created Payment Service structure
- ✅ Created Messaging Service structure

### Service Implementation
- ✅ Created server.js files for each service
- ✅ Moved User model to user-service
- ✅ Moved Job model to job-service
- ✅ Moved RefreshToken model to auth-service
- ✅ Created proxy files for API Gateway

## Next Steps

### 1. Complete Model Migration
- [ ] Create Application model in job-service
- [ ] Create Message model in messaging-service
- [ ] Create Payment model in payment-service
- [ ] Create Contract model in job-service
- [ ] Update model associations in each service

### 2. Complete API Gateway Implementation
- [ ] Implement auth.middleware.js for JWT verification
- [ ] Implement rate-limiter.js for request rate limiting
- [ ] Implement proxy routing in each proxy file
- [ ] Complete server.js for the gateway

### 3. Update Service Implementations
- [ ] Complete auth-service routes and controllers
- [ ] Complete user-service routes and controllers
- [ ] Complete job-service routes and controllers
- [ ] Complete payment-service routes and controllers
- [ ] Complete messaging-service routes and controllers

### 4. Implement WebSocket Support
- [ ] Set up socket handlers in messaging-service
- [ ] Configure real-time messaging

### 5. Update Configuration
- [ ] Create environment-specific configurations
- [ ] Set up service discovery mechanism
- [ ] Configure database connections for each service

### 6. Testing
- [ ] Test each service individually
- [ ] Test API Gateway routing
- [ ] Test end-to-end functionality

## Architecture Overview

```
kelmah-backend/
├── api-gateway/           # API Gateway service
│   ├── middlewares/       # API Gateway specific middlewares
│   ├── proxy/             # Service proxying logic
│   ├── routes/            # Route definitions
│   ├── utils/             # Utility functions
│   └── server.js          # API Gateway entry point
├── services/              # Domain-specific services
│   ├── auth-service/      # Authentication service
│   │   ├── controllers/   # Request handlers
│   │   ├── middlewares/   # Service-specific middlewares
│   │   ├── models/        # Data models
│   │   ├── routes/        # Route definitions
│   │   ├── services/      # Business logic
│   │   ├── utils/         # Utility functions
│   │   └── server.js      # Service entry point
│   ├── user-service/      # User management service
│   ├── job-service/       # Job management service
│   ├── payment-service/   # Payment processing service
│   ├── messaging-service/ # Real-time messaging service
│   │   └── socket/        # WebSocket handlers
│   └── ...                # Other services
├── src/                   # Legacy code (being migrated to services)
├── index.js               # Main orchestration script
└── server.js              # Legacy server entry point
```

## Implementation Timeline

1. **Phase 1: Structure Setup** (COMPLETED)
   - Create directory structure
   - Set up basic server files
   - Move initial models

2. **Phase 2: Service Implementation** (IN PROGRESS)
   - Complete model migration
   - Implement service-specific logic
   - Set up API Gateway routing

3. **Phase 3: Integration and Testing**
   - Connect services together
   - Test end-to-end functionality
   - Optimize performance

4. **Phase 4: Deployment and Monitoring**
   - Set up CI/CD pipeline
   - Configure monitoring and logging
   - Deploy to production


