---
applyTo: "kelmah-frontend/**"
---
# Kelmah Frontend Patterns

## Module Structure

24 domain modules in `src/modules/`. Each follows:

```
src/modules/[domain]/
├── components/     # Domain-specific React components
├── pages/          # Route-level components
├── services/       # API calls, Redux slices
├── contexts/       # React Context providers
├── hooks/          # Custom hooks
└── utils/          # Domain utilities
```

Key modules: auth, jobs, worker, hirer, search, messaging, dashboard, contracts, payment, reviews, common (shared components).

## Import Paths

```javascript
// ✅ Absolute imports via @ alias
import { Component } from '@/modules/common/components/Component';
import { useAuth } from '@/modules/auth/hooks/useAuth';

// Vite alias configured: '@' → './src'
```

## Redux Store

12 slices in `src/store/index.js`: auth, jobs, dashboard, notification, calendar, worker, hirer, contract, app, reviews, settings, profile.

```javascript
// Async actions use createAsyncThunk
export const fetchJobs = createAsyncThunk('jobs/fetch', async (params) => {
  const response = await jobsService.getJobs(params);
  return response.data;
});
```

## API Service Pattern

All API calls use centralized axios from `src/modules/common/services/axios.js`. Auto-detects environment and routes through gateway.

```javascript
// Service file pattern
import api from '@/modules/common/services/axios';

export const getJobs = (params) => api.get('/jobs', { params });
export const createJob = (data) => api.post('/jobs', data);
```

- Axios interceptors auto-attach JWT tokens
- Base URL: `/api` in production (proxied via Vercel rewrites), `http://localhost:5000/api` in dev

## Auth Storage

Uses `secureStorage` utility (localStorage/sessionStorage). Token refresh handled by axios interceptors. Socket.IO auth passes token via connection auth object.

## Build & Dev

```bash
npm run dev      # Vite dev server on localhost:3000
npm run build    # Production → build/ directory
npm run lint     # ESLint
```

Vite proxy config: `/api` → `http://localhost:5000`, `/socket.io` → messaging service.

## Code Splitting

Manual chunks configured in `vite.config.js`: vendor-react, vendor-mui-core, vendor-mui-icons, vendor-state (Redux/React Query), vendor-utils, shared-api.

## Routing

Lazy-loaded routes in `src/routes/config.jsx`. Three route groups:
- **Public**: landing, login, register, job listing, worker profiles
- **Worker** (protected): dashboard, applications, portfolio, scheduling, messaging
- **Hirer** (protected): dashboard, job posting, application management, worker search

Providers wrapping routes: PaymentProvider, ContractProvider, RouteErrorBoundary.

## UI Theme

Ghana-inspired design system using Material-UI (MUI v5). Responsive breakpoints for mobile-first design. Target users are vocational workers — design for simplicity and accessibility.

## Data Flow Template

When tracing UI issues, map the complete chain:

```
User Action → Event Handler → State Management (Redux/Context)
  → API Service → axios call → /api/[endpoint]
  → Backend Controller → Response
  → State Update → Component Re-render
```

Always verify: loading states (spinner/disabled buttons), success states (data update + feedback), error states (message + retry).
