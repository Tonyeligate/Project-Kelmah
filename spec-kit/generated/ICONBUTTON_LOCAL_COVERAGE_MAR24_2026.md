# IconButton Local Coverage Audit (Mar 24, 2026)

## Summary
- Scope: src/modules
- Methodology: AST-based JSX parse (@babel/parser + @babel/traverse); local focus detected when focus-visible token exists in IconButton opening attributes, primarily sx.
- Files with IconButton: 84
- Total IconButton tags: 194
- With local sx: 194
- With local focus-visible in tag: 194
- Without local sx: 0
- Without local focus-visible in tag: 0

## Top Files By Missing Local Focus
| File | Total | Local sx | Local focus | Missing local sx | Missing local focus |
|---|---:|---:|---:|---:|---:|
| src/modules/messaging/pages/MessagingPage.jsx | 13 | 13 | 13 | 0 | 0 |
| src/modules/hirer/pages/JobManagementPage.jsx | 8 | 8 | 8 | 0 | 0 |
| src/modules/map/pages/ProfessionalMapPage.jsx | 7 | 7 | 7 | 0 | 0 |
| src/modules/worker/components/WorkerProfile.jsx | 6 | 6 | 6 | 0 | 0 |
| src/modules/map/components/common/MapSearchOverlay.jsx | 5 | 5 | 5 | 0 | 0 |
| src/modules/payment/pages/PaymentMethodsPage.jsx | 5 | 5 | 5 | 0 | 0 |
| src/modules/worker/components/ProjectGallery.jsx | 5 | 5 | 5 | 0 | 0 |
| src/modules/worker/pages/MyApplicationsPage.jsx | 5 | 5 | 5 | 0 | 0 |
| src/modules/map/components/common/InteractiveMap.jsx | 4 | 4 | 4 | 0 | 0 |
| src/modules/messaging/components/common/AttachmentPreview.jsx | 4 | 4 | 4 | 0 | 0 |
| src/modules/messaging/components/common/MessageAttachments.jsx | 4 | 4 | 4 | 0 | 0 |
| src/modules/quickjobs/pages/QuickJobTrackingPage.jsx | 4 | 4 | 4 | 0 | 0 |
| src/modules/worker/components/CertificateUploader.jsx | 4 | 4 | 4 | 0 | 0 |
| src/modules/jobs/components/JobResultsSection.jsx | 3 | 3 | 3 | 0 | 0 |
| src/modules/jobs/pages/JobDetailsPage.jsx | 3 | 3 | 3 | 0 | 0 |
| src/modules/messaging/components/common/ConversationList.jsx | 3 | 3 | 3 | 0 | 0 |
| src/modules/messaging/components/common/MessageInput.jsx | 3 | 3 | 3 | 0 | 0 |
| src/modules/quickjobs/pages/QuickJobRequestPage.jsx | 3 | 3 | 3 | 0 | 0 |
| src/modules/search/components/SavedSearches.jsx | 3 | 3 | 3 | 0 | 0 |
| src/modules/search/components/SmartJobRecommendations.jsx | 3 | 3 | 3 | 0 | 0 |
| src/modules/worker/components/EarningsTracker.jsx | 3 | 3 | 3 | 0 | 0 |
| src/modules/worker/pages/JobSearchPage.jsx | 3 | 3 | 3 | 0 | 0 |
| src/modules/worker/pages/WorkerProfileEditPage.jsx | 3 | 3 | 3 | 0 | 0 |
| src/modules/auth/components/mobile/MobileLogin.jsx | 2 | 2 | 2 | 0 | 0 |
| src/modules/auth/components/mobile/MobileRegister.jsx | 2 | 2 | 2 | 0 | 0 |
| src/modules/auth/components/register/Register.jsx | 2 | 2 | 2 | 0 | 0 |
| src/modules/hirer/components/HirerJobManagement.jsx | 2 | 2 | 2 | 0 | 0 |
| src/modules/hirer/components/JobProgressTracker.jsx | 2 | 2 | 2 | 0 | 0 |
| src/modules/hirer/components/PaymentRelease.jsx | 2 | 2 | 2 | 0 | 0 |
| src/modules/hirer/components/ProposalReview.jsx | 2 | 2 | 2 | 0 | 0 |
| src/modules/hirer/pages/JobBidsPage.jsx | 2 | 2 | 2 | 0 | 0 |
| src/modules/jobs/components/BidSubmissionForm.jsx | 2 | 2 | 2 | 0 | 0 |
| src/modules/jobs/components/common/JobFilters.jsx | 2 | 2 | 2 | 0 | 0 |
| src/modules/jobs/components/job-application/JobApplication.jsx | 2 | 2 | 2 | 0 | 0 |
| src/modules/jobs/components/JobsCardsGrid.jsx | 2 | 2 | 2 | 0 | 0 |
| src/modules/layout/components/Footer.jsx | 2 | 2 | 2 | 0 | 0 |
| src/modules/messaging/components/common/EmojiPicker.jsx | 2 | 2 | 2 | 0 | 0 |
| src/modules/messaging/components/common/Message.jsx | 2 | 2 | 2 | 0 | 0 |
| src/modules/messaging/components/common/MessageSearch.jsx | 2 | 2 | 2 | 0 | 0 |
| src/modules/payment/components/PaymentMethodCard.jsx | 2 | 2 | 2 | 0 | 0 |
| src/modules/payment/components/TransactionHistory.jsx | 2 | 2 | 2 | 0 | 0 |
| src/modules/payment/pages/PaymentCenterPage.jsx | 2 | 2 | 2 | 0 | 0 |
| src/modules/quickjobs/pages/NearbyJobsPage.jsx | 2 | 2 | 2 | 0 | 0 |
| src/modules/reviews/pages/ReviewsPage.jsx | 2 | 2 | 2 | 0 | 0 |
| src/modules/scheduling/pages/SchedulingPage.jsx | 2 | 2 | 2 | 0 | 0 |
| src/modules/search/components/LocationBasedSearch.jsx | 2 | 2 | 2 | 0 | 0 |
| src/modules/search/components/WorkerDirectoryExperience.jsx | 2 | 2 | 2 | 0 | 0 |
| src/modules/worker/components/AdvancedCalendar.jsx | 2 | 2 | 2 | 0 | 0 |
| src/modules/worker/components/AvailabilityCalendar.jsx | 2 | 2 | 2 | 0 | 0 |
| src/modules/worker/components/DocumentVerification.jsx | 2 | 2 | 2 | 0 | 0 |
| src/modules/worker/components/EnhancedJobCard.jsx | 2 | 2 | 2 | 0 | 0 |
| src/modules/worker/components/PortfolioManager.jsx | 2 | 2 | 2 | 0 | 0 |
| src/modules/auth/components/common/AuthWrapper.jsx | 1 | 1 | 1 | 0 | 0 |
| src/modules/auth/components/login/Login.jsx | 1 | 1 | 1 | 0 | 0 |
| src/modules/auth/pages/ForgotPasswordPage.jsx | 1 | 1 | 1 | 0 | 0 |
| src/modules/common/components/forms/SearchForm.jsx | 1 | 1 | 1 | 0 | 0 |
| src/modules/common/components/layout/PageHeader.jsx | 1 | 1 | 1 | 0 | 0 |
| src/modules/contracts/components/common/ContractForm.jsx | 1 | 1 | 1 | 0 | 0 |
| src/modules/contracts/pages/ContractsPage.jsx | 1 | 1 | 1 | 0 | 0 |
| src/modules/contracts/pages/CreateContractPage.jsx | 1 | 1 | 1 | 0 | 0 |
| src/modules/hirer/components/WorkerReview.jsx | 1 | 1 | 1 | 0 | 0 |
| src/modules/hirer/pages/HirerDashboardPage.jsx | 1 | 1 | 1 | 0 | 0 |
| src/modules/hirer/pages/HirerQuickJobTrackingPage.jsx | 1 | 1 | 1 | 0 | 0 |
| src/modules/hirer/pages/JobPostingPage.jsx | 1 | 1 | 1 | 0 | 0 |
| src/modules/jobs/components/common/CreateJobDialog.jsx | 1 | 1 | 1 | 0 | 0 |
| src/modules/jobs/components/common/JobSearch.jsx | 1 | 1 | 1 | 0 | 0 |
| src/modules/jobs/components/JobsMobileFilterDrawer.jsx | 1 | 1 | 1 | 0 | 0 |
| src/modules/layout/components/MobileNav.jsx | 1 | 1 | 1 | 0 | 0 |
| src/modules/layout/components/sidebar/Sidebar.jsx | 1 | 1 | 1 | 0 | 0 |
| src/modules/map/components/common/LocationSelector.jsx | 1 | 1 | 1 | 0 | 0 |
| src/modules/messaging/components/common/Chatbox.jsx | 1 | 1 | 1 | 0 | 0 |
| src/modules/notifications/components/NotificationItem.jsx | 1 | 1 | 1 | 0 | 0 |
| src/modules/notifications/pages/NotificationsPage.jsx | 1 | 1 | 1 | 0 | 0 |
| src/modules/payment/components/PaymentAnalyticsDashboard.jsx | 1 | 1 | 1 | 0 | 0 |
| src/modules/premium/pages/PremiumPage.jsx | 1 | 1 | 1 | 0 | 0 |
| src/modules/profile/components/ProfilePicture.jsx | 1 | 1 | 1 | 0 | 0 |
| src/modules/search/components/common/CompactSearchBar.jsx | 1 | 1 | 1 | 0 | 0 |
| src/modules/search/components/common/MobileFilterDrawer.jsx | 1 | 1 | 1 | 0 | 0 |
| src/modules/settings/components/common/SecuritySettings.jsx | 1 | 1 | 1 | 0 | 0 |
| src/modules/settings/pages/SettingsPage.jsx | 1 | 1 | 1 | 0 | 0 |
