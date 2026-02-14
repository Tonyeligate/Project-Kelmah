# Render Pipeline Minutes Exhausted — Deployment Blocked

**Date**: February 14, 2026  
**Severity**: CRITICAL — Blocks ALL backend deployments  
**Status**: UNRESOLVED ❌

## Root Cause

Render free-tier **pipeline (build) minutes are exhausted**. The Render API events endpoint returns:

```json
{
  "type": "pipeline_minutes_exhausted",
  "timestamp": "2026-02-14T12:11:18Z"
}
```

Every deploy attempt now fails instantly (< 2 seconds) with `build_failed` — the build never actually starts.

## Impact

### Job Update 400 Bug (User-Facing)
- **Deployed code** (commit `9e7a3d6f`): Line 1185 checks `job.status !== "Open"` (capital O)
- **Mongoose schema**: Uses `enum: ["draft", "open", ...]` and `default: "open"` (lowercase)
- **Database**: All 7 jobs have `status: "open"` (lowercase)
- **Result**: `"open" !== "Open"` → `true` → every PUT /api/jobs/:id returns 400

### Fix Exists But Cannot Deploy
- Commit `604ee60b` adds `.toLowerCase()` normalization — fixes the bug
- Commit `0f46e110` contains 12 security/bug fixes from audit sweep
- Both are on GitHub but Render cannot build them

## Deploy History

| Status | Date | Commit | Trigger |
|--------|------|--------|---------|
| **live** | Feb 13, 14:30 | `9e7a3d6f` (JobPostingPage trim fix) | new_commit |
| build_failed | Feb 13, 16:07 | `0e0b5315` | new_commit |
| build_failed | Feb 13, 16:57 | `e4d73d34` | new_commit |
| build_failed | Feb 14, 06:05 | `e4d73d34` | api |
| build_failed | Feb 14, 12:08 | `e4d73d34` | api |
| build_failed | Feb 14, 12:11 | `e4d73d34` | api |

All failures after the first are `pipeline_minutes_exhausted`.

## Attempted Workarounds (All Failed)

1. **Changed build command** to `npm install --workspaces=false` → still `build_failed` (minutes exhausted, command never runs)
2. **Changed build command** to fallback chain `npm install ... || echo build-skip` → same
3. **Cache clear** with `clearCache=clear` → same
4. **Build commands reset** back to standard `npm install` after diagnosis

## Service Configuration (All 7 Services)

| Service | ID | Plan | Start Command |
|---------|-----|------|--------------|
| job | srv-d4l7psje5dus73fka2kg | free | node start-job-service.js |
| gateway | srv-d4l7s42li9vc73e4pmb0 | free | node start-api-gateway.js |
| auth | srv-d4l7ptbe5dus73fka460 | free | node start-auth-service.js |
| user | srv-d4l7pqshg0os73b47a50 | free | node start-user-service.js |
| messaging | srv-d4l7pq0gjchc73aid670 | free | node start-messaging-service.js |
| review | srv-d4l7ppuuk2gs73882aq0 | free | node start-review-service.js |
| payment | srv-d4l7pnili9vc73e4o5cg | free | node start-payment-service.js |

All services: `rootDir=""`, `env=node`, `autoDeploy=yes`, `repo=https://github.com/Tonyeligate/Project-Kelmah`

## Resolution Options

### Option A: Upgrade Render Plan (Recommended, Fastest)
1. Go to https://dashboard.render.com
2. Navigate to team settings → Billing
3. Upgrade to Individual/Starter plan ($7/month) for additional pipeline minutes
4. Trigger manual deploys for all services
5. Downgrade back to free after deploys succeed

### Option B: Wait for Billing Cycle Reset
- Free-tier pipeline minutes reset at the start of each billing cycle
- Could be days to weeks depending on when the cycle started
- All queued commits will auto-deploy when minutes become available (autoDeploy=yes)

### Option C: Deploy via Docker Image (Complex)
1. Build Docker image locally using existing `Dockerfile`
2. Push to Docker Hub or GitHub Container Registry
3. Update Render services to pull from image registry
4. Bypasses pipeline minutes since no Render build needed

## Additional Blocker: Git Push Authentication
- `git push origin main` fails with `fatal: Authentication failed`
- 2 local unpushed commits: `079fff73` (Hirer flow audit), `47c22896` (migrations-mongodb placeholder)
- User needs to re-authenticate with GitHub (PAT or SSH key)

## Current State
- All 7 Render services are running with **old code** from commit `9e7a3d6f`
- Job update, delete operations are broken due to case-sensitivity bug
- All security/audit fixes from Feb 13 are NOT deployed
- Build commands have been reset to standard `npm install`
