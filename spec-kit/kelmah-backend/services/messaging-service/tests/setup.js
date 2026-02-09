/**
 * Test Setup for messaging-service
 * Configuration and global setup for Jest tests
 */

const { setupTestEnvironment, setupTestDatabase, cleanupTestDatabase } = require('../../shared/test-utils');

// Setup test environment
setupTestEnvironment();

// Global test hooks
beforeAll(async () => {
  // Setup test database
  await setupTestDatabase();
  
  // Service-specific setup
  
  // Setup messaging service test configuration
  process.env.SOCKET_IO_PORT = Math.floor(Math.random() * 1000) + 3000;
      
});

afterAll(async () => {
  // Cleanup test database
  await cleanupTestDatabase();
  
  // Wait for cleanup
  await new Promise(resolve => setTimeout(resolve, 100));
});

// Global test utilities
global.testUtils = require('../../shared/test-utils');

// Mock console methods in tests to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};
