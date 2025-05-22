# Implementation Checklist

This checklist provides step-by-step manual actions to implement the cleanup plan. Before starting, ensure you have a backup of your codebase.

## Frontend Cleanup

### Step 1: Delete Duplicate and Unnecessary Files

- [ ] Delete `kelmah-frontend/src/messagingService.js` (empty stub file)
- [ ] Delete `kelmah-frontend/src/App.js` (duplicate, keep App.jsx)
- [ ] Delete `kelmah-frontend/src/index.js` (duplicate, keep main.jsx)
- [ ] Delete `kelmah-frontend/src/api/authService.js` (duplicate, service functions in `/services/authService.js`)

### Step 2: Consolidate Component Directories

- [ ] Move content from `components/chat/` to `components/messaging/` and delete the `chat` directory
- [ ] Move content from `components/payment/` to `components/payments/` (or vice versa, choose one naming) and delete the redundant directory
- [ ] Move content from `components/job/` to `components/jobs/` and delete the `job` directory
- [ ] Move content from `components/workers/` to `components/worker/` and delete the `workers` directory
- [ ] Move content from `components/messages/` to `components/messaging/` and delete the `messages` directory

### Step 3: Delete Unused Component Directories

Review and delete the following unused placeholder directories if they are empty or contain only stub files:
- [ ] components/3d
- [ ] components/annotation
- [ ] components/automation
- [ ] components/backgrounds
- [ ] components/calendar
- [ ] components/collaboration
- [ ] components/configuration
- [ ] components/controls
- [ ] components/deployment
- [ ] components/disputes (merge with payments if needed)
- [ ] components/docs
- [ ] components/effects
- [ ] components/environment
- [ ] components/error (keep if useful)
- [ ] components/export
- [ ] components/forms (keep if useful)
- [ ] components/home (keep if useful)
- [ ] components/hoc
- [ ] components/infrastructure
- [ ] components/interactive
- [ ] components/loading (keep if useful)
- [ ] components/maps (move content to `map` for consistency)
- [ ] components/micro
- [ ] components/monitoring
- [ ] components/navigation (keep if useful)
- [ ] components/optimization
- [ ] components/performance
- [ ] components/profile (move to `profiles` for consistency)
- [ ] components/reporting
- [ ] components/reports
- [ ] components/review (move to `reviews` for consistency)
- [ ] components/security
- [ ] components/services
- [ ] components/sharing
- [ ] components/settings (keep if useful)
- [ ] components/skills
- [ ] components/social
- [ ] components/talents
- [ ] components/templates
- [ ] components/testing
- [ ] components/version-control
- [ ] components/visualization

### Step 4: Standardize Service Files

- [ ] Rename `kelmah-frontend/src/services/authService.js` to `AuthService.js`
- [ ] Rename `kelmah-frontend/src/services/notificationService.js` to `NotificationService.js`
- [ ] Rename `kelmah-frontend/src/services/messagingService.js` to `MessagingService.js`
- [ ] Rename `kelmah-frontend/src/services/milestoneService.js` to `MilestoneService.js`
- [ ] Rename `kelmah-frontend/src/services/fileUploadService.js` to `FileUploadService.js`
- [ ] Rename `kelmah-frontend/src/services/searchService.js` to `SearchService.js`
- [ ] Rename `kelmah-frontend/src/services/chatService.js` to `ChatService.js` (before merging with MessagingService)
- [ ] Rename `kelmah-frontend/src/services/dashboardService.js` to `DashboardService.js`
- [ ] Rename `kelmah-frontend/src/services/websocket.js` to `WebSocketService.js`

### Step 5: Migrate API Functions to Services

- [ ] Move functions from `kelmah-frontend/src/api/workerService.js` to a new `kelmah-frontend/src/services/WorkerService.js`
- [ ] Move functions from `kelmah-frontend/src/api/contractService.js` to `kelmah-frontend/src/services/ContractService.js`
- [ ] Move functions from `kelmah-frontend/src/api/hirerService.js` to a new `kelmah-frontend/src/services/HirerService.js`
- [ ] Move functions from `kelmah-frontend/src/api/messageService.js` to `kelmah-frontend/src/services/MessagingService.js`
- [ ] Move functions from `kelmah-frontend/src/api/jobsApi.js` to a new `kelmah-frontend/src/services/JobService.js`
- [ ] Move API client setup from `kelmah-frontend/src/api/axios.js` to `kelmah-frontend/src/services/api.js`

### Step 6: Consolidate Service Functionality

- [ ] Merge functionality from `ChatService.js` into `MessagingService.js` and delete `ChatService.js`
- [ ] Create a new `LocationService.js` for map and geolocation functions
- [ ] Create a new `UserService.js` for user profile operations (from existing code)
- [ ] Create a new `ReviewService.js` for review and rating operations (from existing code)

### Step 7: Update Service Index Exports

- [ ] Update `kelmah-frontend/src/services/index.js` to export all standardized services

### Step 8: Organize Pages Directory

Ensure pages are organized according to the defined structure:
- [ ] Create directory structure if not existing 
- [ ] Move page components to appropriate directories
- [ ] Ensure consistent naming

## Backend Cleanup

### Step 1: Verify Service Structure

For each microservice, ensure it has the standard directory structure:

- [ ] Auth Service
- [ ] User Service
- [ ] Job Service
- [ ] Payment Service
- [ ] Messaging Service
- [ ] Notification Service

### Step 2: Create Review Service If Needed

- [ ] If not existing, create a basic structure for the Review Service based on other services

### Step 3: Update Backend Index

- [ ] Update `kelmah-backend/index.js` if needed to include all services

## Final Steps

- [ ] Update imports across the codebase to reflect the new structure
- [ ] Test the application functionality
- [ ] Document the new structure for future reference 