# Messaging Full Audit — March 6, 2026

## Scope
- Worker-profile and cross-site messaging CTA routing
- Messaging page deep-link creation/selection
- REST + bridge + gateway + messaging-service send path
- Socket realtime delivery, unread counts, delivery/read ticks, presence
- Platform notification propagation and browser/device notification prerequisites

## Acceptance Criteria
- CTA click opens the intended chat session.
- Bridge endpoints authenticate reliably from a live browser session.
- REST fallback behaves like websocket send: persist + emit realtime updates.
- Presence, unread counts, and delivery/read indicators stay synchronized.
- Media previews show user-friendly labels instead of raw URLs.

## Dry Audit File Surface

### Frontend
- `kelmah-frontend/src/modules/worker/components/WorkerProfile.jsx`
- `kelmah-frontend/src/modules/messaging/pages/MessagingPage.jsx`
- `kelmah-frontend/src/modules/messaging/contexts/MessageContext.jsx`
- `kelmah-frontend/src/modules/messaging/services/messagingService.js`
- `kelmah-frontend/src/modules/messaging/components/common/Message.jsx`
- `kelmah-frontend/src/modules/messaging/components/common/MessageAttachments.jsx`
- `kelmah-frontend/src/modules/messaging/components/common/ConversationList.jsx` (dead code audit only)
- `kelmah-frontend/src/services/websocketService.js`
- `kelmah-frontend/src/modules/notifications/services/notificationService.js`
- `kelmah-frontend/src/modules/notifications/contexts/NotificationContext.jsx`
- `kelmah-frontend/api/create-conversation.js`
- `kelmah-frontend/api/send-message.js`
- root/frontend `vercel.json`

### Gateway / Backend
- `kelmah-backend/api-gateway/routes/messaging.routes.js`
- `kelmah-backend/services/messaging-service/server.js`
- `kelmah-backend/services/messaging-service/routes/conversation.routes.js`
- `kelmah-backend/services/messaging-service/routes/message.routes.js`
- `kelmah-backend/services/messaging-service/routes/notification.routes.js`
- `kelmah-backend/services/messaging-service/controllers/conversation.controller.js`
- `kelmah-backend/services/messaging-service/controllers/message.controller.js`
- `kelmah-backend/services/messaging-service/controllers/notification.controller.js`
- `kelmah-backend/services/messaging-service/socket/messageSocket.js`
- `kelmah-backend/services/messaging-service/models/Conversation.js`
- `kelmah-backend/services/messaging-service/models/Message.js`
- `kelmah-backend/services/messaging-service/middlewares/auth.middleware.js`
- `kelmah-backend/services/messaging-service/utils/validation.js`

## End-to-End Data Flow

### CTA → Chat Session
1. `WorkerProfile.jsx` resolves recipient ID and navigates to `/messages?recipient=<userId>`.
2. `MessagingPage.jsx` parses `recipient`/`conversation` params.
3. `MessageContext.createConversation()` calls `messagingService.createDirectConversation()`.
4. `messagingService` tries the Vercel bridge first, then gateway fallback.
5. Backend conversation controller returns the conversation; frontend reloads conversations and selects the full record.

### Send Message
1. `MessagingPage.jsx` delegates send to `MessageContext.sendMessage()`.
2. If websocket is healthy, `send_message` is emitted with optimistic UI.
3. On websocket failure or degraded mode, `messagingService.sendMessage()` uses bridge/gateway REST.
4. Messaging service persists the message and updates conversation unread counts.
5. Socket/message controller emits room updates and notification events.
6. `MessageContext` updates the active chat and conversation list; `NotificationContext` receives `notification` events for platform notifications.

## Runtime Verification Performed
- Authenticated against live gateway using `giftyafisa@gmail.com`.
- Verified deployed bridge endpoints:
	- `POST /api/create-conversation` → 200
	- `POST /api/send-message` → 201
- Confirmed bridge/gateway routing itself is now healthy; remaining user-facing failures came from frontend token handling and backend/socket consistency.

## Critical / High Findings and Fixes

### 1. Critical — Bridge requests could 401 while the session still looked logged in
- **Files**: `kelmah-frontend/src/modules/messaging/services/messagingService.js`
- **Cause**: Bridge calls read storage directly and had no token-refresh retry. In live sessions, bridge POSTs could fail with 401 while normal API calls recovered via refresh logic.
- **Fix**: Bridge calls now pull token from Redux first, then secure storage, and retry once after refresh when a bridge returns 401.

### 2. Critical — REST message creation allowed arbitrary conversation IDs and emitted no realtime updates
- **Files**: `kelmah-backend/services/messaging-service/controllers/message.controller.js`
- **Cause**:
	- `conversationId` path trusted `findById()` without confirming the sender was a participant.
	- REST-created messages were persisted but not broadcast to socket rooms, so degraded-mode sends lacked live chat updates.
- **Fix**:
	- Enforced sender membership on `conversationId` lookups.
	- Added recipient resolution guard.
	- Broadcast `new_message` / `receive_message` / `message_delivered` from the controller.
	- Returned normalized conversation metadata in the REST response.

### 3. Critical — Socket send path did not increment backend unread counts
- **Files**: `kelmah-backend/services/messaging-service/socket/messageSocket.js`
- **Cause**: Websocket sends updated `lastMessage` only; recipient unread counters stayed stale.
- **Fix**: Increment unread count for the recipient before saving the conversation.

### 4. Critical — Presence and offline notification logic used mixed ObjectId/string keys
- **Files**: `kelmah-backend/services/messaging-service/socket/messageSocket.js`
- **Cause**: `connectedUsers` used one ID shape while presence/offline filters used another. Online users could be treated as offline, which broke status indicators and delivery logic.
- **Fix**: Normalized socket/user IDs to strings across `set`, `get`, `has`, `delete`, and presence broadcasts.

### 5. High — Duplicate messages could appear because both `new_message` and `receive_message` were handled identically
- **Files**: `kelmah-frontend/src/modules/messaging/contexts/MessageContext.jsx`
- **Cause**: Backend emits alias events; frontend appended both without deduping by persisted message ID.
- **Fix**: Deduplicated incoming messages by server ID and replaced optimistic placeholders instead of blindly appending.

### 6. High — Socket bootstrap could overwrite conversation names/avatars with skeletal data
- **Files**: `kelmah-frontend/src/modules/messaging/contexts/MessageContext.jsx`, `kelmah-backend/services/messaging-service/socket/messageSocket.js`
- **Cause**: The `connected` socket payload originally contained only raw participant IDs. When it arrived after REST loading, it could replace richer conversation metadata and leave blank chat headers.
- **Fix**:
	- Backend now populates participant names/avatars and last-message metadata in the bootstrap payload.
	- Frontend no longer overwrites an already-loaded rich conversation list with poorer socket bootstrap data.

### 7. High — Conversation join race could load messages into the wrong chat
- **Files**: `kelmah-frontend/src/modules/messaging/contexts/MessageContext.jsx`
- **Cause**: `socket.once('conversation_joined')` was added per selection without clearing stale listeners/timeouts.
- **Fix**: Added explicit handler refs and timeout cleanup so only the current conversation can resolve the join event.

### 8. Medium — Media messages could still render as plain text in component-level rendering
- **Files**: `kelmah-frontend/src/modules/messaging/components/common/Message.jsx`
- **Cause**: The renderer switched on `message.type`, but the normalized data shape uses `message.messageType`.
- **Fix**: Added `effectiveType` fallback to `message.messageType` / `message.fileType`.

## Remaining Audit Notes

### Dead / risky code
1. **Medium** — `ConversationList.jsx` is still dead code and diverges from the live inline conversation list in `MessagingPage.jsx`. Keeping both increases regression risk.
2. **Medium** — Notifications still use a separate socket connection path (`notificationService.connect`) instead of the shared websocket singleton. This duplicates connection/auth complexity and should be consolidated later.
3. **Low** — Messaging files contain style/prettier debt that does not block runtime behavior but slows future auditing.

## Performance / Reliability Quick Wins
1. Reuse the shared websocket connection for notifications to remove duplicate transports.
2. Centralize conversation-item rendering into one component to eliminate dead-code drift.
3. Add dedicated tests for:
	 - REST fallback send emits socket updates
	 - unread count increment/reset
	 - bridge 401 refresh retry
	 - ObjectId/string presence normalization

## Validation Status
- `get_errors` clean on all edited files.
- `node --check` clean on edited backend files.
- Live deployed bridge endpoints confirmed healthy before this final local patch set.

