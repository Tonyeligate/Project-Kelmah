const express = require('express');
const request = require('supertest');
const axios = require('axios');

jest.mock('axios', () => jest.fn());
jest.mock('../middlewares/rate-limiter', () => ({
  rateLimiters: {
    auth: (req, res, next) => next(),
    general: (req, res, next) => next(),
  },
}));
jest.mock('../middlewares/auth', () => ({
  authenticate: (req, res, next) => {
    req.user = {
      id: 'hirer-1',
      role: 'hirer',
      email: 'hirer@example.com',
    };
    req.headers.authorization = 'Bearer live-token';
    req.headers['x-authenticated-user'] = JSON.stringify(req.user);
    req.headers['x-auth-source'] = 'api-gateway';
    req.headers['x-gateway-signature'] = 'signed-user';
    next();
  },
  authorizeRoles: () => (req, res, next) => next(),
  optionalAuth: (req, res, next) => next(),
}));
jest.mock('../proxy/serviceProxy', () => ({
  createServiceProxy: jest.fn(() => (req, res) => {
    res.status(502).json({ success: false, message: 'proxy should not be used' });
  }),
}));

const authRoutes = require('./auth.routes');

describe('auth gateway routes', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.set('serviceUrls', {
      AUTH_SERVICE: 'http://auth-service.test',
    });
    app.use(express.json());
    app.use('/api/auth', authRoutes);
  });

  test('forwards oauth exchange to the auth service', async () => {
    axios.mockResolvedValue({
      status: 400,
      data: {
        success: false,
        message: 'Invalid authorization code',
      },
      headers: {
        'content-type': 'application/json',
      },
    });

    const response = await request(app)
      .post('/api/auth/oauth/exchange')
      .send({
        provider: 'google',
        code: 'invalid-code',
        redirectUri: 'https://example.com/callback',
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: 'Invalid authorization code',
    });
    expect(axios).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'post',
        url: 'http://auth-service.test/api/auth/oauth/exchange',
        data: {
          provider: 'google',
          code: 'invalid-code',
          redirectUri: 'https://example.com/callback',
        },
      }),
    );
  });

  test('preserves upstream redirect headers for google oauth entry', async () => {
    axios.mockResolvedValue({
      status: 302,
      data: '',
      headers: {
        location: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=test',
      },
    });

    const response = await request(app)
      .get('/api/auth/google')
      .redirects(0);

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('https://accounts.google.com/o/oauth2/v2/auth?client_id=test');
    expect(axios).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'get',
        url: 'http://auth-service.test/api/auth/google',
        params: {},
      }),
    );
  });

  test('forwards protected auth mutations with gateway trust headers', async () => {
    axios.mockResolvedValue({
      status: 200,
      data: {
        status: 'success',
        message: 'Password changed successfully',
      },
      headers: {
        'content-type': 'application/json',
      },
    });

    const response = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', 'Bearer live-token')
      .send({
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'success',
      message: 'Password changed successfully',
    });
    expect(axios).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'post',
        url: 'http://auth-service.test/api/auth/change-password',
        headers: expect.objectContaining({
          Authorization: 'Bearer live-token',
          'x-authenticated-user': JSON.stringify({
            id: 'hirer-1',
            role: 'hirer',
            email: 'hirer@example.com',
          }),
          'x-auth-source': 'api-gateway',
          'x-gateway-signature': 'signed-user',
        }),
      }),
    );
  });

  test('forwards protected mfa setup without using the generic proxy middleware', async () => {
    axios.mockResolvedValue({
      status: 200,
      data: {
        status: 'success',
        data: {
          secret: 'BASE32SECRET',
        },
      },
      headers: {
        'content-type': 'application/json',
      },
    });

    const response = await request(app)
      .post('/api/auth/mfa/setup')
      .set('Authorization', 'Bearer live-token')
      .send({});

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'success',
      data: {
        secret: 'BASE32SECRET',
      },
    });
    expect(axios).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'post',
        url: 'http://auth-service.test/api/auth/mfa/setup',
      }),
    );
  });
});