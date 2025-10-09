const mongoose = require('mongoose');

const { Schema } = mongoose;

const messageSchema = new Schema({
  conversation: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  body: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  readAt: Date,
  notificationScheduledFor: {
    type: Date,
    index: true
  },
  notificationEmailSentAt: {
    type: Date,
    index: true
  },
  notificationEmailCancelledAt: Date,
  notificationEmailAttempts: {
    type: Number,
    default: 0
  },
  notificationEmailLastAttemptAt: Date,
  notificationEmailError: String
}, {
  timestamps: true
});

messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ notificationScheduledFor: 1, notificationEmailSentAt: 1 });
module.exports = mongoose.model('Message', messageSchema);
