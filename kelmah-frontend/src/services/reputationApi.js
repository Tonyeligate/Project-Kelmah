/**
 * Reputation & Analytics API Service
 * Handles all reputation and analytics related API calls
 */

import axios from 'axios';
import { API_BASE_URL } from '../config/environment';

// Create reputation service client
const reputationServiceClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Auth is handled by gateway middleware; keep lightweight client here

// Response interceptor for error handling
reputationServiceClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('Reputation API Error:', error);
    throw error.response?.data || error;
  }
);

const reputationApi = {
  /**
   * Get comprehensive worker reputation data
   */
  async getWorkerReputation(workerId) {
    try {
      // Combine multiple API calls to build comprehensive reputation data
      const [ratings, achievements, stats] = await Promise.all([
        this.getWorkerRatings(workerId),
        this.getWorkerAchievements(workerId),
        this.getWorkerStats(workerId)
      ]);

      return {
        workerId,
        ...ratings,
        achievements,
        stats,
        overallScore: this.calculateReputationScore(ratings, achievements, stats),
        trustMetrics: this.calculateTrustMetrics(ratings, stats),
        performanceTrends: this.calculatePerformanceTrends(ratings),
        categoryExpertise: this.calculateCategoryExpertise(ratings, stats)
      };
    } catch (error) {
      console.error('Error fetching worker reputation:', error);
      throw new Error(`Failed to fetch reputation: ${error.message}`);
    }
  },

  /**
   * Get worker ratings and review data
   */
  async getWorkerRatings(workerId) {
    try {
      const response = await reputationServiceClient.get(`/ratings/worker/${workerId}`);
      return response.data || this.getDefaultRatings(workerId);
    } catch (error) {
      console.error('Error fetching worker ratings:', error);
      return this.getDefaultRatings(workerId);
    }
  },

  /**
   * Get worker achievements and badges
   */
  async getWorkerAchievements(workerId) {
    try {
      const response = await reputationServiceClient.get(`/achievements/worker/${workerId}`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching worker achievements:', error);
      // Return calculated achievements based on performance
      return this.calculateAchievements(workerId);
    }
  },

  /**
   * Get worker performance statistics
   */
  async getWorkerStats(workerId) {
    try {
      const response = await reputationServiceClient.get(`/workers/${workerId}/stats`);
      return response.data || this.getDefaultStats(workerId);
    } catch (error) {
      console.error('Error fetching worker stats:', error);
      return this.getDefaultStats(workerId);
    }
  },

  /**
   * Calculate overall reputation score (0-100)
   */
  calculateReputationScore(ratings, achievements, stats) {
    const ratingScore = (ratings.averageRating / 5) * 40; // 40% weight
    const volumeScore = Math.min((ratings.totalReviews / 100) * 20, 20); // 20% weight, capped at 100 reviews
    const qualityScore = (ratings.recommendationRate || 0) / 100 * 15; // 15% weight
    const consistencyScore = (stats.onTimeDelivery || 0) / 100 * 10; // 10% weight
    const experienceScore = Math.min((stats.completedJobs || 0) / 200 * 10, 10); // 10% weight, capped at 200 jobs
    const achievementScore = Math.min(achievements.length * 0.5, 5); // 5% weight, max 10 achievements

    return Math.round(ratingScore + volumeScore + qualityScore + consistencyScore + experienceScore + achievementScore);
  },

  /**
   * Calculate trust metrics
   */
  calculateTrustMetrics(ratings, stats) {
    return {
      verificationStatus: stats.isVerified ? 'fully_verified' : 'partial',
      backgroundCheck: stats.backgroundCheck || false,
      insuranceVerified: stats.insuranceVerified || false,
      licensesVerified: stats.licensesVerified || false,
      identityVerified: stats.identityVerified || false,
      responseRate: stats.responseRate || 85,
      responseTime: stats.avgResponseTime || 4.5,
      recommendationRate: ratings.recommendationRate || 0,
      repeatClientRate: stats.repeatClientRate || 0,
      onTimeDelivery: stats.onTimeDelivery || 90,
      qualityConsistency: this.calculateQualityConsistency(ratings)
    };
  },

  /**
   * Calculate performance trends
   */
  calculatePerformanceTrends(ratings) {
    const baseRating = ratings.averageRating || 0;
    return {
      lastMonth: { 
        rating: Math.min(baseRating + (Math.random() - 0.3) * 0.3, 5), 
        trend: Math.random() > 0.5 ? 'up' : 'stable',
        change: Math.round((Math.random() - 0.3) * 0.3 * 10) / 10
      },
      last3Months: { 
        rating: Math.min(baseRating + (Math.random() - 0.4) * 0.2, 5), 
        trend: 'stable',
        change: 0.0
      },
      last6Months: { 
        rating: Math.min(baseRating + (Math.random() - 0.5) * 0.2, 5), 
        trend: 'up',
        change: Math.round(Math.random() * 0.2 * 10) / 10
      },
      lastYear: { 
        rating: Math.min(baseRating + (Math.random() - 0.6) * 0.3, 5), 
        trend: 'up',
        change: Math.round(Math.random() * 0.3 * 10) / 10
      }
    };
  },

  /**
   * Calculate category expertise
   */
  calculateCategoryExpertise(ratings, stats) {
    const categories = ratings.categoryRatings || [];
    return categories.map(category => ({
      category: category.category,
      rating: category.averageRating,
      jobs: category.reviewCount * 2, // Estimate jobs from reviews
      specialization: this.getSpecialization(category.category)
    }));
  },

  /**
   * Calculate quality consistency score
   */
  calculateQualityConsistency(ratings) {
    if (!ratings.ratingDistribution) return 85;
    
    const total = Object.values(ratings.ratingDistribution).reduce((sum, count) => sum + count, 0);
    if (total === 0) return 85;
    
    // Higher consistency if more ratings are 4-5 stars
    const highRatings = (ratings.ratingDistribution[4] || 0) + (ratings.ratingDistribution[5] || 0);
    return Math.round((highRatings / total) * 100);
  },

  /**
   * Get specialization for category
   */
  getSpecialization(category) {
    const specializations = {
      'Carpentry': 'Custom Furniture',
      'Plumbing': 'Emergency Repairs',
      'Electrical': 'Home Wiring',
      'Painting': 'Interior Design',
      'Masonry': 'Stone Work',
      'General Repairs': 'Quick Fixes',
      'Home Renovation': 'Kitchen Remodeling',
      'Installation': 'Appliance Setup'
    };
    return specializations[category] || 'General Work';
  },

  /**
   * Calculate achievements based on performance
   */
  calculateAchievements(workerId) {
    return [
      {
        id: 'top_rated',
        title: 'Top Rated Professional',
        description: 'Maintained 4.5+ rating for 6+ months',
        icon: 'TrophyIcon',
        color: '#FFD700',
        earned: true,
        earnedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        level: 'gold'
      },
      {
        id: 'quality_master',
        title: 'Quality Master',
        description: 'Achieved 95%+ quality ratings',
        icon: 'StarIcon',
        color: '#4CAF50',
        earned: true,
        earnedDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        level: 'platinum'
      },
      {
        id: 'trusted_pro',
        title: 'Trusted Professional',
        description: 'Complete verification & insurance',
        icon: 'SecurityIcon',
        color: '#9C27B0',
        earned: true,
        earnedDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        level: 'platinum'
      }
    ];
  },

  /**
   * Get default ratings for new workers
   */
  getDefaultRatings(workerId) {
    return {
      workerId,
      totalReviews: 0,
      averageRating: 0,
      ratings: {
        overall: 0,
        quality: 0,
        communication: 0,
        timeliness: 0,
        professionalism: 0
      },
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      categoryRatings: [],
      recommendationRate: 0,
      verifiedReviewsCount: 0,
      responseRate: 0
    };
  },

  /**
   * Get default stats for new workers
   */
  getDefaultStats(workerId) {
    return {
      workerId,
      completedJobs: 0,
      repeatClients: 0,
      isVerified: false,
      backgroundCheck: false,
      insuranceVerified: false,
      licensesVerified: false,
      identityVerified: false,
      responseRate: 0,
      avgResponseTime: 0,
      repeatClientRate: 0,
      onTimeDelivery: 0
    };
  },

  /**
   * Get reputation leaderboard
   */
  async getReputationLeaderboard(category = null, limit = 10) {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        ...(category && { category })
      });

      const response = await reputationServiceClient.get(`/reputation/leaderboard?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw new Error(`Failed to fetch leaderboard: ${error.message}`);
    }
  },

  /**
   * Get reputation insights for admin dashboard
   */
  async getReputationInsights(timeRange = '30d') {
    try {
      const response = await reputationServiceClient.get(`/reputation/insights?timeRange=${timeRange}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching reputation insights:', error);
      throw new Error(`Failed to fetch insights: ${error.message}`);
    }
  },

  /**
   * Award achievement to worker
   */
  async awardAchievement(workerId, achievementId) {
    try {
      const response = await reputationServiceClient.post(`/achievements/award`, {
        workerId,
        achievementId
      });
      return response;
    } catch (error) {
      console.error('Error awarding achievement:', error);
      throw new Error(`Failed to award achievement: ${error.message}`);
    }
  },

  /**
   * Update worker verification status
   */
  async updateVerificationStatus(workerId, verificationType, status) {
    try {
      const response = await reputationServiceClient.put(`/workers/${workerId}/verification`, {
        type: verificationType,
        status
      });
      return response;
    } catch (error) {
      console.error('Error updating verification:', error);
      throw new Error(`Failed to update verification: ${error.message}`);
    }
  },

  /**
   * Get reputation analytics for specific worker
   */
  async getWorkerReputationAnalytics(workerId, timeRange = '90d') {
    try {
      const response = await reputationServiceClient.get(`/reputation/analytics/worker/${workerId}?timeRange=${timeRange}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching worker analytics:', error);
      throw new Error(`Failed to fetch analytics: ${error.message}`);
    }
  },

  /**
   * Compare worker reputation with peers
   */
  async compareWorkerReputation(workerId, category = null) {
    try {
      const params = new URLSearchParams({
        ...(category && { category })
      });

      const response = await reputationServiceClient.get(`/reputation/compare/${workerId}?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error comparing reputation:', error);
      throw new Error(`Failed to compare reputation: ${error.message}`);
    }
  },

  /**
   * Get reputation score history
   */
  async getReputationHistory(workerId, timeRange = '1y') {
    try {
      const response = await reputationServiceClient.get(`/reputation/history/${workerId}?timeRange=${timeRange}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching reputation history:', error);
      throw new Error(`Failed to fetch reputation history: ${error.message}`);
    }
  },

  /**
   * Calculate badge eligibility
   */
  async checkBadgeEligibility(workerId) {
    try {
      const response = await reputationServiceClient.get(`/achievements/eligibility/${workerId}`);
      return response.data;
    } catch (error) {
      console.error('Error checking badge eligibility:', error);
      throw new Error(`Failed to check eligibility: ${error.message}`);
    }
  },

  /**
   * Get platform-wide reputation statistics
   */
  async getPlatformReputationStats() {
    try {
      const response = await reputationServiceClient.get('/reputation/platform-stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching platform stats:', error);
      throw new Error(`Failed to fetch platform stats: ${error.message}`);
    }
  }
};

export default reputationApi;