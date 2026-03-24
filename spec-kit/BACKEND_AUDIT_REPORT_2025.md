# Kelmah Backend Audit Report — Payment, Review, Messaging & Shared Code

**Date**: 2025  
**Scope**: `services/payment-service/`, `services/review-service/`, `services/messaging-service/`, `shared/`  
**Categories**: Security · Bugs · Performance · Maintainability

---

## CRITICAL

### CRIT-01 · Wallet model `addFunds` / `deductFunds` are not atomic — double-spend risk
| | |
|---|---|
| **Service** | Payment |
| **File** | [services/payment-service/models/Wallet.js](../kelmah-backend/services/payment-service/models/Wallet.js#L86-L107) |
| **Type** | Security / Race Condition |

`addFunds()` and `deductFunds()` read the balance into memory, mutate it, then call `this.save()`. Two concurrent calls can read the same balance and both succeed, crediting or debiting the wrong amount.

```js
// Wallet.js — current code (non-atomic)
WalletSchema.methods.addFunds = async function (amount, transaction) {
  this.balance += amount;              // in-memory mutation
  // ...
  return this.save();                  // save race
};

WalletSchema.methods.deductFunds = async function (amount, transaction) {
  if (this.balance < amount) {         // in-memory check — stale
    throw new Error("Insufficient funds");
  }
  this.balance -= amount;
  // ...
  return this.save();
};
```

**Impact**: Financial loss. Concurrent escrow releases or webhook completions calling `addFunds` can over-credit. `deductFunds` can overdraw.

**Fix**: Replace with `findOneAndUpdate` using `$inc` and `$gte` guard, consistent with how `wallet.controller.js` `withdraw()` already does it:

```js
WalletSchema.statics.atomicAddFunds = async function (userId, amount, transaction) {
  return this.findOneAndUpdate(
    { user: userId },
    {
      $inc: { balance: amount, 'metadata.totalEarnings': amount },
      $push: { transactionHistory: { transaction: transaction._id, type: 'credit', amount, timestamp: new Date() } },
      $set: { 'metadata.lastTransactionDate': new Date() }
    },
    { new: true }
  );
};
```

**Note**: `releaseEscrow`, `refundEscrow`, and `releaseMilestonePayment` all call the non-atomic `addFunds` instance method.

---

### CRIT-02 · `/health/reconcile` is unauthenticated and calls `transaction.controller.reconcile` with a fake user
| | |
|---|---|
| **Service** | Payment |
| **File** | [services/payment-service/server.js](../kelmah-backend/services/payment-service/server.js#L211-L225) |
| **Type** | Security — Missing Auth |

```js
app.post('/health/reconcile', (req, res) => {
  // ... calls controller.reconcile with
  //   { query: { since, limit }, user: { _id: 'scheduler' } }
});
```

Anyone on the network can trigger reconciliation. The fake `{ _id: 'scheduler' }` user object may bypass ownership checks inside the controller. Since the route sits outside any `verifyGatewayRequest` middleware, it is directly reachable.

**Fix**: Protect with a shared secret header or move behind `verifyGatewayRequest`.

---

### CRIT-03 · Escrow `refundEscrow` lacks a MongoDB session — partial writes on failure
| | |
|---|---|
| **Service** | Payment |
| **File** | [services/payment-service/controllers/escrow.controller.js](../kelmah-backend/services/payment-service/controllers/escrow.controller.js#L112-L163) |
| **Type** | Bug / Data Integrity |

`releaseEscrow` correctly wraps its multi-document writes in a Mongoose session+transaction. `refundEscrow` does **not** — a crash between `Transaction.save()` and `escrow.save()` will leave the wallet credited but the escrow still marked as `refunding`, with no rollback.

**Fix**: Wrap `refundEscrow` in a MongoDB session identical to `releaseEscrow`.

---

### CRIT-04 · Review schema missing `reporters` field — `$addToSet` writes to an undeclared path
| | |
|---|---|
| **Service** | Review |
| **File** | [services/review-service/models/Review.js](../kelmah-backend/services/review-service/models/Review.js) — field absent |
| **Controller** | [controllers/review.controller.js](../kelmah-backend/services/review-service/controllers/review.controller.js#L420-L450) |
| **Type** | Bug |

`reportReview` uses `$addToSet: { reporters: userId }`, but the Review schema has no `reporters` array. In `strict` mode (Mongoose default), the field is silently ignored — meaning **reports are never persisted** and the threshold logic never triggers.

```js
// Review.js - field NOT defined
// Controller - writes to it:
const review = await Review.findByIdAndUpdate(
  reviewId,
  { $addToSet: { reporters: userId } },
  { new: true }
);
// review.reporters is always undefined → threshold never reached
```

**Fix**: Add to the schema:
```js
reporters: [{ type: Schema.Types.ObjectId, ref: 'User' }],
```

---

### CRIT-05 · `/api/notifications/system` endpoint is accessible by any authenticated user
| | |
|---|---|
| **Service** | Messaging |
| **File** | [services/messaging-service/routes/notification.routes.js](../kelmah-backend/services/messaging-service/routes/notification.routes.js#L24) |
| **Controller** | [controllers/notification.controller.js](../kelmah-backend/services/messaging-service/controllers/notification.controller.js#L290-L359) |
| **Type** | Security — Authorization Bypass |

`POST /system` is meant "for inter-service use" but has **no admin or service-trust guard**. Any gateway-authenticated user can create system notifications for arbitrary recipients, enabling phishing/social-engineering within the platform.

**Fix**: Add `requireAdmin` or a dedicated `requireServiceTrust` middleware to the route.

---

## HIGH

### HIGH-01 · `Wallet.paymentMethods.type` enum is outdated — mobile money writes rejected
| | |
|---|---|
| **Service** | Payment |
| **File** | [services/payment-service/models/Wallet.js](../kelmah-backend/services/payment-service/models/Wallet.js#L31-L35) |
| **Type** | Bug |

Enum allows `["credit_card", "bank_account", "paypal"]` but the platform supports `mtn_momo`, `vodafone_cash`, `airteltigo`, `paystack_card`, etc. Any attempt to add these payment methods via `wallet.addPaymentMethod()` will throw a Mongoose validation error.

**Fix**: Extend the enum (or remove it and validate in the controller).

---

### HIGH-02 · `escrow.releaseMilestonePayment` and `completeMilestone` lack atomic guards
| | |
|---|---|
| **Service** | Payment |
| **File** | [services/payment-service/controllers/escrow.controller.js](../kelmah-backend/services/payment-service/controllers/escrow.controller.js#L168-L252) |
| **Type** | Race Condition |

Unlike `releaseEscrow` (which uses a session + `findOneAndUpdate` lock), `releaseMilestonePayment`:
- Reads `escrow` → checks `milestone.status` in memory → saves.
- Two concurrent requests can both read `status: 'pending'` and double-release the milestone.

**Fix**: Use `findOneAndUpdate` with a `milestones.status: 'pending'` guard (or wrap in a session).

---

### HIGH-03 · Error messages leaked to clients in multiple routes
| | |
|---|---|
| **Services** | Payment, Messaging |
| **Type** | Security — Information Disclosure |

The following locations return raw `error.message` / `e.message` to clients, potentially exposing internal stack details, database names, or provider secrets:

| Location | Code |
|---|---|
| [bill.controller.js](../kelmah-backend/services/payment-service/controllers/bill.controller.js#L19) | `details: error.message` |
| [bill.controller.js](../kelmah-backend/services/payment-service/controllers/bill.controller.js#L47) | `details: error.message` |
| [payoutAdmin.controller.js](../kelmah-backend/services/payment-service/controllers/payoutAdmin.controller.js#L10) | `message: e.message` |
| [payoutAdmin.controller.js](../kelmah-backend/services/payment-service/controllers/payoutAdmin.controller.js#L55) | `message: e.message` |
| [payoutAdmin.controller.js](../kelmah-backend/services/payment-service/controllers/payoutAdmin.controller.js#L67) | `message: e.message` |
| [payments.routes.js L155](../kelmah-backend/services/payment-service/routes/payments.routes.js#L155) | Paystack initialize: `message: err.message` |
| [payments.routes.js L163](../kelmah-backend/services/payment-service/routes/payments.routes.js#L163) | Paystack verify: `message: err.message` |
| [message route `/:messageId/read`](../kelmah-backend/services/messaging-service/routes/message.routes.js) | `e.message` on 500 |

**Fix**: Return a generic message. Log the real error server-side.

---

### HIGH-04 · `addReaction` does not verify user is a conversation participant
| | |
|---|---|
| **Service** | Messaging |
| **File** | [services/messaging-service/controllers/message.controller.js](../kelmah-backend/services/messaging-service/controllers/message.controller.js#L246-L270) |
| **Type** | Security — IDOR |

```js
exports.addReaction = async (req, res) => {
  const message = await Message.findById(messageId);
  // ❌ No check that the user is a participant in the message's conversation
  message.reactions.push({ emoji, user: getUserId(req) });
  await message.save();
};
```

Any authenticated user can add reactions to messages in conversations they do not belong to. Same issue in `removeReaction`.

**Fix**: Look up the conversation and verify `participants.$in` before allowing the operation.

---

### HIGH-05 · `updateConversation` lets any participant replace the entire participants array
| | |
|---|---|
| **Service** | Messaging |
| **File** | [services/messaging-service/controllers/conversation.controller.js](../kelmah-backend/services/messaging-service/controllers/conversation.controller.js#L290-L340) |
| **Type** | Security — Privilege Escalation |

Any participant can send `{ participants: [...] }` in the request body and fully overwrite the group membership, including removing the original creator or adding external users without consent. There is no "owner" or "admin" concept for group conversations.

**Fix**: Restrict participant modification to the conversation creator, or limit to `$addToSet` / `$pull` with per-user validation.

---

### HIGH-06 · Review status defaults to `'approved'` — all reviews auto-approved
| | |
|---|---|
| **Service** | Review |
| **File** | [services/review-service/models/Review.js](../kelmah-backend/services/review-service/models/Review.js#L45-L50) |
| **Type** | Security / Trust |

```js
status: {
  type: String,
  enum: ['pending', 'approved', 'rejected', 'flagged'],
  default: 'approved',   // ⚠️ no moderation
},
```

Every submitted review is immediately visible. Abusive or fraudulent reviews are publicly displayed before any moderation.

**Fix**: Default to `'pending'` and require moderation (or implement an automated content filter before auto-approving).

---

### HIGH-07 · Admin `bulk-moderate` has no size cap on the `ids` array
| | |
|---|---|
| **Service** | Review |
| **File** | [services/review-service/routes/admin.routes.js](../kelmah-backend/services/review-service/routes/admin.routes.js#L93-L116) |
| **Type** | DoS / Performance |

```js
const { ids = [], status, note } = req.body;
// No limit — an admin (or compromised admin token) can send millions of IDs
await Review.updateMany({ _id: { $in: ids } }, { /* ... */ });
```

**Fix**: Cap `ids.length` (e.g., max 200) and reject with 400 if exceeded.

---

### HIGH-08 · Socket `connectedUsers` Map stores only the last socket per user — multi-tab/device loss
| | |
|---|---|
| **Service** | Messaging |
| **File** | [services/messaging-service/socket/messageSocket.js](../kelmah-backend/services/messaging-service/socket/messageSocket.js#L153) |
| **Type** | Bug |

```js
this.connectedUsers.set(userId, socket.id);  // overwrites previous socket
```

When a user opens a second tab or device, the first socket ID is silently discarded. The first tab stops receiving real-time events. On disconnect of the second tab, the user is marked "offline" even though the first tab is still connected.

**Fix**: Change to `Map<userId, Set<socketId>>` and only mark offline when the set is empty.

---

### HIGH-09 · Stripe webhook idempotency key mismatch
| | |
|---|---|
| **Service** | Payment |
| **File** | [services/payment-service/routes/webhooks.routes.js](../kelmah-backend/services/payment-service/routes/webhooks.routes.js#L21-L28) |
| **Type** | Bug |

```js
// Checks idempotency by event.id:
const existing = await WebhookEvent.findOne({ provider: 'stripe', reference: event.id });
// But stores with event.data.object.id:
const stored = await WebhookEvent.create({
  reference: event.data?.object?.id,  // ← different value
});
```

This means the idempotency check will **never** find a previous delivery (it searches by `event.id` but the stored document has `event.data.object.id` as its reference). Duplicate webhook deliveries will be processed again.

**Fix**: Use the same key for both lookup and storage. `event.id` is the stable, unique Stripe event identifier.

---

### HIGH-10 · Review-service error handler exposes stack trace in development
| | |
|---|---|
| **Service** | Review |
| **File** | [services/review-service/server.js](../kelmah-backend/services/review-service/server.js#L316-L323) |
| **Type** | Security — Information Disclosure |

```js
app.use((err, req, res, next) => {
  res.status(statusCode).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});
```

`err.message` is **always** sent regardless of environment. Only the stack is gated by `development`. This means production clients receive raw error messages.

**Fix**: Return a generic message in production; log the real message server-side.

---

## MEDIUM

### MED-01 · `wallet.controller.getTransactionHistory` has no limit cap
| | |
|---|---|
| **Service** | Payment |
| **File** | [services/payment-service/controllers/wallet.controller.js](../kelmah-backend/services/payment-service/controllers/wallet.controller.js#L306-L315) |
| **Type** | Performance / DoS |

```js
const { page = 1, limit = 20 } = req.query;
// parseInt not called, and no Math.min() cap
.limit(parseInt(limit))   // user can send limit=999999
```

**Fix**: `const safeLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));`

---

### MED-02 · `getWorkerReviews` / `getJobReviews` / `getUserReviews` accept unbounded `limit`
| | |
|---|---|
| **Service** | Review |
| **File** | [services/review-service/controllers/review.controller.js](../kelmah-backend/services/review-service/controllers/review.controller.js#L122-L160) |
| **Type** | Performance / DoS |

```js
const { limit = 10 } = req.query;
.limit(parseInt(limit))     // no cap
```

**Fix**: Add `Math.min(100, ...)` guard.

---

### MED-03 · `bill.controller.getBills` for admin returns all bills with no pagination
| | |
|---|---|
| **Service** | Payment |
| **File** | [services/payment-service/controllers/bill.controller.js](../kelmah-backend/services/payment-service/controllers/bill.controller.js#L6-L9) |
| **Type** | Performance |

```js
if (req.user.role === "admin") {
  bills = await Bill.find().sort({ dueDate: 1 });  // unbounded
}
```

**Fix**: Add pagination (`skip`/`limit`) and a `.lean()`.

---

### MED-04 · Conversation `incrementUnreadCount` / `resetUnreadCount` are non-atomic
| | |
|---|---|
| **Service** | Messaging |
| **File** | [services/messaging-service/models/Conversation.js](../kelmah-backend/services/messaging-service/models/Conversation.js#L60-L76) |
| **Type** | Data Integrity |

Both methods mutate the in-memory document and require a separate `.save()`. Under concurrent message arrivals the in-memory count can become stale, losing increments.

**Fix**: Use `Conversation.updateOne({ _id, 'unreadCounts.user': userId }, { $inc: { 'unreadCounts.$.count': 1 } })` for atomic increments.

---

### MED-05 · Socket `handleConnection` joins ALL user conversations — slow for power users
| | |
|---|---|
| **Service** | Messaging |
| **File** | [services/messaging-service/socket/messageSocket.js](../kelmah-backend/services/messaging-service/socket/messageSocket.js#L158-L168) |
| **Type** | Performance |

```js
const conversations = await Conversation.find({
  participants: { $in: [userId] },
});    // no limit, no lean, fetches full documents

conversations.forEach((conversation) => {
  socket.join(`conversation_${conversation.id}`);
});
```

A user with hundreds of conversations will trigger a large DB query and hundreds of Socket.IO room joins on **every connection**.

**Fix**: Use `.select('_id').lean()`, consider paginating or lazy-joining rooms on demand.

---

### MED-06 · Socket `broadcastUserStatus` queries DBS on every status change
| | |
|---|---|
| **Service** | Messaging |
| **File** | [services/messaging-service/socket/messageSocket.js](../kelmah-backend/services/messaging-service/socket/messageSocket.js) |
| **Type** | Performance |

Each online/offline/away status change queries `Conversation.find(...)` to determine which rooms to broadcast to. For frequent status changes (e.g., focus/blur events), this creates unnecessary DB load.

**Fix**: Cache user → conversation-room mapping in memory (invalidated on join/leave).

---

### MED-07 · Missing `.lean()` on several read-only queries
| | |
|---|---|
| **Services** | Payment, Review, Messaging |
| **Type** | Performance |

The following `find()` calls return full Mongoose documents when plain objects would suffice:

- `escrow.controller.js` → `getEscrowDetails` (returns populated escrows)
- `wallet.controller.js` → `getTransactionHistory` (`.populate(...)` without `.lean()`)
- `message.controller.js` → `deleteMessage` / `editMessage` (read for ownership check — could use `findOneAndDelete` directly)
- `socket/messageSocket.js` → `handleConnection` conversations query

**Fix**: Append `.lean()` to queries where the result is only read/serialized.

---

### MED-08 · `fundEscrow` creates an escrow record without deducting the hirer's wallet
| | |
|---|---|
| **Service** | Payment |
| **File** | [services/payment-service/controllers/escrow.controller.js](../kelmah-backend/services/payment-service/controllers/escrow.controller.js#L90-L110) |
| **Type** | Design / Logic Gap |

`fundEscrow` creates a `pending` escrow but never deducts from the hirer's wallet or initiates a payment. The escrow exists in isolation — if a webhook later activates it, the funds were never actually secured.

**Impact**: Depends on the payment flow. If a separate payment step funds the escrow via webhook, this is by design. But no comment or cross-reference explains the intended flow — potential logic gap.

**Recommendation**: Document clearly OR add wallet deduction / payment initiation.

---

### MED-09 · `Transaction.calculateFees` has a side-effect: it calls `this.save()`
| | |
|---|---|
| **Service** | Payment |
| **File** | `services/payment-service/models/Transaction.js` |
| **Type** | Maintainability / Surprise |

A method named `calculateFees` that also persists the document is unexpected. Callers that invoke it inside a larger transaction can get double-saves or conflict with sessions.

**Fix**: Separate calculation from persistence.

---

### MED-10 · Messaging service starts HTTP/WebSocket server before MongoDB connects
| | |
|---|---|
| **Service** | Messaging |
| **File** | [services/messaging-service/server.js](../kelmah-backend/services/messaging-service/server.js#L558-L580) |
| **Type** | Reliability |

```js
server.listen(PORT, () => { /* started */ });
// MongoDB connects in background; may fail
```

If MongoDB is unavailable, the service accepts WebSocket connections but all DB operations fail. Socket handlers will emit generic errors to users rather than rejecting the connection cleanly.

**Recommendation**: Consider a readiness check and reject socket auth until DB is connected, or emit a degraded-mode event to clients.

---

## LOW

### LOW-01 · Payment service error handler leaks `err.message` in development mode
| | |
|---|---|
| **Service** | Payment |
| **File** | [services/payment-service/server.js](../kelmah-backend/services/payment-service/server.js#L233-L238) |
| **Type** | Maintainability |

```js
error: process.env.NODE_ENV === "development" ? err.message : undefined,
```

While gated by environment, `NODE_ENV` may not be set consistently across all deployment targets. Consider always masking.

---

### LOW-02 · `paymentMethod.type` enum in `Transaction.js` may be misaligned with providers
| | |
|---|---|
| **Service** | Payment |
| **File** | `services/payment-service/models/Transaction.js` |
| **Type** | Maintainability |

Check that the `paymentMethod.type` enum includes `mtn_momo`, `vodafone_cash`, `airteltigo_money`, etc. to match the providers actually used.

---

### LOW-03 · Review service mounts some routes both inline and via router file
| | |
|---|---|
| **Service** | Review |
| **File** | [services/review-service/server.js](../kelmah-backend/services/review-service/server.js#L240-L308) |
| **Type** | Maintainability |

Routes are defined with `app.post('/api/reviews', ...)` directly in `server.js` AND the `admin.routes.js` router is mounted at `/api/admin`. While there is no current shadowing, this split makes it hard to reason about the full route table.

**Recommendation**: Move all routes into router files and mount them from `server.js`.

---

### LOW-04 · `shared/middlewares/rateLimiter.js` allows through on error
| | |
|---|---|
| **Service** | Shared |
| **File** | [shared/middlewares/rateLimiter.js](../kelmah-backend/shared/middlewares/rateLimiter.js) |
| **Type** | Resilience |

```js
catch (error) {
  // On error, allow request through to not break service
  next();
}
```

This is a deliberate fail-open design. However, if the rate limiter throws consistently (e.g., memory pressure), all rate controls are silently disabled.

**Recommendation**: Log at `warn` level when this fallback triggers (may already be done; verify).

---

### LOW-05 · Messaging auth middleware debug logging exposes token info in development
| | |
|---|---|
| **Service** | Messaging |
| **File** | [services/messaging-service/middlewares/auth.middleware.js](../kelmah-backend/services/messaging-service/middlewares/auth.middleware.js) |
| **Type** | Security (low risk — development only) |

Debug-level logging prints decoded JWT payload fields. Ensure this is disabled in staging/production environments.

---

### LOW-06 · `http.js` client `validateStatus` accepts 4xx as non-error
| | |
|---|---|
| **Service** | Shared |
| **File** | [shared/utils/http.js](../kelmah-backend/shared/utils/http.js#L7) |
| **Type** | Maintainability |

```js
validateStatus: (s) => s >= 200 && s < 500,
```

This means 4xx responses do **not** throw — callers must check `response.status` themselves. If not, errors like 401/403 from downstream services are silently treated as success.

**Recommendation**: Document this behaviour clearly, or let callers opt in.

---

### LOW-07 · Webhook routes lack rate limiting
| | |
|---|---|
| **Service** | Payment |
| **File** | [services/payment-service/routes/webhooks.routes.js](../kelmah-backend/services/payment-service/routes/webhooks.routes.js) |
| **Type** | Resilience |

Stripe and Paystack webhook endpoints have no rate limiter. A misbehaving provider or replay attack could flood the service.

**Recommendation**: Add a generous rate limit (e.g., 200 req/min) to prevent abuse without blocking legitimate webhooks.

---

### LOW-08 · `getWallet` populates full `transactionHistory.transaction` with sender/recipient — data exposure risk
| | |
|---|---|
| **Service** | Payment |
| **File** | [services/payment-service/controllers/wallet.controller.js](../kelmah-backend/services/payment-service/controllers/wallet.controller.js#L162-L175) |
| **Type** | Security (low) |

```js
wallet = await Wallet.findOne({ user: userId })
  .populate("paymentMethods")
  .populate({
    path: "transactionHistory.transaction",
    populate: [
      { path: "sender", select: "name email" },
      { path: "recipient", select: "name email" },
    ],
  });
```

Returns counterparty email addresses to the requesting user. Consider limiting to name/ID only.

---

## Summary Count Table

| Severity | Count |
|----------|-------|
| **CRITICAL** | 5 |
| **HIGH** | 10 |
| **MEDIUM** | 10 |
| **LOW** | 8 |
| **Total** | **33** |

### By Service

| Service | CRIT | HIGH | MED | LOW | Total |
|---------|------|------|-----|-----|-------|
| Payment | 3 | 4 | 4 | 4 | 15 |
| Review | 1 | 2 | 1 | 1 | 5 |
| Messaging | 1 | 3 | 3 | 2 | 9 |
| Shared | 0 | 0 | 0 | 2 | 2 |
| Cross-service | 0 | 1 | 2 | 0 | 3 |

### By Category

| Category | Count |
|----------|-------|
| Security | 14 |
| Bug | 6 |
| Performance / DoS | 7 |
| Data Integrity / Race Condition | 4 |
| Maintainability | 5 |

---

*End of report.*
