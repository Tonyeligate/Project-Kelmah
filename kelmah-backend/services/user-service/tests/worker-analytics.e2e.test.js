const express = require('express');
const request = require('supertest');

jest.mock('../../../shared/middlewares/serviceTrust', () => ({
  verifyGatewayRequest: (req, _res, next) => {
    req.user = {
      id: req.headers['x-test-user-id'] || 'user-1',
      role: req.headers['x-test-role'] || 'worker',
    };
    next();
  },
}));

const mockAnalyticsController = {
  getPlatformAnalytics: jest.fn((_req, res) =>
    res.status(200).json({ success: true, route: 'platform' }),
  ),
  getSystemMetrics: jest.fn((_req, res) =>
    res.status(200).json({ success: true, route: 'system-metrics' }),
  ),
  getUserActivity: jest.fn((_req, res) =>
    res.status(200).json({ success: true, route: 'user-activity' }),
  ),
  getWorkerAnalytics: jest.fn((_req, res) =>
    res.status(200).json({ success: true, route: 'worker-analytics' }),
  ),
};

jest.mock('../controllers/analytics.controller', () => mockAnalyticsController);

const router = require('../routes/analytics.routes');

describe('analytics routes authorization', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use('/api/analytics', router);
    Object.values(mockAnalyticsController).forEach((fn) => fn.mockClear());
  });

  test.each([
    ['/api/analytics/platform', mockAnalyticsController.getPlatformAnalytics],
    ['/api/analytics/system-metrics', mockAnalyticsController.getSystemMetrics],
    ['/api/analytics/user-activity', mockAnalyticsController.getUserActivity],
  ])('blocks non-admin access to %s', async (path, controllerSpy) => {
    const response = await request(app)
      .get(path)
      .set('x-test-role', 'worker');

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Admin access required' });
    expect(controllerSpy).not.toHaveBeenCalled();
  });

  test.each([
    ['/api/analytics/platform', mockAnalyticsController.getPlatformAnalytics],
    ['/api/analytics/system-metrics', mockAnalyticsController.getSystemMetrics],
    ['/api/analytics/user-activity', mockAnalyticsController.getUserActivity],
  ])('allows admin access to %s', async (path, controllerSpy) => {
    const response = await request(app)
      .get(path)
      .set('x-test-role', 'admin');

    expect(response.status).toBe(200);
    expect(controllerSpy).toHaveBeenCalledTimes(1);
  });

  test('allows authenticated users to access worker analytics by worker id', async () => {
    const response = await request(app)
      .get('/api/analytics/worker/worker-42')
      .set('x-test-role', 'worker');

    expect(response.status).toBe(200);
    expect(mockAnalyticsController.getWorkerAnalytics).toHaveBeenCalledTimes(1);

    const reqArg = mockAnalyticsController.getWorkerAnalytics.mock.calls[0][0];
    expect(reqArg.params.workerId).toBe('worker-42');
  });
});


