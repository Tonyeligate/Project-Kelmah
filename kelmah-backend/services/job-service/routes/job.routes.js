/**
 * Job Routes
 * API routes for job-related operations
 */

const express = require('express');
const router = express.Router();
const jobController = require('../controllers/job.controller');
const { auth } = require('../../../middleware/auth');
const { roleCheck } = require('../../../middleware/roleCheck');

// Public routes
router.get('/', jobController.getJobs);
router.get('/:id', jobController.getJobById);

// Protected routes for authenticated users
router.use(auth());

// Job creation and management - requires 'hirer' role
router.post('/', roleCheck(['hirer', 'admin']), jobController.createJob);
router.put('/:id', roleCheck(['hirer', 'admin']), jobController.updateJob);
router.delete('/:id', roleCheck(['hirer', 'admin']), jobController.deleteJob);
router.patch('/:id/status', roleCheck(['hirer', 'admin']), jobController.changeJobStatus);

// Job metrics for data visualization
router.get('/:id/metrics', roleCheck(['hirer', 'admin']), jobController.getJobMetrics);

module.exports = router; 