/**
 * Recommendation Controller
 * Handles job recommendations based on user preferences, skills, and behavior
 */

const { Job, JobSkill, Skill, Application, User, sequelize } = require('../models');
const { Op, QueryTypes } = require('sequelize');
const logger = require('../utils/logger');

/**
 * Get job recommendations for a user based on their skills and application history
 */
exports.getRecommendedJobs = async (req, res) => {
  try {
    // User must be authenticated
    const userId = req.user.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User must be authenticated for personalized recommendations'
      });
    }

    // Parse pagination parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    // Get user skills from user service
    let userSkills = [];
    try {
      // This would typically be a microservice call
      // For now, we'll use a mock array or query from a joined table if available
      const response = await fetch(`${process.env.USER_SERVICE_URL}/api/users/${userId}/skills`);
      if (response.ok) {
        const data = await response.json();
        userSkills = data.skills || [];
      }
    } catch (error) {
      logger.error(`Error fetching user skills: ${error.message}`);
      // Continue with empty skills rather than failing
    }

    // If we couldn't get user skills, try to infer from applications
    if (!userSkills.length) {
      // Get skills from jobs the user has applied to
      const appliedJobs = await Application.findAll({
        where: { userId },
        include: [{
          model: Job,
          include: [{
            model: Skill,
            through: { attributes: [] }
          }]
        }]
      });

      // Extract unique skills from applied jobs
      const skillSet = new Set();
      appliedJobs.forEach(application => {
        if (application.Job && application.Job.Skills) {
          application.Job.Skills.forEach(skill => {
            skillSet.add(skill.name);
          });
        }
      });

      userSkills = Array.from(skillSet);
    }

    // Additional filters
    const filters = {};
    
    // Only show open jobs
    filters.status = 'open';
    
    // Don't show jobs the user has already applied to
    const appliedJobIds = await Application.findAll({
      where: { userId },
      attributes: ['jobId']
    }).then(applications => applications.map(app => app.jobId));

    if (appliedJobIds.length > 0) {
      filters.id = { [Op.notIn]: appliedJobIds };
    }
    
    // Filter by preferred job type if specified
    if (req.query.jobType) {
      filters.jobType = req.query.jobType;
    }
    
    // Filter by budget range if specified
    if (req.query.minBudget) {
      filters.budget = { ...filters.budget, [Op.gte]: parseFloat(req.query.minBudget) };
    }
    
    if (req.query.maxBudget) {
      filters.budget = { ...filters.budget, [Op.lte]: parseFloat(req.query.maxBudget) };
    }
    
    // Query options
    let options = {
      where: filters,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [{
        model: Skill,
        through: { attributes: [] } 
      }]
    };
    
    // If user has skills, boost jobs with matching skills
    let jobs = [];
    let count = 0;
    
    if (userSkills.length > 0) {
      // Use raw query for more complex scoring
      const query = `
        SELECT 
          j.*, 
          COUNT(DISTINCT CASE WHEN s.name IN (:userSkills) THEN s.id END) as matching_skills_count,
          COUNT(DISTINCT s.id) as total_skills_count
        FROM 
          jobs j
        LEFT JOIN 
          job_skills js ON j.id = js.job_id
        LEFT JOIN 
          skills s ON js.skill_id = s.id
        WHERE 
          j.status = 'open'
          ${appliedJobIds.length > 0 ? 'AND j.id NOT IN (:appliedJobIds)' : ''}
          ${req.query.jobType ? 'AND j.job_type = :jobType' : ''}
          ${req.query.minBudget ? 'AND j.budget >= :minBudget' : ''}
          ${req.query.maxBudget ? 'AND j.budget <= :maxBudget' : ''}
        GROUP BY 
          j.id
        ORDER BY 
          matching_skills_count DESC,
          j.created_at DESC
        LIMIT :limit OFFSET :offset
      `;
      
      // Execute the query with replacements
      const replacements = {
        userSkills,
        limit,
        offset,
        appliedJobIds: appliedJobIds.length > 0 ? appliedJobIds : [0],
        jobType: req.query.jobType,
        minBudget: req.query.minBudget ? parseFloat(req.query.minBudget) : 0,
        maxBudget: req.query.maxBudget ? parseFloat(req.query.maxBudget) : 1000000
      };
      
      const results = await sequelize.query(query, {
        replacements,
        type: QueryTypes.SELECT
      });
      
      // Get the count of total matching jobs for pagination
      const countQuery = `
        SELECT 
          COUNT(DISTINCT j.id) as total
        FROM 
          jobs j
        LEFT JOIN 
          job_skills js ON j.id = js.job_id
        LEFT JOIN 
          skills s ON js.skill_id = s.id
        WHERE 
          j.status = 'open'
          ${appliedJobIds.length > 0 ? 'AND j.id NOT IN (:appliedJobIds)' : ''}
          ${req.query.jobType ? 'AND j.job_type = :jobType' : ''}
          ${req.query.minBudget ? 'AND j.budget >= :minBudget' : ''}
          ${req.query.maxBudget ? 'AND j.budget <= :maxBudget' : ''}
      `;
      
      const countResult = await sequelize.query(countQuery, {
        replacements,
        type: QueryTypes.SELECT
      });
      
      count = countResult[0]?.total || 0;
      
      // Process the results to include skills and calculate match score
      jobs = await Promise.all(results.map(async (job) => {
        // Get skills for this job
        const jobSkills = await Skill.findAll({
          include: [{
            model: Job,
            where: { id: job.id },
            through: { attributes: [] }
          }]
        });
        
        const skills = jobSkills.map(skill => skill.name);
        const matchingSkills = skills.filter(skill => userSkills.includes(skill));
        const matchScore = skills.length > 0 
          ? Math.round((matchingSkills.length / skills.length) * 100) 
          : 0;
        
        return {
          ...job,
          skills,
          matchingSkills,
          matchScore
        };
      }));
    } else {
      // If no user skills, just get recent jobs
      const result = await Job.findAndCountAll({
        ...options,
        distinct: true
      });
      
      jobs = result.rows.map(job => {
        const skills = job.Skills.map(skill => skill.name);
        return {
          ...job.get({ plain: true }),
          skills,
          matchingSkills: [],
          matchScore: 0
        };
      });
      
      count = result.count;
    }
    
    // Prepare pagination metadata
    const totalPages = Math.ceil(count / limit);
    const hasMore = page < totalPages;
    
    return res.status(200).json({
      success: true,
      count,
      pages: totalPages,
      currentPage: page,
      hasMore,
      data: jobs
    });
  } catch (error) {
    logger.error(`Error in getRecommendedJobs: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to get job recommendations',
      error: error.message
    });
  }
};

/**
 * Get similar jobs based on a specific job
 */
exports.getSimilarJobs = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: 'Job ID is required'
      });
    }
    
    // Find the reference job
    const referenceJob = await Job.findByPk(jobId, {
      include: [{
        model: Skill,
        through: { attributes: [] }
      }]
    });
    
    if (!referenceJob) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Extract skills from the reference job
    const jobSkills = referenceJob.Skills.map(skill => skill.name);
    
    if (jobSkills.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No skills found for this job to match against',
        data: []
      });
    }
    
    // Parse pagination parameters
    const limit = parseInt(req.query.limit, 10) || 5;
    
    // Get similar jobs based on skills overlap
    const query = `
      SELECT 
        j.*, 
        COUNT(DISTINCT CASE WHEN s.name IN (:jobSkills) THEN s.id END) as matching_skills_count
      FROM 
        jobs j
      LEFT JOIN 
        job_skills js ON j.id = js.job_id
      LEFT JOIN 
        skills s ON js.skill_id = s.id
      WHERE 
        j.id != :jobId
        AND j.status = 'open'
        AND j.job_type = :jobType
      GROUP BY 
        j.id
      HAVING
        matching_skills_count > 0
      ORDER BY 
        matching_skills_count DESC,
        ABS(j.budget - :budget) ASC
      LIMIT :limit
    `;
    
    const similarJobs = await sequelize.query(query, {
      replacements: {
        jobId,
        jobSkills,
        jobType: referenceJob.jobType,
        budget: referenceJob.budget,
        limit
      },
      type: QueryTypes.SELECT
    });
    
    // Process the results to include skills and calculate match percentage
    const processedJobs = await Promise.all(similarJobs.map(async (job) => {
      // Get skills for this job
      const skills = await Skill.findAll({
        include: [{
          model: Job,
          where: { id: job.id },
          through: { attributes: [] }
        }]
      }).then(skills => skills.map(skill => skill.name));
      
      const matchingSkills = skills.filter(skill => jobSkills.includes(skill));
      const similarityScore = Math.round((matchingSkills.length / jobSkills.length) * 100);
      
      return {
        ...job,
        skills,
        matchingSkills,
        similarityScore
      };
    }));
    
    return res.status(200).json({
      success: true,
      data: processedJobs
    });
  } catch (error) {
    logger.error(`Error in getSimilarJobs: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to get similar jobs',
      error: error.message
    });
  }
};

/**
 * Get trending jobs based on recent activity and popularity
 */
exports.getTrendingJobs = async (req, res) => {
  try {
    // Parse pagination parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const timeframe = req.query.timeframe || 'week'; // day, week, month
    
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
      default:
        startDate = new Date(now.setDate(now.getDate() - 7));
    }
    
    // Find trending jobs based on application count and view count
    const query = `
      SELECT 
        j.*,
        COUNT(DISTINCT a.id) as application_count,
        (
          SELECT COUNT(*) 
          FROM job_views jv 
          WHERE jv.job_id = j.id AND jv.created_at > :startDate
        ) as view_count
      FROM 
        jobs j
      LEFT JOIN 
        applications a ON j.id = a.job_id AND a.created_at > :startDate
      WHERE 
        j.status = 'open'
      GROUP BY 
        j.id
      ORDER BY 
        application_count DESC,
        view_count DESC,
        j.created_at DESC
      LIMIT :limit OFFSET :offset
    `;
    
    const trending = await sequelize.query(query, {
      replacements: {
        startDate: startDate.toISOString(),
        limit,
        offset
      },
      type: QueryTypes.SELECT
    });
    
    // Get count for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT j.id) as total
      FROM jobs j
      WHERE j.status = 'open'
    `;
    
    const countResult = await sequelize.query(countQuery, {
      type: QueryTypes.SELECT
    });
    
    const count = countResult[0]?.total || 0;
    
    // Process the results to include skills
    const processedJobs = await Promise.all(trending.map(async (job) => {
      // Get skills for this job
      const skills = await Skill.findAll({
        include: [{
          model: Job,
          where: { id: job.id },
          through: { attributes: [] }
        }]
      }).then(skills => skills.map(skill => skill.name));
      
      return {
        ...job,
        skills,
        trendScore: (parseInt(job.application_count) * 2) + parseInt(job.view_count)
      };
    }));
    
    // Prepare pagination metadata
    const totalPages = Math.ceil(count / limit);
    const hasMore = page < totalPages;
    
    return res.status(200).json({
      success: true,
      count,
      pages: totalPages,
      currentPage: page,
      hasMore,
      timeframe,
      data: processedJobs
    });
  } catch (error) {
    logger.error(`Error in getTrendingJobs: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to get trending jobs',
      error: error.message
    });
  }
}; 