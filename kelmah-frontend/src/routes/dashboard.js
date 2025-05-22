const express = require('express');
const router = express.Router();
const Database = require('../config/database');
const { auth } = require('../middleware/auth');
const { LoggerService } = require('../services/LoggerService');
const { PerformanceService } = require('../services/PerformanceService');

const logger = new LoggerService();
const performance = new PerformanceService();

// Enhanced dashboard overview
router.get('/overview', auth, async (req, res) => {
    const startTime = performance.now();
    try {
        const db = await Database.getInstance();
        const userId = req.user.id;
        const userRole = req.user.role;

        // Get comprehensive stats
        const stats = await db.get(`
            SELECT 
                COUNT(*) as total_jobs,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_jobs,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_jobs,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_jobs,
                AVG(CASE WHEN rating IS NOT NULL THEN rating ELSE 0 END) as avg_rating,
                SUM(CASE WHEN status = 'completed' THEN payment_amount ELSE 0 END) as total_earnings,
                COUNT(DISTINCT CASE WHEN status = 'active' THEN worker_id END) as active_workers
            FROM jobs 
            WHERE ${userRole === 'hirer' ? 'client_id' : 'worker_id'} = ?`,
            [userId]
        );

        // Get recent activities
        const recentActivities = await db.all(`
            SELECT 
                'job' as type,
                id,
                title,
                status,
                created_at,
                updated_at
            FROM jobs
            WHERE ${userRole === 'hirer' ? 'client_id' : 'worker_id'} = ?
            ORDER BY created_at DESC
            LIMIT 5
        `, [userId]);

        // Get upcoming events
        const upcomingEvents = await db.all(`
            SELECT 
                e.id,
                e.title,
                e.start_time,
                e.end_time,
                e.type,
                e.status
            FROM events e
            WHERE (e.client_id = ? OR e.worker_id = ?)
            AND e.start_time > datetime('now')
            ORDER BY e.start_time ASC
            LIMIT 5
        `, [userId, userId]);

        // Get performance metrics
        const metrics = {
            completion_rate: (stats.completed_jobs / stats.total_jobs * 100) || 0,
            avg_rating: stats.avg_rating || 0,
            total_earnings: stats.total_earnings || 0,
            active_workers: stats.active_workers || 0
        };

        // Calculate response time
        const responseTime = performance.now() - startTime;
        logger.info(`Dashboard overview fetched in ${responseTime}ms`);

        res.json({
            userRole,
            stats: {
                totalJobs: stats.total_jobs || 0,
                activeJobs: stats.active_jobs || 0,
                completedJobs: stats.completed_jobs || 0,
                pendingJobs: stats.pending_jobs || 0,
                averageRating: Number(stats.avg_rating || 0).toFixed(1)
            },
            metrics,
            recentActivities,
            upcomingEvents
        });

    } catch (error) {
        logger.error('Error fetching dashboard overview:', error);
        res.status(500).json({ message: 'Error fetching dashboard overview' });
    }
});

// Enhanced jobs endpoint
router.get('/jobs', auth, async (req, res) => {
    const startTime = performance.now();
    try {
        const db = await Database.getInstance();
        const userId = req.user.id;
        const userRole = req.user.role;
        const { status, page = 1, limit = 10 } = req.query;

        const offset = (page - 1) * limit;
        let whereClause = `${userRole === 'hirer' ? 'client_id' : 'worker_id'} = ?`;
        if (status) {
            whereClause += ` AND status = '${status}'`;
        }

        const jobs = await db.all(`
            SELECT 
                j.*,
                u.username as worker_name,
                u.avatar as worker_avatar
            FROM jobs j
            LEFT JOIN users u ON j.worker_id = u.id
            WHERE ${whereClause}
            ORDER BY j.created_at DESC 
            LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );

        const total = await db.get(`
            SELECT COUNT(*) as count 
            FROM jobs 
            WHERE ${whereClause}`,
            [userId]
        );

        const responseTime = performance.now() - startTime;
        logger.info(`Jobs fetched in ${responseTime}ms`);

        res.json({
            jobs,
            pagination: {
                total: total.count,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total.count / limit)
            }
        });

    } catch (error) {
        logger.error('Error fetching jobs:', error);
        res.status(500).json({ message: 'Error fetching jobs' });
    }
});

// Keep other existing endpoints...

module.exports = router; 