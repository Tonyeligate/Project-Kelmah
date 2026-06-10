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

jest.mock('../models', () => ({
  Job: { aggregate: jest.fn() },
  User: {},
  Application: {},
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
  successResponse: jest.fn(),
  errorResponse: jest.fn(),
  paginatedResponse: jest.fn((res, status, message, data, page, limit, total) => {
    res.status(status).json({
      success: true,
      message,
      data,
      meta: { pagination: { page, limit, total } },
    });
    return res;
  }),
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

describe('job ranking and search contracts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('advanced search uses Mongo text-score ranking when a query is present', async () => {
    const { Job } = require('../models');
    const { advancedJobSearch } = require('../controllers/job.controller');
    const req = {
      query: {
        q: 'commercial wiring',
        page: '1',
        limit: '5',
      },
    };
    const res = createResponse();
    const next = jest.fn();

    Job.aggregate
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ total: 0 }]);

    await advancedJobSearch(req, res, next);

    const pipeline = Job.aggregate.mock.calls[0][0];
    const matchStage = pipeline.find((stage) => stage.$match);
    const sortStage = pipeline.find((stage) => stage.$sort);
    const projectStage = pipeline.find((stage) => stage.$project);

    expect(matchStage.$match.$text).toEqual({ $search: 'commercial wiring' });
    expect(sortStage.$sort).toMatchObject({
      score: { $meta: 'textScore' },
      relevanceScore: -1,
    });
    expect(projectStage.$project.textScore).toEqual({ $meta: 'textScore' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(next).not.toHaveBeenCalled();
  });

  test('normalized scoring preserves separation between strong and elite workers', () => {
    const { __testables } = require('../controllers/job.controller');
    const { calculateJobMatchScore, calculateWorkerMatchScore } = __testables;

    const job = {
      title: 'Commercial Rewire',
      skills: ['Wiring', 'Safety'],
      budget: 1200,
      currency: 'GHS',
      paymentType: 'fixed',
      duration: { value: 5, unit: 'day' },
      location: { city: 'Accra', type: 'onsite' },
      locationDetails: { region: 'Greater Accra' },
      requirements: { experienceLevel: 'intermediate', primarySkills: ['Wiring'] },
    };

    const strongWorker = {
      skills: ['Wiring', 'Safety'],
      workerProfile: {
        hourlyRate: 25,
        currency: 'GHS',
        yearsOfExperience: 4,
        availabilityStatus: 'available',
      },
      rating: 4.5,
      totalJobsCompleted: 12,
      totalReviews: 4,
      availabilityStatus: 'available',
      activeContractsCount: 1,
      isVerified: true,
      userPerformance: {
        metrics: {
          jobCompletionRate: 88,
          onTimeDeliveryRate: 84,
          clientSatisfaction: 4.7,
        },
      },
      location: { city: 'Accra' },
      locationDetails: { region: 'Greater Accra' },
    };

    const eliteWorker = {
      ...strongWorker,
      rating: 5,
      totalJobsCompleted: 34,
      totalReviews: 14,
      userPerformance: {
        metrics: {
          jobCompletionRate: 97,
          onTimeDeliveryRate: 96,
          clientSatisfaction: 5,
        },
      },
    };

    const strongJobScore = calculateJobMatchScore(job, strongWorker);
    const eliteJobScore = calculateJobMatchScore(job, eliteWorker);
    const strongWorkerScore = calculateWorkerMatchScore(job, strongWorker);
    const eliteWorkerScore = calculateWorkerMatchScore(job, eliteWorker);

    expect(eliteJobScore.totalScore).toBeGreaterThan(strongJobScore.totalScore);
    expect(strongJobScore.totalScore).toBeLessThan(100);
    expect(eliteJobScore.totalScore).toBeLessThanOrEqual(100);

    expect(eliteWorkerScore.totalScore).toBeGreaterThan(strongWorkerScore.totalScore);
    expect(strongWorkerScore.totalScore).toBeLessThan(100);
    expect(eliteWorkerScore.totalScore).toBeLessThanOrEqual(100);
  });
});