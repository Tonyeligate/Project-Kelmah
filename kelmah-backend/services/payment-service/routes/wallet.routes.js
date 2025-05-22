const express = require('express');
const { body } = require('express-validator');
const walletController = require('../controllers/wallet.controller');
const { authenticate } = require('../../../shared');

const router = express.Router();

// All wallet routes require authentication
router.use(authenticate);

// Get wallet
router.get('/', walletController.getWallet);

// Get transaction history
router.get('/transactions', walletController.getTransactions);

// Deposit to wallet
router.post(
  '/deposit',
  [
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('source').notEmpty().withMessage('Payment source is required')
  ],
  walletController.deposit
);

// Withdraw from wallet
router.post(
  '/withdraw',
  [
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('destination').notEmpty().withMessage('Withdrawal destination is required')
  ],
  walletController.withdraw
);

// Transfer to another user
router.post(
  '/transfer',
  [
    body('toUserId').isUUID().withMessage('Valid recipient user ID is required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0')
  ],
  walletController.transfer
);

module.exports = router; 