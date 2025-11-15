const router = require('express').Router();

// Service trust middleware - verify requests from API Gateway
const { verifyGatewayRequest } = require('../../../shared/middlewares/serviceTrust');

// Simple in-memory store until Mongo-backed preferences are available
const userPrefs = new Map();

const DEFAULT_NOTIFICATIONS = {
  email: true,
  push: true,
  sms: false,
  inApp: true,
  quietHours: null,
};

const DEFAULT_PRIVACY = {
  profileVisibility: 'public',
  showEmail: false,
  showPhone: false,
};

const DEFAULT_SETTINGS = {
  theme: 'light',
  language: 'en',
  notifications: DEFAULT_NOTIFICATIONS,
  privacy: DEFAULT_PRIVACY,
};

const AVAILABLE_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'tw', name: 'Twi', flag: '🇬🇭' },
  { code: 'ga', name: 'Ga', flag: '🇬🇭' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
];

const AVAILABLE_THEMES = [
  { id: 'light', name: 'Light Mode', description: 'Clean and bright interface' },
  { id: 'dark', name: 'Dark Mode', description: 'Easy on the eyes' },
  { id: 'auto', name: 'Auto', description: 'Follows system preference' },
];

const getUserId = (req) => req.user?.id || req.headers['x-user-id'] || 'unknown';

const getUserSettings = (userId) => {
  if (!userPrefs.has(userId)) {
    userPrefs.set(userId, {
      ...DEFAULT_SETTINGS,
      notifications: { ...DEFAULT_NOTIFICATIONS },
      privacy: { ...DEFAULT_PRIVACY },
    });
  }
  return userPrefs.get(userId);
};

const respond = (res, data) => res.json({ success: true, data });

// Base settings endpoints
router.get('/', verifyGatewayRequest, (req, res) => {
  const settings = getUserSettings(getUserId(req));
  respond(res, settings);
});

router.put('/', verifyGatewayRequest, (req, res) => {
  const userId = getUserId(req);
  const current = getUserSettings(userId);
  const next = {
    ...current,
    ...req.body,
    notifications: {
      ...current.notifications,
      ...(req.body?.notifications || {}),
    },
    privacy: {
      ...current.privacy,
      ...(req.body?.privacy || {}),
    },
  };
  userPrefs.set(userId, next);
  respond(res, next);
});

// Notification preferences
router.get('/notifications', verifyGatewayRequest, (req, res) => {
  const settings = getUserSettings(getUserId(req));
  respond(res, settings.notifications);
});

router.put('/notifications', verifyGatewayRequest, (req, res) => {
  const userId = getUserId(req);
  const settings = getUserSettings(userId);
  settings.notifications = {
    ...DEFAULT_NOTIFICATIONS,
    ...settings.notifications,
    ...(req.body || {}),
  };
  userPrefs.set(userId, settings);
  respond(res, settings.notifications);
});

// Privacy settings
router.get('/privacy', verifyGatewayRequest, (req, res) => {
  const settings = getUserSettings(getUserId(req));
  respond(res, settings.privacy);
});

router.put('/privacy', verifyGatewayRequest, (req, res) => {
  const userId = getUserId(req);
  const settings = getUserSettings(userId);
  settings.privacy = {
    ...DEFAULT_PRIVACY,
    ...settings.privacy,
    ...(req.body || {}),
  };
  userPrefs.set(userId, settings);
  respond(res, settings.privacy);
});

// Language & theme helpers
router.put('/language', verifyGatewayRequest, (req, res) => {
  const userId = getUserId(req);
  const settings = getUserSettings(userId);
  const language = req.body?.language || settings.language;
  settings.language = language;
  userPrefs.set(userId, settings);
  respond(res, { language });
});

router.put('/theme', verifyGatewayRequest, (req, res) => {
  const userId = getUserId(req);
  const settings = getUserSettings(userId);
  const theme = req.body?.theme || settings.theme;
  settings.theme = theme;
  userPrefs.set(userId, settings);
  respond(res, { theme });
});

router.get('/languages', verifyGatewayRequest, (req, res) => {
  respond(res, AVAILABLE_LANGUAGES);
});

router.get('/themes', verifyGatewayRequest, (req, res) => {
  respond(res, AVAILABLE_THEMES);
});

router.post('/reset', verifyGatewayRequest, (req, res) => {
  const userId = getUserId(req);
  userPrefs.delete(userId);
  respond(res, getUserSettings(userId));
});

module.exports = router;
