const express = require('express');
const { verifyGatewayRequest } = require('../../../shared/middlewares/serviceTrust');
const CalendarEvent = require('../models/CalendarEvent');

const router = express.Router();

router.use(verifyGatewayRequest);

router.get('/', async (req, res) => {
  try {
    const owner = req.user?.id || req.user?._id;
    const events = await CalendarEvent.find({ owner }).sort({ start: 1 }).lean();
    return res.json({ success: true, data: events });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch events', code: 'EVENTS_FETCH_FAILED' },
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const owner = req.user?.id || req.user?._id;
    const { title, description = '', start, end, allDay = false, color, location = '', source = 'manual' } = req.body || {};

    if (!title || !start || !end) {
      return res.status(400).json({
        success: false,
        error: { message: 'title, start and end are required', code: 'VALIDATION_ERROR' },
      });
    }

    const created = await CalendarEvent.create({
      owner,
      title,
      description,
      start: new Date(start),
      end: new Date(end),
      allDay,
      color,
      location,
      source,
    });

    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to create event', code: 'EVENT_CREATE_FAILED' },
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const owner = req.user?.id || req.user?._id;
    const update = { ...req.body };
    if (update.start) update.start = new Date(update.start);
    if (update.end) update.end = new Date(update.end);

    const updated = await CalendarEvent.findOneAndUpdate(
      { _id: req.params.id, owner },
      { $set: update },
      { new: true },
    ).lean();

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: { message: 'Event not found', code: 'EVENT_NOT_FOUND' },
      });
    }

    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to update event', code: 'EVENT_UPDATE_FAILED' },
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const owner = req.user?.id || req.user?._id;
    const deleted = await CalendarEvent.findOneAndDelete({ _id: req.params.id, owner }).lean();

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { message: 'Event not found', code: 'EVENT_NOT_FOUND' },
      });
    }

    return res.json({ success: true, data: { id: req.params.id } });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to delete event', code: 'EVENT_DELETE_FAILED' },
    });
  }
});

module.exports = router;
