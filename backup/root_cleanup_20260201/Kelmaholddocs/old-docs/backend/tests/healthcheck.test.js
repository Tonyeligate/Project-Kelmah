const request = require('supertest');
const express = require('express');
const healthCheckRouter = require('../src/routes/healthcheck');

describe('Health Check API', () => {
  let app;

  beforeEach(() => {
    // Create a new Express app for each test
    app = express();
    app.use('/api/health', healthCheckRouter);
  });

  test('GET /api/health returns 200 status and correct structure', async () => {
    // Arrange & Act
    const response = await request(app).get('/api/health');
    
    // Assert
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('environment');
    expect(response.body).toHaveProperty('version');
  });

  test('Health check response includes expected environment', async () => {
    // Arrange
    process.env.NODE_ENV = 'test';
    
    // Act
    const response = await request(app).get('/api/health');
    
    // Assert
    expect(response.body.environment).toBe('test');
  });

  test('Health check returns correct uptime format', async () => {
    // Act
    const response = await request(app).get('/api/health');
    
    // Assert
    expect(response.body.uptime).toMatch(/^\d+ seconds$/);
  });

  test('Health check timestamp is in ISO format', async () => {
    // Act
    const response = await request(app).get('/api/health');
    
    // Assert
    const timestamp = new Date(response.body.timestamp);
    expect(timestamp).toBeInstanceOf(Date);
    expect(response.body.timestamp).toBe(timestamp.toISOString());
  });
}); 