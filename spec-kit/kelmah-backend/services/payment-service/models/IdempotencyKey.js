const mongoose = require('mongoose');

const IdempotencyKeySchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, index: true },
  scope: { type: String, default: 'payment_intent', index: true },
  status: { type: String, enum: ['processing', 'completed', 'failed'], default: 'processing' },
  response: { type: mongoose.Schema.Types.Mixed },
  error: { type: String },
  ttl: { type: Date, index: { expires: '7d' } } // auto-expire after 7 days
}, { timestamps: true, collection: 'idempotency_keys' });

module.exports = mongoose.model('IdempotencyKey', IdempotencyKeySchema);



