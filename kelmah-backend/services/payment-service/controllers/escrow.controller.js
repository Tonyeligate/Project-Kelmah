// Minimal controller to satisfy frontend escrow endpoints
// In a real implementation, wire to MongoDB models

exports.getEscrows = async (req, res, next) => {
  try {
    return res.status(501).json({
      success: false,
      message: 'Escrow listing not implemented. Connect to real datastore first.',
      code: 'NOT_IMPLEMENTED'
    });
  } catch (err) {
    next(err);
  }
};

exports.getEscrowDetails = async (req, res, next) => {
  try {
    return res.status(501).json({
      success: false,
      message: 'Escrow details not implemented. Connect to real datastore first.',
      code: 'NOT_IMPLEMENTED'
    });
  } catch (err) {
    next(err);
  }
};

exports.releaseEscrow = async (req, res, next) => {
  try {
    return res.status(501).json({
      success: false,
      message: 'Escrow release not implemented. Connect to real payment provider first.',
      code: 'NOT_IMPLEMENTED'
    });
  } catch (err) {
    next(err);
  }
};






