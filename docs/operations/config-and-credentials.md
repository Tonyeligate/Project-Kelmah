## Kelmah – Configuration and Credentials Guide

This document summarizes configuration variables, where to store them, and how services discover each other after internalization.

### Global
- Region: eu-north-1
- Cluster: Project-Kelmah
- VPC CIDR: 172.31.0.0/16
- NAT Egress IP (Atlas allowlist): 13.62.68.130

### API Gateway
- Task Def: `api-gateway-task:<REV>`
- Essential envs:
  - NODE_ENV=production
  - API_GATEWAY_PORT=3000
  - JWT_SECRET (secret)
  - JWT_REFRESH_SECRET (secret)
  - INTERNAL_API_KEY (secret)
  - CORS_ALLOWLIST, FRONTEND_URL
  - AUTH_SERVICE_URL, USER_SERVICE_URL, JOB_SERVICE_URL, PAYMENT_SERVICE_URL, MESSAGING_SERVICE_URL, REVIEW_SERVICE_URL → internal NLB DNS with ports

Recommended storage: AWS SSM Parameter Store (SecureString) or Secrets Manager. Reference via task definition secrets.

### Auth Service
- Task Def: `kelmah-auth-service:<REV>`
- Ports: 5001
- Env:
  - NODE_ENV=production
  - PORT=5001
  - MONGODB_URI (secret)
  - JWT_SECRET, JWT_REFRESH_SECRET (secret)
  - SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS (secrets)
  - Optional: REDIS_URL, ENABLE_RATE_LIMITING=true

### User Service
- Task Def: `user-service-task:<REV>`
- Port: 3002
- Env: MONGODB_URI, JWT_SECRET, NODE_ENV, PORT

### Job Service
- Task Def: `job-service-task:<REV>`
- Port: 5003
- Env: MONGODB_URI, JWT_SECRET, NODE_ENV, PORT

### Payment Service
- Task Def: `payment-service-task:<REV>`
- Port: 3004
- Env: MONGODB_URI, JWT_SECRET, NODE_ENV, PORT, provider keys if used (secrets)

### Messaging Service
- Task Def: `messaging-service-task:<REV>`
- Port: 3003
- Env: MONGODB_URI, JWT_SECRET, NODE_ENV, PORT

### Review Service
- Task Def: `review-service-task:<REV>`
- Port: 5006
- Env: MONGODB_URI, JWT_SECRET, NODE_ENV, PORT

### Service Discovery
- API Gateway uses explicit env URLs pointing to the internal NLB DNS with per-service ports.
- Alternative: AWS Cloud Map for service discovery (not enabled here).

### Secrets Management
- Use AWS Secrets Manager or SSM Parameter Store for:
  - JWT_SECRET, JWT_REFRESH_SECRET
  - SMTP_* credentials
  - MONGODB_URI
  - INTERNAL_API_KEY
- Grant access via task roles and reference parameters in task definitions (avoid plaintext in repo).

### Observability
- CloudWatch Logs groups:
  - `/ecs/api-gateway`, `/ecs/<service>`
- Health endpoints: `/health` on each service; gateway aggregation at `/api/health/aggregate`

### Rollouts / Rollbacks
- Roll out: register task def, update ECS service with new revision, force new deployment, wait services-stable.
- Roll back: use prior task def revision, update service, wait services-stable.


