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

/** TEMPLATE ROUTES **/
// Get all contract templates
router.get(
  '/templates',
  authenticateUser,
  contractController.getContractTemplates
);
// Get a single template
router.get(
  '/templates/:templateId',
  authenticateUser,
  contractController.getContractTemplateById
);
// Create a contract template (hirer only)
router.post(
  '/templates',
  authenticateUser,
  authorizeRoles('hirer'),
  validate(contractValidation.createTemplate),
  contractController.createContractTemplate
);

/** MILESTONE ROUTES **/
// Fetch milestones for a contract
router.get(
  '/:id/milestones',
  authenticateUser,
  contractController.getContractMilestones
);
// Create a milestone
router.post(
  '/:id/milestones',
  authenticateUser,
  validate(contractValidation.createMilestone),
  contractController.createMilestone
);
// Update a milestone
router.put(
  '/:id/milestones/:milestoneId',
  authenticateUser,
  validate(contractValidation.updateMilestone),
  contractController.updateMilestone
);
// Complete a milestone
router.post(
  '/:id/milestones/:milestoneId/complete',
  authenticateUser,
  contractController.completeMilestone
);

/** SIGNATURE ROUTES **/
// Sign a contract
router.post(
  '/:id/sign',
  authenticateUser,
  validate(contractValidation.signContract),
  contractController.signContract
);
// Send contract for signature
router.post(
  '/:id/send-for-signature',
  authenticateUser,
  contractController.sendContractForSignature
);

/** CANCELLATION ROUTE **/
// Cancel a contract
router.post(
  '/:id/cancel',
  authenticateUser,
  validate(contractValidation.cancelContract),
  contractController.cancelContract
);

/** DISPUTE ROUTE **/
// Create a dispute for a contract
router.post(
  '/:id/disputes',
  authenticateUser,
  validate(contractValidation.createDispute),
  contractController.createDispute
);

module.exports = router; 