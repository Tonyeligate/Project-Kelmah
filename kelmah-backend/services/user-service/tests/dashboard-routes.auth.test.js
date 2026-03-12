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
  optionalGatewayVerification: (_req, _res, next) => next(),
}));

jest.mock('../middlewares/auth', () => ({
  validateAvailabilityPayload: (_req, _res, next) => next(),
  authorizeRoles: (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    return next();
  },
}));

const mockUserController = {
  getAllUsers: jest.fn((_req, res) => res.json({ success: true })),
  createUser: jest.fn((_req, res) => res.json({ success: true })),
  getDashboardMetrics: jest.fn((_req, res) => res.json({ success: true, route: 'metrics' })),
  getDashboardWorkers: jest.fn((_req, res) => res.json({ success: true, route: 'workers' })),
  getDashboardAnalytics: jest.fn((_req, res) => res.json({ success: true, route: 'analytics' })),
  getProfileStatistics: jest.fn((_req, res) => res.json({ success: true })),
  getProfileActivity: jest.fn((_req, res) => res.json({ success: true })),
  getProfilePreferences: jest.fn((_req, res) => res.json({ success: true })),
  getMyProfileSignals: jest.fn((_req, res) => res.json({ success: true })),
  getUserAvailability: jest.fn((_req, res) => res.json({ success: true })),
  getUserCredentials: jest.fn((_req, res) => res.json({ success: true })),
  getUserProfile: jest.fn((_req, res) => res.json({ success: true })),
  updateUserProfile: jest.fn((_req, res) => res.json({ success: true })),
  toggleBookmark: jest.fn((_req, res) => res.json({ success: true })),
  getEarnings: jest.fn((_req, res) => res.json({ success: true })),
  getBookmarks: jest.fn((_req, res) => res.json({ success: true })),
  cleanupDatabase: jest.fn((_req, res) => res.json({ success: true })),
  bulkUpdateUsers: jest.fn((_req, res) => res.json({ success: true })),
  bulkDeleteUsers: jest.fn((_req, res) => res.json({ success: true })),
};

jest.mock('../controllers/user.controller', () => mockUserController);

const mockWorkerController = {
  getRecentJobs: jest.fn((_req, res) => res.json({ success: true })),
  searchWorkers: jest.fn((_req, res) => res.json({ success: true })),
  getTradeCategoryStats: jest.fn((_req, res) => res.json({ success: true })),
  getWorkerProfileAlignmentAudit: jest.fn((_req, res) => res.json({ success: true })),
  getAllWorkers: jest.fn((_req, res) => res.json({ success: true })),
  getWorkerById: jest.fn((_req, res) => res.json({ success: true })),
  updateWorkerProfile: jest.fn((_req, res) => res.json({ success: true })),
  getWorkerAvailability: jest.fn((_req, res) => res.json({ success: true })),
  getProfileCompletion: jest.fn((_req, res) => res.json({ success: true })),
  getWorkerSkills: jest.fn((_req, res) => res.json({ success: true })),
  upsertWorkerSkillsBulk: jest.fn((_req, res) => res.json({ success: true })),
  createWorkerSkill: jest.fn((_req, res) => res.json({ success: true })),
  updateWorkerSkill: jest.fn((_req, res) => res.json({ success: true })),
  deleteWorkerSkill: jest.fn((_req, res) => res.status(204).send()),
  getWorkerWorkHistory: jest.fn((_req, res) => res.json({ success: true })),
  addWorkHistoryEntry: jest.fn((_req, res) => res.json({ success: true })),
  updateWorkHistoryEntry: jest.fn((_req, res) => res.json({ success: true })),
  deleteWorkHistoryEntry: jest.fn((_req, res) => res.status(204).send()),
  getWorkerPortfolio: jest.fn((_req, res) => res.json({ success: true })),
  createWorkerPortfolioItem: jest.fn((_req, res) => res.json({ success: true })),
  updateWorkerPortfolioItem: jest.fn((_req, res) => res.json({ success: true })),
  deleteWorkerPortfolioItem: jest.fn((_req, res) => res.status(204).send()),
  getWorkerCertificates: jest.fn((_req, res) => res.json({ success: true })),
  addWorkerCertificate: jest.fn((_req, res) => res.json({ success: true })),
  updateWorkerCertificate: jest.fn((_req, res) => res.json({ success: true })),
  deleteWorkerCertificate: jest.fn((_req, res) => res.status(204).send()),
};

jest.mock('../controllers/worker.controller', () => mockWorkerController);
jest.mock('../routes/worker-detail.routes', () => {
  const express = require('express');
  const router = express.Router();
  return router;
});

const router = require('../routes/user.routes');

describe('user-service dashboard route authorization', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(router);
    Object.values(mockUserController).forEach((mockFn) => mockFn.mockClear());
    Object.values(mockWorkerController).forEach((mockFn) => mockFn.mockClear());
  });

  test.each([
    ['/dashboard/metrics', mockUserController.getDashboardMetrics],
    ['/dashboard/workers', mockUserController.getDashboardWorkers],
    ['/dashboard/analytics', mockUserController.getDashboardAnalytics],
    ['/workers/alignment/audit', mockWorkerController.getWorkerProfileAlignmentAudit],
  ])('blocks non-admin access to %s', async (path, controllerMock) => {
    const response = await request(app)
      .get(path)
      .set('x-test-role', 'hirer');

    expect(response.status).toBe(403);
    expect(controllerMock).not.toHaveBeenCalled();
  });

  test.each([
    ['/dashboard/metrics', mockUserController.getDashboardMetrics],
    ['/dashboard/workers', mockUserController.getDashboardWorkers],
    ['/dashboard/analytics', mockUserController.getDashboardAnalytics],
    ['/workers/alignment/audit', mockWorkerController.getWorkerProfileAlignmentAudit],
  ])('allows admin access to %s', async (path, controllerMock) => {
    const response = await request(app)
      .get(path)
      .set('x-test-role', 'admin');

    expect(response.status).toBe(200);
    expect(controllerMock).toHaveBeenCalledTimes(1);
  });

  test('does not duplicate worker nested resource routes on the top-level router', () => {
    const directPaths = router.stack
      .filter((layer) => layer.route)
      .map((layer) => layer.route.path);

    expect(directPaths).not.toEqual(expect.arrayContaining([
      '/workers/:workerId/skills',
      '/workers/:workerId/skills/bulk',
      '/workers/:workerId/skills/:skillId',
      '/workers/:workerId/work-history',
      '/workers/:workerId/work-history/:entryId',
      '/workers/:workerId/portfolio',
      '/workers/:workerId/portfolio/:portfolioId',
      '/workers/:workerId/certificates',
      '/workers/:workerId/certificates/:certificateId',
    ]));
  });
});