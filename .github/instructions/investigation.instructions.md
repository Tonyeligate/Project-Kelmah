---
description: "Use when investigating bugs, debugging errors, auditing features, or performing systematic code analysis. Covers the investigation-first workflow, dry audit mandate, spec-kit documentation, data flow tracing, and verification protocols."
---
# Kelmah Investigation & Debugging Protocol

## Investigation-First Workflow

Every fix or enhancement follows this flow BEFORE touching code:

1. **Define scope**: Restate the ask, enumerate acceptance criteria
2. **Map file surface**: List every file involved (frontend, gateway, backend, models). No guessing — open and confirm
3. **Trace data flow**: Document UI → state → service → gateway → microservice → controller → model. Note payload shapes and middleware
4. **Audit behavior**: Run diagnostics (curl, health checks) to reproduce the issue
5. **Design the fix**: Describe changes, impacted files, cleanup decisions
6. **Implement**: Focused edits, comments only where non-obvious
7. **Verify**: Re-run diagnostics, update `spec-kit/STATUS_LOG.md`

## Dry Audit Mandate

Before running code or diagnostics, read every file in the identified flow end-to-end:
- Catalogue controllers, services, models, middleware, configs, and frontend consumers
- Note exact file paths
- Only after audit is complete may diagnostics proceed

## Data Flow Tracing Template

```
UI Component: [Component.jsx]
Location: kelmah-frontend/src/modules/[domain]/components/

User Action: [click, input, select]
  ↓
Event Handler: [handleAction() @ line N]
  ↓
State: [Redux dispatch / useState / Context]
  ↓
API Service: [service.js @ line N]
  ↓
API Call: [METHOD /api/endpoint]
  ↓
Gateway: api-gateway/server.js → proxy to service
  ↓
Backend Route: services/[service]/routes/[route].js
  ↓
Controller: services/[service]/controllers/[controller].js @ line N
  ↓
Response: { success: boolean, data: {...} }
  ↓
UI Update: [state change → re-render]
```

## Agent Diagnostics

Agents perform diagnostics themselves — never ask the user to run commands:
- Use terminal to execute curl, health checks, test commands
- Test via API Gateway routes (`/api/*`) through current tunnel
- For LocalTunnel: no special headers needed
- Test credentials: `giftyafisa@gmail.com` / `Vx7!Rk2#Lm9@Qa4` (hirer), `TestUser123!` (other users)

## Database Validation — CHECK DATA FIRST

Before debugging Mongoose operation failures:
1. Connect to MongoDB and inspect actual documents
2. Compare schema `required` fields vs existing data
3. Check enum case sensitivity (schema `'open'` vs data `'Open'`)
4. Validate nested object requirements

Schema/data mismatch is the most common root cause of `Operation buffering timed out`.

## Spec-Kit Protocol

All work must be documented in `spec-kit/`:
- **Before**: Update `STATUS_LOG.md` with current task
- **During**: Document discoveries in relevant spec-kit files
- **After**: Mark tasks COMPLETED ✅ with verification details

Key spec-kit docs: `STATUS_LOG.md`, `REMOTE_SERVER_ARCHITECTURE.md`, `LOCALTUNNEL_PROTOCOL_DOCUMENTATION.md`.

## Common Failure Patterns

| Symptom | Likely Cause | Check |
|---------|-------------|-------|
| 401 on protected endpoint | JWT invalid or expired | Token in header, gateway running |
| 403 "Email not verified" | `isEmailVerified: false` | Set to `true` in DB |
| 404 on valid route | Route shadowed by `/:id` | Route ordering in routes file |
| 503 Service Unavailable | Microservice down | Service health endpoint |
| Mongoose buffering timeout | Schema/data mismatch | Actual DB documents vs schema |
| Empty response from API | Response shape mismatch | Frontend parsing vs backend envelope |
