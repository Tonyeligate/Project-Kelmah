# MED-10 To MED-18 Follow-Up Regression And Validation

**Date**: March 10, 2026  
**Status**: COMPLETED

## Scope

Extend the completed MED-10 to MED-18 remediation with direct revoked-token regression coverage, broader backend/frontend validation, and fixes for any additional live issues surfaced by that wider verification pass.

## Acceptance Criteria

- Shared JWT verification has direct regression coverage for revoked access-token rejection.
- Broader backend validation covers the touched auth/email/security flows without introducing new failures.
- Frontend production build completes successfully on the current post-fix codebase.
- Any newly surfaced failures from this validation pass are dry-audited, fixed at root cause, and documented.

## File Surface

- `kelmah-backend/shared/utils/jwt.js`
- `kelmah-backend/services/auth-service/tests/shared-jwt.test.js`
- `kelmah-backend/services/auth-service/tests/auth.controller.security.test.js`
- `kelmah-backend/api-gateway/routes/auth.routes.test.js`
- `kelmah-backend/package.json`
- `kelmah-frontend/package.json`
- `kelmah-frontend/jest.config.cjs`
- `kelmah-frontend/vite.config.js`
- `kelmah-frontend/src/tests/components/auth/Login.test.jsx`
- `spec-kit/MED_10_18_FOLLOWUP_VALIDATION_MAR10_2026.md`
- `spec-kit/STATUS_LOG.md`

## Data Flow

### Shared JWT Revocation Flow

Signed access token with JTI -> `shared/utils/jwt.verifyAccessToken()` -> `findRevokedTokenByJti()` queries `revoked_tokens` on the active Mongoose connection -> verifier returns decoded claims or throws `JsonWebTokenError('Token revoked')`.

### Backend Verification Flow

Jest suites in auth-service/api-gateway -> route/controller/security assertions -> regression coverage for token handling, email safety, and gateway forwarding.

### Frontend Validation Flow

Jest harness and Vite build entry -> component/render regression checks -> production bundle compilation for the current frontend workspace state.

## Dry-Audit Findings

1. Existing JWT tests cover subject guards and payload preservation only; revoked-token rejection is not directly asserted.
2. Adjacent auth-controller security tests validate email-delivery and password rules, but they do not lock in the shared revoked-token check.
3. Focused frontend auth/search tests are already green, but a broader production build is still required to validate the full post-fix bundle.
4. Broader validation may surface stale harness noise or unrelated workspace drift; only live, source-backed failures should be fixed in this pass.

## Implemented Fixes

1. Added direct shared-JWT regression coverage for revoked-token rejection and disconnected-database fallback behavior in `services/auth-service/tests/shared-jwt.test.js`.
2. Tightened `kelmah-frontend/src/tests/components/auth/Login.test.jsx` so the login shell is explicitly unmounted at the end of each test, removing the lingering lifecycle issue that had previously forced the broader frontend Jest batch to rely on `--forceExit`.

## Verification

- Backend Jest passed from `kelmah-backend/`:
	- `api-gateway/routes/auth.routes.test.js`
	- `services/auth-service/tests/shared-jwt.test.js`
	- `services/auth-service/tests/auth.controller.security.test.js`
	- `services/auth-service/tests/email.service.test.js`
	- `services/user-service/tests/worker-directory.controller.test.js`
- Frontend production build passed from `kelmah-frontend/` with `npm run build`.
- Frontend Jest passed from `kelmah-frontend/` with open-handle detection enabled:
	- `src/modules/search/components/common/JobSearchForm.test.jsx`
	- `src/tests/components/auth/Login.test.jsx`
	- `src/modules/jobs/hooks/useJobsQuery.test.jsx`
	- `src/modules/auth/pages/RegisterPage.test.jsx`
	- `src/modules/search/services/searchService.test.js`

## Final Outcome

1. Shared revoked-token rejection is now directly locked in by regression coverage.
2. The broader backend validation set is green.
3. The frontend production build is green.
4. The previously noted frontend Jest `--forceExit` workaround is no longer reproducible after the login-test cleanup fix.
5. No additional live source regressions were uncovered in this validation pass.