# Review Service Implementation Guide

This guide provides step-by-step instructions for adding the Review Service to your Kelmah platform.

## Step 1: Create Basic Directory Structure

```bash
# Navigate to the services directory
cd kelmah-backend/services

# Create review service directory and subdirectories
mkdir -p review-service/controllers
mkdir -p review-service/models
mkdir -p review-service/routes
mkdir -p review-service/services
mkdir -p review-service/middleware
mkdir -p review-service/utils
mkdir -p review-service/tests
mkdir -p review-service/config
```

## Step 2: Create Package.json

Create a `package.json` file in the review-service directory:

```json
{
  "name": "kelmah-review-service",
  "version": "1.0.0",
  "description": "Review and Rating Service for Kelmah Platform",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.17.1",
    "mongoose": "^5.13.7",
    "cors": "^2.8.5",
    "morgan": "^1.10.0",
    "jsonwebtoken": "^8.5.1",
    "dotenv": "^10.0.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.12",
    "jest": "^27.0.6"
  }
}
```

## Step 3: Implement Core Files

Create each of the files outlined in the template, copying the code provided in the template.

1. **Models**:
   - Create `models/review.model.js` with the schema defined in the template
   - Create a simple `models/rating.model.js` for specialized rating functionality if needed

2. **Controllers**:
   - Create `controllers/review.controller.js` with the CRUD operations for reviews
   - Create `controllers/rating.controller.js` for specialized rating operations

3. **Routes**:
   - Create `routes/review.routes.js` for API routes
   - Create `routes/index.js` to export all routes

4. **Utils**:
   - Create `utils/rating-calculation.js` for rating-related utility functions

5. **Middleware**:
   - Create `middleware/validation.middleware.js` for input validation
   - Create `middleware/authorization.middleware.js` for review-specific authorization checks

6. **Config**:
   - Create `config/index.js` for service configuration

7. **Server**:
   - Create `server.js` as the entry point for the service

## Step 4: Connect to API Gateway

Update the API Gateway routes to include the Review Service:

1. Locate the API Gateway routes configuration in `kelmah-backend/api-gateway/routes/index.js`
2. Add routes for the Review Service:

```javascript
// In api-gateway/routes/index.js
const reviewServiceProxy = createProxyMiddleware({
  target: process.env.REVIEW_SERVICE_URL || 'http://localhost:5007',
  changeOrigin: true,
  pathRewrite: {
    '^/api/reviews': '/api/reviews'
  }
});

// Register route
app.use('/api/reviews', reviewServiceProxy);
```

## Step 5: Update Backend Orchestration

Update the backend orchestration in `kelmah-backend/index.js` to include the Review Service:

```javascript
// In index.js, add to the services array
const services = [
  // ... existing services
  {
    name: 'Review Service',
    path: path.join(__dirname, 'services', 'review-service'),
    script: 'server.js',
    color: colors.cyan // or another available color
  }
];
```

## Step 6: Frontend Integration

1. **Create Review Service**:
   
   Create a new file `kelmah-frontend/src/services/ReviewService.js`:

```javascript
import api from './api';

class ReviewService {
  // Get user reviews
  async getUserReviews(userId, page = 1, limit = 10, type = null) {
    try {
      let url = `/reviews/user/${userId}?page=${page}&limit=${limit}`;
      if (type) {
        url += `&type=${type}`;
      }
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      throw error;
    }
  }

  // Get job reviews
  async getJobReviews(jobId) {
    try {
      const response = await api.get(`/reviews/job/${jobId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching job reviews:', error);
      throw error;
    }
  }

  // Create review
  async createReview(reviewData) {
    try {
      const response = await api.post('/reviews', reviewData);
      return response.data;
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  }

  // Update review
  async updateReview(reviewId, reviewData) {
    try {
      const response = await api.put(`/reviews/${reviewId}`, reviewData);
      return response.data;
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  }

  // Delete review
  async deleteReview(reviewId) {
    try {
      const response = await api.delete(`/reviews/${reviewId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  }

  // Report review
  async reportReview(reviewId, reason) {
    try {
      const response = await api.post(`/reviews/${reviewId}/report`, { reason });
      return response.data;
    } catch (error) {
      console.error('Error reporting review:', error);
      throw error;
    }
  }
}

export default new ReviewService();
```

2. **Update Service Index**:

   Update `kelmah-frontend/src/services/index.js` to include the ReviewService:

```javascript
// In services/index.js
import ReviewService from './ReviewService';

export {
  // ... other services
  ReviewService
};
```

3. **Create Review Components**:

   Create or update review-related components in the `components/reviews` directory.

## Step 7: Testing

1. Start the Review Service:
```bash
cd kelmah-backend/services/review-service
npm install
npm run dev
```

2. Test the API endpoints using a tool like Postman or Insomnia

3. Verify frontend integration by using the review features in your application

## Step 8: Documentation

Update project documentation to include information about the Review Service, its features, and API endpoints.

---

By following these steps, you'll have a fully functional Review Service that integrates with your Kelmah platform, allowing users to leave and manage reviews for workers and hirers. 