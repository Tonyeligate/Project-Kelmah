const express = require('express');
const axios = require('axios');
const { createProxyMiddleware } = require('http-proxy-middleware');
const auth = require('../middlewares/auth');

// Dashboard proxy router
// Maps /api/dashboard/* -> user-service /api/users/dashboard/*
// We keep a dedicated router for future dashboard-specific auth / caching / rate limits.
const router = express.Router();

// Resolve user service URL from app context each request to remain dynamic
function getUserService(req) {
    const urls = req.app.get('serviceUrls') || {};
    return urls.USER_SERVICE || process.env.USER_SERVICE_URL || 'http://localhost:5002';
}

function getJobService(req) {
    const urls = req.app.get('serviceUrls') || {};
    return urls.JOB_SERVICE || process.env.JOB_SERVICE_URL || 'http://localhost:5003';
}

function getMessagingService(req) {
    const urls = req.app.get('serviceUrls') || {};
    return urls.MESSAGING_SERVICE || process.env.MESSAGING_SERVICE_URL || 'http://localhost:5005';
}

function buildForwardHeaders(req) {
    const headers = {
        'Content-Type': 'application/json',
    };

    if (req.headers.authorization) {
        headers.Authorization = req.headers.authorization;
    }
    if (req.headers['x-authenticated-user']) {
        headers['x-authenticated-user'] = req.headers['x-authenticated-user'];
    }
    if (req.headers['x-gateway-signature']) {
        headers['x-gateway-signature'] = req.headers['x-gateway-signature'];
    }
    if (req.headers['x-auth-source']) {
        headers['x-auth-source'] = req.headers['x-auth-source'];
    }
    if (req.id || req.headers['x-request-id']) {
        headers['x-request-id'] = req.id || req.headers['x-request-id'];
    }

    return headers;
}

const unwrapPayload = (response) => response?.data?.data || response?.data || {};

const normalizeWorkers = (payload) => {
    if (Array.isArray(payload)) {
        return payload;
    }
    if (Array.isArray(payload?.items)) {
        return payload.items;
    }
    if (Array.isArray(payload?.workers)) {
        return payload.workers;
    }
    return [];
};

const normalizeActivities = (payload) => {
    if (Array.isArray(payload?.items)) {
        return payload.items;
    }
    if (Array.isArray(payload?.entries)) {
        return payload.entries;
    }
    if (Array.isArray(payload)) {
        return payload;
    }
    return [];
};

const normalizeConversations = (payload) => {
    if (Array.isArray(payload)) {
        return payload;
    }
    if (Array.isArray(payload?.data)) {
        return payload.data;
    }
    if (Array.isArray(payload?.conversations)) {
        return payload.conversations;
    }
    return [];
};

// Basic auth strategy: require authentication for all dashboard endpoints for now.
router.use(auth.authenticate);

router.get('/summary', async (req, res) => {
    try {
        const headers = buildForwardHeaders(req);
        const userService = getUserService(req);
        const jobService = getJobService(req);
        const messagingService = getMessagingService(req);
        const axiosConfig = { headers, timeout: 10000 };

        const [metricsResult, jobsResult, analyticsResult, workersResult, activityResult, messagesResult] = await Promise.allSettled([
            axios.get(`${userService}/api/users/dashboard/metrics`, axiosConfig),
            axios.get(`${jobService}/api/jobs/dashboard`, axiosConfig),
            axios.get(`${userService}/api/users/dashboard/analytics`, axiosConfig),
            axios.get(`${userService}/api/users/dashboard/workers`, axiosConfig),
            axios.get(`${userService}/api/users/profile/activity`, {
                ...axiosConfig,
                params: { page: 1, limit: 10 },
            }),
            axios.get(`${messagingService}/api/conversations`, {
                ...axiosConfig,
                params: { limit: 5 },
            }),
        ]);

        const metrics = metricsResult.status === 'fulfilled'
            ? unwrapPayload(metricsResult.value)
            : {
                totalUsers: 0,
                totalWorkers: 0,
                activeWorkers: 0,
                totalJobs: 0,
                completedJobs: 0,
                growthRate: 0,
                source: 'fallback',
            };

        const jobs = jobsResult.status === 'fulfilled'
            ? unwrapPayload(jobsResult.value)
            : { recentJobs: [], totalOpenJobs: 0, totalJobsToday: 0, source: 'fallback' };

        const analytics = analyticsResult.status === 'fulfilled'
            ? unwrapPayload(analyticsResult.value)
            : { userGrowth: [], topSkills: [], trends: [], source: 'fallback' };

        const workers = workersResult.status === 'fulfilled'
            ? normalizeWorkers(unwrapPayload(workersResult.value))
            : [];

        const activityPayload = activityResult.status === 'fulfilled'
            ? unwrapPayload(activityResult.value)
            : {};
        const activities = normalizeActivities(activityPayload);
        const activityPagination = activityPayload?.pagination || activityResult.value?.data?.meta?.pagination || {};

        const recentMessages = messagesResult.status === 'fulfilled'
            ? normalizeConversations(unwrapPayload(messagesResult.value))
            : [];

        const topJob = Array.isArray(jobs?.recentJobs) ? jobs.recentJobs[0] : null;

        return res.status(200).json({
            success: true,
            data: {
                overview: { metrics, jobs, analytics, workers },
                recentActivity: {
                    activities,
                    hasMore: typeof activityPagination?.hasNextPage === 'boolean'
                        ? activityPagination.hasNextPage
                        : activities.length >= 10,
                },
                statistics: analytics,
                upcomingTasks: [],
                recentMessages,
                performanceMetrics: {
                    completionRate: analytics?.completionRate || 0,
                    clientSatisfaction: analytics?.clientSatisfaction || 0,
                    averageResponseTime: analytics?.averageResponseTime || 'N/A',
                    jobsThisMonth: analytics?.jobsThisMonth || 0,
                    earningsThisMonth: analytics?.earningsThisMonth || 0,
                },
                quickActions: [
                    topJob
                        ? {
                            id: topJob.id || topJob._id || 'job-highlight',
                            label: `Review ${topJob.title}`,
                            type: 'job',
                            source: 'jobs',
                        }
                        : {
                            id: 'refresh-dashboard',
                            label: 'Refresh dashboard data',
                            type: 'action',
                        },
                    {
                        id: 'update-profile',
                        label: 'Update your profile details',
                        type: 'profile',
                    },
                ],
                notificationsSummary: {
                    unreadMessages: metrics?.unreadMessages || 0,
                    pendingJobs: jobs?.totalOpenJobs || 0,
                    newApplicants: metrics?.newApplicants || jobs?.totalJobsToday || 0,
                },
                realTimeStats: metrics,
            },
            error: null,
        });
    } catch (error) {
        console.error('Dashboard summary aggregation error:', error.message);
        return res.status(502).json({
            success: false,
            data: null,
            error: {
                message: 'Dashboard summary unavailable',
            },
        });
    }
});

router.use('/', (req, res, next) => {
    const target = getUserService(req);
    const proxy = createProxyMiddleware({
        target,
        changeOrigin: true,
        // Preserve query string and method. Path rewrite adds /api/users prefix before /dashboard
        pathRewrite: (path, reqInner) => {
            // Original incoming path example: /api/dashboard/metrics
            // We strip the leading /api/dashboard and reattach to /api/users/dashboard
            const suffix = path.replace(/^\/api\/dashboard/, '');
            const rewritten = `/api/users/dashboard${suffix}`;
            return rewritten;
        },
        onProxyReq: (proxyReq, reqInner) => {
            // Forward the original authenticated user header and signature as-is
            // to prevent HMAC mismatch from re-serialization
            if (reqInner.headers['x-authenticated-user']) {
                proxyReq.setHeader('x-authenticated-user', reqInner.headers['x-authenticated-user']);
            }
            if (reqInner.headers['x-gateway-signature']) {
                proxyReq.setHeader('x-gateway-signature', reqInner.headers['x-gateway-signature']);
            }
            if (reqInner.headers['x-auth-source']) {
                proxyReq.setHeader('x-auth-source', reqInner.headers['x-auth-source']);
            }
        },
        onError: (err, reqInner, resInner) => {
            console.error('Dashboard proxy error:', err.message);
            if (!resInner.headersSent) {
                // HIGH-16 FIX: Don't expose internal error details
                resInner.status(502).json({ success: false, error: { message: 'Dashboard service unavailable' } });
            }
        }
    });
    return proxy(req, res, next);
});

module.exports = router;
