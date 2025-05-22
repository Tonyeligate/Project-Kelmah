/**
 * Analytics Controller
 * Handles job view tracking and analytics metrics
 */

const { Job, JobView, sequelize } = require('../models');
const { Op, QueryTypes } = require('sequelize');
const logger = require('../utils/logger');

/**
 * Track a job view
 */
exports.trackJobView = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: 'Job ID is required'
      });
    }
    
    // Check if job exists
    const job = await Job.findByPk(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Get user ID if authenticated
    const userId = req.user ? req.user.id : null;
    
    // Get client information
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const referrer = req.headers.referer || req.headers.referrer;
    
    // Check for recent views from the same user/IP to prevent duplicate counts
    const recentView = await JobView.findOne({
      where: {
        jobId,
        ...(userId ? { userId } : { ip }),
        createdAt: {
          [Op.gt]: new Date(Date.now() - 30 * 60 * 1000) // Last 30 minutes
        }
      }
    });
    
    // If a recent view exists, don't create a new one
    if (recentView) {
      return res.status(200).json({
        success: true,
        message: 'View already tracked',
        viewId: recentView.id
      });
    }
    
    // Create job view record
    const jobView = await JobView.create({
      jobId,
      userId,
      ip,
      userAgent,
      referrer,
      viewDuration: 0 // Initial duration, can be updated later
    });
    
    // Update view count in job entity if available
    if (job.views !== undefined) {
      await job.increment('views');
    }
    
    return res.status(201).json({
      success: true,
      message: 'View tracked successfully',
      data: {
        viewId: jobView.id
      }
    });
  } catch (error) {
    logger.error(`Error in trackJobView: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to track job view',
      error: error.message
    });
  }
};

/**
 * Update view duration
 */
exports.updateViewDuration = async (req, res) => {
  try {
    const { viewId } = req.params;
    const { duration } = req.body;
    
    if (!viewId) {
      return res.status(400).json({
        success: false,
        message: 'View ID is required'
      });
    }
    
    if (duration === undefined || isNaN(duration)) {
      return res.status(400).json({
        success: false,
        message: 'Valid duration is required'
      });
    }
    
    // Find the job view
    const jobView = await JobView.findByPk(viewId);
    if (!jobView) {
      return res.status(404).json({
        success: false,
        message: 'Job view not found'
      });
    }
    
    // Update the duration
    jobView.viewDuration = parseInt(duration);
    await jobView.save();
    
    return res.status(200).json({
      success: true,
      message: 'View duration updated'
    });
  } catch (error) {
    logger.error(`Error in updateViewDuration: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to update view duration',
      error: error.message
    });
  }
};

/**
 * Get job view analytics
 */
exports.getJobViewAnalytics = async (req, res) => {
  try {
    const { jobId } = req.params;
    const timeframe = req.query.timeframe || 'week'; // day, week, month, all
    
    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: 'Job ID is required'
      });
    }
    
    // Check if job exists and user has access
    const job = await Job.findByPk(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Check authorization
    const userId = req.user ? req.user.id : null;
    if (job.userId !== userId && !req.user?.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view analytics for this job'
      });
    }
    
    // Calculate date range based on timeframe
    const now = new Date();
    let startDate;
    
    switch (timeframe) {
      case 'day':
        startDate = new Date(now.setDate(now.getDate() - 1));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'all':
      default:
        startDate = new Date(0); // Beginning of time
    }
    
    // Get total views
    const totalViews = await JobView.count({
      where: {
        jobId,
        createdAt: {
          [Op.gte]: startDate
        }
      }
    });
    
    // Get unique viewers
    const uniqueViewers = await JobView.count({
      where: {
        jobId,
        createdAt: {
          [Op.gte]: startDate
        }
      },
      distinct: true,
      col: 'userId'
    });
    
    // Get average view time
    const avgViewTime = await JobView.findOne({
      where: {
        jobId,
        createdAt: {
          [Op.gte]: startDate
        },
        viewDuration: {
          [Op.gt]: 0
        }
      },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('viewDuration')), 'avgDuration']
      ],
      raw: true
    });
    
    // Get daily view trends
    let timeBucketFormat;
    let intervalString;
    
    switch (timeframe) {
      case 'day':
        timeBucketFormat = 'YYYY-MM-DD HH24:00';
        intervalString = '1 hour';
        break;
      case 'week':
        timeBucketFormat = 'YYYY-MM-DD';
        intervalString = '1 day';
        break;
      case 'month':
        timeBucketFormat = 'YYYY-MM-DD';
        intervalString = '1 day';
        break;
      case 'all':
      default:
        timeBucketFormat = 'YYYY-MM';
        intervalString = '1 month';
    }
    
    const trendQuery = `
      SELECT 
        time_bucket('${intervalString}', created_at) AS time_period,
        COUNT(*) AS view_count
      FROM 
        job_views
      WHERE 
        job_id = :jobId
        AND created_at >= :startDate
      GROUP BY 
        time_period
      ORDER BY 
        time_period ASC
    `;
    
    const trends = await sequelize.query(trendQuery, {
      replacements: {
        jobId,
        startDate: startDate.toISOString()
      },
      type: QueryTypes.SELECT
    });
    
    // Get referrer breakdown
    const referrers = await JobView.findAll({
      where: {
        jobId,
        createdAt: {
          [Op.gte]: startDate
        },
        referrer: {
          [Op.ne]: null
        }
      },
      attributes: [
        'referrer',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['referrer'],
      order: [[sequelize.literal('count'), 'DESC']],
      limit: 10
    });
    
    // Prepare analytics response
    const analytics = {
      totalViews,
      uniqueViewers,
      avgViewTime: avgViewTime?.avgDuration || 0,
      trends: trends.map(trend => ({
        timePeriod: trend.time_period,
        viewCount: parseInt(trend.view_count)
      })),
      referrers: referrers.map(ref => ({
        source: ref.referrer,
        count: parseInt(ref.get('count'))
      }))
    };
    
    return res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error(`Error in getJobViewAnalytics: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to get job view analytics',
      error: error.message
    });
  }
};

/**
 * Get popular job skills
 */
exports.getPopularJobSkills = async (req, res) => {
  try {
    const timeframe = req.query.timeframe || 'month'; // week, month, year, all
    const limit = parseInt(req.query.limit, 10) || 20;
    
    // Calculate date range based on timeframe
    const now = new Date();
    let startDate;
    
    switch (timeframe) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      case 'all':
      default:
        startDate = new Date(0); // Beginning of time
    }
    
    // Query to get popular skills from trending jobs
    const query = `
      SELECT 
        s.name AS skill_name,
        COUNT(DISTINCT jv.job_id) AS job_count,
        COUNT(jv.id) AS view_count
      FROM 
        skills s
      JOIN 
        job_skills js ON s.id = js.skill_id
      JOIN 
        job_views jv ON js.job_id = jv.job_id
      WHERE 
        jv.created_at >= :startDate
      GROUP BY 
        s.name
      ORDER BY 
        view_count DESC,
        job_count DESC
      LIMIT :limit
    `;
    
    const popularSkills = await sequelize.query(query, {
      replacements: {
        startDate: startDate.toISOString(),
        limit
      },
      type: QueryTypes.SELECT
    });
    
    // Format the results
    const skills = popularSkills.map(skill => ({
      name: skill.skill_name,
      jobCount: parseInt(skill.job_count),
      viewCount: parseInt(skill.view_count)
    }));
    
    return res.status(200).json({
      success: true,
      timeframe,
      data: skills
    });
  } catch (error) {
    logger.error(`Error in getPopularJobSkills: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to get popular job skills',
      error: error.message
    });
  }
}; 