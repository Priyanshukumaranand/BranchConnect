const mongoose = require('mongoose');

const OTPSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  purpose: {
    type: String,
    enum: ['signup', 'password-reset', 'general'],
    default: 'signup',
    lowercase: true,
    trim: true
  },
  otp: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 5
  }
});

module.exports = mongoose.model('OTP', OTPSchema);
