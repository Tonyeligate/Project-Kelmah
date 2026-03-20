# Kelmah Frontend Purpose Audit Findings

**Date**: March 19, 2026

## What The Scan Found
- Saved searches and advanced filters are referenced but missing as real files, which weakens repeat discovery and rare-trade matching.
- Training recommendations and skill-gap analysis exist as placeholders, so workers do not get a strong path from current skills to higher-demand work.
- Smart recommendations exist but still need explainability and demand weighting so workers understand why a job is suggested.
- Profile completion is visible, but the UI does not explain the business value of finishing missing fields.
- Worker dashboard guidance is shallow after the first activity; it should guide the next skill, next bid, or next earning step.
- Job posting screens need demand preview and similar-job context so hirers can price and scope jobs better.
- Worker comparison and proposal review need more trust and suitability signals than rating and rate alone.
- Home discovery needs stronger trade depth, demand heat, and rare vocation visibility.
- Mobile Money and notification flows need low-literacy support, visual guidance, and SMS/audio fallback.
- Messaging needs quick replies and simpler response paths for workers who type slowly.
- Contracts need clearer escrow and dispute guidance for trust-sensitive transactions.
- Search forms and category surfaces still underrepresent niche trades and high-demand vocational categories.

## Highest Priority File Gaps
- [kelmah-frontend/src/modules/search/SavedSearches.jsx](kelmah-frontend/src/modules/search/SavedSearches.jsx)
- [kelmah-frontend/src/modules/search/AdvancedFilters.jsx](kelmah-frontend/src/modules/search/AdvancedFilters.jsx)
- [kelmah-frontend/src/modules/worker/components/TrainingRecommendations.jsx](kelmah-frontend/src/modules/worker/components/TrainingRecommendations.jsx)
- [kelmah-frontend/src/modules/worker/components/SkillGapAnalysis.jsx](kelmah-frontend/src/modules/worker/components/SkillGapAnalysis.jsx)
- [kelmah-frontend/src/modules/worker/components/ProfileCompletionCard.jsx](kelmah-frontend/src/modules/worker/components/ProfileCompletionCard.jsx)
- [kelmah-frontend/src/modules/hirer/pages/JobPostingPage.jsx](kelmah-frontend/src/modules/hirer/pages/JobPostingPage.jsx)
- [kelmah-frontend/src/modules/hirer/components/WorkerComparisonTable.jsx](kelmah-frontend/src/modules/hirer/components/WorkerComparisonTable.jsx)
- [kelmah-frontend/src/modules/jobs/pages/JobAlertsPage.jsx](kelmah-frontend/src/modules/jobs/pages/JobAlertsPage.jsx)
- [kelmah-frontend/src/modules/search/components/SmartJobRecommendations.jsx](kelmah-frontend/src/modules/search/components/SmartJobRecommendations.jsx)
- [kelmah-frontend/src/modules/search/components/WorkerDirectoryExperience.jsx](kelmah-frontend/src/modules/search/components/WorkerDirectoryExperience.jsx)
- [kelmah-frontend/src/modules/worker/components/WorkerProfile.jsx](kelmah-frontend/src/modules/worker/components/WorkerProfile.jsx)
- [kelmah-frontend/src/modules/layout/components/MobileBottomNav.jsx](kelmah-frontend/src/modules/layout/components/MobileBottomNav.jsx)
- [kelmah-frontend/src/modules/jobs/components/BidSubmissionForm.jsx](kelmah-frontend/src/modules/jobs/components/BidSubmissionForm.jsx)
- [kelmah-frontend/src/modules/reviews/pages/ReviewsPage.jsx](kelmah-frontend/src/modules/reviews/pages/ReviewsPage.jsx)
- [kelmah-frontend/src/modules/payment/components/GhanaMobileMoneyPayment.jsx](kelmah-frontend/src/modules/payment/components/GhanaMobileMoneyPayment.jsx)
- [kelmah-frontend/src/modules/worker/components/NearbyWorkersWidget.jsx](kelmah-frontend/src/modules/worker/components/NearbyWorkersWidget.jsx)
- [kelmah-frontend/src/modules/hirer/components/ProposalReview.jsx](kelmah-frontend/src/modules/hirer/components/ProposalReview.jsx)
- [kelmah-frontend/src/modules/worker/components/PortfolioManager.jsx](kelmah-frontend/src/modules/worker/components/PortfolioManager.jsx)
- [kelmah-frontend/src/modules/contracts/pages/CreateContractPage.jsx](kelmah-frontend/src/modules/contracts/pages/CreateContractPage.jsx)
- [kelmah-frontend/src/modules/common/components/forms/SearchForm.jsx](kelmah-frontend/src/modules/common/components/forms/SearchForm.jsx)
- [kelmah-frontend/src/modules/layout/components/Footer.jsx](kelmah-frontend/src/modules/layout/components/Footer.jsx)
- [kelmah-frontend/src/modules/worker/pages/SkillsAssessmentPage.jsx](kelmah-frontend/src/modules/worker/pages/SkillsAssessmentPage.jsx)
- [kelmah-frontend/src/modules/hirer/pages/HirerDashboardPage.jsx](kelmah-frontend/src/modules/hirer/pages/HirerDashboardPage.jsx)
- [kelmah-frontend/src/modules/notifications/pages/NotificationsPage.jsx](kelmah-frontend/src/modules/notifications/pages/NotificationsPage.jsx)
- [kelmah-frontend/src/modules/messaging/pages/MessagingPage.jsx](kelmah-frontend/src/modules/messaging/pages/MessagingPage.jsx)
- [kelmah-frontend/src/modules/premium/pages/PremiumPage.jsx](kelmah-frontend/src/modules/premium/pages/PremiumPage.jsx)
- [kelmah-frontend/src/modules/map/components/common/LocationSelector.jsx](kelmah-frontend/src/modules/map/components/common/LocationSelector.jsx)

## Product Themes To Expand Next
1. Saved searches and alert triggers.
2. Rare trade discovery and deeper taxonomy.
3. Demand indicators and recommendation explainability.
4. Worker skill growth and training paths.
5. Hirer confidence, comparison, and job quality hints.
6. Low-literacy mobile flows, especially payments and notifications.
7. Trust, dispute, and contract clarity.
8. Location-aware matching and service radius.
9. Messaging shortcuts and quick responses.
10. Home, footer, and onboarding guidance for first-time users.

## Notes
- The codebase already has many of the primitives needed for these features, but they are not surfaced consistently enough for the platform mission.
- The biggest product gap is not raw feature count; it is the lack of a single, obvious path from demand -> discovery -> trust -> booking -> completion.
