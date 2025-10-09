const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const cookie = require('cookie');
const { getRedisClient } = require('../config/redis');
const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

const ACTIVE_SOCKETS = new Map();
const ONLINE_USERS = new Map();

const getLogger = () => console;

const authError = (message = 'Authentication failed') => {
  const error = new Error(message);
  error.data = { message };
  return error;
};

const extractToken = (socket) => {
  const { auth = {}, handshake = {} } = socket;

  if (auth.token) {
    return auth.token;
  }

  if (handshake.auth?.token) {
    return handshake.auth.token;
  }

  const header = handshake.headers?.authorization || '';
  if (header.toLowerCase().startsWith('bearer ')) {
    return header.slice(7);
  }

  const cookieHeader = handshake.headers?.cookie;
  if (cookieHeader) {
    try {
      const parsed = cookie.parse(cookieHeader);
      if (parsed?.jwt) {
        return parsed.jwt;
      }
    } catch (error) {
      getLogger().warn('[socket] Failed to parse cookies during auth:', error?.message || error);
    }
  }

  return null;
};

const buildUserContext = async (decodedPayload) => {
  if (!decodedPayload) {
    return null;
  }

  const { id, email } = decodedPayload;

  let user = null;
  if (id) {
    user = await User.findById(id).select('-password');
  } else if (email) {
    user = await User.findOne({ email }).select('-password');
  }

  return user;
};

async function socketAuthMiddleware(socket, next) {
  try {
    const token = extractToken(socket);

    if (!token) {
      return next(authError('Missing auth token'));
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return next(authError('Invalid token'));
    }

    const user = await buildUserContext(decoded);

    if (!user) {
      return next(authError('Account no longer exists'));
    }

    socket.user = {
      id: user.id,
      email: user.email,
      name: user.name
    };

    return next();
  } catch (error) {
    return next(authError(error?.message || 'Unable to authorise socket'));
  }
}

const buildRoomName = (userId) => `user:${userId}`;

const broadcastPresence = (userId, status, lastSeenAt) => {
  const io = socketState.io;
  if (!io || !userId) {
    return;
  }

  io.emit('presence:update', {
    userId,
    status,
    lastSeenAt: lastSeenAt ? new Date(lastSeenAt).toISOString() : null
  });
};

const markUserOnline = (userId) => {
  if (!userId) {
    return;
  }

  const normalizedId = userId.toString();
  const count = ONLINE_USERS.get(normalizedId) || 0;
  ONLINE_USERS.set(normalizedId, count + 1);

  const now = new Date();
  setImmediate(() => {
    User.findByIdAndUpdate(normalizedId, { lastSeenAt: now }).catch((error) => {
      getLogger().warn('[socket] Failed to update lastSeenAt on connect:', error?.message || error);
    });
  });

  if (count === 0) {
    broadcastPresence(normalizedId, 'online', now);
  }
};

const markUserOffline = (userId) => {
  if (!userId) {
    return;
  }

  const normalizedId = userId.toString();
  const count = ONLINE_USERS.get(normalizedId) || 0;

  if (count <= 1) {
    ONLINE_USERS.delete(normalizedId);
    const now = new Date();
    setImmediate(() => {
      User.findByIdAndUpdate(normalizedId, { lastSeenAt: now }).catch((error) => {
        getLogger().warn('[socket] Failed to update lastSeenAt on disconnect:', error?.message || error);
      });
    });
    broadcastPresence(normalizedId, 'offline', now);
  } else {
    ONLINE_USERS.set(normalizedId, count - 1);
  }
};

const isUserOnline = (userId) => {
  if (!userId) {
    return false;
  }
  return (ONLINE_USERS.get(userId.toString()) || 0) > 0;
};

const registerCoreHandlers = (io, socket) => {
  const logger = getLogger();
  const { user } = socket;

  if (!user?.id) {
    socket.disconnect(true);
    return;
  }

  const userRoom = buildRoomName(user.id);
  socket.join(userRoom);
  ACTIVE_SOCKETS.set(socket.id, user.id);

  markUserOnline(user.id);

  logger.info(`[socket] user ${user.id} connected (${socket.id})`);

  socket.on('disconnect', (reason) => {
    ACTIVE_SOCKETS.delete(socket.id);
    markUserOffline(user.id);
    logger.info(`[socket] user ${user.id} disconnected (${reason})`);
  });
};

function emitToUser(io, userId, event, payload) {
  if (!io || !userId) {
    return;
  }

  io.to(buildRoomName(userId)).emit(event, payload);
}

function broadcastConversationUpdate(conversation) {
  const io = socketState.io;
  if (!io || !conversation) {
    return;
  }

  const participantIds = (conversation.participants || [])
    .map((participant) => participant?.id || participant?.toString?.())
    .filter(Boolean);

  participantIds.forEach((participantId) => {
    emitToUser(io, participantId, 'conversation:update', conversation);
  });
}

function broadcastNewMessage(message, conversation) {
  const io = socketState.io;
  if (!io || !message || !conversation) {
    return;
  }

  const payload = {
    message,
    conversationId: conversation.id || conversation._id?.toString()
  };

  emitToUser(io, message.sender, 'message:new', payload);
  emitToUser(io, message.recipient, 'message:new', payload);
}

function broadcastMessagesRead(conversation, { messageIds = [], readerId, readAt } = {}) {
  const io = socketState.io;
  if (!io || !conversation || !Array.isArray(messageIds) || messageIds.length === 0) {
    return;
  }

  const conversationId = conversation.id || conversation._id?.toString();
  if (!conversationId) {
    return;
  }

  const participantIds = (conversation.participants || [])
    .map((participant) => participant?.id || participant?._id?.toString?.() || participant?.toString?.())
    .filter(Boolean);

  if (participantIds.length === 0) {
    return;
  }

  const payload = {
    conversationId,
    messageIds: messageIds.map((id) => id?.toString?.() || id).filter(Boolean),
    readerId: readerId ? readerId.toString() : null,
    readAt: readAt ? new Date(readAt).toISOString() : new Date().toISOString()
  };

  participantIds.forEach((participantId) => {
    emitToUser(io, participantId, 'message:read', payload);
  });
}

const socketState = {
  io: null,
  adapterClients: []
};

async function createSocketServer(httpServer) {
  if (!httpServer) {
    throw new Error('HTTP server instance is required for socket server');
  }

  if (socketState.io) {
    return socketState.io;
  }

  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => callback(null, origin || true),
      credentials: true
    }
  });

  io.use(socketAuthMiddleware);

  const redis = getRedisClient();
  if (redis) {
    try {
      const pubClient = redis.duplicate();
      const subClient = redis.duplicate();

      await Promise.all([pubClient.connect(), subClient.connect()]);

      io.adapter(createAdapter(pubClient, subClient));
      socketState.adapterClients = [pubClient, subClient];
    } catch (error) {
      getLogger().warn('[socket] Failed to attach Redis adapter, falling back to in-memory adapter:', error?.message || error);
    }
  }

  io.on('connection', (socket) => registerCoreHandlers(io, socket));

  socketState.io = io;

  return io;
}

function getSocketServer() {
  return socketState.io;
}

async function closeSocketServer() {
  const { io, adapterClients } = socketState;

  if (io) {
    await new Promise((resolve) => io.close(resolve));
    socketState.io = null;
  }

  if (Array.isArray(adapterClients)) {
    await Promise.all(adapterClients.map(async (client) => {
      if (!client) {
        return;
      }
      try {
        await client.quit();
      } catch (error) {
        getLogger().warn('[socket] Failed to close Redis adapter client:', error?.message || error);
      }
    }));
  }

  socketState.adapterClients = [];
}

module.exports = {
  createSocketServer,
  getSocketServer,
  closeSocketServer,
  broadcastNewMessage,
  broadcastConversationUpdate,
  broadcastMessagesRead,
  isUserOnline
};
