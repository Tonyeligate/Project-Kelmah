/**
 * Payment Service Models
 * Exports all models related to the payment system
 */

const Payment = require('./payment.model');
const Escrow = require('./escrow.model');
const Dispute = require('./dispute.model');
const Plan = require('./plan.model');
const Subscription = require('./subscription.model');
const PaymentMethod = require('./payment-method.model');
const Transaction = require('./transaction.model');

// Define model associations
const defineAssociations = () => {
  // Payment associations
  Payment.belongsTo(Transaction, { foreignKey: 'transactionId', as: 'transaction' });
  Payment.belongsTo(Transaction, { foreignKey: 'refundTransactionId', as: 'refundTransaction' });
  Payment.belongsTo(Escrow, { foreignKey: 'escrowId', as: 'escrow' });

  // Escrow associations
  Escrow.hasMany(Payment, { foreignKey: 'escrowId', as: 'payments' });
  Escrow.belongsTo(Transaction, { foreignKey: 'fundingTransactionId', as: 'fundingTransaction' });
  Escrow.belongsTo(Transaction, { foreignKey: 'refundTransactionId', as: 'refundTransaction' });
  Escrow.hasMany(Dispute, { foreignKey: 'escrowId', as: 'disputes' });
  
  // Dispute associations
  Dispute.belongsTo(Escrow, { foreignKey: 'escrowId', as: 'escrow' });
  Dispute.belongsTo(Transaction, { foreignKey: 'transactionId', as: 'transaction' });
  
  // Plan associations
  Plan.hasMany(Subscription, { foreignKey: 'planId', as: 'subscriptions' });
  Plan.belongsTo(Plan, { foreignKey: 'replacedByPlanId', as: 'replacementPlan' });
  
  // Subscription associations
  Subscription.belongsTo(Plan, { foreignKey: 'planId', as: 'plan' });
  Subscription.belongsTo(PaymentMethod, { foreignKey: 'paymentMethodId', as: 'paymentMethod' });
};

module.exports = {
  Payment,
  Escrow,
  Dispute,
  Plan,
  Subscription,
  PaymentMethod,
  Transaction,
  defineAssociations
}; 