# Complete API Flow Map: Frontend → Backend → Database

**Generated**: October 13, 2025  
**Purpose**: Comprehensive mapping of ALL frontend pages through services, clients, backend microservices, to database models

---

## Table of Contents
1. [Authentication Flow](#authentication-flow)
2. [Jobs & Applications Flow](#jobs--applications-flow)
3. [Reviews & Ratings Flow](#reviews--ratings-flow)
4. [Worker Management Flow](#worker-management-flow)
5. [Hirer Management Flow](#hirer-management-flow)
6. [Payment & Escrow Flow](#payment--escrow-flow)
7. [Messaging & Notifications Flow](#messaging--notifications-flow)
8. [Profile & Portfolio Flow](#profile--portfolio-flow)
9. [Search & Discovery Flow](#search--discovery-flow)
10. [Scheduling & Calendar Flow](#scheduling--calendar-flow)
11. [Contracts & Disputes Flow](#contracts--disputes-flow)
12. [Admin & Analytics Flow](#admin--analytics-flow)
13. [Audit Findings](#audit-findings)

---

## 1. Authentication Flow

### Frontend Pages
- `LoginPage.jsx`
- `RegisterPage.jsx`
- `ForgotPasswordPage.jsx`
- `ResetPasswordPage.jsx`
- `VerifyEmailPage.jsx`
- `MfaSetupPage.jsx`
- `RoleSelectionPage.jsx`

### Service Layer
**Location**: `src/modules/auth/services/authService.js`  
**Client Used**: `authServiceClient`  
**Endpoints**:
```javascript
POST   /auth/login                    // Login
POST   /auth/register                 // Registration
POST   /auth/forgot-password          // Request reset
POST   /auth/reset-password           // Reset password
POST   /auth/verify-email             // Email verification
POST   /auth/refresh                  // Token refresh
POST   /auth/logout                   // Logout
GET    /auth/me                       // Get current user
POST   /auth/mfa/setup                // MFA setup
POST   /auth/mfa/verify               // MFA verification
```

### Backend Microservice
**Service**: Auth Service (localhost:5001)  
**Routes**: `kelmah-backend/services/auth-service/routes/authRoutes.js`  
**Controllers**: `kelmah-backend/services/auth-service/controllers/authController.js`

### Database Models
**Location**: `kelmah-backend/shared/models/`  
**Models Used**:
- `User.js` - User credentials, email verification
- `Token.js` - Refresh tokens, password reset tokens
- `MfaSecret.js` - Multi-factor authentication secrets

### Database Collections
- `users` - User accounts (MongoDB)
- `tokens` - Auth tokens (MongoDB)
- `mfa_secrets` - MFA secrets (MongoDB)

---

## 2. Jobs & Applications Flow

### Frontend Pages
- `JobsPage.jsx` ✅
- `JobDetailsPage.jsx`
- `JobSearchPage.jsx`
- `JobApplicationPage.jsx`
- `MyApplicationsPage.jsx` ✅
- `JobAlertsPage.jsx`
- `JobPostingPage.jsx`
- `JobManagementPage.jsx`
- `ApplicationManagementPage.jsx`

### Service Layer
**Jobs Service**: `src/modules/jobs/services/jobsService.js` ✅  
**Client Used**: `jobServiceClient`  
**Endpoints**:
```javascript
GET    /jobs                          // List jobs
GET    /jobs/:id                      // Job details
POST   /jobs                          // Create job
PUT    /jobs/:id                      // Update job
DELETE /jobs/:id                      // Delete job
GET    /jobs/search                   // Search jobs
GET    /jobs/my-jobs                  // Hirer's jobs
POST   /jobs/:id/apply                // Apply to job
```

**Applications Service**: `src/modules/worker/services/applicationsService.js` ✅  
**Client Used**: `jobServiceClient`  
**Endpoints**:
```javascript
GET    /applications                  // List applications
GET    /applications/:id              // Application details
POST   /applications                  // Submit application
PUT    /applications/:id              // Update application
DELETE /applications/:id              // Withdraw application
GET    /applications/my-applications  // Worker's applications
```

### Backend Microservice
**Service**: Job Service (localhost:5003)  
**Routes**: `kelmah-backend/services/job-service/routes/`
- `jobRoutes.js`
- `applicationRoutes.js`

**Controllers**: `kelmah-backend/services/job-service/controllers/`
- `jobController.js`
- `applicationController.js`

### Database Models
**Location**: `kelmah-backend/shared/models/`  
**Models Used**:
- `Job.js` - Job postings
- `Application.js` - Job applications
- `JobCategory.js` - Job categories
- `SavedJob.js` - Saved/bookmarked jobs

### Database Collections
- `jobs` - Job postings (MongoDB)
- `applications` - Applications (MongoDB)
- `job_categories` - Categories (MongoDB)
- `saved_jobs` - User saved jobs (MongoDB)

---

## 3. Reviews & Ratings Flow

### Frontend Pages
- `ReviewsPage.jsx` ✅
- `WorkerReviewsPage.jsx` ✅
- `UserProfilePage.jsx` ✅ (displays reviews)

### Service Layer
**Location**: `src/modules/reviews/services/reviewService.js` ✅  
**Client Used**: `userServiceClient` ✅ (NOT reviewServiceClient!)  
**Endpoints**:
```javascript
GET    /reviews/worker/:userId        // Worker reviews
GET    /reviews/worker/:userId/stats  // Review statistics
GET    /reviews/job/:jobId            // Job reviews
POST   /reviews                       // Create review
PUT    /reviews/:reviewId             // Update review
DELETE /reviews/:reviewId             // Delete review
GET    /reviews/:reviewId             // Single review
POST   /reviews/:reviewId/report      // Report review
```

### Backend Microservice
**Service**: User Service (localhost:5002) - Reviews Module  
**Routes**: `kelmah-backend/services/user-service/routes/reviewRoutes.js`  
**Controllers**: `kelmah-backend/services/user-service/controllers/reviewController.js`

### Database Models
**Location**: `kelmah-backend/shared/models/`  
**Models Used**:
- `Review.js` - Reviews and ratings
- `User.js` - User average ratings (aggregated)

### Database Collections
- `reviews` - All reviews (MongoDB)
- `users` - User rating aggregates (MongoDB)

---

## 4. Worker Management Flow

### Frontend Pages
- `WorkerDashboardPage.jsx`
- `WorkerProfileEditPage.jsx`
- `PortfolioPage.jsx` ✅
- `SkillsAssessmentPage.jsx`
- `JobSearchPage.jsx`
- `MyApplicationsPage.jsx` ✅

### Service Layer
**Worker Service**: `src/modules/worker/services/workerService.js`  
**Client Used**: `userServiceClient`  
**Endpoints**:
```javascript
GET    /users/workers                 // List workers
GET    /users/workers/:id             // Worker profile
PUT    /users/workers/:id             // Update profile
GET    /users/workers/nearby          // Nearby workers
POST   /users/workers/:id/availability // Set availability
GET    /users/workers/:id/stats       // Worker statistics
```

**Portfolio Service**: `src/modules/worker/services/portfolioService.js` ✅  
**Client Used**: `userServiceClient`  
**Endpoints**:
```javascript
GET    /profile/portfolio             // My portfolio
GET    /profile/portfolio/:workerId   // Worker portfolio
GET    /profile/portfolio/item/:id    // Portfolio item
POST   /profile/portfolio             // Create item
PUT    /profile/portfolio/:id         // Update item
DELETE /profile/portfolio/:id         // Delete item
POST   /profile/portfolio/upload      // Upload samples
POST   /profile/portfolio/certificates// Upload certificates
GET    /profile/portfolio/stats       // Portfolio stats
```

**Certificate Service**: `src/modules/worker/services/certificateService.js`  
**Client Used**: `userServiceClient`  
**Endpoints**:
```javascript
GET    /profile/certificates          // List certificates
POST   /profile/certificates          // Upload certificate
DELETE /profile/certificates/:id      // Delete certificate
PUT    /profile/certificates/:id/verify // Verify certificate
```

**Earnings Service**: `src/modules/worker/services/earningsService.js`  
**Client Used**: `paymentServiceClient`  
**Endpoints**:
```javascript
GET    /earnings                      // Worker earnings
GET    /earnings/summary              // Earnings summary
GET    /earnings/transactions         // Transaction history
POST   /earnings/withdraw             // Withdraw earnings
```

### Backend Microservice
**Services Used**:
1. User Service (localhost:5002) - Worker profiles, portfolio
2. Payment Service (localhost:5004) - Earnings

**Routes**:
- `kelmah-backend/services/user-service/routes/workerRoutes.js`
- `kelmah-backend/services/user-service/routes/portfolioRoutes.js`
- `kelmah-backend/services/payment-service/routes/earningsRoutes.js`

**Controllers**:
- `kelmah-backend/services/user-service/controllers/workerController.js`
- `kelmah-backend/services/user-service/controllers/portfolioController.js`
- `kelmah-backend/services/payment-service/controllers/earningsController.js`

### Database Models
**Location**: `kelmah-backend/shared/models/`  
**Models Used**:
- `User.js` - Worker profiles
- `Portfolio.js` - Portfolio items
- `Certificate.js` - Worker certificates
- `Skill.js` - Worker skills
- `Transaction.js` - Earnings records

### Database Collections
- `users` - Worker profiles (MongoDB)
- `portfolios` - Portfolio items (MongoDB)
- `certificates` - Certificates (MongoDB)
- `skills` - Skills catalog (MongoDB)
- `transactions` - Payment transactions (MongoDB)

---

## 5. Hirer Management Flow

### Frontend Pages
- `HirerDashboardPage.jsx`
- `WorkerSearchPage.jsx`
- `JobPostingPage.jsx`
- `JobManagementPage.jsx`
- `ApplicationManagementPage.jsx`
- `HirerAnalyticsPage.jsx`
- `HirerToolsPage.jsx`

### Service Layer
**Hirer Service**: `src/modules/hirer/services/hirerService.js`  
**Client Used**: `userServiceClient`  
**Endpoints**:
```javascript
GET    /users/hirers                  // List hirers
GET    /users/hirers/:id              // Hirer profile
PUT    /users/hirers/:id              // Update profile
GET    /users/hirers/:id/jobs         // Hirer's jobs
GET    /users/hirers/:id/applications // Applications received
POST   /users/hirers/search-workers   // Search workers
```

**Hirer Analytics Service**: `src/modules/hirer/services/hirerAnalyticsService.js`  
**Client Used**: `userServiceClient`  
**Endpoints**:
```javascript
GET    /analytics/hirer/:id           // Hirer analytics
GET    /analytics/hirer/:id/jobs      // Job performance
GET    /analytics/hirer/:id/spending  // Spending analytics
```

### Backend Microservice
**Service**: User Service (localhost:5002) - Hirer Module  
**Routes**: `kelmah-backend/services/user-service/routes/hirerRoutes.js`  
**Controllers**: `kelmah-backend/services/user-service/controllers/hirerController.js`

### Database Models
**Location**: `kelmah-backend/shared/models/`  
**Models Used**:
- `User.js` - Hirer profiles
- `Job.js` - Posted jobs
- `Application.js` - Received applications

### Database Collections
- `users` - Hirer profiles (MongoDB)
- `jobs` - Job postings (MongoDB)
- `applications` - Applications (MongoDB)

---

## 6. Payment & Escrow Flow

### Frontend Pages
- `PaymentsPage.jsx`
- `PaymentCenterPage.jsx`
- `PaymentSettingsPage.jsx` ✅
- `PaymentMethodsPage.jsx` ✅
- `EscrowDetailsPage.jsx` ✅
- `WalletPage.jsx`
- `BillPage.jsx`

### Service Layer
**Location**: `src/modules/payment/services/paymentService.js`  
**Client Used**: `paymentServiceClient`  
**Endpoints**:
```javascript
GET    /payments                      // List payments
GET    /payments/:id                  // Payment details
POST   /payments                      // Create payment
POST   /payments/mobile-money         // Mobile money payment
POST   /payments/verify               // Verify payment
GET    /payments/methods              // Payment methods
POST   /payments/methods              // Add method
DELETE /payments/methods/:id          // Remove method
GET    /escrow                        // Escrow accounts
POST   /escrow                        // Create escrow
POST   /escrow/:id/release            // Release funds
POST   /escrow/:id/refund             // Refund escrow
GET    /wallet                        // Wallet balance
POST   /wallet/withdraw               // Withdraw funds
GET    /transactions                  // Transaction history
```

### Backend Microservice
**Service**: Payment Service (localhost:5004)  
**Routes**: `kelmah-backend/services/payment-service/routes/`
- `paymentRoutes.js`
- `escrowRoutes.js`
- `walletRoutes.js`

**Controllers**: `kelmah-backend/services/payment-service/controllers/`
- `paymentController.js`
- `escrowController.js`
- `walletController.js`

### Database Models
**Location**: `kelmah-backend/shared/models/`  
**Models Used**:
- `Payment.js` - Payment records
- `Escrow.js` - Escrow accounts
- `Transaction.js` - All transactions
- `PaymentMethod.js` - Saved payment methods
- `Wallet.js` - User wallets

### Database Collections
- `payments` - Payment records (MongoDB)
- `escrows` - Escrow accounts (MongoDB)
- `transactions` - Transaction log (MongoDB)
- `payment_methods` - Payment methods (MongoDB)
- `wallets` - User wallets (MongoDB)

---

## 7. Messaging & Notifications Flow

### Frontend Pages
- `MessagingPage.jsx` ✅
- `SimpleMessagingPage.jsx`
- `NotificationsPage.jsx`
- `NotificationSettingsPage.jsx` ✅

### Service Layer
**Messaging Service**: `src/modules/messaging/services/messagingService.js`  
**Client Used**: `messagingServiceClient`  
**Endpoints**:
```javascript
GET    /messages/conversations        // List conversations
GET    /messages/conversations/:id    // Conversation messages
POST   /messages                      // Send message
PUT    /messages/:id                  // Update message
DELETE /messages/:id                  // Delete message
POST   /messages/:id/read             // Mark as read
POST   /messages/upload               // Upload attachment
```

**Chat Service**: `src/modules/messaging/services/chatService.js`  
**Client Used**: `messagingServiceClient`  
**Endpoints**:
```javascript
GET    /chat/rooms                    // Chat rooms
POST   /chat/rooms                    // Create room
POST   /chat/rooms/:id/messages       // Send message
GET    /chat/rooms/:id/messages       // Get messages
```

**Notification Service**: `src/modules/notifications/services/notificationService.js`  
**Client Used**: `messagingServiceClient`  
**Endpoints**:
```javascript
GET    /notifications                 // List notifications
PUT    /notifications/:id/read        // Mark as read
PUT    /notifications/read-all        // Mark all read
DELETE /notifications/:id             // Delete notification
GET    /notifications/settings        // Notification settings
PUT    /notifications/settings        // Update settings
```

### Backend Microservice
**Service**: Messaging Service (localhost:5005)  
**Routes**: `kelmah-backend/services/messaging-service/routes/`
- `messageRoutes.js`
- `notificationRoutes.js`
- `conversationRoutes.js`

**Controllers**: `kelmah-backend/services/messaging-service/controllers/`
- `messageController.js`
- `notificationController.js`
- `conversationController.js`

**Real-time**: Socket.IO server for live messaging

### Database Models
**Location**: `kelmah-backend/shared/models/`  
**Models Used**:
- `Message.js` - Chat messages
- `Conversation.js` - Conversation threads
- `Notification.js` - User notifications
- `NotificationSetting.js` - User preferences

### Database Collections
- `messages` - All messages (MongoDB)
- `conversations` - Conversation threads (MongoDB)
- `notifications` - Notifications (MongoDB)
- `notification_settings` - User settings (MongoDB)

---

## 8. Profile & Portfolio Flow

### Frontend Pages
- `ProfilePage.jsx`
- `UserProfilePage.jsx` ✅
- `PortfolioPage.jsx` ✅
- `WorkerProfileEditPage.jsx`

### Service Layer
**Profile Service**: `src/modules/profile/services/profileService.js`  
**Client Used**: `userServiceClient`  
**Endpoints**:
```javascript
GET    /profile                       // My profile
PUT    /profile                       // Update profile
GET    /profile/:userId               // User profile
POST   /profile/avatar                // Upload avatar
POST   /profile/cover                 // Upload cover photo
GET    /profile/stats                 // Profile statistics
```

**Portfolio Service**: `src/modules/worker/services/portfolioService.js` ✅  
**(See Worker Management Flow above)**

### Backend Microservice
**Service**: User Service (localhost:5002)  
**Routes**: `kelmah-backend/services/user-service/routes/profileRoutes.js`  
**Controllers**: `kelmah-backend/services/user-service/controllers/profileController.js`

### Database Models
**Location**: `kelmah-backend/shared/models/`  
**Models Used**:
- `User.js` - User profiles
- `Portfolio.js` - Portfolio items

### Database Collections
- `users` - User profiles (MongoDB)
- `portfolios` - Portfolio items (MongoDB)

---

## 9. Search & Discovery Flow

### Frontend Pages
- `SearchPage.jsx`
- `GeoLocationSearch.jsx`
- `WorkerSearchPage.jsx`
- `JobSearchPage.jsx`
- `ProfessionalMapPage.jsx`

### Service Layer
**Search Service**: `src/modules/search/services/searchService.js`  
**Client Used**: `gatewayClient`  
**Endpoints**:
```javascript
GET    /search/workers                // Search workers
GET    /search/jobs                   // Search jobs
GET    /search/all                    // Global search
POST   /search/saved                  // Save search
GET    /search/saved                  // Saved searches
DELETE /search/saved/:id              // Delete saved search
```

**Smart Search Service**: `src/modules/search/services/smartSearchService.js`  
**Client Used**: `gatewayClient`  
**Endpoints**:
```javascript
POST   /search/smart                  // AI-powered search
GET    /search/recommendations        // Job recommendations
GET    /search/trending               // Trending searches
```

**Location Service**: `src/modules/search/services/locationService.js`  
**Client Used**: `userServiceClient`  
**Endpoints**:
```javascript
GET    /location/nearby               // Nearby workers/jobs
POST   /location/geocode              // Geocode address
GET    /location/regions              // Available regions
```

**Map Service**: `src/modules/map/services/mapService.js`  
**Client Used**: `userServiceClient`  
**Endpoints**:
```javascript
GET    /map/workers                   // Workers on map
GET    /map/jobs                      // Jobs on map
GET    /map/clusters                  // Cluster data
```

### Backend Microservice
**Services Used**:
1. User Service (localhost:5002) - Worker search, location
2. Job Service (localhost:5003) - Job search

**Routes**:
- `kelmah-backend/services/user-service/routes/searchRoutes.js`
- `kelmah-backend/services/job-service/routes/searchRoutes.js`

**Controllers**:
- `kelmah-backend/services/user-service/controllers/searchController.js`
- `kelmah-backend/services/job-service/controllers/searchController.js`

### Database Models
**Location**: `kelmah-backend/shared/models/`  
**Models Used**:
- `User.js` - Worker location data (GeoJSON)
- `Job.js` - Job location data (GeoJSON)
- `SavedSearch.js` - Saved search criteria

### Database Collections
- `users` - Worker profiles with geolocation (MongoDB with 2dsphere index)
- `jobs` - Job postings with geolocation (MongoDB with 2dsphere index)
- `saved_searches` - User saved searches (MongoDB)

---

## 10. Scheduling & Calendar Flow

### Frontend Pages
- `SchedulingPage.jsx` ⚠️
- `TempSchedulingPage.jsx`

### Service Layer
**Scheduling Service**: `src/modules/scheduling/services/schedulingService.js`  
**Client Used**: `gatewayClient`  
**Endpoints**:
```javascript
GET    /scheduling/appointments       // List appointments
POST   /scheduling/appointments       // Create appointment
PUT    /scheduling/appointments/:id   // Update appointment
DELETE /scheduling/appointments/:id   // Cancel appointment
GET    /scheduling/availability       // Check availability
POST   /scheduling/availability       // Set availability
```

**Events Service**: `src/modules/calendar/services/eventsService.js` ✅  
**Client Used**: `gatewayClient`  
**Endpoints**:
```javascript
GET    /events                        // List events
POST   /events                        // Create event
PUT    /events/:id                    // Update event
DELETE /events/:id                    // Delete event
GET    /events/calendar               // Calendar view
```

### Backend Microservice
**Service**: Messaging Service (localhost:5005) - Scheduling Module  
**Routes**: `kelmah-backend/services/messaging-service/routes/schedulingRoutes.js`  
**Controllers**: `kelmah-backend/services/messaging-service/controllers/schedulingController.js`

### Database Models
**Location**: `kelmah-backend/shared/models/`  
**Models Used**:
- `Appointment.js` - Scheduled appointments
- `Availability.js` - Worker availability
- `Event.js` - Calendar events

### Database Collections
- `appointments` - Appointments (MongoDB)
- `availabilities` - Worker availability (MongoDB)
- `events` - Calendar events (MongoDB)

---

## 11. Contracts & Disputes Flow

### Frontend Pages
- `ContractsPage.jsx`
- `ContractManagementPage.jsx`
- `ContractDetailsPage.jsx`
- `CreateContractPage.jsx`
- `EditContractPage.jsx`
- `DisputesPage.jsx`

### Service Layer
**Contract Service**: `src/modules/contracts/services/contractService.js`  
**Client Used**: `gatewayClient`  
**Endpoints**:
```javascript
GET    /contracts                     // List contracts
GET    /contracts/:id                 // Contract details
POST   /contracts                     // Create contract
PUT    /contracts/:id                 // Update contract
DELETE /contracts/:id                 // Delete contract
POST   /contracts/:id/sign            // Sign contract
POST   /contracts/:id/complete        // Complete contract
```

**Dispute Service**: `src/modules/disputes/services/disputeService.js`  
**Client Used**: `gatewayClient`  
**Endpoints**:
```javascript
GET    /disputes                      // List disputes
GET    /disputes/:id                  // Dispute details
POST   /disputes                      // Create dispute
PUT    /disputes/:id                  // Update dispute
POST   /disputes/:id/resolve          // Resolve dispute
POST   /disputes/:id/evidence         // Submit evidence
```

### Backend Microservice
**Service**: Job Service (localhost:5003) - Contracts Module  
**Routes**: `kelmah-backend/services/job-service/routes/`
- `contractRoutes.js`
- `disputeRoutes.js`

**Controllers**: `kelmah-backend/services/job-service/controllers/`
- `contractController.js`
- `disputeController.js`

### Database Models
**Location**: `kelmah-backend/shared/models/`  
**Models Used**:
- `Contract.js` - Service contracts
- `Dispute.js` - Dispute records
- `DisputeEvidence.js` - Evidence submissions

### Database Collections
- `contracts` - Contracts (MongoDB)
- `disputes` - Disputes (MongoDB)
- `dispute_evidence` - Evidence files (MongoDB)

---

## 12. Admin & Analytics Flow

### Frontend Pages
- `DashboardPage.jsx`
- `WorkerDashboardPage.jsx`
- `HirerDashboardPage.jsx`
- `HirerAnalyticsPage.jsx`
- `AnalyticsPage.jsx`
- `PayoutQueuePage.jsx`
- `SkillsAssessmentManagement.jsx`

### Service Layer
**Dashboard Service**: `src/modules/dashboard/services/dashboardService.js`  
**Client Used**: `gatewayClient`  
**Endpoints**:
```javascript
GET    /dashboard/stats               // Dashboard statistics
GET    /dashboard/worker              // Worker dashboard
GET    /dashboard/hirer               // Hirer dashboard
GET    /dashboard/admin               // Admin dashboard
GET    /dashboard/recent-activity     // Recent activity
```

**Analytics Service**: `src/modules/analytics/services/analyticsService.js`  
**Client Used**: `gatewayClient`  
**Endpoints**:
```javascript
GET    /analytics/overview            // Platform overview
GET    /analytics/jobs                // Job analytics
GET    /analytics/workers             // Worker analytics
GET    /analytics/revenue             // Revenue analytics
GET    /analytics/trends              // Trend analysis
```

### Backend Microservice
**Services Used**: All services provide analytics data
**Routes**: Various services expose `/analytics` endpoints

**Controllers**: Analytics aggregated from multiple services

### Database Models
**Location**: `kelmah-backend/shared/models/`  
**Models Used**: All models (aggregated queries)

### Database Collections
All collections queried for analytics

---

## 13. Audit Findings

### ✅ Issues Fixed (from previous audit)
1. ✅ portfolioApi.js corruption - FIXED
2. ✅ reviewService.js wrong import - FIXED
3. ✅ Duplicate backup folders - REMOVED
4. ✅ *Api.js naming inconsistency - STANDARDIZED to *Service.js
5. ✅ /api/ prefix duplication - FIXED

### ⚠️ NEW Issues Found

#### Issue #1: Wrong Import in SchedulingPage.jsx
**File**: `src/modules/scheduling/pages/SchedulingPage.jsx`  
**Line 56**: `import jobsService from '../../jobs/services/jobsApi';`  
**Problem**: Importing from `jobsApi.js` which was renamed to `jobsService.js`  
**Fix Required**: Change to `import jobsService from '../../jobs/services/jobsService';`

#### Issue #2: Duplicate Dashboard Service Files
**Files**:
- `src/modules/dashboard/services/dashboardService.js`
- `src/modules/dashboard/services/hirerDashboardSlice.js` (imports hirerService)
- `src/modules/dashboard/services/hirerService.js` (DELETED - duplicate)

**Status**: Duplicate hirerService.js already removed in previous audit ✅

#### Issue #3: Root Services Folder Still Has Files
**Location**: `src/services/`  
**Files Found**:
- `reputationApi.js` - Unused/legacy
- `enhancedSearchService.js` - Should be in search module
- `searchCacheService.js` - Should be in search module  
- `websocketService.js` - Should be in common/services
- `aiMatchingService.js` - Should be in common/services
- `backgroundSyncService.js` - Should be in common/services

**Action Required**: Move to appropriate modules or backup

#### Issue #4: Missing Service Files (imported but don't exist)
1. `jobService` imported in `RealTimeJobAlerts.jsx` line 61
   - Should be `jobsService` (typo)
2. Check all service imports for consistency

---

## Backend Service Mapping Summary

| Microservice | Port | Handles | Database |
|--------------|------|---------|----------|
| Auth Service | 5001 | Authentication, tokens, MFA | `users`, `tokens`, `mfa_secrets` |
| User Service | 5002 | Profiles, workers, hirers, reviews, portfolio | `users`, `reviews`, `portfolios`, `certificates` |
| Job Service | 5003 | Jobs, applications, contracts, disputes | `jobs`, `applications`, `contracts`, `disputes` |
| Payment Service | 5004 | Payments, escrow, wallets, transactions | `payments`, `escrows`, `wallets`, `transactions` |
| Messaging Service | 5005 | Messages, notifications, scheduling | `messages`, `conversations`, `notifications`, `appointments` |
| Review Service | 5006 | (Consolidated into User Service) | - |

---

## Service Client to Backend Mapping

| Frontend Client | Backend Service | Base URL | Database |
|-----------------|----------------|----------|----------|
| `authServiceClient` | Auth Service (5001) | `/api/auth` | Users, Tokens |
| `userServiceClient` | User Service (5002) | `/api/users` | Users, Reviews, Portfolios |
| `jobServiceClient` | Job Service (5003) | `/api/jobs` | Jobs, Applications, Contracts |
| `paymentServiceClient` | Payment Service (5004) | `/api/payments` | Payments, Escrow, Wallets |
| `messagingServiceClient` | Messaging Service (5005) | `/api/messages` | Messages, Notifications |
| `gatewayClient` | API Gateway (5000) | `/api` | Routes to all services |

---

## Database Schema Overview

### MongoDB Collections (by Service)

**Auth Service Collections**:
- `users` - Core user accounts
- `tokens` - Auth and refresh tokens
- `mfa_secrets` - 2FA secrets

**User Service Collections**:
- `users` - Extended user profiles
- `reviews` - Reviews and ratings
- `portfolios` - Worker portfolios
- `certificates` - Worker certificates
- `skills` - Skills catalog

**Job Service Collections**:
- `jobs` - Job postings
- `applications` - Job applications
- `contracts` - Service contracts
- `disputes` - Dispute records
- `job_categories` - Job categories
- `saved_jobs` - User saved jobs

**Payment Service Collections**:
- `payments` - Payment records
- `escrows` - Escrow accounts
- `wallets` - User wallets
- `transactions` - Transaction log
- `payment_methods` - Saved payment methods

**Messaging Service Collections**:
- `messages` - Chat messages
- `conversations` - Conversation threads
- `notifications` - User notifications
- `notification_settings` - User preferences
- `appointments` - Scheduled appointments
- `availabilities` - Worker availability
- `events` - Calendar events

---

## Next Steps: Audit & Cleanup

1. **Fix SchedulingPage.jsx import** (jobsApi → jobsService)
2. **Move root services/** files to appropriate modules
3. **Verify all service imports are correct**
4. **Check for unused/duplicate service files**
5. **Validate all endpoint paths match backend routes**

**Total Pages Mapped**: 57 unique pages  
**Total Services**: 30+ service files  
**Total Backend Services**: 5 microservices + 1 gateway  
**Total Database Collections**: 25+ collections

