const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PayoutQueueSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'GHS' },
  provider: { type: String, enum: ['paystack', 'mtn_momo', 'vodafone_cash', 'airteltigo'], required: true },
  paymentMethod: { type: Schema.Types.ObjectId, ref: 'PaymentMethod', required: true },
  status: { type: String, enum: ['queued', 'processing', 'completed', 'failed'], default: 'queued', index: true },
  attempts: { type: Number, default: 0 },
  lastError: { code: String, message: String },
  metadata: Schema.Types.Mixed,
}, { timestamps: true, collection: 'payout_queue' });

PayoutQueueSchema.index({ status: 1, createdAt: 1 });

module.exports = mongoose.model('PayoutQueue', PayoutQueueSchema);


