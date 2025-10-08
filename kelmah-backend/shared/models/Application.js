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
    // bufferCommands controlled globally by mongoose.set() in server startup
    autoCreate: true
  },
);

// Ensure a worker can't apply to the same job multiple times
ApplicationSchema.index({ job: 1, worker: 1 }, { unique: true });

// Add methods to the model as needed
ApplicationSchema.methods.updateStatus = function (newStatus) {
  this.status = newStatus;
  return this.save();
};

const Application = mongoose.models.Application || mongoose.model("Application", ApplicationSchema);

module.exports = Application;
