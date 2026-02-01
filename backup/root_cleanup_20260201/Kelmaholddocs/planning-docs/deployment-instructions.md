# Backend Deployment Instructions

## ✅ Configuration Updates Completed

### Files Updated:
1. **vercel.json** - Created Vercel deployment configuration
2. **api/index.js** - Created serverless function entry point  
3. **CORS settings** - Updated across all services for new frontend domain
4. **Environment configs** - Updated with production URLs

## 🚀 Deployment Steps

### 1. Deploy Backend to Vercel
```bash
cd kelmah-backend
vercel --prod
```

### 2. Alternative: Using Git-based Deployment
If connected to Git:
1. Push changes to your repository
2. Vercel will auto-deploy the backend
3. Note the new deployment URL

### 3. Update Frontend Configuration
Once backend is redeployed, update frontend with new backend URL if different.

## 🔧 Environment Variables for Vercel

Set these in Vercel dashboard for your backend project:

```
NODE_ENV=production
FRONTEND_URL=https://kelmah-frontend-cyan.vercel.app
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
```

## 🧪 Testing After Deployment

Run this command to test the new deployment:
```bash
node test-production-apis.js
```

Expected results after successful deployment:
- ✅ API endpoints should return 200 or proper status codes
- ✅ CORS headers should be present
- ✅ Routes should be accessible

## 📋 Current Status

### ✅ Completed
- Frontend: https://kelmah-frontend-cyan.vercel.app (ONLINE)
- Backend configuration files updated
- CORS configured for new frontend domain
- Vercel deployment configuration created

### 🔄 Next Steps  
1. Deploy backend with new vercel.json configuration
2. Test API endpoints
3. Verify frontend can communicate with backend
4. Monitor for any errors in production

## 🆘 Troubleshooting

If endpoints still return 404 after deployment:
1. Check Vercel deployment logs
2. Verify all routes are properly imported in src/app.js
3. Ensure environment variables are set correctly
4. Check that vercel.json routing rules are working 