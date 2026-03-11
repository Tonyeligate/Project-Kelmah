jest.mock('mongoose', () => ({
  startSession: jest.fn(),
}));

jest.mock('../models', () => ({
  Escrow: {
    findById: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
  Wallet: {
    findOneAndUpdate: jest.fn(),
  },
  Transaction: jest.fn(),
  User: {},
}));

const mongoose = require('mongoose');
const { createMockResponse } = require('../../../shared/test-utils');
const { Escrow, Wallet, Transaction } = require('../models');
const escrowController = require('../controllers/escrow.controller');

const createSession = () => ({
  startTransaction: jest.fn(),
  commitTransaction: jest.fn().mockResolvedValue(),
  abortTransaction: jest.fn().mockResolvedValue(),
  endSession: jest.fn(),
});

const createEscrowDoc = (overrides = {}) => ({
  _id: overrides._id || 'escrow-1',
  amount: overrides.amount ?? 250,
  currency: overrides.currency || 'GHS',
  provider: overrides.provider || 'paystack',
  contractId: overrides.contractId || 'contract-1',
  jobId: overrides.jobId || 'job-1',
  hirerId: overrides.hirerId || 'hirer-1',
  workerId: overrides.workerId || 'worker-1',
  status: overrides.status || 'active',
  transactions: overrides.transactions || [],
  milestones: overrides.milestones || [],
  save: jest.fn().mockResolvedValue(),
  ...overrides,
});

describe('escrow controller hardening', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('refundEscrow credits the hirer wallet inside the transaction session', async () => {
    const res = createMockResponse();
    const next = jest.fn();
    const session = createSession();
    const lockedEscrow = createEscrowDoc();

    mongoose.startSession.mockResolvedValue(session);
    Escrow.findById.mockReturnValue({
      session: jest.fn().mockResolvedValue(createEscrowDoc()),
    });
    Escrow.findOneAndUpdate.mockResolvedValue(lockedEscrow);
    Wallet.findOneAndUpdate.mockResolvedValue({ _id: 'wallet-1' });
    Transaction.mockImplementation(() => ({
      save: jest.fn().mockResolvedValue({ _id: 'tx-refund-1' }),
    }));

    await escrowController.refundEscrow({
      params: { escrowId: 'escrow-1' },
      user: { id: 'hirer-1', role: 'hirer' },
    }, res, next);

    expect(session.startTransaction).toHaveBeenCalled();
    expect(Escrow.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'escrow-1', status: { $in: ['active', 'disputed'] } },
      { $set: { status: 'refunding' } },
      { new: true, session },
    );
    expect(Wallet.findOneAndUpdate).toHaveBeenCalledWith(
      { user: 'hirer-1' },
      expect.objectContaining({
        $inc: { balance: 250 },
        $push: expect.objectContaining({
          transactionHistory: expect.objectContaining({
            transaction: 'tx-refund-1',
            type: 'credit',
            amount: 250,
            timestamp: expect.any(Date),
          }),
        }),
      }),
      { new: true, session },
    );
    expect(lockedEscrow.status).toBe('refunded');
    expect(lockedEscrow.transactions).toContain('tx-refund-1');
    expect(lockedEscrow.save).toHaveBeenCalledWith({ session });
    expect(session.commitTransaction).toHaveBeenCalled();
    expect(session.abortTransaction).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ success: true }));
    expect(next).not.toHaveBeenCalled();
  });

  test('refundEscrow aborts when the hirer wallet cannot be credited', async () => {
    const res = createMockResponse();
    const next = jest.fn();
    const session = createSession();
    const lockedEscrow = createEscrowDoc();

    mongoose.startSession.mockResolvedValue(session);
    Escrow.findById.mockReturnValue({
      session: jest.fn().mockResolvedValue(createEscrowDoc()),
    });
    Escrow.findOneAndUpdate.mockResolvedValue(lockedEscrow);
    Wallet.findOneAndUpdate.mockResolvedValue(null);
    Transaction.mockImplementation(() => ({
      save: jest.fn().mockResolvedValue({ _id: 'tx-refund-2' }),
    }));

    await escrowController.refundEscrow({
      params: { escrowId: 'escrow-1' },
      user: { id: 'hirer-1', role: 'hirer' },
    }, res, next);

    expect(session.abortTransaction).toHaveBeenCalled();
    expect(session.commitTransaction).not.toHaveBeenCalled();
    expect(lockedEscrow.save).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual(expect.objectContaining({ success: false }));
    expect(next).not.toHaveBeenCalled();
  });

  test('releaseMilestonePayment credits worker earnings inside the transaction session', async () => {
    const res = createMockResponse();
    const next = jest.fn();
    const session = createSession();
    const atomicEscrow = createEscrowDoc({
      milestones: [
        {
          milestoneId: 'milestone-1',
          amount: 125,
          description: 'Phase 1',
          status: 'released',
          releasedDate: new Date(),
        },
      ],
    });

    mongoose.startSession.mockResolvedValue(session);
    Escrow.findById.mockReturnValue({
      session: jest.fn().mockResolvedValue(createEscrowDoc({
        milestones: [
          {
            milestoneId: 'milestone-1',
            amount: 125,
            description: 'Phase 1',
            status: 'pending',
          },
        ],
      })),
    });
    Escrow.findOneAndUpdate.mockResolvedValue(atomicEscrow);
    Wallet.findOneAndUpdate.mockResolvedValue({ _id: 'wallet-2' });
    Transaction.mockImplementation(() => ({
      save: jest.fn().mockResolvedValue({ _id: 'tx-milestone-1' }),
    }));

    await escrowController.releaseMilestonePayment({
      params: { escrowId: 'escrow-1', milestoneId: 'milestone-1' },
      user: { id: 'hirer-1', role: 'hirer' },
    }, res, next);

    expect(Escrow.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: 'escrow-1',
        milestones: {
          $elemMatch: {
            milestoneId: 'milestone-1',
            status: { $ne: 'released' },
          },
        },
      },
      {
        $set: {
          'milestones.$.status': 'released',
          'milestones.$.releasedDate': expect.any(Date),
        },
      },
      { new: true, session },
    );
    expect(Wallet.findOneAndUpdate).toHaveBeenCalledWith(
      { user: 'worker-1' },
      expect.objectContaining({
        $inc: expect.objectContaining({
          balance: 125,
          'metadata.totalEarnings': 125,
        }),
      }),
      { new: true, session },
    );
    expect(atomicEscrow.status).toBe('released');
    expect(atomicEscrow.transactions).toContain('tx-milestone-1');
    expect(atomicEscrow.save).toHaveBeenCalledWith({ session });
    expect(session.commitTransaction).toHaveBeenCalled();
    expect(session.abortTransaction).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(res.body?.data).toEqual(expect.objectContaining({
      escrowId: 'escrow-1',
      milestoneId: 'milestone-1',
      amount: 125,
      transactionId: 'tx-milestone-1',
      escrowStatus: 'released',
    }));
    expect(next).not.toHaveBeenCalled();
  });
});