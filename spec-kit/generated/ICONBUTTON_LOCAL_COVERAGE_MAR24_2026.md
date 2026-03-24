# IconButton Local Coverage Audit (Mar 24, 2026)

## Summary
- Scope: kelmah-frontend/src/modules
- Files with IconButton: 85
- Total IconButton tags: 195
- With local sx: 101
- With local focus-visible in tag: 47
- Without local sx: 94
- Without local focus-visible in tag: 148

## Top Files By Missing Local Focus
| File | Total | Local sx | Local focus | Missing local sx | Missing local focus |
|---|---:|---:|---:|---:|---:|
| kelmah-frontend/src/modules/messaging/pages/MessagingPage.jsx | 13 | 4 | 4 | 9 | 9 |
| kelmah-frontend/src/modules/hirer/pages/JobManagementPage.jsx | 8 | 1 | 0 | 7 | 8 |
| kelmah-frontend/src/modules/map/pages/ProfessionalMapPage.jsx | 7 | 1 | 1 | 6 | 6 |
| kelmah-frontend/src/modules/worker/components/WorkerProfile.jsx | 6 | 4 | 0 | 2 | 6 |
| kelmah-frontend/src/modules/worker/pages/MyApplicationsPage.jsx | 5 | 0 | 0 | 5 | 5 |
| kelmah-frontend/src/modules/map/components/common/MapSearchOverlay.jsx | 5 | 5 | 0 | 0 | 5 |
| kelmah-frontend/src/modules/quickjobs/pages/QuickJobTrackingPage.jsx | 4 | 0 | 0 | 4 | 4 |
| kelmah-frontend/src/modules/worker/components/CertificateUploader.jsx | 4 | 0 | 0 | 4 | 4 |
| kelmah-frontend/src/modules/map/components/common/InteractiveMap.jsx | 4 | 2 | 0 | 2 | 4 |
| kelmah-frontend/src/modules/jobs/components/JobResultsSection.jsx | 3 | 0 | 0 | 3 | 3 |
| kelmah-frontend/src/modules/worker/pages/WorkerProfileEditPage.jsx | 3 | 0 | 0 | 3 | 3 |
| kelmah-frontend/src/modules/search/components/SavedSearches.jsx | 3 | 1 | 0 | 2 | 3 |
| kelmah-frontend/src/modules/search/components/SmartJobRecommendations.jsx | 3 | 1 | 0 | 2 | 3 |
| kelmah-frontend/src/modules/worker/pages/JobSearchPage.jsx | 3 | 1 | 0 | 2 | 3 |
| kelmah-frontend/src/modules/worker/components/EarningsTracker.jsx | 3 | 3 | 0 | 0 | 3 |
| kelmah-frontend/src/modules/auth/components/mobile/MobileLogin.jsx | 2 | 0 | 0 | 2 | 2 |
| kelmah-frontend/src/modules/auth/components/mobile/MobileRegister.jsx | 2 | 0 | 0 | 2 | 2 |
| kelmah-frontend/src/modules/auth/components/register/Register.jsx | 2 | 0 | 0 | 2 | 2 |
| kelmah-frontend/src/modules/jobs/components/job-application/JobApplication.jsx | 2 | 0 | 0 | 2 | 2 |
| kelmah-frontend/src/modules/jobs/components/JobsCardsGrid.jsx | 2 | 0 | 0 | 2 | 2 |
| kelmah-frontend/src/modules/messaging/components/common/MessageInput.jsx | 3 | 1 | 1 | 2 | 2 |
| kelmah-frontend/src/modules/payment/pages/PaymentCenterPage.jsx | 2 | 0 | 0 | 2 | 2 |
| kelmah-frontend/src/modules/payment/pages/PaymentMethodsPage.jsx | 5 | 3 | 3 | 2 | 2 |
| kelmah-frontend/src/modules/quickjobs/pages/NearbyJobsPage.jsx | 2 | 0 | 0 | 2 | 2 |
| kelmah-frontend/src/modules/reviews/pages/ReviewsPage.jsx | 2 | 0 | 0 | 2 | 2 |
| kelmah-frontend/src/modules/search/components/LocationBasedSearch.jsx | 2 | 0 | 0 | 2 | 2 |
| kelmah-frontend/src/modules/search/components/WorkerDirectoryExperience.jsx | 2 | 0 | 0 | 2 | 2 |
| kelmah-frontend/src/modules/worker/components/ProjectGallery.jsx | 5 | 3 | 3 | 2 | 2 |
| kelmah-frontend/src/modules/messaging/components/common/MessageAttachments.jsx | 4 | 3 | 2 | 1 | 2 |
| kelmah-frontend/src/modules/quickjobs/pages/QuickJobRequestPage.jsx | 3 | 2 | 1 | 1 | 2 |
| kelmah-frontend/src/modules/hirer/components/HirerJobManagement.jsx | 2 | 2 | 0 | 0 | 2 |
| kelmah-frontend/src/modules/hirer/components/JobProgressTracker.jsx | 2 | 2 | 0 | 0 | 2 |
| kelmah-frontend/src/modules/hirer/components/PaymentRelease.jsx | 2 | 2 | 0 | 0 | 2 |
| kelmah-frontend/src/modules/hirer/components/ProposalReview.jsx | 2 | 2 | 0 | 0 | 2 |
| kelmah-frontend/src/modules/messaging/components/common/ConversationList.jsx | 3 | 3 | 1 | 0 | 2 |
| kelmah-frontend/src/modules/scheduling/pages/SchedulingPage.jsx | 2 | 2 | 0 | 0 | 2 |
| kelmah-frontend/src/modules/worker/components/AdvancedCalendar.jsx | 2 | 2 | 0 | 0 | 2 |
| kelmah-frontend/src/modules/worker/components/AvailabilityCalendar.jsx | 2 | 2 | 0 | 0 | 2 |
| kelmah-frontend/src/modules/worker/components/DocumentVerification.jsx | 2 | 2 | 0 | 0 | 2 |
| kelmah-frontend/src/modules/worker/components/EnhancedJobCard.jsx | 2 | 2 | 0 | 0 | 2 |
| kelmah-frontend/src/modules/auth/components/common/AuthWrapper.jsx | 1 | 0 | 0 | 1 | 1 |
| kelmah-frontend/src/modules/auth/components/login/Login.jsx | 1 | 0 | 0 | 1 | 1 |
| kelmah-frontend/src/modules/auth/pages/ForgotPasswordPage.jsx | 1 | 0 | 0 | 1 | 1 |
| kelmah-frontend/src/modules/contracts/components/common/ContractForm.jsx | 1 | 0 | 0 | 1 | 1 |
| kelmah-frontend/src/modules/contracts/pages/CreateContractPage.jsx | 1 | 0 | 0 | 1 | 1 |
| kelmah-frontend/src/modules/hirer/pages/JobBidsPage.jsx | 2 | 1 | 1 | 1 | 1 |
| kelmah-frontend/src/modules/jobs/components/common/JobSearch.jsx | 1 | 0 | 0 | 1 | 1 |
| kelmah-frontend/src/modules/messaging/components/common/AttachmentPreview.jsx | 4 | 3 | 3 | 1 | 1 |
| kelmah-frontend/src/modules/messaging/components/common/Message.jsx | 2 | 1 | 1 | 1 | 1 |
| kelmah-frontend/src/modules/messaging/components/common/MessageSearch.jsx | 2 | 1 | 1 | 1 | 1 |
| kelmah-frontend/src/modules/notifications/pages/NotificationsPage.jsx | 1 | 0 | 0 | 1 | 1 |
| kelmah-frontend/src/modules/premium/pages/PremiumPage.jsx | 1 | 0 | 0 | 1 | 1 |
| kelmah-frontend/src/modules/settings/components/common/SecuritySettings.jsx | 1 | 0 | 0 | 1 | 1 |
| kelmah-frontend/src/modules/settings/pages/SettingsPage.jsx | 1 | 0 | 0 | 1 | 1 |
| kelmah-frontend/src/modules/worker/components/WorkerCard.jsx | 1 | 0 | 0 | 1 | 1 |
| kelmah-frontend/src/modules/common/components/forms/SearchForm.jsx | 1 | 1 | 0 | 0 | 1 |
| kelmah-frontend/src/modules/contracts/pages/ContractsPage.jsx | 1 | 1 | 0 | 0 | 1 |
| kelmah-frontend/src/modules/hirer/components/WorkerReview.jsx | 1 | 1 | 0 | 0 | 1 |
| kelmah-frontend/src/modules/hirer/pages/HirerDashboardPage.jsx | 1 | 1 | 0 | 0 | 1 |
| kelmah-frontend/src/modules/hirer/pages/HirerQuickJobTrackingPage.jsx | 1 | 1 | 0 | 0 | 1 |
| kelmah-frontend/src/modules/hirer/pages/JobPostingPage.jsx | 1 | 1 | 0 | 0 | 1 |
| kelmah-frontend/src/modules/jobs/components/JobsMobileFilterDrawer.jsx | 1 | 1 | 0 | 0 | 1 |
| kelmah-frontend/src/modules/layout/components/MobileNav.jsx | 1 | 1 | 0 | 0 | 1 |
| kelmah-frontend/src/modules/layout/components/sidebar/Sidebar.jsx | 1 | 1 | 0 | 0 | 1 |
| kelmah-frontend/src/modules/search/components/common/CompactSearchBar.jsx | 1 | 1 | 0 | 0 | 1 |
| kelmah-frontend/src/modules/search/components/common/MobileFilterDrawer.jsx | 1 | 1 | 0 | 0 | 1 |
| kelmah-frontend/src/modules/worker/components/JobManagement.jsx | 1 | 1 | 0 | 0 | 1 |
| kelmah-frontend/src/modules/worker/components/PortfolioManager.jsx | 2 | 2 | 1 | 0 | 1 |
| kelmah-frontend/src/modules/worker/pages/WorkerDashboardPage.jsx | 1 | 1 | 0 | 0 | 1 |
| kelmah-frontend/src/modules/common/components/cards/JobCard.jsx | 1 | 1 | 1 | 0 | 0 |
| kelmah-frontend/src/modules/common/components/layout/PageHeader.jsx | 1 | 1 | 1 | 0 | 0 |
| kelmah-frontend/src/modules/jobs/components/BidSubmissionForm.jsx | 2 | 2 | 2 | 0 | 0 |
| kelmah-frontend/src/modules/jobs/components/common/CreateJobDialog.jsx | 1 | 1 | 1 | 0 | 0 |
| kelmah-frontend/src/modules/jobs/components/common/JobFilters.jsx | 2 | 2 | 2 | 0 | 0 |
| kelmah-frontend/src/modules/jobs/pages/JobDetailsPage.jsx | 3 | 3 | 3 | 0 | 0 |
| kelmah-frontend/src/modules/layout/components/Footer.jsx | 2 | 2 | 2 | 0 | 0 |
| kelmah-frontend/src/modules/map/components/common/LocationSelector.jsx | 1 | 1 | 1 | 0 | 0 |
| kelmah-frontend/src/modules/messaging/components/common/Chatbox.jsx | 1 | 1 | 1 | 0 | 0 |
| kelmah-frontend/src/modules/messaging/components/common/EmojiPicker.jsx | 2 | 2 | 2 | 0 | 0 |
| kelmah-frontend/src/modules/notifications/components/NotificationItem.jsx | 1 | 1 | 1 | 0 | 0 |
| kelmah-frontend/src/modules/payment/components/PaymentAnalyticsDashboard.jsx | 1 | 1 | 1 | 0 | 0 |
| kelmah-frontend/src/modules/payment/components/PaymentMethodCard.jsx | 2 | 2 | 2 | 0 | 0 |
| kelmah-frontend/src/modules/payment/components/TransactionHistory.jsx | 2 | 2 | 2 | 0 | 0 |
| kelmah-frontend/src/modules/profile/components/ProfilePicture.jsx | 1 | 1 | 1 | 0 | 0 |
| kelmah-frontend/src/modules/worker/pages/MyBidsPage.jsx | 1 | 1 | 1 | 0 | 0 |
