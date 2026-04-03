const mongoose = require('mongoose');

const HIRER_ID = '507f1f77bcf86cd799439011';

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

const createJobsFindChain = (value) => ({
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  toArray: jest.fn().mockResolvedValue(value),
});

const createUsersFindChain = (value) => ({
  project: jest.fn().mockReturnThis(),
  toArray: jest.fn().mockResolvedValue(value),
});

const createAggregateCursor = (value) => ({
  toArray: jest.fn().mockResolvedValue(value),
});

jest.mock('../models', () => ({
  Job: { find: jest.fn() },
  User: { find: jest.fn() },
  Application: { countDocuments: jest.fn(), aggregate: jest.fn() },
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
      meta,
      error: null,
    });
    return res;
  }),
  errorResponse: jest.fn((res, statusCode, message, code = 'ERROR', details = {}) => {
    res.status(statusCode).json({
      success: false,
      message,
      data: null,
      meta: {},
      error: { message, code, details },
    });
    return res;
  }),
  paginatedResponse: jest.fn(
    (res, statusCode, message, items = [], page = 1, limit = 10, total = 0, meta = {}) => {
      const totalPages = limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1;
      res.status(statusCode).json({
        success: true,
        message,
        data: {
          items,
          pagination: {
            page,
            limit,
            total,
            totalPages,
          },
        },
        meta,
        error: null,
      });
      return res;
    },
  ),
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

jest.mock('../../../shared/utils/canonicalWorker', () => ({
  buildCanonicalWorkerSnapshot: jest.fn(() => ({})),
}));

jest.mock('../../../shared/constants/recommendations', () => ({
  MOBILE_RECOMMENDATIONS_CONTRACT: {},
  PROFILE_INCOMPLETE_RECOMMENDATION_MESSAGE: 'Profile incomplete',
}));

const bindMockDatabase = ({
  jobs,
  workers = [],
  applicationCountEntries = [],
  bidCountEntries = [],
  total = null,
  statusCounts = [{ _id: 'open', count: jobs.length }],
}) => {
  const jobsCollection = {
    find: jest.fn(() => createJobsFindChain(jobs)),
    countDocuments: jest.fn().mockResolvedValue(total == null ? jobs.length : total),
    aggregate: jest.fn(() => createAggregateCursor(statusCounts)),
  };

  const usersCollection = {
    find: jest.fn(() => createUsersFindChain(workers)),
  };

  const applicationsCollection = {
    aggregate: jest.fn(() => createAggregateCursor(applicationCountEntries)),
  };

  const bidsCollection = {
    aggregate: jest.fn(() => createAggregateCursor(bidCountEntries)),
  };

  const collectionMap = {
    jobs: jobsCollection,
    users: usersCollection,
    applications: applicationsCollection,
    bids: bidsCollection,
  };

  mongoose.connection.getClient = jest.fn(() => ({
    db: () => ({
      collection: (name) => {
        const collection = collectionMap[name];
        if (!collection) {
          throw new Error(`Unexpected collection request: ${name}`);
        }
        return collection;
      },
    }),
  }));

  return {
    jobsCollection,
    usersCollection,
    applicationsCollection,
    bidsCollection,
  };
};

describe('getMyJobs response mode contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { ensureConnection } = require('../config/db');
    ensureConnection.mockResolvedValue(undefined);
  });

  const createRequest = (query = {}) => ({
    user: { id: HIRER_ID, role: 'hirer' },
    query,
    headers: {},
  });

  test('applications-only jobs resolve to applications response mode and count', async () => {
    const { getMyJobs } = require('../controllers/job.controller');

    const jobId = new mongoose.Types.ObjectId();
    bindMockDatabase({
      jobs: [
        {
          _id: jobId,
          hirer: new mongoose.Types.ObjectId(HIRER_ID),
          title: 'Epoxy Floor Coating - Factory Floor',
          status: 'open',
          biddingEnabled: false,
          bidding: { bidStatus: 'open', currentBidders: 0, maxBidders: 5 },
          createdAt: new Date('2026-03-01T00:00:00.000Z'),
        },
      ],
      applicationCountEntries: [{ _id: jobId, count: 8 }],
      bidCountEntries: [],
    });

    const req = createRequest({ page: '1', limit: '10' });
    const res = createResponse();
    const next = jest.fn();

    await getMyJobs(req, res, next);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(next).not.toHaveBeenCalled();

    const [job] = res.body.data.items;
    expect(job).toEqual(
      expect.objectContaining({
        responseMode: 'applications',
        responseCount: 8,
        proposalCount: 8,
        applicationsCount: 8,
        applicantCount: 8,
        bidCount: 0,
        bidsCount: 0,
      }),
    );
    expect(job.responseCounts).toEqual({ applications: 8, bids: 0 });
  });

  test('bids-only jobs resolve to bids response mode and count', async () => {
    const { getMyJobs } = require('../controllers/job.controller');

    const jobId = new mongoose.Types.ObjectId();
    bindMockDatabase({
      jobs: [
        {
          _id: jobId,
          hirer: new mongoose.Types.ObjectId(HIRER_ID),
          title: 'Residential Plumbing Installation',
          status: 'open',
          biddingEnabled: true,
          bidding: { bidStatus: 'open', currentBidders: 0, maxBidders: 5 },
          createdAt: new Date('2026-03-01T00:00:00.000Z'),
        },
      ],
      applicationCountEntries: [],
      bidCountEntries: [{ _id: jobId, count: 3 }],
    });

    const req = createRequest({ page: '1', limit: '10' });
    const res = createResponse();
    const next = jest.fn();

    await getMyJobs(req, res, next);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(next).not.toHaveBeenCalled();

    const [job] = res.body.data.items;
    expect(job).toEqual(
      expect.objectContaining({
        responseMode: 'bids',
        responseCount: 3,
        proposalCount: 3,
        applicationsCount: 0,
        applicantCount: 0,
        bidCount: 3,
        bidsCount: 3,
      }),
    );
    expect(job.responseCounts).toEqual({ applications: 0, bids: 3 });
  });

  test('mixed legacy jobs choose applications when application volume dominates', async () => {
    const { getMyJobs } = require('../controllers/job.controller');

    const jobId = new mongoose.Types.ObjectId();
    bindMockDatabase({
      jobs: [
        {
          _id: jobId,
          hirer: new mongoose.Types.ObjectId(HIRER_ID),
          title: 'Mixed Legacy Job',
          status: 'open',
          bidding: { bidStatus: 'open', currentBidders: 7, maxBidders: 10 },
          createdAt: new Date('2026-03-01T00:00:00.000Z'),
        },
      ],
      applicationCountEntries: [{ _id: jobId, count: 6 }],
      bidCountEntries: [{ _id: jobId, count: 2 }],
    });

    const req = createRequest({ page: '1', limit: '10' });
    const res = createResponse();
    const next = jest.fn();

    await getMyJobs(req, res, next);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(next).not.toHaveBeenCalled();

    const [job] = res.body.data.items;
    expect(job).toEqual(
      expect.objectContaining({
        responseMode: 'applications',
        responseCount: 6,
        proposalCount: 6,
        applicationsCount: 6,
        applicantCount: 6,
        bidCount: 2,
        bidsCount: 2,
      }),
    );
    expect(job.responseCounts).toEqual({ applications: 6, bids: 2 });
  });
});
