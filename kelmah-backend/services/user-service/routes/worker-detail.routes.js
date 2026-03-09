const express = require('express');
const router = express.Router({ mergeParams: true });

const { verifyGatewayRequest, optionalGatewayVerification } = require('../../../shared/middlewares/serviceTrust');
const WorkerSkillsController = require('../controllers/worker/skills.controller');
const WorkerCertificatesController = require('../controllers/worker/certificates.controller');
const WorkerWorkHistoryController = require('../controllers/worker/workHistory.controller');
const WorkerPortfolioController = require('../controllers/worker/portfolio.controller');
const WorkerAnalyticsController = require('../controllers/worker/analytics.controller');

// Ownership middleware — ensures authenticated user can only mutate their own profile
const requireOwnership = (req, res, next) => {
  const userId = req.user?.id || req.user?.sub || req.user?.userId;
  const targetWorkerId = req.params.workerId || req.params.id;
  if (userId !== targetWorkerId && req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden: you can only modify your own profile' });
  }
  next();
};

// Skills
router.get('/skills', optionalGatewayVerification, WorkerSkillsController.list);
router.post('/skills', verifyGatewayRequest, requireOwnership, WorkerSkillsController.create);
router.put('/skills/:skillId', verifyGatewayRequest, requireOwnership, WorkerSkillsController.update);
router.delete('/skills/:skillId', verifyGatewayRequest, requireOwnership, WorkerSkillsController.remove);

// Certificates (read-only alias to certificates controller for unified path)
router.get('/certificates', optionalGatewayVerification, WorkerCertificatesController.list);
router.post('/certificates', verifyGatewayRequest, requireOwnership, WorkerCertificatesController.create);
router.put('/certificates/:certificateId', verifyGatewayRequest, requireOwnership, WorkerCertificatesController.update);
router.delete('/certificates/:certificateId', verifyGatewayRequest, requireOwnership, WorkerCertificatesController.remove);

// Work history
router.get('/work-history', optionalGatewayVerification, WorkerWorkHistoryController.list);
router.post('/work-history', verifyGatewayRequest, requireOwnership, WorkerWorkHistoryController.create);
router.put('/work-history/:entryId', verifyGatewayRequest, requireOwnership, WorkerWorkHistoryController.update);
router.delete('/work-history/:entryId', verifyGatewayRequest, requireOwnership, WorkerWorkHistoryController.remove);

// Portfolio (read alias for /api/profile routes, but exposed under /users/workers)
router.get('/portfolio', optionalGatewayVerification, WorkerPortfolioController.list);

// Analytics
router.get('/analytics/skills', optionalGatewayVerification, WorkerAnalyticsController.skills);
router.get('/analytics/work-history', optionalGatewayVerification, WorkerAnalyticsController.workHistory);
router.get('/analytics/ratings', optionalGatewayVerification, WorkerAnalyticsController.ratings);

module.exports = router;
