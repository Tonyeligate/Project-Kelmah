# 🗄️ Database Migration Guide - Fix Real Data Connections

## 🚨 **CRITICAL: Database Schema Fix Required**

Your User Service is failing with: `column "isPhoneVerified" does not exist`

This guide will walk you through fixing your production TimescaleDB schema.

## 📋 **Step 1: Get Your Database Connection String**

### **Option A: From Render Dashboard**

1. Go to your **Render Dashboard**
2. Click on your **database** (TimescaleDB)
3. Go to **Connection** tab
4. Copy the **External Database URL**

It should look like:
```
postgres://username:password@host:port/database_name
```

### **Option B: From Service Environment Variables**

1. Go to your **Render Services**
2. Click on any service (like `kelmah-auth-service`)
3. Go to **Environment** tab
4. Look for these variables:
   - `SQL_URL`
   - `AUTH_SQL_URL` 
   - `USER_SQL_URL`
   - `JOB_SQL_URL`

Copy the connection string from any of these.

## 🔧 **Step 2: Run Database Migration**

Open your terminal in the project directory:

```bash
# Navigate to scripts directory
cd scripts

# Set your database connection string (replace with your actual URL)
export DATABASE_URL="postgres://your_username:your_password@your_host:port/your_database"

# Run the migration script
npm run fix-db
```

### **Expected Output:**
```
🔄 Connecting to production database...
✅ Connected to TimescaleDB
📝 Creating Users table...
✅ Users table created successfully
🔧 Adding missing columns: isPhoneVerified
✅ Missing columns added
📝 Creating Jobs table...
✅ Jobs table created
📝 Creating messaging tables...
✅ Messaging tables created
📝 Creating payment tables...
✅ Payment tables created
🌱 Adding sample data for testing...
✅ Admin user created
✅ Sample jobs created

🎉 DATABASE FIX COMPLETED SUCCESSFULLY!

📋 Next steps:
1. Restart all Render services
2. Test API endpoints
3. Verify real data in frontend
```

## 🚨 **If You Get Connection Errors**

### **SSL Certificate Error:**
```bash
# Add SSL mode to your connection string
export DATABASE_URL="postgres://username:password@host:port/database?sslmode=require"
```

### **IP Whitelist Error:**
1. Go to Render Dashboard → Database → Connections
2. Make sure "Allow connections from all IP addresses" is enabled
3. Or add your current IP to the whitelist

### **Connection Timeout:**
```bash
# Try with longer timeout
export DATABASE_URL="postgres://username:password@host:port/database?connect_timeout=60"
```

## ✅ **Step 3: Verify Migration Success**

After successful migration, test the User Service:

```bash
curl -s "https://kelmah-user-service.onrender.com/api/users"
```

**Before Fix:**
```json
{"success":false,"status":"error","message":"column \"isPhoneVerified\" does not exist"}
```

**After Fix:**
```json
{"success":true,"data":[],"message":"Users retrieved successfully"}
```

## 🔄 **Step 4: Restart All Render Services**

Go to your Render Dashboard and restart these services **in order**:

1. **Database** (if needed)
2. **kelmah-auth-service**
3. **kelmah-user-service** 
4. **kelmah-job-service**
5. **kelmah-payment-service**
6. **kelmah-messaging-service**

Wait for each service to be fully "Live" before restarting the next one.

## 🧪 **Step 5: Run Full Test Suite**

```bash
# From scripts directory
npm run test-real-data
```

**Expected Results After Fix:**
```
🔍 Testing Service Health Endpoints...
✅ AUTH Service Health
✅ USER Service Health  
✅ JOB Service Health
✅ PAYMENT Service Health
✅ MESSAGING Service Health

👤 Testing User Registration Flow...
✅ User Registration

🔐 Testing User Login Flow...
✅ User Login

📊 Testing User Data Retrieval...
✅ User Data Retrieval

💼 Testing Job Posting Flow...
✅ Job Creation
✅ Job Retrieval

💰 Testing Payment Service...
✅ Payment Methods

============================================================
📊 TEST RESULTS SUMMARY
============================================================
✅ Passed: 8/8
❌ Failed: 0/8
📈 Success Rate: 100%

🎉 ALL TESTS PASSED! Real data is flowing correctly through the system.
```

## 🎯 **What This Migration Does**

### **Creates Missing Tables:**
- **Users**: Complete user profiles with Ghana-specific fields
- **Jobs**: Job postings with GHS currency and local locations
- **Payments**: Payment processing with Mobile Money support
- **Conversations**: Real-time messaging foundation

### **Fixes Schema Issues:**
- Adds missing `isPhoneVerified` column
- Adds proper indexes for performance
- Sets up foreign key relationships
- Configures Ghana-specific defaults

### **Seeds Initial Data:**
- Creates admin user for testing
- Adds sample job postings
- Sets up base data structure

## 🇬🇭 **Ghana-Specific Configuration**

The migration sets up:
- **Currency**: Ghana Cedis (GHS) as default
- **Country**: Ghana as default country  
- **Phone**: Ghana phone format validation
- **Locations**: Ready for Ghana cities and regions
- **Skills**: Trade skills relevant to Ghana market

## 🔍 **Troubleshooting Common Issues**

### **Permission Denied:**
```bash
# Make sure your database user has CREATE permissions
# Check with your database administrator
```

### **Table Already Exists:**
```
✅ This is OK! The script handles existing tables safely
```

### **Migration Hangs:**
```bash
# Cancel (Ctrl+C) and check your connection string
# Ensure database is accessible from your IP
```

### **Still Getting Errors After Migration:**
```bash
# Restart services and wait 2-3 minutes for full restart
# Some services may take time to reconnect to database
```

---

## 🚀 **After Successful Migration**

Your Kelmah platform will have:
- ✅ **Real User Registration** creating actual database records
- ✅ **Live Job Postings** stored in TimescaleDB
- ✅ **Authentic Payment Processing** with real provider integration
- ✅ **Admin Dashboard** showing real platform analytics
- ✅ **No Mock Data** - 100% real data throughout the platform

**Your platform will be production-ready for Ghana's skilled worker marketplace! 🇬🇭✨**