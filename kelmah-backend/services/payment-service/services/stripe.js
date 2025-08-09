require("dotenv").config();
const Stripe = require("stripe");
const stripeClient = Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Create a payment intent
 * @param {number} amount - amount in smallest currency unit (e.g., cents)
 * @param {string} currency
 * @param {object} [options]
 * @returns {Promise<object>}
 */
async function createPaymentIntent(amount, currency = "usd", options = {}) {
  const { idempotencyKey, ...rest } = options || {};
  const params = {
    amount,
    currency,
    ...rest,
    metadata: {
      ...(rest.metadata || {}),
      source: 'kelmah-platform',
      escrowReference: rest.metadata?.escrowReference || rest.escrowReference
    }
  };
  const requestOptions = idempotencyKey ? { idempotencyKey } : undefined;
  return stripeClient.paymentIntents.create(params, requestOptions);
}

/**
 * Confirm a payment intent
 * @param {string} paymentIntentId
 * @returns {Promise<object>}
 */
async function confirmPayment(paymentIntentId) {
  return stripeClient.paymentIntents.confirm(paymentIntentId);
}

/**
 * Process a payment for a transaction
 * @param {object} transaction
 * @param {object} paymentMethod
 */
async function processPayment(transaction, paymentMethod) {
  if (!transaction.metadata || !transaction.metadata.paymentIntentId) {
    throw new Error("Missing paymentIntentId in transaction metadata");
  }
  return confirmPayment(transaction.metadata.paymentIntentId);
}

/**
 * Process a withdrawal (payout)
 * @param {object} transaction
 * @param {object} paymentMethod
 */
async function processWithdrawal(transaction, paymentMethod) {
  // Create a payout to the user's bank or card
  const payout = await stripeClient.payouts.create({
    amount: transaction.amount,
    currency: transaction.currency || "usd",
    destination: paymentMethod.providerId,
    metadata: { transactionId: transaction.transactionId },
  });
  return payout;
}

/**
 * Process a refund for a previous payment
 * @param {object} originalTransaction
 */
async function processRefund(originalTransaction) {
  if (
    !originalTransaction.metadata ||
    !originalTransaction.metadata.paymentIntentId
  ) {
    throw new Error("Missing paymentIntentId in transaction metadata");
  }
  return stripeClient.refunds.create({
    payment_intent: originalTransaction.metadata.paymentIntentId,
    amount: originalTransaction.amount,
  });
}

/**
 * Add a credit card to Stripe
 * @param {object} cardDetails
 */
async function addCard(cardDetails) {
  const { number, expMonth, expYear, cvc, cardholderName } = cardDetails;
  const token = await stripeClient.tokens.create({
    card: {
      number,
      exp_month: expMonth,
      exp_year: expYear,
      cvc,
      name: cardholderName,
    },
  });
  return {
    providerId: token.card.id,
    last4: token.card.last4,
    brand: token.card.brand,
    expMonth: token.card.exp_month,
    expYear: token.card.exp_year,
  };
}

/**
 * Add a bank account to Stripe
 * @param {object} bankDetails
 */
async function addBankAccount(bankDetails) {
  const { accountNumber, routingNumber, bankName } = bankDetails;
  const token = await stripeClient.tokens.create({
    bank_account: {
      country: "US",
      currency: "usd",
      account_holder_name: bankDetails.accountHolderName || "",
      account_holder_type: "individual",
      routing_number: routingNumber,
      account_number: accountNumber,
    },
  });
  return {
    providerId: token.bank_account.id,
    bankName: token.bank_account.bank_name,
    last4: token.bank_account.last4,
    currency: token.bank_account.currency,
  };
}

/**
 * Remove a payment method in Stripe
 * @param {string} providerId
 */
async function removePaymentMethod(providerId) {
  // Explicitly signal not implemented to avoid false positives
  throw new Error("Stripe removePaymentMethod not implemented for tokenized sources");
}

/**
 * Verify a payment method in Stripe
 * @param {string} providerId
 * @param {object} verificationData
 */
async function verifyPaymentMethod(providerId, verificationData) {
  // Explicitly signal not implemented until full verification flow is wired
  throw new Error("Stripe verifyPaymentMethod not implemented");
}

module.exports = {
  createPaymentIntent,
  confirmPayment,
  processPayment,
  processWithdrawal,
  processRefund,
  addCard,
  addBankAccount,
  removePaymentMethod,
  verifyPaymentMethod,
};
