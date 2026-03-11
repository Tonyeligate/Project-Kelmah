const express = require('express');
const request = require('supertest');

const mockAuthenticate = jest.fn((req, res, next) => {
  req.user = {
    id: 'user-1',
    role: 'worker',
    email: 'worker@example.com',
  };
  req.headers.authorization = 'Bearer live-token';
  req.headers['x-authenticated-user'] = JSON.stringify(req.user);
  req.headers['x-auth-source'] = 'api-gateway';
  req.headers['x-gateway-signature'] = 'signed-user';
  next();
});

const mockProxyHandler = jest.fn((req, res) => {
  res.status(200).json({
    success: true,
    proxiedPath: req.originalUrl,
  });
});

const mockCreateServiceProxy = jest.fn(() => mockProxyHandler);

jest.mock('../middlewares/auth', () => ({
  authenticate: (...args) => mockAuthenticate(...args),
}));

jest.mock('../proxy/serviceProxy', () => ({
  createServiceProxy: (...args) => mockCreateServiceProxy(...args),
}));

const paymentRoutes = require('./payment.routes');

describe('payment gateway routes', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.set('serviceUrls', {
      PAYMENT_SERVICE: 'http://payment-service.test',
    });
    app.use(express.json());
    app.use('/api/payments', paymentRoutes);
  });

  test('forwards transaction history through the payment proxy with the payment service prefix', async () => {
    const response = await request(app)
      .get('/api/payments/transactions?status=completed&page=2')
      .set('Authorization', 'Bearer live-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      proxiedPath: '/api/payments/transactions?status=completed&page=2',
    });
    expect(mockAuthenticate).toHaveBeenCalled();
    expect(mockCreateServiceProxy).toHaveBeenCalledWith({
      target: 'http://payment-service.test',
      pathPrefix: '/api/payments',
      requireAuth: true,
    });
    expect(mockProxyHandler).toHaveBeenCalled();
  });

  test('forwards transaction creation through the payment proxy', async () => {
    const payload = {
      type: 'refund',
      amount: 150,
      currency: 'GHS',
      recipient: 'user-2',
      relatedTransaction: 'TRX_ORIGINAL_1',
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
    expect(mockCreateServiceProxy).toHaveBeenCalledWith({
      target: 'http://payment-service.test',
      pathPrefix: '/api/payments',
      requireAuth: true,
    });
    expect(mockProxyHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        body: payload,
      }),
      expect.any(Object),
      expect.any(Function),
    );
  });
});