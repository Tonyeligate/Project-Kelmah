---
description: "Audit an API endpoint or feature end-to-end: traces frontend component through gateway to backend controller, reports contract mismatches and broken wiring."
agent: "agent"
argument-hint: "Feature or endpoint to audit, e.g. worker recommendations"
---
# Audit Feature Flow

Perform a full investigation-first audit of the feature or endpoint described below.

## Steps

1. **Map the file surface**: Identify every file involved — frontend component, service file, Redux slice, gateway route, backend route, controller, model.
2. **Trace the data flow**: Document the chain: UI action → event handler → state management → API service → axios call → gateway proxy → microservice route → controller → DB query → response → UI update.
3. **Check contracts**: Verify the frontend parses the exact response shape the backend sends. Flag any `data.jobs` vs `data.recommendations` mismatches.
4. **Check route wiring**: Confirm the gateway proxy passes the request to the correct service and port. Confirm route ordering (literals before `:id`).
5. **Check auth**: Verify protected endpoints have `verifyGatewayRequest`. Verify public endpoints are in the gateway allow-list.
6. **Report findings**: Severity-ranked list with root cause, impact, and fix direction.

Audit target: 
