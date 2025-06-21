// const mongoose = require('mongoose');

// const bookSchema = new mongoose.Schema({
//   name: String,
//   price: Number,
//   contents: String,
//   subject: String,
//   tags: String,
//   coverUrl: String,
//   pdfUrl: String,
// });

// module.exports = mongoose.model('Book', bookSchema);



const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  pdfUrl: String,
  order: Number,
});

const bookSchema = new mongoose.Schema({
  name: String,
  contents: String,
  subject: String,
  tags: String,
  coverUrl: String,
  chapters: [chapterSchema],
  price: Number, // auto-calculated from chapters
});

module.exports = mongoose.model('Book', bookSchema);
