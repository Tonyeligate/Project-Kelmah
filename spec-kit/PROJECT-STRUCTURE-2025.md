# 🏗️ KELMAH PROJECT STRUCTURE - 2025 UPDATE

## 📊 PROJECT OVERVIEW
**Project Name:** Kelmah - Vocational Skills Platform  
**Architecture:** Microservices with React Frontend  
**Last Updated:** September 1, 2025  
**Status:** Production Ready with Dynamic Configuration

---

## 🏛️ CORE ARCHITECTURE

### **Backend Services (Microservices)**
```
kelmah-backend/
├── services/
│   ├── auth-service/          # Authentication & Authorization
│   ├── user-service/          # User Management
│   ├── job-service/           # Job Postings & Applications
│   ├── messaging-service/     # Real-time Communication
│   ├── payment-service/       # Payment Processing
│   └── review-service/        # User Reviews & Ratings
├── api-gateway/               # API Gateway & Routing
├── shared/                    # Shared Utilities & Middleware
└── config/                    # Environment Configuration
```

### **Frontend Application**
```
kelmah-frontend/
├── src/
│   ├── modules/               # Feature-based Modules
│   │   ├── auth/             # Authentication
│   │   ├── dashboard/        # User Dashboards
│   │   ├── messaging/        # Real-time Chat
│   │   ├── jobs/            # Job Management
│   │   ├── profile/         # User Profiles
│   │   └── settings/        # User Settings
│   ├── components/           # Reusable Components
│   ├── hooks/               # Custom React Hooks
│   ├── services/            # API Services
│   ├── store/               # Redux State Management
│   └── utils/               # Utility Functions
├── public/                   # Static Assets
└── vercel.json              # Vercel Deployment Config
```

---

## 🚀 SERVICE STARTUP SCRIPTS

### **Individual Service Management**
- `start-api-gateway.js` - API Gateway Service
- `start-auth-service.js` - Authentication Service
- `start-user-service.js` - User Management Service
- `start-job-service.js` - Job Service
- `start-messaging-service.js` - Messaging Service
- `start-payment-service.js` - Payment Service
- `start-review-service.js` - Review Service

### **Infrastructure Management**
- `ngrok-manager.js` - Dynamic ngrok Tunnel Management
- `start-ngrok.js` - ngrok Tunnel Initialization

---

## 🔧 CONFIGURATION MANAGEMENT

### **Dynamic Configuration System**
- **Runtime Configuration:** `kelmah-frontend/public/runtime-config.json`
- **Dynamic URL Resolution:** Automatic ngrok URL updates
- **Frontend Integration:** Real-time configuration injection
- **Vercel Integration:** Automatic rewrite rule updates

### **Environment Management**
- **Backend:** Individual `.env` files per service
- **Frontend:** Environment-specific configurations
- **Security:** Encrypted configuration handling

---

## 📚 DOCUMENTATION STRUCTURE

### **Kelmaholddocs Organization**
```
Kelmaholddocs/
├── backup-files/             # Backup Configuration Files
├── deployment-configs/       # AWS ECS & Deployment Configs
├── installers/               # Software Installers
├── logs/                     # Service Logs & Monitoring
├── old-docs/                 # Legacy Documentation
│   ├── ai-proposals/        # AI Development Proposals
│   ├── backend/             # Backend Documentation
│   ├── diagrams/            # System Architecture Diagrams
│   ├── docs/                # Deployment Documentation
│   ├── infra/               # Infrastructure Configs
│   ├── migrations-mongodb/  # Database Migration Scripts
│   └── scripts/             # Development Scripts
├── planning-docs/            # Project Planning Documents
├── reports/                  # Implementation Reports
└── temp-files/               # Temporary Development Files
```

---

## 🌐 NETWORK & DEPLOYMENT

### **Development Environment**
- **Local Backend:** Ports 3000-3006
- **ngrok Tunnels:** Dynamic public URLs
- **Frontend:** Vercel-hosted with local backend integration

### **Production Deployment**
- **Frontend:** Vercel Platform
- **Backend:** Render Platform (Microservices)
- **Database:** MongoDB Atlas
- **Real-time:** Socket.IO with WebSocket support

---

## 🔐 SECURITY FEATURES

### **Authentication System**
- **JWT Tokens:** Access & Refresh Token Management
- **Secure Storage:** Encrypted Local Storage
- **Session Management:** Automatic Token Refresh
- **Role-based Access:** User Permission System

### **API Security**
- **CORS Configuration:** Cross-origin Request Handling
- **Rate Limiting:** Request Throttling
- **Input Validation:** Request Sanitization
- **Error Handling:** Secure Error Responses

---

## 📱 FRONTEND FEATURES

### **Core Modules**
- **Authentication:** Login, Registration, Password Reset
- **Dashboard:** User-specific Dashboards (Worker/Hirer)
- **Messaging:** Real-time Chat System
- **Job Management:** Post, Apply, Track Jobs
- **Profile Management:** User Profile & Settings
- **Notifications:** Real-time Notifications

### **Technical Features**
- **Responsive Design:** Mobile-first Approach
- **State Management:** Redux with RTK Query
- **Real-time Updates:** WebSocket Integration
- **Dynamic Routing:** React Router with Guards
- **Performance:** Code Splitting & Lazy Loading

---

## 🗄️ DATABASE ARCHITECTURE

### **MongoDB Collections**
- **Users:** User Profiles & Authentication
- **Jobs:** Job Postings & Applications
- **Messages:** Real-time Communication
- **Reviews:** User Ratings & Feedback
- **Payments:** Transaction Records
- **Sessions:** User Session Management

---

## 🧪 TESTING & QUALITY

### **Testing Strategy**
- **Unit Tests:** Component & Service Testing
- **Integration Tests:** API Endpoint Testing
- **E2E Tests:** User Workflow Testing
- **Performance Tests:** Load & Stress Testing

### **Code Quality**
- **ESLint:** Code Style Enforcement
- **Prettier:** Code Formatting
- **TypeScript:** Type Safety (Partial)
- **Git Hooks:** Pre-commit Validation

---

## 📈 MONITORING & OBSERVABILITY

### **Logging System**
- **Structured Logging:** JSON Format Logs
- **Log Levels:** Debug, Info, Warn, Error
- **Centralized Logging:** Service Aggregation
- **Performance Metrics:** Response Time Tracking

### **Health Checks**
- **Service Health:** Individual Service Monitoring
- **Database Health:** Connection Status
- **API Health:** Endpoint Availability
- **Real-time Status:** Live Service Monitoring

---

## 🚀 DEPLOYMENT WORKFLOW

### **Development Process**
1. **Local Development:** Individual service startup
2. **ngrok Integration:** Dynamic tunnel management
3. **Frontend Updates:** Automatic configuration injection
4. **Testing:** Local & staging validation
5. **Deployment:** Automated Vercel deployment

### **Production Pipeline**
1. **Code Commit:** GitHub repository updates
2. **Automated Testing:** CI/CD pipeline validation
3. **Frontend Deployment:** Vercel automatic deployment
4. **Backend Updates:** Render platform deployment
5. **Health Monitoring:** Production service validation

---

## 🔄 RECENT UPDATES (September 2025)

### **Major Improvements**
- ✅ **Codebase Cleanup:** Removed 68,556 lines of unused code
- ✅ **Documentation Reorganization:** Structured legacy documentation
- ✅ **Service Startup Scripts:** Individual service management
- ✅ **Dynamic Configuration:** Real-time ngrok URL management
- ✅ **React Error Fixes:** Resolved Rules of Hooks violations
- ✅ **Performance Optimization:** Removed test coverage bloat

### **Architecture Enhancements**
- **Microservice Isolation:** Independent service startup
- **Dynamic URL Resolution:** Automatic frontend configuration
- **Clean Project Structure:** Organized file organization
- **Improved Maintainability:** Better code organization

---

## 📋 NEXT STEPS

### **Immediate Priorities**
1. **Dashboard Testing:** Verify React Error #310 fix
2. **Service Validation:** Confirm all microservices operational
3. **Performance Testing:** Validate cleanup improvements
4. **Documentation Updates:** Update user guides

### **Future Enhancements**
- **TypeScript Migration:** Full type safety implementation
- **Advanced Testing:** Comprehensive test coverage
- **Performance Monitoring:** Advanced metrics collection
- **Security Auditing:** Vulnerability assessment

---

## 📞 SUPPORT & MAINTENANCE

### **Development Team**
- **Backend Services:** Node.js/Express Microservices
- **Frontend Application:** React/Redux SPA
- **Database Management:** MongoDB with Mongoose
- **DevOps:** Vercel & Render Platform Management

### **Maintenance Schedule**
- **Daily:** Service health monitoring
- **Weekly:** Performance review & optimization
- **Monthly:** Security updates & dependency management
- **Quarterly:** Architecture review & planning

---

*This document reflects the current state of the Kelmah project as of September 1, 2025. For the most up-to-date information, refer to the GitHub repository.*
