const { Op } = require('sequelize');
const { JobApplication, SkillAssessment, Profile, ProfileSkill, Skill } = require('../models');
const logger = require('../utils/logger');
const { response } = require('../../../shared');

/**
 * Get dashboard statistics for a worker
 * @route GET /dashboard/stats
 * @access Private (Worker)
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const workerId = req.user.id;

    // Get application statistics
    const applications = await JobApplication.findAll({
      where: { workerId },
      attributes: ['status']
    });

    const applicationStats = {
      total: applications.length,
      pending: 0,
      reviewing: 0,
      shortlisted: 0,
      interview: 0,
      accepted: 0,
      rejected: 0,
      withdrawn: 0
    };

    applications.forEach(app => {
      applicationStats[app.status] = (applicationStats[app.status] || 0) + 1;
    });

    // Get assessment statistics
    const assessments = await SkillAssessment.findAll({
      where: { workerId },
      attributes: ['status', 'score']
    });

    const assessmentStats = {
      completed: 0,
      pending: 0,
      in_progress: 0,
      expired: 0,
      failed: 0,
      averageScore: 0
    };

    let totalScore = 0;
    let scoredAssessments = 0;

    assessments.forEach(assessment => {
      assessmentStats[assessment.status] = (assessmentStats[assessment.status] || 0) + 1;

      if (assessment.status === 'completed' && assessment.score !== null) {
        totalScore += assessment.score;
        scoredAssessments++;
      }
    });

    if (scoredAssessments > 0) {
      assessmentStats.averageScore = Math.round(totalScore / scoredAssessments);
    }

    // Get top skills
    const workerProfile = await Profile.findOne({
      where: { userId: workerId },
      include: [
        {
          model: Skill,
          through: {
            attributes: ['endorsements', 'yearsExperience', 'level']
          },
          as: 'skills'
        }
      ]
    });

    const topSkills = workerProfile && workerProfile.skills ? 
      workerProfile.skills
        .map(skill => ({
          name: skill.name,
          endorsements: skill.ProfileSkill.endorsements,
          level: skill.ProfileSkill.level
        }))
        .sort((a, b) => b.endorsements - a.endorsements)
        .slice(0, 3) : [];

    // Mock work history for now - to be replaced with actual job completion data
    const workHistory = {
      completedJobs: 0,
      hoursWorked: 0,
      earnings: 0
    };

    // Assemble dashboard stats
    const dashboardStats = {
      applications: applicationStats,
      workHistory,
      topSkills,
      assessments: assessmentStats
    };

    return res.status(200).json({
      success: true,
      data: dashboardStats
    });
  } catch (error) {
    logger.error(`Error fetching dashboard stats: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Could not retrieve dashboard statistics'
    });
  }
};

/**
 * Get job applications for a worker
 * @route GET /job-applications/worker
 * @access Private (Worker)
 */
exports.getWorkerApplications = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Mock job applications data
    const applications = [
      {
        id: '1',
        jobTitle: 'Plumbing Service for Office Building',
        company: 'Acme Corporation',
        status: 'pending',
        appliedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        coverLetter: 'I have 5 years of experience in commercial plumbing...',
        job: {
          id: '101',
          title: 'Plumbing Service for Office Building',
          description: 'Looking for experienced plumber to fix various issues in our office building',
          budget: '$500-1000',
          location: 'New York, NY',
          deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()
        }
      },
      {
        id: '2',
        jobTitle: 'Electrical Wiring for New Home',
        company: 'Johnson Family',
        status: 'viewed',
        appliedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        coverLetter: 'I am a certified electrician with experience in residential wiring...',
        job: {
          id: '102',
          title: 'Electrical Wiring for New Home',
          description: 'Need electrician for wiring our newly constructed home',
          budget: '$2000-3000',
          location: 'Austin, TX',
          deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
        }
      },
      {
        id: '3',
        jobTitle: 'HVAC Maintenance for Restaurant',
        company: 'Fine Dining LLC',
        status: 'interview',
        appliedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        coverLetter: 'I specialize in commercial HVAC systems with particular expertise in restaurant setups...',
        job: {
          id: '103',
          title: 'HVAC Maintenance for Restaurant',
          description: 'Looking for regular maintenance of our restaurant HVAC system',
          budget: '$300/month',
          location: 'Chicago, IL',
          deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
        }
      }
    ];

    return response.success(res, 200, applications);
  } catch (error) {
    console.error('Error fetching worker applications:', error);
    return response.error(res, 500, 'Failed to fetch job applications');
  }
};

/**
 * Get worker skills data
 * @route GET /worker-profile/skills
 * @access Private (Worker)
 */
exports.getWorkerSkills = async (req, res) => {
  try {
    const workerId = req.user.id;

    const profile = await Profile.findOne({
      where: { userId: workerId },
      include: [
        {
          model: Skill,
          through: {
            attributes: ['endorsements', 'yearsExperience', 'level']
          },
          as: 'skills'
        }
      ]
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Worker profile not found'
      });
    }

    // Format skills for response
    const skills = profile.skills.map(skill => ({
      id: skill.id,
      name: skill.name,
      level: skill.ProfileSkill.level,
      yearsExperience: skill.ProfileSkill.yearsExperience,
      endorsements: skill.ProfileSkill.endorsements
    }));

    return res.status(200).json({
      success: true,
      count: skills.length,
      data: skills
    });
  } catch (error) {
    logger.error(`Error fetching worker skills: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Could not retrieve worker skills'
    });
  }
};

/**
 * Get skill assessments for a worker
 * @route GET /worker-profile/assessments
 * @access Private (Worker)
 */
exports.getSkillAssessments = async (req, res) => {
  try {
    const workerId = req.user.id;
    
    // Mock assessment data
    const assessments = [
      {
        id: '1',
        skillName: 'Plumbing',
        status: 'completed',
        score: 92,
        completedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        badge: 'Expert Plumber',
        certificate: true
      },
      {
        id: '2',
        skillName: 'Electrical',
        status: 'completed',
        score: 78,
        completedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        badge: 'Skilled Electrician',
        certificate: true
      },
      {
        id: '3',
        skillName: 'HVAC',
        status: 'in_progress',
        progress: 65,
        startedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        timeRemaining: '2 days'
      },
      {
        id: '4',
        skillName: 'Carpentry',
        status: 'available',
        difficulty: 'Intermediate',
        duration: '45 minutes',
        prerequisites: ['Basic tools knowledge']
      },
      {
        id: '5',
        skillName: 'Painting',
        status: 'available',
        difficulty: 'Beginner',
        duration: '30 minutes',
        prerequisites: []
      }
    ];

    return response.success(res, 200, assessments);
  } catch (error) {
    console.error('Error fetching skill assessments:', error);
    return response.error(res, 500, 'Failed to fetch assessment data');
  }
};

/**
 * Get worker assessments
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getWorkerAssessments = async (req, res) => {
  try {
    const workerId = req.user.id;
    const { status } = req.query;

    const where = { workerId };

    // Add status filter if provided
    if (status) {
      where.status = status;
    }

    const assessments = await SkillAssessment.findAll({
      where,
      include: [
        {
          model: Skill,
          as: 'skill',
          attributes: ['name', 'category']
        }
      ],
      order: [
        ['status', 'ASC'],
        ['scheduledDate', 'ASC'],
        ['completedDate', 'DESC']
      ]
    });

    // Format for response
    const formattedAssessments = assessments.map(assessment => ({
      id: assessment.id,
      skillName: assessment.skillName,
      score: assessment.score,
      status: assessment.status,
      completed: assessment.completedDate,
      scheduled: assessment.scheduledDate,
      certificate: assessment.hasCertificate,
      certificateUrl: assessment.certificateUrl
    }));

    return res.status(200).json({
      success: true,
      count: assessments.length,
      data: formattedAssessments
    });
  } catch (error) {
    logger.error(`Error fetching worker assessments: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Could not retrieve worker assessments'
    });
  }
}; 