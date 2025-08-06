const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
  type: String,
  default: 'user'
},
 currentToken: { type: String, default: null },
 isOnline: { type: Boolean, default: false },
//  lastSeenAt: { type: Date, default: null },///////////
 },
 { timestamps: true }

);

module.exports = mongoose.model('User', userSchema);
