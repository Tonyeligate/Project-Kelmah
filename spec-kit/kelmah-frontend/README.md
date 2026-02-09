# Kelmah Frontend

## Overview
Kelmah is a professional platform for skilled trades, connecting experts and growing businesses.

## Project Structure
This project follows a modular domain-driven design pattern. The codebase is organized into domain-specific modules, each responsible for a specific area of functionality.

```
src/
├── modules/              # Main modules organized by domain
│   ├── auth/             # Authentication related components
│   ├── common/           # Shared UI components and utilities
│   ├── contracts/        # Contract management
│   ├── dashboard/        # Dashboard features
│   ├── home/             # Home page components
│   ├── hirer/            # Hirer-specific features
│   ├── jobs/             # Job listings and management
│   ├── layout/           # Layout components
│   ├── messaging/        # Messaging features
│   ├── notifications/    # Notification components and services
│   ├── payment/          # Payment processing
│   ├── profile/          # User profiles
│   ├── search/           # Search functionality
│   ├── settings/         # Settings pages
│   └── worker/           # Worker-specific features
├── api/                  # API configuration and clients
├── store/                # Global state management
├── assets/               # Static assets
├── styles/               # Global styles
├── routes/               # Route definitions
├── utils/                # Utility functions
├── App.jsx               # Main App component
└── main.jsx              # Entry point
```

## Module Structure
Each module follows a consistent internal structure:
- `/components/` - React components specific to the module
  - `/common/` - Shared components within the module
- `/contexts/` - React contexts for state management
- `/hooks/` - Custom hooks
- `/pages/` - Page components
- `/services/` - API services
- `/utils/` - Utility functions

## Getting Started

### Prerequisites
- Node.js 16.x or higher
- npm 7.x or higher

### Installation
1. Clone the repository
   ```bash
git clone https://github.com/your-username/kelmah-frontend.git
   cd kelmah-frontend
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start the development server
```bash
npm run dev
```

### Environment Variables

This project supports toggling between mock data and the real API using Vite environment variables. Create a file named `.env` in the project root and add:

```
# Toggle use of mock data (default true if not set)
VITE_USE_MOCK_DATA=false

# Base URL of the API Gateway, including the `/api` suffix
VITE_API_URL=http://localhost:5000/api
```

- `VITE_USE_MOCK_DATA`: Set to `false` to use the real API; set to `true` to use mock data (default is `true`).
  
- `VITE_API_URL`: Base URL for all API requests (default is `http://localhost:5000/api`).

### Scripts
- `npm run dev` - Start the development server
- `npm run build` - Build the production version
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

## Contributing
1. Follow the modular structure when adding new features
2. Ensure proper code organization by placing code in the appropriate module
3. Update tests for any changes
4. Ensure all linting rules are followed
