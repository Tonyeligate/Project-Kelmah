# Kelmah Review Service

This service handles all review-related functionality for the Kelmah platform, including:
- Worker reviews
- Hirer reviews
- Review statistics
- Rating calculations

## Features
- Create reviews for workers and hirers
- View reviews for a specific user or job
- Update and delete reviews
- Calculate review statistics and average ratings

## API Endpoints
- `POST /api/reviews`: Create a new review
- `GET /api/reviews/user/:userId`: Get reviews for a specific user
- `GET /api/reviews/job/:jobId`: Get reviews for a specific job
- `GET /api/reviews/stats/user/:userId`: Get review statistics for a user
- `PUT /api/reviews/:reviewId`: Update a review
- `DELETE /api/reviews/:reviewId`: Delete a review

## Getting Started
1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with your configuration (see `.env.example`)
4. Run the service: `npm start` or `npm run dev` for development

## Dependencies
- Node.js (>= 14.0.0)
- MongoDB
- Express.js
