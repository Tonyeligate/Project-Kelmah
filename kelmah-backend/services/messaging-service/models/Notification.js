const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Map relatedEntity.type → Mongoose model name for dynamic population
const ENTITY_MODEL_MAP = {
  job: "Job",
  contract: "Contract",
  message: "Message",
  user: "User",
  payment: "Payment",
};

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
      id: {
        type: Schema.Types.ObjectId,
        // Dynamic ref based on relatedEntity.type
        refPath: "relatedEntity.modelRef",
      },
      // Virtual field resolved from .type for populate()
      modelRef: {
        type: String,
        enum: Object.values(ENTITY_MODEL_MAP),
      },
    },
    metadata: {
      icon: String,
      color: String,
      category: String,
    },
  },
  { timestamps: true },
);

// Auto-set modelRef from entity type before saving
NotificationSchema.pre("save", function (next) {
  if (this.relatedEntity?.type && !this.relatedEntity.modelRef) {
    this.relatedEntity.modelRef =
      ENTITY_MODEL_MAP[this.relatedEntity.type] || "User";
  }
  next();
});

// Also handle insertMany (bulk creates from messageSocket)
NotificationSchema.pre("insertMany", function (next, docs) {
  if (Array.isArray(docs)) {
    docs.forEach((doc) => {
      if (doc.relatedEntity?.type && !doc.relatedEntity?.modelRef) {
        if (!doc.relatedEntity) doc.relatedEntity = {};
        doc.relatedEntity.modelRef =
          ENTITY_MODEL_MAP[doc.relatedEntity.type] || "User";
      }
    });
  }
  next();
});

// Indexes for better query performance
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ "readStatus.isRead": 1 }); // Fixed: index the boolean, not subdocument

// TTL index: auto-delete notifications older than 90 days
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Helper methods
NotificationSchema.methods.markAsRead = function () {
  this.readStatus.isRead = true;
  this.readStatus.readAt = new Date();
  return this.save();
};

// Static: entity model map for external use (e.g. controller populate)
NotificationSchema.statics.ENTITY_MODEL_MAP = ENTITY_MODEL_MAP;

const Notification = mongoose.model("Notification", NotificationSchema);

module.exports = Notification;
