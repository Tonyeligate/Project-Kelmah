jest.mock('../config/db', () => ({
  ensureConnection: jest.fn(() => Promise.resolve()),
  mongoose: require('mongoose'),
}));

const modelsModule = require('../models');
const { createMockResponse } = require('../../../shared/test-utils');

const trackedModels = ['User', 'WorkerProfile', 'Job', 'Application', 'ActivityEvent'];
const originalDescriptors = {};

const setModel = (name, value) => {
  Object.defineProperty(modelsModule, name, {
    configurable: true,
    get: () => value,
  });
};

const createLeanQuery = (result) => ({
  select: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(result),
});

const createPersistedActivityQuery = (result) => ({
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(result),
});

describe('user profile activity controller', () => {
  beforeAll(() => {
    trackedModels.forEach((key) => {
      originalDescriptors[key] = Object.getOwnPropertyDescriptor(modelsModule, key);
    });
  });

  afterAll(() => {
    trackedModels.forEach((key) => {
      Object.defineProperty(modelsModule, key, originalDescriptors[key]);
    });
  });

  afterEach(() => {
    trackedModels.forEach((key) => setModel(key, undefined));
    jest.resetModules();
  });

  test('returns activity even when legacy activity fields are absent', async () => {
    const controller = require('../controllers/user.controller');
    const res = createMockResponse();

    setModel('User', {
      findById: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({
          _id: 'worker-1',
          role: 'worker',
          firstName: 'Akosua',
          lastName: 'Mensimah',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-03-01T00:00:00.000Z',
        }),
      })),
    });

    setModel('WorkerProfile', {
      findOne: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({
          _id: 'profile-1',
          userId: 'worker-1',
          createdAt: '2026-01-02T00:00:00.000Z',
          updatedAt: '2026-03-02T00:00:00.000Z',
        }),
      })),
    });

    setModel('Application', {
      find: jest.fn(() => createLeanQuery([
        {
          _id: 'application-1',
          job: 'job-1',
          status: 'pending',
          createdAt: '2026-03-03T00:00:00.000Z',
          updatedAt: '2026-03-03T00:00:00.000Z',
        },
      ])),
    });

    setModel('Job', {
      find: jest.fn((query) => {
        if (query?.worker === 'worker-1') {
          return createLeanQuery([
            {
              _id: 'job-assigned-1',
              title: 'Apartment wiring fix',
              status: 'in-progress',
              createdAt: '2026-03-04T00:00:00.000Z',
              updatedAt: '2026-03-04T00:00:00.000Z',
            },
          ]);
        }

        return createLeanQuery([
          {
            _id: 'job-1',
            title: 'Shop rewiring',
            status: 'open',
          },
        ]);
      }),
    });

    setModel('ActivityEvent', {
      bulkWrite: jest.fn().mockResolvedValue({ ok: 1 }),
      countDocuments: jest.fn().mockResolvedValue(3),
      find: jest.fn(() => createPersistedActivityQuery([
        {
          _id: 'event-1',
          type: 'application_submitted',
          occurredAt: '2026-03-03T00:00:00.000Z',
          summary: 'You applied to "Shop rewiring"',
          details: { jobId: 'job-1', applicationId: 'application-1', status: 'pending' },
        },
        {
          _id: 'event-2',
          type: 'profile_updated',
          occurredAt: '2026-03-02T00:00:00.000Z',
          summary: 'You updated your profile',
          details: { source: 'worker-profile' },
        },
        {
          _id: 'event-3',
          type: 'account_created',
          occurredAt: '2026-01-01T00:00:00.000Z',
          summary: 'You joined Kelmah',
          details: { source: 'user-profile' },
        },
      ])),
    });

    await controller.getProfileActivity({
      user: { id: 'worker-1', role: 'worker' },
      query: { page: '1', limit: '5' },
    }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'account_created' }),
        expect.objectContaining({ type: 'profile_updated' }),
        expect.objectContaining({ type: 'application_submitted' }),
      ]),
    );
  });
});