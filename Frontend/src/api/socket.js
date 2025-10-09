import { io } from 'socket.io-client';
import { API_BASE_URL, getApiAuthToken } from './client';

let socket = null;
let manualDisconnect = false;
const listeners = new Map();

const DEFAULT_OPTIONS = {
  autoConnect: false,
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000,
  timeout: 10000
};

const buildAuth = () => {
  const token = getApiAuthToken();
  return token ? { token } : {};
};

const emitSystemEvent = (event, payload) => {
  const callbacks = listeners.get(event) || new Set();
  callbacks.forEach((callback) => {
    try {
      callback(payload);
    } catch (error) {
      console.warn(`[socket] listener for ${event} failed`, error);
    }
  });
};

const setupSocket = () => {
  if (socket) {
    return socket;
  }

  socket = io(`${API_BASE_URL.replace(/\/$/, '')}`, {
    ...DEFAULT_OPTIONS,
    path: '/socket.io',
    auth: buildAuth()
  });

  socket.on('connect', () => {
    emitSystemEvent('connect');
  });

  socket.on('disconnect', (reason) => {
    emitSystemEvent('disconnect', reason);
    if (!manualDisconnect) {
      socket.auth = buildAuth();
    }
  });

  socket.on('connect_error', (error) => {
    emitSystemEvent('connect_error', error);
  });

  socket.on('reconnect_attempt', (attempt) => {
    emitSystemEvent('reconnect_attempt', attempt);
  });

  socket.on('reconnect', (attempt) => {
    emitSystemEvent('reconnect', attempt);
  });

  socket.on('reconnect_failed', () => {
    emitSystemEvent('reconnect_failed');
  });

  return socket;
};

export const connectSocket = () => {
  const client = setupSocket();
  manualDisconnect = false;
  client.auth = buildAuth();
  if (!client.connected) {
    client.connect();
  }
  return client;
};

export const disconnectSocket = () => {
  if (!socket) {
    return;
  }
  manualDisconnect = true;
  socket.disconnect();
};

export const getSocket = () => socket;

export const onSocketEvent = (event, callback) => {
  const client = setupSocket();
  client.on(event, callback);

  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }
  listeners.get(event).add(callback);

  return () => {
    client.off(event, callback);
    const callbacks = listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        listeners.delete(event);
      }
    }
  };
};

export const onceSocketEvent = (event, callback) => {
  const client = setupSocket();
  client.once(event, callback);
  return () => client.off(event, callback);
};

export const emitSocketEvent = (event, payload) => {
  const client = setupSocket();
  client.emit(event, payload);
};

export const getSocketStatus = () => {
  if (!socket) {
    return 'disconnected';
  }
  if (socket.connected) {
    return 'connected';
  }
  if (socket.connecting || socket.reconnecting) {
    return 'connecting';
  }
  return 'disconnected';
};

export const refreshSocketAuth = () => {
  if (!socket) {
    return;
  }
  socket.auth = buildAuth();
  if (socket.connected) {
    socket.emit('auth:refresh', socket.auth);
  }
};
