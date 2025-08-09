const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Models
const Review = mongoose.model('Review');

// Auth middleware is expected to be applied at app level for /api/admin

// GET /api/admin/reviews/queue?status=pending&page=1&limit=20
router.get('/reviews/queue', async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20, category, minRating } = req.query;
    const filter = { status };
    if (category) filter.jobCategory = category;
    if (minRating) filter['ratings.overall'] = { $gte: parseInt(minRating) };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Review.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Admin reviews queue error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch moderation queue' });
  }
});

// POST /api/admin/reviews/:id/moderate { status, note }
router.post('/reviews/:id/moderate', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    if (!['approved', 'rejected', 'flagged'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const review = await Review.findByIdAndUpdate(
      id,
      {
        status,
        $push: { moderationNotes: { note, moderatorId: req.user?.id, timestamp: new Date() } }
      },
      { new: true }
    );
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    res.json({ success: true, message: 'Review moderated', data: review });
  } catch (error) {
    console.error('Admin moderate review error:', error);
    res.status(500).json({ success: false, message: 'Failed to moderate review' });
  }
});

// POST /api/admin/reviews/bulk-moderate { ids: [], status, note }
router.post('/reviews/bulk-moderate', async (req, res) => {
  try {
    const { ids = [], status, note } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'ids array is required' });
    }
    if (!['approved', 'rejected', 'flagged'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const result = await Review.updateMany(
      { _id: { $in: ids } },
      {
        $set: { status },
        $push: { moderationNotes: { note, moderatorId: req.user?.id, timestamp: new Date() } }
      }
    );
    res.json({ success: true, message: `${result.modifiedCount} reviews ${status}`, data: { modified: result.modifiedCount } });
  } catch (error) {
    console.error('Admin bulk moderate error:', error);
    res.status(500).json({ success: false, message: 'Failed to bulk moderate reviews' });
  }
});

module.exports = router;



