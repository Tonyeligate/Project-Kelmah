const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const transactionController = require('../controllers/transaction.controller');

router.use(authenticate);

// History (frontend uses this)
router.get('/history', transactionController.getTransactionHistory);

module.exports = router;


