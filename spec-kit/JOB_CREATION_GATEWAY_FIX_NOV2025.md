# Job Creation Gateway Fix – November 19, 2025

## Incident Summary
- **Symptom:** Every `POST /api/jobs` call returned a `504 Gateway Timeout` via `https://kelmah-api-gateway-kubd.onrender.com`. Hirers could browse jobs, but publishing new postings failed after ~60s.
- **Reproduction:**
  ```bash
  # Obtain token
  curl -i -X POST https://kelmah-api-gateway-kubd.onrender.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"giftyafisa@gmail.com","password":"11221122Tg"}'

  # Attempt job creation (hangs → 504)
  curl -i -X POST https://kelmah-api-gateway-kubd.onrender.com/api/jobs \
    -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
    -d '{"title":"Test Plumbing Job",...}'
  ```
- **Scope:** Applies to all proxy-authenticated POST/PUT/PATCH requests routed through the dedicated job proxy middleware.

## Root Cause
- `kelmah-backend/api-gateway/server.js` registers `express.json()` globally before mounting the `/api/jobs` proxy.
- `express.json()` consumes the request stream. When the proxy layer (`createProxyMiddleware`) forwards the request, there is no body left to send. The outgoing `Content-Length` header still advertises the original payload size, so the job-service waits indefinitely for bytes that never arrive. After Render’s 60-second upstream timeout, Cloudflare surfaces `504 Gateway Timeout`.
- Diagnostic proof: calling the job service directly (`https://kelmah-job-service-xo0q.onrender.com/api/jobs`) with synthetic gateway headers immediately produced a validation error, confirming the service was healthy while the gateway-to-service hop hung.

## Fix
- Re-stream JSON payloads inside `kelmah-backend/api-gateway/proxy/job.proxy.js`:
  - Detect non-GET/HEAD methods with a parsed body (`req.body`).
  - Rebuild the payload (`Buffer.from(JSON.stringify(req.body))`), enforce `Content-Type: application/json` when missing, set the correct `Content-Length`, and write the buffer into the proxied request via `proxyReq.write(bodyData)`.
  - Buffer bodies are passed through unchanged.
- The proxy already attaches `x-authenticated-user`, so this change only impacts body forwarding.

```diff
 const createJobProxy = (targetUrl, options = {}) => {
   const defaultOptions = {
     onProxyReq: (proxyReq, req) => {
       ...
-      console.log(`[Job Proxy] Proxying ${req.method} ${req.url} to ${targetUrl}`);
+      console.log(`[Job Proxy] Proxying ${req.method} ${req.url} to ${targetUrl}`);
+
+      const methodHasBody = !['GET', 'HEAD'].includes(req.method);
+      const hasParsedBody = req.body && (Buffer.isBuffer(req.body) || Object.keys(req.body).length > 0);
+      if (methodHasBody && hasParsedBody) {
+        const bodyData = Buffer.isBuffer(req.body)
+          ? req.body
+          : Buffer.from(JSON.stringify(req.body));
+
+        if (!Buffer.isBuffer(req.body) && !proxyReq.getHeader('Content-Type')) {
+          proxyReq.setHeader('Content-Type', 'application/json');
+        }
+
+        proxyReq.setHeader('Content-Length', bodyData.length);
+        proxyReq.write(bodyData);
+      }
     }
   };
 }
```

## Verification Plan
1. **Local:** `npm --prefix kelmah-backend run lint -- api-gateway/proxy/job.proxy.js` (proxy file passes; known legacy lint debt remains elsewhere).
2. **Gateway Smoke Test:** After deploying the API gateway, repeat the authentication + job creation curl flow. Expect `201 Job created successfully` (or a validation 400/500 from job-service) instead of 504.
3. **Regression:** Trigger other write endpoints (`POST /api/jobs/:id/apply`, `PATCH /api/jobs/:id/status`) to ensure bodies reach the downstream service.
4. **Monitoring:** Watch Render logs for `[Job Proxy] Proxying ...` entries followed by immediate job-service responses instead of timeouts.

## Follow-up / Next Work
- Frontend still lacks draft persistence or a structured layout for the job creation dialog. See `spec-kit/JOB_CREATION_AUTOSAVE_PLAN_NOV2025.md` for the UI data-flow audit and autosave roadmap.
- Consider extracting a shared `forwardParsedBody(proxyReq, req)` helper for other proxies that sit behind `express.json()`.
