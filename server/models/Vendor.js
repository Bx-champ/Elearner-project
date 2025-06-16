// models/Vendor.js
const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  instituteName: {
    type: String,
    required: true,
    trim: true
  },
  representativeName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
role: {
  type: String,
  default: 'vendor'
}

  
});

module.exports = mongoose.model('Vendor', vendorSchema);
