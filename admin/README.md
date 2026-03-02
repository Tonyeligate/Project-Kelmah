# Kelmah Admin Module

Root-level admin directory for platform administration tooling, scripts, and configuration.

## Structure

```
admin/
├── scripts/           # Admin utility scripts (bulk operations, data migrations, etc.)
├── config/            # Admin-specific configuration
├── docs/              # Admin documentation and runbooks
└── README.md          # This file
```

## Purpose

This directory centralises admin-only tooling that spans multiple backend services
(user, auth, payment, job, review, messaging). Unlike service-specific code that lives
inside `kelmah-backend/services/`, these utilities operate **across services** and are
used by platform operators.

## Backend Admin Endpoints

| Service | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| User    | `/api/users/bulk-update` | PUT | Bulk update user records |
| User    | `/api/users/bulk-delete` | DELETE | Bulk delete user records |
| User    | `/api/users/analytics/platform` | GET | Platform-wide analytics |
| User    | `/api/users/analytics/system-metrics` | GET | System performance metrics |
| User    | `/api/users/analytics/user-activity` | GET | User activity analytics |
| Auth    | `/api/auth/stats` | GET | Authentication statistics |
| Auth    | `/api/auth/sessions` | GET | Active session listing |
| Payment | `/api/payments/admin/payouts` | GET | Payout queue listing |
| Payment | `/api/payments/admin/payouts/queue` | POST | Enqueue payout |
| Payment | `/api/payments/admin/payouts/process` | POST | Process payout batch |
| Payment | `/api/payments/analytics/revenue` | GET | Revenue analytics |

## Frontend Admin Module

The frontend admin UI lives at `kelmah-frontend/src/modules/admin/` and consumes
the above endpoints via `adminService.js`.
