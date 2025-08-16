#!/bin/bash
# Vercel Deployment Script
echo "Building and deploying to Vercel..."
cd kelmah-frontend
npm install --legacy-peer-deps
npm run build
vercel --prod --yes
echo "Deployment complete!"
