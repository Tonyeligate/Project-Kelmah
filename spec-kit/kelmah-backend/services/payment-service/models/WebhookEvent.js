const mongoose = require('mongoose');

const WebhookEventSchema = new mongoose.Schema({
  provider: { type: String, enum: ['stripe', 'paystack', 'other'], required: true, index: true },
  eventType: { type: String, required: true, index: true },
  reference: { type: String, index: true },
  payload: { type: mongoose.Schema.Types.Mixed, required: true },
  signature: { type: String },
  processed: { type: Boolean, default: false, index: true },
  processedAt: { type: Date },
  error: { type: String }
}, { timestamps: true, collection: 'webhook_events' });

module.exports = mongoose.model('WebhookEvent', WebhookEventSchema);



