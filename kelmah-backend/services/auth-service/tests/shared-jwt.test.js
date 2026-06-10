const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const sharedJwt = require('../../../shared/utils/jwt');
const authServiceSharedJwt = require('../utils/shared-jwt');

describe('JWT subject guards', () => {
  const modulesUnderTest = [
    ['shared utils', sharedJwt],
    ['auth-service shared utils', authServiceSharedJwt],
  ];
  const originalReadyState = mongoose.connection.readyState;
  const originalDb = mongoose.connection.db;

  const setMockConnection = ({ readyState, findOneResult }) => {
    mongoose.connection.readyState = readyState;
    mongoose.connection.db = {
      collection: jest.fn(() => ({
        findOne: jest.fn().mockResolvedValue(findOneResult),
      })),
    };
  };

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
    mongoose.connection.readyState = originalReadyState;
    mongoose.connection.db = originalDb;
    jest.clearAllMocks();
  });

  test.each(modulesUnderTest)('%s rejects missing access-token subjects', (_label, jwtUtils) => {
    expect(() => jwtUtils.signAccessToken({ email: 'worker@example.com', role: 'worker' })).toThrow('JWT subject is required');
  });

  test.each(modulesUnderTest)('%s rejects missing refresh-token subjects', (_label, jwtUtils) => {
    expect(() => jwtUtils.signRefreshToken({ version: 1 })).toThrow('JWT subject is required');
  });

  test.each(modulesUnderTest)('%s preserves valid subjects when signing tokens', (_label, jwtUtils) => {
    const accessToken = jwtUtils.signAccessToken({ id: 'user-123', email: 'worker@example.com', role: 'worker' });
    const refreshToken = jwtUtils.signRefreshToken({ sub: 'user-123', version: 2 });

    expect(jwt.decode(accessToken)).toMatchObject({
      sub: 'user-123',
      email: 'worker@example.com',
      role: 'worker',
      version: 0,
    });
    expect(jwt.decode(refreshToken)).toMatchObject({
      sub: 'user-123',
      version: 2,
    });
  });

  test('shared utils rejects revoked access tokens by JTI', async () => {
    setMockConnection({
      readyState: 1,
      findOneResult: {
        _id: 'revoked-token-1',
        jti: 'revoked-jti',
      },
    });

    const accessToken = sharedJwt.signAccessToken(
      { id: 'user-123', email: 'worker@example.com', role: 'worker' },
      { jwtid: 'revoked-jti' },
    );

    await expect(sharedJwt.verifyAccessToken(accessToken)).rejects.toMatchObject({
      name: 'JsonWebTokenError',
      message: 'Token revoked',
    });

    expect(mongoose.connection.db.collection).toHaveBeenCalledWith('revoked_tokens');
  });

  test('shared utils still verifies access tokens when revocation lookup is unavailable', async () => {
    mongoose.connection.readyState = 0;
    mongoose.connection.db = undefined;

    const accessToken = sharedJwt.signAccessToken(
      { id: 'user-123', email: 'worker@example.com', role: 'worker' },
      { jwtid: 'active-jti' },
    );

    await expect(sharedJwt.verifyAccessToken(accessToken)).resolves.toMatchObject({
      sub: 'user-123',
      email: 'worker@example.com',
      role: 'worker',
      jti: 'active-jti',
    });
  });
});