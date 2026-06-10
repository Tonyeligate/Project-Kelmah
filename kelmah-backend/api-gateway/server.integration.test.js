const express = require('express');
const request = require('supertest');
const axios = require('axios');

const mockAuthenticate = jest.fn((req, res, next) => {
  req.user = {
    id: 'worker-1',
    role: 'worker',
    email: 'worker@example.com',
  };
  req.headers.authorization = req.headers.authorization || 'Bearer live-token';
  req.headers['x-authenticated-user'] = JSON.stringify(req.user);
  req.headers['x-auth-source'] = 'api-gateway';
  req.headers['x-gateway-signature'] = 'signed-user';
  next();
});

const mockAuthorizeRoles = jest.fn(() => (req, res, next) => next());
const mockOptionalAuth = jest.fn((req, res, next) => next());
const mockTierLimitMiddleware = jest.fn((req, res, next) => next());
const mockProxyHandler = jest.fn((req, res) => {
  res.status(200).json({
    success: true,
    proxiedPath: req.originalUrl,
  });
});
const mockCreateServiceProxy = jest.fn(() => mockProxyHandler);
const mockCreateProxyMiddleware = jest.fn(() => (req, res, next) => next());

jest.mock('axios');
jest.mock('./config/db', () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('./utils/serviceDiscovery', () => ({
  initializeServiceRegistry: jest.fn().mockResolvedValue({}),
  getServiceUrlsForApp: jest.fn(() => ({})),
  detectEnvironment: jest.fn(() => 'test'),
  getServiceUrl: jest.fn(),
}));
jest.mock('./middlewares/auth', () => ({
  authenticate: (...args) => mockAuthenticate(...args),
  authorizeRoles: (...args) => mockAuthorizeRoles(...args),
  optionalAuth: (...args) => mockOptionalAuth(...args),
}));
jest.mock('./middlewares/logging', () => jest.fn(() => (req, res, next) => next()));
jest.mock('./middlewares/error-handler', () => jest.fn(() => (err, req, res, next) => {
  res.status(500).json({ success: false, error: err?.message || 'gateway error' });
}));
jest.mock('./middlewares/request-validator', () => ({
  sanitizeRequest: jest.fn((req, res, next) => next()),
  enforceTierLimits: jest.fn(() => (...args) => mockTierLimitMiddleware(...args)),
  validateWebhook: jest.fn((req, res, next) => next()),
}));
jest.mock('./middlewares/rate-limiter', () => ({
  getRateLimiter: jest.fn(() => (req, res, next) => next()),
  rateLimiters: {
    login: (req, res, next) => next(),
    auth: (req, res, next) => next(),
    general: (req, res, next) => next(),
    verificationToken: (req, res, next) => next(),
  },
}));
jest.mock('./proxy/serviceProxy', () => ({
  createServiceProxy: (...args) => mockCreateServiceProxy(...args),
}));
jest.mock('./utils/serviceKeepAlive', () => ({
  createKeepAliveManager: jest.fn(() => ({
    start: jest.fn(),
    stop: jest.fn(),
  })),
}));
jest.mock('../shared/utils/keepAlive', () => ({
  initKeepAlive: jest.fn(() => ({ stop: jest.fn() })),
  keepAliveMiddleware: jest.fn((req, res, next) => next()),
  keepAliveTriggerHandler: jest.fn((req, res) => res.status(200).json({ success: true })),
}));
jest.mock('http-proxy-middleware', () => ({
  createProxyMiddleware: (...args) => mockCreateProxyMiddleware(...args),
}));

describe('mounted gateway server integration', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SKIP_GATEWAY_BOOTSTRAP = 'true';
    process.env.NODE_ENV = 'test';
    app = require('./server');
    app.set('serviceUrls', {
      JOB_SERVICE: 'http://job-service.test',
      PAYMENT_SERVICE: 'http://payment-service.test',
    });
  });

  afterEach(() => {
    delete process.env.SKIP_GATEWAY_BOOTSTRAP;
  });

  test('serves mounted /api/jobs/search through the gateway app', async () => {
    axios.mockResolvedValue({
      status: 200,
      data: {
        success: true,
        data: { jobs: [{ id: 'job-1' }] },
      },
    });

    const response = await request(app)
      .get('/api/jobs/search?q=tile+repair&location=Accra&page=1&limit=5');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { jobs: [{ id: 'job-1' }] },
    });
    expect(axios).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: 'http://job-service.test/api/jobs/search?q=tile+repair&location=Accra&page=1&limit=5',
      }),
    );
  });

  test('serves authenticated mounted /api/payments/transactions through the gateway app', async () => {
    const payload = {
      type: 'refund',
      amount: 150,
      currency: 'GHS',
      recipient: 'user-2',
      relatedTransaction: 'TRX_ORIGINAL_9',
    };

    const response = await request(app)
      .post('/api/payments/transactions')
      .set('Authorization', 'Bearer live-token')
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      proxiedPath: '/api/payments/transactions',
    });
    expect(mockAuthenticate).toHaveBeenCalled();
    expect(mockTierLimitMiddleware).toHaveBeenCalled();
    expect(mockCreateServiceProxy).toHaveBeenCalledWith({
      target: 'http://payment-service.test',
      pathPrefix: '/api/payments',
      requireAuth: true,
    });
    expect(mockProxyHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        body: payload,
        originalUrl: '/api/payments/transactions',
      }),
      expect.any(Object),
      expect.any(Function),
    );
  });
});