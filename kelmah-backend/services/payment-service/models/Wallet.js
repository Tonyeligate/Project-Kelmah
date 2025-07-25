const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const WalletSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: "USD",
    },
    status: {
      type: String,
      enum: ["active", "frozen", "closed"],
      default: "active",
    },
    paymentMethods: [
      {
        type: {
          type: String,
          enum: ["credit_card", "bank_account", "paypal"],
          required: true,
        },
        isDefault: {
          type: Boolean,
          default: false,
        },
        details: {
          type: Schema.Types.Mixed,
        },
        lastUsed: Date,
        status: {
          type: String,
          enum: ["active", "inactive", "expired"],
          default: "active",
        },
      },
    ],
    transactionHistory: [
      {
        transaction: {
          type: Schema.Types.ObjectId,
          ref: "Transaction",
        },
        type: {
          type: String,
          enum: ["credit", "debit"],
        },
        amount: Number,
        timestamp: Date,
      },
    ],
    metadata: {
      lastTransactionDate: Date,
      totalEarnings: {
        type: Number,
        default: 0,
      },
      totalSpent: {
        type: Number,
        default: 0,
      },
      withdrawalLimit: {
        type: Number,
        default: 10000, // Default withdrawal limit in USD
      },
    },
  },
  { timestamps: true },
);

// Indexes for better query performance
WalletSchema.index({ user: 1 });
WalletSchema.index({ status: 1 });
WalletSchema.index({ "metadata.lastTransactionDate": -1 });

// Helper methods
WalletSchema.methods.addFunds = async function (amount, transaction) {
  this.balance += amount;
  this.transactionHistory.push({
    transaction: transaction._id,
    type: "credit",
    amount: amount,
    timestamp: new Date(),
  });
  this.metadata.lastTransactionDate = new Date();
  this.metadata.totalEarnings += amount;
  return this.save();
};

WalletSchema.methods.deductFunds = async function (amount, transaction) {
  if (this.balance < amount) {
    throw new Error("Insufficient funds");
  }
  this.balance -= amount;
  this.transactionHistory.push({
    transaction: transaction._id,
    type: "debit",
    amount: amount,
    timestamp: new Date(),
  });
  this.metadata.lastTransactionDate = new Date();
  this.metadata.totalSpent += amount;
  return this.save();
};

WalletSchema.methods.addPaymentMethod = async function (paymentMethod) {
  if (paymentMethod.isDefault) {
    // Remove default status from other payment methods
    this.paymentMethods.forEach((method) => {
      method.isDefault = false;
    });
  }
  this.paymentMethods.push(paymentMethod);
  return this.save();
};

WalletSchema.methods.removePaymentMethod = async function (paymentMethodId) {
  this.paymentMethods = this.paymentMethods.filter(
    (method) => method._id.toString() !== paymentMethodId,
  );
  return this.save();
};

const Wallet = mongoose.model("Wallet", WalletSchema);

module.exports = Wallet;
