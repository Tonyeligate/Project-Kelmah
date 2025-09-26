const router = require('express').Router();

// Service trust middleware - verify requests from API Gateway
const { verifyGatewayRequest } = require('../../../shared/middlewares/serviceTrust');

// In-memory preference store placeholder (replace with DB model)
const userPrefs = new Map(); // userId -> prefs

// Get notification preferences
router.get('/notifications', verifyGatewayRequest, (req, res) => {
  const userId = req.user?.id || req.headers['x-user-id'] || 'unknown';
  const prefs = userPrefs.get(userId) || { email: true, push: true, sms: false, inApp: true, quietHours: null };
  res.json({ success: true, data: prefs });
});

// Update notification preferences
router.put('/notifications', verifyGatewayRequest, (req, res) => {
  const userId = req.user?.id || req.headers['x-user-id'] || 'unknown';
  const prefs = req.body || {};
  const merged = { email: true, push: true, sms: false, inApp: true, quietHours: null, ...(userPrefs.get(userId) || {}), ...prefs };
  userPrefs.set(userId, merged);
  res.json({ success: true, data: merged });
});

module.exports = router;
