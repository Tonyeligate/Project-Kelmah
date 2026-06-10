# 🚀 **DEPLOY API GATEWAY TO RENDER - QUICK COMMANDS**

## 📝 **What We Fixed**
- ✅ Created `server.js` in root (starts API Gateway)
- ✅ Updated `package.json` start command
- ✅ Set production service URLs as defaults
- ✅ Added your frontend URL to CORS
- ✅ Created deployment guide

## 🔄 **Deploy Commands**

### **1. Commit Changes**
```bash
git add .
git commit -m "🚀 Add API Gateway deployment configuration for Render

- Add root server.js entry point for API Gateway
- Update package.json start command  
- Configure production service URLs
- Add Vercel frontend to CORS origins
- Add deployment guide and environment setup"
```

### **2. Push to GitHub**
```bash
git push origin main
```

### **3. Set Environment Variables in Render**
Go to your Render service → Environment tab → Add these:

**🔐 CRITICAL (Generate strong random values):**
```bash
JWT_SECRET=put-a-very-long-random-string-here-at-least-64-characters-long
JWT_REFRESH_SECRET=put-a-different-very-long-random-string-here-64-chars
```

**🌐 SERVICE URLS (Copy exactly):**
```bash
AUTH_SERVICE_URL=https://kelmah-auth-service.onrender.com
USER_SERVICE_URL=https://kelmah-user-service.onrender.com
JOB_SERVICE_URL=https://kelmah-job-service.onrender.com
PAYMENT_SERVICE_URL=https://kelmah-payment-service.onrender.com
MESSAGING_SERVICE_URL=https://kelmah-messaging-service.onrender.com
```

**⚙️ CONFIGURATION:**
```bash
NODE_ENV=production
FRONTEND_URL=https://project-kelmah.vercel.app
ALLOWED_ORIGINS=https://project-kelmah.vercel.app
LOG_LEVEL=info
```

### **4. Manual Deploy**
In Render dashboard: **"Manual Deploy"** → **"Deploy latest commit"**

---

## 🎯 **Expected Result**
After deployment, you'll have:
- 🌐 **API Gateway URL**: `https://your-service-name.onrender.com`
- 📋 **Health Check**: `https://your-service-name.onrender.com/health`
- 📚 **API Docs**: `https://your-service-name.onrender.com/api/docs`

## 🔄 **Test After Deployment**
```bash
# Should return API Gateway health status
curl https://your-api-gateway.onrender.com/health

# Should show API documentation
curl https://your-api-gateway.onrender.com/api/docs
```

---

**🎉 Ready to deploy! Run the commands above to push your changes and deploy the API Gateway.**