# Kelmah Platform Integration Tests

Comprehensive end-to-end testing suite for the Kelmah freelance marketplace platform.

## Overview

This integration test suite validates critical user flows across the entire platform:

- ✅ **System Health**: Gateway and microservice health checks
- 🔐 **Authentication**: User registration and login flows
- 👤 **User Management**: Profile access and updates
- 💼 **Job Management**: Posting, browsing, and applications
- 💬 **Messaging**: Real-time conversation and message flows
- ⭐ **Reviews**: Rating and feedback system
- 📚 **API Documentation**: OpenAPI spec accessibility

## Prerequisites

1. **All Services Running**: Start all microservices before running tests
   ```bash
   # Start API Gateway
   node start-api-gateway.js

   # Start all microservices
   node start-auth-service.js
   node start-user-service.js
   node start-job-service.js
   node start-messaging-service.js
   node start-review-service.js
   ```

2. **Database**: MongoDB running with clean test database
3. **Network**: All services accessible on localhost ports 5000-5006

## Running Tests

### Quick Test Run
```bash
npm run test:integration
```

### Direct Execution
```bash
node integration-tests.js
```

### Custom API Base URL
```bash
API_BASE_URL=https://your-tunnel-url.loca.lt/api node integration-tests.js
```

## Test Data

The tests create temporary test users:
- **Test Hirer**: `test-hirer@kelmah.com` / `TestUser123!`
- **Test Worker**: `test-worker@kelmah.com` / `TestUser123!`

**⚠️ Warning**: Tests create real data in your database. Use a separate test database.

## Test Flow

1. **System Validation**: Health checks and API documentation
2. **User Onboarding**: Registration and authentication
3. **Job Marketplace**: Posting jobs and submitting applications
4. **Communication**: Creating conversations and exchanging messages
5. **Feedback**: Submitting and retrieving reviews

## Expected Results

```
🚀 Starting Kelmah Platform Integration Tests
📍 API Base URL: http://localhost:5000
⏱️  Test Timeout: 30000ms
============================================================

🧪 Running: System Health Check
✅ PASSED: System Health Check

🧪 Running: Aggregate Health Check
✅ PASSED: Aggregate Health Check

[... more tests ...]

============================================================
📊 INTEGRATION TEST SUMMARY
============================================================
Total Tests: 15
✅ Passed: 15
❌ Failed: 0
Success Rate: 100.0%
============================================================
```

## Troubleshooting

### Common Issues

**Services Not Running**
```
❌ FAILED: System Health Check
   Error: connect ECONNREFUSED 127.0.0.1:5000
```
**Solution**: Start all services first using the startup scripts.

**Database Connection Issues**
```
❌ FAILED: User Registration
   Error: MongoDB connection timeout
```
**Solution**: Ensure MongoDB is running and accessible.

**Authentication Failures**
```
❌ FAILED: User Login
   Error: Invalid credentials
```
**Solution**: Check that test users were created successfully.

### Debug Mode

Run with verbose output:
```bash
DEBUG=* node integration-tests.js
```

### Partial Test Runs

Modify the test suite to run specific tests by commenting out unwanted test calls in the main function.

## Test Coverage

### ✅ Fully Tested Flows
- User registration and authentication
- Job posting and application process
- Real-time messaging system
- Review and rating system
- API documentation accessibility

### 🔄 Future Enhancements
- Payment processing flows
- File upload and attachment handling
- WebSocket real-time notifications
- Admin moderation workflows
- Performance and load testing

## Integration with CI/CD

Add to your CI pipeline:
```yaml
- name: Run Integration Tests
  run: |
    npm run test:integration
  env:
    API_BASE_URL: ${{ secrets.API_BASE_URL }}
```

## Contributing

When adding new features:
1. Add corresponding integration tests
2. Update test data and flows as needed
3. Ensure all services are properly mocked for CI
4. Update this documentation

## Support

For test failures or questions:
- Check service logs in `kelmah-backend/services/*/logs/`
- Verify database state and cleanup test data
- Review API Gateway logs for routing issues
- Contact the development team