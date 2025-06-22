const express = require('express');
const router = express.Router();
const billController = require('../controllers/bill.controller');
const { authenticate } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all bills for current user
router.get('/', billController.getBills);

// Pay a specific bill
router.post('/:billId/pay', billController.payBill);

module.exports = router; 