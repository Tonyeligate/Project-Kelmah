const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const WalletSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
WalletSchema.index({ user: 1 }, { unique: true });
WalletSchema.index({ status: 1 });
WalletSchema.index({ "metadata.lastTransactionDate": -1 });

const buildWalletHistoryUpdate = ({ amount, transactionId, type, metricKey }) => {
  const timestamp = new Date();
  const update = {
    $inc: {
      balance: type === 'credit' ? amount : -amount,
    },
    $set: {
      'metadata.lastTransactionDate': timestamp,
    },
  };

  if (metricKey) {
    update.$inc[`metadata.${metricKey}`] = amount;
  }

  if (transactionId) {
    update.$push = {
      transactionHistory: {
        transaction: transactionId,
        type,
        amount,
        timestamp,
      },
    };
  }

  return update;
};

WalletSchema.statics.atomicCredit = async function ({
  walletId,
  userId,
  amount,
  transactionId,
  session,
  trackEarnings = true,
}) {
  return this.findOneAndUpdate(
    walletId ? { _id: walletId } : { user: userId },
    buildWalletHistoryUpdate({
      amount,
      transactionId,
      type: 'credit',
      metricKey: trackEarnings ? 'totalEarnings' : null,
    }),
    { new: true, session },
  );
};

WalletSchema.statics.atomicDeduct = async function ({
  walletId,
  userId,
  amount,
  transactionId,
  session,
  trackSpend = true,
}) {
  const wallet = await this.findOneAndUpdate(
    {
      ...(walletId ? { _id: walletId } : { user: userId }),
      balance: { $gte: amount },
    },
    buildWalletHistoryUpdate({
      amount,
      transactionId,
      type: 'debit',
      metricKey: trackSpend ? 'totalSpent' : null,
    }),
    { new: true, session },
  );

  if (!wallet) {
    throw new Error('Insufficient funds');
  }

  return wallet;
};

// Helper methods
WalletSchema.methods.addFunds = async function (amount, transaction, options = {}) {
  const updatedWallet = await this.constructor.atomicCredit({
    walletId: this._id,
    amount,
    transactionId: transaction?._id,
    session: options.session,
    trackEarnings: true,
  });
  if (updatedWallet) {
    this.set(updatedWallet.toObject());
  }
  return updatedWallet;
};

WalletSchema.methods.deductFunds = async function (amount, transaction, options = {}) {
  const updatedWallet = await this.constructor.atomicDeduct({
    walletId: this._id,
    amount,
    transactionId: transaction?._id,
    session: options.session,
    trackSpend: true,
  });
  if (updatedWallet) {
    this.set(updatedWallet.toObject());
  }
  return updatedWallet;
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
