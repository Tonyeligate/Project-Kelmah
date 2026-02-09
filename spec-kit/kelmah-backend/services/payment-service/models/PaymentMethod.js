const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PaymentMethodSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["credit_card", "bank_account", "paypal"],
      required: true,
    },
    isDefault: { type: Boolean, default: false },
    cardDetails: { type: Schema.Types.Mixed },
    bankDetails: { type: Schema.Types.Mixed },
    paypalDetails: { type: Schema.Types.Mixed },
    billingAddress: { type: Schema.Types.Mixed },
    metadata: { type: Schema.Types.Mixed },
    verified: {
      type: String,
      enum: ["pending", "verified", "failed"],
      default: "pending",
    },
  },
  { timestamps: true },
);

// Set this payment method as default for the user
PaymentMethodSchema.methods.setAsDefault = async function () {
  // Unset default on other methods
  await this.constructor.updateMany(
    { user: this.user, _id: { $ne: this._id } },
    { isDefault: false },
  );
  this.isDefault = true;
  return this.save();
};

// Update verification status of the payment method
PaymentMethodSchema.methods.updateVerificationStatus = async function (status) {
  this.verified = status;
  return this.save();
};

const PaymentMethod = mongoose.model("PaymentMethod", PaymentMethodSchema);
module.exports = PaymentMethod;
