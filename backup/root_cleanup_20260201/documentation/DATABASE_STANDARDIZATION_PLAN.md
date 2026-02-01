# PHASE 1A: DATABASE STANDARDIZATION PLAN

## CRITICAL FINDINGS FROM AUDIT

### **Current Database Setup Analysis:**

#### **1. CONFIRMED TRIPLE DATABASE SYSTEM:**
- **Main App (`src/`)**: Uses PostgreSQL via Sequelize
- **Microservices**: All use MongoDB via Mongoose (auth-service, user-service, job-service)
- **Mixed Usage**: Controllers randomly use either database system

#### **2. SEQUELIZE USAGE IN MAIN APP:**
- `src/config/db.js` - Sets up both MongoDB and PostgreSQL connections
- `src/app.js` - Connects to both databases simultaneously  
- `src/models/User.js` - 312-line Sequelize User model
- `src/models/Role.js` - Sequelize Role model
- `src/models/auth/RefreshToken.js` - Sequelize RefreshToken model
- `src/controllers/user.controller.js` - Uses Sequelize User model
- `src/controllers/auth.js` - Uses Sequelize User and RefreshToken models
- Multiple payment/subscription models using Sequelize

#### **3. MONGODB USAGE IN MICROSERVICES:**
- `services/auth-service/models/User.js` - 293-line Mongoose User model
- `services/user-service/models/User.js` - 365-line Mongoose User model  
- `services/job-service/models/Job.js` - 349-line Mongoose Job model
- All microservice database configs use MongoDB only

#### **4. CRITICAL DATABASE SCHIZOPHRENIA:**
- **SAME USER ENTITY exists in 3 different places:**
  - Sequelize User (main app) - 312 lines
  - Mongoose User (auth-service) - 293 lines  
  - Mongoose User (user-service) - 365 lines
- **Data Inconsistency Risk**: User records could exist in PostgreSQL AND MongoDB
- **Synchronization Chaos**: No mechanism to keep data synchronized

---

## EMERGENCY DATABASE STANDARDIZATION SOLUTION

### **DECISION: STANDARDIZE ON MONGODB/MONGOOSE**

**Rationale:**
1. **Microservices Already Use MongoDB** - 4 of 5 services use MongoDB
2. **Mature Implementation** - Well-developed Mongoose models in services
3. **Production Ready** - MongoDB configs already production-ready
4. **Less Migration Work** - Only need to migrate main app

### **PHASE 1A EXECUTION PLAN:**

#### **Step 1: Remove ALL Sequelize/PostgreSQL Dependencies**
- ✅ **Files to Eliminate:**
  - `src/models/User.js` (Sequelize version - 312 lines)
  - `src/models/Role.js` (Sequelize version)
  - `src/models/auth/RefreshToken.js` (Sequelize version)
  - All Sequelize payment/subscription models
  - `src/models/index.js` (Sequelize model registry)

#### **Step 2: Update Database Configuration**
- ✅ **Modify:** `src/config/db.js`
  - Remove all Sequelize configuration code
  - Keep only MongoDB/Mongoose connection
  - Remove PostgreSQL connection strings and options

#### **Step 3: Update Main App Initialization**
- ✅ **Modify:** `src/app.js`
  - Remove Sequelize authentication and sync calls
  - Keep only MongoDB connection
  - Remove PostgreSQL references

#### **Step 4: Convert Controllers to Use Mongoose Models**
- ✅ **Update:** `src/controllers/user.controller.js`
  - Replace Sequelize User model with Mongoose User model
  - Update all database queries to use Mongoose syntax
  - Replace `findByPk` with `findById`, etc.
  
- ✅ **Update:** `src/controllers/auth.js`
  - Replace Sequelize models with Mongoose equivalents
  - Update all authentication logic to use Mongoose
  - Convert all database operations

#### **Step 5: Create Unified Model Library**
- ✅ **Create:** `shared/models/` directory
  - Move consolidated User model to shared location
  - Create unified Job, Message, Notification models
  - Ensure all services import from shared models

#### **Step 6: Update Package Dependencies**
- ✅ **Remove from package.json:**
  - `sequelize`
  - `sequelize-cli` 
  - `pg`
  - `pg-hstore`
  - `mysql2`
- ✅ **Keep:** `mongoose`, `mongodb`

---

## IMPLEMENTATION PRIORITY MATRIX

### **CRITICAL PRIORITY (DO FIRST):**
1. **Database Configuration Cleanup** - Remove dual database setup
2. **Model Consolidation** - Eliminate triple User model implementations
3. **Controller Migration** - Convert main app controllers to Mongoose

### **HIGH PRIORITY (DO NEXT):**
4. **Package Cleanup** - Remove unnecessary dependencies
5. **Service Integration Testing** - Verify all services work with single database
6. **Data Migration Scripts** - If any production data needs migration

---

## VALIDATION CHECKLIST

### **Before Starting:**
- [x] Audit complete - confirmed triple database system
- [ ] Backup any production data in PostgreSQL
- [ ] Verify all microservices use MongoDB correctly

### **During Implementation:**
- [ ] Test each controller conversion individually  
- [ ] Verify authentication still works after migration
- [ ] Check all API endpoints respond correctly
- [ ] Validate data consistency across services

### **After Completion:**
- [ ] All controllers use Mongoose models only
- [ ] No Sequelize references remain in codebase
- [ ] Single MongoDB database for all services
- [ ] Authentication works across all services
- [ ] API Gateway can communicate with all services

---

## RISK MITIGATION

### **Data Loss Prevention:**
- Export existing PostgreSQL data before migration
- Test migration on development environment first
- Keep backup of original Sequelize models during transition

### **Service Downtime Prevention:**
- Implement migration in phases
- Test each service individually after migration
- Rollback plan if issues arise

### **Authentication Continuity:**
- Ensure JWT tokens remain valid during migration
- Test login/logout flows after each change
- Verify user sessions are preserved

---

**STATUS:** ✅ AUDIT COMPLETE - READY TO START IMPLEMENTATION

**NEXT ACTION:** Begin Step 1 - Remove Sequelize dependencies and models