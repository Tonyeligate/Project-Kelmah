const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TransactionSchema = new Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      required: true,
      default: 'USD'
    },
    type: {
      type: String,
      enum: ['payment', 'refund', 'withdrawal', 'deposit'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
      default: 'pending'
    },
    paymentMethod: {
      type: {
        type: String,
        enum: ['credit_card', 'bank_transfer', 'paypal', 'stripe'],
        required: true
      },
      details: {
        type: Schema.Types.Mixed
      }
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    relatedContract: {
      type: Schema.Types.ObjectId,
      ref: 'Contract'
    },
    relatedJob: {
      type: Schema.Types.ObjectId,
      ref: 'Job'
    },
    description: String,
    metadata: {
      platformFee: Number,
      processingFee: Number,
      taxAmount: Number,
      paymentProvider: String,
      paymentProviderTransactionId: String
    },
    errorDetails: {
      code: String,
      message: String,
      timestamp: Date
    }
  },
  { timestamps: true }
);

// Indexes for better query performance
TransactionSchema.index({ transactionId: 1 });
TransactionSchema.index({ sender: 1 });
TransactionSchema.index({ recipient: 1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ createdAt: -1 });
TransactionSchema.index({ relatedContract: 1 });
TransactionSchema.index({ relatedJob: 1 });

// Helper methods
TransactionSchema.methods.updateStatus = async function(newStatus, errorDetails = null) {
  this.status = newStatus;
  if (errorDetails) {
    this.errorDetails = {
      ...errorDetails,
      timestamp: new Date()
    };
  }
  return this.save();
};

TransactionSchema.methods.calculateFees = function() {
  const platformFeeRate = 0.10; // 10% platform fee
  const processingFeeRate = 0.029; // 2.9% processing fee
  const taxRate = 0.05; // 5% tax

  this.metadata.platformFee = this.amount * platformFeeRate;
  this.metadata.processingFee = this.amount * processingFeeRate;
  this.metadata.taxAmount = this.amount * taxRate;

  return this.save();
};

const Transaction = mongoose.model('Transaction', TransactionSchema);

module.exports = Transaction; 