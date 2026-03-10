let mockSendMail;
let mockCreateTransport;
let emailService;

describe('email service smtp transport', () => {
  beforeEach(() => {
    jest.resetModules();

    mockSendMail = jest.fn().mockResolvedValue({ accepted: ['worker@example.com'] });
    mockCreateTransport = jest.fn(() => ({ sendMail: mockSendMail }));

    jest.doMock('nodemailer', () => ({
      createTransport: mockCreateTransport,
    }));

    jest.doMock('../config', () => ({
      FROM_EMAIL: 'sender@example.com',
      SMTP_HOST: 'smtp.gmail.com',
      SMTP_PORT: 465,
      SMTP_USER: ' sender@example.com ',
      SMTP_PASS: ' abcd efgh ijkl mnop ',
      EMAIL_SEND_TIMEOUT_MS: 30000,
      SMTP_CONNECTION_TIMEOUT_MS: 15000,
      SMTP_GREETING_TIMEOUT_MS: 15000,
      SMTP_SOCKET_TIMEOUT_MS: 30000,
    }));

    jest.doMock('../utils/logger', () => ({
      logger: {
        warn: jest.fn(),
      },
    }));

    emailService = require('../services/email.service');
  });

  test('normalizes Gmail app-password whitespace and applies explicit SMTP timeouts', async () => {
    expect(emailService.isDeliveryConfigured()).toBe(true);
    expect(mockCreateTransport).toHaveBeenCalledWith(expect.objectContaining({
      auth: {
        user: 'sender@example.com',
        pass: 'abcdefghijklmnop',
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 30000,
    }));

    await emailService.sendVerificationEmail({
      name: 'Worker Example',
      email: 'worker@example.com',
      verificationUrl: 'https://frontend.test/verify-email/raw-token',
    });

    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'worker@example.com',
      from: '"Kelmah Platform" <sender@example.com>',
      envelope: expect.objectContaining({
        from: 'sender@example.com',
        to: 'worker@example.com',
      }),
    }));
  });

  test('falls back to the authenticated SMTP user when EMAIL_FROM is the placeholder default', async () => {
    jest.resetModules();

    mockSendMail = jest.fn().mockResolvedValue({ accepted: ['worker@example.com'] });
    mockCreateTransport = jest.fn(() => ({ sendMail: mockSendMail }));

    jest.doMock('nodemailer', () => ({
      createTransport: mockCreateTransport,
    }));

    jest.doMock('../config', () => ({
      FROM_EMAIL: 'noreply@kelmah.com',
      SMTP_HOST: 'smtp.gmail.com',
      SMTP_PORT: 465,
      SMTP_USER: 'sender@example.com',
      SMTP_PASS: 'abcdefghijklmnop',
      EMAIL_SEND_TIMEOUT_MS: 30000,
      SMTP_CONNECTION_TIMEOUT_MS: 15000,
      SMTP_GREETING_TIMEOUT_MS: 15000,
      SMTP_SOCKET_TIMEOUT_MS: 30000,
    }));

    jest.doMock('../utils/logger', () => ({
      logger: {
        warn: jest.fn(),
      },
    }));

    emailService = require('../services/email.service');

    await emailService.sendVerificationEmail({
      name: 'Worker Example',
      email: 'worker@example.com',
      verificationUrl: 'https://frontend.test/verify-email/raw-token',
    });

    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
      from: '"Kelmah Platform" <sender@example.com>',
      envelope: expect.objectContaining({
        from: 'sender@example.com',
      }),
    }));
  });
});