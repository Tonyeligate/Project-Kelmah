const express = require('express');
const request = require('supertest');
const { buildServiceErrorResponse } = require('../utils/errorResponse');

describe('auth-service error envelope', () => {
  test('preserves explicitly safe 503 messages for delivery failures', async () => {
    const app = express();

    app.get('/delivery-failure', (_req, _res, next) => {
      const error = new Error('Verification email delivery is temporarily unavailable. Please try again later.');
      error.statusCode = 503;
      error.exposeMessage = true;
      next(error);
    });

    app.get('/masked-failure', (_req, _res, next) => {
      const error = new Error('Sensitive upstream SMTP failure details');
      error.statusCode = 503;
      next(error);
    });

    app.use((err, req, res, next) => {
      const { statusCode, body } = buildServiceErrorResponse(err, 'production');
      res.status(statusCode).json(body);
    });

    const exposedResponse = await request(app).get('/delivery-failure');
    expect(exposedResponse.status).toBe(503);
    expect(exposedResponse.body).toEqual({
      success: false,
      status: 'error',
      message: 'Verification email delivery is temporarily unavailable. Please try again later.',
      code: null,
      errors: null,
      stack: undefined,
    });

    const maskedResponse = await request(app).get('/masked-failure');
    expect(maskedResponse.status).toBe(503);
    expect(maskedResponse.body).toEqual({
      success: false,
      status: 'error',
      message: 'An internal error occurred',
      code: null,
      errors: null,
      stack: undefined,
    });
  });
});