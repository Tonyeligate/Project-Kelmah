// Minimal shared test utilities to satisfy placeholder tests
const setupTestEnvironment = () => {
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'test';
  }

  // Provide default JWT secret to satisfy services that require it in tests
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'test-jwt-secret';
  }
};

const setupTestDatabase = async () => Promise.resolve();

const cleanupTestDatabase = async () => Promise.resolve();

const createMockResponse = () => {
  if (typeof jest === 'undefined') {
    throw new Error('createMockResponse can only be used in Jest tests');
  }
  const res = {};
  res.statusCode = 200;
  res.headers = {};
  res.body = null;

  res.status = jest.fn().mockImplementation((code) => {
    res.statusCode = code;
    return res;
  });

  res.json = jest.fn().mockImplementation((payload) => {
    res.body = payload;
    return res;
  });

  res.set = jest.fn().mockImplementation((key, value) => {
    res.headers[key] = value;
    return res;
  });

  return res;
};

module.exports = {
  setupTestEnvironment,
  setupTestDatabase,
  cleanupTestDatabase,
  createMockResponse,
  TestDataFactory: {},
  TestAssertions: {},
};


