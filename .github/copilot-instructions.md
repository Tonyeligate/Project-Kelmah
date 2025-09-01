# Kelmah Project - AI Assistant Guidelines

## Project Overview
Kelmah is a freelance marketplace with **domain-driven microservices backend** on Render and **modular React frontend** on Vercel.

## 🏗️ Architecture Essentials

### Frontend: Domain-Driven Modules (`kelmah-frontend/src/modules/`)
```
auth/           # useAuth() hook, AuthContext, JWT tokens
jobs/           # Job listings, applications
messaging/      # WebSocket chat, real-time communication
payment/        # Escrow, payment processing
common/         # Shared Button, Modal, axios clients
worker/hirer/   # Role-specific features
```

### Backend: Microservices (`kelmah-backend/services/`)
- **auth-service**: JWT tokens, user authentication (Port 5001)
- **user-service**: User profiles, management (Port 5002)
- **job-service**: Job CRUD, applications (Port 5003)
- **messaging-service**: WebSocket handler, real-time chat (Port 5004)
- **payment-service**: Escrow, transactions (Port 5005)
- **review-service**: Reviews, ratings (Port 5006)

## 🔧 Critical Development Patterns

### Authentication State Management
- **Context**: `modules/auth/contexts/AuthContext.jsx` (primary)
- **Redux Slice**: `modules/auth/services/authSlice.js` (avoid dual state)
- **Hook**: `useAuth()` from AuthContext, NOT Redux
- **Storage**: `authToken` in localStorage via `secureStorage.js`

### Service Communication
```javascript
// Backend inter-service calls
const ServiceClient = {
  auth: { validateToken: async (token) => {...} },
  user: { getUserDetails: async (userId) => {...} }
};

// Frontend API clients (use environment.js endpoints)
import { API_ENDPOINTS } from '@/config/environment';
const response = await axios.post(API_ENDPOINTS.AUTH.LOGIN, userData);
// Auto-includes auth headers, retry logic, error handling via axios interceptors

// Environment-based service routing
// Development: /api/auth → Vite proxy → auth-service
// Production: /api/auth → API Gateway → auth-service
```

### WebSocket Patterns
```javascript
// Authentication with Socket.io (messaging-service specific)
const socket = io(wsUrl, {
  auth: { token, userId, userRole },
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5
});

// Join conversation rooms and handle real-time events
socket.emit('join_conversation', { conversationId });
socket.on('new_message', handleNewMessage);
socket.on('conversation_joined', ({ messages }) => setMessages(messages));
socket.on('typing_start', ({ userId, conversationId }) => showTyping(userId));

// Rate limiting: 60 messages per minute per socket
socket.emit('send_message', { conversationId, content, clientId }, (ack) => {
  if (!ack.ok) console.error('Message failed:', ack.error);
});
```

## 🚨 Project-Specific Gotchas

### Import Path Rules
- **Same module**: `./components/Button` (relative)
- **Cross-module**: `@/modules/auth/contexts/AuthContext` (absolute)
- **Common**: `@/modules/common/services/axios` (centralized clients)
- **Avoid**: `/api/api` duplication in URLs (normalizeUrlForGateway fixes this)

### Database Strategy (Mixed)
- **MongoDB**: messaging-service, payment-service
- **PostgreSQL**: job-service  
- **Both**: auth-service, user-service (legacy migration)
- Check `models/index.js` in each service for data layer

### File Organization
- **Old files archived**: Check `Kelmaholddocs/` for historical documentation
- **Active codebase**: Only essential files remain in root
- **Legacy scripts**: Moved to `Kelmaholddocs/old-scripts/` (preserved but inactive)

## 🎯 Essential Commands

### Development Workflow
```bash
# Start individual services
npm run dev:auth               # Port 5001
npm run dev:user               # Port 5002  
npm run dev:job                # Port 5003
npm run dev:messaging          # Port 5004 (WebSocket)
npm run dev:payment            # Port 5005
npm run dev:review             # Port 5006
npm run dev:gateway            # Port 5000 (API Gateway)
npm run dev:frontend           # Port 3000 (Vite proxy)

# Health checks
npm run health:all             # All services + gateway + frontend
npm run health:services        # Just backend services
curl localhost:5001/health     # Individual service

# Critical tests
npm run test:critical          # Auth, payment, email only
npm run test:auth              # Auth service tests
npm run test:frontend          # Frontend tests
```

### Service Management
```bash
# Install dependencies for all services
npm run services:install

# Database operations  
npm run db:migrate             # Run MongoDB migrations
npm run db:seed               # Seed all service databases

# Production builds
npm run build:all             # Build frontend + backend
```

### Service URLs
```javascript
// Production (use in API_ENDPOINTS)
AUTH: 'https://kelmah-auth-service.onrender.com'
USER: 'https://kelmah-user-service.onrender.com'
JOB: 'https://kelmah-job-service.onrender.com'
MESSAGING: 'https://kelmah-messaging-service.onrender.com'
PAYMENT: 'https://kelmah-payment-service.onrender.com'
REVIEW: 'https://kelmah-review-service.onrender.com'
// Development proxy: /api → localhost:5000 → services
```

## 🔄 Common Patterns

### Error Handling & Investigation
```javascript
// Axios interceptors handle 401 refresh automatically
// WebSocket: listen for 'error' events
socket.on('error', ({ message }) => showError(message));
```

**Critical: Deep Investigation Required**
- **NO GUESSWORK**: Always investigate error root causes thoroughly
- **NO SUGGESTIONS**: Provide concrete solutions based on evidence
- **READ ALL INVOLVED FILES**: Every file mentioned in error traces must be read and reviewed
- **MAP FILE FLOWS**: List and examine the complete flow of files involved in the error
- **TRACE EXECUTION PATH**: Follow the exact code path from error trigger to failure point
- **PRECISE ERROR IDENTIFICATION**: Verify exact error types, messages, and conditions
- **SCAN FOR RELATED ERRORS**: Check file flows for cascading or upstream errors
- **CROSS-REFERENCE PATTERNS**: Look for similar error patterns across the codebase
- **VALIDATE ERROR REPRODUCTION**: Confirm errors can be reproduced with specific steps
- **CHECK ERROR CONTEXT**: Examine surrounding code, recent changes, and dependencies
- **VERIFY DATA STATES**: Check database records, API responses, and variable values
- **AUTHENTICATE FINDINGS**: Use multiple diagnostic sources to confirm root causes
- **Use diagnostic tools**: Check logs, network requests, console errors
- **Verify assumptions**: Test each hypothesis with actual code/data
- **Follow error chains**: Trace errors from frontend → API Gateway → service
- **Check service health**: Use `npm run health:all` before assuming code issues

### State Management
- **Global**: Redux for auth, notifications
- **Local**: React Context for module-specific state
- **Avoid**: Mixing Redux + Context for same data

### Component Structure
```javascript
// Functional components with hooks (no class components)
const Component = () => {
  const { user, isAuthenticated } = useAuth(); // NOT useSelector
  // UI logic separate from business logic
};
```

## 📁 Key Directories

### Active Development
- `kelmah-frontend/src/modules/` - Frontend domain modules
- `kelmah-backend/services/` - Backend microservices
- `kelmah-backend/api-gateway/` - Request routing & auth
- `tests/` - Integration and E2E tests

### Documentation & Archive
- `Kelmah-Documentation/` - Current project documentation
- `Kelmaholddocs/` - Archived files from cleanup (3000+ files)
- `README.md` - Main project overview
