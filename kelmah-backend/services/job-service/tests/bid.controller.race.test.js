jest.mock('../models', () => ({
  Bid: {
    countDocuments: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
  Job: {
    findById: jest.fn(),
  },
  UserPerformance: {},
}));

jest.mock('../services/serviceClient', () => ({
  messaging: {
    sendBidNotification: jest.fn(() => Promise.resolve()),
  },
}));

const { createMockResponse } = require('../../../shared/test-utils');
const models = require('../models');
const bidController = require('../controllers/bid.controller');

describe('bid controller reject race regression', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('rejectBid does not overwrite a bid that was accepted concurrently', async () => {
    models.Bid.findById
      .mockReturnValueOnce({
        populate: jest.fn().mockResolvedValue({
          _id: 'bid-1',
          worker: { toString: () => 'worker-1' },
          job: {
            _id: 'job-1',
            title: 'House Wiring',
            hirer: { toString: () => 'hirer-1' },
          },
          status: 'pending',
        }),
      })
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ status: 'accepted' }),
        }),
      });

    models.Bid.findOneAndUpdate.mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });

    const req = {
      params: { bidId: '507f1f77bcf86cd799439011' },
      body: { hirerNotes: 'Too expensive' },
      user: { id: 'hirer-1', role: 'hirer' },
    };
    const res = createMockResponse();
    const next = jest.fn();

    await bidController.rejectBid(req, res, next);

    expect(models.Bid.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: '507f1f77bcf86cd799439011', status: 'pending' },
      expect.objectContaining({
        $set: expect.objectContaining({
          status: 'rejected',
          hirerNotes: 'Too expensive',
        }),
      }),
      { new: true },
    );
    expect(res.statusCode).toBe(409);
    expect(res.body).toEqual(expect.objectContaining({
      success: false,
      message: 'Bid is no longer pending',
    }));
    expect(next).not.toHaveBeenCalled();
  });

  test('getJobBids caps oversized requested limits at 50', async () => {
    const bidQuery = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    };

    models.Job.findById.mockResolvedValue({
      hirer: { toString: () => 'hirer-1' },
    });
    models.Bid.countDocuments.mockResolvedValue(0);
    models.Bid.find.mockReturnValue(bidQuery);

    const req = {
      params: { jobId: '507f1f77bcf86cd799439011' },
      query: { page: '1', limit: '100000' },
      user: { id: 'hirer-1', role: 'hirer' },
    };
    const res = createMockResponse();
    const next = jest.fn();

    await bidController.getJobBids(req, res, next);

    expect(bidQuery.limit).toHaveBeenCalledWith(50);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.pagination.limit).toBe(50);
    expect(next).not.toHaveBeenCalled();
  });

  test('getWorkerBids caps oversized requested limits at 50', async () => {
    const bidQuery = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    };

    models.Bid.countDocuments.mockResolvedValue(0);
    models.Bid.find.mockReturnValue(bidQuery);

    const req = {
      params: { workerId: '507f1f77bcf86cd799439011' },
      query: { page: '1', limit: '999' },
      user: { id: '507f1f77bcf86cd799439011', role: 'worker' },
    };
    const res = createMockResponse();
    const next = jest.fn();

    await bidController.getWorkerBids(req, res, next);

    expect(bidQuery.limit).toHaveBeenCalledWith(50);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.pagination.limit).toBe(50);
    expect(next).not.toHaveBeenCalled();
  });
});