/**
 * Health Check Tests for user-service
 */

const request = require('supertest');
const app = require('../server');

describe('Health Endpoints', () => {
  test('GET /health should return service health', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('service', 'User Service');
    expect(response.body).toHaveProperty('status', 'OK');
    expect(response.body).toHaveProperty('timestamp');
  });

  test('GET /api/health should mirror health response contract', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('service', 'User Service');
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

  test('GET / should expose service descriptor metadata', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('name', 'User Service API');
    expect(response.body).toHaveProperty('version', '1.0.0');
    expect(response.body).toHaveProperty('timestamp');
  });
});
