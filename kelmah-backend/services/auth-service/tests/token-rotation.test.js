describe('token rotation utility', () => {
  const originalEnv = process.env;

  const loadSecureJwt = () => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      JWT_SECRET: 'test-access-secret',
      JWT_REFRESH_SECRET: 'test-refresh-secret',
      JWT_EXPIRES_IN: '15m',
      JWT_REFRESH_EXPIRES_IN: '7d',
    };
    return require('../utils/jwt-secure');
  };

  afterAll(() => {
    process.env = originalEnv;
  });

  test('generateRefreshToken returns composite token and hashed raw token', async () => {
    const secureJwt = loadSecureJwt();

    const tokenData = await secureJwt.generateRefreshToken(
      { id: 'user-1', tokenVersion: 3 },
      { deviceInfo: 'Chrome', ipAddress: '127.0.0.1' },
    );

    expect(tokenData.token.split('.')).toHaveLength(4);
    expect(tokenData.tokenId).toEqual(expect.any(String));
    expect(tokenData.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(tokenData.expiresAt).toBeInstanceOf(Date);
  });

  test('verifyRefreshToken accepts matching hash and version', async () => {
    const secureJwt = loadSecureJwt();

    const tokenData = await secureJwt.generateRefreshToken({ id: 'user-2', tokenVersion: 5 });

    const result = await secureJwt.verifyRefreshToken(tokenData.token, {
      tokenHash: tokenData.tokenHash,
      version: 5,
    });

    expect(result).toEqual(
      expect.objectContaining({
        valid: true,
        userId: 'user-2',
        version: 5,
      }),
    );
  });

  test('verifyRefreshToken rejects mismatched hash', async () => {
    const secureJwt = loadSecureJwt();

    const tokenData = await secureJwt.generateRefreshToken({ id: 'user-3', tokenVersion: 1 });

    const result = await secureJwt.verifyRefreshToken(tokenData.token, {
      tokenHash: '0'.repeat(64),
      version: 1,
    });

    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/invalid refresh token/i);
  });

  test('verifyRefreshToken rejects token version mismatch', async () => {
    const secureJwt = loadSecureJwt();

    const tokenData = await secureJwt.generateRefreshToken({ id: 'user-4', tokenVersion: 2 });

    const result = await secureJwt.verifyRefreshToken(tokenData.token, {
      tokenHash: tokenData.tokenHash,
      version: 99,
    });

    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/version mismatch/i);
  });
});

