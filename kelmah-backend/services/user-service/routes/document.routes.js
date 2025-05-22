const express = require('express');
const router = express.Router();
const { documentController, upload } = require('../controllers/document.controller');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get all documents
router.get('/documents', documentController.getDocuments);

// Upload a new document
router.post('/documents/upload', upload.single('file'), documentController.uploadDocument);

// Delete a document
router.delete('/documents/:documentId', documentController.deleteDocument);

// Get verification status
router.get('/documents/status', documentController.getVerificationStatus);

module.exports = router; 