jest.mock('express-rate-limit', () => jest.fn((options) => {
  const middleware = (_req, _res, next) => next();
  middleware.options = options;
  return middleware;
}));

jest.mock('rate-limit-redis', () => ({
  RedisStore: jest.fn(),
}));

jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
    sendCommand: jest.fn(),
  })),
}));

const { createLimiter } = require('../middlewares/rateLimiter');

describe('auth-service rate limiter configuration', () => {
  test('login limiter skips successful requests and keys by ip plus normalized email', () => {
    const limiter = createLimiter('login');

    expect(limiter.options.skipSuccessfulRequests).toBe(true);

    const key = limiter.options.keyGenerator({
      ip: '127.0.0.1',
      body: { email: 'GiftyAfisa@Example.com ' },
    });

    expect(key).toBe('127.0.0.1:giftyafisa@example.com');
  });
});