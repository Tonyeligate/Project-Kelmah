const mongoose = require('mongoose');

const CalendarEventSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 2000,
    },
    start: {
      type: Date,
      required: true,
      index: true,
    },
    end: {
      type: Date,
      required: true,
    },
    allDay: {
      type: Boolean,
      default: false,
    },
    color: {
      type: String,
      default: '#1D4ED8',
    },
    location: {
      type: String,
      default: '',
      trim: true,
      maxlength: 240,
    },
    source: {
      type: String,
      enum: ['manual', 'job', 'contract'],
      default: 'manual',
    },
    status: {
      type: String,
      enum: ['scheduled', 'cancelled', 'completed'],
      default: 'scheduled',
    },
  },
  { timestamps: true },
);

CalendarEventSchema.index({ owner: 1, start: -1 });

module.exports = mongoose.models.CalendarEvent || mongoose.model('CalendarEvent', CalendarEventSchema);
