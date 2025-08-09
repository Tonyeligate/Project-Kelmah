const router = require('express').Router();

// Minimal auth gate
const authenticate = (req, res, next) => {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Unauthorized' });
  next();
};

// In-memory preference store placeholder (replace with DB model)
const userPrefs = new Map(); // userId -> prefs

// Get notification preferences
router.get('/notifications', authenticate, (req, res) => {
  const userId = req.user?.id || req.headers['x-user-id'] || 'unknown';
  const prefs = userPrefs.get(userId) || { email: true, push: true, sms: false, inApp: true, quietHours: null };
  res.json({ success: true, data: prefs });
});

// Update notification preferences
router.put('/notifications', authenticate, (req, res) => {
  const userId = req.user?.id || req.headers['x-user-id'] || 'unknown';
  const prefs = req.body || {};
  const merged = { email: true, push: true, sms: false, inApp: true, quietHours: null, ...(userPrefs.get(userId) || {}), ...prefs };
  userPrefs.set(userId, merged);
  res.json({ success: true, data: merged });
});

module.exports = router;
