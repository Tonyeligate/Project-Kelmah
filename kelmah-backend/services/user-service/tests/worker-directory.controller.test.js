jest.mock('../config/db', () => ({
  ensureConnection: jest.fn(() => Promise.resolve()),
}));

jest.mock('../models', () => ({
  loadModels: jest.fn(),
  User: undefined,
  WorkerProfile: undefined,
}));

jest.mock('../../../shared/utils/audit-logger', () => ({
  log: jest.fn(() => Promise.resolve()),
  query: jest.fn(() => Promise.resolve([])),
  getStatistics: jest.fn(() => Promise.resolve({ totalEvents: 0, byAction: {}, bySeverity: {} })),
}));

jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const { ensureConnection } = require('../config/db');
const modelsModule = require('../models');
const WorkerController = require('../controllers/worker.controller');
const { createMockResponse } = require('../../../shared/test-utils');

const trackedModels = ['User', 'WorkerProfile'];
const originalDescriptors = {};

const setModel = (name, value) => {
  Object.defineProperty(modelsModule, name, {
    configurable: true,
    get: () => value,
  });
};

describe('Worker directory controllers', () => {
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
    ensureConnection.mockClear();
    trackedModels.forEach((key) => {
      Object.defineProperty(modelsModule, key, originalDescriptors[key]);
    });
  });

  test('getAllWorkers uses WorkerProfile as the aggregation root and preserves the list contract', async () => {
    const res = createMockResponse();
    const mockUserAggregate = jest.fn();
    const mockWorkerProfileAggregate = jest.fn().mockResolvedValue([
      {
        items: [
          {
            _id: 'worker-profile-1',
            userId: 'worker-1',
            profession: 'Master Electrician',
            title: 'Master Electrician',
            headline: 'Master Electrician',
            bio: 'Certified electrician focused on panel diagnostics.',
            location: 'Accra, Ghana',
            hourlyRate: 180,
            currency: 'GHS',
            rating: 4.8,
            totalReviews: 13,
            totalJobsCompleted: 29,
            availabilityStatus: 'available',
            isVerified: true,
            yearsOfExperience: 6,
            skills: ['Diagnostics'],
            specializations: ['Electrical Work'],
            createdAt: '2026-02-01T10:00:00.000Z',
            updatedAt: '2026-03-01T10:00:00.000Z',
            latitude: 5.6037,
            longitude: -0.187,
            user: {
              _id: 'worker-1',
              firstName: 'Ama',
              lastName: 'Osei',
              role: 'worker',
              isActive: true,
              profession: 'Legacy Electrician',
              skills: ['Wiring'],
              profilePicture: 'ama.png',
            },
          },
        ],
        total: [{ count: 1 }],
      },
    ]);

    setModel('User', {
      collection: { collectionName: 'users' },
      aggregate: mockUserAggregate,
    });

    setModel('WorkerProfile', {
      collection: { collectionName: 'workerprofiles' },
      aggregate: mockWorkerProfileAggregate,
    });

    await WorkerController.getAllWorkers({
      query: {
        page: '1',
        limit: '12',
        city: 'Accra',
        primaryTrade: 'electrical work',
        skills: 'Wiring,Diagnostics',
        verified: 'true',
      },
    }, res);

    expect(ensureConnection).toHaveBeenCalled();
    expect(mockWorkerProfileAggregate).toHaveBeenCalledTimes(1);
    expect(mockUserAggregate).not.toHaveBeenCalled();

    const pipeline = mockWorkerProfileAggregate.mock.calls[0][0];
    expect(pipeline[0]).toEqual(expect.objectContaining({
      $match: expect.objectContaining({
        $and: expect.arrayContaining([
          { userId: { $exists: true, $ne: null } },
        ]),
      }),
    }));

    const lookupStage = pipeline.find((stage) => stage.$lookup);
    expect(lookupStage).toEqual(expect.objectContaining({
      $lookup: expect.objectContaining({
        from: 'users',
        as: 'user',
        let: { workerUserId: '$userId' },
      }),
    }));
    expect(lookupStage.$lookup.pipeline?.[0]).toEqual(expect.objectContaining({
      $match: expect.objectContaining({
        role: 'worker',
        isActive: true,
      }),
    }));
    expect(pipeline.find((stage) => stage.$match?.['user.role'] || stage.$match?.['user.isActive'])).toBeUndefined();

    const addFieldsStage = pipeline.find((stage) => stage.$addFields);
    expect(JSON.stringify(addFieldsStage?.$addFields?.canonicalProfession || {})).toContain('$title');
    expect(JSON.stringify(addFieldsStage?.$addFields?.canonicalProfession || {})).toContain('$headline');
    expect(JSON.stringify(addFieldsStage?.$addFields?.canonicalProfession || {})).toContain('$user.profession');

    const directoryFilterStages = pipeline.filter((stage) => stage.$match?.$and);
    const directoryFilterStage = directoryFilterStages[directoryFilterStages.length - 1];
    expect(JSON.stringify(directoryFilterStage)).toContain('canonicalProfession');
    expect(JSON.stringify(directoryFilterStage)).toContain('canonicalVerified');

    expect(res.statusCode).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.pagination?.total).toBe(1);
    expect(res.body?.data?.items).toEqual([
      expect.objectContaining({
        userId: 'worker-1',
        name: 'Ama Osei',
        profession: 'Master Electrician',
        skills: expect.arrayContaining([
          expect.objectContaining({ name: 'Diagnostics' }),
        ]),
        specializations: expect.arrayContaining(['Electrical Work']),
      }),
    ]);
  });

  test('searchWorkers keeps the existing response contract while querying through WorkerProfile', async () => {
    const res = createMockResponse();
    const mockUserAggregate = jest.fn();
    const mockWorkerProfileAggregate = jest.fn().mockResolvedValue([
      {
        items: [
          {
            _id: 'worker-profile-2',
            userId: 'worker-2',
            bio: 'Trusted plumber serving Tema.',
            location: 'Tema, Ghana',
            hourlyRate: 120,
            currency: 'GHS',
            rating: 4.6,
            totalReviews: 9,
            totalJobsCompleted: 18,
            availabilityStatus: 'available',
            isVerified: false,
            yearsOfExperience: 4,
            skills: ['Pipe Installation'],
            specializations: ['Plumbing'],
            updatedAt: '2026-03-05T08:00:00.000Z',
            user: {
              _id: 'worker-2',
              firstName: 'Kojo',
              lastName: 'Mensah',
              role: 'worker',
              isActive: true,
              profession: 'Plumber',
              skills: ['Leak Repair'],
            },
          },
        ],
        total: [{ count: 1 }],
      },
    ]);

    setModel('User', {
      collection: { collectionName: 'users' },
      aggregate: mockUserAggregate,
    });

    setModel('WorkerProfile', {
      collection: { collectionName: 'workerprofiles' },
      aggregate: mockWorkerProfileAggregate,
    });

    await WorkerController.searchWorkers({
      query: {
        query: 'Kojo',
        location: 'Tema',
        skills: 'Leak Repair',
        availability: 'available',
        sortBy: 'rating',
      },
    }, res);

    expect(ensureConnection).toHaveBeenCalled();
    expect(mockWorkerProfileAggregate).toHaveBeenCalledTimes(1);
    expect(mockUserAggregate).not.toHaveBeenCalled();

    const pipeline = mockWorkerProfileAggregate.mock.calls[0][0];
    expect(pipeline[0]).toEqual(expect.objectContaining({
      $match: expect.objectContaining({
        $and: expect.arrayContaining([
          { userId: { $exists: true, $ne: null } },
        ]),
      }),
    }));

    const lookupStage = pipeline.find((stage) => stage.$lookup);
    expect(lookupStage?.$lookup?.pipeline?.[0]).toEqual(expect.objectContaining({
      $match: expect.objectContaining({
        role: 'worker',
        isActive: true,
      }),
    }));
    expect(pipeline.find((stage) => stage.$match?.['user.role'] || stage.$match?.['user.isActive'])).toBeUndefined();

    const directoryFilterStages = pipeline.filter((stage) => stage.$match?.$and);
    const directoryFilterStage = directoryFilterStages[directoryFilterStages.length - 1];
    expect(JSON.stringify(directoryFilterStage)).toContain('canonicalFirstName');
    expect(JSON.stringify(directoryFilterStage)).toContain('canonicalSkills');

    expect(res.statusCode).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.searchParams?.query).toBe('Kojo');
    expect(res.body?.data?.workers).toEqual([
      expect.objectContaining({
        userId: 'worker-2',
        name: 'Kojo Mensah',
        profession: 'Plumber',
        skills: expect.arrayContaining(['Pipe Installation']),
        specializations: expect.arrayContaining(['Plumbing']),
      }),
    ]);
  });

  test('getAllWorkers enforces radius filtering for canonical geo searches', async () => {
    const res = createMockResponse();
    const mockUserAggregate = jest.fn();
    const mockWorkerProfileAggregate = jest.fn().mockResolvedValue([
      {
        _id: 'worker-profile-near',
        userId: 'worker-near',
        bio: 'Nearby electrician in Accra.',
        location: 'Accra, Ghana',
        hourlyRate: 160,
        currency: 'GHS',
        rating: 4.9,
        totalReviews: 15,
        totalJobsCompleted: 31,
        availabilityStatus: 'available',
        isVerified: true,
        yearsOfExperience: 8,
        skills: ['Diagnostics'],
        specializations: ['Electrical Work'],
        latitude: 5.6037,
        longitude: -0.187,
        user: {
          _id: 'worker-near',
          firstName: 'Ama',
          lastName: 'Osei',
          role: 'worker',
          isActive: true,
          profession: 'Electrician',
          skills: ['Wiring'],
        },
      },
      {
        _id: 'worker-profile-far',
        userId: 'worker-far',
        bio: 'Far away plumber in Kumasi.',
        location: 'Kumasi, Ghana',
        hourlyRate: 110,
        currency: 'GHS',
        rating: 4.2,
        totalReviews: 8,
        totalJobsCompleted: 12,
        availabilityStatus: 'available',
        isVerified: false,
        yearsOfExperience: 5,
        skills: ['Pipe Repair'],
        specializations: ['Plumbing'],
        latitude: 6.6885,
        longitude: -1.6244,
        user: {
          _id: 'worker-far',
          firstName: 'Kojo',
          lastName: 'Mensah',
          role: 'worker',
          isActive: true,
          profession: 'Plumber',
          skills: ['Leak Repair'],
        },
      },
    ]);

    setModel('User', {
      collection: { collectionName: 'users' },
      aggregate: mockUserAggregate,
    });

    setModel('WorkerProfile', {
      collection: { collectionName: 'workerprofiles' },
      aggregate: mockWorkerProfileAggregate,
    });

    await WorkerController.getAllWorkers({
      query: {
        page: '1',
        limit: '12',
        latitude: '5.6037',
        longitude: '-0.187',
        radius: '10',
      },
    }, res);

    expect(ensureConnection).toHaveBeenCalled();
    expect(mockWorkerProfileAggregate).toHaveBeenCalledTimes(1);
    expect(mockUserAggregate).not.toHaveBeenCalled();

    const pipeline = mockWorkerProfileAggregate.mock.calls[0][0];
    expect(pipeline.find((stage) => stage.$facet)).toBeUndefined();

    const directoryFilterStages = pipeline.filter((stage) => stage.$match?.$and);
    const geoFilterStage = directoryFilterStages[directoryFilterStages.length - 1];
    expect(JSON.stringify(geoFilterStage)).toContain('canonicalLatitude');
    expect(JSON.stringify(geoFilterStage)).toContain('canonicalLongitude');

    expect(res.statusCode).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.pagination?.total).toBe(1);
    expect(res.body?.data?.items).toEqual([
      expect.objectContaining({
        userId: 'worker-near',
        profession: 'Electrician',
        distance: 0,
        skills: expect.arrayContaining([
          expect.objectContaining({ name: 'Diagnostics' }),
        ]),
      }),
    ]);
  });
});