const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Schema for saved searches to allow users to save search queries
 * and receive notifications for new matching items
 */
const SavedSearchSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['location', 'keyword', 'skills', 'combined'],
      required: true
    },
    name: {
      type: String,
      required: true
    },
    query: {
      type: Schema.Types.Mixed,
      required: true
    },
    notifyNew: {
      type: Boolean,
      default: false
    },
    lastChecked: {
      type: Date,
      default: Date.now
    },
    lastNotified: {
      type: Date
    },
    resultCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Create compound indexes for efficient querying
SavedSearchSchema.index({ userId: 1, type: 1 });
SavedSearchSchema.index({ notifyNew: 1, lastChecked: 1 }, { sparse: true });

/**
 * Update the last checked timestamp
 */
SavedSearchSchema.methods.updateLastChecked = function() {
  this.lastChecked = new Date();
  return this.save();
};

/**
 * Update the last notified timestamp and result count
 */
SavedSearchSchema.methods.updateLastNotified = function(count) {
  this.lastNotified = new Date();
  this.resultCount = count;
  return this.save();
};

/**
 * Static method to find searches that need checking for new results
 */
SavedSearchSchema.statics.findPendingNotifications = function(options = {}) {
  const { maxAge = 24 } = options;
  const cutoffTime = new Date();
  cutoffTime.setHours(cutoffTime.getHours() - maxAge);
  
  return this.find({
    notifyNew: true,
    $or: [
      { lastChecked: { $lte: cutoffTime } },
      { lastChecked: { $exists: false } }
    ]
  });
};

const SavedSearch = mongoose.model('SavedSearch', SavedSearchSchema);
module.exports = SavedSearch; 