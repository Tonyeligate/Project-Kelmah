/**
 * Review Routes
 * API routes for review operations
 */

const express = require('express');
const router = express.Router();
const { auth } = require('../../../middleware/auth');
const { roleCheck } = require('../../../middleware/roleCheck');

// Public routes - read-only access to published reviews
router.get('/user/:userId', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Reviews API is under development',
    data: []
  });
});

// Protected routes for authenticated users
router.use(auth());

// TODO: Implement controller functions
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Reviews API is under development',
    data: []
  });
});

module.exports = router; 