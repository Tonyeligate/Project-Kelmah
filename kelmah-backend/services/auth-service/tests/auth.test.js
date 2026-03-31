/**
 * Authentication utility tests
 */

const {
  setAuthCookies,
  clearAuthCookies,
  getRefreshTokenFromCookies,
} = require('../utils/authCookies');

const createMockResponse = () => ({
  cookie: jest.fn(),
  clearCookie: jest.fn(),
});

describe('auth cookie helpers', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.NODE_ENV = 'test';
    delete process.env.AUTH_ACCESS_COOKIE_NAME;
    delete process.env.AUTH_REFRESH_COOKIE_NAME;
    delete process.env.AUTH_COOKIE_DOMAIN;
    delete process.env.AUTH_COOKIE_PATH;
    delete process.env.AUTH_COOKIE_SECURE;
    delete process.env.AUTH_COOKIE_SAME_SITE;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('setAuthCookies stores access and refresh cookies when both tokens exist', () => {
    const res = createMockResponse();

    setAuthCookies(res, {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    expect(res.cookie).toHaveBeenCalledTimes(2);

    const [accessName, accessValue, accessOptions] = res.cookie.mock.calls[0];
    const [refreshName, refreshValue, refreshOptions] = res.cookie.mock.calls[1];

    expect(accessName).toBe('kelmah_access_token');
    expect(accessValue).toBe('access-token');
    expect(accessOptions).toEqual(
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        path: '/',
        maxAge: expect.any(Number),
      }),
    );

    expect(refreshName).toBe('kelmah_refresh_token');
    expect(refreshValue).toBe('refresh-token');
    expect(refreshOptions).toEqual(expect.objectContaining({ maxAge: expect.any(Number) }));
  });

  test('setAuthCookies uses env-provided cookie names', () => {
    process.env.AUTH_ACCESS_COOKIE_NAME = 'custom_access';
    process.env.AUTH_REFRESH_COOKIE_NAME = 'custom_refresh';

    const res = createMockResponse();

    setAuthCookies(res, {
      accessToken: 'a-token',
      refreshToken: 'r-token',
    });

    expect(res.cookie).toHaveBeenNthCalledWith(
      1,
      'custom_access',
      'a-token',
      expect.any(Object),
    );
    expect(res.cookie).toHaveBeenNthCalledWith(
      2,
      'custom_refresh',
      'r-token',
      expect.any(Object),
    );
  });

  test('clearAuthCookies clears both auth cookie names', () => {
    const res = createMockResponse();

    clearAuthCookies(res);

    expect(res.clearCookie).toHaveBeenCalledTimes(2);
    expect(res.clearCookie).toHaveBeenNthCalledWith(
      1,
      'kelmah_access_token',
      expect.objectContaining({ httpOnly: true, path: '/' }),
    );
    expect(res.clearCookie).toHaveBeenNthCalledWith(
      2,
      'kelmah_refresh_token',
      expect.objectContaining({ httpOnly: true, path: '/' }),
    );
  });

  test('getRefreshTokenFromCookies returns token when present and null otherwise', () => {
    process.env.AUTH_REFRESH_COOKIE_NAME = 'refresh_cookie';

    expect(
      getRefreshTokenFromCookies({
        cookies: { refresh_cookie: 'refresh-token-123' },
      }),
    ).toBe('refresh-token-123');

    expect(
      getRefreshTokenFromCookies({
        cookies: { refresh_cookie: '   ' },
      }),
    ).toBeNull();

    expect(getRefreshTokenFromCookies({ cookies: {} })).toBeNull();
    expect(getRefreshTokenFromCookies(undefined)).toBeNull();
  });
});
