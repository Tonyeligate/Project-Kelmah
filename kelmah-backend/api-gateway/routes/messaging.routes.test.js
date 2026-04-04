const crypto = require('crypto');
const express = require('express');
const request = require('supertest');
const axios = require('axios');

jest.mock('axios', () => ({
  post: jest.fn(),
}));

const mockProxyHandler = jest.fn((req, res) => {
  res.status(200).json({
    success: true,
    data: {
      proxiedPath: req.originalUrl,
    },
  });
});

const mockCreateServiceProxy = jest.fn(() => mockProxyHandler);

jest.mock('../proxy/serviceProxy', () => ({
  createServiceProxy: (...args) => mockCreateServiceProxy(...args),
}));

const messagingRoutes = require('./messaging.routes');

const buildApp = () => {
  const app = express();
  app.set('serviceUrls', {
    MESSAGING_SERVICE: 'http://messaging-service.test',
  });
  app.use(express.json());
  app.use((req, _res, next) => {
    req.id = 'request-123';
    req.user = {
      id: 'worker-1',
      role: 'worker',
      email: 'worker@example.com',
    };
    next();
  });
  app.use('/api/messages', messagingRoutes);
  return app;
};

describe('messaging gateway trust headers', () => {
  const originalEnv = process.env;
  let consoleLogSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.INTERNAL_API_KEY = 'legacy-internal-key';
    process.env.SERVICE_TRUST_HMAC_SECRET = 'service-trust-secret';
    process.env.JWT_SECRET = 'jwt-secret-that-must-not-sign';
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('signs direct messaging requests with the dedicated service-trust secret', async () => {
    axios.post.mockResolvedValue({
      status: 201,
      data: { success: true, id: 'conversation-1' },
    });

    const response = await request(buildApp())
      .post('/api/messages/conversations')
      .send({ participantIds: ['worker-2'] });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ success: true, id: 'conversation-1' });

    const expectedPayload = JSON.stringify({
      id: 'worker-1',
      role: 'worker',
      email: 'worker@example.com',
    });
    const expectedSignature = crypto
      .createHmac('sha256', 'service-trust-secret')
      .update(expectedPayload)
      .digest('hex');

    expect(axios.post).toHaveBeenCalledWith(
      'http://messaging-service.test/api/conversations',
      { participantIds: ['worker-2'] },
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-authenticated-user': expectedPayload,
          'x-auth-source': 'api-gateway',
          'x-gateway-signature': expectedSignature,
          'X-Internal-Request': 'legacy-internal-key',
        }),
      }),
    );
  });

  test('fails closed when the service-trust secret is missing', async () => {
    delete process.env.SERVICE_TRUST_HMAC_SECRET;
    delete process.env.INTERNAL_API_KEY;

    const response = await request(buildApp())
      .post('/api/messages/conversations')
      .send({ participantIds: ['worker-2'] });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      success: false,
      message: 'Messaging gateway trust is misconfigured',
      error: {
        code: 'SERVICE_TRUST_MISCONFIGURED',
        message: 'SERVICE_TRUST_HMAC_SECRET or INTERNAL_API_KEY must be configured',
      },
    });
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('proxies mobile conversation-by-id path through gateway conversation contract', async () => {
    const conversationPayload = {
      success: true,
      data: {
        conversation: {
          id: '69aa0b13e0a41572beebe499',
          participants: [],
          messages: [],
        },
      },
    };

    mockProxyHandler.mockImplementationOnce((_req, res) => {
      res.status(200).json(conversationPayload);
    });

    const response = await request(buildApp())
      .get('/api/messages/conversations/69aa0b13e0a41572beebe499');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(conversationPayload);
    expect(mockCreateServiceProxy).toHaveBeenCalledWith(
      expect.objectContaining({
        target: 'http://messaging-service.test',
        requireAuth: true,
        pathRewrite: {
          '^/api/messages/conversations': '/api/conversations',
          '^/api/messaging/conversations': '/api/conversations',
        },
      }),
    );
    expect(mockProxyHandler).toHaveBeenCalled();
  });

  test('preserves 404 envelope for mobile conversation-by-id not-found responses', async () => {
    const notFoundPayload = {
      success: false,
      error: {
        code: 'CONVERSATION_NOT_FOUND',
        message: 'Conversation not found or access denied',
      },
    };

    mockProxyHandler.mockImplementationOnce((_req, res) => {
      res.status(404).json(notFoundPayload);
    });

    const response = await request(buildApp())
      .get('/api/messages/conversations/000000000000000000000000');

    expect(response.status).toBe(404);
    expect(response.body).toEqual(notFoundPayload);
  });
});