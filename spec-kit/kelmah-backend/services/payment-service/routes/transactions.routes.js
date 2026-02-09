const express = require('express');
const router = express.Router();
const { verifyGatewayRequest } = require('../../../shared/middlewares/serviceTrust');
const transactionController = require('../controllers/transaction.controller');

router.use(verifyGatewayRequest);

// Mirror of transaction.routes for naming compatibility
router.post('/', transactionController.createTransaction);
// IMPORTANT: define static routes before param routes to avoid shadowing
router.get('/history', transactionController.getTransactionHistory);
router.post('/reconcile', transactionController.reconcile);
router.get('/:transactionId', transactionController.getTransaction);
router.patch('/:transactionId/cancel', transactionController.cancelTransaction);

module.exports = router;


