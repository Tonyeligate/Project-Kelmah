const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/**
 * SavedJob Model
 * Tracks which jobs have been saved by users
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

module.exports = mongoose.model("SavedJob", SavedJobSchema);