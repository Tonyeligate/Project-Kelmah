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

const buildJobQuery = (items) => ({
  populate: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(items),
});

jest.mock('../models', () => {
  const jobFind = jest.fn();
  const userPerformanceFindOne = jest.fn();

  return {
    Job: { find: jobFind },
    User: {},
    Application: {},
    SavedJob: {},
    Bid: {},
    UserPerformance: { findOne: userPerformanceFindOne },
    Category: {},
    Contract: {},
    ContractDispute: {},
    __mocks: {
      jobFind,
      userPerformanceFindOne,
    },
  };
});

jest.mock('../middlewares/error', () => ({
  AppError: class AppError extends Error {},
}));

jest.mock('../config/db', () => ({
  ensureConnection: jest.fn(),
  ensureMongoReady: jest.fn(),
  mongoose: require('mongoose'),
}));

jest.mock('../utils/jobTransform', () => ({
  transformJobsForFrontend: jest.fn(),
  transformJobForFrontend: jest.fn((job) => ({
    id: job._id,
    _id: job._id,
    title: job.title,
    description: job.description,
    category: job.category,
    location: job.location,
    locationDetails: job.locationDetails,
    budget: { amount: job.budget || 0, currency: 'GHS', type: 'fixed' },
  })),
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

describe('mobile personalized recommendations contract', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('returns stable empty contract for workers without performance history', async () => {
    const models = require('../models');
    const { getPersonalizedJobRecommendations } = require('../controllers/job.controller');
    const req = { user: { id: 'worker-1' }, query: { page: '1', limit: '6' } };
    const res = createResponse();

    models.__mocks.userPerformanceFindOne.mockResolvedValue(null);

    await getPersonalizedJobRecommendations(req, res, jest.fn());

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.meta.contract).toBe('mobile-recommendations-v1');
    expect(res.body.data).toMatchObject({
      jobs: [],
      pagination: { page: 1, limit: 6, total: 0, totalPages: 1 },
      totalRecommendations: 0,
      averageMatchScore: 0,
      isNewUser: true,
    });
  });

  test('returns structured recommendation payload with reasoning and pagination', async () => {
    const models = require('../models');
    const { getPersonalizedJobRecommendations } = require('../controllers/job.controller');
    const req = { user: { id: 'worker-1' }, query: { page: '1', limit: '5' } };
    const res = createResponse();

    models.__mocks.userPerformanceFindOne.mockResolvedValue({
      userId: 'worker-1',
      performanceTier: 'tier1',
      locationPreferences: { primaryRegion: 'Greater Accra' },
      skillVerification: {
        primarySkills: [{ skill: 'Wiring', verified: true }],
        secondarySkills: [{ skill: 'Safety', verified: true }],
      },
    });
    models.__mocks.jobFind.mockReturnValue(
      buildJobQuery([
        {
          _id: 'job-1',
          title: 'Commercial Rewire',
          description: 'Need a licensed electrician for a fast office rewire.',
          category: 'Electrical',
          budget: 1200,
          createdAt: new Date().toISOString(),
          location: 'Accra, Ghana',
          locationDetails: { region: 'Greater Accra' },
          performanceTier: 'tier1',
          requirements: {
            primarySkills: ['Wiring'],
            secondarySkills: ['Safety'],
          },
          skills: ['Wiring'],
          status: 'open',
          bidding: { bidStatus: 'open' },
        },
      ]),
    );

    await getPersonalizedJobRecommendations(req, res, jest.fn());

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.meta.contract).toBe('mobile-recommendations-v1');
    expect(res.body.data).toMatchObject({
      pagination: { page: 1, limit: 5, total: 1, totalPages: 1 },
      totalRecommendations: 1,
      averageMatchScore: expect.any(Number),
    });
    expect(res.body.data.jobs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'job-1',
          recommendationSource: 'personalized',
          aiReasoning: expect.any(String),
          aiReasons: expect.arrayContaining([
            expect.stringContaining('Matched 1 verified primary skill'),
          ]),
        }),
      ]),
    );
  });
});