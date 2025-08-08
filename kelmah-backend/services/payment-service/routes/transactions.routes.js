const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const transactionController = require('../controllers/transaction.controller');

router.use(authenticate);

// Mirror of transaction.routes for naming compatibility
router.post('/', transactionController.createTransaction);
router.get('/:transactionId', transactionController.getTransaction);
router.get('/history', transactionController.getTransactionHistory);
router.patch('/:transactionId/cancel', transactionController.cancelTransaction);

module.exports = router;


