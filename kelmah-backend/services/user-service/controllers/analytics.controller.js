/**
 * Analytics Controller
 * Provides comprehensive platform analytics for admin dashboard
 */

// Use shared models via models index
const { User, WorkerProfile } = require('../models');
const { successResponse, errorResponse } = require('../utils/response');
const axios = require('axios');

class AnalyticsController {
  /**
   * Get comprehensive platform analytics
   * @route GET /api/analytics/platform
   * @access Private (Admin only)
   */
  static async getPlatformAnalytics(req, res) {
    try {
      const { timeRange = '30d' } = req.query;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      // Check admin access
      if (userRole !== 'admin') {
        return errorResponse(res, 403, 'Admin access required');
      }

      // Calculate date range
      const now = new Date();
      let startDate;
      switch (timeRange) {
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Parallel queries for better performance
      const [
        totalUsers,
        activeUsers,
        newUsers,
        totalWorkers,
        activeWorkers,
        verifiedWorkers,
        userGrowthData,
        locationStats,
        skillStats,
        ratingDistribution
      ] = await Promise.all([
        // Total users
        User.countDocuments({ isActive: true }),

        // Active users (logged in within last 30 days)
        User.countDocuments({
          isActive: true,
          lastLoginAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
        }),

        // New users in time range
        User.countDocuments({
          createdAt: { $gte: startDate },
          isActive: true
        }),

        // Total workers
        WorkerProfile.countDocuments({ isActive: true }),

        // Active workers (available for work)
        WorkerProfile.countDocuments({
          isActive: true,
          availabilityStatus: { $in: ['available', 'partially_available'] }
        }),

        // Verified workers
        WorkerProfile.countDocuments({
          isActive: true,
          verificationStatus: 'verified'
        }),

        // User growth data (last 12 months)
        User.aggregate([
          {
            $match: {
              createdAt: { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) },
              isActive: true
            }
          },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' }
              },
              count: { $sum: 1 },
              workers: {
                $sum: { $cond: [{ $eq: ['$role', 'worker'] }, 1, 0] }
              },
              hirers: {
                $sum: { $cond: [{ $eq: ['$role', 'hirer'] }, 1, 0] }
              }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]),

        // Location statistics
        User.aggregate([
          { $match: { isActive: true, 'location.city': { $exists: true } } },
          {
            $group: {
              _id: '$location.city',
              count: { $sum: 1 },
              workers: { $sum: { $cond: [{ $eq: ['$role', 'worker'] }, 1, 0] } },
              hirers: { $sum: { $cond: [{ $eq: ['$role', 'hirer'] }, 1, 0] } }
            }
          },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]),

        // Skill statistics (from worker profiles)
        WorkerProfile.aggregate([
          { $match: { isActive: true, skills: { $exists: true, $ne: [] } } },
          { $unwind: '$skills' },
          {
            $group: {
              _id: '$skills.skillName',
              count: { $sum: 1 },
              avgLevel: { $avg: '$skills.level' },
              avgRate: { $avg: '$hourlyRate' }
            }
          },
          { $sort: { count: -1 } },
          { $limit: 15 }
        ]),

        // Rating distribution
        WorkerProfile.aggregate([
          { $match: { isActive: true, rating: { $exists: true } } },
          {
            $group: {
              _id: { $floor: '$rating' },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ])
      ]);

      // Process growth data for frontend charts
      const processedGrowthData = userGrowthData.map(item => ({
        month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
        users: item.count,
        workers: item.workers,
        hirers: item.hirers,
        date: new Date(item._id.year, item._id.month - 1, 1)
      }));

      // Calculate growth percentages
      const previousPeriodStart = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));
      const [prevNewUsers, prevActiveUsers] = await Promise.all([
        User.countDocuments({ createdAt: { $gte: previousPeriodStart, $lt: startDate }, isActive: true }),
        User.countDocuments({ lastLoginAt: { $gte: previousPeriodStart, $lt: startDate }, isActive: true })
      ]);

      const newUsersGrowth = prevNewUsers > 0 ? ((newUsers - prevNewUsers) / prevNewUsers * 100) : 0;
      const activeUsersGrowth = prevActiveUsers > 0 ? ((activeUsers - prevActiveUsers) / prevActiveUsers * 100) : 0;

      // Pull payments and reviews analytics summaries for admin dashboard wiring
      let payoutsSummary = undefined;
      try {
        const gateway = process.env.API_GATEWAY_URL || '';
        if (gateway) {
          const token = req.headers.authorization;
          const tx = await axios.get(`${gateway}/api/payments/transactions`, { headers: { Authorization: token } });
          payoutsSummary = { recentCount: (tx.data?.data || []).length };
        }
      } catch (_) { }

      const analytics = {
        overview: {
          totalUsers,
          activeUsers,
          newUsers,
          totalWorkers,
          activeWorkers,
          verifiedWorkers,
          newUsersGrowth: Math.round(newUsersGrowth * 100) / 100,
          activeUsersGrowth: Math.round(activeUsersGrowth * 100) / 100,
          workerUtilization: totalWorkers > 0 ? Math.round((activeWorkers / totalWorkers) * 100) : 0,
          verificationRate: totalWorkers > 0 ? Math.round((verifiedWorkers / totalWorkers) * 100) : 0
        },
        growth: processedGrowthData,
        locations: locationStats,
        skills: skillStats,
        ratings: ratingDistribution,
        payouts: payoutsSummary,
        timeRange,
        generatedAt: new Date().toISOString()
      };

      return successResponse(res, 200, 'Platform analytics retrieved successfully', analytics);

    } catch (error) {
      console.error('Platform analytics error:', error);
      return errorResponse(res, 500, 'Failed to retrieve platform analytics');
    }
  }

  /**
   * Get real-time system metrics
   * @route GET /api/analytics/system-metrics
   * @access Private (Admin only)
   */
  static async getSystemMetrics(req, res) {
    try {
      const userRole = req.user?.role;

      if (userRole !== 'admin') {
        return errorResponse(res, 403, 'Admin access required');
      }

      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Get system health metrics
      const [
        onlineUsers,
        recentSignups,
        systemLoad,
        errorRate,
        responseTime
      ] = await Promise.all([
        // Users active in last hour
        User.countDocuments({
          lastLoginAt: { $gte: new Date(now.getTime() - 60 * 60 * 1000) }
        }),

        // Signups in last 24h
        User.countDocuments({
          createdAt: { $gte: last24h }
        }),

        // System load (Node.js process info)
        Promise.resolve({
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
          uptime: process.uptime()
        }),

        // Mock error rate (in real implementation, get from logging service)
        Promise.resolve(Math.random() * 0.01), // 0-1% error rate

        // Mock average response time
        Promise.resolve(Math.random() * 200 + 50) // 50-250ms
      ]);

      const metrics = {
        realtime: {
          onlineUsers,
          recentSignups,
          timestamp: now.toISOString()
        },
        system: {
          memory: {
            used: Math.round(systemLoad.memory.heapUsed / 1024 / 1024), // MB
            total: Math.round(systemLoad.memory.heapTotal / 1024 / 1024), // MB
            usage: Math.round((systemLoad.memory.heapUsed / systemLoad.memory.heapTotal) * 100) // %
          },
          cpu: {
            user: systemLoad.cpu.user,
            system: systemLoad.cpu.system
          },
          uptime: Math.round(systemLoad.uptime),
          errorRate: Math.round(errorRate * 10000) / 100, // Percentage with 2 decimal places
          avgResponseTime: Math.round(responseTime)
        },
        health: {
          status: errorRate < 0.005 && responseTime < 200 ? 'excellent' :
            errorRate < 0.01 && responseTime < 300 ? 'good' :
              errorRate < 0.02 && responseTime < 500 ? 'warning' : 'critical',
          database: 'connected', // In real implementation, check DB connection
          cache: 'operational', // In real implementation, check Redis/cache
          external_apis: 'operational' // In real implementation, check external services
        }
      };

      return successResponse(res, 200, 'System metrics retrieved successfully', metrics);

    } catch (error) {
      console.error('System metrics error:', error);
      return errorResponse(res, 500, 'Failed to retrieve system metrics');
    }
  }

  /**
   * Get user activity analytics
   * @route GET /api/analytics/user-activity
   * @access Private (Admin only)
   */
  static async getUserActivity(req, res) {
    try {
      const userRole = req.user?.role;
      const { timeRange = '7d', limit = 100 } = req.query;

      if (userRole !== 'admin') {
        return errorResponse(res, 403, 'Admin access required');
      }

      const now = new Date();
      let startDate;
      switch (timeRange) {
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      // Get recent user activities
      const recentActivity = await User.find({
        $or: [
          { createdAt: { $gte: startDate } },
          { lastLoginAt: { $gte: startDate } },
          { updatedAt: { $gte: startDate } }
        ]
      })
        .select('firstName lastName email role createdAt lastLoginAt updatedAt')
        .sort({ updatedAt: -1 })
        .limit(parseInt(limit));

      // Activity summary
      const activitySummary = await User.aggregate([
        {
          $match: {
            $or: [
              { createdAt: { $gte: startDate } },
              { lastLoginAt: { $gte: startDate } },
              { updatedAt: { $gte: startDate } }
            ]
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } },
            registrations: {
              $sum: { $cond: [{ $gte: ['$createdAt', startDate] }, 1, 0] }
            },
            logins: {
              $sum: { $cond: [{ $gte: ['$lastLoginAt', startDate] }, 1, 0] }
            },
            updates: {
              $sum: { $cond: [{ $gte: ['$updatedAt', startDate] }, 1, 0] }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      const activity = {
        recent: recentActivity.map(user => ({
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role,
          type: user.createdAt >= startDate ? 'registration' :
            user.lastLoginAt >= startDate ? 'login' : 'profile_update',
          timestamp: user.updatedAt || user.lastLoginAt || user.createdAt
        })),
        summary: activitySummary,
        timeRange,
        total: recentActivity.length
      };

      return successResponse(res, 200, 'User activity retrieved successfully', activity);

    } catch (error) {
      console.error('User activity error:', error);
      return errorResponse(res, 500, 'Failed to retrieve user activity');
    }
  }

  /**
   * Worker analytics aggregation (jobs/payments/reviews)
   * @route GET /api/analytics/worker/:workerId
   * @access Private (authenticated; admin or self)
   */
  static async getWorkerAnalytics(req, res) {
    try {
      const { workerId } = req.params;
      const requester = req.user;
      if (!requester) return errorResponse(res, 401, 'Unauthorized');
      if (requester.role !== 'admin' && String(requester.id) !== String(workerId)) {
        return errorResponse(res, 403, 'Forbidden');
      }

      const gateway = process.env.API_GATEWAY_URL || '';
      const auth = req.headers.authorization;
      const results = await Promise.allSettled([
        // Jobs analytics
        (async () => {
          if (!gateway) return null;
          const r = await axios.get(`${gateway}/api/jobs/analytics`, { headers: { Authorization: auth }, params: { timeRange: '30d' } });
          return r.data?.data || r.data;
        })(),
        // Payments history (current user)
        (async () => {
          if (!gateway) return null;
          const r = await axios.get(`${gateway}/api/payments/transactions`, { headers: { Authorization: auth }, params: { limit: 100 } });
          const tx = r.data?.data || r.data || [];
          const income = tx.filter(t => t.recipient === workerId || t.recipient?._id === workerId);
          const payouts = tx.filter(t => t.sender === workerId || t.sender?._id === workerId);
          return {
            recentCount: tx.length,
            incomeCount: income.length,
            payoutCount: payouts.length,
            recentTotal: income.reduce((s, t) => s + (Number(t.amount) || 0), 0)
          };
        })(),
        // Reviews summary
        (async () => {
          if (!gateway) return null;
          const r = await axios.get(`${gateway}/api/reviews/ratings/worker/${workerId}`, { headers: { Authorization: auth } }).catch(async () => {
            // Fallback to review-service direct if gateway route differs
            const base = process.env.REVIEW_SERVICE_URL;
            if (!base) return null;
            const r2 = await axios.get(`${base}/api/ratings/worker/${workerId}`, { headers: { Authorization: auth } });
            return r2;
          });
          return r?.data?.data || r?.data || null;
        })(),
      ]);

      const [jobsRes, paymentsRes, reviewsRes] = results.map(x => x.status === 'fulfilled' ? x.value : null);
      const summary = {
        jobs: jobsRes?.overview || null,
        payments: paymentsRes || null,
        reviews: reviewsRes ? {
          averageRating: reviewsRes.averageRating || reviewsRes.ratings?.overall || 0,
          totalReviews: reviewsRes.totalReviews || 0,
          ratingDistribution: reviewsRes.ratingDistribution || null,
        } : null,
        generatedAt: new Date().toISOString(),
      };

      return successResponse(res, 200, 'Worker analytics', summary);
    } catch (error) {
      console.error('Worker analytics error:', error);
      return errorResponse(res, 500, 'Failed to retrieve worker analytics');
    }
  }
}

module.exports = AnalyticsController;
