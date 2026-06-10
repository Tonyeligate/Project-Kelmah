/**
 * Payment Model — Mongoose
 * Records individual payment/payout operations.
 */

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'GHS',
      enum: ['GHS', 'USD', 'EUR'],
    },
    method: {
      type: String,
      required: true,
      enum: [
        'mtn_momo',
        'vodafone_cash',
        'airtel_tigo',
        'paystack_card',
        'paystack_bank',
        'paystack_transfer',
      ],
    },
    type: {
      type: String,
      enum: ['PAYMENT', 'PAYOUT'],
      default: 'PAYMENT',
    },
    status: {
      type: String,
      enum: [
        'PENDING',
        'INITIALIZED',
        'PROCESSING',
        'COMPLETED',
        'FAILED',
        'CANCELLED',
        'REFUNDED',
      ],
      default: 'PENDING',
      index: true,
    },
    description: String,
    failureReason: String,
    providerTransactionId: String,
    providerResponse: mongoose.Schema.Types.Mixed,
    metadata: mongoose.Schema.Types.Mixed,
    completedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for common queries
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, method: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
