const express = require('express');
const router = express.Router();
const milestoneController = require('../controllers/milestone.controller');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Get all milestones for a contract
router.get('/contract/:contractId', milestoneController.getMilestones);

// Get a specific milestone
router.get('/:milestoneId', milestoneController.getMilestone);

// Create a new milestone for a contract
router.post('/contract/:contractId', milestoneController.createMilestone);

// Update a milestone
router.put('/:milestoneId', milestoneController.updateMilestone);

// Delete a milestone
router.delete('/:milestoneId', milestoneController.deleteMilestone);

// Mark a milestone as paid
router.patch('/:milestoneId/pay', milestoneController.markMilestonePaid);

module.exports = router; 