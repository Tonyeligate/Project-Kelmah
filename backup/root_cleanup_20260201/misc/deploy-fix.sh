#!/bin/bash

# 🚀 QUICK DEPLOY SCRIPT FOR RENDER FIX

echo "🎯 Deploying Render deployment fix..."

# Add and commit changes
git add .
git commit -m "🚀 Fix Render deployment - server.js path issue

✅ Fixed server.js entry points (both root and src)
✅ Updated API Gateway startup configuration  
✅ Added comprehensive deployment guide
✅ Tested server startup process

Fixes: Cannot find module '/opt/render/project/src/server.js'"

# Push to origin
echo "📤 Pushing to GitHub..."
git push origin main

echo ""
echo "✅ DEPLOYMENT FIX PUSHED!"
echo ""
echo "🎯 NEXT STEPS:"
echo "1. Go to your Render service dashboard"
echo "2. Set environment variables (see RENDER-DEPLOYMENT-FIX.md)"
echo "3. Click 'Manual Deploy' → 'Deploy latest commit'"
echo ""
echo "📋 Required Environment Variables:"
echo "   - JWT_SECRET (64+ characters)"
echo "   - JWT_REFRESH_SECRET (64+ characters, different from JWT_SECRET)"
echo "   - AUTH_SERVICE_URL, USER_SERVICE_URL, etc."
echo "   - NODE_ENV=production"
echo "   - FRONTEND_URL=your-frontend-url"
echo ""
echo "📚 Full guide: RENDER-DEPLOYMENT-FIX.md"