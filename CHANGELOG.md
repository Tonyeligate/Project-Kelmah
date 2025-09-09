## Changelog

### 2025-09-09

#### Messaging Service (Backend)
- Scoped read updates to the current conversation only to avoid marking unrelated messages as read.
  - File: `kelmah-backend/services/messaging-service/controllers/message.controller.js`
  - Change: Constrained `updateMany` read-status query to conversation participants; enforced authenticated sender for `createMessage`.

- Hardened Socket.IO message handling.
  - File: `kelmah-backend/services/messaging-service/socket/messageSocket.js`
  - Change: Defensive checks for `data` and `attachments`, default-safe content, consistent creation.

#### API Gateway (Messaging Routes)
- Fixed path rewrites to ensure frontend messaging routes map correctly to service routes.
  - File: `kelmah-backend/api-gateway/routes/messaging.routes.js`
  - Change: Explicit rewrites for `/api/messages/conversations[...] → /api/conversations[...]`; removed brittle pathPrefix usage for messages.

#### Frontend (Messaging)
- Aligned conversation creation payload with backend contract.
  - File: `kelmah-frontend/src/modules/messaging/services/messagingService.js`
  - Change: `createConversation(participantId, jobId)` now posts `{ participantIds: [participantId], type: 'direct', jobId }`.

#### User Service (Earlier Session Fixes)
- Replaced placeholder responses with real MongoDB-backed data for dashboards and availability.
  - File: `kelmah-backend/services/user-service/controllers/user.controller.js`
  - Changes: Implemented real metrics, workers list, analytics, availability, and credentials.

#### Utilities & Scripts (Earlier Session Additions)
- Added health checks, environment setup, and startup/test scripts.
  - Files: `kelmah-backend/check-services-health.js`, `kelmah-backend/setup-environment.js`, `kelmah-backend/start-all-services.js`, `kelmah-backend/test-user-service-fixes.js`

---

### Notes
- Ensure `JWT_SECRET` is configured for the messaging-service; both REST and WebSocket paths validate JWT.
- Prefer the API Gateway for all REST (`/api/*`) and WebSocket (`/socket.io`) connections to avoid CORS/auth issues.


