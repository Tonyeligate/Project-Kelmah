const express = require('express');
const router = express.Router();
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { validate } = require('../middlewares/validator');
const disputeValidation = require('../validations/dispute.validation');
const disputeController = require('../controllers/dispute.controller');

// All dispute routes require authentication
router.use(authenticateUser);

// Create a dispute (hirer or worker)
router.post('/',
  validate(disputeValidation.createDispute),
  authorizeRoles(['worker','hirer','admin']),
  disputeController.createDispute
);

// List all disputes (admin only)
router.get('/',
  authorizeRoles(['admin']),
  disputeController.getDisputes
);

// Get dispute by ID (participants or admin)
router.get('/:id',
  authorizeRoles(['worker','hirer','admin']),
  disputeController.getDisputeById
);

// Update dispute by ID (admin only)
router.put('/:id',
  validate(disputeValidation.updateDispute),
  authorizeRoles(['admin']),
  disputeController.updateDispute
);

// Delete dispute by ID (admin only)
router.delete('/:id',
  authorizeRoles(['admin']),
  disputeController.deleteDispute
);

module.exports = router; 