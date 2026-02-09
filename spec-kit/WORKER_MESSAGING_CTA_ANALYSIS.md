# Worker Messaging CTA Data Flow (Updated Nov 19, 2025)

## UI Component Chain
- **Component**: `kelmah-frontend/src/modules/worker/components/WorkerCard.jsx`
- **Hook**: `kelmah-frontend/src/hooks/useAuthCheck.js`
- **Auth Utilities**: `kelmah-frontend/src/utils/userUtils.js`
- **Routing**: `react-router-dom` (navigate + `useLocation`)
- **Messaging Entry**: `kelmah-frontend/src/modules/messaging/pages/MessagingPage.jsx`
- **Messaging Service Layer**: `kelmah-frontend/src/modules/messaging/services/messagingService.js`
- **Backend Endpoint**: `POST /api/messages/conversations` (via gateway → messaging service) with optional `?recipient=<workerId>` deep-link

## End-to-End Flow Map
```
User clicks CTA on WorkerCard.jsx
  ↓
Button derives `messageCta` via useMemo (auth role → CTA metadata)
  ↓
`handleMessage` executes
  ↓
IF unauthenticated → navigate('/login', { state: { from: current pathname, message } })
  ↓
IF authenticated hirer (and not viewing own card) → navigate(`/messages?recipient=${worker.userId}`)
  ↓
Messaging router loads `MessagingPage.jsx`
  ↓
MessagingPage `useEffect` parses URL params → treats `?userId=` as `recipient`
  ↓
`messagingService.createDirectConversation(recipientId)` hits API Gateway `/api/messages/conversations`
  ↓
Gateway proxies request to messaging microservice (`kelmah-backend/services/messaging-service`)
  ↓
Service creates/returns conversation, MessagingPage selects it and renders chat box
```

## CTA State Matrix
| Viewer Context | Derived CTA | Behavior |
| --- | --- | --- |
| Viewing own worker card | Label `This is you`, tooltip explaining restriction | Button disabled, prevents handler from firing |
| Not signed in | Label `Sign in to message`, tooltip `Sign in as a hirer...` | Click routes to `/login` with `state.from` preserving `/find-talents` |
| Signed in but role ≠ hirer | Label `Hirer access required`, tooltip referencing hirer-only messaging | Button disabled while showing rationale |
| Signed-in hirer viewing another worker | Label `Message`, tooltip `Start conversation...` | Click deep-links to `/messages?recipient=...`, enabling conversation bootstrapping |

## Verification & Observations
1. **Auth Normalization**: `useAuthCheck` pulls Redux auth slice and runs through `normalizeUser`, so role comparisons are case-agnostic (`Hirer` → `hirer`).
2. **Self-View Guard**: Worker/user IDs are normalized (`id`, `_id`, `userId`) for both card data and authenticated viewer, preventing false positives when IDs share numeric vs string forms.
3. **Context Preservation**: Login redirect stores `from` so guests return to `/find-talents` after authentication.
4. **Messaging Coupling**: MessagingPage respects `?recipient` query param and creates a direct conversation via `messagingService.createDirectConversation`. Response data differences are handled by extracting `conversation.id` from multiple shapes.
5. **Backend Alignment**: `messagingServiceClient` already targets the gateway path `/api/messages`, so WorkerCard’s navigation piggybacks on existing real-time stack without duplicating API calls.

## Outstanding Risks / Follow-Ups
- **Lint Coverage**: `eslint.config.js` ignores `src/modules/worker/**`, so WorkerCard changes bypass lint checks. Introduce a narrower ignore rule (or remove the worker glob) so CTA logic participates in CI.
- **Messaging Deep-Link QA**: Need manual pass on `/messages?userId=<id>` to verify conversation auto-creation still works after recent messaging context refactors.
- **Role Source of Truth**: Some hirer accounts might store role variants (e.g., `businessOwner`). Keep `isHirer` whitelist updated or migrate to permission-based guard for future-proofing.
- **Analytics/Telemetry**: Consider emitting an event (e.g., `worker_cta_click`) before navigation to track CTA usage once analytics pipeline is available.
