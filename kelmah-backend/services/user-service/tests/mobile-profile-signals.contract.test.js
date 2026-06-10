const buildSelectLeanQuery = (result) => ({
  select: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(result),
});

const buildLeanQuery = (result) => ({
  lean: jest.fn().mockResolvedValue(result),
});

const buildPortfolioQuery = (items) => ({
  sort: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(items),
});

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

jest.mock('../models', () => {
  const userFindById = jest.fn();
  const workerProfileFindOne = jest.fn();
  const availabilityFindOne = jest.fn();
  const certificateFind = jest.fn();
  const portfolioFind = jest.fn();
  const portfolioCountDocuments = jest.fn();

  return {
    loadModels: jest.fn(),
    Bookmark: {},
    Availability: { findOne: availabilityFindOne },
    Certificate: { find: certificateFind },
    Job: {},
    Application: {},
    Portfolio: {
      find: portfolioFind,
      countDocuments: portfolioCountDocuments,
    },
    User: { findById: userFindById },
    WorkerProfile: { findOne: workerProfileFindOne },
    __mocks: {
      userFindById,
      workerProfileFindOne,
      availabilityFindOne,
      certificateFind,
      portfolioFind,
      portfolioCountDocuments,
    },
  };
});

jest.mock('../config/db', () => ({
  ensureConnection: jest.fn().mockResolvedValue(),
  mongoose: require('mongoose'),
}));

jest.mock('../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('mobile profile-signals contract', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('getMyProfileSignals returns consolidated mobile contract payload', async () => {
    const models = require('../models');
    const { getMyProfileSignals } = require('../controllers/user.controller');
    const { __mocks } = models;

    __mocks.userFindById.mockReturnValue(
      buildSelectLeanQuery({
        _id: 'user-123',
        firstName: 'Ama',
        lastName: 'Mensah',
        email: 'ama@example.com',
        phone: '+2330000000',
        role: 'worker',
        isEmailVerified: true,
        isPhoneVerified: false,
        country: 'Ghana',
        countryCode: 'GH',
        profilePicture: 'https://cdn.example.com/profile.jpg',
      }),
    );
    __mocks.workerProfileFindOne.mockReturnValue(
      buildSelectLeanQuery({
        _id: 'worker-profile-1',
        userId: 'user-123',
        bio: 'Professional electrician',
        location: 'Accra, Ghana',
        profession: 'Electrician',
        hourlyRate: 55,
        currency: 'GHS',
        experienceLevel: 'expert',
        yearsOfExperience: 7,
        skills: ['Wiring', 'Safety'],
        isVerified: true,
        licenses: [{ id: 'license-1', name: 'Trade License', issuer: 'GTA' }],
        certifications: [{ id: 'cert-1', name: 'Electrical Safety', isVerified: true }],
        profileCompleteness: 88,
      }),
    );
    __mocks.availabilityFindOne.mockReturnValue(
      buildLeanQuery({
        user: 'user-123',
        isAvailable: true,
        timezone: 'Africa/Accra',
        daySlots: [
          {
            dayOfWeek: 1,
            slots: [{ start: '09:00', end: '17:00' }],
          },
        ],
        updatedAt: '2026-03-09T10:00:00.000Z',
      }),
    );
    __mocks.certificateFind.mockReturnValue(
      buildLeanQuery([
        {
          _id: 'cert-doc-1',
          name: 'Electrical Safety',
          issuer: 'TVET',
          issuedAt: '2025-01-01T00:00:00.000Z',
          status: 'verified',
          isVerified: true,
        },
      ]),
    );
    __mocks.portfolioCountDocuments
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1);
    __mocks.portfolioFind.mockReturnValue(
      buildPortfolioQuery([
        {
          _id: 'portfolio-1',
          title: 'Office Rewire',
          description: 'Rewired a commercial office space',
          skillsUsed: ['Wiring'],
          location: 'Accra',
          status: 'published',
          isFeatured: true,
          createdAt: '2026-03-09T12:00:00.000Z',
        },
      ]),
    );

    const req = { user: { id: 'user-123' } };
    const res = createResponse();

    await getMyProfileSignals(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.meta.contract).toBe('mobile-profile-signals-v1');
    expect(res.body.data).toEqual(
      expect.objectContaining({
        profile: expect.objectContaining({
          id: 'user-123',
          profession: 'Electrician',
          location: 'Accra, Ghana',
        }),
        credentials: expect.objectContaining({
          skills: expect.arrayContaining([
            expect.objectContaining({ name: 'Wiring' }),
          ]),
          certifications: expect.arrayContaining([
            expect.objectContaining({ name: 'Electrical Safety' }),
          ]),
        }),
        availability: expect.objectContaining({
          status: 'available',
          timezone: 'Africa/Accra',
        }),
        completeness: expect.objectContaining({
          recommendations: expect.any(Array),
          completionPercentage: expect.any(Number),
        }),
        portfolio: expect.objectContaining({
          portfolioItems: expect.arrayContaining([
            expect.objectContaining({ title: 'Office Rewire' }),
          ]),
          stats: expect.objectContaining({ total: 2, published: 1, featured: 1 }),
        }),
      }),
    );
  });
});