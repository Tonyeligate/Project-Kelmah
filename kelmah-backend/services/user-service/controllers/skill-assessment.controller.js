/**
 * Skill Assessment Controller
 * Handles API requests for skill assessments
 */

const { SkillAssessment, Skill } = require('../models');
const logger = require('../utils/logger');

/**
 * Get all skill assessments for a worker
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getWorkerAssessments = async (req, res) => {
  try {
    const workerId = req.user.id;

    const assessments = await SkillAssessment.findAll({
      where: { workerId },
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

    return res.status(200).json({
      success: true,
      count: assessments.length,
      data: assessments
    });
  } catch (error) {
    logger.error(`Error fetching skill assessments: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Could not retrieve skill assessments'
    });
  }
};

/**
 * Get a specific skill assessment by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAssessmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const workerId = req.user.id;

    const assessment = await SkillAssessment.findOne({
      where: { id, workerId },
      include: [
        {
          model: Skill,
          as: 'skill',
          attributes: ['name', 'category', 'description']
        }
      ]
    });

    if (!assessment) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Skill assessment not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: assessment
    });
  } catch (error) {
    logger.error(`Error fetching skill assessment: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Could not retrieve skill assessment'
    });
  }
};

/**
 * Schedule a new skill assessment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.scheduleAssessment = async (req, res) => {
  try {
    const workerId = req.user.id;
    const { skillId, scheduledDate } = req.body;

    if (!skillId || !scheduledDate) {
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: 'Please provide skillId and scheduledDate'
      });
    }

    // Check if skill exists
    const skill = await Skill.findByPk(skillId);
    if (!skill) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Skill not found'
      });
    }

    // Check if worker already has a pending or in-progress assessment for this skill
    const existingAssessment = await SkillAssessment.findOne({
      where: {
        workerId,
        skillId,
        status: ['pending', 'in_progress']
      }
    });

    if (existingAssessment) {
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: 'You already have a pending or in-progress assessment for this skill'
      });
    }

    // Schedule the assessment
    const assessment = await SkillAssessment.create({
      workerId,
      skillId,
      skillName: skill.name,
      status: 'pending',
      scheduledDate: new Date(scheduledDate),
      attempt: 1, // First attempt
      metadata: {
        scheduledBy: 'worker'
      }
    });

    return res.status(201).json({
      success: true,
      data: assessment,
      message: 'Skill assessment scheduled successfully'
    });
  } catch (error) {
    logger.error(`Error scheduling skill assessment: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Could not schedule skill assessment'
    });
  }
};

/**
 * Reschedule an existing skill assessment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.rescheduleAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const workerId = req.user.id;
    const { scheduledDate } = req.body;

    if (!scheduledDate) {
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: 'Please provide scheduledDate'
      });
    }

    const assessment = await SkillAssessment.findOne({
      where: { id, workerId }
    });

    if (!assessment) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Skill assessment not found'
      });
    }

    // Check if assessment can be rescheduled
    if (assessment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: `Cannot reschedule assessment in ${assessment.status} status`
      });
    }

    await assessment.update({
      scheduledDate: new Date(scheduledDate),
      metadata: {
        ...assessment.metadata,
        rescheduled: true,
        lastScheduledDate: assessment.scheduledDate
      }
    });

    return res.status(200).json({
      success: true,
      data: assessment,
      message: 'Skill assessment rescheduled successfully'
    });
  } catch (error) {
    logger.error(`Error rescheduling skill assessment: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Could not reschedule skill assessment'
    });
  }
};

/**
 * Cancel a skill assessment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.cancelAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const workerId = req.user.id;

    const assessment = await SkillAssessment.findOne({
      where: { id, workerId }
    });

    if (!assessment) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Skill assessment not found'
      });
    }

    // Check if assessment can be cancelled
    if (assessment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: `Cannot cancel assessment in ${assessment.status} status`
      });
    }

    // Delete the assessment
    await assessment.destroy();

    return res.status(200).json({
      success: true,
      message: 'Skill assessment cancelled successfully'
    });
  } catch (error) {
    logger.error(`Error cancelling skill assessment: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Could not cancel skill assessment'
    });
  }
};

/**
 * Get assessment statistics for a worker
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAssessmentStats = async (req, res) => {
  try {
    const workerId = req.user.id;

    // Get all assessments for the worker
    const assessments = await SkillAssessment.findAll({
      where: { workerId },
      attributes: ['status', 'score']
    });

    // Initialize stats
    const stats = {
      total: assessments.length,
      completed: 0,
      pending: 0,
      in_progress: 0,
      expired: 0,
      failed: 0,
      averageScore: 0,
      highestScore: 0
    };

    // Calculate counts and scores
    let totalScore = 0;
    let scoredAssessments = 0;

    assessments.forEach(assessment => {
      // Count by status
      stats[assessment.status] = (stats[assessment.status] || 0) + 1;

      // Calculate scores for completed assessments
      if (assessment.status === 'completed' && assessment.score !== null) {
        totalScore += assessment.score;
        scoredAssessments++;

        if (assessment.score > stats.highestScore) {
          stats.highestScore = assessment.score;
        }
      }
    });

    // Calculate average score
    if (scoredAssessments > 0) {
      stats.averageScore = Math.round(totalScore / scoredAssessments);
    }

    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error(`Error fetching assessment stats: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Could not retrieve assessment statistics'
    });
  }
}; 