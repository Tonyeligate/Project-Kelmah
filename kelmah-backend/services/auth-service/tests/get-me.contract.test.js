jest.mock('../models', () => ({
  User: { findById: jest.fn() },
  WorkerProfile: { findOne: jest.fn() },
  RefreshToken: {},
  RevokedToken: {},
}));

jest.mock('../utils/errorTypes', () => ({
  AppError: class AppError extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
    }
  },
}));

jest.mock('../../../shared/utils/jwt', () => ({}));
jest.mock('../services/email.service', () => ({}));
jest.mock('../utils/jwt-secure', () => ({}));
jest.mock('../config', () => ({}));
jest.mock('../config/db', () => ({ reconcileAuthIndexes: jest.fn() }));
jest.mock('../utils/otp', () => ({ generateOTP: jest.fn() }));
jest.mock('../utils/device', () => ({}));
jest.mock('../utils/session', () => ({}));
jest.mock('../utils/logger', () => ({ logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() } }));
jest.mock('../utils/security', () => ({}));

const { createMockResponse } = require('../../../shared/test-utils');
const models = require('../models');
const authController = require('../controllers/auth.controller');

const buildSelectLeanQuery = (result) => ({
  select: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(result),
});

describe('auth getMe contract', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('returns a session-safe auth contract with canonical worker summary', async () => {
    models.User.findById.mockReturnValue(
      buildSelectLeanQuery({
        _id: 'worker-1',
        email: 'kwame@example.com',
        firstName: 'Kwame',
        lastName: 'Asante',
        role: 'worker',
        isEmailVerified: true,
        isPhoneVerified: false,
        profession: 'Master Carpenter',
        skills: ['Carpentry'],
        hourlyRate: 45,
        yearsOfExperience: 12,
        location: 'Kumasi, Ghana',
        profilePicture: 'legacy-user.png',
      }),
    );

    models.WorkerProfile.findOne.mockReturnValue(
      buildSelectLeanQuery({
        userId: 'worker-1',
        profession: 'Electrician',
        title: 'Electrician',
        location: 'Accra, Ghana',
        hourlyRate: 90,
        currency: 'GHS',
        yearsOfExperience: 6,
        skills: ['Wiring', 'Lighting'],
        specializations: ['Electrical Work'],
        availabilityStatus: 'available',
        isVerified: true,
        profilePicture: 'worker-profile.png',
        profileCompleteness: 85,
      }),
    );

    const res = createMockResponse();
    const next = jest.fn();

    await authController.getMe({ user: { id: 'worker-1' } }, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(res.body?.meta).toEqual(
      expect.objectContaining({
        contract: 'auth-session-v2',
        workerProfileSource: 'worker-profile',
      }),
    );
    expect(res.body?.data?.user).toEqual(
      expect.objectContaining({
        id: 'worker-1',
        email: 'kwame@example.com',
        firstName: 'Kwame',
        lastName: 'Asante',
        role: 'worker',
        workerProfileSummary: expect.objectContaining({
          profession: 'Electrician',
          location: 'Accra, Ghana',
          hourlyRate: 90,
          skills: ['Wiring', 'Lighting'],
        }),
      }),
    );
    expect(res.body?.data?.user.profession).toBeUndefined();
    expect(res.body?.data?.user.skills).toBeUndefined();
    expect(res.body?.data?.user.hourlyRate).toBeUndefined();
  });
});