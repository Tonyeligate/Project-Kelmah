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

const getUserId = (req) => req.user?.id || req.headers['x-user-id'] || null;

const clone = (v) => JSON.parse(JSON.stringify(v));

// Retrieve user settings. If `createIfMissing` is false and the userId
// is not present, return a non-persistent clone of defaults instead
// of creating an in-memory entry for anonymous requests.
const getUserSettings = (userId, createIfMissing = true) => {
  if (!userId) {
    return clone(DEFAULT_SETTINGS);
  }

  if (!userPrefs.has(userId)) {
    if (!createIfMissing) return clone(DEFAULT_SETTINGS);
    userPrefs.set(userId, {
      ...clone(DEFAULT_SETTINGS),
      notifications: clone(DEFAULT_NOTIFICATIONS),
      privacy: clone(DEFAULT_PRIVACY),
    });
  }
  return userPrefs.get(userId);
};

const respond = (res, data) => res.json({ success: true, data });

// Base settings endpoints
// Public: return user settings when authenticated, otherwise return defaults
router.get('/', (req, res) => {
  const userId = getUserId(req);
  const settings = getUserSettings(userId, !!userId);
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
// Public-safe notifications read: returns user-specific prefs when authenticated,
// otherwise returns default notification settings without creating persistent entries.
router.get('/notifications', (req, res) => {
  const userId = getUserId(req);
  const settings = getUserSettings(userId, !!userId);
  respond(res, settings.notifications || DEFAULT_NOTIFICATIONS);
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
// Public-safe privacy read
router.get('/privacy', (req, res) => {
  const userId = getUserId(req);
  const settings = getUserSettings(userId, !!userId);
  respond(res, settings.privacy || DEFAULT_PRIVACY);
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

// Public metadata endpoints
router.get('/languages', (req, res) => {
  respond(res, AVAILABLE_LANGUAGES);
});

router.get('/themes', (req, res) => {
  respond(res, AVAILABLE_THEMES);
});

router.post('/reset', verifyGatewayRequest, (req, res) => {
  const userId = getUserId(req);
  userPrefs.delete(userId);
  respond(res, getUserSettings(userId));
});

module.exports = router;
