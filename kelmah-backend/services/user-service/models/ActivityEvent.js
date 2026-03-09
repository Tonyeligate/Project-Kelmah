const mongoose = require('mongoose');

const activityEventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    actorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
    sourceCollection: {
      type: String,
      required: true,
      trim: true,
    },
    sourceId: {
      type: String,
      required: true,
      trim: true,
    },
    occurredAt: {
      type: Date,
      required: true,
      index: true,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
      maxlength: 280,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

activityEventSchema.index({ userId: 1, occurredAt: -1 });
activityEventSchema.index(
  { userId: 1, type: 1, sourceCollection: 1, sourceId: 1, occurredAt: 1 },
  { unique: true, name: 'activity_event_dedupe_idx' },
);

module.exports = mongoose.models.ActivityEvent || mongoose.model('ActivityEvent', activityEventSchema);
