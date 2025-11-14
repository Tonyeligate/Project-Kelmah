const express = require('express');
const router = express.Router({ mergeParams: true });

const { verifyGatewayRequest, optionalGatewayVerification } = require('../../../shared/middlewares/serviceTrust');
const WorkerSkillsController = require('../controllers/worker/skills.controller');
const WorkerCertificatesController = require('../controllers/worker/certificates.controller');
const WorkerWorkHistoryController = require('../controllers/worker/workHistory.controller');
const WorkerPortfolioController = require('../controllers/worker/portfolio.controller');
const WorkerAnalyticsController = require('../controllers/worker/analytics.controller');

// Skills
router.get('/skills', optionalGatewayVerification, WorkerSkillsController.list);
router.post('/skills', verifyGatewayRequest, WorkerSkillsController.create);
router.put('/skills/:skillId', verifyGatewayRequest, WorkerSkillsController.update);
router.delete('/skills/:skillId', verifyGatewayRequest, WorkerSkillsController.remove);

// Certificates (read-only alias to certificates controller for unified path)
router.get('/certificates', optionalGatewayVerification, WorkerCertificatesController.list);
router.post('/certificates', verifyGatewayRequest, WorkerCertificatesController.create);
router.put('/certificates/:certificateId', verifyGatewayRequest, WorkerCertificatesController.update);
router.delete('/certificates/:certificateId', verifyGatewayRequest, WorkerCertificatesController.remove);

// Work history
router.get('/work-history', optionalGatewayVerification, WorkerWorkHistoryController.list);
router.post('/work-history', verifyGatewayRequest, WorkerWorkHistoryController.create);
router.put('/work-history/:entryId', verifyGatewayRequest, WorkerWorkHistoryController.update);
router.delete('/work-history/:entryId', verifyGatewayRequest, WorkerWorkHistoryController.remove);

// Portfolio (read alias for /api/profile routes, but exposed under /users/workers)
router.get('/portfolio', optionalGatewayVerification, WorkerPortfolioController.list);

// Analytics
router.get('/analytics/skills', optionalGatewayVerification, WorkerAnalyticsController.skills);
router.get('/analytics/work-history', optionalGatewayVerification, WorkerAnalyticsController.workHistory);
router.get('/analytics/ratings', optionalGatewayVerification, WorkerAnalyticsController.ratings);

module.exports = router;
