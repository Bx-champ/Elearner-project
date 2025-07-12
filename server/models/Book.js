const mongoose = require('mongoose');

// Subchapter schema
const subchapterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  fromPage: { type: Number, required: true },
  toPage: { type: Number, required: true },
}, { _id: false });

// Chapter schema
const chapterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  fromPage: { type: Number, required: true },
  toPage: { type: Number, required: true },
  price: { type: Number, required: true },
  order: Number,
  pdfUrl: String,
  subchapters: [subchapterSchema]  // ✅ Add subchapters here
});

// Book schema
const bookSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contents: String,
  subject: String,
  tags: String,
  coverUrl: String,
  pdfUrl: String,
  chapters: [chapterSchema],
  price: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

// Auto-calculate price before save
bookSchema.pre('save', function (next) {
  this.price = this.chapters?.reduce((sum, ch) => sum + (ch.price || 0), 0);
  next();
});

module.exports = mongoose.model('Book', bookSchema);
