const express = require('express');
const router = express.Router();

// Temporary 200s to avoid frontend 404s while backend is implemented
router.get('/history', async (req, res) => {
  return res.json({ transactions: [] });
});

module.exports = router;


