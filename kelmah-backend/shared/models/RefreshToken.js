/**
 * Refresh Token Model - MongoDB/Mongoose (secure)
 * Stores only tokenHash + tokenId (jti) and version, never the raw token
 */

const mongoose = require('mongoose');

const RefreshTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  tokenId: { type: String, required: true, index: true }, // JWT jti
  tokenHash: { type: String, required: true, sparse: true }, // sha256 of raw part - sparse to handle nulls
  version: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true, index: true },
  isRevoked: { type: Boolean, default: false, index: true },
  createdByIp: { type: String },
  revokedByIp: { type: String },
  revokedAt: { type: Date },
  deviceInfo: {
    userAgent: String,
    ip: String,
    fingerprint: String,
    deviceType: String,
    browser: String,
    os: String,
  },
}, { 
  timestamps: true, 
  collection: 'refreshtokens',
  bufferCommands: true,
  bufferTimeoutMS: 30000, // Increased from default 10s // Disable buffering to prevent 10s timeout when DB not connected
  autoCreate: true
});

RefreshTokenSchema.index({ userId: 1, tokenId: 1 }, { unique: true });
RefreshTokenSchema.index({ tokenHash: 1 }, { unique: true, sparse: true });
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

RefreshTokenSchema.methods.isExpired = function() {
  return this.expiresAt < new Date();
};

RefreshTokenSchema.methods.revoke = function(ip) {
  this.isRevoked = true;
  this.revokedAt = new Date();
  this.revokedByIp = ip;
  return this.save();
};

RefreshTokenSchema.statics.cleanupExpired = function() {
  return this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { isRevoked: true, revokedAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    ],
  });
};

module.exports = mongoose.models.RefreshToken || mongoose.model('RefreshToken', RefreshTokenSchema);