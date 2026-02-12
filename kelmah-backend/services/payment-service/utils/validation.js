const Joi = require("joi");

// Transaction validation schema
const transactionSchema = Joi.object({
  amount: Joi.number().required().min(0),
  currency: Joi.string().default("USD"),
  type: Joi.string()
    .valid("payment", "refund", "withdrawal", "deposit")
    .required(),
  paymentMethod: Joi.string().required(),
  recipient: Joi.string().when("type", {
    is: "payment",
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
  relatedContract: Joi.string(),
  relatedJob: Joi.string(),
  description: Joi.string().max(500),
});

// Wallet validation schema
const walletSchema = Joi.object({
  currency: Joi.string().default("USD"),
  paymentMethods: Joi.array().items(
    Joi.object({
      type: Joi.string()
        .valid("credit_card", "bank_account", "paypal")
        .required(),
      isDefault: Joi.boolean().default(false),
      details: Joi.object().required(),
    }),
  ),
});

// Payment method validation schema
const paymentMethodSchema = Joi.object({
  type: Joi.string()
    .valid("credit_card", "bank_account", "paypal", "mobile_money")
    .required(),
  isDefault: Joi.boolean().default(false),
  cardDetails: Joi.object({
    number: Joi.string().when("type", {
      is: "credit_card",
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),
    expMonth: Joi.number().min(1).max(12),
    expYear: Joi.number().min(new Date().getFullYear()),
    cvc: Joi.string().min(3).max(4),
    cardholderName: Joi.string(),
  }),
  bankDetails: Joi.object({
    accountNumber: Joi.string().when("type", {
      is: "bank_account",
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),
    routingNumber: Joi.string(),
    accountType: Joi.string().valid("checking", "savings"),
    bankName: Joi.string(),
  }),
  paypalDetails: Joi.object({
    email: Joi.string().email().when("type", {
      is: "paypal",
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),
  }),
  mobileDetails: Joi.object({
    provider: Joi.string().when("type", {
      is: "mobile_money",
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),
    phoneNumber: Joi.string().when("type", {
      is: "mobile_money",
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),
    name: Joi.string(),
  }),
  billingAddress: Joi.object({
    street: Joi.string(),
    city: Joi.string(),
    state: Joi.string(),
    country: Joi.string(),
    postalCode: Joi.string(),
  }).optional(),
  metadata: Joi.object({
    provider: Joi.string().valid("stripe", "paypal", "bank", "mobile_money"),
    providerId: Joi.string(),
  }),
});

// Validation functions
exports.validateTransaction = (data) => {
  return transactionSchema.validate(data);
};

exports.validateWallet = (data) => {
  return walletSchema.validate(data);
};

exports.validatePaymentMethod = (data) => {
  return paymentMethodSchema.validate(data);
};
