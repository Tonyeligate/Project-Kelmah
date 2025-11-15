import { reviewsServiceClient } from '../../common/services/axios';

const withApi = (path) => `/api${path}`;

const unwrapData = (response) => response?.data?.data ?? response?.data ?? {};
const unwrapResponse = (response) => response?.data ?? {};

/**
 * Review Service - gateway for review, rating, and moderation APIs
 */
class ReviewService {
  async getWorkerReviews(workerId, params = {}) {
    if (!workerId) {
      throw new Error('workerId is required to fetch worker reviews');
    }
    try {
      const response = await reviewsServiceClient.get(
        withApi(`/reviews/worker/${workerId}`),
        { params },
      );
      return unwrapData(response);
    } catch (error) {
      console.error('Error fetching worker reviews:', error);
      throw error;
    }
  }

  async getUserReviews(userId, page = 1, limit = 10, filters = {}) {
    if (!userId) {
      throw new Error('userId is required to fetch user reviews');
    }
    try {
      const response = await reviewsServiceClient.get(
        withApi(`/reviews/user/${userId}`),
        {
          params: { page, limit, ...filters },
        },
      );
      return unwrapData(response);
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      throw error;
    }
  }

  async getJobReviews(jobId, page = 1, limit = 10, filters = {}) {
    if (!jobId) {
      throw new Error('jobId is required to fetch job reviews');
    }
    try {
      const response = await reviewsServiceClient.get(
        withApi(`/reviews/job/${jobId}`),
        {
          params: { page, limit, ...filters },
        },
      );
      return unwrapData(response);
    } catch (error) {
      console.error('Error fetching job reviews:', error);
      throw error;
    }
  }

  async getWorkerRating(workerId) {
    if (!workerId) {
      throw new Error('workerId is required to fetch worker rating');
    }
    try {
      const response = await reviewsServiceClient.get(
        withApi(`/ratings/worker/${workerId}`),
      );
      return unwrapData(response);
    } catch (error) {
      console.error('Error fetching worker rating:', error);
      throw error;
    }
  }

  async getReviewStats(workerId) {
    try {
      const rating = await this.getWorkerRating(workerId);
      return {
        averageRating: rating?.averageRating ?? rating?.ratings?.overall ?? 0,
        totalReviews: rating?.totalReviews ?? 0,
        ratingDistribution: rating?.ratingDistribution ?? {},
        categoryRatings: rating?.categoryRatings ?? [],
      };
    } catch (error) {
      console.error('Error fetching review stats:', error);
      throw error;
    }
  }

  async canReviewWorker(workerId, jobId = null) {
    if (!workerId) {
      return {
        canReview: false,
        reason: 'Worker ID required to evaluate review eligibility',
      };
    }
    try {
      const response = await reviewsServiceClient.get(
        withApi(`/reviews/worker/${workerId}/eligibility`),
        { params: jobId ? { jobId } : undefined },
      );
      const data = unwrapData(response);
      if (typeof data?.canReview === 'boolean') {
        return data;
      }
      return {
        canReview: false,
        reason: 'Eligibility rules not defined',
      };
    } catch (error) {
      if (error?.response?.status === 404) {
        return {
          canReview: false,
          reason:
            'Eligibility check unavailable. Complete a contract with this worker before reviewing.',
        };
      }
      console.error('Error determining review eligibility:', error);
      throw error;
    }
  }

  async submitReview(reviewData) {
    try {
      const response = await reviewsServiceClient.post(
        withApi('/reviews'),
        reviewData,
      );
      return unwrapResponse(response);
    } catch (error) {
      console.error('Error submitting review:', error);
      throw error;
    }
  }

  async createReview(reviewData) {
    return this.submitReview(reviewData);
  }

  async updateReview(reviewId, reviewData) {
    try {
      const response = await reviewsServiceClient.put(
        withApi(`/reviews/${reviewId}`),
        reviewData,
      );
      return unwrapResponse(response);
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  }

  async deleteReview(reviewId) {
    try {
      const response = await reviewsServiceClient.delete(
        withApi(`/reviews/${reviewId}`),
      );
      return unwrapResponse(response);
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  }

  async getReview(reviewId) {
    try {
      const response = await reviewsServiceClient.get(
        withApi(`/reviews/${reviewId}`),
      );
      return unwrapData(response);
    } catch (error) {
      console.error('Error fetching review:', error);
      throw error;
    }
  }

  async addWorkerResponse(reviewId, comment) {
    try {
      const response = await reviewsServiceClient.put(
        withApi(`/reviews/${reviewId}/response`),
        { comment },
      );
      return unwrapResponse(response);
    } catch (error) {
      console.error('Error adding worker response:', error);
      throw error;
    }
  }

  async voteHelpful(reviewId) {
    try {
      const response = await reviewsServiceClient.post(
        withApi(`/reviews/${reviewId}/helpful`),
      );
      return unwrapResponse(response);
    } catch (error) {
      console.error('Error voting review helpful:', error);
      throw error;
    }
  }

  async reportReview(reviewId, reason) {
    try {
      const response = await reviewsServiceClient.post(
        withApi(`/reviews/${reviewId}/report`),
        { reason },
      );
      return unwrapResponse(response);
    } catch (error) {
      console.error('Error reporting review:', error);
      throw error;
    }
  }

  async getReviewAnalytics(timeRange = '30d') {
    try {
      const response = await reviewsServiceClient.get(
        withApi('/reviews/analytics'),
        {
          params: { timeRange },
        },
      );
      return unwrapData(response);
    } catch (error) {
      console.error('Error fetching review analytics:', error);
      throw error;
    }
  }

  async getModerationQueue(params = {}) {
    try {
      const response = await reviewsServiceClient.get(
        withApi('/admin/reviews/queue'),
        { params },
      );
      return unwrapData(response);
    } catch (error) {
      console.error('Error fetching moderation queue:', error);
      throw error;
    }
  }

  async moderateReview(reviewId, status, note = '') {
    try {
      const response = await reviewsServiceClient.post(
        withApi(`/admin/reviews/${reviewId}/moderate`),
        { status, note },
      );
      return unwrapResponse(response);
    } catch (error) {
      console.error('Error moderating review:', error);
      throw error;
    }
  }
}

const reviewService = new ReviewService();
export default reviewService;
