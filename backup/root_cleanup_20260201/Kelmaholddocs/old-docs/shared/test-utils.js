/**
 * Shared Testing Utilities
 * Common testing helpers and configurations for all Kelmah services
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');

let mongoServer;

/**
 * Setup in-memory MongoDB for testing
 */
async function setupTestDatabase() {
  if (mongoServer) {
    return mongoServer.getUri();
  }
  
  mongoServer = await MongoMemoryServer.create({
    instance: {
      dbName: 'kelmah-test'
    }
  });
  
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri);
  
  return mongoUri;
}

/**
 * Cleanup test database
 */
async function cleanupTestDatabase() {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
  
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
}

/**
 * Clear all collections in test database
 */
async function clearDatabase() {
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
}

/**
 * Create a test user for authentication
 * @param {object} userData - User data override
 * @returns {object} Created user
 */
async function createTestUser(userData = {}) {
  const defaultUser = {
    email: 'test@example.com',
    password: 'hashedpassword123',
    role: 'worker',
    profile: {
      firstName: 'Test',
      lastName: 'User'
    },
    emailVerifiedAt: new Date(),
    isActive: true
  };
  
  const User = mongoose.model('User');
  return await User.create({ ...defaultUser, ...userData });
}

/**
 * Generate JWT token for testing
 * @param {object} payload - Token payload
 * @returns {string} JWT token
 */
function generateTestToken(payload = {}) {
  const jwt = require('jsonwebtoken');
  const defaultPayload = {
    id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    role: 'worker'
  };
  
  return jwt.sign(
    { ...defaultPayload, ...payload },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
}

/**
 * Create authenticated request with test token
 * @param {object} app - Express app
 * @param {object} userPayload - User payload for token
 * @returns {object} Supertest request with auth
 */
function authenticatedRequest(app, userPayload = {}) {
  const token = generateTestToken(userPayload);
  return request(app).set('Authorization', `Bearer ${token}`);
}

/**
 * Wait for a condition to be true
 * @param {Function} condition - Function that returns boolean
 * @param {number} timeout - Timeout in ms
 * @param {number} interval - Check interval in ms
 */
async function waitForCondition(condition, timeout = 5000, interval = 100) {
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    if (await condition()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Mock external API responses
 * @param {string} baseURL - Base URL to mock
 * @param {object} responses - Response mappings
 */
function mockExternalAPI(baseURL, responses) {
  const nock = require('nock');
  const scope = nock(baseURL);
  
  Object.entries(responses).forEach(([path, response]) => {
    if (typeof response === 'function') {
      scope.get(path).reply(response);
    } else {
      scope.get(path).reply(200, response);
    }
  });
  
  return scope;
}

/**
 * Test data factories
 */
const TestDataFactory = {
  user: (overrides = {}) => ({
    email: `user${Date.now()}@example.com`,
    password: 'password123',
    role: 'worker',
    profile: {
      firstName: 'Test',
      lastName: 'User'
    },
    isActive: true,
    ...overrides
  }),
  
  job: (overrides = {}) => ({
    title: 'Test Job',
    description: 'This is a test job description',
    category: 'development',
    skillsRequired: ['javascript', 'node.js'],
    payment: {
      amount: { fixed: 1000 },
      currency: 'USD',
      type: 'fixed'
    },
    location: {
      type: 'remote'
    },
    status: 'open',
    ...overrides
  }),
  
  message: (overrides = {}) => ({
    content: {
      text: 'Test message content'
    },
    messageType: 'text',
    ...overrides
  }),
  
  review: (overrides = {}) => ({
    rating: 5,
    comment: 'Excellent work!',
    categories: {
      quality: 5,
      communication: 5,
      timeliness: 5
    },
    isVisible: true,
    ...overrides
  }),
  
  transaction: (overrides = {}) => ({
    amount: 100,
    currency: 'USD',
    type: 'payment',
    status: 'pending',
    description: 'Test transaction',
    ...overrides
  })
};

/**
 * Common test assertions
 */
const TestAssertions = {
  /**
   * Assert API response structure
   */
  expectApiResponse: (response, expectedStatus = 200) => {
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toHaveProperty('success');
    if (expectedStatus >= 200 && expectedStatus < 300) {
      expect(response.body.success).toBe(true);
    }
  },
  
  /**
   * Assert error response structure
   */
  expectErrorResponse: (response, expectedStatus = 400) => {
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message');
  },
  
  /**
   * Assert pagination structure
   */
  expectPaginatedResponse: (response) => {
    TestAssertions.expectApiResponse(response);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('pagination');
    expect(response.body.pagination).toHaveProperty('page');
    expect(response.body.pagination).toHaveProperty('limit');
    expect(response.body.pagination).toHaveProperty('total');
  },
  
  /**
   * Assert MongoDB document structure
   */
  expectMongoDocument: (doc) => {
    expect(doc).toHaveProperty('_id');
    expect(doc).toHaveProperty('createdAt');
    expect(doc).toHaveProperty('updatedAt');
  }
};

/**
 * Environment setup for tests
 */
function setupTestEnvironment() {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
  process.env.LOG_LEVEL = 'error'; // Suppress logs during testing
  
  // Mock external services
  if (!process.env.SKIP_EXTERNAL_MOCKS) {
    // Mock email service
    jest.mock('nodemailer', () => ({
      createTransport: jest.fn(() => ({
        sendMail: jest.fn(() => Promise.resolve({ messageId: 'test-message-id' }))
      }))
    }));
    
    // Mock Stripe
    jest.mock('stripe', () => {
      return jest.fn(() => ({
        paymentIntents: {
          create: jest.fn(() => Promise.resolve({ id: 'pi_test123', status: 'succeeded' })),
          retrieve: jest.fn(() => Promise.resolve({ id: 'pi_test123', status: 'succeeded' }))
        },
        customers: {
          create: jest.fn(() => Promise.resolve({ id: 'cus_test123' }))
        }
      }));
    });
  }
}

/**
 * Performance testing utilities
 */
const PerformanceUtils = {
  /**
   * Measure function execution time
   */
  measureTime: async (fn) => {
    const start = process.hrtime.bigint();
    const result = await fn();
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds
    
    return { result, duration };
  },
  
  /**
   * Run load test on endpoint
   */
  loadTest: async (app, endpoint, options = {}) => {
    const {
      concurrency = 10,
      requests = 100,
      method = 'GET',
      data = null,
      headers = {}
    } = options;
    
    const results = [];
    const batches = Math.ceil(requests / concurrency);
    
    for (let batch = 0; batch < batches; batch++) {
      const batchPromises = [];
      const batchSize = Math.min(concurrency, requests - (batch * concurrency));
      
      for (let i = 0; i < batchSize; i++) {
        const promise = PerformanceUtils.measureTime(async () => {
          const req = request(app)[method.toLowerCase()](endpoint);
          
          Object.entries(headers).forEach(([key, value]) => {
            req.set(key, value);
          });
          
          if (data) {
            req.send(data);
          }
          
          return await req;
        });
        
        batchPromises.push(promise);
      }
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    const durations = results.map(r => r.duration);
    const responses = results.map(r => r.result);
    
    return {
      totalRequests: requests,
      successfulRequests: responses.filter(r => r.status < 400).length,
      averageResponseTime: durations.reduce((a, b) => a + b, 0) / durations.length,
      minResponseTime: Math.min(...durations),
      maxResponseTime: Math.max(...durations),
      responseTimes: durations,
      responses
    };
  }
};

module.exports = {
  setupTestDatabase,
  cleanupTestDatabase, 
  clearDatabase,
  createTestUser,
  generateTestToken,
  authenticatedRequest,
  waitForCondition,
  mockExternalAPI,
  TestDataFactory,
  TestAssertions,
  setupTestEnvironment,
  PerformanceUtils
};