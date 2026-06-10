const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TransactionSchema = new Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    currency: {
      type: String,
      required: true,
      default: "USD",
    },
    type: {
      type: String,
      enum: ["payment", "refund", "withdrawal", "deposit", "milestone_payment"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "pending_confirmation", "completed", "failed", "cancelled", "milestone_payment"],
      default: "pending",
    },
    paymentMethod: {
      type: Schema.Types.ObjectId,
      ref: "PaymentMethod",
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    relatedTransaction: {
      type: String,
      index: true,
    },
    relatedContract: {
      type: Schema.Types.ObjectId,
      ref: "Contract",
    },
    relatedJob: {
      type: Schema.Types.ObjectId,
      ref: "Job",
    },
    description: String,
    metadata: {
      platformFee: Number,
      processingFee: Number,
      taxAmount: Number,
      paymentProvider: String,
      paymentProviderTransactionId: String,
    },
    gatewayData: {
      type: Schema.Types.Mixed,
    },
    errorDetails: {
      code: String,
      message: String,
      timestamp: Date,
    },
  },
  { timestamps: true },
);

// Indexes for better query performance
TransactionSchema.index({ transactionId: 1 });
TransactionSchema.index({ sender: 1 });
TransactionSchema.index({ sender: 1, createdAt: -1 });
TransactionSchema.index({ recipient: 1 });
TransactionSchema.index({ recipient: 1, createdAt: -1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ createdAt: -1 });
TransactionSchema.index({ relatedContract: 1 });
TransactionSchema.index({ relatedJob: 1 });
TransactionSchema.index({ relatedTransaction: 1 });

// Helper methods
TransactionSchema.methods.updateStatus = async function (
  newStatus,
  errorDetails = null,
) {
  this.status = newStatus;
  if (errorDetails) {
    this.errorDetails = {
      ...errorDetails,
      timestamp: new Date(),
    };
  }
  return this.save();
};

TransactionSchema.methods.calculateFees = function () {
  const platformFeeRate = 0.1; // 10% platform fee
  const processingFeeRate = 0.029; // 2.9% processing fee
  const taxRate = 0.05; // 5% tax
  const roundCurrency = (value) => Math.round(Number(value || 0) * 100) / 100;

  this.metadata = this.metadata || {};

  this.metadata.platformFee = roundCurrency(this.amount * platformFeeRate);
  this.metadata.processingFee = roundCurrency(this.amount * processingFeeRate);
  this.metadata.taxAmount = roundCurrency(this.amount * taxRate);

  return this.save();
};

const Transaction = mongoose.model("Transaction", TransactionSchema);

module.exports = Transaction;
