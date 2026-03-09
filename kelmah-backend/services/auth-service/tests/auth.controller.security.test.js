jest.mock('../models', () => ({
  User: {
    create: jest.fn(),
    deleteOne: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findOne: jest.fn(),
  },
  WorkerProfile: {
    findOne: jest.fn(),
  },
  RefreshToken: {
    create: jest.fn(),
    deleteMany: jest.fn(),
    findOne: jest.fn(),
  },
  RevokedToken: {},
  AuthChallenge: {
    deleteMany: jest.fn(),
    countDocuments: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));

jest.mock('../utils/errorTypes', () => ({
  AppError: class AppError extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
    }
  },
}));

jest.mock('../../../shared/utils/jwt', () => ({
  signAccessToken: jest.fn(() => 'signed-access-token'),
  verifyRefreshToken: jest.fn(),
}));

jest.mock('speakeasy', () => ({
  generateSecret: jest.fn(() => ({ base32: 'BASE32SECRET', ascii: 'ascii-secret' })),
  otpauthURL: jest.fn(() => 'otpauth://kelmah/test'),
  totp: {
    verify: jest.fn(() => true),
  },
}));

jest.mock('qrcode', () => ({
  toDataURL: jest.fn(() => Promise.resolve('data:image/png;base64,test')),
}));

jest.mock('../services/email.service', () => ({
  isDeliveryConfigured: jest.fn(() => true),
  sendVerificationEmail: jest.fn().mockResolvedValue({ accepted: ['kwame@example.com'] }),
  sendAccountDeactivationEmail: jest.fn().mockResolvedValue(undefined),
  sendAccountReactivationEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordChangedEmail: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../utils/jwt-secure', () => ({
  generateRefreshToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
}));
jest.mock('../config', () => ({ frontendUrl: 'https://frontend.test' }));
jest.mock('../config/db', () => ({ reconcileAuthIndexes: jest.fn() }));
jest.mock('../utils/otp', () => ({ generateOTP: jest.fn() }));
jest.mock('../utils/device', () => ({}));
jest.mock('../utils/session', () => ({
  endAll: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../utils/logger', () => ({ logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() } }));
jest.mock('../utils/security', () => ({
  validatePassword: jest.fn(() => ({ isValid: true, errors: [] })),
}));

const { createMockResponse } = require('../../../shared/test-utils');
const models = require('../models');
const emailService = require('../services/email.service');
const secure = require('../utils/jwt-secure');
const jwtUtils = require('../../../shared/utils/jwt');
const authController = require('../controllers/auth.controller');

describe('auth controller security regressions', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    models.AuthChallenge.deleteMany.mockResolvedValue({ deletedCount: 0 });
    models.AuthChallenge.countDocuments.mockResolvedValue(0);
    models.AuthChallenge.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    });
    models.AuthChallenge.create.mockResolvedValue({ _id: 'challenge-1' });
    models.RefreshToken.deleteMany.mockResolvedValue({ deletedCount: 1 });
    models.RefreshToken.create.mockResolvedValue({ _id: 'refresh-1' });
    emailService.isDeliveryConfigured.mockReturnValue(true);
    emailService.sendVerificationEmail.mockResolvedValue({ accepted: ['kwame@example.com'] });
  });

  test('register fails fast when verification email delivery is unavailable', async () => {
    emailService.isDeliveryConfigured.mockReturnValue(false);

    const req = {
      body: {
        firstName: 'Kwame',
        lastName: 'Asante',
        email: 'kwame@example.com',
        password: 'Password1',
        role: 'worker',
      },
    };
    const res = createMockResponse();
    const next = jest.fn();

    await authController.register(req, res, next);

    expect(models.User.findByEmail).not.toHaveBeenCalled();
    expect(models.User.create).not.toHaveBeenCalled();
    expect(emailService.sendVerificationEmail).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 503,
      code: 'EMAIL_DELIVERY_UNAVAILABLE',
      message: 'Registration is temporarily unavailable because verification email delivery is unavailable.',
    }));
  });

  test('register rolls back a new unverified user when verification send fails', async () => {
    const userDoc = {
      _id: '507f1f77bcf86cd799439011',
      firstName: 'Kwame',
      lastName: 'Asante',
      email: 'kwame@example.com',
      generateVerificationToken: jest.fn(() => 'raw-verification-token'),
      save: jest.fn().mockResolvedValue(undefined),
    };

    models.User.findByEmail.mockResolvedValue(null);
    models.User.create.mockResolvedValue(userDoc);
    models.User.deleteOne.mockResolvedValue({ deletedCount: 1 });
    emailService.sendVerificationEmail.mockRejectedValue(new Error('SMTP auth failed'));

    const req = {
      body: {
        firstName: 'Kwame',
        lastName: 'Asante',
        email: 'kwame@example.com',
        password: 'Password1',
        role: 'worker',
      },
    };
    const res = createMockResponse();
    const next = jest.fn();

    await authController.register(req, res, next);

    expect(models.User.create).toHaveBeenCalledWith(expect.objectContaining({
      email: 'kwame@example.com',
      role: 'worker',
    }));
    expect(userDoc.generateVerificationToken).toHaveBeenCalled();
    expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(expect.objectContaining({
      email: 'kwame@example.com',
      verificationUrl: 'https://frontend.test/verify-email/raw-verification-token',
    }));
    expect(models.User.deleteOne).toHaveBeenCalledWith({
      _id: '507f1f77bcf86cd799439011',
      isEmailVerified: false,
    });
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 503,
      code: 'EMAIL_DELIVERY_UNAVAILABLE',
      message: 'Registration is temporarily unavailable because verification email delivery is unavailable.',
    }));
  });

  test('resendVerificationEmail fails honestly when transactional mail is unavailable', async () => {
    emailService.isDeliveryConfigured.mockReturnValue(false);

    const req = {
      body: { email: 'kwame@example.com' },
    };
    const res = createMockResponse();
    const next = jest.fn();

    await authController.resendVerificationEmail(req, res, next);

    expect(models.User.findByEmail).not.toHaveBeenCalled();
    expect(emailService.sendVerificationEmail).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 503,
      code: 'EMAIL_DELIVERY_UNAVAILABLE',
      message: 'Verification email delivery is temporarily unavailable. Please try again later.',
    }));
  });

  test('changePassword explicitly selects the password field before validation', async () => {
    const userDoc = {
      _id: 'user-1',
      email: 'kwame@example.com',
      fullName: 'Kwame Asante',
      tokenVersion: 2,
      validatePassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(undefined),
    };

    const select = jest.fn().mockResolvedValue(userDoc);
    models.User.findById.mockReturnValue({ select });

    const req = {
      body: { currentPassword: 'OldPassword1', newPassword: 'NewPassword1' },
      user: { id: 'user-1' },
    };
    const res = createMockResponse();
    const next = jest.fn();

    await authController.changePassword(req, res, next);

    expect(models.User.findById).toHaveBeenCalledWith('user-1');
    expect(select).toHaveBeenCalledWith('+password');
    expect(userDoc.validatePassword).toHaveBeenCalledWith('OldPassword1');
    expect(models.RefreshToken.deleteMany).toHaveBeenCalledWith({ userId: 'user-1' });
    expect(res.statusCode).toBe(200);
    expect(next).not.toHaveBeenCalled();
  });

  test('exchangeOAuthCode consumes a persisted challenge and mints tokens during exchange', async () => {
    models.AuthChallenge.findOneAndUpdate.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: 'challenge-1',
        userId: '507f1f77bcf86cd799439011',
        metadata: { provider: 'google', userAgent: 'provider-agent' },
      }),
    });

    const select = jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        email: 'oauth@example.com',
        role: 'worker',
        tokenVersion: 4,
        isActive: true,
      }),
    });
    models.User.findById.mockReturnValue({ select });

    secure.generateRefreshToken.mockResolvedValue({
      token: 'refresh-token-value',
      tokenHash: 'refresh-token-hash',
      tokenId: 'refresh-token-id',
      expiresAt: new Date('2030-01-01T00:00:00.000Z'),
      deviceInfo: { userAgent: 'api-agent', fingerprint: 'device-1' },
    });

    const req = {
      body: { code: 'oauth-code' },
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'api-agent',
        'x-device-id': 'device-1',
      },
    };
    const res = createMockResponse();
    const next = jest.fn();

    await authController.exchangeOAuthCode(req, res, next);

    expect(models.AuthChallenge.findOneAndUpdate).toHaveBeenCalled();
    expect(models.User.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    expect(jwtUtils.signAccessToken).toHaveBeenCalledWith({
      id: '507f1f77bcf86cd799439011',
      email: 'oauth@example.com',
      role: 'worker',
      tokenVersion: 4,
    });
    expect(models.RefreshToken.create).toHaveBeenCalledWith(expect.objectContaining({
      userId: '507f1f77bcf86cd799439011',
      tokenHash: 'refresh-token-hash',
      tokenId: 'refresh-token-id',
      version: 4,
    }));
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({
      success: true,
      data: {
        accessToken: 'signed-access-token',
        refreshToken: 'refresh-token-value',
      },
    }));
    expect(global._oauthCodes).toBeUndefined();
    expect(next).not.toHaveBeenCalled();
  });

  test('verifyTwoFactor explicitly selects the hidden twoFactorSecret field', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const select = jest.fn().mockResolvedValue({
      _id: 'user-2',
      twoFactorSecret: 'BASE32SECRET',
      isTwoFactorEnabled: false,
      save,
    });
    models.User.findById.mockReturnValue({ select });

    const req = {
      body: { token: '123456' },
      user: { id: 'user-2' },
    };
    const res = createMockResponse();
    const next = jest.fn();

    await authController.verifyTwoFactor(req, res, next);

    expect(models.User.findById).toHaveBeenCalledWith('user-2');
    expect(select).toHaveBeenCalledWith('+twoFactorSecret');
    expect(res.statusCode).toBe(200);
    expect(next).not.toHaveBeenCalled();
  });

  test('disableTwoFactor explicitly selects password and twoFactorSecret', async () => {
    const userDoc = {
      _id: 'user-3',
      isTwoFactorEnabled: true,
      twoFactorSecret: 'BASE32SECRET',
      validatePassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(undefined),
    };
    const select = jest.fn().mockResolvedValue(userDoc);
    models.User.findById.mockReturnValue({ select });

    const req = {
      body: { password: 'CurrentPassword1', token: '123456' },
      user: { id: 'user-3' },
    };
    const res = createMockResponse();
    const next = jest.fn();

    await authController.disableTwoFactor(req, res, next);

    expect(models.User.findById).toHaveBeenCalledWith('user-3');
    expect(select).toHaveBeenCalledWith('+password +twoFactorSecret');
    expect(userDoc.validatePassword).toHaveBeenCalledWith('CurrentPassword1');
    expect(res.statusCode).toBe(200);
    expect(next).not.toHaveBeenCalled();
  });

  test('reactivateAccount explicitly selects the hidden password field', async () => {
    const userDoc = {
      _id: 'user-4',
      isActive: false,
      fullName: 'Akosua Mensah',
      email: 'akosua@example.com',
      validatePassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(undefined),
    };
    const select = jest.fn().mockResolvedValue(userDoc);
    models.User.findOne.mockReturnValue({ select });

    const req = {
      body: { email: 'Akosua@Example.com', password: 'CurrentPassword1' },
    };
    const res = createMockResponse();
    const next = jest.fn();

    await authController.reactivateAccount(req, res, next);

    expect(models.User.findOne).toHaveBeenCalledWith({ email: 'akosua@example.com' });
    expect(select).toHaveBeenCalledWith('+password');
    expect(userDoc.validatePassword).toHaveBeenCalledWith('CurrentPassword1');
    expect(res.statusCode).toBe(200);
    expect(next).not.toHaveBeenCalled();
  });

  test('deactivateAccount explicitly selects the hidden password field', async () => {
    const userDoc = {
      _id: 'user-5',
      isActive: true,
      fullName: 'Nana Owusu',
      email: 'nana@example.com',
      validatePassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(undefined),
    };
    const select = jest.fn().mockResolvedValue(userDoc);
    models.User.findById.mockReturnValue({ select });

    const req = {
      body: { password: 'CurrentPassword1' },
      user: { id: 'user-5' },
    };
    const res = createMockResponse();
    const next = jest.fn();

    await authController.deactivateAccount(req, res, next);

    expect(models.User.findById).toHaveBeenCalledWith('user-5');
    expect(select).toHaveBeenCalledWith('+password');
    expect(userDoc.validatePassword).toHaveBeenCalledWith('CurrentPassword1');
    expect(res.statusCode).toBe(200);
    expect(next).not.toHaveBeenCalled();
  });

  test('refreshToken cleans up by tokenId when the stored user no longer exists', async () => {
    jwtUtils.verifyRefreshToken.mockReturnValue({ jti: 'refresh-token-id' });
    models.RefreshToken.findOne.mockResolvedValue({
      userId: 'missing-user',
      tokenHash: 'stored-hash',
      version: 2,
    });
    secure.verifyRefreshToken.mockResolvedValue({ valid: true });
    models.User.findById.mockResolvedValue(null);

    const req = {
      body: { refreshToken: 'signed.part.value.raw' },
      ip: '127.0.0.1',
      headers: {},
    };
    const res = createMockResponse();
    const next = jest.fn();

    await authController.refreshToken(req, res, next);

    expect(models.RefreshToken.deleteMany).toHaveBeenCalledWith({ tokenId: 'refresh-token-id' });
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'User not found or inactive' }));
  });
});
