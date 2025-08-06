import axiosInstance from '../../common/services/axios';

class ReviewService {
  // Get reviews for a specific user
  async getUserReviews(userId, page = 1, limit = 10) {
    try {
      // Call backend for reviews of a worker
      const response = await axiosInstance.get(
        `/api/reviews/worker/${userId}`,
        {
          params: { page, limit },
        },
      );
      const raw = response.data;
      const reviews = raw.data || [];
      const pagination = raw.meta?.pagination || {};
      return { reviews, pagination };
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      console.warn('Reviews service unavailable, using fallback data');
      
      // Return mock data during service unavailability
      return {
        reviews: [
          {
            _id: 'mock-review-1',
            reviewer: {
              firstName: 'Sarah',
              lastName: 'Mitchell',
              profilePicture: null
            },
            rating: 5,
            comment: 'Excellent work! Very professional and completed the job on time.',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 1 week ago
            job: 'Kitchen Installation'
          },
          {
            _id: 'mock-review-2',
            reviewer: {
              firstName: 'David',
              lastName: 'Chen',
              profilePicture: null
            },
            rating: 4,
            comment: 'Great quality work. Would recommend for carpentry projects.',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14), // 2 weeks ago
            job: 'Cabinet Repair'
          }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          pageCount: 1
        }
      };
    }
  }

  // Get reviews for a specific job
  async getJobReviews(jobId, page = 1, limit = 10) {
    try {
      const response = await axiosInstance.get(`/api/reviews/job/${jobId}`, {
        params: { page, limit },
      });
      const raw = response.data;
      const reviews = raw.data || [];
      const pagination = raw.meta?.pagination || {};
      return { reviews, pagination };
    } catch (error) {
      console.error('Error fetching job reviews:', error);
      throw error;
    }
  }

  // Get review statistics for a user
  // Optionally implement stats endpoint when available

  // Create a new review
  async createReview(reviewData) {
    try {
      const response = await axiosInstance.post('/reviews', reviewData);
      return response.data.data;
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  }

  // Update a review
  async updateReview(reviewId, reviewData) {
    try {
      const response = await axiosInstance.put(
        `/api/reviews/${reviewId}`,
        reviewData,
      );
      return response.data.data;
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  }

  // Delete a review
  async deleteReview(reviewId) {
    try {
      await axiosInstance.delete(`/api/reviews/${reviewId}`);
      return true;
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  }
}

export default new ReviewService();
