# Kelmah Frontend

A professional platform for skilled trades, connecting experts, and growing businesses. This is the frontend application for the Kelmah trade network platform.

## Project Structure

```
src/
├── api/             # API configuration and service instances
├── assets/          # Static assets like images, icons, etc.
├── components/      # Reusable UI components
│   ├── auth/        # Authentication components (login, register, etc.)
│   ├── common/      # Common UI components used across the app
│   ├── hirer/       # Hirer-specific components
│   ├── layout/      # Layout components (header, footer, etc.)
│   ├── worker/      # Worker/talent-specific components
│   └── ...          # Other component categories
├── contexts/        # React contexts for state management
├── hooks/           # Custom React hooks
├── pages/           # Page components (routes)
│   ├── admin/       # Admin dashboard and management pages
│   ├── hirer/       # Hirer-specific pages
│   ├── worker/      # Worker/talent-specific pages
│   └── ...          # Other page categories
├── services/        # Business logic and API integration
├── store/           # Redux store configuration
│   └── slices/      # Redux slices (actions, reducers)
├── theme/           # Theme configuration
├── utils/           # Utility functions
├── App.jsx          # Main application component
└── main.jsx         # Application entry point
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository
2. Navigate to the frontend directory:
   ```bash
   cd kelmah-frontend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Running the application

Development mode:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Technology Stack

- React - Frontend library
- Redux Toolkit - State management
- Material UI - Component library
- Framer Motion - Animations
- Axios - API communication
- Socket.IO - Real-time communication
- Vite - Build tool

## Key Features

### Worker/Talent Module

The worker module provides comprehensive features for talents to manage their work and engage with clients:

- **Worker Dashboard**: Centralized view of active jobs, earnings, and opportunities
- **Job Search & Application**: Find and apply to relevant jobs with detailed proposals
- **Skills Assessment**: Take tests to verify skills and improve profile visibility
- **Earning Management**: Track earnings, pending payments, and payment history
- **Document Verification**: Upload and manage verification documents
- **Availability Calendar**: Set working hours and manage availability

### Hirer Module

The hirer module enables clients to find talents, post jobs, and manage their projects:

- **Hirer Dashboard**: Overview of posted jobs, active workers, and project statuses
- **Job Posting**: Multi-step process to create detailed job listings
- **Talent Search**: Find qualified workers based on skills, ratings, and location
- **Application Management**: Review and respond to job applications
- **Payment Management**: Process payments and track project budgets
- **Worker Reviews**: Rate and review workers after project completion

## Project Guidelines

1. **Component Structure**: Follow a feature-based approach for organizing components
2. **State Management**: Use React contexts for local/UI state and Redux for global application state
3. **API Communication**: Use the service layer for all API calls
4. **Error Handling**: Implement consistent error handling across the application
5. **Testing**: Write tests for critical components and functionality

## Redux State Management

The application uses Redux for global state management with the following key slices:

- **authSlice**: Authentication state and user data
- **workerSlice**: Worker-specific data including profile, jobs, applications, and earnings
- **hirerSlice**: Hirer-specific data including profile, job posts, and applicants
- **jobSlice**: Job listings, search, and filtering
- **notificationsSlice**: User notifications and preferences

## Contributing

1. Follow the established code style and project structure
2. Use meaningful commit messages
3. Document new features and components
4. Keep the codebase clean and well-organized
