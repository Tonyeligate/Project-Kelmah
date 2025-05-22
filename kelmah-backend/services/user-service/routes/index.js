const express = require('express');
const router = express.Router();
const authRoutes = require('./auth.routes');
const workerRoutes = require('./worker.routes');
const earningsRoutes = require('./earnings.routes');
const documentRoutes = require('./document.routes');
const assessmentRoutes = require('./assessment.routes');
const reviewRoutes = require('./review.routes');
const notificationRoutes = require('./notification.routes');
const searchRoutes = require('./search.routes');
const savedSearchRoutes = require('./saved-search.routes');
const fraudDetectionRoutes = require('./fraud-detection.routes');
const skillRoutes = require('./skill.routes');
const systemConfigController = require('../controllers/system-config.controller');

// Mount routes
router.use('/auth', authRoutes);
router.use('/worker', workerRoutes);
router.use('/worker', earningsRoutes);
router.use('/worker', documentRoutes);
router.use('/worker', assessmentRoutes);
router.use('/worker', reviewRoutes);
router.use('/notifications', notificationRoutes);
router.use('/search', searchRoutes);
router.use('/saved-searches', savedSearchRoutes);
router.use('/fraud-detection', fraudDetectionRoutes);
router.use('/skills', skillRoutes);

// Public system configurations route
router.get('/config/public', systemConfigController.getPublicConfigs);

module.exports = router; 