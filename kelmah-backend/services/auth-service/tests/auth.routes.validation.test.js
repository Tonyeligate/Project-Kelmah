const express = require('express');
const request = require('supertest');

const mockAuthController = {
  register: jest.fn((_req, res) => res.status(201).json({ success: true })),
  login: jest.fn((_req, res) => res.status(200).json({ success: true })),
  verifyEmail: jest.fn((_req, res) => res.status(200).json({ success: true })),
  resendVerificationEmail: jest.fn((_req, res) => res.status(200).json({ success: true })),
  forgotPassword: jest.fn((_req, res) => res.status(200).json({ success: true })),
  resetPassword: jest.fn((_req, res) => res.status(200).json({ success: true })),
  logout: jest.fn((_req, res) => res.status(200).json({ success: true })),
  refreshToken: jest.fn((_req, res) => res.status(200).json({ success: true })),
  exchangeOAuthCode: jest.fn((_req, res) => res.status(200).json({ success: true })),
  changePassword: jest.fn((_req, res) => res.status(200).json({ success: true })),
  getMe: jest.fn((_req, res) => res.status(200).json({ success: true })),
  verifyAuth: jest.fn((_req, res) => res.status(200).json({ success: true })),
  validateAuthToken: jest.fn((_req, res) => res.status(200).json({ success: true })),
  googleCallback: jest.fn((_req, res) => res.status(200).json({ success: true })),
  facebookCallback: jest.fn((_req, res) => res.status(200).json({ success: true })),
  linkedinCallback: jest.fn((_req, res) => res.status(200).json({ success: true })),
  mfaSetup: jest.fn((_req, res) => res.status(200).json({ success: true })),
  verifyTwoFactor: jest.fn((_req, res) => res.status(200).json({ success: true })),
  disableTwoFactor: jest.fn((_req, res) => res.status(200).json({ success: true })),
  getSessions: jest.fn((_req, res) => res.status(200).json({ success: true })),
  endAllSessions: jest.fn((_req, res) => res.status(200).json({ success: true })),
  endSession: jest.fn((_req, res) => res.status(200).json({ success: true })),
  deactivateAccount: jest.fn((_req, res) => res.status(200).json({ success: true })),
  reactivateAccount: jest.fn((_req, res) => res.status(200).json({ success: true })),
  getAuthStats: jest.fn((_req, res) => res.status(200).json({ success: true })),
};

jest.mock('../controllers/auth.controller', () => mockAuthController);
jest.mock('../../../shared/middlewares/serviceTrust', () => ({
  verifyGatewayRequest: (req, _res, next) => {
    req.user = { id: 'user-1', role: 'worker' };
    next();
  },
}));
jest.mock('../middlewares/rateLimiter', () => ({
  createLimiter: (key) => (req, res, next) => {
    res.set('x-auth-rate-limit-profile', key);
    next();
  },
}));
jest.mock('../config/passport', () => ({
  authenticate: () => (_req, _res, next) => next(),
}));
jest.mock('../utils/logger', () => ({
  logger: { warn: jest.fn() },
}));

const router = require('../routes/auth.routes');

describe('auth-service route password validation', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(router);
    Object.values(mockAuthController).forEach((mockFn) => mockFn.mockClear());
  });

  test('register rejects passwords that fail the shared strict policy', async () => {
    const response = await request(app)
      .post('/register')
      .send({
        firstName: 'Kwame',
        lastName: 'Asante',
        email: 'kwame@example.com',
        password: 'Password1',
      });

    expect(response.status).toBe(400);
    expect(mockAuthController.register).not.toHaveBeenCalled();
    expect(response.body.errors[0].message).toContain('at least 12 characters long');
    expect(response.body.errors[0].message).toContain('special character');
  });

  test('change-password rejects weak replacements before hitting the controller', async () => {
    const response = await request(app)
      .post('/change-password')
      .send({
        currentPassword: 'CurrentPassword123!',
        newPassword: 'Password1',
      });

    expect(response.status).toBe(400);
    expect(mockAuthController.changePassword).not.toHaveBeenCalled();
    expect(response.body.errors[0].message).toContain('at least 12 characters long');
    expect(response.body.errors[0].message).toContain('special character');
  });

  test('login uses the dedicated login limiter', async () => {
    const response = await request(app)
      .post('/login')
      .send({
        email: 'kwame@example.com',
        password: 'CurrentPassword123!',
      });

    expect(response.status).toBe(200);
    expect(response.headers['x-auth-rate-limit-profile']).toBe('login');
    expect(mockAuthController.login).toHaveBeenCalledTimes(1);
  });
});