/**
 * Job Routes
 */

const express = require("express");
const { validate } = require("../middlewares/validator");
const { verifyGatewayRequest, optionalGatewayVerification } = require("../../../shared/middlewares/serviceTrust");
let createLimiter;
try {
  ({ createLimiter } = require('../../../shared/middlewares/rateLimiter'));
} catch (_) {
  // Fallback: no-op limiter to avoid crashing when shared limiter isn't available in the image
  createLimiter = () => (req, res, next) => next();
}
const jobValidation = require("../validations/job.validation");
const jobController = require("../controllers/job.controller");

// Authorization helper function
const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user || !req.user.role) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden: insufficient role" });
  }
  next();
};

const router = express.Router();

// Public routes
router.get("/", jobController.getJobs);
router.get("/search", jobController.advancedJobSearch);
router.get("/dashboard", jobController.getDashboardJobs);
router.get("/categories", jobController.getJobCategories);
router.get("/contracts", jobController.getContracts); // ✅ MOVED: Make contracts publicly accessible
router.get("/contracts/:id", jobController.getContractById);
router.post("/contracts/:id/disputes", verifyGatewayRequest, jobController.createContractDispute);

// Protected routes
router.use(verifyGatewayRequest);

// Hirer only routes
router.post(
  "/",
  authorizeRoles("hirer"),
  createLimiter('payments'),
  validate(jobValidation.createJob),
  jobController.createJob,
);

router.get("/my-jobs", authorizeRoles("hirer"), jobController.getMyJobs);

router.put(
  "/:id",
  authorizeRoles("hirer"),
  createLimiter('payments'),
  validate(jobValidation.updateJob),
  jobController.updateJob,
);

router.delete("/:id", authorizeRoles("hirer"), createLimiter('payments'), jobController.deleteJob);

router.patch(
  "/:id/status",
  authorizeRoles("hirer"),
  createLimiter('payments'),
  validate(jobValidation.changeJobStatus),
  jobController.changeJobStatus,
);

// Job matching routes
router.get("/recommendations", authorizeRoles("worker"), jobController.getJobRecommendations);
router.get("/:id/worker-matches", authorizeRoles("hirer"), jobController.getWorkerMatches);

// Applications
router.post('/:id/apply', authorizeRoles('worker'), createLimiter('default'), jobController.applyToJob);
router.get('/:id/applications', authorizeRoles('hirer'), jobController.getJobApplications);
router.put('/:id/applications/:applicationId', authorizeRoles('hirer'), jobController.updateApplicationStatus);
router.delete('/:id/applications/:applicationId', authorizeRoles('worker'), jobController.withdrawApplication);

// Saved jobs
router.get('/saved', jobController.getSavedJobs);
router.post('/:id/save', jobController.saveJob);
router.delete('/:id/save', jobController.unsaveJob);

// Analytics routes (admin only)
router.get("/analytics", authorizeRoles("admin"), jobController.getJobAnalytics);

// Worker-centric routes
router.get('/assigned', authorizeRoles('worker'), jobController.getMyAssignedJobs);
router.get('/applications/me', authorizeRoles('worker'), jobController.getMyApplications);

// Enhanced Job Distribution Routes
// Location-based job filtering
router.get('/location', jobController.getJobsByLocation);
router.get('/skill/:skill', jobController.getJobsBySkill);
router.get('/tier/:tier', jobController.getJobsByPerformanceTier);

// Personalized recommendations
router.get('/recommendations/personalized', authorizeRoles('worker'), jobController.getPersonalizedJobRecommendations);

// Job management (hirer only)
router.patch('/:id/close-bidding', authorizeRoles('hirer'), jobController.closeJobBidding);
router.patch('/:id/extend-deadline', authorizeRoles('hirer'), jobController.extendJobDeadline);
router.patch('/:id/renew', authorizeRoles('hirer'), jobController.renewJob);

// Admin routes
router.get('/expired', authorizeRoles('admin'), jobController.getExpiredJobs);

// Keep the catch-all ID route LAST to avoid shadowing specific routes like /my-jobs
router.get('/:id', jobController.getJobById);

module.exports = router;
