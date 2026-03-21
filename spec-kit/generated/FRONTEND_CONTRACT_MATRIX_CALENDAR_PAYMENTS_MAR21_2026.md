# Frontend Contract Matrix: Calendar and Payments

Date: March 21, 2026
Scope: Track A items 1 and 4 (contract mapping and route inventory).

## Calendar Contract Map

### Frontend callers
- kelmah-frontend/src/modules/calendar/services/eventsService.js

### Gateway-supported routes
- /api/events -> job-service /api/events
- /api/calendar/events -> job-service /api/calendar/events

### Job-service mounts
- /events
- /api/events
- /calendar/events
- /api/calendar/events

### Frontend canonical strategy
- Primary: /events
- Fallback: /calendar/events when primary returns 404/405/501/503
- Envelope normalization: consume success/data/error consistently

## Payment Route Inventory

### Frontend callers reviewed
- kelmah-frontend/src/modules/payment/services/paymentService.js
- kelmah-frontend/src/modules/hirer/services/hirerService.js
- kelmah-frontend/src/modules/admin/services/adminService.js
- kelmah-frontend/src/modules/quickjobs/services/quickJobService.js

### Gateway entrypoint
- /api/payments/* via api-gateway/routes/payment.routes.js

### Canonical routes confirmed for Week 1 alignment
- Wallet: /payments/wallet
- Methods: /payments/methods
- Transactions: /payments/transactions and /payments/transactions/history
- Bills: /payments/bills and /payments/bills/:billId/pay
- Escrow collections/details: /payments/escrows and /payments/escrows/:escrowId
- Escrow actions: /payments/escrows/:escrowId/release and /payments/escrows/:escrowId/refund
- Milestone release: /payments/jobs/:jobId/milestones/:milestoneId/release

### Mismatch fixed in this pass
- hirerService used singular endpoint /payments/escrow/release
- Updated to milestone-specific canonical route /payments/jobs/:jobId/milestones/:milestoneId/release

### Remaining risk notes
- Confirm endpoint parity for provider-specific "confirm" paths in paymentService against payment-service implementation.
- Validate quick-job payment verify and status aliases through gateway in integration pass.

## Track A Extension: QuickJob, Map, Notifications, and Endpoint Source

## Verified route references (gateway-backed)
- QuickJob base: `/api/quick-jobs/*` (gateway) -> `/api/quick-jobs/*` (job-service)
- QuickJob signed upload metadata: `POST /api/quick-jobs/photos/upload-url`
- Legacy job photo upload (compatibility): `POST /api/jobs/upload-photos`
- Job location search: `/api/jobs/location` (canonical) with compatibility fallback `/api/jobs/search/location`
- Worker location search aliases:
	- `/api/search/workers` -> `/api/users/workers/search`
	- `/api/workers/search` -> `/api/users/workers/search`
- Notifications API: `/api/notifications/*` (gateway manual proxy) -> messaging-service `/api/notifications/*`

### QuickJob upload contract (item 16)

### Frontend caller
- kelmah-frontend/src/modules/quickjobs/services/quickJobService.js

### Contract findings
- Legacy upload route `/jobs/upload-photos` is not a guaranteed quick-job contract route.
- Job-service quick-job routes expose `POST /api/quick-jobs/photos/upload-url` for signed upload metadata, while completion expects image URLs.

### Mitigation implemented
- Added upload fallback behavior:
	- first try legacy `/jobs/upload-photos`
	- on contract-style failures (404/405/501/503), fallback to user media upload flow via `/profile/media/upload`
- Normalized fallback upload results to `{ url }` list before completion submission.
- Verified quick-job contract support for signed upload metadata at `/quick-jobs/photos/upload-url` for future direct-provider upload migration.

### Map/search location contract (item 17)

### Frontend caller
- kelmah-frontend/src/modules/map/services/mapService.js

### Contract findings
- Canonical job route exists at `/jobs/location`.
- Some clients historically used `/jobs/search/location`.

### Mitigation implemented
- Added endpoint fallback chain in map service:
	- primary `/jobs/location`
	- fallback `/jobs/search/location`
- Added envelope-safe payload extraction for `{ success, data, error }` responses.

### Notification deep-link coherence (item 18)

### Frontend caller
- kelmah-frontend/src/modules/notifications/services/notificationService.js

### Contract findings
- Backend can emit legacy quick-job links like `/quick-jobs/:id`.
- Frontend routes are normalized around `/quick-job/:jobId`.

### Mitigation implemented
- Added deep-link normalization rules:
	- `/quick-jobs/:id` -> `/quick-job/:id`
	- preserve `/quick-job/:id`
	- map `relatedEntity.type === quick_job` to `/quick-job/:id`

### Endpoint source-of-truth cleanup (item 19)

### Frontend config touched
- kelmah-frontend/src/config/services.js

### Mitigation implemented
- Aligned `API_ENDPOINTS.PAYMENT.PROCESS` to canonical `/payments/transactions` to match environment constants and service behavior.
- Retained canonical payment history endpoint alignment at `/payments/transactions/history` across config sources.

### Contract risk matrix extension (item 20)

Status: extended with Track A 16-20 verification notes and mitigations in this document.
