// const mongoose = require('mongoose');

// const userSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   role: {
//   type: String,
//   default: 'user'
// },
//  currentToken: { type: String, default: null },
//  isOnline: { type: Boolean, default: false },

//  isVerified: { 
//         type: Boolean, 
//         default: false 
//     },
//     emailVerificationToken: { 
//         type: String 
//     },
//     emailVerificationExpires: { type: Date  },
// //  lastSeenAt: { type: Date, default: null },///////////
//  },
//  { timestamps: true }

// );

// userSchema.index(
//   { emailVerificationExpires: 1 }, 
//   { 
//     expireAfterSeconds: 0,
//     partialFilterExpression: { isVerified: false } 
//   }
// );


// module.exports = mongoose.model('User', userSchema);



const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true }, // ✅ Added phone number
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  currentToken: { type: String, default: null },
  isOnline: { type: Boolean, default: false },

  // Email verification
  isVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  emailVerificationExpires: { type: Date },
}, { timestamps: true });

userSchema.index(
  { emailVerificationExpires: 1 },
  {
    expireAfterSeconds: 0,
    partialFilterExpression: { isVerified: false }
  }
);

module.exports = mongoose.model('User', userSchema);








// const mongoose = require('mongoose');

// const userSchema = new mongoose.Schema({
//     name: { type: String, required: true },
//     email: { type: String, required: true, unique: true },
//     password: { type: String, required: true },
//     phone: { type: String, required: true, unique: true }, // Added phone number
//     role: {
//         type: String,
//         default: 'user'
//     },
//     currentToken: { type: String, default: null },
//     isOnline: { type: Boolean, default: false },

//     // Email Verification Fields
//     isEmailVerified: {
//         type: Boolean,
//         default: false
//     },
//     emailVerificationToken: {
//         type: String
//     },
//     emailVerificationExpires: { type: Date },

//     // Phone Verification Fields
//     isPhoneVerified: {
//         type: Boolean,
//         default: false
//     },
//     phoneOtp: {
//         type: String
//     },
//     phoneOtpExpires: {
//         type: Date
//     },
// }, { timestamps: true });

// // Note: Renamed isVerified to isEmailVerified for clarity
// userSchema.index({ emailVerificationExpires: 1 }, {
//     expireAfterSeconds: 0,
//     partialFilterExpression: { isEmailVerified: false }
// });

// module.exports = mongoose.model('User', userSchema);
