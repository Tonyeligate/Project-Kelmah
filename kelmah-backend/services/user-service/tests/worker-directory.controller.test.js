const modelsModule = require('../models');

jest.mock('../config/db', () => ({
  ensureConnection: jest.fn(() => Promise.resolve()),
}));

const { ensureConnection } = require('../config/db');
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
              profession: 'Electrician',
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
      $lookup: expect.objectContaining({ from: 'users', localField: 'userId', foreignField: '_id', as: 'user' }),
    }));

    const directoryFilterStage = pipeline.find((stage) => stage.$match?.$and);
    expect(JSON.stringify(directoryFilterStage)).toContain('canonicalProfession');
    expect(JSON.stringify(directoryFilterStage)).toContain('canonicalVerified');

    expect(res.statusCode).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.pagination?.total).toBe(1);
    expect(res.body?.data?.items).toEqual([
      expect.objectContaining({
        userId: 'worker-1',
        name: 'Ama Osei',
        profession: 'Electrician',
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
    const directoryFilterStage = pipeline.find((stage) => stage.$match?.$and);
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
});