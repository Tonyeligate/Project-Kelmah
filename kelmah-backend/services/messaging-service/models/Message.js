const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MessageSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'file', 'system'],
      default: 'text'
    },
    attachments: [{
      name: String,
      fileUrl: String,
      fileType: String,
      fileSize: Number,
      uploadDate: Date
    }],
    readStatus: {
      isRead: {
        type: Boolean,
        default: false
      },
      readAt: Date
    },
    relatedJob: {
      type: Schema.Types.ObjectId,
      ref: 'Job'
    },
    relatedContract: {
      type: Schema.Types.ObjectId,
      ref: 'Contract'
    },
    metadata: {
      deviceInfo: String,
      ipAddress: String
    }
  },
  { timestamps: true }
);

// Indexes for better query performance
MessageSchema.index({ sender: 1, recipient: 1 });
MessageSchema.index({ createdAt: -1 });
MessageSchema.index({ relatedJob: 1 });
MessageSchema.index({ relatedContract: 1 });

// Helper methods
MessageSchema.methods.markAsRead = function() {
  this.readStatus.isRead = true;
  this.readStatus.readAt = new Date();
  return this.save();
};

const Message = mongoose.model('Message', MessageSchema);

module.exports = Message;
