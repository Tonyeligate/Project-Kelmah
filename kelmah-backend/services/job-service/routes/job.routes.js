/**
 * Job Routes
 */

const express = require("express");
const { validate } = require("../middlewares/validator");
const { verifyGatewayRequest, optionalGatewayVerification } = require("../../../shared/middlewares/serviceTrust");
const { dbReady } = require("../middlewares/dbReady");
const { errorResponse } = require("../utils/response");
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
    return errorResponse(res, 401, "Not authenticated", "NOT_AUTHENTICATED");
  }
  if (!roles.includes(req.user.role)) {
    return errorResponse(res, 403, "Forbidden: insufficient role", "FORBIDDEN");
  }
  next();
};

const router = express.Router();

// Apply DB ready check to ALL routes
router.use(dbReady);

// Public routes - handle both with and without trailing slashes
router.get("/", (req, res, next) => {
  console.log(`[JOB ROUTES] GET / matched! Query:`, req.query);
  console.log(`[JOB ROUTES] req.path:`, req.path);
  console.log(`[JOB ROUTES] req.url:`, req.url);
  jobController.getJobs(req, res, next);
});
router.get("/search", jobController.advancedJobSearch);
router.get("/dashboard", verifyGatewayRequest, jobController.getDashboardJobs); // Protected dashboard route
router.get("/categories", jobController.getJobCategories);
router.get('/suggestions', jobController.getSearchSuggestions);
router.get("/stats", jobController.getPlatformStats); // ✅ PUBLIC: Platform statistics
// Contract read routes moved to protected section below
router.post("/contracts/:id/disputes", verifyGatewayRequest, jobController.createContractDispute);
router.get('/:id([a-fA-F0-9]{24})', jobController.getJobById);

// Milestone routes (publicly accessible reads, protected writes)
router.get("/milestones/contract/:contractId", jobController.getContractMilestones);
router.get("/milestones/:milestoneId", jobController.getMilestoneById);

// Protected routes
router.use(verifyGatewayRequest);

// Contract routes (protected - require authentication)
router.get("/contracts", jobController.getContracts);
router.get("/contracts/:id", jobController.getContractById);
router.put("/contracts/:id", jobController.updateContract);
router.put("/contracts/:contractId/milestones/:milestoneId/approve", jobController.approveMilestone);

// Milestone CRUD (protected writes)
router.post("/milestones/contract/:contractId", jobController.createMilestone);
router.put("/milestones/:milestoneId", jobController.updateMilestone);
router.delete("/milestones/:milestoneId", jobController.deleteMilestone);
router.patch("/milestones/:milestoneId/pay", jobController.payMilestone);

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
router.get('/proposals', authorizeRoles('hirer'), jobController.getHirerProposals);

// Saved jobs (require authentication)
router.get('/saved', authorizeRoles('worker', 'hirer'), jobController.getSavedJobs);
router.post('/:id/save', authorizeRoles('worker', 'hirer'), jobController.saveJob);
router.delete('/:id/save', authorizeRoles('worker', 'hirer'), jobController.unsaveJob);

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

module.exports = router;
