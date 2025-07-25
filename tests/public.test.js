const request = require('supertest');
const app = require('../src/app');

describe('Public endpoints require authentication', () => {
  const endpoints = [
    '/api/plans',
    '/api/subscriptions',
    '/api/transactions',
    '/api/disputes',
    '/api/escrows',
    '/api/wallets',
    '/api/reviews',
    '/api/notifications'
  ];

  endpoints.forEach((endpoint) => {
    test(`GET ${endpoint} returns 401 Unauthorized`, async () => {
      const res = await request(app).get(endpoint);
      expect(res.statusCode).toBe(401);
    });
  });
}); 