const express = require('express');
const request = require('supertest');

jest.mock('../models', () => ({
  Settings: {
    findOne: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
  },
}));

jest.mock('../../../shared/middlewares/serviceTrust', () => ({
  verifyGatewayRequest: jest.fn((req, _res, next) => next()),
}));

jest.mock('../utils/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

const { Settings } = require('../models');
const settingsRouter = require('../routes/settings.routes');

const createLeanQuery = (result) => ({
  lean: jest.fn().mockResolvedValue(result),
});

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    const userId = req.header('x-test-user-id');
    if (userId) {
      req.user = { id: userId };
    }
    next();
  });
  app.use('/settings', settingsRouter);
  return app;
};

describe('settings routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /settings returns effective defaults without creating a record', async () => {
    Settings.findOne.mockReturnValue(createLeanQuery(null));

    const response = await request(createApp())
      .get('/settings')
      .set('x-test-user-id', 'worker-123');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        theme: 'light',
        language: 'en',
        notifications: {
          email: true,
          push: true,
          sms: false,
          inApp: true,
          quietHours: {
            enabled: false,
            start: null,
            end: null,
          },
        },
        privacy: {
          profileVisibility: 'public',
          showEmail: false,
          showPhone: false,
        },
      },
    });
    expect(Settings.findOne).toHaveBeenCalledWith({ userId: 'worker-123' });
    expect(Settings.create).not.toHaveBeenCalled();
  });

  test('POST /settings/reset recreates persisted defaults explicitly', async () => {
    Settings.findOneAndDelete.mockResolvedValue({ acknowledged: true });
    Settings.findOneAndUpdate.mockReturnValue(createLeanQuery({
      _id: 'settings-1',
      userId: 'worker-123',
      theme: 'light',
      language: 'en',
      notifications: {
        email: true,
        push: true,
        sms: false,
        inApp: true,
        quietHours: {
          enabled: false,
          start: null,
          end: null,
        },
      },
      privacy: {
        profileVisibility: 'public',
        showEmail: false,
        showPhone: false,
      },
    }));

    const response = await request(createApp())
      .post('/settings/reset')
      .set('x-test-user-id', 'worker-123');

    expect(response.status).toBe(200);
    expect(Settings.findOneAndDelete).toHaveBeenCalledWith({ userId: 'worker-123' });
    expect(Settings.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: 'worker-123' },
      {
        $set: {
          theme: 'light',
          language: 'en',
          notifications: {
            email: true,
            push: true,
            sms: false,
            inApp: true,
            quietHours: {
              enabled: false,
              start: null,
              end: null,
            },
          },
          privacy: {
            profileVisibility: 'public',
            showEmail: false,
            showPhone: false,
          },
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    expect(Settings.create).not.toHaveBeenCalled();
    expect(response.body.success).toBe(true);
  });
});