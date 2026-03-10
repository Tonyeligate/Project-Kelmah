const { buildServiceErrorResponse } = require('../utils/errorResponse');

describe('auth-service error response helper', () => {
  test('preserves safe exposed 503 messages', () => {
    const error = new Error('Verification email delivery is temporarily unavailable. Please try again later.');
    error.statusCode = 503;
    error.code = 'EMAIL_DELIVERY_UNAVAILABLE';
    error.expose = true;

    expect(buildServiceErrorResponse(error, 'production')).toEqual({
      statusCode: 503,
      body: {
        success: false,
        status: 'error',
        message: 'Verification email delivery is temporarily unavailable. Please try again later.',
        code: 'EMAIL_DELIVERY_UNAVAILABLE',
        errors: null,
        stack: undefined,
      },
    });
  });

  test('continues masking unexpected 500 errors', () => {
    const error = new Error('SMTP auth failed');
    error.statusCode = 500;

    expect(buildServiceErrorResponse(error, 'production')).toEqual({
      statusCode: 500,
      body: {
        success: false,
        status: 'error',
        message: 'An internal error occurred',
        code: null,
        errors: null,
        stack: undefined,
      },
    });
  });

  test('preserves 4xx messages without explicit exposure', () => {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;

    const response = buildServiceErrorResponse(error, 'production');

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe('Invalid credentials');
    expect(response.body.code).toBeNull();
  });
});