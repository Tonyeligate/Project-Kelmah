# Kelmah Live Auth Register Deploy Blocker — March 7, 2026

**Status**: Local hardening implemented, live redeploy validation pending
**Scope**: Diagnose why deployed `POST /api/auth/register` still returns `phone already exists` after the gateway timeout fixes, then strengthen auth-service recovery so legacy phone index drift can self-heal.

## Success Criteria
- Live gateway registration succeeds when `phone` is omitted.
- Auth-service can recover from legacy phone index drift without manual database cleanup.
- Blank or placeholder phone payloads from clients do not trigger duplicate-key failures.

## Dry Audit File Surface
- `kelmah-backend/api-gateway/routes/auth.routes.js`
- `kelmah-backend/services/auth-service/routes/auth.routes.js`
- `kelmah-backend/services/auth-service/server.js`
- `kelmah-backend/services/auth-service/config/db.js`
- `kelmah-backend/services/auth-service/controllers/auth.controller.js`
- `kelmah-backend/services/auth-service/models/index.js`
- `kelmah-backend/shared/models/User.js`
- `spec-kit/KELMAH_GATEWAY_PUBLIC_AUTH_TIMEOUT_FIX_MAR07_2026.md`

## End-to-End Flow
Native/web register form
→ `POST /api/auth/register`
→ API gateway [kelmah-backend/api-gateway/routes/auth.routes.js](kelmah-backend/api-gateway/routes/auth.routes.js)
→ auth-service `/api/auth/register`
→ validation in [kelmah-backend/services/auth-service/routes/auth.routes.js](kelmah-backend/services/auth-service/routes/auth.routes.js)
→ `register()` in [kelmah-backend/services/auth-service/controllers/auth.controller.js](kelmah-backend/services/auth-service/controllers/auth.controller.js)
→ shared `User` model in [kelmah-backend/shared/models/User.js](kelmah-backend/shared/models/User.js)
→ MongoDB `users` collection + indexes reconciled by [kelmah-backend/services/auth-service/config/db.js](kelmah-backend/services/auth-service/config/db.js)

## Findings
- Live gateway and direct auth-service registration both still return `400 phone already exists` when `phone` is omitted.
- That means the gateway is no longer the blocker; the remaining issue is in auth-service runtime or database index state.
- The source-controlled shared `User` schema only defines a sparse, non-unique phone index, so the live failure is consistent with a stale unique/non-sparse phone index surviving in the deployed environment.
- A direct Atlas inspection was attempted from the workspace, but DNS resolution for the SRV host failed in this environment, so runtime database state could not be confirmed here.

## Local Hardening Implemented
- `kelmah-backend/services/auth-service/config/db.js`
  - Added blank-phone cleanup so persisted `null`, empty-string, and whitespace-only phone fields are unset before index reconciliation.
  - Strengthened reconciliation to drop any stale single-field phone index that is still unique or non-sparse.
  - Exported `reconcileAuthIndexes()` for controller-level recovery.
- `kelmah-backend/services/auth-service/controllers/auth.controller.js`
  - Added `normalizeOptionalPhone()` to treat blank/null/placeholder strings like `"null"` or `"undefined"` as absent.
  - Added duplicate-phone detection that can recognize both `keyPattern.phone` and message-based duplicate-key reports.
  - Added one-shot runtime recovery: if registration hits a duplicate phone error while no usable phone was supplied, auth-service now re-runs index reconciliation and retries user creation once.

## Verification
- Editor diagnostics are clean for:
  - [kelmah-backend/services/auth-service/config/db.js](kelmah-backend/services/auth-service/config/db.js)
  - [kelmah-backend/services/auth-service/controllers/auth.controller.js](kelmah-backend/services/auth-service/controllers/auth.controller.js)
- Live validation before redeploy still shows:
  - `POST https://kelmah-api-gateway-qmd7.onrender.com/api/auth/register` → `400 phone already exists`
  - `POST https://kelmah-auth-service-3zdl.onrender.com/api/auth/register` → `400 phone already exists`
- That confirms the deployed service has not yet been observed running the new recovery logic.
