const mongoose = require('mongoose');

const { Schema } = mongoose;

const blockedUserSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  blockedUser: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, {
  timestamps: true
});

blockedUserSchema.index({ user: 1, blockedUser: 1 }, { unique: true });

module.exports = mongoose.model('BlockedUser', blockedUserSchema);
