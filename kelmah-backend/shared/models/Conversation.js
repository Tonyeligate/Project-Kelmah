const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ConversationSchema = new Schema(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
    unreadCounts: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        count: {
          type: Number,
          default: 0,
        },
      },
    ],
    relatedJob: {
      type: Schema.Types.ObjectId,
      ref: "Job",
    },
    relatedContract: {
      type: Schema.Types.ObjectId,
      ref: "Contract",
    },
    status: {
      type: String,
      enum: ["active", "archived", "deleted"],
      default: "active",
    },
    metadata: {
      title: String,
      description: String,
      tags: [String],
    },
  },
  { 
    timestamps: true,
    // bufferCommands controlled globally by mongoose.set() in server startup
    autoCreate: true
  },
);

// Indexes for better query performance
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ relatedJob: 1 });
ConversationSchema.index({ relatedContract: 1 });
ConversationSchema.index({ status: 1 });

// Helper methods
ConversationSchema.methods.incrementUnreadCount = function (userId) {
  const unreadCount = this.unreadCounts.find(
    (count) => count.user.toString() === userId.toString(),
  );
  if (unreadCount) {
    unreadCount.count += 1;
  } else {
    this.unreadCounts.push({ user: userId, count: 1 });
  }
  return this.save();
};

ConversationSchema.methods.resetUnreadCount = function (userId) {
  const unreadCount = this.unreadCounts.find(
    (count) => count.user.toString() === userId.toString(),
  );
  if (unreadCount) {
    unreadCount.count = 0;
  }
  return this.save();
};

const Conversation = mongoose.models.Conversation || mongoose.model("Conversation", ConversationSchema);

module.exports = Conversation;
