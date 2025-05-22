# Kelmah User Service

The User Service is responsible for managing user profiles, worker discovery, and job matching within the Kelmah platform.

## Features

- User profile management
- Worker skill management
- Worker search and discovery
- Worker verification and assessment
- Job and scheduling management for workers
- Dashboard analytics

## API Documentation

### Base URL

```
http://localhost:5002
```

### Authentication

All API endpoints (except public endpoints) require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### Profile Management

#### Get Profile

```
GET /profiles/:profileId
```

Retrieves a worker profile by ID.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "profile-123",
    "userId": "user-123",
    "bio": "Experienced software engineer...",
    "headline": "Full Stack Developer",
    ...
  }
}
```

#### Create/Update Profile

```
POST /profiles
```

Creates or updates a user profile.

**Request Body:**

```json
{
  "bio": "Professional plumber with 10 years of experience",
  "headline": "Certified Plumber | Water Heater Specialist",
  ...
}
```

### Skills Management

#### Get All Skills

```
GET /skills
```

Retrieves a list of all skills.

#### Get Skills by Category

```
GET /skills/categories/:category
```

Retrieves skills filtered by category.

#### Get Popular Skills

```
GET /skills/popular?limit=10
```

Retrieves the most popular skills, sorted by popularity.

### Search

#### Search Workers

```
GET /search/workers?skills=plumbing&location=Boston&availability=full-time
```

Searches for workers based on skills, location, and availability.

#### Advanced Worker Search

```
POST /search/workers/advanced
```

**Request Body:**

```json
{
  "skills": ["plumbing", "electrical"],
  "location": "Boston",
  "experience": "5+ years",
  "hourlyRateRange": {
    "min": 30,
    "max": 50
  },
  "availability": "full-time",
  "remote": false
}
```

### Dashboard

#### Get Dashboard Statistics

```
GET /dashboard/stats
```

Retrieves dashboard statistics for the authenticated user.

#### Get Worker Job Applications

```
GET /dashboard/job-applications/worker
```

Retrieves job applications for the authenticated worker.

## Worker-Specific APIs

### Worker Jobs

#### Get Active Jobs

```
GET /worker/jobs/active
```

Retrieves all active jobs for the authenticated worker.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "job-1",
      "title": "Kitchen Remodeling",
      "clientName": "Robert Johnson",
      "location": "Boston, MA",
      "startDate": "2025-03-10T08:00:00Z",
      "expectedEndDate": "2025-03-25T17:00:00Z",
      "status": "in-progress",
      "hourlyRate": 45,
      "hoursLogged": 32,
      "totalBudget": 2000,
      ...
    },
    ...
  ]
}
```

#### Get Job Details

```
GET /worker/jobs/:jobId
```

Retrieves details for a specific job.

#### Get Completed Jobs

```
GET /worker/jobs/completed?startDate=2025-01-01&endDate=2025-03-01
```

Retrieves completed jobs for the authenticated worker within a date range.

#### Update Job Progress

```
PUT /worker/jobs/:jobId/progress
```

**Request Body:**

```json
{
  "hoursLogged": 4,
  "milestoneId": "ms-3",
  "notes": "Completed countertop installation"
}
```

#### Mark Job as Completed

```
PUT /worker/jobs/:jobId/complete
```

**Request Body:**

```json
{
  "finalNotes": "All work completed successfully",
  "additionalHours": 2
}
```

#### Get Available Jobs

```
GET /worker/jobs/available?skills=plumbing&location=Boston&radius=25
```

Retrieves available jobs matching the worker's skills and location.

#### Submit a Job Proposal

```
POST /worker/jobs/proposals
```

**Request Body:**

```json
{
  "jobId": "job-5",
  "amount": 700,
  "duration": "4 days",
  "coverLetter": "I have over 10 years of experience in drywall repair...",
  "attachments": [
    {
      "name": "Previous_Work.jpg",
      "url": "https://example.com/attachments/previous_work.jpg"
    }
  ]
}
```

#### Get Worker's Job Proposals

```
GET /worker/jobs/proposals?status=pending
```

Retrieves the worker's job proposals with optional status filtering.

#### Withdraw a Job Proposal

```
DELETE /worker/jobs/proposals/:proposalId
```

Withdraws a pending job proposal.

#### Get Earnings Information

```
GET /worker/jobs/earnings
```

Retrieves earnings information for the worker.

#### Get Earnings for a Specific Period

```
GET /worker/jobs/earnings/period?startDate=2025-01-01&endDate=2025-03-01
```

Retrieves earnings for a specific period.

### Worker Schedule

#### Get Availability

```
GET /worker/schedule/availability
```

Retrieves the worker's availability settings.

#### Update General Availability

```
PUT /worker/schedule/availability/general
```

**Request Body:**

```json
{
  "availabilityData": [
    { "dayOfWeek": 1, "startTime": "08:00", "endTime": "17:00", "isAvailable": true },
    { "dayOfWeek": 2, "startTime": "08:00", "endTime": "17:00", "isAvailable": true },
    ...
  ]
}
```

#### Add Special Day

```
POST /worker/schedule/availability/special-days
```

**Request Body:**

```json
{
  "date": "2025-04-15",
  "startTime": "12:00",
  "endTime": "17:00",
  "isAvailable": true,
  "note": "Only available afternoon"
}
```

#### Delete Special Day

```
DELETE /worker/schedule/availability/special-days/:date
```

Removes a special day from the worker's calendar.

#### Update Availability Preferences

```
PUT /worker/schedule/availability/preferences
```

**Request Body:**

```json
{
  "workRadius": 30,
  "preferredLocations": ["Boston", "Cambridge", "Somerville"],
  "isRemoteAvailable": true,
  "minimumJobDuration": 2,
  "noticeRequired": 48
}
```

#### Get Appointments

```
GET /worker/schedule/appointments?startDate=2025-03-01&endDate=2025-03-31&status=confirmed
```

Retrieves appointments for the worker with optional filtering.

#### Create Appointment

```
POST /worker/schedule/appointments
```

**Request Body:**

```json
{
  "title": "Initial Consultation - Deck Project",
  "clientName": "Thomas Brown",
  "clientId": "client-105",
  "location": {
    "address": "789 Pine St, Medford, MA",
    "latitude": 42.4184,
    "longitude": -71.1061
  },
  "date": "2025-03-25",
  "startTime": "14:00",
  "endTime": "15:00",
  "description": "Discuss potential deck construction project",
  "notes": "Bring portfolio and material samples"
}
```

#### Update Appointment Status

```
PUT /worker/schedule/appointments/:appointmentId/status
```

**Request Body:**

```json
{
  "status": "confirmed"
}
```

#### Get Time Blocks

```
GET /worker/schedule/time-blocks
```

Retrieves time blocks (personal or recurring).

#### Create Time Block

```
POST /worker/schedule/time-blocks
```

**Request Body:**

```json
{
  "title": "Personal Time",
  "date": "2025-03-24",
  "startTime": "10:00",
  "endTime": "14:00",
  "isRecurring": false,
  "priority": "high",
  "notes": "Doctor appointment"
}
```

#### Check Availability

```
GET /worker/schedule/check-availability?startDate=2025-03-25&endDate=2025-03-25&startTime=13:00&endTime=15:00
```

Checks if a worker is available during a specific time range.

### Worker Verification

#### Get Verification Documents

```
GET /worker/verification/documents
```

Retrieves all verification documents for the worker.

#### Upload Document

```
POST /worker/verification/documents
```

**Request Body:**

```json
{
  "type": "identity",
  "documentType": "driver_license",
  "documentNumber": "DL1234567",
  "issueDate": "2022-05-10",
  "expiryDate": "2027-05-10",
  "issuingAuthority": "MA DMV"
}
```

#### Get Verification Status

```
GET /worker/verification/status
```

Retrieves the overall verification status for the worker.

#### Get Skills Assessments

```
GET /worker/verification/assessments?status=completed
```

Retrieves skills assessments with optional status filtering.

#### Start an Assessment

```
POST /worker/verification/assessments
```

**Request Body:**

```json
{
  "skillId": "skill-4",
  "skillName": "TypeScript"
}
```

#### Complete an Assessment

```
PUT /worker/verification/assessments/:assessmentId/complete
```

**Request Body:**

```json
{
  "score": 85,
  "level": "advanced"
}
```

#### Get Certifications

```
GET /worker/verification/certifications
```

Retrieves all certifications for the worker.

#### Add Certification

```
POST /worker/verification/certifications
```

**Request Body:**

```json
{
  "name": "AWS Certified Solutions Architect",
  "issuer": "Amazon Web Services",
  "credentialId": "AWS-123456",
  "issueDate": "2024-01-15T00:00:00Z",
  "expiryDate": "2027-01-15T00:00:00Z",
  "verificationUrl": "https://aws.amazon.com/verification",
  "skills": ["AWS", "Cloud Architecture", "Infrastructure"]
}
```

#### Get Badges

```
GET /worker/verification/badges
```

Retrieves achievement badges for the worker.

## Development

### Installation

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run in production mode
npm start
```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
NODE_ENV=development
USER_SERVICE_PORT=5002
DB_MODE=local|cloud
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_USER_DB=kelmah_users
TIMESCALE_DB_URL=postgres://user:password@hostname:port/dbname
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret
```

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Documentation

API documentation is available at:

```
http://localhost:5002/api-docs
```

## License

This project is licensed under the MIT License.