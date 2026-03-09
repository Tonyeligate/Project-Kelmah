const mongoose = require('mongoose');

const AuthChallengeSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['two_factor', 'oauth'],
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    consumedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'auth_challenges',
    autoCreate: true,
  },
);

AuthChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
AuthChallengeSchema.index({ type: 1, userId: 1, consumedAt: 1, expiresAt: 1 });

module.exports = mongoose.models.AuthChallenge || mongoose.model('AuthChallenge', AuthChallengeSchema);