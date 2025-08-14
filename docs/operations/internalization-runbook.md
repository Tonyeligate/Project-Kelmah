## Kelmah Platform – ECS Internalization Runbook

This runbook captures what was done, and how to repeat it, to stabilize deployments and internalize service-to-service traffic over private networking.

### Goals
- Fix failing ECS pull (invalid ECR tag)
- Set correct database envs for services
- Create private subnets + NAT egress with a single static EIP (for Atlas allowlist)
- Add internal Network Load Balancer (NLB) per-service listeners
- Deploy private ECS services attached to NLB target groups
- Point API Gateway to internal NLB URLs; scale down legacy public services

### Current environment (eu-north-1)
- Account: 992350137489
- Cluster: Project-Kelmah
- VPC: vpc-0dabf8272bd2ef53d (172.31.0.0/16)
- Private subnets: subnet-006406d535a30911f, subnet-024eebebbdc867963, subnet-0a9d0777b99602681
- NAT public EIP (whitelist in Atlas): 13.62.68.130
- Services SG: sg-081fd7b767b7ed905
- Internal NLB DNS: kelmah-internal-svcs-250d7eb165a8b7d3.elb.eu-north-1.amazonaws.com

### Service ports
- auth: 5001
- user: 3002
- job: 5003
- payment: 3004
- messaging: 3003
- review: 5006

### 1) Fix ECR image tag (auth)
- Update task definitions to use existing ECR tag `project-fix`.
- Register new task def revision and force a new deployment for `auth-service`.

### 2) Set database envs
- Ensure `MONGODB_URI` (and related) are present in each service task definition.
- Prefer Secrets Manager/SSM for secrets (see credentials doc). Avoid plaintext in JSON.

### 3) Private networking + NAT
- Create/confirm three private subnets across AZs.
- Create NAT Gateway in a public subnet; route private subnets' default route to the NAT.
- Add NAT EIP 13.62.68.130 to Atlas IP Access List.

### 4) Internal NLB + target groups (TCP)
- One NLB across the private subnets.
- Create TCP Target Groups: `kelmah-auth-tg-tcp` (5001), `kelmah-user-tg` (3002), `kelmah-job-tg` (5003), `kelmah-payment-tg` (3004), `kelmah-messaging-tg` (3003), `kelmah-review-tg` (5006).
- Create NLB listeners mapping each port → its TG.

### 5) Security Group
- Open intra-VPC ingress on ports 5001, 3002, 5003, 3004, 3003, 5006 in `sg-081fd7b767b7ed905` (CIDR 172.31.0.0/16).

### 6) NLB-attached ECS services (private)
- Create ECS services (suffix `-nlb`) using the private subnets, `assignPublicIp=DISABLED`, and the corresponding target group mapping.
- Example (auth):
  - service: `auth-service-nlb`
  - taskDefinition: `kelmah-auth-service:<REV>`
  - loadBalancers: TG=`kelmah-auth-tg-tcp`, container=`auth-service`, port=5001

### 7) API Gateway → internal URLs
- Update API Gateway task definition env to point to NLB DNS with per-service ports, e.g.:
  - AUTH_SERVICE_URL: http://kelmah-internal-svcs-...elb.eu-north-1.amazonaws.com:5001
  - USER_SERVICE_URL: http://kelmah-internal-svcs-...:3002
  - JOB_SERVICE_URL: http://kelmah-internal-svcs-...:5003
  - PAYMENT_SERVICE_URL: http://kelmah-internal-svcs-...:3004
  - MESSAGING_SERVICE_URL: http://kelmah-internal-svcs-...:3003
  - REVIEW_SERVICE_URL: http://kelmah-internal-svcs-...:5006
- Register new gateway task def revision; update the gateway ECS service.

### 8) Cutover
- Wait for the `*-nlb` services to stabilize (targets healthy), then scale down the legacy public services to desiredCount=0.

### 9) Verify
- Gateway: `/health`, `/api/health`, `/api/health/aggregate`
- CloudWatch log groups: `/ecs/api-gateway`, `/ecs/<service>`
- Target group health = healthy

### 10) Rollback
- Scale up legacy services to desiredCount=1 and point gateway env back to public URLs; redeploy gateway.

### Notes
- Move all secrets to AWS Secrets Manager or SSM Parameter Store.
- Consider placing an internet-facing ALB in front of the API Gateway with HTTPS.


### Architecture rationale and design choices

- Why NLB (TCP) internally:
  - We only need L4 forwarding to container ports; HTTP routing and auth live in the API Gateway.
  - NLB scales well and supports static IPs per AZ (not used here, but available).
  - Simpler health checks (TCP/HTTP) with minimal overhead.
- Why private subnets + NAT:
  - Services should not receive public IPs. Outbound internet (Atlas, SMTP, etc.) goes via a single NAT EIP that we can allowlist.
- Why API Gateway env URLs instead of service discovery:
  - Keeps the gateway as the single control plane for routing while we stabilize.
  - Cloud Map/VPC Lattice are valid next steps for managed discovery.

### Health checks and target group specifics

- TCP target groups are required for Network Load Balancers. If you configured an HTTP TG by mistake, listener creation will fail with IncompatibleProtocols.
- Recommended health checks:
  - auth (5001): TCP or HTTP /health (if you want to fail fast on app health)
  - user (3002): HTTP /health
  - job (5003): HTTP /health
  - payment (3004): HTTP /health
  - messaging (3003): HTTP /health
  - review (5006): HTTP /health
- To switch a TG to HTTP health checks while remaining TCP for listener/data path:
  - Create the TG with `--protocol TCP` but set `--health-check-protocol HTTP --health-check-path /health` during creation (supported).

### Security & IAM

- ECS Task Execution Role must include permissions for ECR pull and CloudWatch logs.
- For Secrets Manager/SSM, grant the Task Role `secretsmanager:GetSecretValue` or `ssm:GetParameter` on specific ARNs only.
- Security Groups:
  - Services SG (sg-081fd7b767b7ed905): allow intra-VPC on service ports, and all egress (default) for NAT bound traffic.
  - API Gateway SG: ingress from ALB (if used) or the public internet if directly exposed, egress to internal NLB.

### Secrets management examples (SSM Parameter Store)

Store secrets:
```bash
aws ssm put-parameter --name "/kelmah/prod/JWT_SECRET" \
  --type SecureString --value "<secret>" --overwrite --region eu-north-1

aws ssm put-parameter --name "/kelmah/prod/MONGODB_URI" \
  --type SecureString --value "<mongodb+srv://...>" --overwrite --region eu-north-1
```

Reference in task definition (snippet):
```json
{
  "name": "JWT_SECRET",
  "valueFrom": "arn:aws:ssm:eu-north-1:992350137489:parameter/kelmah/prod/JWT_SECRET"
}
```

### Cost considerations

- NAT Gateway incurs hourly + data processing costs. Consider one NAT per AZ for HA in prod; currently single-NAT for simplicity.
- NLB and per-GB data processed billed; keep intra-VPC traffic streamlined.
- Prefer Secrets Manager/SSM over embedding secrets to avoid change churn and reduce risk.

### MongoDB Atlas connectivity options

- NAT + IP allowlist (current): simplest; allowlist `13.62.68.130/32`.
- PrivateLink (recommended long-term): eliminates public exposure, removes allowlist management. Requires VPC endpoints and Atlas PrivateLink setup.
- VPC peering (legacy option): works but less flexible than PrivateLink.

### Operational playbooks

- Blue/Green style deployments:
  - Create `*-nlb` service (green) alongside legacy (blue), test via NLB; flip gateway env to green; scale blue down.
- Canary:
  - Run two gateway task defs behind an ALB with weighted target groups. Not implemented here; suitable next step.
- Disaster Recovery:
  - Keep task definitions versioned; maintain IaC for subnets/NAT/NLB.
  - Snapshot Atlas or enable continuous backups.

### Monitoring & alerting (suggested)

- CloudWatch Alarms on:
  - Target group UnHealthyHostCount > 0 for 5 minutes
  - ECS Service RunningCount < DesiredCount for 5 minutes
  - 5xx rate at gateway (if behind ALB) or application logs pattern matching
- Centralize logs: `/ecs/<service>`, `/ecs/api-gateway`.

### Troubleshooting

- PowerShell quoting issues: prefer `--cli-input-json file://...` to avoid escaping.
- Check service state:
```bash
aws ecs describe-services --cluster Project-Kelmah \
  --services <service-names> --region eu-north-1 --output json
```
- Check target health:
```bash
aws elbv2 describe-target-health --target-group-arn <TG_ARN> --region eu-north-1 --output json
```
- Inspect gateway logs:
```bash
aws logs describe-log-streams --log-group-name /ecs/api-gateway \
  --order-by LastEventTime --descending --limit 3 --region eu-north-1 --output json
```
- ECS Exec (optional) to debug from inside tasks:
  - Enable `executeCommand` on the service, attach SSM permissions to Task Role, then `aws ecs execute-command ...` to run shell inside container.

### Naming & tagging

- Use consistent prefixes: `kelmah-<service>-<env>`.
- Tag resources with: `Project=Kelmah`, `Env=prod`, `Owner=<team>`, `CostCenter=<id>`.

### Multi-env strategy

- Separate clusters and VPC subnets per env (dev/stage/prod) or use one cluster with distinct services and isolated subnets.
- Use different NAT EIPs per env if staying on IP allowlists.

### Detailed step-by-step with exact AWS CLI commands

These are the concrete commands used (or their generalized equivalents) to execute each step. Replace placeholder values like <REV>, <NLB_ARN>, etc. with your outputs.

#### Validate AWS session
```bash
aws --version
aws sts get-caller-identity --output json
```

#### Check ECR tags (auth)
```bash
aws ecr describe-images \
  --repository-name kelmah-auth-service \
  --region eu-north-1 \
  --query "reverse(sort_by(imageDetails,& imagePushedAt))[:20].imageTags" \
  --output json
```

#### Register updated task definitions (examples)
```bash
# Auth service TD
aws ecs register-task-definition \
  --cli-input-json file://kelmah-backend/auth-service-task-definition.json \
  --region eu-north-1

# API Gateway TD after internal URLs were set
aws ecs register-task-definition \
  --cli-input-json file://api-gateway-task-definition.json \
  --region eu-north-1

# Other services (user/job/payment/messaging/review)
aws ecs register-task-definition --cli-input-json file://user-service-task-definition.json --region eu-north-1
aws ecs register-task-definition --cli-input-json file://job-service-task-definition.json --region eu-north-1
aws ecs register-task-definition --cli-input-json file://payment-service-task-definition.json --region eu-north-1
aws ecs register-task-definition --cli-input-json file://messaging-service-task-definition.json --region eu-north-1
aws ecs register-task-definition --cli-input-json file://review-service-task-definition.json --region eu-north-1
```

#### Force new deployments
```bash
aws ecs update-service --cluster Project-Kelmah --service auth-service --task-definition kelmah-auth-service:<REV> --force-new-deployment --region eu-north-1
aws ecs update-service --cluster Project-Kelmah --service kelmah-api-gateway-service-gg6bf9h1 --task-definition api-gateway-task:<REV> --force-new-deployment --region eu-north-1
```

#### Subnets, VPC, SGs (discovery/checks)
```bash
aws ec2 describe-subnets --filters Name=vpc-id,Values=vpc-0dabf8272bd2ef53d --region eu-north-1 --output json
aws ec2 describe-security-groups --group-ids sg-081fd7b767b7ed905 --region eu-north-1 --output json
```

#### Allocate NAT EIP and create NAT Gateway
```bash
aws ec2 allocate-address --domain vpc --region eu-north-1 --query '{AllocationId:AllocationId,PublicIp:PublicIp}' --output json

aws ec2 create-nat-gateway \
  --subnet-id subnet-0dd46e5972b0e31a7 \
  --allocation-id <EIP_ALLOCATION_ID> \
  --region eu-north-1 \
  --query 'NatGateway.NatGatewayId' --output text

aws ec2 wait nat-gateway-available --nat-gateway-ids <NAT_ID> --region eu-north-1

# Add default route for private subnets' route table
aws ec2 create-route \
  --route-table-id <PRIVATE_RT_ID> \
  --destination-cidr-block 0.0.0.0/0 \
  --nat-gateway-id <NAT_ID> \
  --region eu-north-1
```

#### Create internal NLB and fetch DNS/ARN
```bash
aws elbv2 create-load-balancer \
  --name kelmah-internal-svcs \
  --type network \
  --scheme internal \
  --subnets subnet-006406d535a30911f subnet-024eebebbdc867963 subnet-0a9d0777b99602681 \
  --region eu-north-1

aws elbv2 describe-load-balancers --region eu-north-1 --output json
```

#### Create Target Groups (TCP) and listeners
```bash
# Target Groups
aws elbv2 create-target-group --name kelmah-auth-tg-tcp --protocol TCP --port 5001 --vpc-id vpc-0dabf8272bd2ef53d --target-type ip --health-check-protocol TCP --region eu-north-1
aws elbv2 create-target-group --name kelmah-user-tg      --protocol TCP --port 3002 --vpc-id vpc-0dabf8272bd2ef53d --target-type ip --health-check-protocol HTTP --health-check-path /health --region eu-north-1
aws elbv2 create-target-group --name kelmah-job-tg       --protocol TCP --port 5003 --vpc-id vpc-0dabf8272bd2ef53d --target-type ip --health-check-protocol HTTP --health-check-path /health --region eu-north-1
aws elbv2 create-target-group --name kelmah-payment-tg   --protocol TCP --port 3004 --vpc-id vpc-0dabf8272bd2ef53d --target-type ip --health-check-protocol HTTP --health-check-path /health --region eu-north-1
aws elbv2 create-target-group --name kelmah-messaging-tg --protocol TCP --port 3003 --vpc-id vpc-0dabf8272bd2ef53d --target-type ip --health-check-protocol HTTP --health-check-path /health --region eu-north-1
aws elbv2 create-target-group --name kelmah-review-tg    --protocol TCP --port 5006 --vpc-id vpc-0dabf8272bd2ef53d --target-type ip --health-check-protocol HTTP --health-check-path /health --region eu-north-1

# Listeners (use your NLB ARN)
aws elbv2 create-listener --load-balancer-arn <NLB_ARN> --protocol TCP --port 5001 --default-actions Type=forward,TargetGroupArn=<AUTH_TG_ARN> --region eu-north-1
aws elbv2 create-listener --load-balancer-arn <NLB_ARN> --protocol TCP --port 3002 --default-actions Type=forward,TargetGroupArn=<USER_TG_ARN> --region eu-north-1
aws elbv2 create-listener --load-balancer-arn <NLB_ARN> --protocol TCP --port 5003 --default-actions Type=forward,TargetGroupArn=<JOB_TG_ARN> --region eu-north-1
aws elbv2 create-listener --load-balancer-arn <NLB_ARN> --protocol TCP --port 3004 --default-actions Type=forward,TargetGroupArn=<PAYMENT_TG_ARN> --region eu-north-1
aws elbv2 create-listener --load-balancer-arn <NLB_ARN> --protocol TCP --port 3003 --default-actions Type=forward,TargetGroupArn=<MSG_TG_ARN> --region eu-north-1
aws elbv2 create-listener --load-balancer-arn <NLB_ARN> --protocol TCP --port 5006 --default-actions Type=forward,TargetGroupArn=<REVIEW_TG_ARN> --region eu-north-1
```

#### Open SG for intra-VPC ports
```bash
for p in 5001 3002 5003 3004 3003 5006; do \
  aws ec2 authorize-security-group-ingress \
    --group-id sg-081fd7b767b7ed905 \
    --protocol tcp --port $p \
    --cidr 172.31.0.0/16 \
    --region eu-north-1; \
done
```

#### Create NLB-attached ECS services (private)
```bash
# Auth example
aws ecs create-service \
  --cluster Project-Kelmah \
  --service-name auth-service-nlb \
  --task-definition kelmah-auth-service:<REV> \
  --desired-count 1 \
  --launch-type FARGATE \
  --load-balancers targetGroupArn=<AUTH_TG_ARN>,containerName=auth-service,containerPort=5001 \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-006406d535a30911f,subnet-024eebebbdc867963,subnet-0a9d0777b99602681],securityGroups=[sg-081fd7b767b7ed905],assignPublicIp=DISABLED}" \
  --region eu-north-1

# Repeat for: user-service-nlb, job-service-nlb, payment-service-nlb, messaging-service-nlb, review-service-nlb (use their TGs/ports)
```

#### Update API Gateway to internal URLs
```bash
# After editing api-gateway-task-definition.json with internal URLs
aws ecs register-task-definition --cli-input-json file://api-gateway-task-definition.json --region eu-north-1
aws ecs update-service --cluster Project-Kelmah --service kelmah-api-gateway-service-gg6bf9h1 --task-definition api-gateway-task:<REV> --force-new-deployment --region eu-north-1
```

#### Cutover – scale down legacy services
```bash
for s in auth-service user-service job-service payment-service messaging-service review-service; do \
  aws ecs update-service --cluster Project-Kelmah --service $s --desired-count 0 --region eu-north-1; \
done
```

#### Verify health and routing
```bash
# ECS services
aws ecs describe-services --cluster Project-Kelmah \
  --services auth-service-nlb user-service-nlb job-service-nlb payment-service-nlb messaging-service-nlb review-service-nlb \
  --region eu-north-1 --output json

# Target health
aws elbv2 describe-target-health --target-group-arn <TG_ARN> --region eu-north-1 --output json

# Gateway logs (CloudWatch)
aws logs describe-log-streams --log-group-name /ecs/api-gateway --order-by LastEventTime --descending --limit 3 --region eu-north-1 --output json
```

#### Troubleshooting
- IncompatibleProtocols on listener creation: ensure TG protocol is TCP for NLB (HTTP TGs are incompatible with TCP listeners).
- Creation of service was not idempotent: the service name already exists; reuse it or delete and recreate.
- PowerShell quoting: prefer creating small JSON files and using `--cli-input-json file://...` to avoid quoting issues.


