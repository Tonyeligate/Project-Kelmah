/**
 * Payment Service Models Index - Uses Shared Models
 * Updated to use centralized shared models instead of local duplicates
 */

// Import from shared models
const { User, Job, Application } = require('../../../shared/models');

// Import service-specific models
const Transaction = require('./Transaction');
const Wallet = require('./Wallet');
const PaymentMethod = require('./PaymentMethod');
const Escrow = require('./Escrow');
const Bill = require('./Bill');
const WebhookEvent = require('./WebhookEvent');
const IdempotencyKey = require('./IdempotencyKey');
const PayoutQueue = require('./PayoutQueue');

// Export all models
module.exports = {
  // Shared models
  User,
  Job,
  Application,

  // Service-specific models
  Transaction,
  Wallet,
  PaymentMethod,
  Escrow,
  Bill,
  WebhookEvent,
  IdempotencyKey,
  PayoutQueue
};