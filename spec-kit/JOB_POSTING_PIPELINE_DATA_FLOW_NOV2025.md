# Job Posting Pipeline Data Flow (Nov 2025)

## Scope & Context
- **Objective**: Document the full end-to-end flow for the hirer job creation experience so ongoing 504/500 debugging adheres to the investigation-first workflow.
- **Entry Points**: Hirer dashboard quick actions, smart navigation CTA, `/hirer/jobs/post`, and the `JobCreationForm` dialog embedded inside `JobPostingPage.jsx`.
- **Services Traversed**: React frontend → Redux Toolkit (`jobSlice`) → shared axios client → API Gateway (`/api/jobs`) → job-service routes/controller → MongoDB (`kelmah_platform` cluster).

## File Surface Inventory

### Frontend
| Path | Role |
| --- | --- |
| `kelmah-frontend/src/modules/jobs/components/job-creation/JobCreationForm.jsx` | Dialog-based wizard that autosaves drafts (`useJobDraft`), normalizes payloads, and dispatches `createJob` in `onSubmit` (lines ~150-230) with inline success/error alerts. |
| `kelmah-frontend/src/modules/hirer/pages/JobPostingPage.jsx` | Hosts the multi-step posting experience and surfaces preview/draft helpers before the dialog opens. |
| `kelmah-frontend/src/modules/hirer/pages/HirerDashboardPage.jsx` | Hirer dashboard CTAs, smart navigation, and profile menu all navigate to `/hirer/jobs/post`, ensuring the wizard remains the single entry point while Redux data hydrates beforehand. |
| `kelmah-frontend/src/modules/hirer/services/hirerSlice.js` | Normalizes hirer dashboards, exposes `createHirerJob`, and polls applications with TTL guards; calls `jobServiceClient.post(JOB.CREATE, payload)` to hit `/api/jobs`. |
| `kelmah-frontend/src/modules/jobs/services/jobSlice.js` | Redux slice exposing the `createJob` thunk (lines 24-58) and reducers reacting to `createJob.pending/fulfilled/rejected`. |
| `kelmah-frontend/src/modules/jobs/services/jobsService.js` | Service abstraction calling `jobServiceClient.post('/api/jobs', payload)` (lines 200-210) with response normalization and list transformers. |
| `kelmah-frontend/src/modules/common/services/axios.js` | Shared axios proxy that resolves the runtime gateway URL, normalizes duplicate `/api` prefixes, injects auth headers, and handles refresh-token retries. |
| `kelmah-frontend/src/config/environment.js` | Dynamic API base resolver: probes LocalTunnel/Render/relative `/api`, caches the last healthy gateway, and feeds axios at runtime. |

### API Gateway
| Path | Role |
| --- | --- |
| `kelmah-backend/api-gateway/server.js` | Applies authentication + rate limiting to `/api/jobs` before forwarding to the job-service proxy. Lines 701-735 show `authenticate` and the job-creation rate limiter. |
| `kelmah-backend/api-gateway/proxy/job.proxy.js` | Rewrites paths (`/api/jobs` prefix), re-streams JSON bodies with explicit `Content-Length`, injects `x-authenticated-user`, and performs rolling health checks before proxying to Render. |

### Job Service
| Path | Role |
| --- | --- |
| `kelmah-backend/services/job-service/server.js` | Boots Express, mounts `/api/jobs` routes, and gates route mounting on Mongo connection readiness while logging request IDs. |
| `kelmah-backend/services/job-service/routes/job.routes.js` | Defines the REST surface. `router.post('/')` (lines 39-63) applies `verifyGatewayRequest`, hirer-only authorization, DB-ready middleware, and request validation before `jobController.createJob`. |
| `kelmah-backend/services/job-service/controllers/job.controller.js` | Implements `createJob`, normalizes payloads, now calls `ensureMongoReady()` (connection + ping) before persisting via `Job.create()`. |
| `kelmah-backend/services/job-service/config/db.js` | Provides `connectDB`, `ensureConnection`, and the new `pingDatabase/ensureMongoReady` helpers plus reduced `bufferTimeoutMS` to fail fast when Mongo stalls. |
| `kelmah-backend/services/job-service/middlewares/dbReady.js` | Short-circuits every route with a `503` if `mongoose.connection.readyState !== 1`. |
| `kelmah-backend/shared/middlewares/serviceTrust.js` | Supplies `verifyGatewayRequest` that trusts the API Gateway’s `x-authenticated-user` header. |
| `kelmah-backend/services/job-service/models/index.js` | Imports shared `Job`, `Application`, `User` from `shared/models` and registers service-specific models like `SavedJob`, `Bid`, `Contract*`. |

## Dry Audit Findings (Nov 23, 2025)

### Frontend Entry Points
- `HirerDashboardPage.jsx` (lines 1-350 reviewed) funnels every CTA—quick actions, empty states, smart navigation chips, and the profile menu—to `/hirer/jobs/post`, guaranteeing the wizard is the only creation surface while Redux job data hydrates in the background.
- `JobCreationForm.jsx` ties `react-hook-form` state to `useJobDraft`, normalizes bidding/budget/location payloads before dispatching `createJob`, and exposes explicit success/error alerts, so backend messages must stay descriptive.
- `jobSlice.js` + `jobsService.js` confirm `createJob` ultimately issues `jobServiceClient.post('/api/jobs', payload)`; no remaining `/jobs` (missing `/api`) calls exist.
- `hirerSlice.js` duplicates job creation through `jobServiceClient.post(JOB.CREATE, payload)` for dashboard shortcuts, meaning regressions impact both slices simultaneously.

### Networking & Environment
- `modules/common/services/axios.js` dynamically refreshes `baseURL` from `getApiBaseUrl()`, normalizes duplicate `/api` prefixes, injects Bearer tokens, and adds request IDs. Any path typo (e.g., `/jobs`) bypasses the gateway because normalization only runs when both base + path include `/api`.
- `src/config/environment.js` loads `runtime-config.json`, probes LocalTunnel/Render origins, and caches the last healthy gateway (`kelmah:lastHealthyApiBase`). Dry-run diagnostics must therefore verify the current tunnel before issuing curls.

### Gateway & Proxy
- `api-gateway/server.js` mounts `/api/jobs` with `authenticate`, role-aware rate limiting, and defers to `createEnhancedJobProxy` after service discovery. Route specificity inside the job-service router keeps literals ahead of parameterized IDs.
- `proxy/job.proxy.js` re-streams JSON bodies (resolving the earlier body-loss issue), stamps `X-Request-ID`, injects `x-authenticated-user`, and short-circuits with 503 when health checks fail—current timeouts imply the proxy still considers the service healthy, so the bottleneck is downstream.

### Job Service & Mongo Readiness
- `server.js` now mounts routes immediately for keep-alive purposes, so controller-level guards (`ensureConnection` + ping) are the final protection against buffering.
- `routes/job.routes.js` globally applies `dbReady`, `verifyGatewayRequest`, and role guards before `jobController.createJob`; literal routes (e.g., `/my-jobs`, `/search`) stay ahead of `/:id` to avoid shadowing.
- `controllers/job.controller.js` already contains the Mongo ping guard (log keys `job.create.dbPing` / `job.create.dbPingFailed`). Need to confirm the deployed build matches this version.
- `middlewares/dbReady.js` still only checks `readyState === 1`, explaining why requests reach the controller even when Mongo eventually buffers.
- `config/db.js` reuses connections, logs sanitized URIs, and exposes `ensureConnection`. Any remaining hang indicates Atlas accepted the socket but stalled inserts; diagnostics must confirm whether ping logging appears remotely.

### Compliance Notes
- The mandated dry audit now covers UI modules, Redux slices, shared axios/env helpers, gateway proxying, and the entire job-service stack before executing diagnostics. No `curl` or runtime checks have been performed yet; they will begin only after this documentation plus `STATUS_LOG.md` are updated.

## Data Flow Template
```
UI Component: JobCreationForm.jsx
Location: kelmah-frontend/src/modules/jobs/components/job-creation/JobCreationForm.jsx

User Action: Hirer fills the wizard and clicks "Submit"
↓
Event Handler: onSubmit (lines ~121-187) dispatches `createJob(jobData)` via Redux
↓
State Layer: jobSlice.js `createJob` thunk awaits `jobsApi.createJob(jobData)`; pending/fulfilled/rejected states update `jobs.loading` & `jobs.error`
↓
Service Client: jobsService.js `createJob` → `jobServiceClient.post('/api/jobs', jobData)` using the shared axios proxy
↓
Gateway Proxy: api-gateway/server.js authenticates `/api/jobs`, applies rate limits, and forwards to `jobProxyMiddleware` (job.proxy.js) which rewrites the path, injects `x-authenticated-user`, and streams the JSON body to the job service
↓
Job Service Route: job-service/routes/job.routes.js `router.post('/')` verifies gateway trust, enforces hirer role, validates payload, and executes `jobController.createJob`
↓
Controller Logic: job.controller.js `createJob` normalizes legacy fields, calls `ensureConnection()` (config/db.js), pings Mongo before writes, and persists via `Job.create(body)`
↓
Database: MongoDB `kelmah_platform.jobs` collection stores the new document; the response travels back through the controller → gateway → axios client → Redux thunk → UI toast/dialog
↓
UI Update: JobCreationForm resets, draft cleared via `useJobDraft`, success Alert shown, and navigation to `/jobs/:id` occurs when `result.job.id` exists
```

## Observations & Current Issues
- `dbReady` only checks `mongoose.connection.readyState === 1`; recent failures show writes still buffer for ~10s even when `readyState` reports connected, so `createJob` needs a deeper readiness guard (ping or client command) before calling `Job.create`.
- Gateway logging confirms the request stream reaches Render, so timeouts stem from the controller/db layer rather than auth/rate limits.
- Frontend service already targets `/api/jobs`; no duplicate `/jobs` entries remain, but any future refactors must preserve the `/api` prefix so the gateway proxies correctly.
- Success/error envelopes should continue to use `successResponse`/`errorResponse` for consistency; current 504 reproductions indicate the response never leaves the job service, aligning with the buffering timeout.

### Nov 23 Dry-Audit Additions
- Hirer dashboard CTAs, smart navigation, and the wizard all use the same Redux thunks; any backend regression simultaneously breaks the modal submission and the dashboard shortcuts.
- Axios interceptors dynamically rewrite the base URL using the latest LocalTunnel entry, so diagnostics must reference the currently published tunnel instead of hard-coded strings.
- Job proxy health checks currently pass, so attention shifts to whether the deployed job-service build contains the ping guard logged as `job.create.dbPing`; diagnostics will validate this before any new code changes.

## Diagnostics Snapshot (Nov 22, 2025)
- `curl -D - -w "HTTP_STATUS:%{http_code} TOTAL:%{time_total}s" -X POST https://kelmah-api-gateway-kubd.onrender.com/api/jobs ...` → `HTTP_STATUS:504 TOTAL:52.23s` with gateway request ID `016ee691-9786-4dc1-9213-ab5229d05c66`.
- `curl -D - -X POST https://kelmah-job-service-xo0q.onrender.com/api/jobs -H "x-authenticated-user: {...}" -H "x-auth-source: api-gateway" ...` → `HTTP_STATUS:500 TOTAL:11.23s` and body `Operation jobs.insertOne() buffering timed out after 10000ms`.
- Conclusion: API Gateway forwards the payload, but the job service blocks waiting for MongoDB despite reporting a connected state.

## Remediation Summary
- `config/db.js` drops Mongoose's global `bufferTimeoutMS` to 2000ms and exports `pingDatabase` + `ensureMongoReady` so controllers can share a single readiness contract.
- `job.controller.js#createJob` now awaits `ensureMongoReady()` (connection + ping) with a configurable timeout and returns structured `503 DB_UNAVAILABLE` responses when Mongo isn't writable.
- Successful readiness checks emit `job.create.dbReady` logs with latency to corroborate Mongo responsiveness, while failures short-circuit before `Job.create` buffers for 10s.

## Diagnostics & Logging Enhancement Plan (Nov 24, 2025)
- **Scope Restatement**: Deliver actionable telemetry for every `POST /api/jobs` request so Render logs expose Mongo readiness, proxy health, payload metadata (size + normalized bidding fields), and correlation IDs from gateway → job service.
- **Success Criteria**:
	1. Job-service logs emit `job.create.request`, `job.create.dbReady`, and `job.create.dbError` lines at `info` level with request IDs so Render dashboards surface failures without flipping to debug mode.
	2. A standalone Mongo probe script (CLI) can ping the Atlas cluster using the shared `MONGODB_URI`, reporting connection time, ping duration, and whether insert commands succeed with a minimal document.
	3. Gateway/job-service curls include precise timestamps, headers, and response JSON saved under `diagnostics/` for auditing.
- **File Surface To Touch**:
	- `kelmah-backend/services/job-service/config/db.js` – expose structured log helpers + configurable timeouts for `ensureMongoReady`.
	- `kelmah-backend/services/job-service/controllers/job.controller.js` – log request metadata upfront, reuse shared log helpers, propagate request IDs, and capture Mongo failure reasons before responding.
	- `diagnostics/mongo-probe.js` (new) – CLI tool to ping the Atlas cluster, run a lightweight insert + delete cycle, and print JSON results for spec-kit referencing.
	- `spec-kit/JOB_POSTING_PIPELINE_DATA_FLOW_NOV2025.md` & `STATUS_LOG.md` – record probe output, curl evidence, and remediation notes per workflow mandate.
- **Investigation Tasks (Pre-Code)**:
	1. Confirm existing loggers (`logger` from `../../shared/utils/logger`) support structured metadata; document required fields.
	2. Identify how request IDs travel from gateway (`x-request-id`, `x-correlation-id`) into job-service logs; ensure controllers capture them before additional middleware runs.
	3. Decide on probe script CLI arguments (env var vs. inline URI) and output format (JSON with success/error fields) so future diagnostics remain consistent.

### Diagnostics & Logging Implementation (Nov 24, 2025)
- `services/job-service/config/db.js` now exposes `describeReadyState` + `emitLog`, and `ensureMongoReady` accepts `{ logger, context, requestId, correlationId }` so readiness/ping telemetry emits at INFO/WARN without enabling debug mode.
- `job.controller.js#createJob` captures normalized request metadata (content-length fallback, payload summary counts, auth source) via helper utilities and logs:
	- `job.create.request` → payload stats + request IDs
	- `job.create.dbReady` (info) and `job.create.dbUnavailable` (warn) with latency + readyState
	- `job.create.success` / `job.create.failed` (info/error) including ready/write latency + total duration.
- Added `diagnostics/mongo-probe.js`, a CLI using the official Mongo driver to (a) connect/ping, (b) insert/delete a probe document, and (c) print JSON results. Output archived at `diagnostics/mongo-probe-2025-11-21T0256Z.json` (latency: connect 2.49s, ping 168ms, insert 360ms).
- Captured fresh curls with bearer token + legacy headers:
	- Gateway (`diagnostics/gateway-job-response-2025-11-21T030408Z.*`): 504 in 16.42s (`Error occurred while trying to proxy...`).
	- Direct job service (`diagnostics/direct-job-response-2025-11-21T030627Z.*`): 500 in 10.87s, body `Operation jobs.insertOne() buffering timed out after 10000ms`.
- Stored login request artifacts under `diagnostics/login-headers.txt` + `diagnostics/login-response.json` for future reruns; bearer token extracted from `giftyafisa@gmail.com` credentials (201 success, `TOTAL:3.68s`).

### Readiness Cache Integration (Nov 24, 2025)
- `middlewares/dbReady.js` now retains the last successful `ensureMongoReady` timestamp + latency (default cache window 3s) and attaches it to `req.mongoReady` so downstream controllers can reuse the health check instead of hammering Atlas for every request.
- `job.controller.js#createJob` trusts the cached result for 2 seconds when `mongoose.connection.readyState === 1`, logging `job.create.readyReuse` with the cache hit metadata; bursts of hirer submissions now avoid redundant readiness pings.
- When cache data is stale or the connection slipped out of ready state, the controller falls back to `ensureMongoReady` with the original request/correlation IDs, logging `job.create.dbReady` or `job.create.dbUnavailable` before deciding whether to continue or return a `503 DB_UNAVAILABLE` response.
- Success logs now include `readySource`, `readyLatencyMs`, and `writeLatencyMs`, giving Render dashboards enough detail to distinguish middleware-cache hits from controller-level checks.
- Next verification step: rerun the gateway + direct `POST /api/jobs` curls once Render redeploys the job service to ensure cache hits produce the expected logs and that DB failures fail fast with structured 503s rather than lingering 504s.

## Diagnostics Snapshot (Nov 21, 2025 13:13 UTC)
- `diagnostics/login-headers-20251121T131334Z.txt` + `diagnostics/login-response-20251121T131334Z.json` capture a fresh gateway login using `giftyafisa@gmail.com` (request succeeded in `HTTP_STATUS:200 TOTAL:3.34s` and returned user id `6891595768c3cdade00f564f`).
- `curl -D diagnostics/gateway-job-response-20251121T131334Z.headers -o diagnostics/gateway-job-response-20251121T131334Z.json -X POST https://kelmah-api-gateway-kubd.onrender.com/api/jobs ...` still yields `HTTP_STATUS:504 TOTAL:15.79s`; gateway response headers show `x-request-id: 62801dbf-6c7f-454a-8a9e-65e4dadb4d1a`, confirming the proxy accepted the body but never received a service response before timing out.
- Posting the identical payload directly to the job service (`diagnostics/direct-job-response-20251121T131334Z.*`) returns immediately with `HTTP_STATUS:400 TOTAL:0.84s` and a validation message (`"requirements" is not allowed`, `"bidding" is not allowed`), demonstrating the Render job-service instance is reachable and rejects the payload instead of hanging—so the 504 occurs before the service replies (likely within the gateway/proxy hop or dbReady middleware).
- `diagnostics/mongo-probe-20251121T131334Z.json` shows Atlas connectivity is healthy outside the service (connect 2.78s, ping 179 ms, insert 436 ms, delete 189 ms, all `success:true`), so Mongo itself was responding during the failing gateway calls.

## Routing & Readiness Analysis (Nov 21, 2025)
- Gateway proxy review (`kelmah-backend/api-gateway/proxy/job.proxy.js`, lines 10-78) shows we manually re-stream JSON payloads inside `onProxyReq`, but we never call `proxyReq.end()` after `proxyReq.write(bodyData)`. The http-proxy-middleware docs require terminating the upstream request when you override the body; without `end()` the job service waits for more bytes, never processes the request, and the gateway times out after ~15 s. This exactly matches the observed 504s with `Error occurred while trying to proxy…` bodies even though the job service is healthy.
- Job-service routing + readiness (routes + `dbReady.js`) look correct: `/api/jobs` routes mount `dbReady` first, `verifyGatewayRequest` still trusts the gateway headers, and `job.controller.js#createJob` now consumes `req.mongoReady` or calls `ensureMongoReady`. Since the direct call receives a 400 immediately, the service can parse the payload once it actually receives the bytes.
- User-identification headers survive the hop: the proxy sets `x-authenticated-user` and `x-auth-source: api-gateway`, and direct diagnostics confirmed `verifyGatewayRequest` works when those headers are present. So the regression is isolated to the proxy body streaming, not the auth chain or readiness cache.

## Remediation Plan (Nov 21, 2025)
1. Update `kelmah-backend/api-gateway/proxy/job.proxy.js` so that any custom body write via `proxyReq.write(bodyData)` is followed by `proxyReq.end()` and appropriate error handling. This should immediately unblock the hanging POSTs.
2. While touching the proxy, ensure we only stringify once and guard against empty bodies to avoid double-ending requests for GET/DELETE routes.
3. After code change, rerun the gateway curl for POST `/api/jobs` plus the direct service curl to confirm the gateway now returns the same 400 validation response instead of a 504 timeout. Capture headers/bodies under `diagnostics/` and record in `STATUS_LOG.md`.
4. Document the fix and verification log inside spec-kit and mark the TODO checklist items as complete.

## Implementation & Verification (Nov 21, 2025)
- Updated `kelmah-backend/api-gateway/proxy/job.proxy.js` so any manually re-streamed body writes now convert to a Buffer, set `Content-Length`, and crucially call `proxyReq.end()` inside `onProxyReq`. Without the `end()` call the upstream job service never received EOF and kept each POST hanging until the gateway timeout elapsed.
- Hardened the error path by logging failures and destroying the proxy request if the manual write throws (mirrors how other proxies handle stream errors) without trying to send a partial Express response from inside the hook.
- Verification (local syntax guard): `node -e "require('C:/Users/aship/Desktop/Project-Kelmah/kelmah-backend/api-gateway/proxy/job.proxy.js'); console.log('proxy loaded');"` confirms the module loads cleanly with the new logic while we wait for the gateway redeploy to re-run the external curls.
- Next diagnostic run: once the API Gateway picks up this change, rerun the existing curl scripts (`diagnostics/login-*.sh`, `diagnostics/post-job-*.sh`) so we can attach the expected 400 validation response (or 201 success) to this spec and the status log.

## Proxy Instance Caching Fix (Nov 21, 2025 14:45 UTC)
- **Root Cause Discovered**: `createEnhancedJobProxy` was creating a fresh `createJobProxy(...)` instance inside the request handler on **every single request** (line 189), which forced `http-proxy-middleware` to recreate the `onProxyReq`/`onProxyRes` event handlers each time and potentially caused race conditions or handler attachment failures that left body streaming incomplete.
- **Fix Applied**: Moved `const proxyMiddleware = createJobProxy(targetUrl, options)` **outside** the returned async function so the proxy instance is created once when `jobProxyMiddleware` is assigned during service discovery (server.js line 1203), then reused for all subsequent `/api/jobs` requests. This ensures the `onProxyReq` hook with `proxyReq.end()` runs consistently.
- **Commit**: `d17b49ab` pushed to main at 14:46 UTC; Render auto-deploy in progress for API Gateway.
- **Verification Plan**: Wait ~2 minutes for gateway redeploy, then retry POST `/api/jobs` via frontend or curl to confirm requests now complete without 504s.

## Next Steps
1. Capture fresh curl traces via the current LocalTunnel + direct job-service hosts to validate the new readiness guard (expect 201 or immediate 503, not 504 timeouts).
2. If diagnostics still show buffering, extend `ensureMongoReady` usage to other write-heavy controllers/middlewares (e.g., job drafts, bids) and consider enhancing `dbReady` middleware to use the shared helper.
3. Update STATUS_LOG with verification results once diagnostics confirm the new guard behavior.
