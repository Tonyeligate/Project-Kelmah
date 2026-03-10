const crypto = require('crypto');
const express = require('express');
const request = require('supertest');
const axios = require('axios');

jest.mock('axios', () => ({
  post: jest.fn(),
}));

jest.mock('../proxy/serviceProxy', () => ({
  createServiceProxy: jest.fn(() => (_req, res) => {
    res.status(502).json({ success: false, message: 'proxy should not be used' });
  }),
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
});