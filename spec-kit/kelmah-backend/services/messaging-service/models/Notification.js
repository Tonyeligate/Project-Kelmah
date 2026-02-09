const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const NotificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "job_application",
        "job_offer",
        "contract_update",
        "payment_received",
        "message_received",
        "system_alert",
        "profile_update",
        "review_received",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    readStatus: {
      isRead: {
        type: Boolean,
        default: false,
      },
      readAt: Date,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    actionUrl: String,
    relatedEntity: {
      type: {
        type: String,
        enum: ["job", "contract", "message", "user", "payment"],
      },
      id: Schema.Types.ObjectId,
    },
    metadata: {
      icon: String,
      color: String,
      category: String,
    },
  },
  { timestamps: true },
);

// Indexes for better query performance
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ readStatus: 1 });

// Helper methods
NotificationSchema.methods.markAsRead = function () {
  this.readStatus.isRead = true;
  this.readStatus.readAt = new Date();
  return this.save();
};

const Notification = mongoose.model("Notification", NotificationSchema);

module.exports = Notification;
