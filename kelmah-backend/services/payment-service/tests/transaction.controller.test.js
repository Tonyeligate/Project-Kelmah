const createResponse = () => {
  const res = {};
  res.status = jest.fn().mockImplementation((code) => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn().mockImplementation((payload) => {
    res.body = payload;
    return res;
  });
  return res;
};

const buildTransactionDocument = (overrides = {}) => {
  const tx = {
    transactionId: 'TRX_REFUND_1',
    amount: 200,
    currency: 'GHS',
    type: 'refund',
    sender: 'user-1',
    recipient: 'user-2',
    metadata: {},
    gatewayData: {},
    calculateFees: jest.fn().mockResolvedValue(undefined),
    save: jest.fn().mockResolvedValue(undefined),
    updateStatus: jest.fn().mockResolvedValue(undefined),
    markModified: jest.fn(),
    ...overrides,
  };

  tx.save.mockResolvedValue(tx);
  return tx;
};

const mockTransactionModel = jest.fn((data) => buildTransactionDocument(data));
mockTransactionModel.findOne = jest.fn();

jest.mock('../models', () => ({
  Transaction: mockTransactionModel,
  Wallet: { findOneAndUpdate: jest.fn() },
  PaymentMethod: { findById: jest.fn() },
  WebhookEvent: {},
}));

const mockPaystackRefundPayment = jest.fn();
jest.mock('../integrations/paystack', () => {
  return jest.fn().mockImplementation(() => ({
    refundPayment: mockPaystackRefundPayment,
    initializePayment: jest.fn(),
    initiateTransfer: jest.fn(),
    createTransferRecipient: jest.fn(),
  }));
});

const mockMomoRefundPayment = jest.fn();
jest.mock('../integrations/mtn-momo', () => {
  return jest.fn().mockImplementation(() => ({
    refundPayment: mockMomoRefundPayment,
    requestToPay: jest.fn(),
    transfer: jest.fn(),
  }));
});

jest.mock('../integrations/vodafone-cash', () => {
  return jest.fn().mockImplementation(() => ({
    refundPayment: jest.fn(),
    initiatePayment: jest.fn(),
    initiatePayout: jest.fn(),
  }));
});

jest.mock('../integrations/airteltigo', () => {
  return jest.fn().mockImplementation(() => ({
    refundPayment: jest.fn(),
    requestToPay: jest.fn(),
    transfer: jest.fn(),
  }));
});

jest.mock('../services/stripe', () => ({
  processPayment: jest.fn(),
  processWithdrawal: jest.fn(),
  processRefund: jest.fn(),
}));

jest.mock('../services/paypal', () => ({
  processPayment: jest.fn(),
  processWithdrawal: jest.fn(),
  processRefund: jest.fn(),
}));

jest.mock('../utils/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
}));

jest.mock('../utils/controllerUtils', () => ({
  handleError: jest.fn((res, error) => {
    res.status(500).json({ success: false, error: { message: error.message } });
  }),
  getUserId: jest.fn((req) => req.user.id),
}));

describe('transaction refund controller contracts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPaystackRefundPayment.mockResolvedValue({
      success: true,
      data: { refundId: 'rf_123', reference: 'pay_ref_1', status: 'pending' },
    });
    mockMomoRefundPayment.mockResolvedValue({
      success: true,
      data: { referenceId: 'momo_refund_1', status: 'PENDING' },
    });
  });

  test('refund transactions accept relatedTransaction and route Paystack refunds by stored provider reference', async () => {
    const { Transaction, Wallet, PaymentMethod } = require('../models');
    const { createTransaction } = require('../controllers/transaction.controller');

    Transaction.findOne.mockResolvedValue({
      transactionId: 'TRX_ORIGINAL_1',
      paymentMethod: 'payment-method-1',
      currency: 'GHS',
      metadata: {
        paymentProvider: 'paystack',
        paymentProviderTransactionId: 'pay_ref_1',
      },
      gatewayData: {},
    });
    PaymentMethod.findById.mockResolvedValue({
      metadata: { provider: 'paystack' },
    });
    Wallet.findOneAndUpdate
      .mockResolvedValueOnce({ balance: 500 })
      .mockResolvedValueOnce({ balance: 300 });

    const req = {
      user: { id: 'user-1' },
      body: {
        amount: 200,
        currency: 'GHS',
        type: 'refund',
        recipient: 'user-2',
        relatedTransaction: 'TRX_ORIGINAL_1',
        description: 'Customer refund',
      },
    };
    const res = createResponse();

    await createTransaction(req, res);

    expect(mockPaystackRefundPayment).toHaveBeenCalledWith('pay_ref_1', expect.objectContaining({
      amount: 200,
      currency: 'GHS',
    }));
    expect(mockTransactionModel).toHaveBeenCalledWith(expect.objectContaining({
      relatedTransaction: 'TRX_ORIGINAL_1',
      paymentMethod: undefined,
    }));
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });

  test('refund routing supports legacy MTN gatewayData keys when metadata reference is missing', async () => {
    const { Transaction, Wallet, PaymentMethod } = require('../models');
    const { createTransaction } = require('../controllers/transaction.controller');

    Transaction.findOne.mockResolvedValue({
      transactionId: 'TRX_ORIGINAL_2',
      paymentMethod: 'payment-method-2',
      currency: 'GHS',
      metadata: {
        paymentProvider: 'mtn_momo',
      },
      gatewayData: {
        momo: { referenceId: 'mtn_original_ref' },
      },
    });
    PaymentMethod.findById.mockResolvedValue({
      metadata: {
        provider: 'mtn_momo',
        phoneNumber: '0240000000',
      },
    });
    Wallet.findOneAndUpdate
      .mockResolvedValueOnce({ balance: 700 })
      .mockResolvedValueOnce({ balance: 200 });

    const req = {
      user: { id: 'user-1' },
      body: {
        amount: 150,
        currency: 'GHS',
        type: 'refund',
        recipient: 'user-2',
        relatedTransaction: 'TRX_ORIGINAL_2',
        description: 'Return transfer refund',
      },
    };
    const res = createResponse();

    await createTransaction(req, res);

    expect(mockMomoRefundPayment).toHaveBeenCalledWith(expect.objectContaining({
      amount: 150,
      phoneNumber: '0240000000',
      originalReferenceId: 'mtn_original_ref',
    }));
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });
});