# Hirer Dashboard Payments Tab Data Flow — Nov 14, 2025

## Component Chain
- **UI Component:** `kelmah-frontend/src/modules/hirer/components/PaymentRelease.jsx`
- **State Layer:** `kelmah-frontend/src/modules/hirer/services/hirerSlice.js`
- **Service Client:** `kelmah-frontend/src/modules/common/services/axios.js` (paymentServiceClient)
- **Backend Targets:** payment-service routes proxied via API Gateway
  - `GET /api/payments/wallet`
  - `GET /api/payments/escrows`
  - `GET /api/payments/transactions/history`

## Data Flow
```
User opens Hirer › Payments tab or taps "Refresh Summary"
  ↓
PaymentRelease.ensurePaymentSummary(force?)
  ↓ (TTL guard + timeout watchdog)
Dispatch fetchPaymentSummary thunk
  ↓
Redux thunk issues parallel GETs via paymentServiceClient
  ↓
API Gateway → payment-service wallet/escrow/transactions endpoints
  ↓
Backend responds with wallet/escrow history payloads
  ↓
Thunk normalizes totals, pending milestones, averages
  ↓
Redux store.hirer.payments updated (loading/error flags cleared)
  ↓
PaymentRelease selectors recompute cards, tables, alerts
```

## Reliability & UX Hardening
- Added 60s TTL cache (`lastFetchRef`) so tab revisits reuse recent summaries unless forced.
- Implemented exponential backoff (3 attempts, 700ms base) plus 8s timeout banner to avoid infinite skeletons.
- Manual refresh button now always visible with spinner feedback and disabled state.
- Alert surfaces either API error (Redux `error.payments`) or timeout warning with retry action.
- Background `LinearProgress` shows while fresh data streams in, preserving current summary cards.

## Loading / Success / Error States
| State | Trigger | UI Response |
| --- | --- | --- |
| Initial load | First mount with no cache | Skeleton cards + table shimmer |
| Background refresh | TTL expired but data exists | Top `LinearProgress`, cards remain visible |
| Error | Redux `error.payments` populated | Red alert + Retry button |
| Timeout | 8s watchdog fires | Amber warning, Retry button |
| Success | `payments` slice updated | Summary cards, pending table, history table hydrated |

## Key Files & References
- `PaymentRelease.jsx` lines 20–220: TTL, timeout, retry loop, refresh UI.
- `hirerSlice.js` lines 120–250: `fetchPaymentSummary` thunk, reducers updating `payments`, `loading.payments`, `error.payments`.
- `paymentServiceClient` (modules/common/services/axios.js): central axios with gateway base + auth headers.

## Verification Checklist
1. Load `/hirer/dashboard` → Payments tab: confirm skeleton transitions to data within TTL.
2. Trigger manual refresh: observe spinner + background progress, ensure `Last synced` timestamp updates.
3. Simulate backend outage (disconnect payment-service): check error alert displays, Retry performs three attempts then surfaces failure.
4. Use throttling to delay responses beyond 8s: verify timeout warning appears, clears after successful fetch.
5. Confirm Redux DevTools shows `hirer/fetchPaymentSummary/pending → fulfilled` sequence without lingering loading flag.
