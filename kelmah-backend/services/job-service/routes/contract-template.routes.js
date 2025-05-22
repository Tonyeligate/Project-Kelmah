/**
 * Contract Template Routes
 * API routes for contract template operations
 */

const express = require('express');
const router = express.Router();
const { auth } = require('../../../middleware/auth');
const { roleCheck } = require('../../../middleware/roleCheck');
const contractTemplateController = require('../controllers/contract-template.controller');

// Public routes (none for contract templates)

// Protected routes for authenticated users
router.use(auth());

// Basic CRUD operations
router.get('/', contractTemplateController.getAllTemplates);
router.get('/:id', contractTemplateController.getTemplateById);
router.post('/', contractTemplateController.createTemplate);
router.put('/:id', contractTemplateController.updateTemplate);
router.delete('/:id', contractTemplateController.deleteTemplate);

module.exports = router; 