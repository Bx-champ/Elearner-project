// const mongoose = require('mongoose');

// const ChapterAccessRequestSchema = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
//   chapters: [{ type: String, required: true }], // Array of chapter _id strings
//   status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
//   requestedAt: { type: Date, default: Date.now }
// });

// module.exports = mongoose.model('ChapterAccessRequest', ChapterAccessRequestSchema);


const mongoose = require('mongoose');

const ChapterAccessRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  chapters: [
    {
      chapterId: { type: String, required: true },
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
    }
  ],
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  requestedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ChapterAccessRequest', ChapterAccessRequestSchema);
