// Minimal controller to satisfy frontend escrow endpoints
// In a real implementation, wire to MongoDB models

exports.getEscrows = async (req, res, next) => {
  try {
    return res.json([]);
  } catch (err) {
    next(err);
  }
};

exports.getEscrowDetails = async (req, res, next) => {
  try {
    return res.json(null);
  } catch (err) {
    next(err);
  }
};

exports.releaseEscrow = async (req, res, next) => {
  try {
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
};




