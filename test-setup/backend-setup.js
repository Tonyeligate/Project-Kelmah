// Set environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-unit-tests';
process.env.API_PORT = '0'; // Use random port for tests

// Mock external services
jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({ data: {} })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} })),
  create: jest.fn().mockReturnThis(),
  interceptors: {
    request: { use: jest.fn(), eject: jest.fn() },
    response: { use: jest.fn(), eject: jest.fn() }
  },
  defaults: { baseURL: '' }
}));

// Mock database connections
jest.mock('mongoose', () => {
  const mockModel = {
    findOne: jest.fn(() => mockModel),
    findById: jest.fn(() => mockModel),
    find: jest.fn(() => mockModel),
    create: jest.fn(() => mockModel),
    save: jest.fn(() => mockModel),
    updateOne: jest.fn(() => mockModel),
    deleteOne: jest.fn(() => mockModel),
    populate: jest.fn(() => mockModel),
    select: jest.fn(() => mockModel),
    exec: jest.fn(() => Promise.resolve({})),
    sort: jest.fn(() => mockModel),
    limit: jest.fn(() => mockModel),
    skip: jest.fn(() => mockModel),
  };
  
  return {
    connect: jest.fn(() => Promise.resolve()),
    connection: {
      once: jest.fn(),
      on: jest.fn(),
    },
    Schema: jest.fn(() => ({
      pre: jest.fn(),
      virtual: jest.fn(),
      set: jest.fn(),
      methods: {},
      statics: {},
    })),
    model: jest.fn(() => mockModel),
    Types: {
      ObjectId: jest.fn(id => id),
    },
  };
});

// Mock for jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'test-token'),
  verify: jest.fn(() => ({ id: 'test-user-id', role: 'worker' })),
}));

// Mock Redis client
jest.mock('redis', () => {
  const mockClient = {
    connect: jest.fn(),
    on: jest.fn(),
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  };
  
  return {
    createClient: jest.fn(() => mockClient),
  };
});

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    customers: {
      create: jest.fn(() => Promise.resolve({ id: 'cus_mock123' })),
      retrieve: jest.fn(() => Promise.resolve({ id: 'cus_mock123' })),
    },
    paymentMethods: {
      attach: jest.fn(() => Promise.resolve({})),
      detach: jest.fn(() => Promise.resolve({})),
    },
    paymentIntents: {
      create: jest.fn(() => Promise.resolve({ id: 'pi_mock123', client_secret: 'secret' })),
      confirm: jest.fn(() => Promise.resolve({ id: 'pi_mock123', status: 'succeeded' })),
    },
    setupIntents: {
      create: jest.fn(() => Promise.resolve({ client_secret: 'seti_mock_secret' })),
    },
    subscriptions: {
      create: jest.fn(() => Promise.resolve({ id: 'sub_mock123' })),
      update: jest.fn(() => Promise.resolve({})),
      del: jest.fn(() => Promise.resolve({})),
    },
  }));
});

// Mock socket.io
jest.mock('socket.io', () => {
  const mockSocket = {
    on: jest.fn(),
    emit: jest.fn(),
    join: jest.fn(),
    leave: jest.fn(),
    to: jest.fn(() => mockSocket),
    in: jest.fn(() => mockSocket),
  };
  
  const mockIo = {
    on: jest.fn(),
    emit: jest.fn(),
    to: jest.fn(() => mockIo),
    in: jest.fn(() => mockIo),
  };
  
  return jest.fn(() => mockIo);
});

// Set global testing timeout
jest.setTimeout(10000);

// Global utilities
globalThis.clearAllMocks = () => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
};

// Runs before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Runs after all tests
afterAll(async () => {
  // Clean up any remaining resources
}); 