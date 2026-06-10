jest.mock('../models', () => ({
  Wallet: {
    findOneAndUpdate: jest.fn(),
    findOne: jest.fn(),
  },
  Transaction: {
    create: jest.fn(),
  },
  PaymentMethod: {},
  User: {},
}));

jest.mock('../utils/validation', () => ({
  validateWallet: jest.fn(() => ({ error: null })),
}));

const { createMockResponse } = require('../../../shared/test-utils');
const { Wallet, Transaction } = require('../models');
const { validateWallet } = require('../utils/validation');
const walletController = require('../controllers/wallet.controller');

describe('wallet controller hardening', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('createOrUpdateWallet upserts with validators and defaults', async () => {
    const res = createMockResponse();
    const paymentMethods = [
      {
        type: 'paypal',
        details: { email: 'worker@example.com' },
      },
    ];

    Wallet.findOneAndUpdate.mockResolvedValue({
      _id: 'wallet-1',
      user: 'user-1',
      currency: 'GHS',
      paymentMethods,
    });

    await walletController.createOrUpdateWallet({
      user: { id: 'user-1' },
      body: {
        currency: 'GHS',
        paymentMethods,
      },
    }, res);

    expect(validateWallet).toHaveBeenCalledWith({
      currency: 'GHS',
      paymentMethods,
    });
    expect(Wallet.findOneAndUpdate).toHaveBeenCalledWith(
      { user: 'user-1' },
      {
        $setOnInsert: { user: 'user-1' },
        $set: {
          currency: 'GHS',
          paymentMethods,
        },
      },
      expect.objectContaining({
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }),
    );
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ success: true }));
  });

  test('withdraw uses an atomic balance deduction query', async () => {
    const res = createMockResponse();

    Wallet.findOneAndUpdate.mockResolvedValue({
      _id: 'wallet-1',
      balance: 25,
      status: 'active',
    });
    Transaction.create.mockResolvedValue({ _id: 'tx-1' });

    await walletController.withdraw({
      user: { id: 'user-1' },
      body: {
        amount: 50,
        reference: 'withdraw-ref-1',
      },
    }, res);

    expect(Wallet.findOneAndUpdate).toHaveBeenCalledWith(
      {
        user: 'user-1',
        status: 'active',
        balance: { $gte: 50 },
      },
      { $inc: { balance: -50 } },
      { new: true },
    );
    expect(Transaction.create).toHaveBeenCalledWith(expect.objectContaining({
      sender: 'user-1',
      recipient: 'user-1',
      amount: 50,
      type: 'withdrawal',
      status: 'completed',
      reference: 'withdraw-ref-1',
    }));
    expect(res.statusCode).toBe(200);
    expect(res.body?.data).toEqual(expect.objectContaining({ balance: 25, transaction: 'tx-1' }));
  });
});