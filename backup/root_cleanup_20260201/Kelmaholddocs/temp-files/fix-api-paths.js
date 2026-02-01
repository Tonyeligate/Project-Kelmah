#!/usr/bin/env node

// Quick reference for fixing API paths in your frontend

console.log(`
🔧 API Path Mapping for Microservices:

Current Issues Found:
❌ GET /jobs → Should be GET /api/jobs (Job Service)  
❌ GET /workers/me/credentials → Should be GET /api/users/me/credentials (User Service)
❌ GET /workers/me/availability → Should be GET /api/users/me/availability (User Service)  
❌ GET /messages/conversations → Should be GET /api/messages/conversations (Messaging Service)

✅ Correct Service Routing:

1. Auth Service (already working):
   /api/auth/* → kelmah-auth-service

2. Job Service:
   /api/jobs/* → kelmah-job-service
   
3. User Service (for worker profiles, availability):
   /api/users/* → kelmah-user-service
   
4. Messaging Service:
   /api/messages/* → kelmah-messaging-service
   
5. Payment Service:
   /api/payments/* → kelmah-payment-service

🚀 Fix Applied:
- Updated axios baseURL to empty string in development
- Fixed workers API paths to use /api/users/*
- Fixed messages API paths to use /api/messages/*

Next: Test the worker dashboard to see if jobs and other features load correctly.
`); 