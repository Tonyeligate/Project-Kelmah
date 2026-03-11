const express = require('express');
const request = require('supertest');
const axios = require('axios');

jest.mock('axios');
jest.mock('../middlewares/auth', () => ({
  authenticate: (req, res, next) => {
    req.user = {
      id: 'worker-1',
      role: 'worker',
      email: 'worker@example.com',
    };
    req.headers['x-authenticated-user'] = JSON.stringify(req.user);
    req.headers['x-gateway-signature'] = 'test-signature';
    next();
  },
  authorizeRoles: (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: { message: 'Forbidden' } });
    }
    next();
  },
  optionalAuth: (req, res, next) => next(),
}));

const jobRoutes = require('./job.routes');

describe('job gateway routes', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.set('serviceUrls', {
      JOB_SERVICE: 'http://job-service.test',
    });
    app.use(express.json());
    app.use('/api/jobs', jobRoutes);
  });

  test('forwards personalized recommendations requests to the job service', async () => {
    axios.mockResolvedValue({
      status: 200,
      data: {
        success: true,
        data: {
          jobs: [],
        },
      },
    });

    const response = await request(app)
      .get('/api/jobs/recommendations/personalized?page=1&limit=3');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        jobs: [],
      },
    });
    expect(axios).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: 'http://job-service.test/api/jobs/recommendations/personalized?page=1&limit=3',
        headers: expect.objectContaining({
          'x-authenticated-user': JSON.stringify({
            id: 'worker-1',
            role: 'worker',
            email: 'worker@example.com',
          }),
          'x-gateway-signature': 'test-signature',
          'x-auth-source': 'api-gateway',
        }),
      }),
    );
  });

  test('forwards job search requests with the original query string', async () => {
    axios.mockResolvedValue({
      status: 200,
      data: {
        success: true,
        data: {
          jobs: [{ id: 'job-1' }],
        },
      },
    });

    const response = await request(app)
      .get('/api/jobs/search?q=commercial+wiring&location=Accra&page=2&limit=10');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        jobs: [{ id: 'job-1' }],
      },
    });
    expect(axios).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: 'http://job-service.test/api/jobs/search?q=commercial+wiring&location=Accra&page=2&limit=10',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'User-Agent': 'kelmah-api-gateway',
        }),
      }),
    );
  });
});