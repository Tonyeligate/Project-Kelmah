const { Worker, Document } = require('../models');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads/documents');
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF and images are allowed.'));
        }
    }
});

const documentController = {
    // Get all documents for a worker
    getDocuments: async (req, res) => {
        try {
            const workerId = req.user.id;
            const documents = await Document.findAll({
                where: { workerId },
                order: [['createdAt', 'DESC']]
            });

            res.json({
                success: true,
                data: documents
            });
        } catch (error) {
            console.error('Error fetching documents:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch documents'
            });
        }
    },

    // Upload a new document
    uploadDocument: async (req, res) => {
        try {
            const workerId = req.user.id;
            const { type } = req.body;
            const file = req.file;

            if (!file) {
                return res.status(400).json({
                    success: false,
                    error: 'No file uploaded'
                });
            }

            // Validate document type
            const validTypes = ['id_card', 'proof_of_address', 'certification', 'portfolio'];
            if (!validTypes.includes(type)) {
                // Delete uploaded file if type is invalid
                await fs.unlink(file.path);
                return res.status(400).json({
                    success: false,
                    error: 'Invalid document type'
                });
            }

            // Create document record
            const document = await Document.create({
                workerId,
                type,
                filename: file.filename,
                originalName: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                status: 'pending',
                path: file.path
            });

            // TODO: Trigger document verification process
            // For now, we'll simulate verification after 5 seconds
            setTimeout(async () => {
                await document.update({ status: 'verified' });
            }, 5000);

            res.json({
                success: true,
                data: document,
                message: 'Document uploaded successfully'
            });
        } catch (error) {
            console.error('Error uploading document:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to upload document'
            });
        }
    },

    // Delete a document
    deleteDocument: async (req, res) => {
        try {
            const workerId = req.user.id;
            const { documentId } = req.params;

            const document = await Document.findOne({
                where: {
                    id: documentId,
                    workerId
                }
            });

            if (!document) {
                return res.status(404).json({
                    success: false,
                    error: 'Document not found'
                });
            }

            if (document.status === 'verified') {
                return res.status(400).json({
                    success: false,
                    error: 'Cannot delete verified documents'
                });
            }

            // Delete file from storage
            await fs.unlink(document.path);

            // Delete document record
            await document.destroy();

            res.json({
                success: true,
                message: 'Document deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting document:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete document'
            });
        }
    },

    // Get document verification status
    getVerificationStatus: async (req, res) => {
        try {
            const workerId = req.user.id;

            const documents = await Document.findAll({
                where: { workerId },
                attributes: ['type', 'status']
            });

            const requiredDocs = ['id_card', 'proof_of_address'];
            const verifiedDocs = documents.filter(doc => doc.status === 'verified');
            const hasAllRequired = requiredDocs.every(type =>
                verifiedDocs.some(doc => doc.type === type)
            );

            res.json({
                success: true,
                data: {
                    status: hasAllRequired ? 'verified' : 'pending',
                    documents: documents
                }
            });
        } catch (error) {
            console.error('Error fetching verification status:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch verification status'
            });
        }
    }
};

module.exports = {
    documentController,
    upload
}; 