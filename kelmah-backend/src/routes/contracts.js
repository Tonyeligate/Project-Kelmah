const express = require('express');
const { validate } = require('../middlewares/validator');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const contractController = require('../controllers/contract.controller');
const contractValidation = require('../validations/contract.validation');

const router = express.Router();

// Create contract (hirer only)
router.post(
  '/',
  authenticateUser,
  authorizeRoles('hirer'),
  validate(contractValidation.createContract),
  contractController.createContract
);

// Get contract by ID (hirer or worker)
router.get(
  '/:id',
  authenticateUser,
  contractController.getContractById
);

// Get my contracts (hirer or worker)
router.get(
  '/',
  authenticateUser,
  contractController.getMyContracts
);

// Update contract (participants)
router.put(
  '/:id',
  authenticateUser,
  validate(contractValidation.updateContract),
  contractController.updateContract
);

module.exports = router; 