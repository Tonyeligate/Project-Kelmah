const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ContractSchema = new Schema(
  {
    job: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: true
    },
    hirer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    worker: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    application: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: Date,
    paymentTerms: {
      type: {
        type: String,
        enum: ['fixed', 'hourly', 'milestone'],
        required: true
      },
      rate: {
        type: Number,
        required: true
      },
      currency: {
        type: String,
        default: 'USD'
      }
    },
    milestones: [{
      title: String,
      description: String,
      amount: Number,
      dueDate: Date,
      status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'approved', 'paid'],
        default: 'pending'
      },
      completionDate: Date,
      paymentDate: Date
    }],
    deliverables: [{
      title: String,
      description: String,
      dueDate: Date,
      status: {
        type: String,
        enum: ['pending', 'delivered', 'accepted', 'rejected'],
        default: 'pending'
      }
    }],
    termsAndConditions: {
      content: String,
      acceptedByHirer: {
        type: Boolean,
        default: false
      },
      acceptedByWorker: {
        type: Boolean,
        default: false
      },
      hirerAcceptanceDate: Date,
      workerAcceptanceDate: Date
    },
    status: {
      type: String,
      enum: ['draft', 'pending', 'active', 'completed', 'terminated', 'cancelled'],
      default: 'draft'
    },
    terminationReason: String,
    notes: String,
    files: [{
      name: String,
      fileUrl: String,
      fileType: String,
      uploadDate: Date,
      uploadedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    }]
  },
  { timestamps: true }
);

// Indexes for better query performance
ContractSchema.index({ job: 1, worker: 1 }, { unique: true });
ContractSchema.index({ hirer: 1 });
ContractSchema.index({ worker: 1 });
ContractSchema.index({ status: 1 });

// Helper methods
ContractSchema.methods.activate = function() {
  this.status = 'active';
  return this.save();
};

ContractSchema.methods.complete = function() {
  this.status = 'completed';
  this.endDate = new Date();
  return this.save();
};

ContractSchema.methods.terminate = function(reason) {
  this.status = 'terminated';
  this.terminationReason = reason;
  this.endDate = new Date();
  return this.save();
};

const Contract = mongoose.model('Contract', ContractSchema);

module.exports = Contract;

