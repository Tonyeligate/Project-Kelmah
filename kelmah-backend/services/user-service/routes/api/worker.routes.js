const express = require('express');
const router = express.Router();
const workerController = require('../../controllers/worker.controller');
const searchController = require('../../controllers/worker-search.controller');
const { authMiddleware, roleMiddleware } = require('../../middleware/auth.middleware');

// Worker profile routes
router.get('/profile/:id', workerController.getWorkerProfile);
router.get('/profiles', workerController.getWorkerProfiles);
router.put('/profile', authMiddleware, roleMiddleware(['worker']), workerController.updateWorkerProfile);

// Worker search routes
router.get('/search', searchController.searchWorkers);
router.get('/nearby', searchController.nearbyWorkers);
router.post('/recommend', searchController.recommendWorkers);

module.exports = router; 