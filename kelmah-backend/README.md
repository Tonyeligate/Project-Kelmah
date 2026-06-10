# Kelmah Backend

This is the backend for the Kelmah platform, a freelance marketplace connecting hirers with workers.

## Architecture

The backend follows a domain-driven design pattern with a microservices architecture. The main components are:

### API Gateway

The API Gateway serves as the entry point for all client requests. It routes requests to the appropriate microservices.

### Services

The backend is organized into domain-specific services:

- **Auth Service**: Handles authentication, authorization, and user identity management
- **User Service**: Manages user profiles, settings, and user-related operations
- **Job Service**: Handles job postings, job applications, and job-related operations
- **Payment Service**: Manages payments, escrow, and financial transactions
- **Messaging Service**: Handles real-time messaging between users
- **Notification Service**: Manages notifications and alerts
- **Review Service**: Handles reviews and ratings

## Directory Structure

```
kelmah-backend/
├── api-gateway/           # API Gateway service
│   ├── middlewares/       # API Gateway specific middlewares
│   ├── proxy/             # Service proxying logic
│   ├── routes/            # Route definitions
│   ├── utils/             # Utility functions
│   └── server.js          # API Gateway entry point
├── services/              # Domain-specific services
│   ├── auth-service/      # Authentication service
│   │   ├── controllers/   # Request handlers
│   │   ├── middlewares/   # Service-specific middlewares
│   │   ├── models/        # Data models
│   │   ├── routes/        # Route definitions
│   │   ├── services/      # Business logic
│   │   ├── utils/         # Utility functions
│   │   └── server.js      # Service entry point
│   ├── user-service/      # User management service
│   ├── job-service/       # Job management service
│   ├── payment-service/   # Payment processing service
│   ├── messaging-service/ # Real-time messaging service
│   │   └── socket/        # WebSocket handlers
│   └── ...                # Other services
├── src/                   # Legacy code (being migrated to services)
├── index.js               # Main orchestration script
└── server.js              # Legacy server entry point
```

## Getting Started

1. Install dependencies:
```
npm install
```

2. Set up environment variables:
```
cp .env.example .env
```

3. Start the development server:
```
npm run dev
```

## API Documentation

API documentation is available at `/api/docs` when the server is running.

## License

This project is proprietary and confidential. Unauthorized copying, transfer, or reproduction of the contents is strictly prohibited.