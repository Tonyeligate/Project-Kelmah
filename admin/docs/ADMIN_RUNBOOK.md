# Admin Runbook

## Common Admin Operations

### 1. View Platform Statistics
```bash
ADMIN_TOKEN=<jwt> node admin/scripts/bulk-operations.js system-stats
```

### 2. Deactivate Users in Bulk
```bash
ADMIN_TOKEN=<jwt> node admin/scripts/bulk-operations.js bulk-update \
  --ids userId1,userId2,userId3 \
  --data '{"isActive": false}'
```

### 3. Delete Users in Bulk
```bash
ADMIN_TOKEN=<jwt> node admin/scripts/bulk-operations.js bulk-delete \
  --ids userId1,userId2,userId3
```

### 4. Check Auth Sessions
```bash
curl -H "Authorization: Bearer <token>" http://localhost:5000/api/auth/sessions
```

### 5. Process Payout Queue
```bash
curl -X POST -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"limit": 10}' \
  http://localhost:5000/api/payments/admin/payouts/process
```

## Obtaining an Admin JWT

Login with admin credentials:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@kelmah.com", "password": "..."}'
```

Copy the `token` from the response.
