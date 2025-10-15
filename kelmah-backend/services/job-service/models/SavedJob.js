const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/**
 * SavedJob Model - Local to Job Service
 * Tracks which jobs have been saved/bookmarked by users
 */
const SavedJobSchema = new Schema({
  job: {
    type: Schema.Types.ObjectId,
    ref: "Job",
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure one save per user per job
SavedJobSchema.index({ job: 1, user: 1 }, { unique: true });
SavedJobSchema.index({ user: 1, createdAt: -1 }); // For user's saved jobs list

// Use mongoose.connection.model() to ensure model uses the active connection
module.exports = mongoose.connection.models.SavedJob || mongoose.connection.model("SavedJob", SavedJobSchema);
