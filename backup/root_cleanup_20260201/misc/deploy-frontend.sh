#!/bin/bash
# Simple deployment script for Kelmah Frontend

echo "🏗️  Building Kelmah Frontend..."

# Navigate to frontend directory
cd kelmah-frontend

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Build the project
echo "🔨 Building project..."
npm run build

# Check if build was successful
if [ -d "build" ] && [ -f "build/index.html" ]; then
    echo "✅ Build successful! Files ready for deployment:"
    ls -la build/
    
    echo "🚀 Deploying to Vercel..."
    npx vercel build --prod
    npx vercel deploy --prebuilt --prod
else
    echo "❌ Build failed - no build directory or index.html found"
    exit 1
fi
