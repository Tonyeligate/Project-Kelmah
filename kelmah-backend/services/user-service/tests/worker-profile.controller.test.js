const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

const mockIsValid = jest.fn(() => true);
let mockReadyState = 1;

jest.mock('mongoose', () => ({
  Types: {
    ObjectId: {
      isValid: (...args) => mockIsValid(...args),
    },
  },
  connection: {
    get readyState() {
      return mockReadyState;
    },
    set readyState(value) {
      mockReadyState = value;
    },
  },
}));

jest.mock('../config/db', () => ({
  ensureConnection: jest.fn(() => Promise.resolve()),
}));

const modelsModule = require('../models');
const WorkerController = require('../controllers/worker.controller');
const { ensureConnection } = require('../config/db');
const { createMockResponse } = require('../../../shared/test-utils');

const trackedModels = ['User', 'WorkerProfile', 'Availability', 'Portfolio', 'Certificate'];
const originalDescriptors = {};

const setModel = (name, value) => {
  Object.defineProperty(modelsModule, name, {
    configurable: true,
    get: () => value,
  });
};

const createLeanQuery = (result) => ({
  lean: jest.fn().mockResolvedValue(result),
});

const createFindQuery = (result) => ({
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

    await WorkerController.getWorkerById({ params: { id: workerId } }, res);

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
});
