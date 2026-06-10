const mongoose = require('mongoose');

const RevokedTokenSchema = new mongoose.Schema({
  jti: { type: String, required: true, unique: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  reason: { type: String },
  expiresAt: { type: Date, required: true, index: true },
}, { timestamps: true, collection: 'revoked_tokens' });

// TTL cleanup once expired
RevokedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RevokedToken', RevokedTokenSchema);


