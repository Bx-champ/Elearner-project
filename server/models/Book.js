const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  name: String,
  price: Number,
  contents: String,
  subject: String,
  tags: String,
  coverUrl: String,
  pdfUrl: String,
});

module.exports = mongoose.model('Book', bookSchema);
