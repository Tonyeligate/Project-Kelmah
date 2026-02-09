# Messaging Sector Dry Audit – October 1, 2025

## Scope & Inventory

### Backend Messaging Service (`kelmah-backend/services/messaging-service/`)
- `server.js`
- Controllers: `controllers/{conversation.controller.js,message.controller.js,notification.controller.js}`
- Routes: `routes/{conversation.routes.js,message.routes.js,notification.routes.js,attachments.routes.js}`
- Models: `models/{Conversation.js,Message.js,Notification.js,NotificationPreference.js,index.js}`
- Middlewares: `middlewares/{auth.js,rateLimiter.js}`
- Socket handlers: `socket/{messageSocket.js,notificationSocket.js,index.js}`
- Services: `services/{conversation.service.js,message.service.js,notification.service.js,attachment.service.js}`
- Workers/Jobs: `workers/{notificationWorker.js}`
- Utilities: `utils/{logger.js,queue.js,notificationTemplates.js}`
- Tests: `tests/{conversation.test.js,message.test.js}`

### API Gateway Integration (`kelmah-backend/api-gateway/routes/messaging.routes.js`)
- Authenticated proxy for `/api/messages` and `/api/conversations`
- Path rewrites for REST conversations/messages mapping
- Attachment aliases and notification routes

### Shared Dependencies
- Shared models: `shared/models/{Conversation.js,Message.js,Notification.js,User.js}`
- Shared middlewares: `shared/middlewares/{rateLimiter.js,serviceTrust.js}`
- Shared utils: `shared/utils/{jwt.js}` (token validation for sockets)

### Frontend Messaging Module (`kelmah-frontend/src/modules/messaging/`)
- Components: `components/{RealTimeChat.jsx,Message.jsx,common/*}`
- Contexts: `contexts/MessageContext.jsx`
- Hooks: `hooks/{useRealtimeMessaging.js,useChat.js,useAttachments.js,useAuth.js}`
- Pages: `pages/{MessagingPage.jsx,SimpleMessagingPage.jsx}`
- Services: `services/{chatService.js,messagingService.js,messageService.js}`
- Shared clients: `modules/common/services/axios.js`, `utils/serviceHealthCheck.js`

### Cross-Sector Touchpoints
- User Service worker discovery (`user-service/controllers/worker.controller.js`) references messaging notifications
- Job Service contract/job matching triggers messaging notifications (`job-service/services/notification.service.js` if present)
- Frontend notifications module consumes messaging notification endpoints

---

## Findings & Observations

### 1. Duplicate Message Model Definitions
- Local `messaging-service/models/Message.js` diverges from shared `shared/models/Message.js` (recipient fields, attachment metadata, encryption).
- Shared index still exports `Message`; other services may instantiate the leaner schema, creating conflicting mongoose model definitions at runtime.
- **Action:** Decide on canonical schema. Either (a) merge extended fields into shared model and deprecate local version or (b) rename local schema (e.g., `ExtendedMessage`) to avoid collision and update imports accordingly.

### 2. Redundant Frontend Service Layer
- `chatService.js` and `messagingService.js` both wrap REST messaging endpoints with overlapping methods.
- `messageService.js` remains as deprecated stub but still exported.
- **Action:** Consolidate into a single service API (prefer `messagingService`), delete deprecated module, and update all hooks/components to use unified client.

### 3. Path Rewrite Debt in Gateway vs Service
- Gateway rewrites `/api/messages/conversations/:id/messages` to `/api/messages/conversation/:id`, but backend routes expose `/api/messages/conversations/:id/messages` (plural). Double rewrite increases maintenance risk.
- **Action:** Align backend route signatures with gateway (prefer canonical REST: `/api/messages/conversations/:id/messages`) and remove regex rewrites where possible.

### 4. Attachment Upload Surface Area
- Gateway exposes `/api/messages/attachments/upload` and `/api/messages/:conversationId/attachments`, yet service’s `routes/attachments.routes.js` mounts under `/api/attachments`. Need confirmation the proxy paths resolve correctly.
- **Action:** Trace attachment routes end-to-end; add explicit tests to ensure uploads succeed through gateway.

### 5. Socket vs REST Feature Parity
- Socket handlers (`socket/messageSocket.js`) reference shared `jwt` utility but no centralized registry ensures REST controllers and sockets share identical validation logic.
- **Action:** Introduce shared auth middleware for socket handshake (wrap `verifyAccessToken`) and document fallback behaviour in spec-kit.

### 6. Notification Duplication
- Backend exports `Notification` from both shared and local models (shared already provides a notification schema).
- `NotificationPreference` is service-specific; ensure controllers import via `models/index.js` to avoid cross-service duplicates (confirmed OK, but note in consolidation plan).

### 7. Missing Integration Tests for Critical Paths
- Only basic Jest tests exist; nothing covers conversation creation → message send → notification broadcast.
- **Action:** Add integration tests using supertest/socket.io-client to validate conversation lifecycle and ensure no regressions post refactor.

### 8. Frontend Hook Redundancy
- `useRealtimeMessaging.js` and `useChat.js` both handle socket lifecycle with overlapping logic.
- **Action:** Merge hooks or clearly separate responsibilities (one for WebSocket connection, another for state management) to avoid stale codepaths.

---

## Recommended Remediation Tasks
1. **Model Consolidation:** Update shared `Message` schema with extended fields; remove local duplicate or rename to avoid Mongoose overwrite warnings.
2. **Frontend Service Cleanup:** Replace `chatService` usage with `messagingService` across components; delete `chatService.js` & `messageService.js` once migration completes.
3. **Gateway Alignment:** Refactor messaging gateway routes to drop regex rewrites after backend route normalization; add automated test verifying GET/POST message endpoints.
4. **Attachment Flow Verification:** Write smoke test hitting `/api/messages/attachments/upload` through gateway, ensuring service responds with expected payload and S3 integration stubs remain intact.
5. **Socket Auth Hardening:** Extract shared socket auth helper from messaging service into `shared/utils/socketAuth.js`; update both messaging and notification sockets to use consolidated logic.
6. **Integration Test Suite:** Create `messaging-service/tests/integration/conversation.lifecycle.test.js` covering conversation creation, message send, read receipts, and notification dispatch.
7. **Hook Refactor:** Produce a single `useMessaging` hook exposing send/receive APIs and unify context usage.

---

## Next Steps
- Prioritize model consolidation before further feature work to avoid runtime schema conflicts.
- Log remediation issues in `STATUS_LOG.md` once scheduled/fixed.
- Proceed to Job sector audit after messaging clean-up tasks are triaged.
