const request = require('supertest');
const express = require('express');

// Mock controllers to isolate route validation
jest.mock('../src/controllers/job.controller', () => ({
  getJobs: jest.fn((req, res) => res.status(200).json({ success: true, message: 'ok', data: [], meta: {} })),
}));
jest.mock('../src/controllers/user.controller', () => ({
  searchUsers: jest.fn((req, res) => res.status(200).json({ success: true, message: 'ok', data: [], meta: {} })),
}));

const searchRoutes = require('../src/routes/search');

describe('Search Routes', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/search', searchRoutes);
  });

  describe('GET /api/search/jobs', () => {
    test('should return 200 and call jobController.getJobs with default query', async () => {
      const response = await request(app).get('/api/search/jobs');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, message: 'ok', data: [], meta: {} });
    });

    test('should return 400 for invalid budget format', async () => {
      const response = await request(app)
        .get('/api/search/jobs')
        .query({ budget: 'abc' });
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors.some(e => e.field === 'budget')).toBe(true);
    });
  });

  describe('GET /api/search/users', () => {
    test('should return 400 when q query param is missing', async () => {
      const response = await request(app).get('/api/search/users');
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors.some(e => e.field === 'q')).toBe(true);
    });

    test('should return 200 and call userController.searchUsers when q is provided', async () => {
      const response = await request(app)
        .get('/api/search/users')
        .query({ q: 'test' });
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, message: 'ok', data: [], meta: {} });
    });
  });
}); 