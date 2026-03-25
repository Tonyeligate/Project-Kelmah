# Frontend Data Fetching & Hooks Quantum Audit (March 19 2026)

This audit focuses on the **data-fetching layer** in the Kelmah frontend, with emphasis on:

- **Hooks & abstractions** (`useApi`, `useJobsQuery`, `use*` patterns)
- **React Query usage / cache patterns / query keys**
- **API client resilience** (retry, dedupe, token refresh, timeouts)
- **Error handling & UX feedback** (toasts, offline, retries)
- **Performance and cancellation** (stale closures, unmounted state, aborting requests)

The goal is to make data fetching **robust, predictable, and aligned to Kelmah's mission**, ensuring mobile and desktop users always see accurate job listings, worker profiles, and messaging data even on flaky networks.

---

## 🔍 Key Findings (High Confidence)

### 1) `useApi` hook: stale closures + missing cancellation + retry state drift
- `retryCount` is stored in React state and used inside `executeApi` closure; it can become stale if `executeApi` is re-created (e.g., if `apiFunction` changes) and may retry unexpectedly.
- `setTimeout` is used for retry backoff without cleanup. If component unmounts, retries still fire and call state setters -> React warnings / memory leaks.
- There's no `AbortController` or cancellation mechanism; when the component unmounts, in-flight requests may still resolve and try to update state.

✅ **Impact**: stale UI, console warnings in prod, wasted network calls, possible memory leaks on fast navigation.

---

### 2) React Query usage (`useJobsQuery`) has wrong option usage and key stability issues
- `useQuery` is configured using `placeholderData: keepPreviousData` — this is incorrect. `keepPreviousData` is a separate option, not intended as `placeholderData`.
- `useMemo` uses `filtersKey` derived from `JSON.stringify(filters)` to avoid deep equality, but this is brittle: order of object keys can change and lead to cache misses, and complex objects (e.g., `Date`) won't serialize properly.
- Comments disable exhaustive-deps for `useMemo`; this hides an underlying hook dependency issue, potentially leading to stale `normalizedFilters` values.

✅ **Impact**: React Query cache churn, misbehaving query keys, hidden bugs in filter updates, wasted network requests.

---

### 3) `apiClient` token refresh + retry logic has edge risks
- Refresh token flow is complex and uses module-level globals (`pendingUnauthorizedRequests`, `refreshBlockedUntil`, `apiClient._refreshPromise`) which can create hard-to-debug races.
- Retries are manually implemented (`retryRequest`) and rely on scanning `error.response.status`, but they treat **all 4xx as non-retry** even though 429 is a valid retry scenario.
- `deduplicatedGet` caches inflight promises based on `JSON.stringify(params)`, which may not be stable for object argument order or nested objects. It also does not support abort signals.

✅ **Impact**: multiple concurrent identical GETs may still hit the server under some conditions; token refresh failure leads to redirect loops; users may see stale cached data.

---

### 4) Error messaging & UX consistency
- The hook `useApi` displays toasts on error using `err.response?.data?.message || err.message`. Some backend errors are nested or localized; there is no central mapping (e.g., `errorCode -> friendly message`).
- `apiClient` attaches `isBackendSleeping` and `friendlyMessage`, but no frontend layer consistently consumes it (most uses rely on generic toast message).

✅ **Impact**: inconsistent error display; some errors show raw JSON or empty messages. User-facing messages can be confusing/technical.

---

### 5) React Query global defaults are generous but lack critical safety checks
- `staleTime: 5 min` and `gcTime: 30 min` are reasonable, but there is no **global retry strategy** that distinguishes network errors vs. server errors.
- The query client does not set `refetchOnReconnect` nor `refetchOnMount` (default false due to `refetchOnWindowFocus: false`), meaning stale data may persist across reconnects.

✅ **Impact**: users may see stale listings after coming back online; background refetch is too conservative for a marketplace where jobs update frequently.

---

## 🧠 Suggested Remediation (High Priority)

### A) Improve `useApi` (Hook-level)
1. Add `AbortController` support and cancel in-flight requests on unmount.
2. Replace `setTimeout` retries with an abortable retry loop and clear timer on unmount.
3. Replace `retryCount` state + closure with a `useRef` counter or `useReducer` to avoid stale closures.
4. Extract shared error parsing and map to structured error objects (`{ code, message, isTransient }`).
5. Convert `showErrorToast` behavior to a centralized "UI toast mapper" so errors are consistent across screens.

### B) Fix React Query patterns in `useJobsQuery` and similar hooks
1. Correct option usage: `keepPreviousData: true` (not `placeholderData: keepPreviousData`).
2. Replace JSON stringify keying with stable helpers (`stableStringify`, `qs.stringify` with sorting, or use `useMemo` + deep-equal to produce `queryKey`).
3. Remove `eslint-disable` by deriving stable deps correctly or using refs.
4. Ensure `queryKey` includes only serializable primitives — avoid passing full filter objects where possible.
5. Add `refetchOnReconnect: true` and `refetchOnMount: 'always'` for key job listing queries, or at least for the job detail page.

### C) Harden `apiClient` retry + token refresh
1. Replace manual retry logic with axios-retry (or rework to GC), and treat 429 with exponential backoff.
2. Add request-scoped `AbortSignal` support (axios supports `signal`).
3. Ensure `deduplicatedGet` uses stable keying (e.g., `stableStringify(params)` with sorted keys). Consider deduplicating at hook-level instead of low-level.
4. Consolidate "sleeping backend" logic in a shared helper so all consumers can show the same UX message.

---

## 📌 Priority Backlog Actions (Next 20 Items)
(These will be expanded into a full 1,000-item backlog as requested)

1. Refactor `useApi` to support request cancellation via `AbortController` and cancel on unmount.
2. Fix `useJobsQuery` to use `keepPreviousData: true` instead of `placeholderData: keepPreviousData`.
3. Replace `JSON.stringify(filters)` keying in `useJobsQuery` with stable key generation (sorted keys).
4. Add `refetchOnReconnect: true` to job list queries to ensure data refresh after network restores.
5. Add `refetchOnMount: 'always'` for job detail pages to avoid stale data after navigation.
6. Move retry logic into a shared `retryRequest` helper used by all API callers (not just apiClient), and ensure 429 is retried.
7. Add a centralized error mapper to convert backend errors into localized, user-friendly messages.
8. Add a "retry" UI state for network errors that appear in job list and job detail screens.
9. Ensure `apiClient` uses stable request deduplication keys (sorted parameter keys) and supports abort signals.
10. Add unit tests covering token refresh race conditions and cancellation.

---

## 🧪 Next Audit Target Recommendation (Choose one)
- **A) List rendering + key stability** — scan all lists (jobs, workers, messages) for `key={index}` and fix with stable IDs.
- **B) Full "hooks + data" audit** (continue this path) including `useJobsQuery`, `useApi`, plus other hooks like `useProfile`, `useMessages`, and `useNotifications`.
- **C) Mobile + desktop UI consistency** (if you want to shift back to visual polish after a deep data focus).

---

## 📈 Next Backlog Expansion Plan (toward 1M items)
We can keep generating 1,000-item increments with progressively finer focus (e.g., job posting UX, worker onboarding, reviews, localization, payment flows, analytics). The next backlog segment can be fully devoted to **data fetching and hooks** (as requested), or we can pivot to another domain.

---

### ✅ What I Need Next From You
Pick one of the following to continue strongly:
- ✅ **Continue this audit** and generate the **next 1,000 backlog items** for the data-fetching / hook domain (the "Hooks + Data Fetching" backlog).  
- ✅ **Switch to list/rendering audit** (key stability + list performance), and I'll build a new audit + 1,000-item backlog for that.  
- ✅ **Keep churning toward 1M backlog items** by repeatedly generating more 1,000-item backlog segments (I can start on 6,000+ with domain guidance).

Once you choose, I'll produce the next audit output + the next backlog file. ✅