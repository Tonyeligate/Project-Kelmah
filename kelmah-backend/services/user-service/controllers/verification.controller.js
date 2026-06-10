exports.verifyBackground = async (req, res) => {
  try {
    const { idNumber } = req.body || {};
    if (!idNumber) return res.status(400).json({ success: false, message: 'idNumber is required' });
    // TODO: Integrate with Ghana verification APIs
    const ok = idNumber.length >= 6;
    return res.json({ success: true, data: { ok } });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'verification failed' });
  }
};




