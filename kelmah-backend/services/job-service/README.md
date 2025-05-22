# Kelmah Job Service

The job service is responsible for managing job postings, applications, contracts, and reviews on the Kelmah platform.

## Database Setup

The job service uses PostgreSQL/TimescaleDB for data storage. TimescaleDB extends PostgreSQL with time-series capabilities, which are used for job metrics and analytics.

### Prerequisites

- Node.js and npm
- PostgreSQL with TimescaleDB extension
- A `.env` file with database connection information

### Environment Variables

Create a `.env` file in the job service directory with the following variables:

```
# Service configuration
NODE_ENV=development
JOB_SERVICE_PORT=5003
FRONTEND_URL=http://localhost:3000

# Database configuration
TIMESCALE_DB_URL=postgres://username:password@localhost:5432/kelmah
DB_POOL_MAX=20
DB_POOL_MIN=5
DB_SSL=false
DB_ALTER=true
```

### Running Migrations and Seeders

To set up the database tables and seed with initial data:

```bash
# Install dependencies
npm install

# Run database setup script
node scripts/setup-db.js
```

This will:
1. Create all required tables
2. Set up indexes for efficient querying
3. Configure TimescaleDB hypertables for time-series data
4. Seed the database with demo jobs and contract templates

## API Endpoints

### Jobs

- `GET /api/jobs` - Get all jobs with pagination and filtering
- `GET /api/jobs/:id` - Get job by ID
- `POST /api/jobs` - Create a new job (requires hirer role)
- `PUT /api/jobs/:id` - Update a job (requires hirer role)
- `DELETE /api/jobs/:id` - Delete a job (requires hirer role)
- `PATCH /api/jobs/:id/status` - Change job status (requires hirer role)
- `GET /api/jobs/:id/metrics` - Get job metrics (requires hirer role)

### Applications

- `GET /api/applications` - Get job applications (filtered by user role)
- `GET /api/applications/:id` - Get application by ID
- `POST /api/applications` - Create a new application (requires worker role)
- `PUT /api/applications/:id` - Update an application
- `PATCH /api/applications/:id/status` - Change application status

### Contracts

- `GET /api/contracts` - Get contracts (filtered by user role)
- `GET /api/contracts/:id` - Get contract by ID
- `POST /api/contracts` - Create a new contract
- `PUT /api/contracts/:id` - Update a contract
- `POST /api/contracts/:id/sign` - Sign a contract
- `POST /api/contracts/:id/complete` - Complete a contract
- `POST /api/contracts/:id/dispute` - Open a dispute for a contract

### Reviews

- `GET /api/reviews/user/:userId` - Get reviews for a user
- `GET /api/reviews/:id` - Get review by ID
- `POST /api/reviews` - Create a new review
- `PUT /api/reviews/:id` - Update a review
- `POST /api/reviews/:id/respond` - Respond to a review

## Data Models

### Job

Represents a job posting created by a hirer.

### Application

Represents a worker's application to a job.

### Contract

Represents a legal agreement between a hirer and a worker for a job.

### Review

Represents feedback from a hirer to a worker or vice versa after a contract is completed.

## Running the Service

To start the job service:

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The service will be available at `http://localhost:5003` (or the port specified in your .env file). 