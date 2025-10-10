const mongoose = require('mongoose');

const phoneOtpSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  otp: { type: String, required: true },
  expires: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('PhoneOtp', phoneOtpSchema);
