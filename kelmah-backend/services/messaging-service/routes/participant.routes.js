const express = require('express');
const router = express.Router();
const participantController = require('../controllers/participant.controller');
const authenticate = require('../middleware/authenticate');

// All routes require authentication
router.use(authenticate);

// Get all participants for a conversation
router.get('/conversation/:conversationId', participantController.getParticipants);

// Add a participant to a conversation
router.post('/conversation/:conversationId', participantController.addParticipant);

// Remove a participant from a conversation
router.delete('/conversation/:conversationId/:participantId', participantController.removeParticipant);

// Update a participant's role
router.put('/conversation/:conversationId/:participantId/role', participantController.updateRole);

module.exports = router; 