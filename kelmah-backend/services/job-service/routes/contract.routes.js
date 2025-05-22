/**
 * Contract Routes
 * API routes for contract operations
 */

const express = require('express');
const router = express.Router();
const { auth } = require('../../../middleware/auth');
const contractController = require('../controllers/contract.controller');
const { authJwt } = require('../middleware');

// Public routes (none for contracts)

// Protected routes for authenticated users
router.use(auth());

// Apply JWT middleware
router.use(authJwt.verifyToken);

// Contract CRUD operations
router.get('/', contractController.findAll);
router.post('/', contractController.create);
router.get('/:id', contractController.findOne);
router.put('/:id', contractController.update);
router.delete('/:id', contractController.delete);

// Contract statistics
router.get('/stats', contractController.getStats);

// Contract search
router.get('/search', contractController.searchContracts);

// Contract signature operations
router.post('/:id/sign', contractController.signContract);
router.post('/:id/send-for-signature', contractController.sendForSignature);
router.get('/:id/signatures', contractController.getContractSignatures);

// Contract document operations
router.get('/:id/download', contractController.downloadContract);
router.get('/:id/pdf', contractController.generateContractPDF);

// Contract status operations
router.post('/:id/complete', contractController.completeContract);
router.post('/:id/cancel', contractController.cancelContract);

// Payment milestone operations
router.post('/:id/milestone', contractController.addMilestone);
router.put('/:id/milestone/:milestoneId', contractController.updateMilestone);
router.delete('/:id/milestone/:milestoneId', contractController.deleteMilestone);
router.post('/:id/milestone/:milestoneId/complete', contractController.completeMilestone);
router.put('/:id/milestones/:milestoneId', contractController.updateMilestone);

module.exports = router; 