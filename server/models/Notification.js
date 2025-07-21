const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Can be null for admin notifications
  type: {
    type: String,
    enum: [
      'requestSubmitted',
      'approved',
      'rejected',
      'assigned',
      'revoked',
      'expired',
      'userRequest'
    ],
    required: true
  },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  forAdmin: { type: Boolean, default: false }, // ✅ NEW FIELD
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
