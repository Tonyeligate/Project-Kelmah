/**
 * Health Check Tests for auth-service
 */

const request = require('supertest');
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-auth-health';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-for-auth-health';

const app = require('../server');

describe('Health Endpoints', () => {
  test('GET /health should return service health', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('service', 'Auth Service');
    expect(response.body).toHaveProperty('status', 'OK');
    expect(response.body).toHaveProperty('timestamp');
  });

  test('GET /api/health should mirror health response contract', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('service', 'Auth Service');
    expect(response.body).toHaveProperty('status', 'OK');
    expect(response.body).toHaveProperty('timestamp');
  });

  test('GET /health/ready should return readiness status', async () => {
    const response = await request(app).get('/health/ready');

    expect([200, 503]).toContain(response.status);
    expect(response.body).toHaveProperty('ready');
    expect(typeof response.body.ready).toBe('boolean');
    expect(response.body).toHaveProperty('timestamp');
  });

  test('GET /health/live should return liveness status', async () => {
    const response = await request(app).get('/health/live');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('alive', true);
    expect(response.body).toHaveProperty('timestamp');
  });

  test('GET /api/health/live should return liveness status', async () => {
    const response = await request(app).get('/api/health/live');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('alive', true);
    expect(response.body).toHaveProperty('timestamp');
  });
});
