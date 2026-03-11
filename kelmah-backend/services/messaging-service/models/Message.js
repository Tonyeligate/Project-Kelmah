const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MessageSchema = new Schema(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: function requiredContent() {
        const hasEncryptedBody = Boolean(this.encryptedBody);
        const hasAttachments =
          Array.isArray(this.attachments) && this.attachments.length > 0;
        return !hasEncryptedBody && !hasAttachments;
      },
      trim: true,
    },
    messageType: {
      type: String,
      enum: ["text", "image", "file", "system", "mixed"],
      default: "text",
    },
    attachments: [
      {
        name: String,
        fileUrl: String,
        s3Key: String,
        publicId: String,
        resourceType: String,
        thumbnailUrl: String,
        fileType: String,
        fileSize: Number,
        width: Number,
        height: Number,
        duration: Number,
        format: String,
        uploadDate: Date,
        virusScan: {
          status: {
            type: String,
            enum: ["pending", "clean", "infected", "failed"],
            default: "pending",
          },
          scannedAt: Date,
          engine: String,
          details: String,
        },
      },
    ],
    readStatus: {
      isRead: {
        type: Boolean,
        default: false,
      },
      readAt: Date,
    },
    relatedJob: {
      type: Schema.Types.ObjectId,
      ref: "Job",
    },
    relatedContract: {
      type: Schema.Types.ObjectId,
      ref: "Contract",
    },
    metadata: {
      deviceInfo: String,
      ipAddress: String,
    },
    // Optional E2E envelope storage
    encryptedBody: { type: String },
    encryption: {
      scheme: { type: String },
      version: { type: String },
      senderKeyId: { type: String },
      recipientKeyId: { type: String },
      nonce: { type: String },
    },
    editedAt: { type: Date },
    reactions: [
      {
        emoji: String,
        user: { type: Schema.Types.ObjectId, ref: "User" },
        addedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

// Indexes for better query performance
MessageSchema.index({ conversation: 1, createdAt: -1 });
MessageSchema.index({ sender: 1, recipient: 1 });
MessageSchema.index({ createdAt: -1 });
MessageSchema.index({ relatedJob: 1 });
MessageSchema.index({ relatedContract: 1 });
// Full-text search index — replaces $regex collection scans in searchMessages/searchConversations
MessageSchema.index({ content: 'text' }, { default_language: 'english', weights: { content: 1 } });

// Helper methods
MessageSchema.methods.markAsRead = function () {
  this.readStatus.isRead = true;
  this.readStatus.readAt = new Date();
  return this.save();
};

const Message = mongoose.model("Message", MessageSchema);

module.exports = Message;
