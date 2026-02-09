# Project Kelmah Structure

## Overview
Project Kelmah is organized using a domain-driven architecture, where code is grouped by business domains rather than technical layers.

## Main Structure

```
kelmah-frontend/
├── src/
    ├── modules/              # Main domain modules 
    │   ├── auth/             # Authentication & user management
    │   │   ├── components/
    │   │   ├── contexts/
    │   │   ├── hooks/
    │   │   ├── pages/
    │   │   └── services/
    │   │
    │   ├── common/           # Shared components and utilities
    │   │   ├── components/
    │   │   └── services/
    │   │
    │   ├── contracts/        # Contract management
    │   ├── dashboard/        # Dashboard features
    │   ├── hirer/            # Hirer-specific features
    │   ├── jobs/             # Job listings and management
    │   │   ├── components/
    │   │   │   ├── listing/
    │   │   │   ├── job-application/
    │   │   │   └── ...
    │   │   ├── pages/
    │   │   └── services/
    │   │
    │   ├── layout/           # Layout components
    │   ├── messaging/        # Messaging features
    │   ├── notifications/    # Notification components and services
    │   ├── payment/          # Payment processing
    │   ├── profile/          # User profiles
    │   ├── reviews/          # Review features
    │   ├── search/           # Search functionality
    │   ├── settings/         # Settings pages
    │   └── worker/           # Worker-specific features
    │
    ├── api/                  # Deprecated - moved to module services
    ├── assets/               # Static assets (images, icons, etc.)
    ├── config/               # App configuration and constants
    │   └── constants.js      # Global constants and environment config
    ├── store/                # Redux store configuration
    │   └── index.js          # Store setup with reducers from modules
    ├── styles/               # Global styles
    ├── utils/                # Utility functions
    │   └── apiUtils.js       # API interaction utilities
    ├── App.jsx               # Main App component
    └── main.jsx              # Entry point
```

## Domain Modules
Each domain module follows a consistent structure:

### Components
UI components specific to that domain. Organized into subdirectories by feature.

### Pages
Page components for routing.

### Services
Business logic and API services:
- Redux slices
- API service functions
- Utilities specific to the module

### Contexts
React contexts for state management within the module.

### Hooks
Custom hooks specific to the module's functionality.

## Common Services
Shared services are located in:
- `modules/common/services` - For UI components and utilities
- `utils/apiUtils.js` - For API interaction utilities

## Store Structure
The Redux store imports reducers from their respective domain modules:
```javascript
// store/index.js
import authReducer from '../modules/auth/services/authSlice';
import jobReducer from '../modules/jobs/services/jobSlice';
// etc.
```

## Import Patterns
Standard import patterns:
- Relative imports for components within the same module
- Path imports for cross-module dependencies 