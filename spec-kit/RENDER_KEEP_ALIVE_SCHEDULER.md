# Render Keep-Alive Scheduler – November 7, 2025

## Summary
- **Problem:** Render free-tier services power down after ~15 minutes of inactivity, so the first public request (e.g. `/api/users/workers/:id`) returns 502/504 while each microservice spins back up.
- **Solution:** The API Gateway runs a resilient keep-alive scheduler that periodically hits a set of health endpoints (with retries and fallback paths) to keep Render dynos warm while preserving configuration escapes for local development.
- **Entry Point:** `kelmah-backend/api-gateway/utils/serviceKeepAlive.js`
- **Activation:** Automatically started once service discovery resolves URLs inside `server.js` when running in production (Render) or when `FORCE_RENDER_KEEP_ALIVE=true` is set.

## Design Details
1. **Scheduler Lifecycle**
   - `createKeepAliveManager` accepts a `getServices` getter so the latest resolved URLs are always used.
   - `start()` fires immediately after service discovery (`initializeServices`) and schedules ticks every 8 minutes (configurable).
   - Errors are swallowed with warn-level logs to avoid crashing the gateway during transient outages.

2. **Environment Guards**
   - `detectEnvironment()` drives behaviour – scheduler auto-enables only for `production` detections (Render, Vercel, etc.).
   - Local developers can force-enable via `FORCE_RENDER_KEEP_ALIVE=true` or disable in production with `DISABLE_RENDER_KEEP_ALIVE=true`.

3. **HTTP Behaviour**
   - Each tick iterates over the current registry (`auth`, `user`, `job`, `payment`, `messaging`, `review`).
   - For each service we compute a probe list (global or per-service env overrides) and attempt each endpoint sequentially.
   - Each probe uses a 20s timeout and accepts any response under 500 as “warm”; 404/405/timeout trigger fallbacks to the next endpoint.
   - Up to three attempts per tick with a 15s delay help Render dynos finish spinning up before reporting failure.
   - Logs track misses at `debug`, recoveries at `info`, and final failures at `error` with endpoint/status/error metadata.

4. **Configuration Flags**
   - `RENDER_KEEP_ALIVE_INTERVAL_MS` – override interval (default 480000 ms ≈ 8 minutes).
   - `RENDER_KEEP_ALIVE_TIMEOUT_MS` – override per-request timeout (default 20000 ms).
   - `RENDER_KEEP_ALIVE_RETRY_COUNT` – number of attempts per tick (default 3, minimum 1).
   - `RENDER_KEEP_ALIVE_RETRY_DELAY_MS` – delay between attempts (default 15000 ms).
   - `RENDER_KEEP_ALIVE_ENDPOINTS` – comma-separated fallback list shared by all services.
   - `<SERVICE_NAME>_KEEP_ALIVE_ENDPOINTS` – service-specific endpoint list (e.g. `AUTH_KEEP_ALIVE_ENDPOINTS=/healthz,/readyz`).
   - `DISABLE_RENDER_KEEP_ALIVE` – explicit opt-out in any environment.
   - `FORCE_RENDER_KEEP_ALIVE` – opt-in when running locally.

## Verification Steps
1. **Local smoke test:** `node -e "require('./kelmah-backend/api-gateway/utils/serviceKeepAlive'); console.log('ok');"` (already executed).
2. **Render deployment:** Push to main → Render auto-redeploys the gateway. Monitor logs for `Render keep-alive scheduler enabled` message.
3. **Idle window test:** After deployment, leave services idle 20+ minutes, hit `/api/health/aggregate`. Expect immediate 200 responses instead of 502 warm-up delays.
4. **Log review:** Check gateway logs for `Keep-alive recovered` (retry success) and investigate `Keep-alive ping failed` errors if they persist after retries.

## Rollback Plan
- Set `DISABLE_RENDER_KEEP_ALIVE=true` in gateway environment to disable without code rollback.
- If further action required, revert commits touching `serviceKeepAlive.js` and `server.js`.

## Follow-Up
- Consider emitting metrics to an external monitor (Grafana or Render cron logs) if we need historical uptime data.
- Evaluate moving scheduler to a dedicated background worker if Render free tier limits are hit by gateway pings (currently lightweight and within quota).
