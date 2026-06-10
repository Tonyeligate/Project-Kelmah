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
    directConversationKey: {
      type: String,
      sparse: true,
      trim: true,
    },
  },
  { timestamps: true },
);

// Indexes for better query performance
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ relatedJob: 1 });
ConversationSchema.index({ relatedContract: 1 });
ConversationSchema.index({ status: 1 });
ConversationSchema.index({ directConversationKey: 1 }, { unique: true, sparse: true });

ConversationSchema.pre('validate', function (next) {
  if (Array.isArray(this.participants) && this.participants.length === 2) {
    this.directConversationKey = this.participants
      .map((participant) => participant?.toString?.() || String(participant))
      .sort()
      .join(':');
  } else {
    this.directConversationKey = undefined;
  }

  next();
});

// ---------------------------------------------------------------------------
// Atomic static helpers (H-MSG2)
// These use MongoDB update operators so they are safe under concurrent writes.
// ---------------------------------------------------------------------------

/**
 * Atomically increment the unread count for a participant in a conversation.
 * If the participant does not yet have an unreadCounts entry, one is pushed.
 */
ConversationSchema.statics.atomicIncrementUnread = async function (conversationId, userId) {
  const result = await this.updateOne(
    { _id: conversationId, 'unreadCounts.user': userId },
    { $inc: { 'unreadCounts.$.count': 1 } },
  );
  if (result.matchedCount === 0) {
    await this.updateOne(
      { _id: conversationId },
      { $push: { unreadCounts: { user: userId, count: 1 } } },
    );
  }
};

/**
 * Atomically reset the unread count for a participant in a conversation.
 */
ConversationSchema.statics.atomicResetUnread = async function (conversationId, userId) {
  await this.updateOne(
    { _id: conversationId, 'unreadCounts.user': userId },
    { $set: { 'unreadCounts.$.count': 0 } },
  );
};

// ---------------------------------------------------------------------------
// DEPRECATED instance methods -- kept for backward compatibility only.
// New code MUST use the atomic statics above.
// ---------------------------------------------------------------------------
// NOTE: These methods mutate the document in-place. Callers MUST call .save() themselves.
ConversationSchema.methods.incrementUnreadCount = function (userId) {
  const unreadCount = this.unreadCounts.find(
    (count) => count.user.toString() === userId.toString(),
  );
  if (unreadCount) {
    unreadCount.count += 1;
  } else {
    this.unreadCounts.push({ user: userId, count: 1 });
  }
};

ConversationSchema.methods.resetUnreadCount = function (userId) {
  const unreadCount = this.unreadCounts.find(
    (count) => count.user.toString() === userId.toString(),
  );
  if (unreadCount) {
    unreadCount.count = 0;
  }
};

// ---------------------------------------------------------------------------
// Pre-delete middleware to clean up orphaned messages (M-MSG5)
// Covers deleteOne (document & query) and findOneAndDelete.
// ---------------------------------------------------------------------------
ConversationSchema.pre('deleteOne', { document: true, query: false }, async function () {
  const Message = mongoose.model('Message');
  await Message.deleteMany({ conversation: this._id });
});

ConversationSchema.pre('deleteOne', { document: false, query: true }, async function () {
  const doc = await this.model.findOne(this.getFilter()).select('_id');
  if (doc) {
    const Message = mongoose.model('Message');
    await Message.deleteMany({ conversation: doc._id });
  }
});

ConversationSchema.pre('findOneAndDelete', async function () {
  const doc = await this.model.findOne(this.getFilter()).select('_id');
  if (doc) {
    const Message = mongoose.model('Message');
    await Message.deleteMany({ conversation: doc._id });
  }
});

const Conversation = mongoose.model("Conversation", ConversationSchema);

module.exports = Conversation;
