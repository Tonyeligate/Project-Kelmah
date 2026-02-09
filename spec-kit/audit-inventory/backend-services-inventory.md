# Backend Services Dry Audit Inventory
**Prepared:** October 3, 2025  
**Owner:** Audit Task Force – Backend Sector

This inventory establishes the baseline for the dry audit across all backend services, the API gateway, and shared backend resources. It maps each components structure, highlights primary integration seams, and captures notable audit hotspots to guide detailed file-by-file reviews per the [Dry Audit Execution Plan](../DRY_AUDIT_EXECUTION_PLAN.md).

---

## 1. Scope Overview

| Component | Root Path | Key Subdirectories | Primary Interfaces | Audit Notes |
| --- | --- | --- | --- | --- |
| API Gateway | `kelmah-backend/api-gateway/` | `routes/`, `middlewares/`, `proxy/`, `utils/`, `config/`, `logs/` | Express router, service proxy, health monitor | Central routing hub; ensure per-service proxy contracts align with upstream services. |
| Shared Backend Resources | `kelmah-backend/shared/` | `models/`, `middlewares/`, `utils/`, `test-utils.js` | Consolidated Mongoose schemas, trust middleware, observability utilities | All services import models via their local `models/index.js`. Verify consistent use of shared JWT/logging helpers. |
| Auth Service | `kelmah-backend/services/auth-service/` | `config/`, `controllers/`, `middlewares/`, `models/`, `routes/`, `services/`, `utils/`, `tests/`, `scripts/` | `server.js`, `routes/auth.routes.js`, RevokedToken model | Handles authentication, token lifecycle, device security. Includes event publishers/consumers. |
| User Service | `kelmah-backend/services/user-service/` | `config/`, `controllers/`, `middlewares/`, `models/`, `routes/`, `scripts/`, `tests/`, `utils/`, `migrations/`, `logs/` | `server.js`, worker profile controllers, availability models | Provides worker profiles, skills, certificates, bookmarks, availability. Heavy shared-model usage. |
| Job Service | `kelmah-backend/services/job-service/` | `controllers/`, `models/`, `routes/`, `services/`, `utils/`, `validations/`, `middlewares/`, `tests/`, `config/` | `server.js`, job/contract controllers, event bus | Manages job postings, bids, contracts; contains `verify-deployment.js` health harness. |
| Payment Service | `kelmah-backend/services/payment-service/` | `controllers/`, `integrations/`, `models/`, `routes/`, `services/`, `utils/`, `middlewares/`, `tests/`, `config/` | `server.js`, escrow/billing controllers, telco integrations | Integrates with MTN MoMo, AirtelTigo, Vodafone Cash, Paystack. Audit idempotency + webhook records. |
| Messaging Service | `kelmah-backend/services/messaging-service/` | `controllers/`, `routes/`, `services/`, `socket/`, `workers/`, `models/`, `middlewares/`, `utils/`, `tests/`, `logs/` | `server.js`, Socket.IO gateway, virus-scan worker | Powers real-time chat, notifications, background workers. Validate queue + socket contract alignment. |
| Review Service | `kelmah-backend/services/review-service/` | `controllers/`, `routes/`, `models/`, `utils/`, `tests/`, `logs/` | `server.js`, review/rating controllers | Contains legacy `server.js.backup` and `server.new.js`. Confirm which entrypoint is canonical. |
| Backend Orchestration | `kelmah-backend/` | `config/`, `docs/`, `migrations/`, `logs/`, `services/`, root scripts | `start-services.js`, `docker-compose.yml`, `setup-environment.js` | Manages multi-service startup, deployment, env provisioning. |

> **Inventory Exclusions:** `node_modules/`, generated `logs/`, and compiled artifacts are omitted. Paths listed above are primary audit targets.

---

## 2. API Gateway Inventory
- **Entry Point:** `server.js`
  - Configures Express, mounts rate limiting and auth trust middleware, and registers proxy routes per service.
- **Routing Layer:** `routes/`
  - `auth.routes.js`, `user.routes.js`, `job.routes.js`, `payment.routes.js`, `messaging.routes.js`, `review.routes.js`, `dashboard.routes.js`, `monolith.routes.js`.
  - `index.js` aggregates and exposes the router map; verify path ordering to avoid shadowing.
- **Proxy Layer:** `proxy/`
  - Per-service proxy handlers (`auth.proxy.js`, `job.proxy.js`, etc.) wrap shared `serviceProxy.js` and enforce gateway policies.
- **Middleware:** `middlewares/`
  - Auth token validation, rate limiting, logging, and request validation. `auth.js.backup` signals a deprecated implementation; confirm usage.
- **Utilities:** `utils/`
  - Circuit breaker, resilient proxy wrapper, JWT helpers, response normalizers, service discovery, and health monitor.
- **Configuration:** `config/serviceConfig.js`
  - Maps environment variables to service base URLs and retry policies.
- **Audit Hotspots:**
  - Ensure proxy error handling aligns with service expectations. Cross-check health monitor coverage against `services/*/health` endpoints.

---

## 3. Shared Backend Resources
- **Models:** `shared/models/`
  - Centralized Mongoose schemas (`User`, `Job`, `Application`, `Message`, `Conversation`, `Notification`, `RefreshToken`, `SavedJob`). `index.js` exports aggregated models for service-level `models/index.js` files.
- **Middleware:** `shared/middlewares/`
  - `rateLimiter.js` and `serviceTrust.js` provide reusable gateway-level protections.
- **Utilities:** `shared/utils/`
  - Observability, logging, JWT, circuit breaker helpers, HTTP client wrapper, environment validators.
- **Test Utilities:** `shared/test-utils.js`
  - Facilitates consistent integration testing across services.
- **Audit Hotspots:**
  - Confirm every service leverages shared models to avoid reconnecting separate mongoose instances. Track any duplicated utility logic within services.

---

## 4. Service Snapshots

### 4.1 Auth Service (`services/auth-service/`)
- **Entry & Bootstrap:** `server.js` composes Express, environment validation, and event hooks.
- **Routing & Controllers:** `routes/auth.routes.js` connects to `controllers/auth.controller.js` for login, registration, MFA endpoints.
- **Configuration:** `config/` (duplicated mirror in `config/config/`) governs OAuth/passport, rate limits, database URIs.
- **Models:** `models/index.js` re-exports shared models; `RevokedToken.js` maintained locally for token blacklisting.
- **Middlewares:** JWT guard (`middlewares/auth.js`) and rate limiter; verify derivative logic respects shared middleware conventions.
- **Services:** Email delivery, event publisher/consumer, external service client wrappers.
- **Utilities:** Security helpers (OTP, session management, device fingerprinting) and tracing/logging.
- **Tests/Scripts:** `tests/` hold Jest suites; `scripts/` for seeding and admin tasks.
- **Audit Hotspots:** Duplicate config directory, extensive utils—flag for consolidation during detailed audit.

### 4.2 User Service (`services/user-service/`)
- **Entry:** `server.js`; orchestrates worker profile APIs.
- **Routing & Controllers:** `routes/` with worker profile endpoints leading to `controllers/` (availability, skills, certificates, bookmarks).
- **Models:** Rich model set for profile entities (`Availability`, `WorkerProfileMongo`, `Skill`, etc.).
- **Middlewares:** Auth, role checks, error handling under `middlewares/`.
- **Scripts/Migrations:** Data migrations and CLI utilities ensure profile data integrity; prioritize auditing migrations for schema drift.
- **Utilities/Tests:** Response shaping, validation, Jest coverage.
- **Audit Hotspots:** Ensure models consistently import shared schemas; watch for duplicate schemas vs shared definitions.

### 4.3 Job Service (`services/job-service/`)
- **Entry:** `server.js` configures job controllers and message bus hooks.
- **Routing & Controllers:** `routes/` for job lifecycle, contracts, and bids; `controllers/` handle respective domains.
- **Models:** Local schemas for bids, contracts, contract templates, and performance metrics.
- **Services:** Event publisher/consumer and service client for cross-service messaging.
- **Utilities & Validations:** Input validation logic in `validations/`, general helpers in `utils/`.
- **Special Files:** `verify-deployment.js` used for Render/production smoke tests.
- **Audit Hotspots:** Validate migration away from broken Mongoose bindings per `MONGOOSE_DISCONNECTED_MODELS_FIX.md`.

### 4.4 Payment Service (`services/payment-service/`)
- **Entry:** `server.js`; orchestrates payment flows.
- **Routing & Controllers:** Manage billing, escrow, wallet, and payout routes.
- **Models:** Extensive ledger set (`Payment`, `Transaction`, `IdempotencyKey`, `WebhookEvent`, etc.).
- **Integrations:** `integrations/` contains adapters for AirtelTigo, MTN MoMo, Vodafone Cash, Paystack—ensure consistent interface signatures.
- **Services & Utils:** Handles idempotency, reconciliation, signature verification.
- **Audit Hotspots:** Verify webhook persistence and retry logic; confirm idempotency key usage across controllers.

### 4.5 Messaging Service (`services/messaging-service/`)
- **Entry:** `server.js` merges HTTP + Socket.IO servers.
- **Routing & Controllers:** Chat, notification, and typing indicator endpoints.
- **Socket Layer:** `socket/messageSocket.js` configures real-time channels, ensures auth handshake flows through gateway tokens.
- **Workers:** Background processor (`workers/virus-scan-worker.js`) for attachment scanning.
- **Models:** Conversation, Message, Notification, NotificationPreference.
- **Services & Utils:** Queue management, push delivery, event bus integration.
- **Audit Hotspots:** Confirm socket auth uses shared JWT utility; ensure virus scan worker dependencies documented.

### 4.6 Review Service (`services/review-service/`)
- **Entry:** `server.js` (plus legacy copies). Determine canonical entrypoint and retire unused variants.
- **Routing & Controllers:** Manage review submission, aggregation, worker ratings.
- **Models:** `Review`, `WorkerRating` (import shared user/job references via `models/index.js`).
- **Utilities:** Score normalization, response helpers.
- **Audit Hotspots:** Identify whether backup server files diverge from production; plan consolidation.

---

## 5. Backend Orchestration & Global Assets
- **Startup Scripts:** `start-all-services.js`, `start-services.js`, `start-production.js` orchestrate local multi-service startup, invoking each services `server.js` via child processes.
- **Environment Setup:** `setup-environment.js`, `.env.example`, and root `config/config.js` define cross-service environment variables.
- **Deployment Assets:** `docker-compose.yml`, `Dockerfile`, Render guides (`RENDER-DEPLOYMENT-GUIDE.md`, `deploy-to-render.md`) document container and cloud workflows.
- **Health/Diagnostics:** `check-services-health.js`, `test-skills-api.js`, `test-user-service-fixes.js` provide smoke tests and verification scripts.
- **Documentation:** `docs/` directory contains service-specific API documentation (`auth-service-api.md`, `messaging-service-api.md`, etc.) and should be cross-referenced during audits.

---

## 6. Immediate Audit Follow-Ups
- Initialize coverage tracking (`spec-kit/audit-tracking/coverage-matrix.csv`) and log each service as `pending`.
- Schedule detailed primary audits in this order: **API Gateway  Shared Resources  Auth Service  User Service  Job Service  Messaging Service  Payment Service  Review Service** (prioritizes auth dependencies before consumer services).
- Flag duplicate or legacy artifacts for verification during primary audits:
  - `api-gateway/middlewares/auth.js.backup`
  - `services/review-service/server.js.backup` and `server.new.js`
  - `services/auth-service/config/` vs `config/config/`
- Confirm every services `models/index.js` imports exclusively from `../../../shared/models/` to prevent mongoose instance drift.

---

## 7. Next Steps & Reporting
- Use this inventory to drive the first backend audit wave and populate file-level audit reports under `spec-kit/audits/backend/` (create directory as needed).
- Update `spec-kit/STATUS_LOG.md` with progress notes after each audit session.
- Coordinate with DevOps to ensure startup scripts and health checks match the current service list during upcoming verification runs.
