const mongoose = require('mongoose');
const models = require('../../models');
const { handleServiceError, validateInput } = require('../../utils/helpers');

const normalizeSkillPayload = (payload = {}) => ({
  name: payload.name?.trim(),
  level: payload.level || 'Intermediate',
  category: payload.category?.trim() || null,
  yearsOfExperience: Number.isFinite(Number(payload.yearsOfExperience))
    ? Number(payload.yearsOfExperience)
    : null,
  description: payload.description?.trim() || null,
  verified: Boolean(payload.verified),
  lastUsedAt: payload.lastUsedAt ? new Date(payload.lastUsedAt) : null,
  evidenceUrl: payload.evidenceUrl?.trim() || null,
});

const getWorkerProfile = async (workerId) => {
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
      const { workerId } = req.params;
      const profile = await getWorkerProfile(workerId);
      return res.json({
        success: true,
        data: {
          skills: profile.skillEntries || [],
          metadata: {
            count: profile.skillEntries?.length || 0,
            fallback: false,
          },
        },
      });
    } catch (error) {
      return handleServiceError(res, error, 'Failed to load skills');
    }
  },

  create: async (req, res) => {
    try {
      const { workerId } = req.params;
      const validation = validateInput(req.body || {}, ['name']);
      if (!validation.isValid) {
        return res.status(400).json({ success: false, errors: validation.errors });
      }

      const profile = await getWorkerProfile(workerId);
      const normalized = normalizeSkillPayload(req.body);
      const skillEntry = {
        _id: new mongoose.Types.ObjectId(),
        ...normalized,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      profile.skillEntries = [...(profile.skillEntries || []), skillEntry];
      await profile.save();

      return res.status(201).json({
        success: true,
        data: { skill: skillEntry },
        message: 'Skill added successfully',
      });
    } catch (error) {
      return handleServiceError(res, error, 'Failed to add skill');
    }
  },

  update: async (req, res) => {
    try {
      const { workerId, skillId } = req.params;
      const profile = await getWorkerProfile(workerId);
      const skills = profile.skillEntries || [];
      const index = skills.findIndex((entry) => String(entry._id) === skillId);

      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Skill not found' });
      }

      const updates = {
        ...skills[index],
        ...normalizeSkillPayload(req.body),
        updatedAt: new Date(),
      };

      skills[index] = updates;
      profile.skillEntries = skills;
      await profile.save();

      return res.json({
        success: true,
        data: { skill: updates },
        message: 'Skill updated successfully',
      });
    } catch (error) {
      return handleServiceError(res, error, 'Failed to update skill');
    }
  },

  remove: async (req, res) => {
    try {
      const { workerId, skillId } = req.params;
      const profile = await getWorkerProfile(workerId);
      const skills = profile.skillEntries || [];
      const filtered = skills.filter((entry) => String(entry._id) !== skillId);

      if (filtered.length === skills.length) {
        return res.status(404).json({ success: false, message: 'Skill not found' });
      }

      profile.skillEntries = filtered;
      await profile.save();

      return res.json({ success: true, message: 'Skill removed successfully' });
    } catch (error) {
      return handleServiceError(res, error, 'Failed to remove skill');
    }
  },
};
