# Kelmah Project Testing Guide

This document outlines the testing strategy and procedures for the Kelmah project, a platform that connects skilled workers with hirers.

## Testing Strategy

Our testing strategy focuses on testing critical components first, followed by comprehensive testing of all modules. The strategy is broken down as follows:

1. **Critical Components**: Components that handle authentication, payments, and notifications
2. **Frontend Components**: User interface components and state management
3. **Backend APIs**: RESTful endpoints and business logic
4. **Integration Tests**: Cross-component functionality

## Test Directory Structure

The tests are organized according to the microservice architecture:

```
kelmah-frontend/src/tests/
├── components/
│   ├── auth/
│   │   └── Login.test.jsx
│   └── ...
└── ...

kelmah-backend/services/
├── auth-service/tests/
│   └── routes/
│       └── auth.routes.test.js
├── payment-service/tests/
│   └── utils/
│       └── payment-processor.test.js
└── notification-service/tests/
    └── services/
        └── email.service.test.js
```

## Running Tests

### All Tests

To run all tests:

```bash
npm test
```

### Frontend Tests

To run only frontend tests:

```bash
npm run test:frontend
```

### Backend Tests

To run all backend service tests:

```bash
npm run test:backend
```

### Individual Service Tests

To run tests for a specific service:

```bash
npm run test:auth      # Auth service
npm run test:payment   # Payment service
npm run test:notification  # Notification service
```

### Critical Component Tests

To run tests for critical components (recommended for CI/CD):

```bash
npm run test:critical

# Or use the provided scripts
./run-critical-tests.sh    # For Linux/macOS
./run-critical-tests.ps1   # For Windows
```

## Test Reports

When running tests with the scripts, comprehensive test reports are generated in the `test-reports` directory:

- `critical-tests-report.md`: Summary of critical component tests
- Individual JSON reports for each service

## Coverage Requirements

We aim for the following code coverage targets:

| Component | Statements | Branches | Functions | Lines |
|-----------|------------|----------|-----------|-------|
| Critical  | 90%        | 80%      | 90%       | 90%   |
| Non-critical | 70%     | 60%      | 70%       | 70%   |

## Writing New Tests

When writing new tests:

1. **Frontend Components**:
   - Place tests in the corresponding directory structure under `kelmah-frontend/src/tests/`
   - Use React Testing Library for component tests
   - Mock API calls and state management

2. **Backend Services**:
   - Place tests in the service's `tests` directory
   - Use supertest for API testing
   - Mock database calls

### Test Template

```javascript
// Component test example
describe('ComponentName', () => {
  beforeEach(() => {
    // Setup
  });

  test('should do something specific', () => {
    // Arrange
    // Act
    // Assert
  });

  afterEach(() => {
    // Cleanup
  });
});
```

## Continuous Integration

The test suite is integrated with the CI/CD pipeline:

1. **Pull Requests**: All tests run on pull requests
2. **Main Branch**: Critical tests run on every push to main
3. **Nightly**: Full test suite with coverage report is run nightly

## Mocking Strategy

We use Jest's mocking capabilities to mock:

- External API calls
- Database connections
- Authentication services
- Third-party libraries (Stripe, etc.)

## Debugging Tests

To debug tests:

```bash
# Run with Node debugger
node --inspect-brk node_modules/.bin/jest --runInBand

# Watch mode for rapid development
npm run test:watch
```

## Future Improvements

Planned testing improvements:

1. Add End-to-End tests with Cypress
2. Implement visual regression testing
3. Add performance testing for critical paths
4. Enhance test coverage for payment processing workflows 