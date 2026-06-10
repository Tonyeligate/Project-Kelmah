jest.mock('express-rate-limit', () => jest.fn((options) => {
  const middleware = (_req, _res, next) => next();
  middleware.options = options;
  return middleware;
}));

jest.mock('rate-limit-redis', () => jest.fn());
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    sendCommand: jest.fn(),
  })),
}));

const { rateLimiters } = require('./rate-limiter');

describe('api-gateway rate limiter configuration', () => {
  test('login limiter skips successful requests and keys by ip plus normalized email', () => {
    expect(rateLimiters.login.options.skipSuccessfulRequests).toBe(true);
    expect(rateLimiters.auth.options.skipSuccessfulRequests).toBe(false);

    const key = rateLimiters.login.options.keyGenerator({
      ip: '127.0.0.1',
      body: { email: 'GiftyAfisa@Example.com ' },
    });

    expect(key).toBe('127.0.0.1:giftyafisa@example.com');
  });
});