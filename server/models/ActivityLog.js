const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  chapterId: { type: mongoose.Schema.Types.ObjectId, required: true },
  pagesViewed: [{ type: Number }],
  totalTimeSpent: { type: Number, default: 0 }, // in seconds
  lastActive: { type: Date, default: Date.now },
  isOnline: { type: Boolean, default: false }, // 🟢 To track if user is online
  sessionId: { type: String } // optional: if tracking session login/logout
}, { timestamps: true });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
