const request = require('supertest');
const express = require('express');

// Mock controller methods to isolate route handling and responses
jest.mock('../src/controllers/review.controller', () => ({
  getReviewsForWorker: jest.fn((req, res) => res.status(200).json({ success: true, message: 'ok', data: [], meta: { pagination: { page: 1, limit: 10, total: 0, pageCount: 1 } } })),
  createReview: jest.fn((req, res) => res.status(201).json({ success: true, message: 'Review created', data: { id: 'review-1' } })),
  getMyReviews: jest.fn((req, res) => res.status(200).json({ success: true, message: 'My reviews', data: [] })),
}));

// Mock auth middleware to bypass authentication and authorization
jest.mock('../src/middlewares/auth', () => ({
  authenticateUser: (req, res, next) => next(),
  authorizeRoles: () => (req, res, next) => next(),
}));

const reviewRoutes = require('../src/routes/reviews');

describe('Review Routes', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/reviews', reviewRoutes);
  });

  describe('GET /api/reviews/worker/:id', () => {
    test('should return 200 and list of reviews', async () => {
      const response = await request(app).get('/api/reviews/worker/123');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, message: 'ok', data: [], meta: { pagination: { page: 1, limit: 10, total: 0, pageCount: 1 } } });
    });
  });

  describe('POST /api/reviews', () => {
    test('should return 400 when required fields are missing', async () => {
      const response = await request(app).post('/api/reviews').send({});
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors.some(e => e.field === 'job')).toBe(true);
      expect(response.body.errors.some(e => e.field === 'reviewee')).toBe(true);
      expect(response.body.errors.some(e => e.field === 'rating')).toBe(true);
    });

    test('should return 201 and created review for valid data', async () => {
      const validData = { job: 'job-1', reviewee: 'user-1', rating: 5, comment: 'Excellent work!' };
      const response = await request(app).post('/api/reviews').send(validData);
      expect(response.status).toBe(201);
      expect(response.body).toEqual({ success: true, message: 'Review created', data: { id: 'review-1' } });
    });
  });

  describe('GET /api/reviews/me', () => {
    test('should return 200 and my reviews', async () => {
      const response = await request(app).get('/api/reviews/me');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, message: 'My reviews', data: [] });
    });
  });
}); 