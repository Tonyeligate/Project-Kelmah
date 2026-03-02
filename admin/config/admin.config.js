/**
 * Admin Configuration
 *
 * Centralised admin settings used by admin scripts and tooling.
 */

module.exports = {
  // Gateway URL (local dev default)
  gatewayUrl: process.env.GATEWAY_URL || 'http://localhost:5000',

  // Admin endpoints served by each microservice via the API gateway
  endpoints: {
    users: {
      list: '/api/users',
      bulkUpdate: '/api/users/bulk-update',
      bulkDelete: '/api/users/bulk-delete',
      platformAnalytics: '/api/users/analytics/platform',
      systemMetrics: '/api/users/analytics/system-metrics',
      userActivity: '/api/users/analytics/user-activity',
    },
    auth: {
      stats: '/api/auth/stats',
      sessions: '/api/auth/sessions',
    },
    payments: {
      payouts: '/api/payments/admin/payouts',
      enqueue: '/api/payments/admin/payouts/queue',
      process: '/api/payments/admin/payouts/process',
      revenue: '/api/payments/analytics/revenue',
    },
  },

  // Bulk operation limits
  bulkLimits: {
    maxBulkUpdate: 500,
    maxBulkDelete: 100,
  },
};
