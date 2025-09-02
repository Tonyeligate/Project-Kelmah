# 🏗️ KELMAH SYSTEM ARCHITECTURE & FAULT-TOLERANT DESIGN

## 🎯 **SYSTEM OVERVIEW**

Kelmah is a **vocational job marketplace** connecting skilled workers (carpenters, masons, plumbers, electricians) with hirers in Ghana. The system uses a **microservices architecture** with a **modular frontend** designed for fault tolerance and scalability.

---

## 🏛️ **ARCHITECTURE LAYERS**

### 1. **🌐 FRONTEND LAYER (Vercel - React/Vite)**

#### **A. User Interface Components**
```
📱 User Interfaces:
├── 🏠 Home Page (SimplifiedHero.jsx)
├── 🔐 Authentication (Login/Register Pages)
└── 📱 Progressive Web App (PWA) Features
```

#### **B. Worker System (Domain-Driven)**
```
👷 Worker Domain:
├── 📊 Dashboard (EnhancedWorkerDashboard.jsx)
├── 👤 Profile Management (WorkerProfileEditPage.jsx)
├── 💼 Job Search & Discovery (JobSearchPage.jsx)
├── 📝 Application Tracking (MyApplicationsPage.jsx)
├── 💰 Earnings & Payments (PaymentCenterPage.jsx)
├── 📅 Schedule Management (SchedulingPage.jsx)
├── ⭐ Reviews & Ratings (WorkerReviewsPage.jsx)
└── 🛠️ Visual Job Categories (VocationalJobCategories.jsx)
```

#### **C. Hirer System (Domain-Driven)**
```
🏢 Hirer Domain:
├── 📈 Dashboard (EnhancedHirerDashboard.jsx)
├── 👔 Profile Management (HirerProfilePage.jsx)
├── 📋 Job Management (JobManagementPage.jsx)
├── 🔍 Worker Search (WorkerSearchPage.jsx)
├── 📄 Contract Management (ContractManagementPage.jsx)
├── 💳 Payment Management (PaymentManagementPage.jsx)
└── 📊 Analytics & Reports (HirerAnalyticsPage.jsx)
```

#### **D. Shared Components (Cross-Domain)**
```
🔧 Shared Systems:
├── 💬 Messaging (MessagingPage.jsx)
├── 💳 Payment Center (PaymentCenterPage.jsx)
├── ⚙️ Settings (SettingsPage.jsx)
├── 🔔 Notifications (NotificationsPage.jsx)
├── 🗺️ Interactive Maps (InteractiveMap.jsx)
└── 📱 Mobile Navigation (MobileBottomNav.jsx)
```

#### **E. Core Infrastructure**
```
🛠 Infrastructure:
├── 🌐 API Client (api/index.js)
├── 🗄️ Redux Store (store/index.js)
├── 🛣️ Route Protection (routes/)
├── 🔒 Secure Storage (utils/secureStorage.js)
└── 🎨 Theme System (theme/ThemeProvider.jsx)
```

---

### 2. **🚪 API GATEWAY LAYER (Render)**

```
🚪 API Gateway (Port 3000):
├── 📝 Request Routing (/api/* → services)
├── 🔐 Authentication Middleware
├── 🛡️ Rate Limiting & Security
├── 📊 Health Monitoring
└── 🔄 Load Balancing
```

---

### 3. **⚙️ MICROSERVICES LAYER (Render - Docker)**

```
🔐 Auth Service (Port 5001):
├── JWT Token Management
├── User Registration/Login
├── Password Reset
├── Email Verification
└── Multi-Factor Authentication

👥 User Service (Port 5002):
├── Worker/Hirer Profiles
├── Skills & Certifications
├── Availability Management
├── Profile Completion
└── User Analytics

💼 Job Service (Port 5003):
├── Job CRUD Operations
├── Application Management
├── Job Matching Algorithm
├── Category Management
└── Search & Filtering

💬 Messaging Service (Port 5004):
├── Real-time Chat (WebSocket)
├── Conversation Management
├── File Attachments
├── Message History
└── Notification Triggers

💳 Payment Service (Port 5005):
├── Escrow Management
├── Payment Processing
├── Transaction History
├── Payout Management
└── Payment Gateway Integration

⭐ Review Service (Port 5006):
├── Rating & Review System
├── Reputation Management
├── Review Moderation
├── Trust Score Calculation
└── Feedback Analytics
```

---

### 4. **🗃️ DATABASE LAYER**

```
🍃 MongoDB (Primary):
├── Users Collection
├── Jobs Collection
├── Messages Collection
├── Applications Collection
├── Reviews Collection
└── Contracts Collection

🐘 PostgreSQL (Analytics):
├── User Analytics
├── Job Performance Metrics
├── Payment Analytics
├── System Reports
└── Business Intelligence

🔴 Redis (Cache & Sessions):
├── Session Storage
├── Rate Limiting
├── API Response Cache
├── Real-time Data
└── Background Jobs

🐰 RabbitMQ (Message Queue):
├── Email Notifications
├── Payment Webhooks
├── Background Processing
├── Service Communication
└── Event Streaming
```

---

### 5. **🌍 EXTERNAL SERVICES**

```
💳 Paystack: Payment Gateway for Ghana
☁️ Cloudinary: Image & File Storage
📧 SendGrid: Email Service
🗺️ Google Maps: Location Services
```

---

## 🛡️ **FAULT-TOLERANT DESIGN PRINCIPLES**

### **1. Frontend Fault Tolerance**

#### **A. Module Isolation**
```javascript
// Each module is self-contained with error boundaries
src/modules/worker/
├── components/     // Isolated worker components
├── services/       // Worker-specific API calls
├── hooks/          // Worker-specific business logic
└── pages/          // Worker-specific routes

// If worker module fails, hirer module continues working
src/modules/hirer/  // Completely independent
```

#### **B. Error Boundary Strategy**
```javascript
// Wrap each major component with error boundaries
<ErrorBoundary>
  <WorkerDashboard />
</ErrorBoundary>

// If one component fails, others continue working
```

#### **C. API Resilience**
```javascript
// Multiple fallback strategies
const workersApi = {
  async getDashboardData() {
    try {
      return await realAPI.get('/dashboard');
    } catch (error) {
      console.warn('API unavailable, using cached data');
      return cachedData || mockData;
    }
  }
}
```

### **2. Backend Fault Tolerance**

#### **A. Service Independence**
- Each microservice runs independently
- Service failure doesn't affect other services
- API Gateway handles service unavailability

#### **B. Database Resilience**
- Multiple database types for different needs
- MongoDB for primary data (with replica sets)
- Redis for caching and fallbacks
- PostgreSQL for analytics (can be offline)

#### **C. Message Queue Reliability**
- RabbitMQ for asynchronous processing
- Failed messages are retried automatically
- Critical operations have multiple delivery attempts

---

## 📋 **COMPLETE FILE INVENTORY**

### **🎯 CRITICAL FILES (Core System)**

#### **Frontend Core:**
1. `kelmah-frontend/src/App.jsx` - Main application entry
2. `kelmah-frontend/src/main.jsx` - Application bootstrap
3. `kelmah-frontend/src/api/index.js` - Central API configuration
4. `kelmah-frontend/src/store/index.js` - Redux store setup
5. `kelmah-frontend/src/config/environment.js` - Environment configuration

#### **Authentication System:**
6. `kelmah-frontend/src/modules/auth/services/authSlice.js` - Auth state management
7. `kelmah-frontend/src/modules/auth/services/authService.js` - Auth API calls
8. `kelmah-frontend/src/modules/auth/contexts/AuthContext.jsx` - Auth context
9. `kelmah-frontend/src/utils/secureStorage.js` - Secure token storage
10. `kelmah-backend/services/auth-service/server.js` - Auth microservice

#### **Worker System:**
11. `kelmah-frontend/src/modules/worker/pages/WorkerDashboardPage.jsx` - Worker entry point
12. `kelmah-frontend/src/modules/dashboard/components/worker/EnhancedWorkerDashboard.jsx` - Main dashboard
13. `kelmah-frontend/src/modules/worker/pages/WorkerProfileEditPage.jsx` - Profile management
14. `kelmah-frontend/src/modules/worker/pages/JobSearchPage.jsx` - Job discovery
15. `kelmah-frontend/src/api/services/workersApi.js` - Worker API client
16. `kelmah-backend/services/user-service/server.js` - User microservice

#### **Hirer System:**
17. `kelmah-frontend/src/modules/hirer/pages/HirerDashboardPage.jsx` - Hirer entry point
18. `kelmah-frontend/src/modules/dashboard/components/hirer/EnhancedHirerDashboard.jsx` - Hirer dashboard
19. `kelmah-frontend/src/modules/hirer/pages/JobManagementPage.jsx` - Job management
20. `kelmah-frontend/src/api/services/hirersApi.js` - Hirer API client
21. `kelmah-backend/services/job-service/server.js` - Job microservice

#### **Shared Systems:**
22. `kelmah-frontend/src/modules/messaging/pages/MessagingPage.jsx` - Chat system
23. `kelmah-frontend/src/modules/payment/pages/PaymentCenterPage.jsx` - Payment hub
24. `kelmah-frontend/src/modules/layout/components/Layout.jsx` - Application layout
25. `kelmah-backend/api-gateway/server.js` - API Gateway

### **🔧 SUPPORTING FILES (Module-Specific)**

#### **Worker Module (26-50):**
- Profile components, job search, application tracking
- Earnings management, schedule components
- Skills assessment, portfolio management

#### **Hirer Module (51-75):**
- Worker search components, job posting wizard
- Contract management, payment tracking
- Analytics and reporting components

#### **Shared Modules (76-100):**
- Messaging components, payment processing
- Settings management, notification system
- Search functionality, map integration

---

## 🛡️ **FAULT-TOLERANCE IMPLEMENTATION PLAN**

### **Phase 1: Component Isolation** ✅ COMPLETED
```javascript
// Each component wrapped with error boundaries
// Array validation for all map operations
// API fallbacks implemented
```

### **Phase 2: Module Circuit Breakers** (PROPOSED)
```javascript
// Implement circuit breaker pattern
const useModuleHealth = (moduleName) => {
  const [isHealthy, setIsHealthy] = useState(true);
  
  const handleError = (error) => {
    if (error.isRetryable) {
      // Temporary failure - retry
      setTimeout(() => retry(), 5000);
    } else {
      // Module failure - disable module
      setIsHealthy(false);
    }
  };
  
  return { isHealthy, handleError };
};
```

### **Phase 3: Progressive Loading** (PROPOSED)
```javascript
// Load core features first, then enhanced features
const DashboardLoader = () => {
  return (
    <Suspense fallback={<CoreDashboard />}>
      <EnhancedDashboard />
    </Suspense>
  );
};
```

### **Phase 4: Offline Capabilities** (PROPOSED)
```javascript
// Service worker caching strategy
// Background sync for critical operations
// Offline queue for failed requests
```

---

## 🚀 **BENEFITS OF THIS ARCHITECTURE**

### **✅ Fault Isolation:**
- Worker system failure doesn't affect hirer system
- Individual component failures don't crash entire modules
- API service failures have graceful fallbacks

### **✅ Scalability:**
- Each microservice can scale independently
- Frontend modules can be developed in parallel
- Database specialization for different workloads

### **✅ Maintainability:**
- Clear separation of concerns
- Domain-driven organization
- Independent deployment capabilities

### **✅ User Experience:**
- Progressive loading prevents blank screens
- Offline capabilities for poor network areas
- Graceful degradation when services are unavailable

---

## 📊 **MONITORING & HEALTH CHECKS**

### **Service Health Endpoints:**
- `/health` - Basic service status
- `/health/detailed` - Comprehensive health check
- `/metrics` - Performance metrics
- `/ready` - Readiness probe for deployment

### **Frontend Error Tracking:**
- Component error boundaries
- API failure monitoring
- User experience analytics
- Performance monitoring

---

This architecture ensures that **corruption in sub-sectors doesn't affect the whole codebase** through:

1. **Module Isolation** - Each domain is independent
2. **Error Boundaries** - Component failures are contained
3. **API Resilience** - Multiple fallback strategies
4. **Service Independence** - Microservice failures don't cascade
5. **Progressive Enhancement** - Core features work even if advanced features fail

**Please review this architecture plan and let me know if you approve it before I implement the enhanced fault-tolerance features!**
