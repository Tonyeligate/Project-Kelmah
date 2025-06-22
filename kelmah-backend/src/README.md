# Kelmah Backend API

Backend API for the Kelmah platform, which connects vocational workers (carpenters, plumbers, etc.) with potential hirers.

## Project Structure

```
kelmah-backend/
├── src/
│   ├── config/        # Configuration files
│   ├── controllers/   # Request handlers
│   ├── middlewares/   # Express middlewares
│   ├── models/        # Mongoose models
│   ├── routes/        # API routes
│   ├── services/      # Business logic
│   ├── utils/         # Utility functions
│   ├── validations/   # Request validation schemas
│   ├── app.js         # Express app setup
│   └── server.js      # Server entry point
├── uploads/           # Uploaded files
├── .env               # Environment variables
├── .env.example       # Example environment variables
├── package.json       # Project dependencies
└── README.md          # Project documentation
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh-token` - Refresh access token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Forgot password
- `PUT /api/auth/reset-password/:token` - Reset password
- `GET /api/auth/verify-email/:token` - Verify email

### Jobs
- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/:id` - Get job by ID
- `POST /api/jobs` - Create a new job
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job
- `GET /api/jobs/my-jobs` - Get jobs posted by current user
- `PATCH /api/jobs/:id/status` - Change job status

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/users/:id/reviews` - Get user reviews
- `POST /api/users/:id/reviews` - Add user review

### Proposals
- `GET /api/proposals` - Get all proposals
- `GET /api/proposals/:id` - Get proposal by ID
- `POST /api/proposals` - Create a new proposal
- `PUT /api/proposals/:id` - Update proposal
- `DELETE /api/proposals/:id` - Delete proposal
- `GET /api/proposals/my-proposals` - Get proposals submitted by current user
- `GET /api/jobs/:id/proposals` - Get proposals for a job

### Contracts
- `GET /api/contracts` - Get all contracts
- `GET /api/contracts/:id` - Get contract by ID
- `POST /api/contracts` - Create a new contract
- `PUT /api/contracts/:id` - Update contract
- `PATCH /api/contracts/:id/status` - Change contract status

### Messaging
- `GET /api/messaging/conversations` - Get all conversations
- `GET /api/messaging/conversations/:id` - Get conversation by ID
- `POST /api/messaging/conversations` - Create a new conversation
- `GET /api/messaging/conversations/:id/messages` - Get messages for a conversation
- `POST /api/messaging/conversations/:id/messages` - Send a message

### Payments
- `POST /api/payments/create-payment-intent` - Create payment intent
- `POST /api/payments/confirm-payment` - Confirm payment
- `GET /api/payments/history` - Get payment history

### Notifications
- `GET /api/notifications` - Get all notifications
- `PATCH /api/notifications/:id/read` - Mark notification as read
- `PATCH /api/notifications/read-all` - Mark all notifications as read

### Search
- `GET /api/search/jobs` - Search jobs
- `GET /api/search/users` - Search users

## Setup Instructions

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/kelmah-backend.git
   cd kelmah-backend
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration

5. Start the development server
   ```bash
   npm run dev
   ```

6. For production
   ```bash
   npm start
   ```

## Technologies Used

- Node.js
- Express
- MongoDB with Mongoose
- JWT Authentication
- Socket.io for real-time communication
- Joi for request validation
- Helmet for security headers
- Morgan for logging
- Multer for file uploads