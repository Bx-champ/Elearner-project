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

 isVerified: { 
        type: Boolean, 
        default: false 
    },
    emailVerificationToken: { 
        type: String 
    },
    emailVerificationExpires: { type: Date  },
//  lastSeenAt: { type: Date, default: null },///////////
 },
 { timestamps: true }

);

userSchema.index(
  { emailVerificationExpires: 1 }, 
  { 
    expireAfterSeconds: 0,
    partialFilterExpression: { isVerified: false } 
  }
);


module.exports = mongoose.model('User', userSchema);
