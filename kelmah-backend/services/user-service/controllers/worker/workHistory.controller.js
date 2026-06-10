const mongoose = require('mongoose');
const models = require('../../models');
const { handleServiceError, validateInput } = require('../../utils/helpers');

const entryFromPayload = (payload = {}) => ({
  role: payload.role?.trim(),
  company: payload.company?.trim() || null,
  employmentType: payload.employmentType || 'contract',
  location: payload.location?.trim() || null,
  startDate: payload.startDate ? new Date(payload.startDate) : null,
  endDate: payload.endDate ? new Date(payload.endDate) : null,
  isCurrent: Boolean(payload.isCurrent),
  description: payload.description?.trim() || null,
  highlights: Array.isArray(payload.highlights) ? payload.highlights : [],
  clientsServed: Array.isArray(payload.clientsServed)
    ? payload.clientsServed
    : [],
  technologies: Array.isArray(payload.technologies)
    ? payload.technologies
    : [],
});

const getProfile = async (workerId) => {
  const { WorkerProfile } = models;
  if (!WorkerProfile) {
    throw Object.assign(new Error('WorkerProfile model unavailable'), {
      statusCode: 503,
    });
  }

  const profile = await WorkerProfile.findOne({ userId: workerId });
  if (!profile) {
    const error = new Error('Worker profile not found');
    error.statusCode = 404;
    throw error;
  }
  return profile;
};

module.exports = {
  list: async (req, res) => {
    try {
      const profile = await getProfile(req.params.workerId);
      const history = profile.workHistory || [];
      return res.json({
        success: true,
        data: {
          workHistory: history,
          stats: profile.workHistoryStats || {
            totalEntries: history.length,
            industries: [],
            averageTenureMonths: 0,
          },
        },
      });
    } catch (error) {
      return handleServiceError(res, error, 'Failed to load work history');
    }
  },

  create: async (req, res) => {
    try {
      const validation = validateInput(req.body || {}, ['role']);
      if (!validation.isValid) {
        return res.status(400).json({ success: false, errors: validation.errors });
      }

      const profile = await getProfile(req.params.workerId);
      const entry = {
        _id: new mongoose.Types.ObjectId(),
        ...entryFromPayload(req.body),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      profile.workHistory = [...(profile.workHistory || []), entry];
      profile.workHistoryStats = {
        totalEntries: profile.workHistory.length,
        industries: [...new Set((profile.workHistory || []).map((item) => item.industry).filter(Boolean))],
        averageTenureMonths: profile.workHistory.reduce((sum, item) => {
          if (!item.startDate) return sum;
          const end = item.endDate || new Date();
          const months = (end - new Date(item.startDate)) / (1000 * 60 * 60 * 24 * 30);
          return sum + Math.max(0, months);
        }, 0) / Math.max(1, profile.workHistory.length),
      };
      await profile.save();

      return res.status(201).json({
        success: true,
        data: { entry },
        message: 'Work history added successfully',
      });
    } catch (error) {
      return handleServiceError(res, error, 'Failed to add work history');
    }
  },

  update: async (req, res) => {
    try {
      const { workerId, entryId } = req.params;
      const profile = await getProfile(workerId);
      const history = profile.workHistory || [];
      const idx = history.findIndex((entry) => String(entry._id) === entryId);

      if (idx === -1) {
        return res.status(404).json({ success: false, message: 'Work history entry not found' });
      }

      history[idx] = {
        ...history[idx],
        ...entryFromPayload(req.body),
        updatedAt: new Date(),
      };
      profile.workHistory = history;
      await profile.save();

      return res.json({ success: true, data: { entry: history[idx] }, message: 'Work history updated successfully' });
    } catch (error) {
      return handleServiceError(res, error, 'Failed to update work history');
    }
  },

  remove: async (req, res) => {
    try {
      const { workerId, entryId } = req.params;
      const profile = await getProfile(workerId);
      const history = profile.workHistory || [];
      const filtered = history.filter((entry) => String(entry._id) !== entryId);

      if (filtered.length === history.length) {
        return res.status(404).json({ success: false, message: 'Work history entry not found' });
      }

      profile.workHistory = filtered;
      await profile.save();

      return res.json({ success: true, message: 'Work history entry removed successfully' });
    } catch (error) {
      return handleServiceError(res, error, 'Failed to remove work history entry');
    }
  },
};
