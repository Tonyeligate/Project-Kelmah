const express = require('express');
const router = express.Router({ mergeParams: true });

const { verifyGatewayRequest, optionalGatewayVerification } = require('../../../shared/middlewares/serviceTrust');
const WorkerController = require('../controllers/worker.controller');
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
router.get('/skills', optionalGatewayVerification, WorkerController.getWorkerSkills);
router.put('/skills/bulk', verifyGatewayRequest, requireOwnership, WorkerController.upsertWorkerSkillsBulk);
router.post('/skills', verifyGatewayRequest, requireOwnership, WorkerController.createWorkerSkill);
router.put('/skills/:skillId', verifyGatewayRequest, requireOwnership, WorkerController.updateWorkerSkill);
router.delete('/skills/:skillId', verifyGatewayRequest, requireOwnership, WorkerController.deleteWorkerSkill);

// Certificates
router.get('/certificates', optionalGatewayVerification, WorkerController.getWorkerCertificates);
router.post('/certificates', verifyGatewayRequest, requireOwnership, WorkerController.addWorkerCertificate);
router.put('/certificates/:certificateId', verifyGatewayRequest, requireOwnership, WorkerController.updateWorkerCertificate);
router.delete('/certificates/:certificateId', verifyGatewayRequest, requireOwnership, WorkerController.deleteWorkerCertificate);

// Work history
router.get('/work-history', optionalGatewayVerification, WorkerController.getWorkerWorkHistory);
router.post('/work-history', verifyGatewayRequest, requireOwnership, WorkerController.addWorkHistoryEntry);
router.put('/work-history/:entryId', verifyGatewayRequest, requireOwnership, WorkerController.updateWorkHistoryEntry);
router.delete('/work-history/:entryId', verifyGatewayRequest, requireOwnership, WorkerController.deleteWorkHistoryEntry);

// Portfolio
router.get('/portfolio', optionalGatewayVerification, WorkerController.getWorkerPortfolio);
router.post('/portfolio', verifyGatewayRequest, requireOwnership, WorkerController.createWorkerPortfolioItem);
router.put('/portfolio/:portfolioId', verifyGatewayRequest, requireOwnership, WorkerController.updateWorkerPortfolioItem);
router.delete('/portfolio/:portfolioId', verifyGatewayRequest, requireOwnership, WorkerController.deleteWorkerPortfolioItem);

// Analytics
router.get('/analytics/skills', optionalGatewayVerification, WorkerAnalyticsController.skills);
router.get('/analytics/work-history', optionalGatewayVerification, WorkerAnalyticsController.workHistory);
router.get('/analytics/ratings', optionalGatewayVerification, WorkerAnalyticsController.ratings);

module.exports = router;
