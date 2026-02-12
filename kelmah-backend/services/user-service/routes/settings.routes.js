/**
 * Settings Routes — MongoDB-backed user preferences
 * ✅ FIXED: Replaced in-memory Map with MongoDB Settings model.
 * User preferences now persist across service restarts.
 */
const router = require('express').Router();

// Service trust middleware - verify requests from API Gateway
const { verifyGatewayRequest } = require('../../../shared/middlewares/serviceTrust');

// MongoDB Settings model
const { Settings } = require('../models');

const DEFAULT_NOTIFICATIONS = {
  email: true,
  push: true,
  sms: false,
  inApp: true,
  quietHours: { enabled: false, start: null, end: null },
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

const respond = (res, data) => res.json({ success: true, data });

/**
 * Get or create settings for a user. Returns defaults for anonymous requests.
 */
const getOrCreateSettings = async (userId) => {
  if (!userId) return { ...DEFAULT_SETTINGS };

  let settings = await Settings.findOne({ userId }).lean();
  if (!settings) {
    settings = (await Settings.create({ userId, ...DEFAULT_SETTINGS })).toObject();
  }
  return settings;
};

// ==================== Base settings endpoints ====================

router.get('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    const settings = await getOrCreateSettings(userId);
    respond(res, settings);
  } catch (err) {
    console.error('[SETTINGS] GET / error:', err.message);
    res.status(500).json({ success: false, error: { message: 'Failed to retrieve settings' } });
  }
});

router.put('/', verifyGatewayRequest, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, error: { message: 'Authentication required' } });

    const update = {};
    if (req.body.theme) update.theme = req.body.theme;
    if (req.body.language) update.language = req.body.language;
    if (req.body.notifications) update.notifications = { ...DEFAULT_NOTIFICATIONS, ...req.body.notifications };
    if (req.body.privacy) update.privacy = { ...DEFAULT_PRIVACY, ...req.body.privacy };

    const settings = await Settings.findOneAndUpdate(
      { userId },
      { $set: update },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    respond(res, settings);
  } catch (err) {
    console.error('[SETTINGS] PUT / error:', err.message);
    res.status(500).json({ success: false, error: { message: 'Failed to update settings' } });
  }
});

// ==================== Notification preferences ====================

router.get('/notifications', async (req, res) => {
  try {
    const userId = getUserId(req);
    const settings = await getOrCreateSettings(userId);
    respond(res, settings.notifications || DEFAULT_NOTIFICATIONS);
  } catch (err) {
    console.error('[SETTINGS] GET /notifications error:', err.message);
    res.status(500).json({ success: false, error: { message: 'Failed to retrieve notification preferences' } });
  }
});

router.put('/notifications', verifyGatewayRequest, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, error: { message: 'Authentication required' } });

    const notifications = { ...DEFAULT_NOTIFICATIONS, ...req.body };
    const settings = await Settings.findOneAndUpdate(
      { userId },
      { $set: { notifications } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    respond(res, settings.notifications);
  } catch (err) {
    console.error('[SETTINGS] PUT /notifications error:', err.message);
    res.status(500).json({ success: false, error: { message: 'Failed to update notification preferences' } });
  }
});

// ==================== Privacy settings ====================

router.get('/privacy', async (req, res) => {
  try {
    const userId = getUserId(req);
    const settings = await getOrCreateSettings(userId);
    respond(res, settings.privacy || DEFAULT_PRIVACY);
  } catch (err) {
    console.error('[SETTINGS] GET /privacy error:', err.message);
    res.status(500).json({ success: false, error: { message: 'Failed to retrieve privacy settings' } });
  }
});

router.put('/privacy', verifyGatewayRequest, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, error: { message: 'Authentication required' } });

    const privacy = { ...DEFAULT_PRIVACY, ...req.body };
    const settings = await Settings.findOneAndUpdate(
      { userId },
      { $set: { privacy } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    respond(res, settings.privacy);
  } catch (err) {
    console.error('[SETTINGS] PUT /privacy error:', err.message);
    res.status(500).json({ success: false, error: { message: 'Failed to update privacy settings' } });
  }
});

// ==================== Language & Theme helpers ====================

router.put('/language', verifyGatewayRequest, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, error: { message: 'Authentication required' } });

    const language = req.body?.language || 'en';
    const settings = await Settings.findOneAndUpdate(
      { userId },
      { $set: { language } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    respond(res, { language: settings.language });
  } catch (err) {
    console.error('[SETTINGS] PUT /language error:', err.message);
    res.status(500).json({ success: false, error: { message: 'Failed to update language' } });
  }
});

router.put('/theme', verifyGatewayRequest, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, error: { message: 'Authentication required' } });

    const theme = req.body?.theme || 'light';
    const settings = await Settings.findOneAndUpdate(
      { userId },
      { $set: { theme } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    respond(res, { theme: settings.theme });
  } catch (err) {
    console.error('[SETTINGS] PUT /theme error:', err.message);
    res.status(500).json({ success: false, error: { message: 'Failed to update theme' } });
  }
});

// ==================== Public metadata endpoints ====================

router.get('/languages', (req, res) => {
  respond(res, AVAILABLE_LANGUAGES);
});

router.get('/themes', (req, res) => {
  respond(res, AVAILABLE_THEMES);
});

router.post('/reset', verifyGatewayRequest, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, error: { message: 'Authentication required' } });

    await Settings.findOneAndDelete({ userId });
    const settings = await getOrCreateSettings(userId);
    respond(res, settings);
  } catch (err) {
    console.error('[SETTINGS] POST /reset error:', err.message);
    res.status(500).json({ success: false, error: { message: 'Failed to reset settings' } });
  }
});

module.exports = router;
