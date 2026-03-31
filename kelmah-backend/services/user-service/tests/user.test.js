/**
 * User service response utility tests
 */

const {
  successResponse,
  errorResponse,
  validationErrorResponse,
  paginatedResponse,
} = require('../utils/response');

const createMockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('user-service response utilities', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  test('successResponse returns canonical success envelope with meta', () => {
    const res = createMockResponse();

    successResponse(res, 201, 'Created', { id: 'user-1' }, { requestId: 'req-1' });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Created',
      data: { id: 'user-1' },
      meta: { requestId: 'req-1' },
    });
  });

  test('errorResponse omits internal details in production mode', () => {
    const res = createMockResponse();
    process.env = { ...originalEnv, NODE_ENV: 'production' };

    errorResponse(res, 500, 'Internal Server Error', { stack: 'secret' });

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { message: 'Internal Server Error' },
    });
  });

  test('validationErrorResponse normalizes string errors to array details', () => {
    const res = createMockResponse();

    validationErrorResponse(res, 'timezone is required');

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'Validation failed',
        details: ['timezone is required'],
      },
    });
  });

  test('paginatedResponse returns normalized pagination in data and meta', () => {
    const res = createMockResponse();

    paginatedResponse(
      res,
      [{ id: 'w-1' }],
      { page: '2', limit: '20', total: 45 },
      'Workers fetched',
      { summary: { active: 1 } },
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: 'Workers fetched',
        data: expect.objectContaining({
          items: [{ id: 'w-1' }],
          summary: { active: 1 },
          pagination: {
            page: 2,
            limit: 20,
            total: 45,
            pages: 3,
          },
        }),
        meta: {
          pagination: {
            page: 2,
            limit: 20,
            total: 45,
            pages: 3,
          },
        },
      }),
    );
  });
});
