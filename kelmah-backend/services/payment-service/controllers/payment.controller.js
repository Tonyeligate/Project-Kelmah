/**
 * Payment Controller
 * Unified payment processing for all Ghanaian payment methods
 */

const MTNMoMoService = require('../integrations/mtn-momo');
const VodafoneCashService = require('../integrations/vodafone-cash');
const PaystackService = require('../integrations/paystack');
const { Payment, Transaction, Wallet, Escrow } = require('../models');
const { notifyPaymentEvent } = require('../utils/notifier');
const { v4: uuidv4 } = require('uuid');
const auditLogger = require('../../../shared/utils/audit-logger');

class PaymentController {
  constructor() {
    this.mtnMomo = new MTNMoMoService();
    this.vodafoneCash = new VodafoneCashService();
    this.paystack = new PaystackService();
  }

  /**
   * Initialize payment based on method
   */
  async initializePayment(req, res) {
    try {
      const {
        amount,
        currency = 'GHS',
        method, // 'mtn_momo', 'vodafone_cash', 'airtel_tigo', 'paystack_card', 'paystack_bank'
        phoneNumber,
        email,
        description,
        metadata = {}
      } = req.body;

      const userId = req.user.id;
      const paymentId = uuidv4();

      // Validate required fields
      if (!amount || !method) {
        return res.status(400).json({
          success: false,
          message: 'Amount and payment method are required',
          code: 'MISSING_REQUIRED_FIELDS'
        });
      }

      // Validate amount
      if (amount <= 0 || amount > 100000) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment amount',
          code: 'INVALID_AMOUNT'
        });
      }

      // Create payment record
      const payment = await Payment.create({
        id: paymentId,
        userId,
        amount: parseFloat(amount),
        currency: currency.toUpperCase(),
        method,
        status: 'PENDING',
        description,
        metadata: {
          ...metadata,
          phoneNumber: phoneNumber ? this.formatPhoneNumber(phoneNumber) : null,
          email,
          source: 'kelmah-platform'
        }
      });

      let result;

      // Route to appropriate payment provider
      switch (method) {
        case 'mtn_momo':
          if (!phoneNumber) {
            return res.status(400).json({
              success: false,
              message: 'Phone number is required for MTN Mobile Money',
              code: 'PHONE_REQUIRED'
            });
          }

          result = await this.mtnMomo.requestToPay({
            amount,
            phoneNumber,
            externalId: paymentId,
            payerMessage: description || 'Kelmah platform payment',
            payeeNote: `Payment for user ${userId}`
          });
          break;

        case 'vodafone_cash':
          if (!phoneNumber) {
            return res.status(400).json({
              success: false,
              message: 'Phone number is required for Vodafone Cash',
              code: 'PHONE_REQUIRED'
            });
          }

          result = await this.vodafoneCash.initiatePayment({
            amount,
            phoneNumber,
            externalId: paymentId,
            description: description || 'Kelmah platform payment'
          });
          break;

        case 'paystack_card':
        case 'paystack_bank':
        case 'paystack_transfer':
          if (!email) {
            return res.status(400).json({
              success: false,
              message: 'Email is required for Paystack payments',
              code: 'EMAIL_REQUIRED'
            });
          }

          const channels = this.getPaystackChannels(method);
          result = await this.paystack.initializePayment({
            email,
            amount,
            currency,
            reference: paymentId,
            callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
            metadata: {
              userId,
              paymentId,
              ...metadata
            },
            channels
          });
          break;

        default:
          return res.status(400).json({
            success: false,
            message: 'Unsupported payment method',
            code: 'UNSUPPORTED_METHOD'
          });
      }

      if (!result.success) {
        // Update payment status to failed
        await payment.update({
          status: 'FAILED',
          failureReason: result.error.message || 'Payment initialization failed',
          providerResponse: result.error
        });

        return res.status(400).json({
          success: false,
          message: 'Payment initialization failed',
          error: result.error,
          code: 'PAYMENT_INIT_FAILED'
        });
      }

      // Update payment with provider response
      await payment.update({
        providerTransactionId: result.data.referenceId || result.data.paymentId,
        providerResponse: result.data,
        status: 'INITIALIZED'
      });

      // Log payment initiation
      await auditLogger.log({
        userId,
        action: 'PAYMENT_INITIALIZED',
        details: {
          paymentId,
          amount,
          method,
          provider: this.getProviderName(method)
        }
      });

      // Notify user
      notifyPaymentEvent(userId, 'payment_init', 'Payment Initiated', `Your payment of ${amount} ${currency} is being processed.`, { paymentId, method });

      res.status(200).json({
        success: true,
        message: 'Payment initialized successfully',
        data: {
          paymentId,
          method,
          amount,
          currency,
          status: 'INITIALIZED',
          ...result.data
        }
      });

    } catch (error) {
      console.error('Initialize Payment Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Payment service error',
        code: 'PAYMENT_SERVICE_ERROR'
      });
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(req, res) {
    try {
      const { paymentId } = req.params;
      const userId = req.user.id;

      // Find payment record
      const payment = await Payment.findOne({
        where: { id: paymentId, userId }
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found',
          code: 'PAYMENT_NOT_FOUND'
        });
      }

      let statusResult;
      const providerTxnId = payment.providerTransactionId;

      // Check status with appropriate provider
      switch (payment.method) {
        case 'mtn_momo':
          statusResult = await this.mtnMomo.getTransactionStatus(providerTxnId);
          break;

        case 'vodafone_cash':
          statusResult = await this.vodafoneCash.getPaymentStatus(providerTxnId);
          break;

        case 'paystack_card':
        case 'paystack_bank':
        case 'paystack_transfer':
          statusResult = await this.paystack.verifyPayment(providerTxnId);
          break;

        default:
          return res.status(400).json({
            success: false,
            message: 'Unsupported payment method for status check',
            code: 'UNSUPPORTED_METHOD'
          });
      }

      if (statusResult.success) {
        // Update payment status
        const newStatus = this.normalizePaymentStatus(statusResult.data.status);
        
        if (payment.status !== newStatus) {
          await payment.update({
            status: newStatus,
            providerResponse: statusResult.data,
            completedAt: newStatus === 'COMPLETED' ? new Date() : null
          });

          // Create transaction record for successful payments
          if (newStatus === 'COMPLETED') {
            await this.createTransactionRecord(payment, statusResult.data);
            // Notify user on completion
            notifyPaymentEvent(userId, 'payment_success', 'Payment Successful', `Your payment of ${payment.amount} ${payment.currency} was successful.`, { paymentId: payment.id });
          }

          // Log status change
          await auditLogger.log({
            userId,
            action: 'PAYMENT_STATUS_UPDATED',
            details: {
              paymentId,
              oldStatus: payment.status,
              newStatus,
              provider: this.getProviderName(payment.method)
            }
          });
        }
      }

      res.status(200).json({
        success: true,
        message: 'Payment status retrieved successfully',
        data: {
          paymentId: payment.id,
          status: payment.status,
          amount: payment.amount,
          currency: payment.currency,
          method: payment.method,
          createdAt: payment.createdAt,
          completedAt: payment.completedAt,
          description: payment.description,
          providerData: statusResult.success ? statusResult.data : null
        }
      });

    } catch (error) {
      console.error('Check Payment Status Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to check payment status',
        code: 'STATUS_CHECK_ERROR'
      });
    }
  }

  /**
   * Process payout/withdrawal
   */
  async processPayout(req, res) {
    try {
      const {
        amount,
        method,
        phoneNumber,
        bankCode,
        accountNumber,
        accountName,
        description,
        metadata = {}
      } = req.body;

      const userId = req.user.id;
      const payoutId = uuidv4();

      // Validate amount
      if (amount <= 0 || amount > 50000) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payout amount',
          code: 'INVALID_AMOUNT'
        });
      }

      // Check user wallet balance
      const wallet = await Wallet.findOne({ where: { userId } });
      if (!wallet || wallet.balance < amount) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient wallet balance',
          code: 'INSUFFICIENT_BALANCE'
        });
      }

      // Create payout record
      const payout = await Payment.create({
        id: payoutId,
        userId,
        amount: parseFloat(amount),
        currency: 'GHS',
        method,
        type: 'PAYOUT',
        status: 'PENDING',
        description,
        metadata: {
          ...metadata,
          phoneNumber: phoneNumber ? this.formatPhoneNumber(phoneNumber) : null,
          bankCode,
          accountNumber,
          accountName
        }
      });

      let result;

      // Route to appropriate provider
      switch (method) {
        case 'mtn_momo':
          if (!phoneNumber) {
            return res.status(400).json({
              success: false,
              message: 'Phone number is required for MTN Mobile Money payout',
              code: 'PHONE_REQUIRED'
            });
          }

          result = await this.mtnMomo.transfer({
            amount,
            phoneNumber,
            externalId: payoutId,
            payerMessage: description || 'Kelmah platform payout',
            payeeNote: `Payout to user ${userId}`
          });
          break;

        case 'vodafone_cash':
          if (!phoneNumber) {
            return res.status(400).json({
              success: false,
              message: 'Phone number is required for Vodafone Cash payout',
              code: 'PHONE_REQUIRED'
            });
          }

          result = await this.vodafoneCash.initiatePayout({
            amount,
            phoneNumber,
            externalId: payoutId,
            description: description || 'Kelmah platform payout'
          });
          break;

        case 'paystack_bank':
          if (!bankCode || !accountNumber) {
            return res.status(400).json({
              success: false,
              message: 'Bank code and account number are required',
              code: 'BANK_DETAILS_REQUIRED'
            });
          }

          // Create transfer recipient first
          const recipientResult = await this.paystack.createTransferRecipient({
            name: accountName || 'Kelmah User',
            account_number: accountNumber,
            bank_code: bankCode
          });

          if (!recipientResult.success) {
            return res.status(400).json({
              success: false,
              message: 'Failed to create transfer recipient',
              error: recipientResult.error
            });
          }

          // Initiate transfer
          result = await this.paystack.initiateTransfer({
            amount,
            recipient: recipientResult.data.recipient_code,
            reason: description || 'Kelmah platform payout',
            reference: payoutId
          });
          break;

        default:
          return res.status(400).json({
            success: false,
            message: 'Unsupported payout method',
            code: 'UNSUPPORTED_METHOD'
          });
      }

      if (!result.success) {
        await payout.update({
          status: 'FAILED',
          failureReason: result.error.message || 'Payout initialization failed',
          providerResponse: result.error
        });

        return res.status(400).json({
          success: false,
          message: 'Payout initialization failed',
          error: result.error,
          code: 'PAYOUT_INIT_FAILED'
        });
      }

      // Update payout with provider response
      await payout.update({
        providerTransactionId: result.data.referenceId || result.data.payoutId || result.data.transfer_code,
        providerResponse: result.data,
        status: 'PROCESSING'
      });

      // Deduct from wallet (pending final confirmation)
      await wallet.update({
        balance: wallet.balance - amount,
        pendingWithdrawals: (wallet.pendingWithdrawals || 0) + amount
      });

      // Create transaction record
      await Transaction.create({
        walletId: wallet.id,
        type: 'WITHDRAWAL',
        amount: -amount,
        description: description || 'Payout request',
        referenceId: payoutId,
        status: 'PENDING'
      });

      // Log payout initiation
      await auditLogger.log({
        userId,
        action: 'PAYOUT_INITIATED',
        details: {
          payoutId,
          amount,
          method,
          provider: this.getProviderName(method)
        }
      });

      // Notify user for payout request
      notifyPaymentEvent(userId, 'payout_init', 'Payout Requested', `Your payout of ${amount} GHS has been initiated.`, { payoutId });

      res.status(200).json({
        success: true,
        message: 'Payout initiated successfully',
        data: {
          payoutId,
          method,
          amount,
          status: 'PROCESSING',
          ...result.data
        }
      });

    } catch (error) {
      console.error('Process Payout Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Payout service error',
        code: 'PAYOUT_SERVICE_ERROR'
      });
    }
  }

  /**
   * Get payment history for user
   */
  async getPaymentHistory(req, res) {
    try {
      const userId = req.user.id;
      const {
        page = 1,
        limit = 20,
        type = 'all', // 'payment', 'payout', 'all'
        status,
        method,
        startDate,
        endDate
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = { userId };

      // Filter by type
      if (type !== 'all') {
        whereClause.type = type.toUpperCase();
      }

      // Filter by status
      if (status) {
        whereClause.status = status.toUpperCase();
      }

      // Filter by method
      if (method) {
        whereClause.method = method;
      }

      // Date range filter
      if (startDate && endDate) {
        whereClause.createdAt = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      const { count, rows: payments } = await Payment.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset,
        order: [['createdAt', 'DESC']]
      });

      const paymentHistory = payments.map(payment => ({
        id: payment.id,
        type: payment.type || 'PAYMENT',
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        status: payment.status,
        description: payment.description,
        createdAt: payment.createdAt,
        completedAt: payment.completedAt,
        failureReason: payment.failureReason
      }));

      res.status(200).json({
        success: true,
        message: 'Payment history retrieved successfully',
        data: {
          payments: paymentHistory,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      });

    } catch (error) {
      console.error('Get Payment History Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve payment history',
        code: 'HISTORY_RETRIEVAL_ERROR'
      });
    }
  }

  /**
   * Get supported payment methods
   */
  async getPaymentMethods(req, res) {
    try {
      const methods = [
        {
          id: 'mtn_momo',
          name: 'MTN Mobile Money',
          type: 'mobile_money',
          logo: '/images/payment-methods/mtn-momo.png',
          supported_currencies: ['GHS'],
          requires: ['phone_number'],
          min_amount: 1,
          max_amount: 10000,
          fees: {
            percentage: 1.5,
            fixed: 0
          }
        },
        {
          id: 'vodafone_cash',
          name: 'Vodafone Cash',
          type: 'mobile_money',
          logo: '/images/payment-methods/vodafone-cash.png',
          supported_currencies: ['GHS'],
          requires: ['phone_number'],
          min_amount: 1,
          max_amount: 10000,
          fees: {
            percentage: 1.5,
            fixed: 0
          }
        },
        {
          id: 'paystack_card',
          name: 'Credit/Debit Card',
          type: 'card',
          logo: '/images/payment-methods/card.png',
          supported_currencies: ['GHS', 'USD', 'EUR'],
          requires: ['email'],
          min_amount: 1,
          max_amount: 100000,
          fees: {
            percentage: 2.9,
            fixed: 0
          }
        },
        {
          id: 'paystack_bank',
          name: 'Bank Transfer',
          type: 'bank_transfer',
          logo: '/images/payment-methods/bank.png',
          supported_currencies: ['GHS'],
          requires: ['email'],
          min_amount: 10,
          max_amount: 100000,
          fees: {
            percentage: 1.5,
            fixed: 50
          }
        }
      ];

      // Check service health
      const healthChecks = await Promise.all([
        this.mtnMomo.healthCheck(),
        this.vodafoneCash.healthCheck(),
        this.paystack.healthCheck()
      ]);

      // Update method availability based on health
      methods.forEach(method => {
        if (method.id.includes('mtn')) {
          method.available = healthChecks[0].success;
        } else if (method.id.includes('vodafone')) {
          method.available = healthChecks[1].success;
        } else if (method.id.includes('paystack')) {
          method.available = healthChecks[2].success;
        }
      });

      res.status(200).json({
        success: true,
        message: 'Payment methods retrieved successfully',
        data: {
          methods,
          service_status: {
            mtn_momo: healthChecks[0].status,
            vodafone_cash: healthChecks[1].status,
            paystack: healthChecks[2].status
          }
        }
      });

    } catch (error) {
      console.error('Get Payment Methods Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve payment methods',
        code: 'METHODS_RETRIEVAL_ERROR'
      });
    }
  }

  // Helper methods

  formatPhoneNumber(phoneNumber) {
    let cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '233' + cleaned.substring(1);
    }
    if (!cleaned.startsWith('233')) {
      cleaned = '233' + cleaned;
    }
    return cleaned;
  }

  getPaystackChannels(method) {
    switch (method) {
      case 'paystack_card':
        return ['card'];
      case 'paystack_bank':
        return ['bank', 'bank_transfer'];
      case 'paystack_transfer':
        return ['bank_transfer'];
      default:
        return ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'];
    }
  }

  getProviderName(method) {
    if (method.includes('mtn')) return 'MTN Mobile Money';
    if (method.includes('vodafone')) return 'Vodafone Cash';
    if (method.includes('paystack')) return 'Paystack';
    return 'Unknown';
  }

  normalizePaymentStatus(providerStatus) {
    const statusMap = {
      'SUCCESSFUL': 'COMPLETED',
      'SUCCESS': 'COMPLETED',
      'COMPLETED': 'COMPLETED',
      'FAILED': 'FAILED',
      'FAILURE': 'FAILED',
      'PENDING': 'PENDING',
      'PROCESSING': 'PROCESSING',
      'CANCELLED': 'CANCELLED',
      'TIMEOUT': 'FAILED'
    };

    return statusMap[providerStatus?.toUpperCase()] || 'PENDING';
  }

  async createTransactionRecord(payment, providerData) {
    try {
      // Find or create wallet
      let wallet = await Wallet.findOne({ where: { userId: payment.userId } });
      if (!wallet) {
        wallet = await Wallet.create({
          userId: payment.userId,
          balance: 0,
          currency: payment.currency
        });
      }

      // Update wallet balance for successful payments
      if (payment.type !== 'PAYOUT') {
        await wallet.update({
          balance: wallet.balance + payment.amount
        });
      }

      // Create transaction record
      await Transaction.create({
        walletId: wallet.id,
        type: payment.type === 'PAYOUT' ? 'WITHDRAWAL' : 'DEPOSIT',
        amount: payment.type === 'PAYOUT' ? -payment.amount : payment.amount,
        description: payment.description || `${payment.method} ${payment.type || 'payment'}`,
        referenceId: payment.id,
        status: 'COMPLETED',
        metadata: {
          paymentMethod: payment.method,
          providerTransactionId: payment.providerTransactionId,
          providerData
        }
      });

    } catch (error) {
      console.error('Create Transaction Record Error:', error);
    }
  }
}

module.exports = new PaymentController();