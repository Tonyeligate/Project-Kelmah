---
applyTo: "**/*.test.js"
description: "Use when writing, running, or debugging tests. Covers Jest configuration, test patterns, and service-specific testing conventions."
---
# Kelmah Testing Conventions

## Running Tests

```bash
# Single test file (preferred for focused work)
npx jest --runTestsByPath services/[service]/tests/[test].js --runInBand

# All backend tests
npm run test:backend

# Critical tests only (auth, payment, email)
npm run test:critical

# With coverage
npm run test:coverage

# Frontend tests
npm run test:frontend
```

## Jest Configuration

- Environment: `node` (root `jest.config.js`)
- Timeout: 10,000ms
- Use `--runInBand` for tests sharing database state

## Test File Locations

Each microservice has `tests/` with setup fixtures:
- `services/auth-service/tests/` (17 test files)
- `services/user-service/tests/` (17 test files)
- `services/job-service/tests/` (11 test files)
- Root: `kelmah-backend/tests/route-contracts.test.js`

## Test Naming Patterns

| Pattern | Purpose |
|---------|---------|
| `*.test.js` | General unit/integration |
| `*.contract.test.js` | API contract validation |
| `*.e2e.test.js` | End-to-end flow |
| `*.security.test.js` | Security-focused |
| `*.race.test.js` | Race condition / concurrency |

## Shared Test Utilities

`kelmah-backend/shared/test-utils.js` provides common helpers. Use setup fixtures in each service's `tests/` directory.

## Contract Testing

Contract tests validate API response shapes. When backend response format changes, update corresponding contract tests. Key contract tests:
- `get-me.contract.test.js` — Auth GET /me
- `job-ranking.contract.test.js` — Job ranking algorithm
- `mobile-recommendations.contract.test.js` — Mobile recommendations
- `worker-directory.controller.test.js` — Worker search
