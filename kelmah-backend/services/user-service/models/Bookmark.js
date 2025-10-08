/**
 * Bookmark Model (Mongoose)
 * Stores bookmarked workers per user in MongoDB (user-service uses Mongo)
 */

const mongoose = require('mongoose');

// Use string identifiers for cross-store compatibility (Sequelize UUIDs, Mongo ObjectIds, etc.)
const BookmarkSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  workerId: { type: String, required: true }
}, { timestamps: true, collection: 'bookmarks' });

BookmarkSchema.index({ userId: 1, workerId: 1 }, { unique: true });

// Use mongoose.connection.model() to ensure model uses the active connection
module.exports = mongoose.connection.models.Bookmark || mongoose.connection.model('Bookmark', BookmarkSchema);



