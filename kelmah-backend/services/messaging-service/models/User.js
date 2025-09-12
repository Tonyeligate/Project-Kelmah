const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["hirer", "worker", "admin"],
      required: true,
    },
    profilePicture: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["online", "offline", "away", "busy"],
      default: "offline",
    },
  },
  { timestamps: true }
);

// Indexes for better query performance (email index is automatic due to unique: true)
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });

// Helper methods
UserSchema.methods.getFullName = function () {
  return `${this.firstName} ${this.lastName}`;
};

UserSchema.methods.updateLastSeen = function () {
  this.lastSeen = new Date();
  return this.save();
};

const User = mongoose.model("User", UserSchema);

module.exports = User;