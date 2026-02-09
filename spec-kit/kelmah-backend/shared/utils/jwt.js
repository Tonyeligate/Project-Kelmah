const jwt = require('jsonwebtoken');

const DEFAULT_ISSUER = process.env.JWT_ISSUER || 'kelmah-auth-service';
const DEFAULT_AUDIENCE = process.env.JWT_AUDIENCE || 'kelmah-platform';

function ensureSecret(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} environment variable`);
  }
  return value;
}

function signAccessToken(payload, options = {}) {
  const secret = ensureSecret('JWT_SECRET');
  const { expiresIn = '15m', issuer = DEFAULT_ISSUER, audience = DEFAULT_AUDIENCE, jwtid } = options;
  const body = {
    sub: String(payload.id || payload.sub),
    email: payload.email,
    role: payload.role,
    version: payload.version ?? payload.tokenVersion ?? 0,
  };
  return jwt.sign(body, secret, { expiresIn, issuer, audience, jwtid });
}

function signRefreshToken(payload, options = {}) {
  const secret = ensureSecret('JWT_REFRESH_SECRET');
  const { expiresIn = '7d', issuer = DEFAULT_ISSUER, audience = DEFAULT_AUDIENCE, jwtid } = options;
  const body = {
    sub: String(payload.id || payload.sub),
    version: payload.version ?? payload.tokenVersion ?? 0,
  };
  return jwt.sign(body, secret, { expiresIn, issuer, audience, jwtid });
}

function verifyAccessToken(token, options = {}) {
  const secret = ensureSecret('JWT_SECRET');
  const { issuer = DEFAULT_ISSUER, audience = DEFAULT_AUDIENCE } = options;
  return jwt.verify(token, secret, { issuer, audience });
}

function verifyRefreshToken(token, options = {}) {
  const secret = ensureSecret('JWT_REFRESH_SECRET');
  const { issuer = DEFAULT_ISSUER, audience = DEFAULT_AUDIENCE } = options;
  return jwt.verify(token, secret, { issuer, audience });
}

function generateAuthTokens(user) {
  const jti = cryptoRandomString();
  const accessToken = signAccessToken(user, { jwtid: jti });
  const refreshToken = signRefreshToken(user, { jwtid: jti });
  return { accessToken, refreshToken };
}

function verifyAuthToken(token) {
  return verifyAccessToken(token);
}

function cryptoRandomString() {
  try {
    const crypto = require('crypto');
    return crypto.randomBytes(16).toString('hex');
  } catch (_) {
    return `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }
}

function decodeUserFromClaims(decoded) {
  const id = decoded.sub || decoded.id || decoded.userId;
  return {
    id: id ? String(id) : undefined,
    email: decoded.email,
    role: decoded.role,
    version: decoded.version ?? decoded.tokenVersion ?? 0,
    jti: decoded.jti,
    iat: decoded.iat,
    exp: decoded.exp,
  };
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeUserFromClaims,
  generateAuthTokens,
  verifyAuthToken,
};





