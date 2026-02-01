#!/bin/bash
# Vercel Deployment Script for Kelmah Frontend
# This script ensures proper deployment from the repository root

echo "🚀 Starting Vercel deployment..."

# Ensure we're in the repo root
cd "$(dirname "$0")"

# Verify the build works locally first
echo "📦 Building locally to verify..."
cd kelmah-frontend
npm install --legacy-peer-deps
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Local build successful"
else
    echo "❌ Local build failed - aborting deployment"
    exit 1
fi

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
cd ..
npx vercel --prod --force

echo "🎉 Deployment complete!"
