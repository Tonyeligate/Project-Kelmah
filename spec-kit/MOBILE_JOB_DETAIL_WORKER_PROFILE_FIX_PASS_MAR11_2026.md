# Mobile Job Detail And Worker Profile Fix Pass - March 11 2026

## Scope
- Fix the confirmed public worker profile contract mismatches from the March 11 audit.
- Fix the broken mobile job-detail sticky CTA layout shown in the screenshot.
- Keep the pass focused on routing, data-shape, and mobile interaction stability.

## Acceptance Criteria
- Portfolio and certificate counts render real values instead of `undefined`.
- Availability and owner metrics are sourced from supported payload fields.
- Worker bookmark save/remove behavior is explicit and idempotent.
- Worker profile links use one canonical public path.
- The mobile sticky CTA keeps the bid button, save, and share controls on a coherent responsive layout.

## Mapped File Surface
- `kelmah-frontend/src/modules/worker/components/WorkerProfile.jsx`
- `kelmah-frontend/src/modules/worker/pages/WorkerProfilePage.jsx`
- `kelmah-frontend/src/modules/worker/components/WorkerCard.jsx`
- `kelmah-frontend/src/modules/home/pages/HomePage.jsx`
- `kelmah-frontend/src/modules/jobs/pages/JobDetailsPage.jsx`
- `kelmah-backend/services/user-service/controllers/user.controller.js`
- `spec-kit/STATUS_LOG.md`

## Planned Fixes
- Replace secondary worker-profile array assumptions with normalized data from the public profile payload.
- Separate profile-completion data from profile performance data in the owner view.
- Normalize public worker sharing and navigation onto `/workers/:workerId`.
- Rework the mobile sticky CTA layout so the action controls stay grouped under narrow widths.
- Make bookmark POST and DELETE semantics idempotent in the user controller.

## Implementation Completed
- Reworked `WorkerProfile.jsx` to use the main public profile payload as the authoritative source for skills, portfolio items, certificates, availability, and core stats instead of re-overwriting those sections with mismatched nested-resource envelopes.
- Kept only the genuinely extra secondary calls for work history, profile completeness, review rating, and owner earnings.
- Replaced unsupported owner metric cards with values backed by live payloads: jobs completed, rating, earnings totals, completion percentage, and average response time.
- Normalized worker share links and navigation onto `/workers/:workerId`, while leaving the legacy route in place to redirect cleanly.
- Fixed the worker bookmark flow in both frontend and backend so save/remove operations are explicit and idempotent.
- Reworked the mobile job-detail sticky CTA into a two-group layout so the primary action, save, and share controls stay aligned on one coherent row.

## Validation
- Frontend production build passed via `npm run build` in `kelmah-frontend`.
- Backend module-load check passed for `services/user-service/controllers/user.controller.js` via `node -e "require('./services/user-service/controllers/user.controller.js')"`.