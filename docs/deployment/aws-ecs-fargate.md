## Backend deployment summary (Vercel frontend + AWS ECS Fargate backend)

### What we decided
- **Frontend**: Host on Vercel.
- **Backend**: Host on **AWS ECS (Fargate)** with an **Application Load Balancer (ALB)**.
- **Why**: The backend is Dockerized microservices (Express/Socket.IO, MongoDB, optional Postgres, Redis, RabbitMQ, S3). Containers with ALB fit WebSockets and always‑on services better than serverless functions.

### High‑level architecture
- One public service: `api-gateway` behind ALB (HTTP/HTTPS)
- Internal services: `auth-service`, `user-service`, `job-service`, `payment-service`, `review-service`, `messaging-service` (reachable via Service Connect or internal networking)
- Managed dependencies:
  - MongoDB: MongoDB Atlas (or self‑managed on AWS if required)
  - Postgres: Amazon RDS for PostgreSQL (if Sequelize paths are used)
  - Redis: Amazon ElastiCache for Redis
  - RabbitMQ: Amazon MQ (RabbitMQ engine)
  - File storage: Amazon S3 (+ optional CloudFront)

### Region and account
- For this project, we used: `eu-north-1` (Stockholm) and account ID `992350137489`.
- Replace these with your own values where needed.

## Deploying api-gateway

### Prerequisites
- Docker Desktop installed and running (`docker --version` succeeds)
- AWS CLI v2 installed and configured (`aws --version` and `aws sts get-caller-identity` succeed)
  - Configure with `aws configure` (Access Key, Secret, default region `eu-north-1`)

### ECR: build, tag, push (PowerShell)
```powershell
$REGION="eu-north-1"
$ACCOUNT_ID="<YOUR_ACCOUNT_ID>"  # Example: 992350137489

# Create ECR repo (idempotent; ignore if it already exists)
aws ecr create-repository --repository-name api-gateway --region $REGION

# Login to ECR
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"

# Build from kelmah-backend root using the gateway Dockerfile
docker build -t api-gateway -f kelmah-backend/api-gateway/Dockerfile kelmah-backend

# Tag and push
docker tag api-gateway:latest "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/api-gateway:latest"
docker push "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/api-gateway:latest"
```

Image URI to use in ECS Task Definition:
```
<ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/api-gateway:latest
# Example used: 992350137489.dkr.ecr.eu-north-1.amazonaws.com/api-gateway:latest
```

### ECS Task Definition (Fargate) – api-gateway
- Family: `kelmah-api-gateway`
- Launch type: `Fargate`, Platform: `LATEST`, OS/Arch: `Linux/x86_64`
- Task size: `0.5 vCPU`, `1 GB` (tune later)
- Execution role: `ecsTaskExecutionRole` (create if missing)
- Task role: none initially (add later if using Secrets Manager/SSM)
- Container:
  - Name: `api-gateway`
  - Image: `992350137489.dkr.ecr.eu-north-1.amazonaws.com/api-gateway:latest`
  - Port mapping: `5000/TCP`, App protocol `HTTP`
  - Health check: `CMD-SHELL` → `curl -f http://localhost:5000/health || exit 1`
  - Logs: `awslogs` (group `/ecs/api-gateway`, stream prefix `ecs`, region `eu-north-1`)
  - Env vars (minimum):
    - `API_GATEWAY_PORT=5000`
    - `NODE_ENV=production`
    - `CORS_ALLOWLIST=https://<your-vercel-app>.vercel.app,https://*.vercel.app`
    - `JWT_SECRET=<strong-secret>`
    - `INTERNAL_API_KEY=<random-string>`
    - Optionally set service URLs now or later:
      - `AUTH_SERVICE_URL`, `USER_SERVICE_URL`, `JOB_SERVICE_URL`, `PAYMENT_SERVICE_URL`, `MESSAGING_SERVICE_URL`, `REVIEW_SERVICE_URL`

Note: The gateway code exits in production if `INTERNAL_API_KEY` is missing.

### ECS Service + ALB (public)
- Cluster: your ECS cluster
- Service name: `api-gateway`, Desired tasks: `1`
- Load balancer: `Application Load Balancer`
  - Target type: `IP`
  - Target group port: `5000`
  - Health check path: `/health`
- Networking:
  - VPC: your VPC
  - Subnets: 2+ public subnets
  - Assign public IP: `Enabled` (so the gateway can reach external services)
  - Security groups:
    - ALB SG: inbound `80` (and later `443`) from `0.0.0.0/0`
    - Task SG: inbound `5000` from ALB SG; egress all
- WebSockets: after ALB is created, set `Idle timeout = 120s` (EC2 → Load Balancers → Attributes)
- HTTPS: add ACM cert and a 443 listener; map your Route 53 DNS (e.g., `api.example.com`)

## Frontend integration
- Preferred: Vercel rewrites proxy to the API domain to avoid CORS
```js
// next.config.js
module.exports = {
  async rewrites() {
    return [{ source: '/api/:path*', destination: 'https://api.example.com/:path*' }];
  },
};
```
- If calling the API directly, configure CORS on the gateway (`CORS_ALLOWLIST`).

## Troubleshooting we hit (and fixes)
- Docker errors `//./pipe/dockerDesktopLinuxEngine`: Docker Desktop not running → start Docker.
- `aws: The term 'aws' is not recognized`: AWS CLI not installed → install AWS CLI v2.
- `Unable to locate credentials`: run `aws configure` or `aws configure sso`.
- `RepositoryAlreadyExistsException`: harmless; the ECR repo already exists.
- `No such image: api-gateway:latest`: rebuild `docker build -t api-gateway ...`.
- `invalid reference format` like `.dkr.ecr..amazonaws.com`: variables empty → set `$ACCOUNT_ID` and `$REGION` again; run commands one line at a time.
- Gateway exits with `API Gateway missing INTERNAL_API_KEY in production`: set `INTERNAL_API_KEY` env var in the task definition (or from Secrets Manager) and redeploy.

## Next steps
- Create ECR repos and ECS task definitions for: `auth-service`, `user-service`, `job-service`, `payment-service`, `review-service`, `messaging-service`.
- Use ECS Service Connect or private services for internal routing from `api-gateway`.
- Move sensitive env vars to AWS Secrets Manager/SSM and attach a task role to read them.
- MongoDB Atlas/RDS/ElastiCache/Amazon MQ provisioning in the same region.
- Consider updating `kelmah-backend/api-gateway/Dockerfile` base to `node:18-alpine` (project requires Node >= 18).

## Quick reference: required env (api-gateway)
- `API_GATEWAY_PORT` (5000)
- `NODE_ENV` (production)
- `JWT_SECRET`
- `INTERNAL_API_KEY`
- `CORS_ALLOWLIST` (comma-separated origins)
- Optional: `AUTH_SERVICE_URL`, `USER_SERVICE_URL`, `JOB_SERVICE_URL`, `PAYMENT_SERVICE_URL`, `MESSAGING_SERVICE_URL`, `REVIEW_SERVICE_URL`


