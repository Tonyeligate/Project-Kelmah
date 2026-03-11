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
router.get("/", jobController.getJobs);
router.get("/search", jobController.advancedJobSearch);
router.get("/dashboard", verifyGatewayRequest, jobController.getDashboardJobs); // Protected dashboard route
router.get("/categories", jobController.getJobCategories);
router.get('/suggestions', jobController.getSearchSuggestions);
router.get("/stats", jobController.getPlatformStats); // ✅ PUBLIC: Platform statistics
router.post("/contracts/:id/disputes", verifyGatewayRequest, jobController.createContractDispute);
router.get('/:id([a-fA-F0-9]{24})', optionalGatewayVerification, jobController.getJobById);

// MED-15 FIX: Milestone reads moved behind auth guard (contain sensitive payment/contract data)

// Protected routes
router.use(verifyGatewayRequest);

// Milestone reads (protected — require authentication)
router.get("/milestones/contract/:contractId", jobController.getContractMilestones);
router.get("/milestones/:milestoneId", jobController.getMilestoneById);

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

// ── Literal GET routes (MUST come before any /:id param routes) ──────────────
router.get('/proposals', authorizeRoles('hirer'), jobController.getHirerProposals);
router.get('/saved', authorizeRoles('worker', 'hirer'), jobController.getSavedJobs);
router.get("/analytics", authorizeRoles("admin"), jobController.getJobAnalytics);
router.get('/assigned', authorizeRoles('worker'), jobController.getMyAssignedJobs);
router.get('/applications/me', authorizeRoles('worker'), jobController.getMyApplications);
router.get('/applications/received-summary', authorizeRoles('hirer'), jobController.getHirerApplicationsSummary);
router.get('/location', jobController.getJobsByLocation);
router.get('/expired', authorizeRoles('admin'), jobController.getExpiredJobs);
router.get('/recommendations/personalized', authorizeRoles('worker'), jobController.getPersonalizedJobRecommendations);
router.get("/recommendations", authorizeRoles("worker"), jobController.getJobRecommendations);
router.get('/skill/:skill', jobController.getJobsBySkill);
router.get('/tier/:tier', jobController.getJobsByPerformanceTier);

// ── Param-prefixed routes (/:id/...) ─────────────────────────────────────────
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

router.get("/:id/worker-matches", authorizeRoles("hirer"), jobController.getWorkerMatches);

// Applications
router.post('/:id/apply', authorizeRoles('worker'), createLimiter('default'), jobController.applyToJob);
router.get('/:id/applications', authorizeRoles('hirer'), jobController.getJobApplications);
router.put('/:id/applications/:applicationId', authorizeRoles('hirer'), jobController.updateApplicationStatus);
router.delete('/:id/applications/:applicationId', authorizeRoles('worker'), jobController.withdrawApplication);

// Saved jobs (param routes)
router.post('/:id/save', authorizeRoles('worker', 'hirer'), jobController.saveJob);
router.delete('/:id/save', authorizeRoles('worker', 'hirer'), jobController.unsaveJob);

// Job management (hirer only)
router.patch('/:id/close-bidding', authorizeRoles('hirer'), jobController.closeJobBidding);
router.patch('/:id/extend-deadline', authorizeRoles('hirer'), jobController.extendJobDeadline);
router.patch('/:id/renew', authorizeRoles('hirer'), jobController.renewJob);

module.exports = router;
