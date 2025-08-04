/**
 * Refresh Token Model - MongoDB/Mongoose
 * Updated for MongoDB migration
 */

const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  token: {
    type: String,
    required: true,
    unique: true,
    maxlength: 500
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  isRevoked: {
    type: Boolean,
    default: false,
    required: true
  },
  createdByIp: {
    type: String,
    required: false
  },
  revokedByIp: {
    type: String,
    required: false
  },
  revokedAt: {
    type: Date,
    required: false
  },
  deviceInfo: {
    userAgent: String,
    ip: String,
    fingerprint: String,
    deviceType: String,
    browser: String,
    os: String
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  collection: 'refreshtokens'
});

// Indexes for performance
refreshTokenSchema.index({ userId: 1, expiresAt: 1 });
refreshTokenSchema.index({ token: 1 }, { unique: true });
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Instance methods
refreshTokenSchema.methods.isExpired = function() {
  return this.expiresAt < new Date();
};

refreshTokenSchema.methods.revoke = function(ip) {
  this.isRevoked = true;
  this.revokedAt = new Date();
  this.revokedByIp = ip;
  return this.save();
};

// Static methods
refreshTokenSchema.statics.findValidToken = function(token) {
  return this.findOne({
    token: token,
    isRevoked: false,
    expiresAt: { $gt: new Date() }
  }).populate('userId');
};

refreshTokenSchema.statics.revokeUserTokens = function(userId) {
  return this.updateMany(
    { userId: userId, isRevoked: false },
    { $set: { isRevoked: true, revokedAt: new Date() } }
  );
};

refreshTokenSchema.statics.cleanupExpired = function() {
  return this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { isRevoked: true, revokedAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } // 30 days old
    ]
  });
};

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);