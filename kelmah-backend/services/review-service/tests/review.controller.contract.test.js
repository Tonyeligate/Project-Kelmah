const saveMock = jest.fn();

const mockReviewModel = jest.fn(function Review(doc) {
  Object.assign(this, doc);
  this.save = saveMock;
});

mockReviewModel.findOne = jest.fn();
mockReviewModel.find = jest.fn();

const mockJobModel = {
  findById: jest.fn(),
  find: jest.fn(),
};

const mockUserModel = {
  find: jest.fn(),
};

const mockWorkerRatingModel = {
  find: jest.fn(),
};

const mockApplicationModel = {
  findOne: jest.fn(),
  find: jest.fn(),
};

jest.mock('../models', () => ({
  Review: mockReviewModel,
  Job: mockJobModel,
  Application: mockApplicationModel,
  User: mockUserModel,
  WorkerRating: mockWorkerRatingModel,
}));

jest.mock('../utils/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

const reviewController = require('../controllers/review.controller');

const createSelectLeanChain = (value) => ({
  select: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(value),
});

const createSelectSortLeanChain = (value) => ({
  select: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(value),
});

const createPopulateLeanChain = (value) => ({
  populate: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(value),
});

const createResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('review controller contract guards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    saveMock.mockResolvedValue(undefined);
    mockReviewModel.findOne.mockResolvedValue(null);
    mockReviewModel.find.mockReturnValue(createSelectLeanChain([]));
    mockApplicationModel.findOne.mockReturnValue(createSelectLeanChain(null));
    mockApplicationModel.find.mockReturnValue(createPopulateLeanChain([]));
    mockJobModel.find.mockReturnValue(createSelectLeanChain([]));
    mockUserModel.find.mockReturnValue(createSelectLeanChain([]));
    mockWorkerRatingModel.find.mockReturnValue(createSelectLeanChain([]));
  });

  test('submitReview rejects a forged worker target for a completed hirer job', async () => {
    mockJobModel.findById.mockReturnValue(
      createSelectLeanChain({
        _id: 'job-1',
        category: 'Plumbing',
        status: 'completed',
        hirer: 'hirer-1',
        worker: 'worker-real',
      }),
    );

    const req = {
      user: { id: 'hirer-1' },
      body: {
        jobId: 'job-1',
        workerId: 'worker-forged',
        rating: 5,
        comment: 'Excellent work',
      },
    };
    const res = createResponse();

    await reviewController.submitReview(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Review target must match the worker assigned to this completed job',
      }),
    );
    expect(mockReviewModel).not.toHaveBeenCalled();
  });

  test('submitReview persists the assigned worker as the review target for a valid hirer review', async () => {
    mockJobModel.findById.mockReturnValue(
      createSelectLeanChain({
        _id: 'job-1',
        category: 'Plumbing',
        status: 'completed',
        hirer: 'hirer-1',
        worker: 'worker-real',
      }),
    );

    const req = {
      user: { id: 'hirer-1' },
      body: {
        jobId: 'job-1',
        workerId: 'worker-real',
        rating: 5,
        comment: 'Excellent work',
      },
    };
    const res = createResponse();

    await reviewController.submitReview(req, res);

    expect(mockReviewModel).toHaveBeenCalledWith(
      expect.objectContaining({
        job: 'job-1',
        reviewer: 'hirer-1',
        reviewee: 'worker-real',
        rating: 5,
        comment: 'Excellent work',
      }),
    );
    expect(saveMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('checkEligibility uses completed assigned jobs for review eligibility', async () => {
    mockJobModel.find.mockReturnValue(
      createSelectLeanChain([
        { _id: 'job-9', title: 'Kitchen remodel' },
      ]),
    );
    mockReviewModel.find.mockReturnValue(createSelectLeanChain([]));

    const req = {
      user: { id: 'hirer-1' },
      params: { workerId: 'worker-9' },
      query: {},
    };
    const res = createResponse();

    await reviewController.checkEligibility(req, res);

    expect(mockJobModel.find).toHaveBeenCalledWith(
      expect.objectContaining({
        hirer: 'hirer-1',
        worker: 'worker-9',
        status: 'completed',
      }),
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          canReview: true,
          eligibleJobs: [
            expect.objectContaining({ jobId: 'job-9', title: 'Kitchen remodel' }),
          ],
        }),
      }),
    );
  });

  test('getHirerReviewCandidates groups completed jobs by worker and includes existing review state', async () => {
    mockJobModel.find.mockReturnValue(
      createSelectSortLeanChain([
        {
          _id: 'job-1',
          title: 'Kitchen remodel',
          budget: 1500,
          duration: { value: 2, unit: 'week' },
          completedDate: '2026-03-01T00:00:00.000Z',
          worker: 'worker-9',
        },
        {
          _id: 'job-2',
          title: 'Bathroom retile',
          budget: 900,
          duration: { value: 5, unit: 'day' },
          completedDate: '2026-02-20T00:00:00.000Z',
          worker: null,
        },
      ]),
    );

    mockApplicationModel.find.mockReturnValue(
      createSelectLeanChain([
        { job: 'job-2', worker: 'worker-10' },
      ]),
    );

    mockUserModel.find.mockReturnValue(
      createSelectLeanChain([
        {
          _id: 'worker-9',
          firstName: 'Ama',
          lastName: 'Osei',
          profilePicture: 'ama.png',
          skills: ['Tiling'],
          location: 'Accra',
          profession: 'Tiler',
        },
        {
          _id: 'worker-10',
          firstName: 'Kojo',
          lastName: 'Mensah',
          profileImage: 'kojo.png',
          skills: ['Plumbing'],
          location: 'Tema',
          profession: 'Plumber',
        },
      ]),
    );

    mockWorkerRatingModel.find.mockReturnValue(
      createSelectLeanChain([
        { workerId: 'worker-9', averageRating: 4.8, totalReviews: 12 },
      ]),
    );

    mockReviewModel.find.mockReturnValue(createSelectLeanChain([
      {
        _id: 'review-1',
        job: 'job-1',
        reviewee: 'worker-9',
        rating: 5,
        comment: 'Excellent work',
        createdAt: '2026-03-02T00:00:00.000Z',
      },
    ]));

    const req = {
      user: { id: 'hirer-1' },
    };
    const res = createResponse();

    await reviewController.getHirerReviewCandidates(req, res);

    expect(mockJobModel.find).toHaveBeenCalledWith({ hirer: 'hirer-1', status: 'completed' });
    expect(mockApplicationModel.find).toHaveBeenCalledWith({
      job: { $in: ['job-2'] },
      status: 'accepted',
    });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: [
          expect.objectContaining({
            id: 'worker-9',
            name: 'Ama Osei',
            overallRating: 4.8,
            completedJobs: [
              expect.objectContaining({
                id: 'job-1',
                title: 'Kitchen remodel',
                duration: '2 weeks',
                review: expect.objectContaining({
                  id: 'review-1',
                  rating: 5,
                  comment: 'Excellent work',
                }),
              }),
            ],
          }),
          expect.objectContaining({
            id: 'worker-10',
            name: 'Kojo Mensah',
            completedJobs: [
              expect.objectContaining({
                id: 'job-2',
                title: 'Bathroom retile',
                duration: '5 days',
                review: null,
              }),
            ],
          }),
        ],
      }),
    );
  });
});