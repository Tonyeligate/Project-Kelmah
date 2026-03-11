const mongoose = require('mongoose');

const createResponse = () => {
  const res = {};
  res.status = jest.fn().mockImplementation((code) => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn().mockImplementation((payload) => {
    res.body = payload;
    return res;
  });
  return res;
};

const createFindChain = (value) => {
  const chain = {
    select: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    maxTimeMS: jest.fn().mockResolvedValue(value),
  };
  return chain;
};

const createCountChain = (value) => ({
  maxTimeMS: jest.fn().mockResolvedValue(value),
});

jest.mock('../models', () => ({
  Job: { find: jest.fn() },
  User: { collection: { name: 'users' } },
  Application: { aggregate: jest.fn(), countDocuments: jest.fn() },
  SavedJob: {},
  Bid: {},
  UserPerformance: {},
  WorkerProfile: {},
  Category: {},
  Contract: {},
  ContractDispute: {},
  Availability: {},
}));

jest.mock('../middlewares/error', () => ({
  AppError: class AppError extends Error {},
}));

jest.mock('../utils/response', () => ({
  successResponse: jest.fn((res, statusCode, message, data = null, meta = {}) => {
    res.status(statusCode).json({
      success: true,
      message,
      data,
      error: null,
      meta,
    });
    return res;
  }),
  errorResponse: jest.fn((res, statusCode, message, code = 'ERROR', details = {}) => {
    res.status(statusCode).json({
      success: false,
      message,
      data: null,
      error: { message, code, details },
      meta: {},
    });
    return res;
  }),
  paginatedResponse: jest.fn(),
}));

jest.mock('../config/db', () => ({
  ensureConnection: jest.fn(),
  ensureMongoReady: jest.fn(),
  mongoose: require('mongoose'),
}));

jest.mock('../utils/jobTransform', () => ({
  transformJobsForFrontend: jest.fn((jobs) => jobs),
  transformJobForFrontend: jest.fn((job) => job),
}));

jest.mock('../utils/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }),
}));

jest.mock('../../../shared/utils/cloudinary', () => ({
  hasCloudinaryConfig: jest.fn(() => false),
  uploadDataUri: jest.fn(),
  toMediaAsset: jest.fn(),
  isDataUri: jest.fn(() => false),
}));

describe('hirer applications summary sort aliases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test.each([
    ['latest', 'newest', { createdAt: -1, _id: -1 }],
    ['rating', 'highest-rated', { workerRatingSort: -1, createdAt: -1, _id: -1 }],
    ['rate', 'proposed-rate', { proposedRateSort: -1, createdAt: -1, _id: -1 }],
  ])('normalizes %s to %s for the paged applications query', async (alias, expectedSort, expectedSortStage) => {
    const standardJobId = new mongoose.Types.ObjectId();
    const workerId = new mongoose.Types.ObjectId();
    const applicationId = new mongoose.Types.ObjectId();
    const { Job, Application } = require('../models');
    const { getHirerApplicationsSummary } = require('../controllers/job.controller');

    Job.find.mockReturnValue(createFindChain([
      {
        _id: standardJobId,
        hirer: 'hirer-1',
        title: 'Electrical Rewire',
        bidding: {},
      },
    ]));

    Application.aggregate
      .mockImplementationOnce(() => ({
        option: jest.fn().mockResolvedValue([
          {
            _id: { job: standardJobId, status: 'pending' },
            count: 1,
          },
        ]),
      }))
      .mockImplementationOnce(() => ({
        option: jest.fn().mockResolvedValue([
          {
            _id: applicationId,
            job: standardJobId,
            worker: {
              _id: workerId,
              firstName: 'Kwame',
              lastName: 'Asante',
              profileImage: null,
              rating: 4.8,
            },
            proposedRate: 350,
            status: 'pending',
            createdAt: new Date('2026-03-11T10:00:00.000Z'),
          },
        ]),
      }));

    Application.countDocuments.mockReturnValue(createCountChain(1));

    const req = {
      id: 'req-1',
      user: { id: 'hirer-1', role: 'hirer' },
      query: {
        sort: alias,
        status: 'pending',
        page: '1',
        limit: '10',
      },
      headers: {},
    };
    const res = createResponse();
    const next = jest.fn();

    await getHirerApplicationsSummary(req, res, next);

    const itemsPipeline = Application.aggregate.mock.calls[1][0];
    const sortStage = itemsPipeline.find((stage) => stage.$sort);

    expect(sortStage.$sort).toEqual(expect.objectContaining(expectedSortStage));
    expect(res.statusCode).toBe(200);
    expect(res.body.data.filters.sort).toBe(expectedSort);
    expect(res.body.data.pagination.limit).toBe(10);
    expect(next).not.toHaveBeenCalled();
  });
});