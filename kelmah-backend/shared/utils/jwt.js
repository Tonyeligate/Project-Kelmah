const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const DEFAULT_ISSUER = process.env.JWT_ISSUER || 'kelmah-auth-service';
const DEFAULT_AUDIENCE = process.env.JWT_AUDIENCE || 'kelmah-platform';

function ensureSecret(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} environment variable`);
  }
  return value;
}

function resolveSubject(payload = {}) {
  const subject = payload.id ?? payload.sub;

  if (subject === undefined || subject === null || subject === '') {
    throw new Error('JWT subject is required');
  }

  return String(subject);
}

function signAccessToken(payload, options = {}) {
  const secret = ensureSecret('JWT_SECRET');
  const { expiresIn = '15m', issuer = DEFAULT_ISSUER, audience = DEFAULT_AUDIENCE, jwtid } = options;
  const body = {
    sub: resolveSubject(payload),
    email: payload.email,
    role: payload.role,
    version: payload.version ?? payload.tokenVersion ?? 0,
  };
  // Only include jwtid if it's provided and is a string
  const signOptions = { expiresIn, issuer, audience };
  if (jwtid && typeof jwtid === 'string') {
    signOptions.jwtid = jwtid;
  }
  return jwt.sign(body, secret, signOptions);
}

function signRefreshToken(payload, options = {}) {
  const secret = ensureSecret('JWT_REFRESH_SECRET');
  const { expiresIn = '7d', issuer = DEFAULT_ISSUER, audience = DEFAULT_AUDIENCE, jwtid } = options;
  const body = {
    sub: resolveSubject(payload),
    version: payload.version ?? payload.tokenVersion ?? 0,
  };
  // Only include jwtid if it's provided and is a string
  const signOptions = { expiresIn, issuer, audience };
  if (jwtid && typeof jwtid === 'string') {
    signOptions.jwtid = jwtid;
  }
  return jwt.sign(body, secret, signOptions);
}

async function findRevokedTokenByJti(jti) {
  if (!jti || !mongoose?.connection || mongoose.connection.readyState !== 1) {
    return null;
  }

  try {
    return await mongoose.connection
      .db
      .collection('revoked_tokens')
      .findOne({
        jti,
        expiresAt: { $gt: new Date() },
      });
  } catch (_) {
    return null;
  }
}

async function verifyAccessToken(token, options = {}) {
  const secret = ensureSecret('JWT_SECRET');
  const { issuer = DEFAULT_ISSUER, audience = DEFAULT_AUDIENCE } = options;
  const decoded = jwt.verify(token, secret, { issuer, audience, algorithms: ['HS256'] });

  if (decoded?.jti) {
    const revokedToken = await findRevokedTokenByJti(decoded.jti);
    if (revokedToken) {
      const error = new Error('Token revoked');
      error.name = 'JsonWebTokenError';
      throw error;
    }
  }

  return decoded;
}

function verifyRefreshToken(token, options = {}) {
  const secret = ensureSecret('JWT_REFRESH_SECRET');
  const { issuer = DEFAULT_ISSUER, audience = DEFAULT_AUDIENCE } = options;
  return jwt.verify(token, secret, { issuer, audience, algorithms: ['HS256'] });
}

function generateAuthTokens(user) {
  const accessJti = cryptoRandomString();
  const refreshJti = cryptoRandomString();
  const accessToken = signAccessToken(user, { jwtid: accessJti });
  const refreshToken = signRefreshToken(user, { jwtid: refreshJti });
  return { accessToken, refreshToken };
}

async function verifyAuthToken(token) {
  return verifyAccessToken(token);
}

function cryptoRandomString() {
  return crypto.randomBytes(16).toString('hex');
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
  findRevokedTokenByJti,
  decodeUserFromClaims,
  generateAuthTokens,
  verifyAuthToken,
};





