/**
 * Job Model
 */

const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
      maxlength: [100, "Job title cannot be more than 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Job description is required"],
      trim: true,
      maxlength: [5000, "Job description cannot be more than 5000 characters"],
    },
    category: {
      type: String,
      required: [true, "Job category is required"],
      trim: true,
    },
    skills: [
      {
        type: String,
        required: [true, "At least one skill is required"],
        trim: true,
      },
    ],
    budget: {
      type: Number,
      required: [true, "Budget is required"],
    },
    currency: {
      type: String,
      default: 'GHS',
      trim: true
    },
    duration: {
      value: {
        type: Number,
        required: [true, "Duration value is required"],
      },
      unit: {
        type: String,
        enum: ["hour", "day", "week", "month"],
        required: [true, "Duration unit is required"],
      },
    },
    paymentType: {
      type: String,
      enum: ["fixed", "hourly"],
      required: [true, "Payment type is required"],
    },
    location: {
      type: {
        type: String,
        enum: ["remote", "onsite", "hybrid"],
        required: [true, "Location type is required"],
      },
      country: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        trim: true,
      },
    },
    status: {
      type: String,
      enum: ["draft", "open", "in-progress", "completed", "cancelled"],
      default: "open",
    },
    visibility: {
      type: String,
      enum: ["public", "private", "invite-only"],
      default: "public",
    },
    attachments: [
      {
        name: String,
        url: String,
        type: String,
        size: Number,
      },
    ],
    hirer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Hirer is required"],
    },
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    proposalCount: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    completedDate: {
      type: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual fields for proposals
JobSchema.virtual("proposals", {
  ref: "Proposal",
  localField: "_id",
  foreignField: "job",
  justOne: false,
});

// Virtual field for contract
JobSchema.virtual("contract", {
  ref: "Contract",
  localField: "_id",
  foreignField: "job",
  justOne: true,
});

// Index for text search
JobSchema.index({
  title: "text",
  description: "text",
  category: "text",
  skills: "text",
});

// Optional geo index if location coordinates are added later
// JobSchema.index({ locationCoordinates: '2dsphere' });

// Export model, reusing existing definition if present to avoid overwrite
const JobModel = mongoose.models.Job || mongoose.model("Job", JobSchema);
module.exports = JobModel;
