const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema for individual deliverables within a milestone
const DeliverableSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  attachments: [{
    fileUrl: String,
    fileName: String,
    fileType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });

// Main Milestone Schema
const MilestoneSchema = new Schema({
  contractId: {
    type: Schema.Types.ObjectId,
    ref: 'Contract',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'submitted', 'approved', 'rejected'],
    default: 'pending'
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  dueDate: {
    type: Date
  },
  order: {
    type: Number,
    required: true
  },
  deliverables: [DeliverableSchema],
  submissionNotes: {
    type: String,
    trim: true
  },
  submissionDate: {
    type: Date
  },
  approvalDate: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  feedback: {
    type: String,
    trim: true
  }
}, { timestamps: true });

// Add an index for faster contract-based queries
MilestoneSchema.index({ contractId: 1, order: 1 });

const Milestone = mongoose.model('Milestone', MilestoneSchema);
module.exports = Milestone;