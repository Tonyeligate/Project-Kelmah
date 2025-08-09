/**
 * Bookmark Model (Mongoose)
 * Stores bookmarked workers per user in MongoDB (user-service uses Mongo)
 */

const mongoose = require('mongoose');

// Use string identifiers for cross-store compatibility (Sequelize UUIDs, Mongo ObjectIds, etc.)
const BookmarkSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  workerId: { type: String, required: true, index: true }
}, { timestamps: true, collection: 'bookmarks' });

BookmarkSchema.index({ userId: 1, workerId: 1 }, { unique: true });

module.exports = mongoose.model('Bookmark', BookmarkSchema);



