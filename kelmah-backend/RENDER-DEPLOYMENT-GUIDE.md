# 🚀 **KELMAH API GATEWAY - RENDER DEPLOYMENT GUIDE**

## 📋 **DEPLOYMENT STATUS**
- ✅ **Root `server.js`** - Created (starts API Gateway)
- ✅ **Package.json** - Updated (correct start command)
- ✅ **Service URLs** - Identified from your deployed services
- 🔧 **Environment Variables** - Need to be set in Render

---

## 🛠️ **RENDER CONFIGURATION**

### **1. Build & Start Commands**
```bash
Build Command: npm install
Start Command: node server.js
```

### **2. Required Environment Variables**
Set these in your Render service dashboard:

#### **🔧 Core Configuration**
```bash
NODE_ENV=production
PORT=10000
API_GATEWAY_PORT=10000
```

#### **🌐 Frontend & CORS**
```bash
FRONTEND_URL=https://project-kelmah.vercel.app
ALLOWED_ORIGINS=https://project-kelmah.vercel.app
```

#### **🔗 Microservice URLs** (Your Deployed Services)
```bash
AUTH_SERVICE_URL=https://kelmah-auth-service.onrender.com
USER_SERVICE_URL=https://kelmah-user-service.onrender.com
JOB_SERVICE_URL=https://kelmah-job-service.onrender.com
PAYMENT_SERVICE_URL=https://kelmah-payment-service.onrender.com
MESSAGING_SERVICE_URL=https://kelmah-messaging-service.onrender.com
```

#### **🔐 Security Configuration**
```bash
JWT_SECRET=your-super-secure-jwt-secret-key-here-make-it-long-and-random
JWT_REFRESH_SECRET=your-different-refresh-secret-key-here-also-long-and-random
INTERNAL_API_KEY=your-internal-service-communication-key
```

#### **⚡ Performance & Logging**
```bash
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

---

## 🚨 **IMMEDIATE FIX FOR YOUR CURRENT ERROR**

**Your Error:** `Cannot find module '/opt/render/project/src/server.js'`

**Solution:** 
1. ✅ **DONE** - Created root `server.js` that starts API Gateway  
2. ✅ **DONE** - Updated `package.json` start command
3. 🔧 **TODO** - Set environment variables in Render
4. 🔄 **TODO** - Redeploy your service

---

## 📝 **STEP-BY-STEP DEPLOYMENT**

### **Step 1: Set Environment Variables in Render**
1. Go to your Render service dashboard
2. Click on "Environment" tab
3. Add ALL the environment variables listed above
4. **IMPORTANT:** Generate strong random strings for JWT secrets

### **Step 2: Trigger Redeploy**
1. In Render dashboard, click "Manual Deploy" 
2. Select "Deploy latest commit"
3. Wait for deployment to complete

### **Step 3: Test the API Gateway**
Once deployed, test these endpoints:
```bash
# Health check
GET https://your-api-gateway.onrender.com/health

# API documentation  
GET https://your-api-gateway.onrender.com/api/docs

# Auth service proxy (example)
POST https://your-api-gateway.onrender.com/api/auth/login
```

---

## 🎯 **EXPECTED RESULT**

After deployment, your API Gateway will:
- ✅ Start successfully on Render
- ✅ Route requests to your microservices
- ✅ Handle CORS for your frontend
- ✅ Provide centralized authentication
- ✅ Offer unified API documentation

**Architecture:**
```
Frontend (Vercel) → API Gateway (Render) → Microservices (Render)
                                         ↓
https://project-kelmah.vercel.app → [Gateway] → All 5 Services
```

---

## 🔧 **TROUBLESHOOTING**

### **If API Gateway Starts But Services Don't Respond:**
1. Check service URLs are correct and accessible
2. Verify CORS settings allow your frontend domain
3. Check JWT_SECRET matches across services

### **If Frontend Can't Connect:**
1. Update frontend API_BASE_URL to your gateway URL
2. Check CORS origins include your frontend URL
3. Verify SSL certificates are working

### **If Authentication Fails:**
1. Ensure JWT_SECRET is set correctly
2. Check that auth service is responding
3. Verify token forwarding is working

---

## 🚀 **NEXT STEPS AFTER DEPLOYMENT**

1. **Test All Endpoints** - Verify each service works through gateway
2. **Update Frontend** - Point frontend to use gateway URL
3. **Monitor Performance** - Check logs and response times  
4. **Set Up Custom Domain** (Optional) - Configure custom domain
5. **Enable HTTPS** - Ensure all traffic is encrypted

---

**🎉 Once deployed, your API Gateway URL will be:**
`https://your-service-name.onrender.com`

**This will be your single entry point for all API requests!**