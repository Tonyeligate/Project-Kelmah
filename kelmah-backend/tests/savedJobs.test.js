const request = require('supertest');
const express = require('express');

// Mock auth middleware to bypass authentication and authorization
jest.mock('../src/middlewares/auth', () => ({
  authenticateUser: (req, res, next) => next(),
  authorizeRoles: () => (req, res, next) => next(),
}));

// Mock controller methods to isolate route handling
jest.mock('../src/controllers/savedJobs.controller', () => ({
  saveJob: jest.fn((req, res) => res.status(201).json({ success: true, message: 'Job saved', data: { id: req.params.id } })),
  unsaveJob: jest.fn((req, res) => res.status(200).json({ success: true, message: 'Job unsaved' })),
  getSavedJobs: jest.fn((req, res) => res.status(200).json({ success: true, message: 'Saved jobs', data: [{ id: '1' }], meta: {} })),
}));

const jobRoutes = require('../src/routes/job.routes');

describe('Saved Jobs Routes', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/jobs', jobRoutes);
  });

  test('POST /api/jobs/:id/save should save job', async () => {
    const response = await request(app).post('/api/jobs/123/save');
    expect(response.status).toBe(201);
    expect(response.body).toEqual({ success: true, message: 'Job saved', data: { id: '123' } });
  });

  test('DELETE /api/jobs/:id/save should unsave job', async () => {
    const response = await request(app).delete('/api/jobs/456/save');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, message: 'Job unsaved' });
  });

  test('GET /api/jobs/saved should return saved jobs', async () => {
    const response = await request(app).get('/api/jobs/saved');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, message: 'Saved jobs', data: [{ id: '1' }], meta: {} });
  });
}); 