# Kelmah Project Codebase Cleanup Plan

This document outlines the steps needed to clean up and reorganize the codebase based on the architecture diagrams.

## Issues Identified

1. **Duplicate Files and Functionality**:
   - Duplicate auth services in `/services` and `/api`
   - Multiple messaging services (messagingService.js and chatService.js)
   - Duplicate components (chat vs. messaging, payments vs. payment)

2. **Inconsistent File Naming and Organization**:
   - Mixed casing (PaymentService.js vs. authService.js)
   - Inconsistent file extensions (.js vs .jsx for React components)
   - Inconsistent service naming (some with "Service" suffix, some without)

3. **Redundant or Empty Directories**:
   - Many placeholder/unused component directories 
   - Multiple directories for similar functionality

4. **Structure Not Aligned with Architecture**:
   - Frontend organization doesn't fully match the architecture diagrams
   - Unclear separation of concerns between `/api` and `/services`

## Cleanup Actions - Frontend

### 1. Service Layer Consolidation

**Services to Merge/Standardize**:
- Consolidate `authService.js` (keep in services, remove from /api)
- Standardize naming convention to PascalCase with Service suffix
- Merge `messagingService.js` and `chatService.js` into a single service
- Move API client configuration from `/api/axios.js` to `/services/api.js`

**Services Directory Structure**:
```
src/services/
  - AuthService.js          (Authentication operations)
  - PaymentService.js       (Payment operations including escrow, wallet)
  - MessagingService.js     (Real-time messaging + chat, WebSocket)
  - NotificationService.js  (Notifications across channels)
  - JobService.js           (Job operations)
  - UserService.js          (User profile operations)
  - ContractService.js      (Contract operations)
  - ReviewService.js        (Review and rating operations)
  - SearchService.js        (Advanced search functionality)
  - FileUploadService.js    (File upload handling)
  - LocationService.js      (Mapping and geolocation)
  - api.js                  (Base API client configuration)
  - index.js                (Service exports)
```

### 2. Components Reorganization

**Component Structure**:
```
src/components/
  - common/           (Shared UI components)
  - auth/             (Authentication UI)
  - worker/           (Worker-specific components)
  - hirer/            (Hirer-specific components)
  - messaging/        (Chat and messaging UI)
  - payments/         (Payment and wallet UI)
  - jobs/             (Job listing and management)
  - contracts/        (Contract management UI)
  - reviews/          (Review and rating UI)
  - search/           (Search UI components)
  - notifications/    (Notification UI)
  - dashboard/        (Dashboard components)
  - map/              (Map and location components)
  - profiles/         (User profiles)
```

**Components to Delete or Merge**:
- Delete redundant `chat/` directory (use `messaging/` instead)
- Merge `payment/` and `payments/` directories
- Merge `job/` and `jobs/` directories
- Merge `workers/` into `worker/` directory
- Delete unused placeholder directories

### 3. Contexts Standardization

Keep and standardize:
- AuthContext.jsx
- MessageContext.jsx 
- NotificationContext.jsx
- SearchContext.jsx

### 4. Pages Structure

Organize pages to follow a clear structure:
```
src/pages/
  - auth/             (Login, Register, Reset Password)
  - worker/           (Worker Dashboard, Profile)
  - hirer/            (Hirer Dashboard, Post Job)
  - messaging/        (Messaging Page)
  - jobs/             (Job Listings, Job Details)
  - contracts/        (Contract Details, Milestones)
  - payments/         (Wallet, Transaction History)
  - profiles/         (User Profiles)
  - search/           (Search Results)
  - settings/         (User Settings)
  - admin/            (Admin Dashboard, Management)
```

### 5. API Directory Cleanup

**Cleanup Plan**:
- Move essential API service functions to the corresponding service in `/services`
- Keep API modules directory for any specialized API operations
- Standardize naming conventions

## Cleanup Actions - Backend

The backend services are generally well-organized according to the microservices architecture. Only minor adjustments needed:

1. Confirm all required microservices exist:
   - API Gateway (√)
   - Auth Service (√)
   - User Service (√)
   - Job Service (√)
   - Payment Service (√)
   - Messaging Service (√)
   - Notification Service (√)
   - Review Service (?) - May need to be added

2. Standardize service structure to ensure each has:
   - controllers/
   - models/
   - routes/
   - services/ (for business logic)
   - utils/ (for helpers)
   - middleware/
   - socket/ (for WebSocket handlers, where applicable)
   - tests/

## File Deletion List

1. Frontend
   - `src/messagingService.js` (empty/stub file)
   - `src/App.js` (duplicate, keep App.jsx)
   - `src/index.js` (duplicate, keep main.jsx)
   - `src/api/authService.js` (duplicate)
   - `src/components/messages/` (use messaging/ instead)
   - Unused/placeholder component directories
   - One of `payment/` or `payments/` directories (merge)

2. Backend
   - No major deletions identified; confirm all services comply with the architecture

## File Move/Rename List

1. Frontend
   - Move API functions from `/api` to corresponding services
   - Standardize service file naming to PascalCase with Service suffix
   - Rename component directories for consistency

## Implementation Steps

1. Create backup of current codebase
2. Delete duplicate/unnecessary files
3. Reorganize directories
4. Standardize naming conventions 
5. Update imports across the codebase
6. Test the application to ensure functionality is preserved

## Post-Cleanup Documentation

After cleanup, update documentation to reflect the new structure and provide clear guidelines for future development. 