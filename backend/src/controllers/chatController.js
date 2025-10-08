const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const BlockedUser = require('../models/BlockedUser');
const { sanitizeUser } = require('../utils/sanitizeUser');
const sendMessageNotificationEmail = require('../utils/sendMessageNotificationEmail');

const MAX_PAGE_SIZE = 20;

const toObjectId = (value) => {
  if (!value) return null;
  try {
    return new mongoose.Types.ObjectId(value);
  } catch (error) {
    return null;
  }
};

const toStringId = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value instanceof mongoose.Types.ObjectId) {
    return value.toString();
  }
  if (typeof value.toString === 'function') {
    return value.toString();
  }
  return null;
};

const buildParticipantKey = (a, b) => [a, b].map((id) => id.toString()).sort().join(':');

const buildBlockMaps = async (currentUserId) => {
  const docs = await BlockedUser.find({
    $or: [
      { user: currentUserId },
      { blockedUser: currentUserId }
    ]
  }).lean();

  const blockedByCurrent = new Map();
  const blockedCurrent = new Map();

  docs.forEach((doc) => {
    const userStr = toStringId(doc.user);
    const blockedStr = toStringId(doc.blockedUser);

    if (userStr === currentUserId.toString()) {
      blockedByCurrent.set(blockedStr, doc.reason || null);
    }

    if (blockedStr === currentUserId.toString()) {
      blockedCurrent.set(userStr, doc.reason || null);
    }
  });

  return { blockedByCurrent, blockedCurrent };
};

const formatConversation = (conversation, currentUserId, meta = {}) => {
  if (!conversation) return null;

  const { blockedByCurrent = new Map(), blockedCurrent = new Map() } = meta;
  const currentIdStr = currentUserId.toString();

  const participants = (conversation.participants || []).map((participant) =>
    sanitizeUser(participant, { includeImageData: false })
  );

  const unreadCounts = {};
  if (conversation.unreadCounts instanceof Map) {
    conversation.unreadCounts.forEach((value, key) => {
      unreadCounts[key] = value;
    });
  } else if (conversation.unreadCounts && typeof conversation.unreadCounts === 'object') {
    Object.entries(conversation.unreadCounts).forEach(([key, value]) => {
      unreadCounts[key] = value;
    });
  }

  const otherParticipant = participants.find((participant) => participant.id && participant.id !== currentIdStr) || null;
  const otherId = otherParticipant?.id || null;

  return {
    id: conversation.id || conversation._id?.toString(),
    participantKey: conversation.participantKey,
    participants,
    otherParticipant,
    lastMessage: conversation.lastMessage
      ? {
          body: conversation.lastMessage.body,
          sender: conversation.lastMessage.sender?.toString?.() || conversation.lastMessage.sender,
          sentAt: conversation.lastMessage.sentAt
        }
      : null,
    unreadCount: unreadCounts[currentIdStr] || 0,
    isBlockedByCurrentUser: Boolean(otherId && blockedByCurrent.has(otherId)),
    isBlockingCurrentUser: Boolean(otherId && blockedCurrent.has(otherId)),
    blockReason: otherId ? blockedByCurrent.get(otherId) || null : null,
    updatedAt: conversation.updatedAt,
    createdAt: conversation.createdAt
  };
};

const formatMessage = (message, currentUserId) => {
  if (!message) return null;
  const id = message.id || message._id?.toString();
  const sender = message.sender?.toString?.() || message.sender;
  const recipient = message.recipient?.toString?.() || message.recipient;
  return {
    id,
    conversation: message.conversation?.toString?.() || message.conversation,
    body: message.body,
    sender,
    recipient,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    readAt: message.readAt || null,
    isOwn: sender === currentUserId.toString()
  };
};

const ensureConversation = async (currentUserId, targetUserId) => {
  const current = toObjectId(currentUserId);
  const target = toObjectId(targetUserId);

  if (!current || !target) {
    const error = new Error('Invalid user id');
    error.status = 400;
    throw error;
  }

  if (current.equals(target)) {
    const error = new Error('Cannot start a conversation with yourself.');
    error.status = 400;
    throw error;
  }

  const participantKey = buildParticipantKey(current, target);

  let conversation = await Conversation.findOne({ participantKey })
    .populate('participants');

  if (!conversation) {
    const targetUser = await User.findById(target).select('-password');
    if (!targetUser) {
      const error = new Error('Recipient not found.');
      error.status = 404;
      throw error;
    }

    conversation = await Conversation.create({
      participants: [current, target],
      participantKey,
      unreadCounts: {
        [current.toString()]: 0,
        [target.toString()]: 0
      }
    });

    conversation = await Conversation.findById(conversation._id).populate('participants');
  } else {
    const currentStr = current.toString();
    if (Array.isArray(conversation.deletedFor) && conversation.deletedFor.some((id) => id.toString() === currentStr)) {
      conversation.deletedFor = conversation.deletedFor.filter((id) => id.toString() !== currentStr);
      await conversation.save();
      conversation = await Conversation.findById(conversation._id).populate('participants');
    }
  }

  return conversation;
};

exports.listConversations = async (req, res, next) => {
  try {
    const currentUserId = req.currentUser?.id;
    if (!currentUserId) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    const [conversations, blockMeta] = await Promise.all([
      Conversation.find({
        participants: currentUserId,
        deletedFor: { $nin: [req.currentUser._id] }
      })
        .sort({ updatedAt: -1 })
        .populate('participants'),
      buildBlockMaps(req.currentUser._id)
    ]);

    const payload = conversations.map((conversation) =>
      formatConversation(conversation, currentUserId, blockMeta)
    );

    return res.json({ conversations: payload });
  } catch (error) {
    return next(error);
  }
};

exports.getConversationWithUser = async (req, res, next) => {
  try {
    const currentUserId = req.currentUser?.id;
    if (!currentUserId) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    const { userId } = req.params;
    const { before, limit } = req.query;
    const pageSize = Math.max(1, Math.min(Number.parseInt(limit, 10) || MAX_PAGE_SIZE, MAX_PAGE_SIZE));

    const [conversation, blockMeta] = await Promise.all([
      ensureConversation(currentUserId, userId),
      buildBlockMaps(req.currentUser._id)
    ]);

    const beforeDate = before ? new Date(before) : null;
    if (before && Number.isNaN(beforeDate.getTime())) {
      return res.status(400).json({ error: 'Invalid cursor provided.' });
    }

    const match = { conversation: conversation._id };
    if (beforeDate) {
      match.createdAt = { $lt: beforeDate };
    }

    const messages = await Message.find(match)
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .lean();

    const orderedMessages = messages.reverse();
    const hasMore = messages.length === pageSize;
    const nextCursor = hasMore && orderedMessages.length > 0
      ? orderedMessages[0].createdAt
      : null;

    return res.json({
      conversation: formatConversation(conversation, req.currentUser._id, blockMeta),
      messages: orderedMessages.map((message) => formatMessage(message, req.currentUser._id)),
      pagination: {
        hasMore,
        nextCursor
      }
    });
  } catch (error) {
    return next(error);
  }
};

exports.getMessagesForConversation = async (req, res, next) => {
  try {
    const currentUserId = req.currentUser?.id;
    if (!currentUserId) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    const { conversationId } = req.params;
    const { before, limit } = req.query;
    const pageSize = Math.max(1, Math.min(Number.parseInt(limit, 10) || MAX_PAGE_SIZE, MAX_PAGE_SIZE));

    const [conversation, blockMeta] = await Promise.all([
      Conversation.findOne({
        _id: conversationId,
        participants: currentUserId
      }).populate('participants'),
      buildBlockMaps(req.currentUser._id)
    ]);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    const beforeDate = before ? new Date(before) : null;
    if (before && Number.isNaN(beforeDate.getTime())) {
      return res.status(400).json({ error: 'Invalid cursor provided.' });
    }

    const match = { conversation: conversation._id };
    if (beforeDate) {
      match.createdAt = { $lt: beforeDate };
    }

    const messages = await Message.find(match)
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .lean();

    const orderedMessages = messages.reverse();
    const hasMore = messages.length === pageSize;
    const nextCursor = hasMore && orderedMessages.length > 0
      ? orderedMessages[0].createdAt
      : null;

    return res.json({
      conversation: formatConversation(conversation, req.currentUser._id, blockMeta),
      messages: orderedMessages.map((message) => formatMessage(message, req.currentUser._id)),
      pagination: {
        hasMore,
        nextCursor
      }
    });
  } catch (error) {
    return next(error);
  }
};

exports.sendMessageToUser = async (req, res, next) => {
  try {
    const currentUserId = req.currentUser?.id;
    if (!currentUserId) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    const { userId } = req.params;
    const body = (req.body?.body || '').toString().trim();

    if (!body) {
      return res.status(400).json({ error: 'Message body is required.' });
    }

    const conversation = await ensureConversation(currentUserId, userId);
    const participants = conversation.participants.map((participant) => participant._id?.toString?.() || participant.toString());
    const recipientId = participants.find((participant) => participant !== currentUserId.toString());

    if (!recipientId) {
      return res.status(404).json({ error: 'Recipient not found.' });
    }

    const [blockedBySender, blockedByRecipient] = await Promise.all([
      BlockedUser.findOne({ user: currentUserId, blockedUser: recipientId }),
      BlockedUser.findOne({ user: recipientId, blockedUser: currentUserId })
    ]);

    if (blockedBySender) {
      return res.status(403).json({ error: 'You have blocked this member. Unblock them to send a message.' });
    }

    if (blockedByRecipient) {
      return res.status(403).json({ error: 'This member is not accepting messages from you.' });
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: currentUserId,
      recipient: recipientId,
      body
    });

    conversation.lastMessage = {
      body: message.body,
      sender: toObjectId(currentUserId),
      sentAt: message.createdAt
    };

    const removalSet = new Set([currentUserId.toString(), recipientId.toString?.() || recipientId]);
    if (Array.isArray(conversation.deletedFor)) {
      conversation.deletedFor = conversation.deletedFor.filter((id) => !removalSet.has(id.toString()));
    }

    if (!conversation.unreadCounts) {
      conversation.unreadCounts = new Map();
    }

    const asMap = conversation.unreadCounts instanceof Map
      ? conversation.unreadCounts
      : new Map(Object.entries(conversation.unreadCounts || {}));

    asMap.set(currentUserId.toString(), 0);
    const previous = asMap.get(recipientId.toString()) || 0;
    asMap.set(recipientId.toString(), previous + 1);

    conversation.unreadCounts = asMap;
    conversation.updatedAt = message.createdAt;
    await conversation.save();

    const [populatedMessage, refreshedConversation, blockMeta] = await Promise.all([
      Message.findById(message._id).lean(),
      Conversation.findById(conversation._id).populate('participants'),
      buildBlockMaps(req.currentUser._id)
    ]);

    const recipient = refreshedConversation.participants.find((participant) => participant._id?.toString?.() === recipientId.toString());
    const sender = refreshedConversation.participants.find((participant) => participant._id?.toString?.() === currentUserId.toString()) || req.currentUser;

    await sendMessageNotificationEmail({
      recipient,
      sender,
      message: populatedMessage
    });

    return res.status(201).json({
      message: formatMessage(populatedMessage, req.currentUser._id),
      conversation: formatConversation(refreshedConversation, req.currentUser._id, blockMeta)
    });
  } catch (error) {
    return next(error);
  }
};

exports.markConversationRead = async (req, res, next) => {
  try {
    const currentUserId = req.currentUser?.id;
    if (!currentUserId) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: currentUserId
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    await Message.updateMany({
      conversation: conversation._id,
      recipient: currentUserId,
      readAt: { $exists: false }
    }, {
      $set: { readAt: new Date() }
    });

    if (!conversation.unreadCounts) {
      conversation.unreadCounts = new Map();
    }

    if (conversation.unreadCounts instanceof Map) {
      conversation.unreadCounts.set(currentUserId.toString(), 0);
    } else {
      conversation.unreadCounts[currentUserId.toString()] = 0;
    }

    await conversation.save();

    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
};

exports.deleteConversation = async (req, res, next) => {
  try {
    const currentUserId = req.currentUser?.id;
    if (!currentUserId) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: currentUserId
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    if (!Array.isArray(conversation.deletedFor)) {
      conversation.deletedFor = [];
    }

    const alreadyDeleted = conversation.deletedFor.some((id) => id.toString() === currentUserId.toString());
    if (!alreadyDeleted) {
      conversation.deletedFor.push(req.currentUser._id);
    }

    if (!conversation.unreadCounts) {
      conversation.unreadCounts = new Map();
    }

    if (conversation.unreadCounts instanceof Map) {
      conversation.unreadCounts.set(currentUserId.toString(), 0);
    } else {
      conversation.unreadCounts[currentUserId.toString()] = 0;
    }

    await Promise.all([
      conversation.save(),
      Message.updateMany({
        conversation: conversation._id,
        recipient: currentUserId,
        readAt: { $exists: false }
      }, {
        $set: { readAt: new Date() }
      })
    ]);

    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
};

exports.blockUser = async (req, res, next) => {
  try {
    const currentUserId = req.currentUser?.id;
    if (!currentUserId) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    const { userId } = req.params;
    const reason = (req.body?.reason || '').toString().trim() || null;

    if (userId === currentUserId) {
      return res.status(400).json({ error: 'You cannot block yourself.' });
    }

    const target = await User.findById(userId).select('id');
    if (!target) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    await BlockedUser.findOneAndUpdate(
      { user: currentUserId, blockedUser: userId },
      { $set: { reason } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const participantKey = buildParticipantKey(toObjectId(currentUserId), toObjectId(userId));
    const conversation = await Conversation.findOne({ participantKey });
    if (conversation) {
      await Promise.all([
        Message.updateMany({
          conversation: conversation._id,
          recipient: currentUserId,
          readAt: { $exists: false }
        }, {
          $set: { readAt: new Date() }
        }),
        Conversation.updateOne({ _id: conversation._id }, {
          $set: {
            [`unreadCounts.${currentUserId}`]: 0
          }
        })
      ]);
    }

    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
};

exports.unblockUser = async (req, res, next) => {
  try {
    const currentUserId = req.currentUser?.id;
    if (!currentUserId) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    const { userId } = req.params;

    await BlockedUser.findOneAndDelete({ user: currentUserId, blockedUser: userId });

    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
};
