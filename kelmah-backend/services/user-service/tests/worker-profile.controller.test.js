const mongoose = require('mongoose');

const mockIsValid = jest.fn(() => true);
let mockReadyState = 1;

jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');

  return {
    ...actual,
    Types: {
      ...actual.Types,
      ObjectId: {
        ...actual.Types.ObjectId,
        isValid: (...args) => mockIsValid(...args),
      },
    },
    connection: {
      ...actual.connection,
      get readyState() {
        return mockReadyState;
      },
      set readyState(value) {
        mockReadyState = value;
      },
    },
  };
});

jest.mock('../config/db', () => ({
  ensureConnection: jest.fn(() => Promise.resolve()),
}));

const modelsModule = require('../models');
const WorkerController = require('../controllers/worker.controller');
const { ensureConnection } = require('../config/db');
const { createMockResponse } = require('../../../shared/test-utils');

const trackedModels = ['User', 'WorkerProfile', 'Availability', 'Portfolio', 'Certificate', 'Job', 'Application'];
const originalDescriptors = {};

const setModel = (name, value) => {
  Object.defineProperty(modelsModule, name, {
    configurable: true,
    get: () => value,
  });
};

const createLeanQuery = (result) => ({
  select: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(result),
});

const createFindQuery = (result) => ({
  populate: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(result),
});

describe('WorkerController.getWorkerById (stubbed models)', () => {
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
    mockIsValid.mockReset().mockReturnValue(true);
    mockReadyState = 1;
    ensureConnection.mockClear();
    trackedModels.forEach((key) => setModel(key, undefined));
  });

  test('returns 400 for invalid worker id', async () => {
    const res = createMockResponse();
    mockIsValid.mockReturnValue(false);

    await WorkerController.getWorkerById({ params: { id: 'invalid-id' } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.body?.code).toBe('INVALID_WORKER_ID');
    expect(ensureConnection).not.toHaveBeenCalled();
  });

  test('returns 404 when user exists but is not an active worker', async () => {
    const res = createMockResponse();
    const userId = '64f2e0b5f1f79b2a9c123456';

    setModel('User', {
      findById: jest.fn(() =>
        createLeanQuery({
          _id: userId,
          role: 'hirer',
          isActive: true,
          firstName: 'Hannah',
          lastName: 'Hirer',
          email: 'hirer@example.com',
        }),
      ),
    });

    await WorkerController.getWorkerById({ params: { id: userId } }, res);

    expect(ensureConnection).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.body?.code).toBe('NOT_AN_ACTIVE_WORKER');
  });

  test('returns enriched payload with merged profile, availability, portfolio, and certificates', async () => {
    const res = createMockResponse();
    const workerId = '64f2e0b5f1f79b2a9c123457';

    const userDoc = {
      _id: workerId,
      firstName: 'Ama',
      lastName: 'Boateng',
      email: 'ama@example.com',
      phone: '+233201234567',
      role: 'worker',
      isActive: true,
      profession: 'Electrician',
      skills: ['Wiring', 'Diagnostics'],
      hourlyRate: 150,
      location: 'Accra, Ghana',
      availabilityStatus: 'available',
      isVerified: true,
      yearsOfExperience: 4,
      totalReviews: 20,
      totalJobsCompleted: 80,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2025-02-01T00:00:00Z'),
      lastLogin: new Date('2025-02-02T08:00:00Z'),
    };

    const profileDoc = {
      _id: 'worker-profile-1',
      userId: workerId,
      bio: 'Certified electrician with 5 years experience.',
      hourlyRate: 180,
      hourlyRateMin: 150,
      hourlyRateMax: 220,
      currency: 'GHS',
      location: 'Accra, Ghana',
      availabilityStatus: 'available',
      isAvailable: true,
      experienceLevel: 'advanced',
      yearsOfExperience: 5,
      skills: ['Panel Installation'],
      specializations: ['Residential Wiring'],
      languages: ['English', 'Twi'],
      verificationLevel: 'enhanced',
      totalReviews: 42,
      totalJobsCompleted: 120,
      profileCompleteness: 86,
      responseRate: 92,
      portfolioItems: [
        {
          _id: 'portfolio-embedded-1',
          title: 'Apartment rewiring',
          description: 'Complete rewiring for a 3-bedroom apartment.',
          projectType: 'professional',
          completedAt: '2025-09-01T00:00:00Z',
          skills: ['Wiring'],
          isFeatured: true,
        },
      ],
      certifications: [
        {
          _id: 'cert-embedded-1',
          name: 'Electrical Safety Advanced',
          issuer: 'Ghana Energy Commission',
          issueDate: '2023-01-15T00:00:00Z',
          verificationStatus: 'verified',
          verificationUrl: 'https://verify/123',
        },
      ],
      businessInfo: {
        businessName: 'Ama Power Services',
        businessType: 'company',
        registrationNumber: 'REG-4455',
      },
      insuranceInfo: {
        hasInsurance: true,
        provider: 'SafetyCo',
        expiryDate: '2026-01-01T00:00:00Z',
        coverage: 50000,
      },
      lastActiveAt: '2025-02-02T10:00:00Z',
      updatedAt: '2025-02-02T10:00:00Z',
      availableHours: {
        monday: { start: '08:00', end: '17:00', available: true },
      },
    };

    const availabilityDoc = {
      user: workerId,
      timezone: 'Africa/Accra',
      isAvailable: true,
      daySlots: [{ dayOfWeek: 1, slots: [{ start: '08:00', end: '17:00' }] }],
      notes: 'Prefers morning jobs',
      updatedAt: '2025-02-02T09:00:00Z',
    };

    const portfolioDocs = [
      {
        _id: 'portfolio-collection-1',
        title: 'Factory maintenance',
        description: 'Electrical maintenance for GIHOC factory.',
        status: 'published',
        isActive: true,
        isFeatured: true,
        projectType: 'professional',
        endDate: '2024-03-01T00:00:00Z',
        skillsUsed: ['Industrial Systems'],
      },
    ];

    const certificateDocs = [
      {
        _id: 'cert-collection-1',
        name: 'Industrial Electrical Certificate',
        issuer: 'Ghana Safety Org',
        credentialId: 'ISO-4455',
        issuedAt: '2022-05-10T00:00:00Z',
        status: 'verified',
        verification: {
          result: 'verified',
          verifiedAt: '2022-06-01T00:00:00Z',
        },
      },
    ];

    setModel('User', {
      findById: jest.fn(() => createLeanQuery(userDoc)),
    });

    setModel('WorkerProfile', {
      findOne: jest.fn(() => createLeanQuery(profileDoc)),
    });

    setModel('Availability', {
      findOne: jest.fn(() => createLeanQuery(availabilityDoc)),
    });

    setModel('Portfolio', {
      find: jest.fn(() => createFindQuery(portfolioDocs)),
    });

    setModel('Certificate', {
      find: jest.fn(() => createFindQuery(certificateDocs)),
    });

    await WorkerController.getWorkerById({
      params: { id: workerId },
      user: { id: workerId, role: 'worker' },
    }, res);

    expect(ensureConnection).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);

    const payload = res.body?.data?.worker;
    expect(payload).toBeDefined();
    expect(payload.userId).toBe(workerId);
    expect(payload.profession).toBe('Electrician');
    expect(payload.stats.totalReviews).toBe(42);
  const portfolioIds = payload.portfolio.items.map((item) => item.id);
  expect(portfolioIds).toContain('portfolio-embedded-1');
  expect(portfolioIds).toContain('portfolio-collection-1');
  expect(payload.portfolio.total).toBe(2);
    expect(payload.certifications.total).toBe(2);
    expect(payload.availability.timezone).toBe('Africa/Accra');
    expect(payload.verification.totalCertificates).toBe(2);
    expect(payload.skills.some((skill) => skill.name === 'Panel Installation')).toBe(true);
    expect(payload.contact.email).toBe('ama@example.com');
    expect(payload.business?.name).toBe('Ama Power Services');
  });

  test('returns chronological recent jobs instead of recommendation metadata', async () => {
    const res = createMockResponse();
    const workerId = '64f2e0b5f1f79b2a9c123458';

    const appliedJobQuery = {
      distinct: jest.fn().mockResolvedValue(['job-applied']),
    };

    setModel('Application', {
      find: jest.fn(() => appliedJobQuery),
    });

    setModel('Job', {
      find: jest.fn(() => createFindQuery([
        {
          _id: 'job-recent-1',
          title: 'Recent Electrical Inspection',
          description: 'Need an electrician for a same-week inspection.',
          status: 'open',
          visibility: 'public',
          budget: 350,
          currency: 'GHS',
          createdAt: '2026-03-08T09:00:00.000Z',
          updatedAt: '2026-03-08T09:00:00.000Z',
          hirer: {
            _id: 'hirer-1',
            firstName: 'Kojo',
            lastName: 'Mensah',
            rating: 4.8,
          },
        },
      ])),
    });

    await WorkerController.getRecentJobs({
      user: { id: workerId, role: 'worker' },
      query: { limit: '1' },
      headers: {},
    }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body?.data?.metadata?.source).toBe('user-service-recent-jobs');
    expect(res.body?.data?.jobs).toEqual([
      expect.objectContaining({
        id: 'job-recent-1',
        recommendationSource: 'recent',
        title: 'Recent Electrical Inspection',
      }),
    ]);
  });

  test('forces public-only portfolio and certificate status filters for anonymous requests', async () => {
    const workerId = '64f2e0b5f1f79b2a9c123459';

    setModel('User', {
      findOne: jest.fn(() => createLeanQuery({
        _id: workerId,
        role: 'worker',
        isActive: true,
        firstName: 'Efua',
        lastName: 'Owusu',
      })),
    });

    setModel('WorkerProfile', {
      findOne: jest.fn(() => createLeanQuery({
        _id: 'worker-profile-2',
        userId: workerId,
      })),
    });

    const portfolioFindQuery = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    };
    const portfolioFind = jest.fn(() => portfolioFindQuery);
    const portfolioCountDocuments = jest.fn().mockResolvedValue(0);

    setModel('Portfolio', {
      find: portfolioFind,
      countDocuments: portfolioCountDocuments,
    });

    const certificateFindQuery = {
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    };
    const certificateFind = jest.fn(() => certificateFindQuery);

    setModel('Certificate', {
      find: certificateFind,
    });

    const portfolioRes = createMockResponse();
    await WorkerController.getWorkerPortfolio({
      params: { id: workerId },
      query: { status: 'draft', limit: '2' },
      user: null,
    }, portfolioRes);

    expect(portfolioRes.statusCode).toBe(200);
    expect(portfolioFind).toHaveBeenCalledWith(expect.objectContaining({ status: 'published' }));

    const certificateRes = createMockResponse();
    await WorkerController.getWorkerCertificates({
      params: { id: workerId },
      query: { status: 'pending', limit: '2' },
      user: null,
    }, certificateRes);

    expect(certificateRes.statusCode).toBe(200);
    expect(certificateFind).toHaveBeenCalledWith(expect.objectContaining({ status: 'verified' }));
  });

  test('updateWorkerProfile keeps mutable worker fields on WorkerProfile instead of dual-writing User', async () => {
    const workerId = '64f2e0b5f1f79b2a9c123460';
    const res = createMockResponse();

    const userDoc = {
      _id: workerId,
      firstName: 'Kojo',
      lastName: 'Asare',
      email: 'kojo@example.com',
      phone: '+233201111111',
      role: 'worker',
      location: 'Kumasi, Ghana',
      bio: 'Legacy user bio',
      hourlyRate: 90,
      yearsOfExperience: 2,
      profession: 'Plumber',
      skills: ['Pipe Repair'],
      currency: 'GHS',
      availabilityStatus: 'available',
      isVerified: false,
      profilePicture: 'legacy-user.png',
      save: jest.fn().mockResolvedValue(undefined),
      toObject: jest.fn(function toObject() {
        return {
          _id: this._id,
          firstName: this.firstName,
          lastName: this.lastName,
          email: this.email,
          phone: this.phone,
          role: this.role,
          location: this.location,
          bio: this.bio,
          hourlyRate: this.hourlyRate,
          yearsOfExperience: this.yearsOfExperience,
          profession: this.profession,
          skills: this.skills,
          currency: this.currency,
          availabilityStatus: this.availabilityStatus,
          isVerified: this.isVerified,
          profilePicture: this.profilePicture,
        };
      }),
    };

    const workerProfileDoc = {
      _id: 'worker-profile-3',
      userId: workerId,
      profession: 'Plumber',
      title: 'Plumber',
      headline: 'Plumber',
      bio: 'Existing worker bio',
      location: 'Kumasi, Ghana',
      hourlyRate: 120,
      currency: 'GHS',
      yearsOfExperience: 4,
      skills: ['Leak Detection'],
      languages: ['English'],
      education: [],
      profilePicture: 'worker-profile.png',
      save: jest.fn().mockResolvedValue(undefined),
      toObject: jest.fn(function toObject() {
        return {
          _id: this._id,
          userId: this.userId,
          profession: this.profession,
          title: this.title,
          headline: this.headline,
          bio: this.bio,
          location: this.location,
          hourlyRate: this.hourlyRate,
          currency: this.currency,
          yearsOfExperience: this.yearsOfExperience,
          skills: this.skills,
          languages: this.languages,
          education: this.education,
          profilePicture: this.profilePicture,
        };
      }),
    };

    setModel('User', {
      findById: jest.fn().mockResolvedValue(userDoc),
    });

    setModel('WorkerProfile', {
      findOne: jest.fn().mockResolvedValue(workerProfileDoc),
    });

    await WorkerController.updateWorkerProfile({
      params: { id: workerId },
      user: { id: workerId, role: 'worker' },
      body: {
        title: 'Master Electrician',
        bio: 'Worker profile bio',
        location: 'Accra, Ghana',
        hourlyRate: 180,
        experience: 9,
        skills: ['Wiring', 'Lighting'],
        firstName: 'Kwame',
        phone: '+233244444444',
        profilePicture: 'updated-worker.png',
        latitude: 5.6037,
        longitude: -0.187,
        serviceRadius: 25,
      },
    }, res);

    expect(res.statusCode).toBe(200);
    expect(userDoc.firstName).toBe('Kwame');
    expect(userDoc.phone).toBe('+233244444444');
    expect(userDoc.profilePicture).toBe('updated-worker.png');
    expect(userDoc.location).toBe('Kumasi, Ghana');
    expect(userDoc.bio).toBe('Legacy user bio');
    expect(userDoc.hourlyRate).toBe(90);
    expect(userDoc.yearsOfExperience).toBe(2);
    expect(userDoc.skills).toEqual(['Pipe Repair']);

    expect(workerProfileDoc.profession).toBe('Master Electrician');
    expect(workerProfileDoc.bio).toBe('Worker profile bio');
    expect(workerProfileDoc.location).toBe('Accra, Ghana');
    expect(workerProfileDoc.hourlyRate).toBe(180);
    expect(workerProfileDoc.yearsOfExperience).toBe(9);
    expect(workerProfileDoc.skills).toEqual(['Wiring', 'Lighting']);
    expect(workerProfileDoc.latitude).toBe(5.6037);
    expect(workerProfileDoc.longitude).toBe(-0.187);
    expect(workerProfileDoc.serviceRadius).toBe(25);
    expect(userDoc.locationCoordinates).toEqual({
      type: 'Point',
      coordinates: [-0.187, 5.6037],
    });

    expect(res.body?.data).toEqual(
      expect.objectContaining({
        profession: 'Master Electrician',
        location: 'Accra, Ghana',
        hourlyRate: 180,
        experience: 9,
        skills: ['Wiring', 'Lighting'],
        latitude: 5.6037,
        longitude: -0.187,
        serviceRadius: 25,
      }),
    );
  });
});
