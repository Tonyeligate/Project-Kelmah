/**
 * Job Routes
 */

const express = require('express');
const { validate } = require('../middlewares/validator');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const jobController = require('../controllers/job.controller');
const jobValidation = require('../validations/job.validation');
const applicationController = require('../controllers/application.controller');
const applicationValidation = require('../validations/application.validation');
const savedJobsController = require('../controllers/savedJobs.controller');

const router = express.Router();

// Public routes
router.get('/', jobController.getJobs);
router.get('/featured', jobController.getFeaturedJobs);
router.get('/categories', jobController.getJobCategories);
router.get('/:id', jobController.getJobById);

// Protected routes
router.use(authenticateUser);

// Hirer only routes
router.post(
  '/',
  authorizeRoles('hirer'),
  validate(jobValidation.createJob),
  jobController.createJob
);

router.get('/my-jobs', authorizeRoles('hirer'), jobController.getMyJobs);

router.put(
  '/:id',
  authorizeRoles('hirer'),
  validate(jobValidation.updateJob),
  jobController.updateJob
);

router.delete('/:id', authorizeRoles('hirer'), jobController.deleteJob);

router.patch(
  '/:id/status',
  authorizeRoles('hirer'),
  validate(jobValidation.changeJobStatus),
  jobController.changeJobStatus
);

// Application routes
router.post(
  '/:id/apply',
  authorizeRoles('worker'),
  validate(applicationValidation.applyToJob),
  applicationController.applyToJob
);
router.get(
  '/:id/applications',
  authorizeRoles('hirer'),
  applicationController.getJobApplications
);
router.get(
  '/my-applications',
  authorizeRoles('worker'),
  applicationController.getMyApplications
);
router.put(
  '/:id/applications/:appId',
  authorizeRoles('hirer'),
  validate(applicationValidation.updateStatus),
  applicationController.updateApplicationStatus
);

// Saved jobs routes for workers
router.post(
  '/:id/save',
  authorizeRoles('worker'),
  savedJobsController.saveJob
);
router.delete(
  '/:id/save',
  authorizeRoles('worker'),
  savedJobsController.unsaveJob
);
router.get(
  '/saved',
  authorizeRoles('worker'),
  savedJobsController.getSavedJobs
);

module.exports = router; 