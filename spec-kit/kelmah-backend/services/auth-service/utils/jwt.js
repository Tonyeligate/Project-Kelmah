const jwt = require("jsonwebtoken");
const RevokedToken = require('../models/RevokedToken');
const { JWT_SECRET, JWT_REFRESH_SECRET } = process.env;

module.exports = {
  generateAuthTokens: (user) => {
    const issuer = process.env.JWT_ISSUER || 'kelmah-auth-service';
    const audience = process.env.JWT_AUDIENCE || 'kelmah-platform';
    const tokenVersion = user.tokenVersion || 0;
    const jti = cryptoRandomString();

    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role, version: tokenVersion },
      process.env.JWT_SECRET,
      { expiresIn: "15m", issuer, audience, jwtid: jti },
    );
    const refreshToken = jwt.sign(
      { id: user.id, version: tokenVersion, jti },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d", issuer, audience },
    );
    return { accessToken, refreshToken };
  },
  verifyAuthToken: async (token) => {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: process.env.JWT_ISSUER || 'kelmah-auth-service',
      audience: process.env.JWT_AUDIENCE || 'kelmah-platform'
    });
    // Defense-in-depth: blacklist check by JTI
    if (decoded && decoded.jti) {
      const blacklisted = await RevokedToken.findOne({ jti: decoded.jti });
      if (blacklisted) {
        const err = new Error('Token revoked');
        err.name = 'JsonWebTokenError';
        throw err;
      }
    }
    return decoded;
  },
  verifyRefreshToken: (token) => {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
      issuer: process.env.JWT_ISSUER || 'kelmah-auth-service',
      audience: process.env.JWT_AUDIENCE || 'kelmah-platform'
    });
  },
  revokeByJti: async (jti, userId, expiresAt, reason = 'revoked') => {
    try {
      await RevokedToken.create({ jti, userId, expiresAt, reason });
    } catch (_) {}
  },
};

function cryptoRandomString() {
  try {
    const crypto = require('crypto');
    return crypto.randomBytes(16).toString('hex');
  } catch (_) {
    return `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }
}
