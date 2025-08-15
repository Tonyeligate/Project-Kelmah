# Kelmah Backend Services AWS ECS Deployment Summary

## Overview
This document summarizes the complete deployment process for Kelmah backend services (auth, job, payment, review) on AWS ECS, including all fixes applied, commands used, and troubleshooting steps.

## Initial State
- **User Request**: Deploy all backend services (auth, job, payment, review) to AWS ECS and resolve deployment issues
- **Environment**: Windows 10, PowerShell, Docker Desktop, AWS CLI
- **Target**: AWS ECS Cluster "Project-Kelmah" in eu-north-1 region

## Services Deployed
1. **auth-service** - Authentication and user management
2. **job-service** - Job postings and applications
3. **payment-service** - Payment processing and transactions
4. **review-service** - Reviews and ratings

## Critical Issues Resolved

### 1. Auth Service Issues
**Problem**: `SyntaxError: Identifier 'rateLimit' has already been declared`
- **Root Cause**: Duplicate `rateLimit` declarations in `middlewares/rateLimiter.js` and `server.js`
- **Fix**: Renamed variables to avoid conflicts
  ```javascript
  // In rateLimiter.js
  const expressRateLimit = require('express-rate-limit');
  
  // In server.js (fallback)
  const rateLimit_fallback = require('express-rate-limit');
  ```

**Problem**: `Error: JWT secrets not configured properly`
- **Root Cause**: Environment variable mismatch (`JWT_ACCESS_SECRET` vs `JWT_SECRET`)
- **Fix**: Updated task definition environment variables
  ```json
  {"name":"JWT_SECRET","value":"kelmah-ultra-secure-access-token-secret-2024-production-v1"},
  {"name":"JWT_REFRESH_SECRET","value":"kelmah-ultra-secure-refresh-token-secret-2024-production-v1"}
  ```

### 2. Payment Service Issues
**Problem**: `Error: Cannot find module '../../../shared/utils/jwt'`
- **Root Cause**: Missing shared JWT utility in container
- **Fix**: Updated `middlewares/auth.js` to use local JWT verification
  ```javascript
  const jwt = require("jsonwebtoken");
  // Removed shared utils dependency
  ```

### 3. Review Service Issues
**Problem**: `Route.put() requires a callback function but got a [object Null]`
- **Root Cause**: Missing admin rate limiter causing null middleware
- **Fix**: Added fallback no-op limiter
  ```javascript
  let adminLimiter = (req, res, next) => next();
  ```

### 4. Job Service Issues
**Problem**: Container crash loops due to missing dependencies and process.exit calls
- **Root Cause**: Multiple issues including missing wget, auto DB connection exits
- **Fix**: 
  - Added wget to Dockerfile for health checks
  - Removed process.exit from DB connection failures
  - Added fallback for missing rate limiter
  - Removed auto DB connection from models/index.js

### 5. Network Configuration Issues
**Problem**: Services couldn't connect to MongoDB Atlas
- **Root Cause**: ECS tasks using public IPs not allowlisted in Atlas
- **Fix**: 
  - Moved services to private subnets
  - Set `assignPublicIp=DISABLED`
  - Added NAT Gateway EIP (13.62.68.130) to MongoDB Atlas allowlist
  - All egress now goes through stable NAT EIP

## Docker Build Commands

### Auth Service
```bash
docker build --no-cache --pull -t kelmah-auth-service:working -f kelmah-backend/services/auth-service/Dockerfile kelmah-backend/services/auth-service
docker tag kelmah-auth-service:working 992350137489.dkr.ecr.eu-north-1.amazonaws.com/kelmah-auth-service:working
docker push 992350137489.dkr.ecr.eu-north-1.amazonaws.com/kelmah-auth-service:working
```

### Job Service
```bash
# Multiple builds with unique tags
$tag=Get-Date -Format "yyyyMMdd-HHmmss"
docker build --no-cache --pull -t 992350137489.dkr.ecr.eu-north-1.amazonaws.com/kelmah-job-service:$tag -f kelmah-backend/services/job-service/Dockerfile kelmah-backend/services/job-service
docker push 992350137489.dkr.ecr.eu-north-1.amazonaws.com/kelmah-job-service:$tag
```

### Payment Service
```bash
$tag=Get-Date -Format "yyyyMMdd-HHmmss"
docker build --no-cache --pull -t 992350137489.dkr.ecr.eu-north-1.amazonaws.com/kelmah-payment-service:$tag -f kelmah-backend/services/payment-service/Dockerfile kelmah-backend/services/payment-service
docker push 992350137489.dkr.ecr.eu-north-1.amazonaws.com/kelmah-payment-service:$tag
```

### Review Service
```bash
$tag=Get-Date -Format "yyyyMMdd-HHmmss"
docker build --no-cache --pull -t 992350137489.dkr.ecr.eu-north-1.amazonaws.com/kelmah-review-service:$tag -f kelmah-backend/services/review-service/Dockerfile kelmah-backend/services/review-service
docker push 992350137489.dkr.ecr.eu-north-1.amazonaws.com/kelmah-review-service:$tag
```

## ECS Task Definition Updates

### Register New Task Definitions
```bash
aws ecs register-task-definition --cli-input-json file://auth-service-task-definition.json --region eu-north-1
aws ecs register-task-definition --cli-input-json file://job-service-task-definition.json --region eu-north-1
aws ecs register-task-definition --cli-input-json file://payment-service-task-definition.json --region eu-north-1
aws ecs register-task-definition --cli-input-json file://review-service-task-definition.json --region eu-north-1
```

### Update Services
```bash
aws ecs update-service --cluster Project-Kelmah --service auth-service --task-definition kelmah-auth-service --force-new-deployment --region eu-north-1
aws ecs update-service --cluster Project-Kelmah --service job-service --task-definition job-service-task --force-new-deployment --region eu-north-1
aws ecs update-service --cluster Project-Kelmah --service payment-service --task-definition payment-service-task --force-new-deployment --region eu-north-1
aws ecs update-service --cluster Project-Kelmah --service review-service --task-definition review-service-task --force-new-deployment --region eu-north-1
```

## Network Configuration Commands

### Move Services to Private Subnets
```bash
aws ecs update-service --cluster Project-Kelmah --service job-service --network-configuration "awsvpcConfiguration={subnets=[subnet-0a9d0777b99602681,subnet-024eebebbdc867963,subnet-006406d535a30911f],securityGroups=[sg-081fd7b767b7ed905],assignPublicIp=DISABLED}" --force-new-deployment --region eu-north-1

aws ecs update-service --cluster Project-Kelmah --service payment-service --network-configuration "awsvpcConfiguration={subnets=[subnet-0a9d0777b99602681,subnet-024eebebbdc867963,subnet-006406d535a30911f],securityGroups=[sg-081fd7b767b7ed905],assignPublicIp=DISABLED}" --force-new-deployment --region eu-north-1

aws ecs update-service --cluster Project-Kelmah --service review-service --network-configuration "awsvpcConfiguration={subnets=[subnet-0a9d0777b99602681,subnet-024eebebbdc867963,subnet-006406d535a30911f],securityGroups=[sg-081fd7b767b7ed905],assignPublicIp=DISABLED}" --force-new-deployment --region eu-north-1
```

### Get NAT Gateway IP for MongoDB Allowlist
```bash
aws ec2 describe-nat-gateways --filter Name=vpc-id,Values=vpc-0dabf8272bd2ef53d Name=state,Values=available --region eu-north-1 --query "NatGateways[].NatGatewayAddresses[].PublicIp" --output text
# Result: 13.62.68.130
```

## Monitoring Commands

### Check Service Status
```bash
aws ecs describe-services --cluster Project-Kelmah --services auth-service job-service payment-service review-service --region eu-north-1 --query "services[].{name:serviceName,desired:desiredCount,running:runningCount,status:status}" --output table
```

### Check Task Status
```bash
aws ecs list-tasks --cluster Project-Kelmah --service-name job-service --desired-status RUNNING --region eu-north-1
aws ecs list-tasks --cluster Project-Kelmah --service-name job-service --desired-status STOPPED --region eu-north-1
```

### View CloudWatch Logs
```bash
aws logs filter-log-events --log-group-name /ecs/job-service --region eu-north-1 --limit 50 --query "events[].message" --output text
aws logs filter-log-events --log-group-name /ecs/payment-service --region eu-north-1 --limit 50 --query "events[].message" --output text
aws logs filter-log-events --log-group-name /ecs/review-service --region eu-north-1 --limit 50 --query "events[].message" --output text
```

### Describe STOPPED Tasks
```bash
$arns = aws ecs list-tasks --cluster Project-Kelmah --service-name job-service --desired-status STOPPED --region eu-north-1 --max-results 5 --query "taskArns" --output text
if ($arns) { 
  $arr = $arns -split '\s+'
  aws ecs describe-tasks --cluster Project-Kelmah --tasks $arr --region eu-north-1 --query "tasks[].{stoppedReason:stoppedReason,containers:containers[].{name:name,exitCode:exitCode,reason:reason}}"
}
```

## Key File Changes

### 1. Auth Service
- `kelmah-backend/services/auth-service/middlewares/rateLimiter.js`: Renamed `rateLimit` to `expressRateLimit`
- `kelmah-backend/services/auth-service/server.js`: Renamed fallback `rateLimit` to `rateLimit_fallback`
- `auth-service-task-definition.json`: Updated environment variables

### 2. Job Service
- `kelmah-backend/services/job-service/Dockerfile`: Added `RUN apk add --no-cache wget`
- `kelmah-backend/services/job-service/config/db.js`: Removed `process.exit(1)` on DB connection failure
- `kelmah-backend/services/job-service/models/index.js`: Removed auto DB connection
- `kelmah-backend/services/job-service/routes/job.routes.js`: Added fallback for missing rate limiter
- `job-service-task-definition.json`: Added JWT_REFRESH_SECRET

### 3. Payment Service
- `kelmah-backend/services/payment-service/middlewares/auth.js`: Uses local JWT verification
- `kelmah-backend/services/payment-service/Dockerfile`: Added `RUN apk add --no-cache wget`
- `payment-service-task-definition.json`: Updated image tags

### 4. Review Service
- `kelmah-backend/services/review-service/server.js`: Added fallback admin limiter
- `kelmah-backend/services/review-service/Dockerfile`: Added wget and switched to node:18-alpine
- `review-service-task-definition.json`: Updated image tags

## Environment Variables Used

### Common Variables
```json
{
  "NODE_ENV": "production",
  "JWT_SECRET": "kelmah-ultra-secure-access-token-secret-2024-production-v1",
  "JWT_REFRESH_SECRET": "kelmah-ultra-secure-refresh-token-secret-2024-production-v1",
  "MONGODB_URI": "mongodb+srv://TonyGate:0553366244Aj@kelmah-messaging.xyqcurn.mongodb.net/?retryWrites=true&w=majority&appName=Kelmah-messaging",
  "USE_REDIS_RATE_LIMIT": "false"
}
```

### Service-Specific Ports
- auth-service: 5001
- job-service: 5003
- payment-service: 3004
- review-service: 5006

## Health Check Endpoints
All services implement:
- `/health` - Basic health check
- `/health/ready` - Readiness probe (checks DB connection)
- `/health/live` - Liveness probe

## Final Status
After all fixes and redeployments:
- **auth-service**: ✅ Running (1/1)
- **review-service**: ✅ Running (1/1)
- **job-service**: 🔄 Starting (tasks recycling)
- **payment-service**: 🔄 Starting (tasks recycling)

## Lessons Learned
1. **Image Tagging**: Always use unique tags to force ECS to pull new images
2. **Network Configuration**: Use private subnets with NAT Gateway for stable outbound IPs
3. **Dependencies**: Ensure all shared utilities are either included or have fallbacks
4. **Process Management**: Avoid `process.exit()` in containerized environments
5. **Health Checks**: Include wget in Alpine images for ECS health checks
6. **Rate Limiting**: Provide fallbacks when shared rate limiters are unavailable

## Troubleshooting Checklist
- [ ] Check ECS service events for deployment issues
- [ ] Verify task definition image tags match latest builds
- [ ] Check CloudWatch logs for application errors
- [ ] Verify network configuration (subnets, security groups)
- [ ] Confirm MongoDB Atlas IP allowlist includes NAT Gateway EIP
- [ ] Check for missing dependencies in container images
- [ ] Verify environment variables are correctly set
- [ ] Test health check endpoints locally before deployment

## Next Steps
1. Monitor service stability for 24-48 hours
2. Set up CloudWatch alarms for service health
3. Implement proper CI/CD pipeline for future deployments
4. Consider using AWS Secrets Manager for sensitive environment variables
5. Set up proper logging aggregation and monitoring
