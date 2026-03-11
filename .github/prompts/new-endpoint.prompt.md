---
description: "Add a new API endpoint: creates route, controller, gateway proxy config, and optional frontend service function. Follows Kelmah REST conventions."
agent: "agent"
argument-hint: "Describe the endpoint, e.g. GET /api/users/workers/suggest - typeahead search for workers"
---
# New Endpoint

Create a new API endpoint following Kelmah conventions.

## Requirements from description



## Checklist

1. **Route file**: Add to the correct service's `routes/` directory. Place literal paths before `:id` params.
2. **Controller**: Add handler in the service's `controllers/` directory. Use shared models via `require('../models')`.
3. **Auth middleware**: Use `verifyGatewayRequest` for protected endpoints. Mark public endpoints clearly.
4. **Gateway config**: Add proxy rule in `api-gateway/server.js` if this is a new route family.
5. **Response envelope**: Return `{ success: true, data: ... }` on success, `{ success: false, error: { message, code } }` on error.
6. **Frontend service** (if requested): Add function in the relevant `modules/[domain]/services/` file.
7. **Test**: Add or update a contract test in the service's `tests/` directory.
