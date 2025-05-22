const express = require('express');
const router = express.Router();
const earningsController = require('../controllers/earnings.controller');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get earnings summary
router.get('/earnings', earningsController.getEarningsSummary);

// Get transaction history
router.get('/transactions', earningsController.getTransactionHistory);

// Request withdrawal
router.post('/withdraw', earningsController.requestWithdrawal);

module.exports = router; 