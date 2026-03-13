const DEFAULT_ACCESS_COOKIE_NAME = 'kelmah_access_token';
const DEFAULT_REFRESH_COOKIE_NAME = 'kelmah_refresh_token';

const ACCESS_COOKIE_MAX_AGE_MS = Number.parseInt(
  process.env.AUTH_ACCESS_COOKIE_MAX_AGE_MS,
  10,
) || 15 * 60 * 1000;

const REFRESH_COOKIE_MAX_AGE_MS = Number.parseInt(
  process.env.AUTH_REFRESH_COOKIE_MAX_AGE_MS,
  10,
) || 7 * 24 * 60 * 60 * 1000;

const parseBooleanEnv = (value, fallback) => {
  if (typeof value !== 'string') {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  return fallback;
};

const getCookieNames = () => ({
  access: process.env.AUTH_ACCESS_COOKIE_NAME || DEFAULT_ACCESS_COOKIE_NAME,
  refresh: process.env.AUTH_REFRESH_COOKIE_NAME || DEFAULT_REFRESH_COOKIE_NAME,
});

const getCookieBaseOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const sameSite =
    process.env.AUTH_COOKIE_SAME_SITE || (isProduction ? 'none' : 'lax');

  const secure = parseBooleanEnv(
    process.env.AUTH_COOKIE_SECURE,
    sameSite === 'none' || isProduction,
  );

  const options = {
    httpOnly: true,
    sameSite,
    secure,
    path: process.env.AUTH_COOKIE_PATH || '/',
  };

  if (process.env.AUTH_COOKIE_DOMAIN) {
    options.domain = process.env.AUTH_COOKIE_DOMAIN;
  }

  return options;
};

const setAuthCookies = (res, { accessToken, refreshToken } = {}) => {
  if (!res || typeof res.cookie !== 'function') {
    return;
  }

  const names = getCookieNames();
  const baseOptions = getCookieBaseOptions();

  if (typeof accessToken === 'string' && accessToken.length > 0) {
    res.cookie(names.access, accessToken, {
      ...baseOptions,
      maxAge: ACCESS_COOKIE_MAX_AGE_MS,
    });
  }

  if (typeof refreshToken === 'string' && refreshToken.length > 0) {
    res.cookie(names.refresh, refreshToken, {
      ...baseOptions,
      maxAge: REFRESH_COOKIE_MAX_AGE_MS,
    });
  }
};

const clearAuthCookies = (res) => {
  if (!res || typeof res.clearCookie !== 'function') {
    return;
  }

  const names = getCookieNames();
  const baseOptions = getCookieBaseOptions();

  res.clearCookie(names.access, baseOptions);
  res.clearCookie(names.refresh, baseOptions);
};

const getRefreshTokenFromCookies = (req) => {
  const name = getCookieNames().refresh;
  const value = req?.cookies?.[name];
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
};

module.exports = {
  setAuthCookies,
  clearAuthCookies,
  getRefreshTokenFromCookies,
};
