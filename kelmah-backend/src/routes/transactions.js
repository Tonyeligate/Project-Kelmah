const express = require('express');
const router = express.Router();
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { validate } = require('../middlewares/validator');
const transactionValidation = require('../validations/transaction.validation');
const transactionController = require('../controllers/transaction.controller');

// All transaction routes require authenticated admin
router.use(authenticateUser, authorizeRoles(['admin']));

router.route('/')
  .get(transactionController.getTransactions)
  .post(
    validate(transactionValidation.createTransaction),
    transactionController.createTransaction
  );

router.route('/:id')
  .get(transactionController.getTransactionById)
  .put(
    validate(transactionValidation.updateTransaction),
    transactionController.updateTransaction
  )
  .delete(transactionController.deleteTransaction);

module.exports = router; 