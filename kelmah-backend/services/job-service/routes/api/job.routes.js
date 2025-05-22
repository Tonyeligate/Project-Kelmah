/**
 * Job Routes
 * Handles routes for job operations
 */

const express = require('express');
const router = express.Router();
const jobController = require('../../controllers/job.controller');
const searchController = require('../../controllers/search.controller');
const recommendationController = require('../../controllers/recommendation.controller');
const { authenticate, authorize } = require('../../middleware/auth');

// Public job routes
router.get('/public', jobController.getPublicJobs);
router.get('/public/:id', jobController.getPublicJobById);

// Search routes
router.get('/search/suggestions', searchController.getSearchSuggestions);
router.get('/search/advanced', searchController.searchJobs);
router.get('/search/nearby', jobController.getNearbyJobs);

// Job detail routes
router.get('/:id', authenticate, jobController.getJobById);
router.get('/:id/applications', authenticate, jobController.getJobApplications);
router.get('/:id/related', jobController.getRelatedJobs);

// Protected job routes (require authentication)
router.post('/', authenticate, authorize(['hirer', 'admin']), jobController.createJob);
router.put('/:id', authenticate, authorize(['hirer', 'admin']), jobController.updateJob);
router.delete('/:id', authenticate, authorize(['hirer', 'admin']), jobController.deleteJob);
router.post('/:id/publish', authenticate, authorize(['hirer', 'admin']), jobController.publishJob);
router.post('/:id/unpublish', authenticate, authorize(['hirer', 'admin']), jobController.unpublishJob);

// Job application routes
router.post('/:id/apply', authenticate, authorize(['worker']), jobController.applyForJob);
router.get('/user/posted', authenticate, authorize(['hirer', 'admin']), jobController.getUserPostedJobs);
router.get('/user/applications', authenticate, authorize(['worker']), jobController.getUserApplications);

// Recommendation routes
router.get('/recommendations/for-user', authenticate, recommendationController.getRecommendedJobs);
router.get('/recommendations/similar/:jobId', recommendationController.getSimilarJobs);
router.get('/recommendations/trending', recommendationController.getTrendingJobs);

// Export router
module.exports = router; 