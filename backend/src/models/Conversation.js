const mongoose = require('mongoose');

const { Schema } = mongoose;

const conversationSchema = new Schema({
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  participantKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  lastMessage: {
    body: {
      type: String,
      trim: true
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    sentAt: Date
  },
  unreadCounts: {
    type: Map,
    of: Number,
    default: () => ({})
  },
  deletedFor: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

conversationSchema.index({ participants: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
