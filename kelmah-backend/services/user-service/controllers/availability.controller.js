const Availability = require('../models/Availability');

exports.getAvailability = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    const doc = await Availability.findOne({ user: userId });
    if (!doc) return res.json({ success: true, data: { user: userId, isAvailable: true, daySlots: [], holidays: [], dailyHours: 8 } });
    return res.json({ success: true, data: doc });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

exports.upsertAvailability = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
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
    return res.status(500).json({ success: false, message: e.message });
  }
};

exports.deleteHoliday = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    const { date } = req.params;
    const doc = await Availability.findOneAndUpdate(
      { user: userId },
      { $pull: { holidays: { date: new Date(date) } } },
      { new: true }
    );
    return res.json({ success: true, data: doc });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};


