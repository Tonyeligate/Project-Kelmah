const { Availability } = require('../models');

// SECURITY: Enforce ownership — only allow access to own availability (or admin)
const resolveOwnerId = (req) => {
  const paramId = req.params.userId;
  const authId = req.user?.id;
  // If a route param is provided, it MUST match the authenticated user
  if (paramId && paramId !== authId) return null; // forbidden
  return authId;
};

exports.getAvailability = async (req, res) => {
  try {
    const userId = resolveOwnerId(req);
    if (!userId) return res.status(403).json({ success: false, message: 'Forbidden' });
    const doc = await Availability.findOne({ user: userId }).lean();
    if (!doc) return res.json({ success: true, data: { user: userId, isAvailable: true, daySlots: [], holidays: [], dailyHours: 8 } });
    return res.json({ success: true, data: doc });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to get availability' });
  }
};

exports.upsertAvailability = async (req, res) => {
  try {
    const userId = resolveOwnerId(req);
    if (!userId) return res.status(403).json({ success: false, message: 'Forbidden' });
    const update = {};
    const allowed = ['timezone','isAvailable','pausedUntil','daySlots','holidays','notes','dailyHours','weeklyHoursCap'];
    for (const key of allowed) if (key in req.body) update[key] = req.body[key];
    const doc = await Availability.findOneAndUpdate(
      { user: userId },
      { $set: update, $setOnInsert: { user: userId } },
      { upsert: true, new: true }
    );
    return res.json({ success: true, data: doc });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to update availability' });
  }
};

exports.deleteHoliday = async (req, res) => {
  try {
    const userId = resolveOwnerId(req);
    if (!userId) return res.status(403).json({ success: false, message: 'Forbidden' });
    const { date } = req.params;
    const doc = await Availability.findOneAndUpdate(
      { user: userId },
      { $pull: { holidays: { date: new Date(date) } } },
      { new: true }
    );
    return res.json({ success: true, data: doc });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to delete holiday' });
  }
};


