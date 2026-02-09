const mongoose = require('mongoose');

const EscrowSchema = new mongoose.Schema({
  contractId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract', index: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', index: true },
  hirerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'GHS' },
  provider: { type: String, enum: ['stripe', 'paypal', 'mtn', 'vodafone', 'airteltigo', 'paystack', 'wallet'], default: 'stripe' },
  status: { type: String, enum: ['pending', 'active', 'released', 'refunded', 'disputed', 'cancelled'], default: 'active', index: true },
  reference: { type: String, index: true },
  metadata: { type: mongoose.Schema.Types.Mixed },
  milestones: [{
    milestoneId: { type: String },
    description: String,
    amount: Number,
    status: { type: String, enum: ['pending', 'completed', 'released'], default: 'pending' },
    dueDate: Date,
    completedDate: Date,
    releasedDate: Date,
  }],
  transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }],
  releasedAt: Date,
  refundedAt: Date,
}, { timestamps: true, collection: 'escrows' });

EscrowSchema.index({ hirerId: 1, workerId: 1, status: 1 });

module.exports = mongoose.model('Escrow', EscrowSchema);




