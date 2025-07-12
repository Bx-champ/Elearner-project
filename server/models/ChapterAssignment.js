// 📁 models/ChapterAssignment.js
const mongoose = require('mongoose');

const ChapterAssignmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  chapterId: { type: mongoose.Schema.Types.ObjectId, required: true },
  assignedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

module.exports = mongoose.model('ChapterAssignment', ChapterAssignmentSchema);
