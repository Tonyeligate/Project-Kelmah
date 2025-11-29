const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ApplicationSchema = new Schema(
  {
    job: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    worker: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    proposedRate: {
      type: Number,
      required: true,
    },
    coverLetter: {
      type: String,
      required: true,
    },
    estimatedDuration: {
      value: Number,
      unit: {
        type: String,
        enum: ["hour", "day", "week", "month"],
        default: "day",
      },
    },
    attachments: [
      {
        name: String,
        fileUrl: String,
        fileType: String,
        uploadDate: Date,
      },
    ],
    status: {
      type: String,
      enum: ["pending", "under_review", "accepted", "rejected", "withdrawn"],
      default: "pending",
    },
    notes: String,
    availabilityStartDate: Date,
    questionResponses: [
      {
        question: String,
        answer: String,
      },
    ],
    isInvited: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    autoCreate: true,
    // CRITICAL: Set buffer timeout at schema level to ensure it's applied
    bufferCommands: true,
    bufferTimeoutMS: 45000, // 45 seconds - matches service db.js settings
  },
);

// Ensure a worker can't apply to the same job multiple times
ApplicationSchema.index({ job: 1, worker: 1 }, { unique: true });

// Index for efficient job applications lookup (getJobApplications query)
ApplicationSchema.index({ job: 1, createdAt: -1 });

// Index for worker's applications lookup
ApplicationSchema.index({ worker: 1, createdAt: -1 });

// Add methods to the model as needed
ApplicationSchema.methods.updateStatus = function (newStatus) {
  this.status = newStatus;
  return this.save();
};

// Use standard mongoose.model() - it auto-binds to the default connection
module.exports = mongoose.models.Application || mongoose.model("Application", ApplicationSchema);
