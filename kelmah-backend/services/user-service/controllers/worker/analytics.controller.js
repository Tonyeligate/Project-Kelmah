const models = require('../../models');
const { handleServiceError } = require('../../utils/helpers');

module.exports = {
  skills: async (req, res) => {
    try {
      const profile = await models.WorkerProfile.findOne({ userId: req.params.workerId });
      if (!profile) {
        return res.status(404).json({ success: false, message: 'Worker profile not found' });
      }

      const skills = profile.skillEntries || [];
      const totals = skills.reduce(
        (acc, skill) => {
          const level = skill.level || 'Intermediate';
          acc.byLevel[level] = (acc.byLevel[level] || 0) + 1;
          acc.years += Number(skill.yearsOfExperience || 0);
          return acc;
        },
        { byLevel: {}, years: 0 },
      );

      return res.json({
        success: true,
        data: {
          totals: {
            count: skills.length,
            averageYears: skills.length ? totals.years / skills.length : 0,
          },
          byLevel: totals.byLevel,
          recent: skills
            .filter((entry) => entry.updatedAt)
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .slice(0, 5),
        },
      });
    } catch (error) {
      return handleServiceError(res, error, 'Failed to load skills analytics');
    }
  },

  workHistory: async (req, res) => {
    try {
      const profile = await models.WorkerProfile.findOne({ userId: req.params.workerId });
      if (!profile) {
        return res.status(404).json({ success: false, message: 'Worker profile not found' });
      }

      const history = profile.workHistory || [];
      const stats = profile.workHistoryStats || {
        totalEntries: history.length,
        industries: [],
        averageTenureMonths: 0,
      };

      return res.json({
        success: true,
        data: {
          stats,
          history,
        },
      });
    } catch (error) {
      return handleServiceError(res, error, 'Failed to load work history analytics');
    }
  },

  ratings: async (req, res) => {
    try {
      const profile = await models.WorkerProfile.findOne({ userId: req.params.workerId });
      if (!profile) {
        return res.status(404).json({ success: false, message: 'Worker profile not found' });
      }

      return res.json({
        success: true,
        data: {
          rating: profile.rating || 0,
          totalReviews: profile.totalReviews || 0,
          successStats: profile.successStats || {
            jobsCompleted: profile.totalJobsCompleted || 0,
            jobsInProgress: profile.totalJobsStarted || 0,
            rehireRate: 0,
            averageJobValue: 0,
          },
        },
      });
    } catch (error) {
      return handleServiceError(res, error, 'Failed to load rating analytics');
    }
  },
};
