const express = require('express');
const { authenticateUser } = require('../middlewares/auth');
const { validate } = require('../middlewares/validator');
const profileController = require('../controllers/profile.controller');
const profileValidation = require('../validations/profile.validation');

const router = express.Router();

// All profile routes require authentication
router.use(authenticateUser);

// Get profile of current user
router.get('/', profileController.getMyProfile);

// Get profile activity
router.get('/activity', profileController.getProfileActivity);

// Get profile statistics  
router.get('/statistics', profileController.getProfileStatistics);

// Get any user's profile by ID
router.get('/:id', profileController.getUserProfile);

// Update current user's profile
router.put(
  '/',
  validate(profileValidation.updateProfile),
  profileController.updateMyProfile
);

module.exports = router; 