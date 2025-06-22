const express = require('express');
const { authenticateUser } = require('../middlewares/auth');
const { validate } = require('../middlewares/validator');
const settingsController = require('../controllers/settings.controller');
const settingsValidation = require('../validations/settings.validation');

const router = express.Router();

// All settings routes require authentication
router.use(authenticateUser);

// Get current user settings
router.get('/', settingsController.getSettings);

// Update current user settings
router.put(
  '/',
  validate(settingsValidation.updateSettings),
  settingsController.updateSettings
);

module.exports = router; 