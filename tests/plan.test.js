const request = require('supertest');
const app = require('../src/app');

describe('Plans API', () => {
  test('GET /api/plans should require authentication', async () => {
    const res = await request(app).get('/api/plans');
    expect(res.statusCode).toBe(401);
  });
}); 